import { ref } from 'vue';
import dayjs from 'dayjs';
import { Peer, type DataConnection } from 'peerjs';

export interface IPeerLocationPayload {
    type: 'LOCATION_UPDATE';
    opId: string;
    codename?: string;
    avatar?: string;
    latitude: number;
    longitude: number;
    heading?: number;
    is_online: boolean;
    is_medic?: boolean;
    is_dead?: boolean;
}

export interface IPeerChatPayload {
    type: 'TACTICAL_CHAT';
    id: string;
    opId: string;
    codename: string;
    avatar?: string;
    text: string;
    timestamp: number;
    isCallout?: boolean;
    isSystem?: boolean;
}

interface IPeerHeartbeatPayload {
    type: 'PEER_HEARTBEAT';
    id: string;
    opId: string;
    timestamp: number;
}

interface IPeerHeartbeatAckPayload {
    type: 'PEER_HEARTBEAT_ACK';
    heartbeatId: string;
    opId: string;
    timestamp: number;
}

interface IPeerChatAckPayload {
    type: 'TACTICAL_CHAT_ACK';
    messageId: string;
    opId: string;
    timestamp: number;
}

export type TacticalPeerPayload =
    | IPeerLocationPayload
    | IPeerChatPayload
    | IPeerHeartbeatPayload
    | IPeerHeartbeatAckPayload
    | IPeerChatAckPayload;

export type PeerConnectionState =
    | 'connecting'
    | 'connected'
    | 'unstable'
    | 'reconnecting'
    | 'disconnected';

interface PendingChatMessage {
    message: IPeerChatPayload;
    createdAt: number;
    lastSentAt: number;
    attempts: number;
    ackedBy: Set<string>;   // peerIds que já confirmaram recebimento
    sentTo: Set<string>;    // peerIds para os quais foi enviado pelo menos 1 vez
}

// ─── Instância PeerJS & Conexões ──────────────────────────────────────────────
let peerInstance: Peer | null = null;
const connections = new Map<string, DataConnection>();
const pendingConnections = new Set<string>();
const peerCodenames = new Map<string, string>();
const connectionStates = new Map<string, PeerConnectionState>();

// ─── Callbacks externos ──────────────────────────────────────────────────────
let currentOpId: string | null = null;
let onPositionCallback: ((payload: IPeerLocationPayload) => void) | null = null;
let onChatCallback: ((payload: IPeerChatPayload) => void) | null = null;
let onPeerDisconnectedCallback: ((peerId: string, codename: string) => void) | null = null;
let onPeerReconnectedCallback: ((peerId: string, codename: string) => void) | null = null;
let onPeerStatusCallback: ((peerId: string, codename: string, state: PeerConnectionState) => void) | null = null;

// ─── Estado de rede ──────────────────────────────────────────────────────────
let lastBroadcastPayload: IPeerLocationPayload | null = null;
let isDisconnectingAll = false;

// ─── Constantes & Timers ──────────────────────────────────────────────────────
const HANDSHAKE_TIMEOUT_MS = 10000;
const HEARTBEAT_INTERVAL_MS = 5000;
const HEARTBEAT_TIMEOUT_MS = 8000;
const HEALTH_CHECK_INTERVAL_MS = 24000;
const CHAT_RETRY_INTERVAL_MS = 4000;
const RECENT_MSG_TTL_MS = 30000;
const RECENT_MSG_MAX = 50;

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_MS = 2000;

// ─── Gerenciamento de Timers por Peer ──────────────────────────────────────────
const heartbeatIntervals = new Map<string, ReturnType<typeof setInterval>>();
const healthIntervals = new Map<string, ReturnType<typeof setInterval>>();
const lastHeartbeatAckAt = new Map<string, number>();
const reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
const reconnectAttempts = new Map<string, number>();

// ─── Blacklist de peers offline ───────────────────────────────────────────────
const offlinePeers = new Set<string>();

// ─── Chat com ACK ────────────────────────────────────────────────────────────
const receivedChatIds = new Map<string, number>();
const recentChatMessages: IPeerChatPayload[] = [];
const pendingChatMessages = new Map<string, PendingChatMessage>();

export const activeConnectionCount = ref(0);

function now() { return dayjs().valueOf(); }

function getCodename(peerId: string): string {
    return peerCodenames.get(peerId) || peerId.replace('airsoft-op-', '');
}

function syncConnectionCount() {
    activeConnectionCount.value = connections.size;
}

const lastNotifiedCodenames = new Map<string, string>();

function notifyStatus(peerId: string, state: PeerConnectionState) {
    const currentState = connectionStates.get(peerId);
    const codename = getCodename(peerId);
    const lastCodename = lastNotifiedCodenames.get(peerId);

    // Evita disparar callbacks se nem o estado nem o codinome mudaram
    if (currentState === state && lastCodename === codename) return;

    connectionStates.set(peerId, state);
    lastNotifiedCodenames.set(peerId, codename);
    if (onPeerStatusCallback) {
        onPeerStatusCallback(peerId, codename, state);
    }
}

function announcePeerDisconnected(peerId: string) {
    if (isDisconnectingAll) return;
    notifyStatus(peerId, 'disconnected');
    if (onPeerDisconnectedCallback) {
        onPeerDisconnectedCallback(peerId, getCodename(peerId));
    }
}

function announcePeerReconnected(peerId: string) {
    if (isDisconnectingAll) return;
    notifyStatus(peerId, 'connected');
    if (onPeerReconnectedCallback) {
        onPeerReconnectedCallback(peerId, getCodename(peerId));
    }
}

function sendRaw(conn: DataConnection, payload: TacticalPeerPayload): boolean {
    if (!conn.open) return false;
    try {
        conn.send(payload);
        return true;
    } catch {
        return false;
    }
}

function pruneRecentMessages() {
    const t = now();
    while (recentChatMessages.length) {
        const oldest = recentChatMessages[0];
        if (!oldest || t - oldest.timestamp <= RECENT_MSG_TTL_MS) break;
        recentChatMessages.shift();
    }
    while (recentChatMessages.length > RECENT_MSG_MAX) recentChatMessages.shift();
}

function prunePendingMessages() {
    const t = now();
    pendingChatMessages.forEach((pending, id) => {
        if (t - pending.createdAt > RECENT_MSG_TTL_MS) {
            pendingChatMessages.delete(id);
            return;
        }
        const connectedPeers = Array.from(connections.keys()).filter(pid => connections.get(pid)?.open);
        if (connectedPeers.length > 0 && connectedPeers.every(pid => pending.ackedBy.has(pid))) {
            pendingChatMessages.delete(id);
        }
    });
}

function pruneReceivedIds() {
    const t = now();
    receivedChatIds.forEach((ts, id) => {
        if (t - ts > RECENT_MSG_TTL_MS) receivedChatIds.delete(id);
    });
}

function flushStateToConnection(conn: DataConnection) {
    if (!conn.open) return;
    if (lastBroadcastPayload) sendRaw(conn, lastBroadcastPayload);
    pruneRecentMessages();
    recentChatMessages.forEach(msg => sendRaw(conn, msg));
}

// ─── Timers & Limpezas por Peer ───────────────────────────────────────────────

function clearPeerTimers(peerId: string) {
    const hb = heartbeatIntervals.get(peerId);
    if (hb) { clearInterval(hb); heartbeatIntervals.delete(peerId); }

    const hl = healthIntervals.get(peerId);
    if (hl) { clearInterval(hl); healthIntervals.delete(peerId); }

    const rc = reconnectTimers.get(peerId);
    if (rc) { clearTimeout(rc); reconnectTimers.delete(peerId); }

    lastHeartbeatAckAt.delete(peerId);
}

// ─── Reconexão Automática Controlada ──────────────────────────────────────────

function scheduleReconnect(targetOpId: string) {
    const targetPeerId = `airsoft-op-${targetOpId}`;

    if (isDisconnectingAll || offlinePeers.has(targetPeerId) || !currentOpId) return;
    if (!peerInstance || peerInstance.destroyed) return;

    // Evita múltiplos reconnects simultâneos para o mesmo peer
    if (reconnectTimers.has(targetPeerId) || pendingConnections.has(targetPeerId)) return;

    const attempts = (reconnectAttempts.get(targetPeerId) || 0) + 1;
    if (attempts > MAX_RECONNECT_ATTEMPTS) {
        console.warn(`[WebRTC Tactical] Limite de reconexões atingido para ${targetPeerId}. Marca como desconectado.`);
        announcePeerDisconnected(targetPeerId);
        reconnectAttempts.delete(targetPeerId);
        return;
    }

    reconnectAttempts.set(targetPeerId, attempts);
    notifyStatus(targetPeerId, 'reconnecting');

    const delay = Math.min(RECONNECT_BASE_MS * Math.pow(1.5, attempts - 1), 10000);
    console.info(`[WebRTC Tactical] Agendando reconexão #${attempts} para ${targetPeerId} em ${delay}ms...`);

    const timer = setTimeout(() => {
        reconnectTimers.delete(targetPeerId);
        if (!isDisconnectingAll && !offlinePeers.has(targetPeerId)) {
            TacticalPeerService.connectToPeer(targetOpId);
        }
    }, delay);

    reconnectTimers.set(targetPeerId, timer);
}

// ─── Heartbeat & Health Check Monitor ──────────────────────────────────────────

function startHeartbeat(peerId: string, conn: DataConnection) {
    clearPeerTimers(peerId);
    lastHeartbeatAckAt.set(peerId, now());

    // 1. Loop de envio de Heartbeat a cada 5s
    const hbInterval = setInterval(() => {
        const activeConn = connections.get(peerId);
        if (!activeConn || activeConn !== conn || !activeConn.open) {
            clearPeerTimers(peerId);
            return;
        }

        const hbPayload: IPeerHeartbeatPayload = {
            type: 'PEER_HEARTBEAT',
            id: `hb-${currentOpId}-${now()}-${Math.random().toString(36).slice(2, 8)}`,
            opId: currentOpId || '',
            timestamp: now(),
        };
        sendRaw(conn, hbPayload);
    }, HEARTBEAT_INTERVAL_MS);

    heartbeatIntervals.set(peerId, hbInterval);

    // 2. Loop de verificação de saúde (Health Check)
    const hlInterval = setInterval(() => {
        const activeConn = connections.get(peerId);
        if (!activeConn || activeConn !== conn || !activeConn.open) return;

        const lastAck = lastHeartbeatAckAt.get(peerId) ?? now();
        const elapsedSinceAck = now() - lastAck;

        // Não considerar disconnected do ICE como offline imediatamente
        const iceState = conn.peerConnection?.connectionState;
        if (iceState === 'failed') {
            console.warn(`[WebRTC Tactical] Conexão ICE com ${peerId} falhou.`);
            conn.close();
            return;
        }

        // Se passar do HEARTBEAT_TIMEOUT_MS (8s) sem ACK, marca como unstable (sem disparar repetidamente)
        if (elapsedSinceAck > HEARTBEAT_TIMEOUT_MS) {
            if (connectionStates.get(peerId) !== 'unstable' && connectionStates.get(peerId) !== 'reconnecting') {
                console.warn(`[WebRTC Tactical] ${getCodename(peerId)} sem ACK por ${elapsedSinceAck}ms → marcado como unstable.`);
                notifyStatus(peerId, 'unstable');
            }
        }
    }, HEALTH_CHECK_INTERVAL_MS);

    healthIntervals.set(peerId, hlInterval);
}

// ─── Configuração da Conexão DataConnection ───────────────────────────────────

function setupConnection(conn: DataConnection) {
    if (isDisconnectingAll) {
        try { conn.close(); } catch {}
        return;
    }

    const peerKey = conn.peer;

    if (peerKey && offlinePeers.has(peerKey)) {
        console.info(`[WebRTC Tactical] Rejeitando conexão de ${peerKey} — peer marcado como offline.`);
        try { conn.close(); } catch {}
        return;
    }

    let hasBeenOpened = conn.open;

    if (peerKey) {
        connections.set(peerKey, conn);
        syncConnectionCount();
    }

    if (conn.open) {
        flushStateToConnection(conn);
        if (peerKey) startHeartbeat(peerKey, conn);
    }

    conn.on('open', () => {
        const wasConnectedBefore = hasBeenOpened || reconnectAttempts.has(peerKey || '');
        hasBeenOpened = true;

        if (peerKey) {
            connections.set(peerKey, conn);
            syncConnectionCount();
            startHeartbeat(peerKey, conn);

            // Reset correto das tentativas de reconexão
            reconnectAttempts.delete(peerKey);
            const rc = reconnectTimers.get(peerKey);
            if (rc) { clearTimeout(rc); reconnectTimers.delete(peerKey); }

            if (wasConnectedBefore) {
                announcePeerReconnected(peerKey);
            } else {
                notifyStatus(peerKey, 'connected');
            }

            // Ao reconectar, reenviar mensagens pendentes
            TacticalPeerService.retryPendingMessages();
        }
        flushStateToConnection(conn);
    });

    conn.on('data', (data) => {
        const payload = data as TacticalPeerPayload;
        if (!payload || !peerKey) return;

        if ('codename' in payload && payload.codename) {
            const prevCodename = peerCodenames.get(peerKey);
            peerCodenames.set(peerKey, payload.codename);
            if (prevCodename !== payload.codename) {
                const currentSt = connectionStates.get(peerKey);
                if (currentSt) {
                    notifyStatus(peerKey, currentSt);
                }
            }
        }

        switch (payload.type) {
            case 'PEER_HEARTBEAT': {
                const ack: IPeerHeartbeatAckPayload = {
                    type: 'PEER_HEARTBEAT_ACK',
                    heartbeatId: payload.id,
                    opId: currentOpId || '',
                    timestamp: now(),
                };
                sendRaw(conn, ack);
                break;
            }

            case 'PEER_HEARTBEAT_ACK': {
                lastHeartbeatAckAt.set(peerKey, now());
                // Se estava em estado unstable ou reconnecting, volta para connected suavemente
                const currentSt = connectionStates.get(peerKey);
                if (currentSt === 'unstable' || currentSt === 'reconnecting') {
                    notifyStatus(peerKey, 'connected');
                }
                break;
            }

            case 'TACTICAL_CHAT': {
                // Responder com ACK
                const ack: IPeerChatAckPayload = {
                    type: 'TACTICAL_CHAT_ACK',
                    messageId: payload.id,
                    opId: currentOpId || '',
                    timestamp: now(),
                };
                sendRaw(conn, ack);

                // Deduplicação de mensagens recebidas
                pruneReceivedIds();
                if (receivedChatIds.has(payload.id)) break;
                receivedChatIds.set(payload.id, now());

                if (onChatCallback) onChatCallback(payload);
                break;
            }

            case 'TACTICAL_CHAT_ACK': {
                const pending = pendingChatMessages.get(payload.messageId);
                if (pending) {
                    pending.ackedBy.add(peerKey);
                    prunePendingMessages();
                }
                break;
            }

            case 'LOCATION_UPDATE': {
                if (onPositionCallback) onPositionCallback(payload);
                break;
            }
        }
    });

    const handleDisconnect = () => {
        if (peerKey && connections.get(peerKey) === conn) {
            connections.delete(peerKey);
            clearPeerTimers(peerKey);
            syncConnectionCount();

            if (hasBeenOpened) {
                announcePeerDisconnected(peerKey);
            }
        }
    };

    conn.on('close', handleDisconnect);
    conn.on('error', handleDisconnect);
}

// ─── TacticalPeerService Export ───────────────────────────────────────────────

export const TacticalPeerService = {
    init(
        opId: string,
        onPositionReceived: (payload: IPeerLocationPayload) => void,
        onChatReceived?: (payload: IPeerChatPayload) => void,
        onPeerDisconnected?: (peerId: string, codename: string) => void,
        onPeerReconnected?: (peerId: string, codename: string) => void,
        onPeerStatus?: (peerId: string, codename: string, state: PeerConnectionState) => void
    ) {
        currentOpId = opId;
        onPositionCallback = onPositionReceived;
        onChatCallback = onChatReceived || null;
        onPeerDisconnectedCallback = onPeerDisconnected || null;
        onPeerReconnectedCallback = onPeerReconnected || null;
        onPeerStatusCallback = onPeerStatus || null;

        if (peerInstance && !peerInstance.destroyed) {
            console.info('[WebRTC Tactical] Peer já inicializado. Reaproveitando conexão com o broker...');
            return;
        }

        const peerId = `airsoft-op-${opId}`;

        peerInstance = new Peer(peerId, {
            host: import.meta.env.VITE_PEERJS_HOST,
            port: Number(import.meta.env.VITE_PEERJS_PORT),
            path: import.meta.env.VITE_PEERJS_PATH || '/peerjs',
            secure: import.meta.env.VITE_PEERJS_SECURE === 'true',
            debug: 1,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    {
                        urls: import.meta.env.VITE_TURN_URL_UDP,
                        username: import.meta.env.VITE_TURN_USER,
                        credential: import.meta.env.VITE_TURN_CREDENTIAL
                    },
                    {
                        urls: import.meta.env.VITE_TURN_URL_TLS,
                        username: import.meta.env.VITE_TURN_USER,
                        credential: import.meta.env.VITE_TURN_CREDENTIAL
                    }
                ]
            }
        });

        peerInstance.on('open', (id) => {
            console.info('[WebRTC Tactical] Conectado com Peer ID:', id);
        });

        peerInstance.on('connection', (conn) => {
            setupConnection(conn);
        });

        peerInstance.on('disconnected', () => {
            if (peerInstance && !peerInstance.destroyed) {
                console.warn('[WebRTC Tactical] Desconectado do broker, tentando reconectar...');
                try { peerInstance.reconnect(); } catch (err) {
                    console.warn('[WebRTC Tactical] Falha no reconnect:', err);
                }
            }
        });

        peerInstance.on('close', () => {
            console.warn('[WebRTC Tactical] Instância Peer encerrada.');
        });

        peerInstance.on('error', (err) => {
            if (err.type === 'peer-unavailable') {
                const match = err.message.match(/peer\s+(\S+)/i);
                const deadPeerId = match?.[1];
                if (deadPeerId) {
                    const deadOpId = deadPeerId.replace('airsoft-op-', '');
                    connections.delete(deadPeerId);
                    clearPeerTimers(deadPeerId);
                    pendingConnections.delete(deadPeerId);
                    syncConnectionCount();

                    // peer-unavailable também entra no retry se não for desconexão intencional
                    if (!offlinePeers.has(deadPeerId) && !isDisconnectingAll) {
                        scheduleReconnect(deadOpId);
                    }
                }
                return;
            }

            console.warn('[WebRTC Tactical] Peer error:', err.type, err.message);
            if (err.type === 'unavailable-id') {
                console.warn('[WebRTC Tactical] ID de Peer já em uso — provável outra aba ativa.');
            }
        });
    },

    /**
     * Remove um peer da lista de bloqueados (voltou online).
     * Chamado pelo Map.vue quando o Appwrite Realtime sinaliza is_online = true.
     */
    markOnline(targetOpId: string) {
        const targetPeerId = `airsoft-op-${targetOpId}`;
        offlinePeers.delete(targetPeerId);
    },

    /**
     * Marca um peer como offline e cancela tentativas de reconexão.
     * Chamado pelo Map.vue quando o Appwrite Realtime sinaliza is_online = false.
     */
    cancelReconnect(targetOpId: string) {
        const targetPeerId = `airsoft-op-${targetOpId}`;
        offlinePeers.add(targetPeerId);
        pendingConnections.delete(targetPeerId);

        const timer = reconnectTimers.get(targetPeerId);
        if (timer) {
            clearTimeout(timer);
            reconnectTimers.delete(targetPeerId);
        }
        reconnectAttempts.delete(targetPeerId);

        const conn = connections.get(targetPeerId);
        if (conn) {
            clearPeerTimers(targetPeerId);
            try { conn.close(); } catch {}
            connections.delete(targetPeerId);
            announcePeerDisconnected(targetPeerId);
            syncConnectionCount();
        }

        console.info(`[WebRTC Tactical] Reconexões canceladas para ${targetPeerId} (operador offline).`);
    },

    connectToPeer(targetOpId: string, codename?: string) {
        if (!peerInstance || !currentOpId || targetOpId === currentOpId) return;
        if (peerInstance.destroyed || peerInstance.disconnected) return;

        const targetPeerId = `airsoft-op-${targetOpId}`;

        if (codename) {
            peerCodenames.set(targetPeerId, codename);
        }

        // Se o operador estiver marcado como offline intencionalmente, ignora
        if (offlinePeers.has(targetPeerId)) return;

        const existing = connections.get(targetPeerId);
        if (existing && existing.open) return;
        if (pendingConnections.has(targetPeerId)) return;

        pendingConnections.add(targetPeerId);
        const clearPending = () => pendingConnections.delete(targetPeerId);

        const timeoutId = setTimeout(() => {
            console.warn(`[WebRTC Tactical] Handshake com ${targetPeerId} expirou.`);
            clearPending();
        }, HANDSHAKE_TIMEOUT_MS);

        try {
            const conn = peerInstance.connect(targetPeerId, { reliable: true });
            setupConnection(conn);
            conn.on('open', () => { clearTimeout(timeoutId); clearPending(); });
            conn.on('close', () => { clearTimeout(timeoutId); clearPending(); });
            conn.on('error', () => { clearTimeout(timeoutId); clearPending(); });
        } catch (err) {
            clearTimeout(timeoutId);
            clearPending();
            console.warn(`[WebRTC Tactical] Erro ao conectar ${targetPeerId}:`, err);
        }
    },

    isAlive(): boolean {
        return !!peerInstance && !peerInstance.destroyed;
    },

    broadcastPosition(payload: IPeerLocationPayload) {
        lastBroadcastPayload = payload;
        connections.forEach((conn) => { if (conn.open) sendRaw(conn, payload); });
    },

    sendChatMessage(msg: Omit<IPeerChatPayload, 'type'>): IPeerChatPayload {
        const fullPayload: IPeerChatPayload = { type: 'TACTICAL_CHAT', ...msg };

        // REMOVIDO o registro da própria mensagem em receivedChatIds
        // para que a deduplicação afete apenas mensagens recebidas de terceiros.

        recentChatMessages.push(fullPayload);
        pruneRecentMessages();

        const sentTo = new Set<string>();
        connections.forEach((conn, peerId) => {
            if (conn.open && sendRaw(conn, fullPayload)) {
                sentTo.add(peerId);
            }
        });

        if (sentTo.size > 0) {
            pendingChatMessages.set(fullPayload.id, {
                message: fullPayload,
                createdAt: now(),
                lastSentAt: now(),
                attempts: 1,
                ackedBy: new Set<string>(),
                sentTo,
            });
        }

        prunePendingMessages();
        return fullPayload;
    },

    /**
     * Retransmite mensagens de chat que ainda não receberam ACK de todos os peers.
     */
    retryPendingMessages() {
        prunePendingMessages();

        pendingChatMessages.forEach((pending) => {
            if (now() - pending.lastSentAt < CHAT_RETRY_INTERVAL_MS) return;

            let sentAny = false;
            connections.forEach((conn, peerId) => {
                if (!conn.open) return;
                if (pending.ackedBy.has(peerId)) return; // Já confirmou recebimento

                if (sendRaw(conn, pending.message)) {
                    pending.sentTo.add(peerId);
                    sentAny = true;
                }
            });

            if (sentAny) {
                pending.lastSentAt = now();
                pending.attempts++;
            }
        });
    },

    disconnectAllConnections() {
        isDisconnectingAll = true;

        connections.forEach((conn, peerId) => {
            clearPeerTimers(peerId);
            try { conn.close(); } catch {}
        });

        connections.clear();
        pendingConnections.clear();
        reconnectTimers.forEach(t => clearTimeout(t));
        reconnectTimers.clear();
        reconnectAttempts.clear();
        connectionStates.clear();
        lastBroadcastPayload = null;
        syncConnectionCount();

        setTimeout(() => { isDisconnectingAll = false; }, 500);
    },

    disconnect() {
        isDisconnectingAll = true;

        connections.forEach((conn, peerId) => {
            clearPeerTimers(peerId);
            try { conn.close(); } catch {}
        });

        connections.clear();
        pendingConnections.clear();
        peerCodenames.clear();
        offlinePeers.clear();
        recentChatMessages.length = 0;
        pendingChatMessages.clear();
        receivedChatIds.clear();

        reconnectTimers.forEach(t => clearTimeout(t));
        reconnectTimers.clear();
        reconnectAttempts.clear();
        connectionStates.clear();
        lastNotifiedCodenames.clear();

        // MANTÉM o PeerJS vivo no disconnect() para evitar bloqueios ao navegar entre telas
        currentOpId = null;
        lastBroadcastPayload = null;
        onPositionCallback = null;
        onChatCallback = null;
        onPeerDisconnectedCallback = null;
        onPeerReconnectedCallback = null;
        onPeerStatusCallback = null;

        syncConnectionCount();
        setTimeout(() => { isDisconnectingAll = false; }, 500);
    }
};