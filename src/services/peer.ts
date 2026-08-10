import { ref } from 'vue';
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
}

export type TacticalPeerPayload = IPeerLocationPayload | IPeerChatPayload;

let peerInstance: Peer | null = null;
const connections: Map<string, DataConnection> = new Map();
let onPositionCallback: ((payload: IPeerLocationPayload) => void) | null = null;
let onChatCallback: ((payload: IPeerChatPayload) => void) | null = null;
let currentOpId: string | null = null;
let lastBroadcastPayload: IPeerLocationPayload | null = null;

const recentChatMessages: IPeerChatPayload[] = [];
const RECENT_MSG_TTL_MS = 30000;
const RECENT_MSG_MAX = 15;

export const activeConnectionCount = ref(0);
const peerCodenames = new Map<string, string>();
let onPeerDisconnectedCallback: ((peerId: string, codename: string) => void) | null = null;
let isDisconnectingAll = false;

const staleIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
const pendingConnections: Set<string> = new Set();
const HANDSHAKE_TIMEOUT_MS = 10000;

function announcePeerDisconnected(peerId: string) {
    if (isDisconnectingAll) return;

    if (onPeerDisconnectedCallback) {
        const codename = peerCodenames.get(peerId) || 'Operador';
        onPeerDisconnectedCallback(peerId, codename);
    }
}

function syncConnectionCount() {
    activeConnectionCount.value = connections.size;
}

function pruneRecentMessages() {
    const now = Date.now();
    while (recentChatMessages.length) {
        const oldest = recentChatMessages[0];
        if (!oldest || now - oldest.timestamp <= RECENT_MSG_TTL_MS) break;
        recentChatMessages.shift();
    }
    while (recentChatMessages.length > RECENT_MSG_MAX) {
        recentChatMessages.shift();
    }
}

function flushStateToConnection(conn: DataConnection) {
    if (!conn.open) return;
    if (lastBroadcastPayload) {
        conn.send(lastBroadcastPayload);
    }
    pruneRecentMessages();
    recentChatMessages.forEach((msg) => {
        conn.send(msg);
    });
}

function setupConnection(conn: DataConnection) {
    let hasBeenOpened = conn.open;

    if (conn.peer) {
        connections.set(conn.peer, conn);
        syncConnectionCount();
    }

    if (conn.open) {
        flushStateToConnection(conn);
    }

    conn.on('open', () => {
        hasBeenOpened = true;
        if (conn.peer) {
            connections.set(conn.peer, conn);
            syncConnectionCount();
        }
        flushStateToConnection(conn);
    });

    conn.on('data', (data) => {
        const payload = data as TacticalPeerPayload;
        if (!payload) return;

        if (conn.peer && payload.codename) {
            peerCodenames.set(conn.peer, payload.codename);
        }

        if (payload.type === 'LOCATION_UPDATE' && onPositionCallback) {
            onPositionCallback(payload);
        } else if (payload.type === 'TACTICAL_CHAT' && onChatCallback) {
            onChatCallback(payload);
        }
    });

    conn.on('close', () => {
        if (conn.peer && connections.get(conn.peer) === conn) {
            connections.delete(conn.peer);
            if (hasBeenOpened) announcePeerDisconnected(conn.peer);
        }
        syncConnectionCount();
    });

    conn.on('error', () => {
        if (conn.peer && connections.get(conn.peer) === conn) {
            connections.delete(conn.peer);
            if (hasBeenOpened) announcePeerDisconnected(conn.peer);
        }
        syncConnectionCount();
    });

    const staleCheckInterval = setInterval(() => {
        if (!conn.open || conn.peerConnection?.connectionState === 'closed' || conn.peerConnection?.connectionState === 'failed' || conn.peerConnection?.connectionState === 'disconnected') {
            clearInterval(staleCheckInterval);
            if (conn.peer && connections.get(conn.peer) === conn) {
                connections.delete(conn.peer);
                if (hasBeenOpened) announcePeerDisconnected(conn.peer);
            }
            syncConnectionCount();
        }
    }, 5000); // Increased check to 10s to allow STUN/TURN negotiation

    if (conn.peer) {
        staleIntervals.set(conn.peer, staleCheckInterval);
    }
}

export const TacticalPeerService = {
    init(
        opId: string,
        onPositionReceived: (payload: IPeerLocationPayload) => void,
        onChatReceived?: (payload: IPeerChatPayload) => void,
        onPeerDisconnected?: (peerId: string, codename: string) => void
    ) {
        if (peerInstance && !peerInstance.destroyed) {
            console.info('[WebRTC Tactical] Peer já inicializado. Reaproveitando conexão com o broker...');
            currentOpId = opId;
            onPositionCallback = onPositionReceived;
            if (onChatReceived) onChatCallback = onChatReceived;
            if (onPeerDisconnected) onPeerDisconnectedCallback = onPeerDisconnected;
            return;
        }

        currentOpId = opId;
        onPositionCallback = onPositionReceived;
        if (onChatReceived) onChatCallback = onChatReceived;
        if (onPeerDisconnected) onPeerDisconnectedCallback = onPeerDisconnected;

        const peerId = `airsoft-op-${opId}`;
        // peerInstance = new Peer(peerId, {
        //     debug: 1
        // });

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
                console.warn('[WebRTC Tactical] Desconectado do broker de sinalização, tentando reconectar...');
                try {
                    peerInstance.reconnect();
                } catch (err) {
                    console.warn('[WebRTC Tactical] Falha ao tentar reconectar ao broker:', err);
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
                if (deadPeerId) connections.delete(deadPeerId);
                return;
            }

            console.warn('[WebRTC Tactical] Peer error:', err.type, err.message);

            if (err.type === 'unavailable-id') {
                console.warn('[WebRTC Tactical] ID de Peer já em uso — provável outra aba/sessão ativa para este operador.');
            }
        });
    },

    connectToPeer(targetOpId: string) {
        if (!peerInstance || !currentOpId || targetOpId === currentOpId) return;
        if (peerInstance.destroyed || peerInstance.disconnected) return;

        const targetPeerId = `airsoft-op-${targetOpId}`;
        const existing = connections.get(targetPeerId);
        if (existing && existing.open) return;
        if (pendingConnections.has(targetPeerId)) return;

        pendingConnections.add(targetPeerId);

        const clearPending = () => pendingConnections.delete(targetPeerId);

        const timeoutId = setTimeout(() => {
            console.warn(`[WebRTC Tactical] Handshake com ${targetPeerId} expirou, liberando para nova tentativa.`);
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
            console.warn(`[WebRTC Tactical] Erro ao conectar ao peer ${targetPeerId}:`, err);
        }
    },

    isAlive(): boolean {
        return !!peerInstance && !peerInstance.destroyed;
    },

    broadcastPosition(payload: IPeerLocationPayload) {
        lastBroadcastPayload = payload;
        connections.forEach((conn) => {
            if (conn.open) {
                conn.send(payload);
            }
        });
    },

    sendChatMessage(msg: Omit<IPeerChatPayload, 'type'>): IPeerChatPayload {
        const fullPayload: IPeerChatPayload = {
            type: 'TACTICAL_CHAT',
            ...msg
        };

        recentChatMessages.push(fullPayload);
        pruneRecentMessages();

        connections.forEach((conn) => {
            if (conn.open) {
                conn.send(fullPayload);
            }
        });
        return fullPayload;
    },

    disconnectAllConnections() {
        isDisconnectingAll = true;
        connections.forEach((conn) => {
            try {
                conn.close();
            } catch {
                // ignora
            }
        });
        staleIntervals.forEach((interval) => clearInterval(interval));
        staleIntervals.clear();
        connections.clear();
        lastBroadcastPayload = null;
        syncConnectionCount();
        setTimeout(() => {
            isDisconnectingAll = false;
        }, 500);
    },

    disconnect() {
        isDisconnectingAll = true;
        connections.forEach((conn) => conn.close());
        staleIntervals.forEach((interval) => clearInterval(interval));
        staleIntervals.clear();
        peerCodenames.clear();
        connections.clear();
        recentChatMessages.length = 0;
        
        // Mantemos a instância ativa no broker para que ao navegar pelas telas não tenhamos bloqueio de ID
        
        currentOpId = null;
        lastBroadcastPayload = null;
        onPositionCallback = null;
        onChatCallback = null;
        syncConnectionCount();
        setTimeout(() => {
            isDisconnectingAll = false;
        }, 500);
    }
};