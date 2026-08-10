<template>
    <div ref="mapWrapperRef" class="map-wrapper shadow-2 border-round" :class="{ 'hide-op-labels': !showOpLabels }">
        <div id="tactical-map" class="map-container border-round"></div>
        <div class="map-controls left flex flex-column gap-2">
            <Button icon="ri-zoom-in-line" severity="secondary" rounded :disabled="isMaxZoom" size="small"
                v-tooltip.top="'Aumentar Zoom'" aria-label="Aumentar Zoom" @click="zoomIn" />
            <Button icon="ri-zoom-out-line" severity="secondary" rounded :disabled="isMinZoom" size="small"
                v-tooltip.top="'Diminuir Zoom'" aria-label="Diminuir Zoom" @click="zoomOut" />
            <Button icon="ri-crosshair-2-line" severity="secondary" rounded size="small" :loading="isRefreshingLocation"
                v-tooltip.top="'Atualizar Posição GPS'" aria-label="Atualizar Posição GPS" @click="refreshLocation" />
            <Button icon="ri-compass-3-line" severity="secondary" rounded size="small"
                v-tooltip.top="'Centralizar Mapa'" aria-label="Centralizar Mapa" @click="recenterMap" />
            <Button :icon="isFullscreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'" severity="secondary" rounded
                size="small" v-tooltip.top="isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'" aria-label="Tela Cheia"
                @click="toggleFullscreen" />
        </div>
        <div class="map-controls right flex flex-column gap-2">
            <template v-if="!isGlobal">
                <Button :icon="showPolylines ? 'ri-shapes-fill' : 'ri-shapes-line'" severity="secondary" rounded
                    size="small" v-tooltip.top="showPolylines ? 'Ocultar Zonas' : 'Mostrar Zonas'" aria-label="Zonas"
                    @click="togglePolylines" />
                <Button :icon="showGrid ? 'ri-grid-fill' : 'ri-grid-line'" severity="secondary" rounded size="small"
                    v-tooltip.top="showGrid ? 'Ocultar Grade Tática' : 'Mostrar Grade Tática'" aria-label="Grade Tática"
                    @click="toggleGrid" />
                <Button v-if="isAdmin" :icon="isSimulating ? 'ri-walk-fill' : 'ri-walk-line'"
                    :severity="isSimulating ? 'warn' : 'secondary'" rounded size="small"
                    v-tooltip.top="isSimulating ? 'Parar Simulação GPS' : 'Simular Movimento GPS na Arena'"
                    aria-label="Simular GPS" @click="toggleSimulation" />
                <Button v-if="isAdmin" :icon="isDrawMode ? 'ri-pencil-fill' : 'ri-pencil-line'"
                    :severity="isDrawMode ? 'warning' : 'secondary'" rounded size="small"
                    v-tooltip.top="isDrawMode ? 'Desativar Modo Desenho' : 'Ativar Modo Desenho'"
                    aria-label="Modo Desenho" @click="isDrawMode = !isDrawMode" />
            </template>
            <Button v-if="isAdmin" :icon="isGlobal ? 'ri-earth-fill' : 'ri-earth-line'"
                :severity="isGlobal ? 'info' : 'secondary'" rounded size="small" :loading="isTogglingGlobal"
                v-tooltip.top="isGlobal ? 'Mapa Tático' : 'Mapa Global'" aria-label="Alternar Mapa"
                @click="toggleGlobalMap" />
            <template v-if="isTransmitting">
                <div class="relative">
                    <Button icon="ri-chat-4-line" severity="secondary" rounded size="small"
                        v-tooltip.top="'Chat Tático em Tempo Real'" aria-label="Chat Tático" @click="toggleChatDrawer"
                        :disabled="isDead" />
                    <span v-if="unreadChatCount > 0"
                        class="chat-unread-badge flex align-items-center justify-content-center border-circle bg-red-500 text-white font-bold text-xs shadow-2">
                        {{ unreadChatCount > 5 ? '5+' : unreadChatCount }}
                    </span>
                </div>
                <Button :icon="showOpLabels ? 'ri-user-location-fill' : 'ri-user-location-line'" severity="secondary"
                    rounded size="small"
                    v-tooltip.top="showOpLabels ? 'Ocultar Nomes dos Operadores' : 'Mostrar Nomes dos Operadores'"
                    aria-label="Nomes dos Operadores" @click="toggleOpLabels" />
                <Button :icon="isMedic ? 'ri-first-aid-kit-fill' : 'ri-first-aid-kit-line'"
                    :severity="isMedic ? 'danger' : 'secondary'" rounded size="small"
                    v-tooltip.top="isMedic ? 'Remover Sinal de Médico' : 'Solicitar Médico'" aria-label="Status Médico"
                    @click="toggleMedicStatus" />
                <Button :icon="isDead ? 'ri-skull-fill' : 'ri-skull-line'" :severity="isDead ? 'contrast' : 'secondary'"
                    rounded size="small"
                    v-tooltip.top="isDead ? 'Remover Status de Morto (KIA)' : 'Marcar como Morto (KIA)'"
                    aria-label="Status Morto" @click="toggleDeadStatus" />
            </template>
            <Button :icon="isTransmitting ? 'ri-radar-fill' : 'ri-radar-line'"
                :severity="isTransmitting ? 'success' : 'secondary'" rounded size="small" :loading="isStartingLocation"
                v-tooltip.top="isTransmitting ? 'Parar Transmissão' : 'Transmitir Localização'"
                :aria-label="isTransmitting ? 'Parar Transmissão' : 'Transmitir Localização'"
                @click="toggleLocationTransmission" />
        </div>

        <!-- Drawer de Chat Tático P2P -->
        <Drawer v-model:visible="showChatDrawer" position="right" class="tactical-chat-drawer">
            <template #header>
                <div class="flex align-items-center gap-2">
                    <i class="ri-radio-2-line text-yellow-600 text-xl"></i>
                    <div class="flex flex-column">
                        <span class="font-bold text-gray-900 text-base uppercase tracking-wide">{{ TEAM_NAME }}</span>
                        <span class="text-xs text-gray-500 font-medium">{{
                            totalConnectedOperators.toString().padStart(2, '0')
                            }} operadores na rede</span>
                    </div>
                </div>
            </template>

            <div class="flex flex-column h-full justify-content-between">
                <!-- Alertas Rápidos de 1 toque (Código Q & Alertas de Campo em Grid) -->
                <div class="callouts-section flex flex-column gap-2 pb-3 border-bottom-1 border-gray-100">
                    <span class="flex align-items-center gap-2">
                        <span class="text-sm uppercase font-bold">Código Q & Alertas Rápidos</span>
                        <span class="code-q" @click="openLink('radio-communication')">LINK</span>
                    </span>
                    <div class="tactical-quick-grid">
                        <Button v-for="(c, idx) in quickCallouts" :key="idx" :title="c.desc" v-tooltip.top="c.desc"
                            class="text-xxs font-bold p-1 border-round shadow-1 text-center" outlined
                            severity="secondary" @click="sendChatMessage(c.text, c.isCallout)" :label="c.label" />
                    </div>
                </div>

                <!-- Feed de Mensagens -->
                <div ref="chatContainerRef" class="chat-feed flex flex-column gap-2 overflow-y-auto flex-1 py-2 pr-1">
                    <div v-if="chatMessages.length === 0"
                        class="flex flex-column align-items-center justify-content-center h-full text-gray-400 gap-2">
                        <i class="ri-radar-line text-5xl text-yellow-500"></i>
                        <span class="text-xs text-center line-height-3 text-gray-500">Canal de rádio tático
                            pronto.<br>Envie um
                            alerta rápido ou mensagem para a equipe.</span>
                    </div>

                    <div v-for="msg in chatMessages" :key="msg.id">
                        <div v-if="msg.isSystem" class="flex justify-content-center">
                            <span class="text-xxs text-gray-400 font-medium uppercase tracking-wide">{{ msg.text
                            }}</span>
                        </div>
                        <div v-else class="chat-bubble-wrapper flex gap-2 align-items-start"
                            :class="{ 'justify-content-end': msg.isSelf }">

                            <img v-if="!msg.isSelf" :src="msg.avatar || '/images/default-avatar.png'"
                                class="w-2rem h-2rem border-circle border-1 border-amber-500 object-cover flex-shrink-0"
                                onerror="this.src='/favicon.ico'" />

                            <div class="chat-bubble flex flex-column gap-1 p-2 border-round max-w-18rem shadow-1"
                                :class="[
                                    msg.isCallout
                                        ? 'chat-bubble-callout'
                                        : (msg.isSelf ? 'chat-bubble-self' : 'chat-bubble-incoming')
                                ]">
                                <div class="flex justify-content-between align-items-center gap-3">
                                    <span class="text-xxs font-bold"
                                        :class="msg.isCallout ? 'text-red-900' : (msg.isSelf ? 'text-amber-900' : 'text-amber-700')">
                                        {{ msg.isSelf ? 'Você' : msg.codename }}
                                    </span>
                                    <span class="text-xxs opacity-50">
                                        {{ formatTime(msg.timestamp) }}
                                    </span>
                                </div>
                                <span class="text-xs font-medium line-height-2 word-break-break-word">{{ msg.text
                                }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Input de Mensagem -->
                <div class="chat-input-row pt-3 border-top-1 border-gray-100">
                    <InputGroup>
                        <InputText v-model="chatInputText" placeholder="Mensagem tática..." size="small"
                            class="tactical-chat-input" @keyup.enter="sendChatMessage()" />
                        <Button icon="ri-send-plane-2-line" size="small" :disabled="!chatInputText.trim()"
                            @click="sendChatMessage()" />
                    </InputGroup>
                </div>
            </div>
        </Drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import Button from 'primevue/button';
import Drawer from 'primevue/drawer';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import { useOperator } from '@/composables/useOperator';
import { useGps, getCurrentUserLocation } from '@/composables/useGps';
import { useSettingsStore } from '@/stores/settings';
import { OperatorService, type IOperator } from '@/services/operator';
import { SettingsService } from '@/services/settings';
import { TacticalPeerService, activeConnectionCount, type IPeerChatPayload } from '@/services/peer';
import L from 'leaflet';
import 'leaflet-rotate';
import { TEAM_NAME } from '@/constants/airsoft';
import { openLink } from '@/constants/navigation';

const { operator, isAdmin } = useOperator();
const settingsStore = useSettingsStore();
const gps = useGps();
const mapInstance = shallowRef<L.Map | null>(null);
const gridLayerGroup = shallowRef<L.LayerGroup | null>(null);
const polylinesLayerGroup = shallowRef<L.LayerGroup | null>(null);
const labelsLayerGroup = shallowRef<L.LayerGroup | null>(null);
const operatorsLayerGroup = shallowRef<L.LayerGroup | null>(null);
const operatorMarkers = new Map<string, L.Marker>();
const initialBounds = shallowRef<L.LatLngBounds | null>(null);
const initialZoom = ref<number | null>(null);
const mapWrapperRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);
const showGrid = ref(true);
const showOpLabels = ref(true);

const currentZoom = ref<number>(0);
const minZoom = ref<number>(0);
const maxZoom = ref<number>(100);

const updateZoomState = () => {
    if (!mapInstance.value) return;
    currentZoom.value = mapInstance.value.getZoom();
    minZoom.value = mapInstance.value.getMinZoom();
    maxZoom.value = mapInstance.value.getMaxZoom();
};

const isMaxZoom = computed(() => {
    if (!mapInstance.value) return false;
    return currentZoom.value >= maxZoom.value;
});

const isMinZoom = computed(() => {
    if (!mapInstance.value) return false;
    return currentZoom.value <= minZoom.value;
});
const showPolylines = ref(true);
const isDrawMode = ref(false);

const isTransmitting = ref(false);
const isStartingLocation = ref(false);
const isSimulating = ref(false);
const isMedic = ref(false);
const isDead = ref(false);
const lastKnownPos = ref<{ lat: number; lng: number; heading: number }>({ lat: 0, lng: 0, heading: 0 });
let simulationInterval: ReturnType<typeof setInterval> | null = null;
let watchId: number | null = null;

const globalTileLayer = shallowRef<L.TileLayer | null>(null);
const tacticalOverlayLayer = shallowRef<L.ImageOverlay | null>(null);
const arenaBounds = shallowRef<L.LatLngBounds | null>(null);

const isGlobal = computed(() => settingsStore.showGlobalMap);
const isTogglingGlobal = ref(false);

const applyMapMode = (isGlobalMode: boolean) => {
    const map = mapInstance.value;
    if (!map) return;

    if (isGlobalMode) {
        if (tacticalOverlayLayer.value && map.hasLayer(tacticalOverlayLayer.value)) {
            map.removeLayer(tacticalOverlayLayer.value);
        }
        if (gridLayerGroup.value && map.hasLayer(gridLayerGroup.value)) {
            map.removeLayer(gridLayerGroup.value);
        }
        if (polylinesLayerGroup.value && map.hasLayer(polylinesLayerGroup.value)) {
            map.removeLayer(polylinesLayerGroup.value);
        }
        if (labelsLayerGroup.value && map.hasLayer(labelsLayerGroup.value)) {
            map.removeLayer(labelsLayerGroup.value);
        }

        if (globalTileLayer.value && !map.hasLayer(globalTileLayer.value)) {
            globalTileLayer.value.addTo(map);
        }

        map.setBearing(0);
        map.setMaxBounds(undefined);
        map.setMinZoom(16);
        map.setMaxZoom(19);

        if (lastKnownPos.value.lat && lastKnownPos.value.lng) {
            map.setView([lastKnownPos.value.lat, lastKnownPos.value.lng], 17, { animate: true });
        } else if (arenaBounds.value) {
            map.setView(arenaBounds.value.getCenter(), 16, { animate: true });
        }

        getCurrentUserLocation({
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        }).then((pos) => {
            const lat = Number(pos.lat.toFixed(6));
            const lng = Number(pos.lng.toFixed(6));
            lastKnownPos.value = { ...lastKnownPos.value, lat, lng };
            if (mapInstance.value && isGlobal.value) {
                mapInstance.value.setView([lat, lng], 17, { animate: true });
            }
        }).catch((err) => {
            console.warn('Não foi possível obter a localização GPS para o Modo Global:', err);
        });
    } else {
        if (globalTileLayer.value && map.hasLayer(globalTileLayer.value)) {
            map.removeLayer(globalTileLayer.value);
        }
        if (tacticalOverlayLayer.value && !map.hasLayer(tacticalOverlayLayer.value)) {
            tacticalOverlayLayer.value.addTo(map);
        }

        if (showGrid.value && gridLayerGroup.value && !map.hasLayer(gridLayerGroup.value)) {
            gridLayerGroup.value.addTo(map);
        }
        if (showPolylines.value && polylinesLayerGroup.value && !map.hasLayer(polylinesLayerGroup.value)) {
            polylinesLayerGroup.value.addTo(map);
        }
        if (showPolylines.value && labelsLayerGroup.value && !map.hasLayer(labelsLayerGroup.value)) {
            labelsLayerGroup.value.addTo(map);
        }

        map.setBearing(Math.abs(-128));
        if (arenaBounds.value) {
            const minZoomLevel = 19;
            const targetZoom = initialZoom.value || 20;
            map.setMinZoom(minZoomLevel);
            map.setMaxZoom(23);
            map.setView(arenaBounds.value.getCenter(), targetZoom, { animate: true });
            map.setMaxBounds(arenaBounds.value.pad(0.5));
        }
    }
    updateZoomState();
};

watch(() => settingsStore.showGlobalMap, (newVal) => {
    applyMapMode(newVal);
});

const toggleGlobalMap = async () => {
    if (isTogglingGlobal.value) return;
    isTogglingGlobal.value = true;
    try {
        const newStatus = !settingsStore.showGlobalMap;
        const docId = settingsStore.config?.$id;

        if (settingsStore.config) {
            settingsStore.config.global_map = newStatus;
        }

        applyMapMode(newStatus);

        await SettingsService.upsert(docId, {
            global_map: newStatus
        });

        await settingsStore.refresh();
    } catch (error) {
        console.error('Erro ao alternar o Modo Mapa Global:', error);
    } finally {
        isTogglingGlobal.value = false;
    }
};

const broadcastCurrentState = () => {
    if (!operator.value?.$id) return;

    const currentLat = lastKnownPos.value.lat;
    const currentLng = lastKnownPos.value.lng;
    const currentHeading = lastKnownPos.value.heading;

    updateOperatorMarker({
        $id: operator.value.$id,
        codename: operator.value.codename || 'Operador',
        avatar: operator.value.avatar,
        latitude: currentLat,
        longitude: currentLng,
        heading: currentHeading,
        is_online: isTransmitting.value || isSimulating.value,
        is_medic: isMedic.value,
        is_dead: isDead.value
    });

    TacticalPeerService.broadcastPosition({
        type: 'LOCATION_UPDATE',
        opId: operator.value.$id,
        codename: operator.value.codename || 'Operador',
        avatar: operator.value.avatar,
        latitude: currentLat,
        longitude: currentLng,
        heading: currentHeading,
        is_online: isTransmitting.value || isSimulating.value,
        is_medic: isMedic.value,
        is_dead: isDead.value
    });
};

const toggleMedicStatus = () => {
    isMedic.value = !isMedic.value;
    if (isMedic.value && isDead.value) {
        isDead.value = false;
    }
    broadcastCurrentState();
};

const toggleDeadStatus = () => {
    isDead.value = !isDead.value;
    if (isDead.value && isMedic.value) {
        isMedic.value = false;
    }
    broadcastCurrentState();
};

interface IChatMessage {
    id: string;
    opId: string;
    codename: string;
    avatar?: string;
    text: string;
    timestamp: number;
    isCallout?: boolean;
    isSelf?: boolean;
    severity?: string;
    isSystem?: boolean;
}

const showChatDrawer = ref(false);
const chatMessages = ref<IChatMessage[]>([]);
const chatInputText = ref('');
const unreadChatCount = ref(0);
const chatContainerRef = ref<HTMLElement | null>(null);

watch(showChatDrawer, (isOpen) => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
});

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let meshInterval: ReturnType<typeof setInterval> | null = null;
let unsubscribeOnlineChanges: (() => void) | null = null;
let peerWatchdogInterval: ReturnType<typeof setInterval> | null = null;

const activePeerCount = computed(() => activeConnectionCount.value);

const totalConnectedOperators = computed(() => {
    return activePeerCount.value + 1;
});

const quickCallouts: Array<{ label: string; text: string; desc: string; isCallout: boolean; severity?: string }> = [
    { label: 'QAP', text: '📻 QAP - Na escuta / Pronto para receber mensagens.', desc: 'Na escuta / Pronto para receber mensagens.', isCallout: false },
    { label: 'QRV', text: '⚡ QRV - À disposição / Pronto para cumprir a missão.', desc: 'À disposição / Pronto para cumprir a missão.', isCallout: false },
    { label: 'QSL', text: '👍 QSL - Entendido / Mensagem recebida e compreendida.', desc: 'Entendido / Mensagem recebida e compreendida.', isCallout: false, severity: 'success' },
    { label: 'QRA', text: '🪪 QRA - Solicitando codinome do operador.', desc: 'Solicitar codinome do operador.', isCallout: false },
    { label: 'QRX', text: '⏳ QRX - Aguarde um instante na linha / Aguarde instruções.', desc: 'Aguarde um instante na linha.', isCallout: false },
    { label: 'QTH', text: '📍 QTH - Solicitando localização atual no mapa / campo.', desc: 'Solicitar localização atual.', isCallout: false, severity: 'info' },
    { label: 'QTR', text: '🕒 QTR - Solicitando horário exato.', desc: 'Solicitar horário exato.', isCallout: false },
    { label: 'QSJ', text: '📦 QSJ - Munição / BBS / Recursos de jogo.', desc: 'Recursos / Munição / BBS.', isCallout: false },
    { label: 'TKS', text: '🤝 TKS - Obrigado! Câmbio e desligo.', desc: 'Obrigado / Thanks.', isCallout: false },
    { label: 'FOE', text: '🪖 FOE - Inimigo avistado no campo!', desc: 'Inimigo avistado no campo!', isCallout: true, severity: 'warn' },
    { label: 'MED', text: '🩺 MED - Solicito atendimento médico / KI!', desc: 'Solicitar médico no local.', isCallout: true, severity: 'danger' },
    { label: 'ADV', text: '🏃 ADV - Avançando para o objetivo / base!', desc: 'Avançando para o objetivo.', isCallout: false, severity: 'info' },
    { label: 'DEF', text: '🛡️ DEF - Defendendo posição tática!', desc: 'Defendendo posição atual.', isCallout: false },
    { label: 'CLR', text: '🟢 CLR - Posição limpa / área segura!', desc: 'Área limpa e segura.', isCallout: false, severity: 'success' },
    { label: 'SUP', text: '🔥 SUP - Solicitando fogo de supressão / cobertura!', desc: 'Solicitar fogo de supressão.', isCallout: false, severity: 'warn' },
    { label: 'REG', text: '🔄 REG - Regressando / Retornando para a base!', desc: 'Regressando para a base.', isCallout: false }
];

const formatTime = (ts: number) => {
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
};

const connectToAllPeers = async () => {
    if (!isTransmitting.value && !isSimulating.value) return;

    try {
        const ops = await OperatorService.listOnline();
        ops.forEach((op) => {
            if (op.$id !== operator.value?.$id) {
                TacticalPeerService.connectToPeer(op.$id);
            }
        });
    } catch (err) {
        console.warn('Erro ao conectar à malha P2P da equipe:', err);
    }
};

const toggleChatDrawer = () => {
    showChatDrawer.value = !showChatDrawer.value;
    if (showChatDrawer.value) {
        unreadChatCount.value = 0;
        connectToAllPeers();
        scrollToBottom();
    }
};

const scrollToBottom = () => {
    requestAnimationFrame(() => {
        if (chatContainerRef.value) {
            chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
        }
    });
};

const receiveChatMessage = (msg: IPeerChatPayload) => {
    if (chatMessages.value.some((m) => m.id === msg.id)) return;

    chatMessages.value.push({
        ...msg,
        isSelf: msg.opId === operator.value?.$id
    });

    if (!showChatDrawer.value) {
        unreadChatCount.value++;
    } else {
        scrollToBottom();
    }
};

const handlePeerDisconnected = (peerId: string, codename: string) => {
    // Remove operator marker when disconnected
    const opId = peerId.replace('airsoft-op-', '');
    updateOperatorMarker({ $id: opId, is_online: false });

    // Add system message
    chatMessages.value.push({
        id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        opId: 'system',
        codename: 'Sistema',
        text: `${codename} se desconectou da rede.`,
        timestamp: Date.now(),
        isSystem: true
    });

    if (!showChatDrawer.value) {
        unreadChatCount.value++;
    } else {
        scrollToBottom();
    }
};

const sendChatMessage = (textToSend?: string, isCallout = false) => {
    const text = (textToSend || chatInputText.value).trim();
    if (!text || !operator.value?.$id) return;

    connectToAllPeers();

    const newMsg: IChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        opId: operator.value.$id,
        codename: operator.value.codename || 'Operador',
        avatar: operator.value.avatar,
        text: text,
        timestamp: Date.now(),
        isCallout: isCallout,
        isSelf: true
    };

    chatMessages.value.push(newMsg);

    TacticalPeerService.sendChatMessage({
        id: newMsg.id,
        opId: newMsg.opId,
        codename: newMsg.codename,
        avatar: newMsg.avatar,
        text: newMsg.text,
        timestamp: newMsg.timestamp,
        isCallout: isCallout
    });

    if (!textToSend) {
        chatInputText.value = '';
    }

    scrollToBottom();
};

const updateOperatorMarker = (op: Partial<IOperator> & { $id: string; is_medic?: boolean; is_dead?: boolean }) => {
    if (!operatorsLayerGroup.value) return;

    const opId = op.$id;
    const isCurrentOp = opId === operator.value?.$id;
    const isOnline = op.is_online;
    const lat = op.latitude !== undefined && op.latitude !== null ? Number(op.latitude) : NaN;
    const lng = op.longitude !== undefined && op.longitude !== null ? Number(op.longitude) : NaN;
    const codename = op.codename || 'Operador';
    const avatarUrl = op.avatar || '/images/default-avatar.png';
    const isMedicOp = !!op.is_medic;
    const isDeadOp = !!op.is_dead;

    // Só exibe qualquer operador se a transmissão de localização ou simulação estiver ativa
    if (!isTransmitting.value && !isSimulating.value) {
        const existingMarker = operatorMarkers.get(opId);
        if (existingMarker) {
            operatorsLayerGroup.value.removeLayer(existingMarker);
            operatorMarkers.delete(opId);
        }
        return;
    }

    if (!isOnline || isNaN(lat) || isNaN(lng)) {
        const existingMarker = operatorMarkers.get(opId);
        if (existingMarker) {
            operatorsLayerGroup.value.removeLayer(existingMarker);
            operatorMarkers.delete(opId);
        }
        return;
    }

    let classBadge = '';

    if (isMedicOp || isDeadOp) {
        if (isMedicOp) {
            classBadge = "medic"
        }
        if (isDeadOp) {
            classBadge = "dead"
        }
    }

    const iconHtml = `
        <div class="tactical-op-marker">
        <div class="op-pulse ${classBadge}"></div>
        <div class="op-avatar-circle ${classBadge}"> 
            <img src="${avatarUrl}" alt="${codename}" class="op-avatar-img" onerror="this.src='/favicon.ico'" />
        </div>
            <div class="op-label">${codename}</div>
        </div>
    `;

    const customIcon = L.divIcon({
        html: iconHtml,
        className: 'tactical-op-container',
        iconSize: [40, 52],
        iconAnchor: [20, 16]
    });

    const existingMarker = operatorMarkers.get(opId);
    const isDraggable = isCurrentOp;

    if (existingMarker) {
        existingMarker.setLatLng([lat, lng]);
        existingMarker.setIcon(customIcon);
        existingMarker.setZIndexOffset(2000);
        if (isCurrentOp && existingMarker.dragging) {
            existingMarker.dragging.enable();
        }
    } else {
        const newMarker = L.marker([lat, lng], {
            icon: customIcon,
            zIndexOffset: 2000,
            draggable: isDraggable
        });

        if (isCurrentOp) {
            newMarker.on('dragend', () => {
                const pos = newMarker.getLatLng();
                const draggedLat = Number(pos.lat.toFixed(6));
                const draggedLng = Number(pos.lng.toFixed(6));
                lastKnownPos.value = { ...lastKnownPos.value, lat: draggedLat, lng: draggedLng };
                broadcastCurrentState();
            });
        }

        newMarker.bindPopup(`<b>${codename}</b><br>Lat: ${lat}<br>Lng: ${lng}`);
        newMarker.addTo(operatorsLayerGroup.value);
        operatorMarkers.set(opId, newMarker);
    }
};

const isRefreshingLocation = ref(false);

const refreshLocation = async () => {
    if (!gps.isSupported.value) {
        alert('Geolocalização não é suportada neste navegador.');
        return;
    }

    isRefreshingLocation.value = true;
    try {
        const pos = await getCurrentUserLocation({
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 15000
        });

        const lat = Number(pos.lat.toFixed(6));
        const lng = Number(pos.lng.toFixed(6));
        const heading = 0;

        lastKnownPos.value = { lat, lng, heading };

        if (mapInstance.value) {
            mapInstance.value.setView([lat, lng], 17, { animate: true });
        }

        if (isTransmitting.value || isSimulating.value) {
            broadcastCurrentState();
        }
    } catch (err: any) {
        console.error('Erro ao atualizar posição GPS:', err);
        alert(err.message || 'Não foi possível atualizar o sinal GPS.');
    } finally {
        isRefreshingLocation.value = false;
    }
};

const startLocationTransmission = () => {
    if (!gps.isSupported.value) {
        alert('Geolocalização não é suportada neste navegador.');
        return;
    }

    if (isTransmitting.value) return;

    isStartingLocation.value = true;

    if (operator.value?.$id) {
        OperatorService.setOnlineStatus(operator.value.$id, true);
    }

    connectToAllPeers();

    const id = gps.startWatching(
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 },
        (pos) => {
            isStartingLocation.value = false;
            isTransmitting.value = true;

            const lat = Number(pos.lat.toFixed(6));
            const lng = Number(pos.lng.toFixed(6));
            const heading = 0;

            lastKnownPos.value = { lat, lng, heading };
            broadcastCurrentState();
        }
    );
    watchId = id;
};

const stopLocationTransmission = async () => {
    gps.stopWatching();
    watchId = null;
    isTransmitting.value = false;
    if (operator.value?.$id) {
        await OperatorService.setOnlineStatus(operator.value.$id, false);

        TacticalPeerService.broadcastPosition({
            type: 'LOCATION_UPDATE',
            opId: operator.value.$id,
            latitude: 0,
            longitude: 0,
            is_online: false,
            is_medic: false,
            is_dead: false
        });
        updateOperatorMarker({ $id: operator.value.$id, is_online: false });

        operatorMarkers.forEach((marker, opId) => {
            if (opId !== operator.value?.$id) {
                operatorsLayerGroup.value?.removeLayer(marker);
                operatorMarkers.delete(opId);
            }
        });

        if (!isSimulating.value) {
            TacticalPeerService.disconnectAllConnections();
        }
    }
};

const toggleLocationTransmission = async () => {
    if (!operator.value?.$id) {
        alert('É necessário estar logado como operador para transmitir localização.');
        return;
    }

    if (isTransmitting.value) {
        await stopLocationTransmission();
    } else {
        startLocationTransmission();
    }
};

const toggleSimulation = () => {
    if (isSimulating.value) {
        if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
        }
        isSimulating.value = false;
        if (operator.value?.$id) {
            if (!isTransmitting.value) {
                OperatorService.setOnlineStatus(operator.value.$id, false);
            }
            updateOperatorMarker({
                $id: operator.value.$id,
                is_online: false
            });
        }
        return;
    }

    if (!operator.value?.$id) {
        alert('É necessário estar logado como operador para simular.');
        return;
    }

    if (isTransmitting.value && watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        isTransmitting.value = false;
    }

    OperatorService.setOnlineStatus(operator.value.$id, true);
    connectToAllPeers();

    isSimulating.value = true;
    let angle = 0;
    const baseLat = -12.890538;
    const baseLng = -38.319240;
    const radiusLat = 0.00018;
    const radiusLng = 0.00022;

    const sendFakePos = () => {
        angle += 0.4;
        const fakeLat = Number((baseLat + Math.sin(angle) * radiusLat).toFixed(6));
        const fakeLng = Number((baseLng + Math.cos(angle) * radiusLng).toFixed(6));
        const fakeHeading = Math.round((((angle * 180 / Math.PI) % 360) + 360) % 360);

        lastKnownPos.value = { lat: fakeLat, lng: fakeLng, heading: fakeHeading };
        broadcastCurrentState();
    };

    sendFakePos();
    simulationInterval = setInterval(sendFakePos, 3000);
};

const togglePolylines = () => {
    if (!mapInstance.value || !polylinesLayerGroup.value) return;
    showPolylines.value = !showPolylines.value;
    if (showPolylines.value) {
        polylinesLayerGroup.value.addTo(mapInstance.value);
        if (labelsLayerGroup.value) {
            labelsLayerGroup.value.addTo(mapInstance.value);
        }
    } else {
        mapInstance.value.removeLayer(polylinesLayerGroup.value);
        if (labelsLayerGroup.value) {
            mapInstance.value.removeLayer(labelsLayerGroup.value);
        }
    }
};

const toggleOpLabels = () => {
    showOpLabels.value = !showOpLabels.value;
    if (mapInstance.value) {
        mapInstance.value.invalidateSize();
    }
};

const toggleGrid = () => {
    if (!mapInstance.value || !gridLayerGroup.value) return;
    showGrid.value = !showGrid.value;
    if (showGrid.value) {
        gridLayerGroup.value.addTo(mapInstance.value);
    } else {
        mapInstance.value.removeLayer(gridLayerGroup.value);
    }
};

const zoomIn = () => {
    if (mapInstance.value && !isMaxZoom.value) {
        mapInstance.value.zoomIn();
    }
};

const zoomOut = () => {
    if (mapInstance.value && !isMinZoom.value) {
        mapInstance.value.zoomOut();
    }
};

const recenterMap = () => {
    if (!mapInstance.value) return;
    mapInstance.value.invalidateSize();

    if (settingsStore.showGlobalMap && lastKnownPos.value.lat && lastKnownPos.value.lng) {
        mapInstance.value.setView([lastKnownPos.value.lat, lastKnownPos.value.lng], 17, { animate: true });
    } else if (initialBounds.value) {
        if (initialZoom.value) {
            mapInstance.value.setView(initialBounds.value.getCenter(), initialZoom.value, { animate: true });
        } else {
            mapInstance.value.fitBounds(initialBounds.value, { animate: true });
        }
    }
    updateZoomState();
};

const toggleFullscreen = () => {
    if (!mapWrapperRef.value) return;
    if (!document.fullscreenElement) {
        if (mapWrapperRef.value.requestFullscreen) {
            mapWrapperRef.value.requestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement;
    setTimeout(() => {
        if (mapInstance.value) {
            mapInstance.value.invalidateSize();
        }
    }, 100);
};

function rotateImage(src: string, degrees: number): Promise<{ url: string; width: number; height: number; origWidth: number; origHeight: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Contexto 2D do Canvas indisponível'));
                return;
            }

            const rad = (degrees * Math.PI) / 180;
            const sin = Math.abs(Math.sin(rad));
            const cos = Math.abs(Math.cos(rad));

            const newWidth = Math.round(img.width * cos + img.height * sin);
            const newHeight = Math.round(img.width * sin + img.height * cos);

            canvas.width = newWidth;
            canvas.height = newHeight;

            ctx.translate(newWidth / 2, newHeight / 2);
            ctx.rotate(rad);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);

            resolve({
                url: canvas.toDataURL('image/png'),
                width: newWidth,
                height: newHeight,
                origWidth: img.width,
                origHeight: img.height
            });
        };
        img.onerror = (err) => reject(err);
    });
}

onMounted(async () => {
    const imageUrl = '/images/map.webp';
    const ANGLE_DEGREES = -128;

    const rotatedImage = await rotateImage(imageUrl, ANGLE_DEGREES);

    const centerLat = -12.8905382;
    const centerLng = -38.3192403;
    const altitude = 94.5;

    const rad = (ANGLE_DEGREES * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));

    const ORIGINAL_WIDTH_METERS = altitude > 0 ? altitude * 1.45 : 130;
    const ORIGINAL_HEIGHT_METERS = ORIGINAL_WIDTH_METERS * (rotatedImage.origHeight / rotatedImage.origWidth);

    const BOUNDING_WIDTH_METERS = ORIGINAL_WIDTH_METERS * cos + ORIGINAL_HEIGHT_METERS * sin;
    const BOUNDING_HEIGHT_METERS = ORIGINAL_WIDTH_METERS * sin + ORIGINAL_HEIGHT_METERS * cos;

    const metersPerLat = 111320;
    const metersPerLng = 111320 * Math.cos((centerLat * Math.PI) / 180);

    const halfLatOffset = (BOUNDING_HEIGHT_METERS / 2) / metersPerLat;
    const halfLngOffset = (BOUNDING_WIDTH_METERS / 2) / metersPerLng;

    const bounds = L.latLngBounds(
        [centerLat - halfLatOffset, centerLng - halfLngOffset],
        [centerLat + halfLatOffset, centerLng + halfLngOffset]
    );

    const CROP_ZOOM = 20;
    const isGlobalMap = isGlobal.value;

    const map = L.map('tactical-map', {
        center: bounds.getCenter(),
        zoom: isGlobalMap ? 16 : CROP_ZOOM,
        zoomControl: false,
        attributionControl: true,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        maxBoundsViscosity: 1.0,
        rotate: !isGlobalMap,
        rotateControl: false,
        bearing: isGlobalMap ? 0 : Math.abs(ANGLE_DEGREES)
    });

    arenaBounds.value = bounds;

    const tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '&copy; Esri'
    });
    globalTileLayer.value = tileLayer;

    const overlayLayer = L.imageOverlay(rotatedImage.url, bounds, {
        opacity: 1,
        interactive: false,
    });
    tacticalOverlayLayer.value = overlayLayer;

    if (isGlobalMap) {
        tileLayer.addTo(map);
    } else {
        overlayLayer.addTo(map);
    }

    // Grade tática nativa do mapa (linhas em coordenadas reais a cada 20 metros)
    const STEP_METERS = 10;
    const stepLat = STEP_METERS / metersPerLat;
    const stepLng = STEP_METERS / metersPerLng;

    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const west = bounds.getWest();
    const east = bounds.getEast();

    const gridGroup = L.layerGroup();

    // Linhas verticais (Longitudinais)
    for (let lng = west; lng <= east + stepLng / 10; lng += stepLng) {
        L.polyline([
            [south, lng],
            [north, lng]
        ], {
            color: '#ffffff',
            weight: 0.1,
            opacity: 0.75,
            interactive: false
        }).addTo(gridGroup);
    }

    // Linhas horizontais (Latitudinais)
    for (let lat = south; lat <= north + stepLat / 10; lat += stepLat) {
        L.polyline([
            [lat, west],
            [lat, east]
        ], {
            color: '#ffffff',
            weight: 0.1,
            opacity: 0.75,
            interactive: false
        }).addTo(gridGroup);
    }

    gridLayerGroup.value = gridGroup;
    if (!isGlobalMap) {
        gridGroup.addTo(map);
    }

    let isRestoring = false;

    requestAnimationFrame(() => {
        map.invalidateSize();

        if (!isGlobalMap) {
            const minZoomLevel = 19;
            const targetZoom = 20;

            initialBounds.value = bounds;
            initialZoom.value = targetZoom;

            map.setMinZoom(minZoomLevel);
            map.setMaxZoom(23);
            map.setView(bounds.getCenter(), targetZoom);
            map.setMaxBounds(bounds.pad(0.5));

            map.on('zoomend zoomlevelschange', () => {
                updateZoomState();
            });

            map.on('drag', () => {
                if (isRestoring) return;
                const padded = bounds.pad(0.5);
                if (!padded.contains(map.getBounds())) {
                    isRestoring = true;
                    map.panInsideBounds(padded, { animate: false });
                    isRestoring = false;
                }
            });
        } else {
            map.setMinZoom(16);
            map.setMaxZoom(19);
            initialBounds.value = bounds;
            initialZoom.value = 16;
            map.setView(bounds.getCenter(), 16);
            updateZoomState();

            map.on('zoomend zoomlevelschange', () => {
                updateZoomState();
            });
        }
    });

    // Camada das Áreas e Polilinhas Táticas
    const shapesGroup = L.layerGroup();

    const labelsGroup = L.layerGroup();
    labelsLayerGroup.value = labelsGroup;

    const existingAreaCoords: [number, number][] = [
        [-12.890371, -38.318997], [-12.890435, -38.319082], [-12.890513, -38.319019], [-12.890571, -38.319096], [-12.890341, -38.319297], [-12.890334, -38.319287], [-12.890367, -38.319]
    ];

    const existingAreaPolygon = L.polygon(existingAreaCoords, {
        color: 'var(--p-orange-500)',
        fillColor: 'var(--p-orange-500)',
        fillOpacity: 0.3,
        weight: 0.6,
        interactive: false
    }).addTo(shapesGroup);

    existingAreaPolygon.bindTooltip('<div class="tactical-rotated-box zone-orange">CQB</div>', {
        permanent: true,
        direction: 'center',
        className: 'tactical-zone-tooltip-bare'
    });

    const pumpRoomAreaCoords: [number, number][] = [[-12.890371, -38.318997], [-12.89045, -38.318931], [-12.890513, -38.319019], [-12.890435, -38.319082]];

    const pumpRoomAreaPolygon = L.polygon(pumpRoomAreaCoords, {
        color: 'var(--p-amber-500)',
        fillColor: 'var(--p-amber-500)',
        fillOpacity: 0.3,
        weight: 0.6,
        interactive: false
    }).addTo(shapesGroup);

    pumpRoomAreaPolygon.bindTooltip('<div class="tactical-rotated-box zone-amber">PUMP ROOM</div>', {
        permanent: true,
        direction: 'center',
        className: 'tactical-zone-tooltip-bare'
    });

    const safezoneAreaCoords: [number, number][] = [[-12.890434, -38.319419], [-12.890372, -38.319338], [-12.89028, -38.31941], [-12.890362, -38.319479]];

    const safezoneAreaPolygon = L.polygon(safezoneAreaCoords, {
        color: 'var(--p-fuchsia-500)',
        fillColor: 'var(--p-fuchsia-500)',
        fillOpacity: 0.3,
        weight: 0.6,
        interactive: false
    }).addTo(shapesGroup);

    safezoneAreaPolygon.bindTooltip('<div class="tactical-rotated-box zone-fuchsia">SAFEZONE</div>', {
        permanent: true,
        direction: 'center',
        className: 'tactical-zone-tooltip-bare'
    });

    const warehouseAreaCoords: [number, number][] = [[-12.890869, -38.318994], [-12.890985, -38.319142], [-12.890927, -38.319214], [-12.890799, -38.319046]];

    const warehouseAreaPolygon = L.polygon(warehouseAreaCoords, {
        color: 'var(--p-pink-500)',
        fillColor: 'var(--p-pink-500)',
        fillOpacity: 0.3,
        weight: 0.6,
        interactive: false
    }).addTo(shapesGroup);

    warehouseAreaPolygon.bindTooltip('<div class="tactical-rotated-box zone-pink">WAREHOUSE</div>', {
        permanent: true,
        direction: 'center',
        className: 'tactical-zone-tooltip-bare'
    });

    const hotAreaCoords: [number, number][] = [[-12.890341, -38.319297], [-12.890372, -38.319338], [-12.890434, -38.319419], [-12.890517, -38.319532], [-12.890757, -38.319336], [-12.890571, -38.319096]];

    const hotAreaPolygon = L.polygon(hotAreaCoords, {
        color: 'var(--p-red-500)',
        fillColor: 'var(--p-red-500)',
        fillOpacity: 0.3,
        weight: 0.6,
        interactive: false
    }).addTo(shapesGroup);

    hotAreaPolygon.bindTooltip('<div class="tactical-rotated-box zone-red">HOT ZONE</div>', {
        permanent: true,
        direction: 'center',
        className: 'tactical-zone-tooltip-bare'
    });

    const atlanticForestAreaCoords: [number, number][] = [[-12.89028, -38.31941], [-12.890102, -38.319257], [-12.890042, -38.3192], [-12.890375, -38.318927], [-12.890644, -38.31871], [-12.890869, -38.318994], [-12.890799, -38.319046], [-12.890927, -38.319214], [-12.890547, -38.319647], [-12.890362, -38.319479], [-12.890434, -38.319419], [-12.890517, -38.319532], [-12.890757, -38.319336], [-12.890571, -38.319096], [-12.890513, -38.319019], [-12.89045, -38.318931], [-12.890367, -38.319], [-12.890334, -38.319287], [-12.890372, -38.319338]];

    L.polygon(atlanticForestAreaCoords, {
        color: 'var(--p-emerald-600)',
        fillColor: 'var(--p-emerald-600)',
        fillOpacity: 0.3,
        weight: 0.6,
        interactive: false
    }).addTo(shapesGroup);

    L.tooltip({
        permanent: true,
        direction: 'center',
        className: 'tactical-zone-tooltip-bare'
    })
        .setContent('<div class="tactical-rotated-box zone-emerald">ATLANTIC FOREST</div>')
        .setLatLng([-12.890241, -38.319189])
        .addTo(shapesGroup);

    const openAreaCoords: [number, number][] = [[-12.890901, -38.319211], [-12.890595, -38.318819], [-12.890518, -38.318882], [-12.890832, -38.319288]];

    const openAreaPolygon = L.polygon(openAreaCoords, {
        color: 'var(--p-cyan-500)',
        fillColor: 'var(--p-cyan-500)',
        fillOpacity: 0.3,
        weight: 0.6,
        interactive: false
    }).addTo(shapesGroup);

    openAreaPolygon.bindTooltip('<div class="tactical-rotated-box zone-cyan">OPEN AREA</div>', {
        permanent: true,
        direction: 'center',
        className: 'tactical-zone-tooltip-bare'
    });

    // 🚩 BASE A & BASE B (Coordenadas dinâmicas do SettingsStore)
    L.tooltip({
        permanent: true,
        direction: 'center',
        className: 'tactical-zone-tooltip-bare'
    })
        .setContent('<div class="tactical-rotated-box base base-a">A</div>')
        .setLatLng(settingsStore.blueBaseCoords)
        .addTo(shapesGroup);

    L.tooltip({
        permanent: true,
        direction: 'center',
        className: 'tactical-zone-tooltip-bare'
    })
        .setContent('<div class="tactical-rotated-box base base-b">B</div>')
        .setLatLng(settingsStore.yellowBaseCoords)
        .addTo(shapesGroup);

    if (!isGlobalMap && showPolylines.value && labelsGroup) {
        labelsGroup.addTo(map);
    }

    // ⚠️ LINHA BIFÁSICA DE ALERTA (DUAS CORES: PRETO E AMARELO - TIPO FITA ZEBRADA DE SEGURANÇA)
    const safetyPane = map.createPane('safetyLinePane', map.getPane('overlayPane'));
    if (safetyPane) {
        // safetyPane.style.zIndex = '620';
    }

    const alertLineCoords: [number, number][] = [[-12.890645, -38.318709], [-12.890985, -38.319142], [-12.890927, -38.319214], [-12.890547, -38.319647], [-12.890362, -38.319479], [-12.89028, -38.31941], [-12.890042, -38.3192], [-12.890645, -38.318709]];

    // 🛑 ZONA PROIBIDA (MÁSCARA E RÓTULOS NA ÁREA EXTERNA ÀS LINHAS DE ALERTA)
    const outerRing: [number, number][] = [
        [centerLat - 0.1, centerLng - 0.1],
        [centerLat - 0.1, centerLng + 0.1],
        [centerLat + 0.1, centerLng + 0.1],
        [centerLat + 0.1, centerLng - 0.1]
    ];

    L.polygon([outerRing, alertLineCoords], {
        fillOpacity: 0,
        interactive: false
    }).addTo(shapesGroup);

    // Rótulos "ZONA PROIBIDA" centralizados nos 4 lados da tela (Topo, Baixo, Esquerda, Direita)
    const forbiddenLabelsCoords: [number, number][] = [
        [-12.890876, -38.31954],
        [-12.890247, -38.318803],
        [-12.890965, -38.318802],
        [-12.890158, -38.31954]
    ];

    forbiddenLabelsCoords.forEach((coord) => {
        L.tooltip({
            permanent: true,
            direction: 'center',
            className: 'tactical-zone-tooltip-bare'
        })
            .setContent('<div class="zone-forbidden">ZONA PROIBIDA</div>')
            .setLatLng(coord)
            .addTo(shapesGroup);
    });

    // 1. Linha de fundo contínua (Cor de fundo: Surface 950)
    L.polyline(alertLineCoords, {
        pane: 'safetyLinePane',
        color: 'var(--p-surface-950)',
        weight: 6,
        opacity: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        interactive: false
    }).addTo(shapesGroup);

    // 2. Linha superior tracejada (Cor de topo: Yellow 500)
    L.polyline(alertLineCoords, {
        pane: 'safetyLinePane',
        color: 'var(--p-yellow-500)',
        weight: 6,
        dashArray: '15, 15',
        opacity: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        interactive: false
    }).addTo(shapesGroup);

    polylinesLayerGroup.value = shapesGroup;
    if (!isGlobalMap) {
        shapesGroup.addTo(map);
    }

    // --- MODO INTERATIVO: CLIQUE ESQUERDO PARA ADICIONAR | ARRASTAR PARA AJUSTE FINO | CLIQUE DIREITO PARA DESFAZER ---
    const drawnPoints: [number, number][] = [];
    const pointMarkers: L.Marker[] = [];
    let livePolyline: L.Polyline | null = null;
    let livePolygon: L.Polygon | null = null;

    const redrawDrawingPreview = () => {
        if (livePolyline) { map.removeLayer(livePolyline); livePolyline = null; }
        if (livePolygon) { map.removeLayer(livePolygon); livePolygon = null; }

        if (drawnPoints.length >= 3) {
            livePolygon = L.polygon(drawnPoints, {
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '4, 4'
            }).addTo(map);
        } else if (drawnPoints.length === 2) {
            livePolyline = L.polyline(drawnPoints, {
                color: '#ef4444',
                weight: 2
            }).addTo(map);
        }

        console.log(`📋 COORDENADAS ATUAIS (${drawnPoints.length} pontos):\n` + JSON.stringify(drawnPoints));
    };

    const dotIcon = L.divIcon({
        html: `<div class="w-3 h-3 bg-red-500 border-2 border-white border-circle shadow-3 cursor-grab"></div>`,
        className: 'bg-transparent border-none pointer-events-auto',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    const addInteractivePoint = (lat: number, lng: number) => {
        const newPoint: [number, number] = [lat, lng];
        drawnPoints.push(newPoint);

        const marker = L.marker([lat, lng], {
            icon: dotIcon,
            draggable: true
        }).addTo(map);

        // Arrastar ponto para Ajuste Fino ao vivo!
        marker.on('drag', (_dEv: L.LeafletEvent) => {
            const idx = pointMarkers.indexOf(marker);
            if (idx !== -1) {
                const latLng = marker.getLatLng();
                const updatedLat = Number(latLng.lat.toFixed(6));
                const updatedLng = Number(latLng.lng.toFixed(6));
                drawnPoints[idx] = [updatedLat, updatedLng];
                redrawDrawingPreview();
            }
        });

        marker.on('dragend', () => {
            console.log('🎯 Ponto ajustado! Coordenadas atualizadas:\n' + JSON.stringify(drawnPoints));
        });

        // Botão direito em cima de um ponto específico exclui ele
        marker.on('contextmenu', (mEv: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(mEv);
            const idx = pointMarkers.indexOf(marker);
            if (idx !== -1) {
                map.removeLayer(marker);
                pointMarkers.splice(idx, 1);
                drawnPoints.splice(idx, 1);
                redrawDrawingPreview();
                console.log(`🗑️ Ponto #${idx + 1} removido!`);
            }
        });

        pointMarkers.push(marker);
        redrawDrawingPreview();
    };

    map.on('click', (e: L.LeafletMouseEvent) => {
        if (!isAdmin.value) return;
        if (isDrawMode.value || drawnPoints.length > 0) {
            const lat = Number(e.latlng.lat.toFixed(6));
            const lng = Number(e.latlng.lng.toFixed(6));
            addInteractivePoint(lat, lng);
        }
    });

    // Botão direito no mapa desfaz o último ponto inserido
    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
        if (!isAdmin.value) return;
        if (isDrawMode.value || drawnPoints.length > 0) {
            L.DomEvent.preventDefault(e.originalEvent);
            if (drawnPoints.length > 0) {
                const lastMarker = pointMarkers.pop();
                if (lastMarker) map.removeLayer(lastMarker);
                drawnPoints.pop();
                redrawDrawingPreview();
                console.log('↩️ Último ponto desfeito!');
            }
        }
    });

    // 💡 PARA EDITAR UMA ÁREA EXISTENTE:
    // Carrega os pontos da área (ex: hotAreaCoords) para criar os marcadores editáveis no mapa
    if (isDrawMode.value) {
        safezoneAreaCoords.forEach(([lat, lng]) => addInteractivePoint(lat, lng));
    }

    mapInstance.value = map;
    updateZoomState();

    const opsGroup = L.layerGroup();
    opsGroup.addTo(map);
    operatorsLayerGroup.value = opsGroup;

    // Se showGlobalMap for true, obtém a localização atual do usuário para centralizar o mapa
    if (isGlobalMap && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const userLat = Number(pos.coords.latitude.toFixed(6));
                const userLng = Number(pos.coords.longitude.toFixed(6));
                const heading = pos.coords.heading || 0;

                lastKnownPos.value = { lat: userLat, lng: userLng, heading };
                map.setView([userLat, userLng], 17);

                // Só adiciona/atualiza o marcador se a transmissão ou simulação já estiver ativa
                if (operator.value?.$id && (isTransmitting.value || isSimulating.value)) {
                    updateOperatorMarker({
                        $id: operator.value.$id,
                        codename: operator.value.codename || 'Operador',
                        avatar: operator.value.avatar,
                        latitude: userLat,
                        longitude: userLng,
                        heading: heading,
                        is_online: true
                    });
                }
            },
            (err) => {
                console.warn('Erro ao obter localização atual do usuário:', err);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );
    }

    // Inicializa WebRTC P2P Tactical Peer Service
    if (operator.value?.$id) {
        TacticalPeerService.init(
            operator.value.$id,
            (payload) => {
                updateOperatorMarker({
                    $id: payload.opId,
                    codename: payload.codename,
                    avatar: payload.avatar,
                    latitude: payload.latitude,
                    longitude: payload.longitude,
                    heading: payload.heading,
                    is_online: payload.is_online,
                    is_medic: payload.is_medic,
                    is_dead: payload.is_dead
                });
            },
            (chatPayload) => {
                receiveChatMessage(chatPayload);
            },
            handlePeerDisconnected
        );

        peerWatchdogInterval = setInterval(() => {
            if (!operator.value?.$id) return;
            if (!(isTransmitting.value || isSimulating.value)) return;

            if (!TacticalPeerService.isAlive()) {
                console.warn('[Tactical] Peer morreu inesperadamente, reinicializando...');
                TacticalPeerService.init(
                    operator.value.$id,
                    (payload) => {
                        updateOperatorMarker({
                            $id: payload.opId,
                            codename: payload.codename,
                            avatar: payload.avatar,
                            latitude: payload.latitude,
                            longitude: payload.longitude,
                            heading: payload.heading,
                            is_online: payload.is_online,
                            is_medic: payload.is_medic,
                            is_dead: payload.is_dead
                        });
                    },
                    (chatPayload) => {
                        receiveChatMessage(chatPayload);
                    },
                    handlePeerDisconnected
                );
                connectToAllPeers();
            }
        }, 15000);
    }

    // Descoberta inicial + polling de malha P2P
    connectToAllPeers();
    meshInterval = setInterval(connectToAllPeers, 8000);

    // Heartbeat: mantém last_seen atualizado enquanto transmitindo/simulando
    heartbeatInterval = setInterval(() => {
        if (operator.value?.$id && (isTransmitting.value || isSimulating.value)) {
            OperatorService.heartbeat(operator.value.$id);
        }
    }, 20000);

    // Realtime: reage a operadores entrando/saindo online sem esperar o polling
    unsubscribeOnlineChanges = OperatorService.subscribeOnlineChanges((payload, event) => {
        if (!operator.value?.$id || payload.$id === operator.value.$id) return;

        if (event.endsWith('.update') && payload.is_online) {
            TacticalPeerService.connectToPeer(payload.$id);
        }
    });

    document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);

    if (meshInterval) {
        clearInterval(meshInterval);
        meshInterval = null;
    }
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    if (unsubscribeOnlineChanges) {
        unsubscribeOnlineChanges();
        unsubscribeOnlineChanges = null;
    }

    if (operator.value?.$id && (isTransmitting.value || isSimulating.value)) {
        OperatorService.setOnlineStatus(operator.value.$id, false);
    }

    TacticalPeerService.disconnect();
    if (peerWatchdogInterval) {
        clearInterval(peerWatchdogInterval);
        peerWatchdogInterval = null;
    }
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }
    if (mapInstance.value) {
        mapInstance.value.remove();
    }
});
</script>

<style scoped>
.map-wrapper {
    position: relative;
    z-index: 1;
    /* Cria um contexto de empilhamento baixo para que os botões (1000) não sobreponham menus do sistema */
    width: 100%;
    height: 400px;
    aspect-ratio: 3/2;
    margin: 0 auto;
    overflow: hidden;
}

.map-wrapper:fullscreen {
    z-index: 9999 !important;
    /* Na tela cheia, passa por cima de tudo */
    width: 100vw !important;
    height: 100vh !important;
    max-width: none !important;
    max-height: none !important;
    border-radius: 0 !important;
}

.map-wrapper:fullscreen .map-container {
    height: 100vh !important;
    border-radius: 0 !important;
}

.map-container {
    width: 100%;
    height: 400px;
    background-color: var(--p-surface-950);
    z-index: 0;
}

.map-controls {
    position: absolute;
    z-index: 1000;

    &.right {
        top: 1rem;
        right: 1rem;
    }

    &.left {
        top: 1rem;
        left: 1rem;
    }
}

:deep(.tactical-zone-tooltip-bare) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
}

:deep(.tactical-rotated-box) {
    display: inline-block;
    background-color: color-mix(in srgb, var(--p-surface-950, #0d0d0d) 80%, transparent);
    border: 1px solid transparent;
    font-weight: bold;
    font-size: 0.5rem;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    transform: rotate(0deg);
    transform-origin: center center;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
}

:deep(.tactical-rotated-box.zone-orange) {
    border-color: var(--p-orange-500);
    color: var(--p-orange-500);
}

:deep(.tactical-rotated-box.zone-amber) {
    border-color: var(--p-amber-500);
    color: var(--p-amber-500);
}

:deep(.tactical-rotated-box.zone-fuchsia) {
    border-color: var(--p-fuchsia-500);
    color: var(--p-fuchsia-500);
}

:deep(.tactical-rotated-box.zone-pink) {
    border-color: var(--p-pink-500);
    color: var(--p-pink-500);
}

:deep(.tactical-rotated-box.zone-red) {
    border-color: var(--p-red-500);
    color: var(--p-red-500);
}

:deep(.tactical-rotated-box.zone-emerald) {
    border-color: var(--p-emerald-500);
    color: var(--p-emerald-500);
}

:deep(.tactical-rotated-box.zone-cyan) {
    border-color: var(--p-cyan-500);
    color: var(--p-cyan-500);
}

:deep(.tactical-rotated-box.base) {
    font-size: 10px;
    padding: 0;
    width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;

    &.base-a {
        background-color: var(--p-blue-500);
        border-color: var(--p-blue-700);
        color: var(--p-blue-50);
    }

    &.base-b {
        background-color: var(--p-yellow-500);
        border-color: var(--p-yellow-700);
        color: var(--p-yellow-50);
    }
}

:deep(.zone-forbidden) {
    color: var(--p-yellow-500);
    font-weight: bold;
    font-size: 0.6rem;
}

:deep(.tactical-op-marker) {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

:deep(.op-pulse:not(.medic):not(.dead)) {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--p-yellow-500) 60%, transparent);
    box-shadow: 0 0 8px var(--p-yellow-700);
    animation: radar-pulse 2s infinite ease-out;
    pointer-events: none;
    z-index: 1;
}

@keyframes radar-pulse {
    0% {
        transform: translateX(-50%) scale(1);
        opacity: 0.9;
    }

    100% {
        transform: translateX(-50%) scale(2.2);
        opacity: 0;
    }
}

:deep(.op-avatar-circle) {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid var(--p-yellow-500);
    overflow: hidden;
    background: var(--p-surface-950);
    z-index: 2;
    box-shadow: 0 0 10px var(--p-yellow-600), inset 0 0 4px var(--p-surface-950);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

/* =========================================
   STATUS: MEDIC 
========================================= */
:deep(.op-avatar-circle.medic) {
    border-color: var(--p-red-500);
    box-shadow: none;
}

:deep(.op-avatar-circle.dead) {
    border-color: var(--p-surface-950);
    box-shadow: none;
}

/* Overlay do Médico criado por cima da imagem */
:deep(.op-avatar-circle.medic::after),
:deep(.op-avatar-circle.dead::after) {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image:
        linear-gradient(var(--p-red-500), var(--p-red-500)),
        linear-gradient(var(--p-red-500), var(--p-red-500));
    background-size: 4px 14px, 14px 4px;
    background-position: center;
    background-repeat: no-repeat;
}

:deep(.op-avatar-circle.medic::after) {
    background-color: var(--p-surface-50);
}

/* 3. Regra ESPECÍFICA para o Morto (Gira o ::after em 45º e aplica o fundo escuro) */
:deep(.op-avatar-circle.dead::after) {
    background-color: var(--p-surface-950);
    transform: rotate(45deg);
}

/* =========================================
   ELEMENTOS INTERNOS E LABEL
========================================= */
:deep(.op-avatar-img) {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}

:deep(.op-label) {
    background-color: color-mix(in srgb, var(--p-surface-950, #0d0d0d) 80%, transparent);
    border: 1px solid var(--p-yellow-500);
    color: var(--p-yellow-50);
    font-weight: bold;
    font-size: 0.5rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
    z-index: 1;
    margin-top: 0.25rem;
    text-transform: uppercase;
}

.hide-op-labels :deep(.op-label),
.map-wrapper.hide-op-labels :deep(.op-label),
:deep(.hide-op-labels .op-label) {
    display: none !important;
}

.chat-unread-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 18px;
    height: 18px;
    font-size: 8px !important;
    pointer-events: none;
    z-index: 10;
}
</style>

<style>
/* =========================================
   ESTILIZAÇÃO GLOBAL DO CHAT TÁTICO P2P (MODO CLARO)
========================================= */
.tactical-chat-drawer {
    width: 23rem !important;
    max-width: 90vw !important;
    border: 0;
    border-left: 1px solid var(--p-gray-100) !important;
}

.tactical-chat-drawer .p-drawer-header {
    background-color: var(--p-surface-0);
    border-bottom: 1px solid var(--p-gray-100);
    padding: 1rem;
    color: var(--p-text-primary);
}

.tactical-chat-drawer .p-drawer-header .p-drawer-close-button {
    color: var(--p-text-secondary);
    background: transparent;
    border-radius: 50%;
}

.tactical-chat-drawer .p-drawer-header .p-drawer-close-button:hover {
    color: var(--p-text-primary);
    background: var(--p-surface-100);
}

.tactical-chat-drawer .p-drawer-content {
    background-color: var(--p-surface-0);
    color: var(--p-text-primary);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    height: calc(100% - 4.5rem);
}

/* Bolhas de Mensagem Táticas (Modo Claro) */
.chat-bubble-incoming {
    background-color: var(--p-slate-100);
    border: 1px solid var(--p-slate-400);
    color: var(--p-surface-800);
}

.chat-bubble-self {
    background: var(--p-amber-100);
    border: 1px solid var(--p-amber-400);
    color: var(--p-amber-800);
}

.chat-bubble-callout {
    background: var(--p-red-100);
    border: 1px solid var(--p-red-400);
    color: var(--p-red-800);
}

/* Botões de Alerta Rápido em Grid */
.tactical-quick-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 0.35rem;
}

.code-q {
    font-size: 0.6rem;
    color: var(--p-red-500);
    background-color: var(--p-red-100);
    padding: 0.125rem 0.25rem;
    border-radius: var(--p-border-radius-sm);
    font-weight: 700;
    border: 1px solid var(--p-red-200);
    text-transform: uppercase;
}
</style>