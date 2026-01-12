<template>
    <div class="p-4" v-if="event">
        <div class="border-bottom-1 border-black-alpha-20 pb-4 mb-4">
            <div class="flex justify-content-between align-items-start mb-3">
                <div>
                    <Tag :value="EVENT_TYPES[event.type as unknown as keyof typeof EVENT_TYPES]" severity="info"
                        class="mb-2" />
                    <h1 class="text-4xl font-bold uppercase m-0">
                        {{ event.title }}
                    </h1>
                    <p class="flex justify-content-center align-items-center text-gray-400 mt-2">
                        <i class="pi pi-calendar mr-2"></i> {{ formatDate(event.date, true) }} - {{ event.startTime }}
                        às
                        {{
                            event.endTime }}
                        <span v-if="isConfirmed" class="ml-2 text-green-400 font-bold">
                            <i class=" pi pi-check-circle text-green-400 mr-2"></i>Presença Confirmada
                        </span>
                    </p>

                </div>
                <div class="text-right">
                    <span class="text-3xl font-bold text-primary-500">{{ checkinsCount }}</span>
                    <p class="text-xs text-gray-500 uppercase font-bold m-0">Check-ins</p>
                </div>
            </div>

            <div class="flex gap-3">
                <Button v-if="isConfirmed" label="Cancelar Presença" icon="pi pi-times" severity="error"
                    @click="toggleParticipation" class="w-full md:w-auto" />
                <Button v-else label="Confirmar Presença" icon="pi pi-plus-circle" severity="primary"
                    @click="toggleParticipation" class="w-full md:w-auto" />
                <Button v-if="isConfirmed" label="Adicionar à Agenda" icon="pi pi-calendar-plus" severity="help"
                    @click="handleCalendarDynamic" class="w-full md:w-auto" />
            </div>
        </div>

        <div class="grid">
            <div class="col-12 md:col-8">
                <Card class="border-1 border-black-alpha-10 mb-4">
                    <template #title><span class="text-green-400">Briefing da Missão</span></template>
                    <template #content>
                        <div class="w-full rounded"
                            :style="{ minHeight: '15rem', backgroundImage: `url(${event.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center center' }" />
                        <p class="text-gray-300">{{ event.description }}</p>
                    </template>
                </Card>

                <Card class="bg-gray-900 border-1 border-white-alpha-10">
                    <template #title><span class="text-green-400">Localização</span></template>
                    <template #content>
                        <div class="p-3 border-round bg-gray-800 flex justify-content-between align-items-center">
                            <span>{{ event.location }}</span>
                            <Button icon="pi pi-map-marker" label="Abrir no Maps" @click="openMaps" severity="warning"
                                text />
                        </div>
                        <div v-if="mapUrl" class="mt-3 border-round overflow-hidden" style="height: 300px">
                            <iframe width="100%" height="100%" frameborder="0" style="border:0;" :src="mapUrl"
                                allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                        </div>
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-4">
                <Card class="bg-gray-900 border-1 border-white-alpha-10 shadow-8">
                    <template #title><span class="text-green-500">Controle de Operação</span></template>
                    <template #content>
                        <Button v-if="operator.role === 'admin'" label="Check-in QR Code" icon="pi pi-qrcode"
                            class="w-full" severity="success" @click="showScanner = true" />
                        <h4 class="text-sm uppercase text-gray-400 border-bottom-1 border-white-alpha-10 pb-2">
                            Lista de Operadores ({{ participants.length }})
                        </h4>
                        <div class="operators-list">
                            <div v-for="{ $id, operator, checked_in } in participants" :key="$id"
                                class="flex align-items-center gap-3 mb-3">
                                <Avatar :image="operator.avatar" shape="circle" size="small" />
                                <span :class="{ 'text-green-400': checked_in }">{{
                                    operator.codename }}</span>
                                <i v-if="checked_in" class="pi pi-check text-xs text-green-400 ml-auto"></i>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

        </div>

        <Dialog v-model:visible="showScanner" header="Check-in de Operador" :modal="true" position="top"
            class="w-full md:w-30rem custom-scanner-dialog">
            <div class="relative border-round overflow-hidden scanner-viewport">
                <div class="scanner-overlay">
                    <div class="flex justify-content-center mb-3">
                        <SelectButton v-model="facingMode" :options="cameraOptions" optionLabel="label"
                            optionValue="value" class="exodo-camera-switch" />
                    </div>
                    <qrcode-stream class="scanner-frame overflow-hidden" @detect="onDetect" @init="onInit"
                        :track="paintOutline" :constraints="{ facingMode }" style="width: 250px; height: 250px;" />
                    <div class="scanner-instructions">
                        <p class="text-xs m-0">Posicione o QR Code dentro da linha e aguarde.</p>
                        <p class="text-xs opacity-70 m-0">A leitura é automática.</p>
                    </div>
                </div>

                <div v-if="scannerError" class="center-all p-3 bg-red-900 text-white w-full text-center z-5">
                    {{ scannerError }}
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { QrcodeStream, type DetectedBarcode } from 'vue-qrcode-reader';
import { useConfirm } from "primevue";
import { useToast } from "primevue/usetoast";
import { atcb_action } from 'add-to-calendar-button';
import { useAuthStore } from '@/stores/auth';
import { EventService, type IEvent, type IParticipation, type IParticipations } from '@/services/event';
import { EVENT_TYPES, TEAM_NAME } from '@/constants/airsoft';
import { extractCoordsFromUrl, formatDate, playBeep } from '@/functions/utils';
import type { ATCBActionEventConfig } from 'add-to-calendar-button';

import Image from 'primevue/image';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Avatar from 'primevue/avatar';

import type { IOperator } from '@/services/operator';

const route = useRoute();
const toast = useToast();
const confirm = useConfirm();
const { operator } = useAuthStore();

const event = ref({} as IEvent);
const participants = ref([] as IParticipation<IOperator, IEvent
>[]);

const isConfirmed = ref(false);
const showScanner = ref(false);

const cameraOptions = ref([
    { label: 'Frontal', value: 'user' },
    { label: 'Traseira', value: 'environment' },
]);

const facingMode = ref<'environment' | 'user'>('environment');
const scannerError = ref('');

function paintOutline(detectedCodes: DetectedBarcode[], ctx: CanvasRenderingContext2D) {
    for (const { cornerPoints } of detectedCodes) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cornerPoints[0].x, cornerPoints[0].y);
        cornerPoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(cornerPoints[0].x, cornerPoints[0].y);
        ctx.stroke();
    }
}

async function onInit(promise: Promise<any>) {
    try {
        await promise;
    } catch (err: any) {
        scannerError.value = err.name === 'NotAllowedError' ? 'Sem permissão' : 'Erro na câmera';
    }
}

async function onDetect(detectedCodes: DetectedBarcode[]) {
    const operatorId = detectedCodes[0]?.rawValue;
    if (!operatorId) return;

    try {
        playBeep();
        if (navigator.vibrate) navigator.vibrate(200);

        await EventService.confirmAttendance(event.value.$id, operatorId);

        const op = participants.value.find(p => p.operator.$id === operatorId);
        if (op) op.checked_in = true;

        toast.add({ severity: 'success', summary: 'Check-in OK', life: 2000 });
    } catch (e) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        toast.add({ severity: 'error', summary: 'Falha no Check-in' });
    } finally {
        showScanner.value = false;
    }
}

const handleCalendarDynamic = () => {
    const startDate = new Date(event.value.date as Date).toISOString().split('T')[0];
    const { startTime, endTime, location, description, type } = event.value;
    const typeLabel = EVENT_TYPES[type as keyof typeof EVENT_TYPES];

    const config = {
        name: `[${TEAM_NAME}][${typeLabel}] ${event.value.title}`,
        description,
        startDate,
        startTime,
        endTime,
        location,
        options: ['Google', 'Apple', 'Microsoft365', 'Outlook.com'],
        timeZone: "America/Bahia",
        iCalFileName: "Missao-Airsoft-Event",
        language: "pt",
    } as ATCBActionEventConfig;

    atcb_action(config);
};

const checkinsCount = computed(() => participants.value.filter(p => p.checked_in).length);

const mapUrl = computed(() => {
    if (!event.value?.location_url || !event.value?.location) return null;

    const coords = extractCoordsFromUrl(event.value.location_url);
    if (!coords) return null;

    const query = `${coords.lat},${coords.lng}`;

    return `https://www.google.com/maps?q=${query}&t=&z=16&ie=UTF8&iwloc=A&output=embed`;
});

onMounted(async () => {
    const eventId = route.params.id?.toString();

    if (!eventId) return;

    const eventDetails = await EventService.row(eventId) as IEvent;
    event.value = eventDetails;

    participants.value = eventDetails.participations as IParticipations[];
    isConfirmed.value = participants.value.some(p => p.operator.$id === operator.$id);
});

const toggleParticipation = async () => {
    try {
        if (isConfirmed.value) {
            const userParticipation = participants.value.find(p => p.operator.$id === operator.$id);
            if (userParticipation?.$id) {
                await EventService.deleteParticipation(userParticipation.$id);

                participants.value = participants.value.filter(p => p.$id !== userParticipation.$id);
                isConfirmed.value = false;

                toast.add({ severity: 'info', summary: 'Cancelado', detail: 'Sua presença foi removida.', life: 3000 });
            }
        } else {
            const newParticipation = await EventService.createParticipation(event.value.$id, operator.$id) as IParticipations;

            participants.value.push({
                ...newParticipation,
                operator: operator
            });
            isConfirmed.value = true;

            toast.add({ severity: 'success', summary: 'Confirmado', detail: 'Presença confirmada!', life: 3000 });

            confirm.require({
                message: 'Deseja adicionar este evento a sua agenda?',
                header: 'Agenda Tática',
                acceptLabel: 'Sim, adicionar',
                rejectLabel: 'Agora não',
                accept: () => {
                    handleCalendarDynamic();
                }
            });
        }
    } catch (error) {
        console.error("Erro ao alterar participação:", error);
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível processar sua solicitação.', life: 3000 });
    }
};

const openMaps = () => window.open(event.value.location_url, '_blank');
</script>

<style scoped>
.scanner-viewport {
    height: 450px;
    display: flex;
    flex-direction: column;
}

.scanner-overlay {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    z-index: 1;
    padding: 1rem;
}

.scanner-frame {
    border: 5px solid transparent;
    border-radius: 20px;
    background: linear-gradient(white, white) padding-box,
        linear-gradient(to bottom right, #dc143c, #daa520) border-box;
    box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.3);
}

.scanner-instructions {
    text-align: center;
    color: white;
    z-index: 2;
    padding: 0 2rem;
    font-weight: 500;
}

/* Estilo do SelectButton (Alternador Frontal/Traseira) */
:deep(.exodo-camera-switch .p-button) {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
}

:deep(.exodo-camera-switch .p-highlight) {
    background: var(--primary-color) !important;
    color: var(--primary-color-text) !important;
}
</style>