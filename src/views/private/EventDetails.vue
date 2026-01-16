<template>
    <EventSkeleton v-if="loading" />
    <div v-else class="p-4">
        <div class="border-bottom-1 border-black-alpha-20 pb-4 mb-4">
            <div class="grid">
                <div class="col-12">
                    <h1 class="text-4xl font-bold uppercase m-0">
                        {{ event.title }}
                    </h1>
                </div>
                <div class="col-12">
                    <div class="flex justify-content-between align-items-center">
                        <Tag :value="EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] || 'Padrão'"
                            :severity="severityEvent(event.type)" />
                        <div class="flex flex-column align-items-end justify-content-end">
                            <span class="text-3xl font-bold text-primary-500">{{ checkinsCount }}</span>
                            <span class="text-xs text-gray-500 uppercase font-bold ">Check-ins</span>
                        </div>
                    </div>
                </div>
                <div class="col-12">
                    <p class="flex flex-column md:flex-row text-gray-400 gap-2">
                        <span class="flex align-items-center gap-2"><i class="pi pi-calendar"></i> {{
                            formatDate(event.date, true) }} - {{
                                event.startTime }} às {{ event.endTime }}</span>
                        <span v-if="isConfirmed" class="flex align-items-center gap-2 text-green-400 font-bold">
                            <i class=" pi pi-check-circle text-green-400"></i>Presença Confirmada
                        </span>
                    </p>
                </div>
                <div class="col-12">
                    <div class="flex flex-column md:flex-row gap-2 md:gap-3">
                        <Button v-if="isConfirmed" label="Cancelar Presença" icon="pi pi-times" severity="error"
                            @click="toggleParticipation" class="w-full md:w-auto" />
                        <Button v-else label="Confirmar Presença" icon="pi pi-plus-circle" severity="primary"
                            @click="toggleParticipation" class="w-full md:w-auto" />
                        <Button v-if="isConfirmed" label="Adicionar à Agenda" icon="pi pi-calendar-plus" severity="help"
                            @click="handleCalendarDynamic" class="w-full md:w-auto" />
                        <ButtonShare :event="event" :share="true" icon="pi pi-share-alt" outlined
                            v-tooltip.top="'Compartilhar'" />
                    </div>
                </div>
            </div>
        </div>
        <div class="grid">
            <div class="col-12 md:col-8">
                <Card class="border-1 border-black-alpha-10 mb-4">
                    <template #content>
                        <Image :src="event.thumbnail" :alt="event.title" class="overflow-hidden border-round"
                            imageClass="w-full" preview />
                        <h2 class="text-green-400">Briefing da Missão</h2>
                        <div class="text-html" v-html="event.description"></div>
                    </template>
                </Card>
                <Card class="bg-blue-900 border-1 border-white-alpha-10">
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
                <Card class="bg-blue-900 border-1 border-white-alpha-10 mb-4">
                    <span class="text-green-500">Controle de Operação</span>
                    <template #content>
                        <div v-if="operator.role === 'admin'" class="buttons flex flex-column gap-2 mb-3">
                            <Button label="Check-in QR Code" icon="pi pi-qrcode" class="w-full" severity="success"
                                @click="openScannerDialog = true" />
                            <Button label="Adicionar Visitante" icon="pi pi-plus" class="w-full" severity="warning"
                                :disabled="availableVisitors.length === 0" @click="openVisitorDialog = true" />
                        </div>
                        <h4 class="text-sm uppercase text-gray-400 border-bottom-1 border-white-alpha-10 mt-0 pb-2">
                            Lista de Operadores
                        </h4>
                        <Tabs :value="0">
                            <TabList>
                                <Tab :value="0">Operadores ({{ participants.length }})</Tab>
                                <Tab :value="1">Visitantes ({{
                                    visitorParticipants.length }})</Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel :value="0">
                                    <div v-if="participants.length > 0"
                                        v-for="{ $id, operator, checked_in } in participants" :key="$id"
                                        class="flex align-items-center gap-3 mb-3">
                                        <Avatar :image="operator.avatar"
                                            :icon="!operator.avatar ? 'pi pi-user' : undefined" shape="circle"
                                            size="small" />
                                        <span :class="{ 'text-green-400': checked_in }">{{
                                            operator.codename }}</span>
                                        <i v-if="checked_in" class="pi pi-check font-bold text-green-600 ml-auto""></i>
                                    </div>
<div v-else class=" flex flex-column align-items-center p-4 text-gray-500">
                                            <i class="pi pi-users text-5xl mb-2"></i>
                                            <span class="text-sm">Nenhum operador participando dessa missão.</span>
                                    </div>
                                </TabPanel>
                                <TabPanel :value="1">
                                    <div v-if="visitorParticipants.length > 0"
                                        v-for="{ $id, visitor, checked_in } in visitorParticipants" :key="$id"
                                        class="flex align-items-center gap-3 mb-3">
                                        <Avatar :label="visitor.name[0]" shape="circle" size="small" />
                                        <div class="flex flex-column">
                                            <span :class="{ 'font-bold text-green-600': checked_in }">{{
                                                visitor.codename }}</span>
                                            <small class="text-gray-700">Convidado por <strong>{{
                                                getOperatorName(visitor.operator) }}</strong></small>
                                        </div>
                                        <div v-if="!checked_in && operator.role === 'admin'" class="flex gap-2 ml-auto">
                                            <Button icon=" pi pi-times" severity="danger" rounded
                                                @click="deleteVisitorParticipation($id, visitor)" size="small"
                                                v-tooltip.top="'Cancelar Presença'" />
                                            <Button icon=" pi pi-check" severity="success" rounded
                                                @click="checkInVisitor($id)" size="small"
                                                v-tooltip.top="'Confirmar Presença'" />
                                        </div>
                                        <i v-else class="pi pi-check font-bold text-green-600 ml-auto"></i>
                                    </div>
                                    <div v-else class="flex flex-column align-items-center p-4 text-gray-500">
                                        <i class="pi pi-users text-5xl mb-2"></i>
                                        <span class="text-sm">Nenhum visitante adicionado a missão.</span>
                                    </div>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </template>
                </Card>
                <Card class="bg-blue-900 border-1 border-white-alpha-10">
                    <template #content>
                        <div v-if="isConfirmed && vehicles.length > 0" class="buttons flex flex-column gap-2 mb-3">
                            <Button label="Adicionar Carona" icon="pi pi-plus" class="w-full" severity="warning"
                                @click="newCarpool" />
                        </div>
                        <h4 class="text-sm uppercase text-gray-400 border-bottom-1 border-white-alpha-10 mt-0 pb-2">
                            Carona Solidária
                        </h4>
                        <Tabs :value="0">
                            <TabList>
                                <Tab :value="0">Disponíveis ({{ carpools.length }})</Tab>
                                <Tab :value="1">Aceitas ({{ carpoolAccepteds.length }})</Tab>
                                <Tab :value="2" :hidden="!hasCarpools">Solicitações ({{ carpoolRequests.length }})</Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel :value="0">
                                    <div v-if="carpools.length > 0" v-for="carpool in carpools" :key="carpool.$id"
                                        class="flex text-gray-700 justify-content-between align-items-center gap-3">
                                        <div class="flex flex-column gap-1">
                                            <div class="flex align-items-center gap-2">
                                                <i class="pi pi-user text-sm"></i>
                                                <span class="text-sm font-bold">
                                                    {{ getOperatorName(carpool.vehicle.driver) }}
                                                </span>
                                            </div>
                                            <div class="flex align-items-center gap-2 text-sm">
                                                <i class="pi pi-car text-sm"></i>
                                                <span class="text-sm">
                                                    {{ carpool.vehicle.model }}
                                                </span>
                                                <i v-if="carpool.vehicle.color" class="border-1 border-circle"
                                                    :style="{ backgroundColor: `#${carpool.vehicle.color}`, width: '1rem', aspectRatio: '1' }"></i>
                                            </div>
                                            <div class="flex align-items-center gap-2 text-sm">
                                                <i class="pi pi-users text-sm"></i>
                                                <span class="text-sm">
                                                    {{ carpool.available_seats }} vagas disponíveis
                                                </span>
                                            </div>
                                            <div class="flex align-items-center gap-2 text-sm">
                                                <i class="pi pi-flag text-sm"></i>
                                                <span class="text-sm">
                                                    {{ carpool.departure_point }}
                                                </span>
                                            </div>
                                            <div class="flex align-items-center gap-2 text-sm">
                                                <i class="pi pi-clock text-sm"></i>
                                                <span class="text-sm">
                                                    {{ carpool.departure_time }}
                                                </span>
                                            </div>
                                        </div>
                                        <Button v-if="canRequest(carpool)" icon="pi pi-plus" severity="warn" rounded
                                            @click="requestCarpool(carpool)" size="small"
                                            v-tooltip.top="'Solicitar Carona'"
                                            :disabled="carpool.available_seats === 0" />
                                        <div v-if="hasCarpools" class="flex align-itens-center gap-2">
                                            <Button icon="pi pi-pencil" size="small" rounded
                                                @click="editCarpool(carpool)" v-tooltip.top="'Editar'" />
                                            <Button icon="pi pi-times" size="small" severity="danger" rounded
                                                @click="deleteCarpool(carpool)" v-tooltip.top="'Excluir'" />
                                        </div>
                                    </div>
                                    <div v-else class="flex flex-column align-items-center p-4 text-gray-500">
                                        <i class="pi pi-car text-5xl mb-2"></i>
                                        <span class="text-sm">Nenhuma carona para esta missão ainda.</span>
                                    </div>
                                </TabPanel>
                                <TabPanel :value="1">
                                    <div v-if="carpoolAccepteds.length > 0"
                                        v-for="({ $id, requester, carpool: { vehicle } }, index) in carpoolAccepteds"
                                        :key="$id" class="flex text-gray-700 align-items-center gap-3 mb-3">
                                        <span class="text-sm font-bold">{{ index + 1 }}. <strong>{{
                                            getOperatorName(vehicle.driver) }}</strong> aceitou a solicitação de
                                            <strong>{{ requester.codename }}</strong> no veículo {{ vehicle.model }} ({{
                                                vehicle.color }})</span>
                                    </div>
                                    <div v-else class="flex flex-column align-items-center p-4 text-gray-500">
                                        <i class="pi pi-list-check text-5xl mb-2"></i>
                                        <span class="text-sm">Nenhum carona solicitada foi aceita.</span>
                                    </div>
                                </TabPanel>
                                <TabPanel :value="2">
                                    <div v-if="carpoolRequests.length > 0" v-for="request in carpoolRequests"
                                        :key="request.$id"
                                        class="flex text-gray-700 justify-content-between align-items-center gap-3 mb-3">
                                        <span class="text-sm font-bold">{{ request.requester.codename }}</span>
                                        <div class="flex gap-2">
                                            <Button icon="pi pi-check" severity="success" rounded size="small"
                                                @click="handleUpdateStatus(request, 'accepted')"
                                                v-tooltip.top="'Aceitar'" />
                                            <Button icon="pi pi-times" severity="danger" rounded size="small"
                                                @click="handleUpdateStatus(request, 'rejected')"
                                                v-tooltip.top="'Rejeitar'" />
                                        </div>
                                    </div>
                                    <div v-else class="flex flex-column align-items-center p-4 text-gray-500">
                                        <i class="pi pi-list text-5xl mb-2"></i>
                                        <span class="text-sm">Nenhum solicitão foi enviada.</span>
                                    </div>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </template>
                </Card>
            </div>
        </div>

        <Dialog v-model:visible="openScannerDialog" header="Check-in de Operador" :modal="true"
            class="w-full md:w-30rem custom-scanner-dialog">
            <div class="relative border-round overflow-hidden scanner-viewport">
                <QrcodeStream class="overflow-hidden" @detect="onDetect" @init="onInit" :track="paintOutline"
                    :constraints="{ facingMode }">
                    <div class="scanner-overlay">
                        <div class="scanner-frame"></div>
                        <SelectButton v-model="facingMode" :options="cameraOptions" optionLabel="label"
                            optionValue="value" class="exodo-camera-switch" />
                        <div class="scanner-instructions">
                            <p class="text-xs m-0">Posicione o QR Code dentro da linha e aguarde.</p>
                            <p class="text-xs opacity-70 m-0">A leitura é automática.</p>
                        </div>
                    </div>
                </QrcodeStream>

                <div v-if="scannerError" class="center-all p-3 bg-red-900 text-white w-full text-center z-5">
                    {{ scannerError }}
                </div>
            </div>
        </Dialog>

        <Dialog v-model:visible="openVisitorDialog" header="Adicionar Visitantes" :modal="true"
            class="w-full md:w-30rem">
            <div class="col-12">
                <FloatLabel variant="in">
                    <MultiSelect v-model="selectedVisitors" :options="availableVisitors" optionLabel="codename" filter
                        :maxSelectedLabels="3" class="w-full" display="chip">
                        <template #option="slotProps">
                            <div class="flex flex-column">
                                <span class="font-bold">{{ slotProps.option.name }} ({{ slotProps.option.codename
                                    }})</span>
                                <small class="text-gray-500">Convidado por {{
                                    slotProps.option.operator.codename }}</small>
                            </div>
                        </template>
                        <template #empty>Nenhum visitante disponível</template>
                    </MultiSelect>
                    <label>Visitantes</label>
                </FloatLabel>
                <Button label="Adicionar Visitantes" icon="pi pi-check-circle" severity="success" class="w-full mt-2"
                    :disabled="selectedVisitors.length === 0" @click="addVisitorParcipations" />
            </div>
        </Dialog>

        <Dialog v-model:visible="openCarpoolDialog" :style="{ width: '512px' }" header="Veículo" :modal="true">
            <Form :resolver="resolver" :initialValues="selectedCarpool" @submit="saveCarpool" class="grid"
                :key="selectedCarpool.$id || 'new'">
                <div v-for="{ name, label, component, col, props } in carpoolFields" :key="name" :class="`col-${col}`">
                    <FormField v-if="['ToggleSwitch', 'ColorPicker'].includes(component.name)" :name="name"
                        v-slot="$field" class="flex flex-column gap-1">
                        <div class="flex gap-2">
                            <component :is="component" :id="name" v-bind="props" :name="name" v-model="$field.value"
                                fluid />
                            <label :for="name">{{ label }}</label>
                        </div>
                        <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>
                    <FormField v-else :name="name" v-slot="$field" class="flex flex-column gap-1">
                        <FloatLabel variant="in">
                            <component :is="component" :id="name" v-bind="props" v-model="$field.value" class="w-full"
                                :class="{ 'p-invalid': $field.invalid }" fluid />
                            <label :for="name">{{ label }}</label>
                        </FloatLabel>

                        <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>
                </div>

                <div class="col-12">
                    <Button type="submit" label="Salvar" class="w-full shadow-6" severity="success" />
                </div>
            </Form>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { QrcodeStream, type DetectedBarcode } from 'vue-qrcode-reader';
import { InputMask, InputNumber, InputText, Select, useConfirm } from "primevue";
import { useToast } from "primevue/usetoast";
import { atcb_action } from 'add-to-calendar-button';
import { useAuthStore } from '@/stores/auth';
import { EventService, type IEvent, type IParticipation, type IVisitorParticipation, type IVisitorParticipationDetail } from '@/services/event';
import { EVENT_TYPES, TEAM_NAME } from '@/constants/airsoft';
import { formatDate, playBeep, type IFields } from '@/functions/utils';
import type { ATCBActionEventConfig } from 'add-to-calendar-button';
import { severityEvent } from '@/functions/utils'

import Card from 'primevue/card';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Avatar from 'primevue/avatar';
import Tag from 'primevue/tag';
import Tabs from 'primevue/tabs';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import SelectButton from 'primevue/selectbutton';
import MultiSelect from 'primevue/multiselect';
import FloatLabel from 'primevue/floatlabel';

import type { IOperator } from '@/services/operator';
import { VisitorService, type IVisitor } from '@/services/visitor';
import { CarpoolService, type ICarpool, type ICarpoolDetail } from '@/services/carpool';
import { VehicleService, type IVehicle } from '@/services/vehicle';
import { CarpoolRequestService, type ICarpoolRequest } from '@/services/carpool_request';
import router from '@/router';
import ButtonShare from '@/components/ButtonShare.vue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import z from 'zod';

const route = useRoute();
const toast = useToast();
const confirm = useConfirm();
const { operator } = useAuthStore();

const rawEvent = ref<IEvent>({} as IEvent);
const participants = ref<IParticipation<IOperator>[]>([]);
const visitorParticipants = ref<IVisitorParticipationDetail[]>([]);

const visitors = ref<IVisitor<IOperator>[]>([]);
const selectedVisitors = ref<IVisitor<IOperator>[]>([]);

const carpools = ref<ICarpool<IVehicle<string>>[]>([]);

const requests = ref<ICarpoolRequest<IOperator, ICarpoolDetail>[]>([]);

const hasCarpools = computed(() => carpools.value.some(carpool => carpool.vehicle.driver === operator.$id));

const carpoolAccepteds = computed(() => requests.value.filter(request => request.status === 'accepted'));
const carpoolRequests = computed(() => {
    return requests.value.filter(request => {
        if (request.status !== 'pending') return false;
        return request.carpool.vehicle.driver === operator.$id;
    });
});

const event = computed(() => {
    return {
        ...rawEvent.value,
        participations: participants.value,
        visitor_participations: visitorParticipants.value
    };
});

const operatorsMap = computed(() => {
    return new Map(participants.value.map(p => [p.operator.$id, p.operator]));
});

const vehicles = ref<IVehicle[]>([]);

const loading = ref(false);

const isConfirmed = ref(false);
const openScannerDialog = ref(false);
const openVisitorDialog = ref(false);
const openCarpoolDialog = ref(false);

const cameraOptions = ref([
    { label: 'Frontal', value: 'user' },
    { label: 'Traseira', value: 'environment' },
]);

// CARPOOLS
const selectedCarpool = ref<ICarpool>({} as ICarpool);

const carpoolFields = computed<IFields[]>(() => [
    {
        name: "vehicle", label: "Veículo", component: Select, col: "12", props: {
            options: availableVehicles.value,
            optionLabel: "model",
            optionValue: "$id",
            "onUpdate:modelValue": (val: string) => { selectedCarpool.value.vehicle = val }
        },
    },
    { name: "departure_point", label: "Saída", component: InputText, col: "12" },
    { name: "departure_time", label: "Horário de saída", component: InputMask, col: "6", props: { mask: "99:99" } },
    {
        name: "available_seats",
        label: "Total de vagas",
        component: InputNumber, col: "6",
        props: {
            min: 1,
            max: getVehicleCapacity(selectedCarpool.value.vehicle),
            showClear: true,
            mode: "decimal"
        }
    },
]);

const carpoolSchema = z.object({
    departure_point: z.string({ error: "Saída obrigatória" }),
    departure_time: z.string({ error: "Horário de saída obrigatório" })
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (00:00 - 23:59)"),
    vehicle: z.string({ error: "Marca obrigatório" }),
    available_seats: z.number({ error: "Vagas disponíveis obrigtaório" }).min(1, "Mínimo 1 vaga")
})

const resolver = ref(zodResolver(carpoolSchema));

const availableVehicles = computed(() => {
    if (selectedCarpool.value.$id) {
        return [selectedCarpool.value.selected];
    }

    const alreadyVehicles = carpools.value.map(p => p.vehicle.$id);
    return vehicles.value.filter(v => !alreadyVehicles.includes(v.$id));
});

const carpoolsWithRequests = computed(() => {
    return new Set(
        requests.value
            .filter(request => request.status !== 'rejected')
            .map(request => request.carpool.$id)
    );
});

const saveCarpool = async ({ valid, values }: any) => {
    if (!valid) return false;

    try {
        const payload = {
            ...values,
            event: event.value.$id,
        }

        const carpool = await CarpoolService.upsert(selectedCarpool.value.$id, payload) as ICarpool<IVehicle<IOperator>>;
        const index = carpools.value.findIndex((item) => item.$id === carpool.$id);

        const carpoolHydrated = {
            ...carpool,
            vehicle: {
                ...carpool.vehicle,
                driver: carpool.vehicle.driver.$id
            }
        }

        if (index !== -1) {
            carpools.value[index] = carpoolHydrated;
        } else {
            carpools.value.push(carpoolHydrated);
        }

        toast.add({
            severity: "success",
            summary: "Sucesso!",
            detail: "Carona salva com sucesso!",
            life: 3000,
        });
    } catch (error: any) {
        console.error("Erro ao salvar:", error);
        toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar o visitante.", life: 3000 });
    } finally {
        openCarpoolDialog.value = false;
    }
};

const deleteCarpool = (carpool: ICarpool<IVehicle>) => {
    if (carpoolsWithRequests.value.has(carpool.$id)) {
        toast.add({
            severity: 'warn',
            summary: 'Ação Bloqueada',
            detail: 'Não é possível excluir uma carona que já possui solicitações de operadores.',
            life: 3000
        });
        return;
    }

    confirm.require({
        message: 'Você tem certeza que deseja excluir este carona?',
        header: carpool.vehicle.model,
        rejectProps: {
            label: 'Não',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Sim',
            severity: 'danger'
        },
        accept: async () => {
            try {
                await CarpoolService.delete(carpool.$id);
                carpools.value = carpools.value.filter((item) => item.$id !== carpool.$id);

                toast.add({
                    severity: "success",
                    summary: "Sucesso",
                    detail: "Veículo excluído com sucesso!",
                    life: 3000,
                });

            } catch (error: any) {
                console.error("Erro ao enviar formulário:", error);

                toast.add({
                    severity: "error",
                    summary: "Erro",
                    detail: error.message || "Falha ao excluir os dados. Tente novamente.",
                    life: 4000,
                });
            }
        },
    });
};

const newCarpool = async () => {
    selectedCarpool.value = {} as ICarpool<IVehicle>;
    openCarpoolDialog.value = true;
};

const editCarpool = async (carpool: ICarpool<IVehicle>) => {
    selectedCarpool.value = {
        ...carpool,
        vehicle: carpool.vehicle.$id,
        selected: carpool.vehicle
    }

    openCarpoolDialog.value = true;
};

const getVehicleCapacity = (vehicleId: string | IVehicle) => {
    const vehicle = availableVehicles.value.find(v => v?.$id === vehicleId);
    return vehicle ? vehicle.total_seats : 300;
};
// CARPOOLS

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

        await EventService.confirmAttendance(event.value.$id, operatorId);

        const op = participants.value.find(p => p.operator.$id === operatorId);
        if (op) op.checked_in = true;

        toast.add({ severity: 'success', summary: 'Check-in OK', life: 2000 });

        if (navigator.vibrate) navigator.vibrate(200);
        playBeep();
    } catch (e) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        toast.add({ severity: 'error', summary: 'Falha no Check-in' });
    } finally {
        openScannerDialog.value = false;
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

const checkinsCount = computed(() => participants.value.filter(p => p.checked_in).length + visitorParticipants.value.filter(p => p.checked_in).length);

const mapUrl = computed(() => {
    if (!event.value.location_coords) return null;

    return `https://maps.google.com/maps?q=${event.value.location_coords}&z=15&output=embed`;
});

onMounted(() => {
    loadServices();
});

const loadServices = async () => {
    try {
        loading.value = true;
        const eventId = route.params.id?.toString();

        if (!eventId) {
            router.push('/events');
            return;
        }

        const eventDetails = await EventService.row(eventId) as IEvent;
        rawEvent.value = eventDetails;

        participants.value = eventDetails.participations as IParticipation<IOperator>[];

        // const rawVisitors = (eventDetails.visitor_participations || []) as IVisitorParticipationDetail[];
        // visitorParticipants.value = rawVisitors.map((vp) => ({
        //     ...vp,
        //     visitor: {
        //         ...vp.visitor,
        //         operator: getOperator(vp.visitor.operator) || ({} as IOperator)
        //     }
        // })) as IVisitorParticipation<IVisitor<IOperator>>[];

        visitorParticipants.value = eventDetails.visitor_participations as IVisitorParticipationDetail[];

        carpools.value = eventDetails.carpools as ICarpool<IVehicle<string>>[];
        const carpoolIds = carpools.value.map(c => c.$id);

        const [requestsData, vehiclesData, visitorsData] = await Promise.all([
            carpoolIds.length > 0 ? CarpoolRequestService.listByCarpools(carpoolIds) : [],
            VehicleService.listByOperator(operator.$id),
            VisitorService.list()
        ]);

        requests.value = requestsData as ICarpoolRequest<IOperator, ICarpoolDetail>[];
        vehicles.value = vehiclesData as IVehicle[];
        visitors.value = visitorsData as IVisitor<IOperator>[];

        isConfirmed.value = participants.value.some(p => p.operator.$id === operator.$id);

    } catch (error) {
        console.error("Erro ao carregar dados da missão:", error);
        toast.add({
            severity: 'error',
            summary: 'Erro de Carregamento',
            detail: 'Não foi possível carregar os detalhes da missão.',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

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
            const newParticipation = await EventService.createParticipation(event.value.$id, operator.$id);

            participants.value.push({
                ...newParticipation,
                operator: operator
            });
            isConfirmed.value = true;

            toast.add({ severity: 'success', summary: 'Confirmado!', detail: 'Presença confirmada!', life: 3000 });

            confirm.require({
                message: 'Deseja adicionar este evento a sua agenda?',
                header: 'Agenda Tática',
                acceptLabel: 'Sim, adicionar',
                rejectLabel: 'Agora não',
                rejectProps: {
                    label: 'Não',
                    severity: 'secondary',
                    outlined: true
                },
                acceptProps: {
                    label: 'Sim',
                    severity: 'danger'
                },
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

const availableVisitors = computed(() => {
    const alreadyInEventIds = visitorParticipants.value.map(p => p.visitor.$id);
    return visitors.value.filter(v => !alreadyInEventIds.includes(v.$id));
});

const addVisitorParcipations = async () => {
    try {
        const eventId = event.value.$id;

        const promises = selectedVisitors.value.map(visitor =>
            EventService.addVisitorToEvent(eventId, visitor.$id)
        )

        const participations = await Promise.all(promises) as IVisitorParticipation<IVisitor<IOperator>>[];
        const participationsHydrated: IVisitorParticipationDetail[] = participations.map((vp) => ({
            ...vp,
            visitor: {
                ...vp.visitor,
                operator: vp.visitor.operator.$id
            }
        }));

        visitorParticipants.value.push(...participationsHydrated);

        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: `${selectedVisitors.value.length} visitantes adicionados!`,
            life: 3000
        });

        selectedVisitors.value = [];
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Erro ao vincular visitantes', life: 3000 });
    } finally {
        openVisitorDialog.value = false;
    }
};

const deleteVisitorParticipation = async (participationId: string, visitor: IVisitor) => {
    confirm.require({
        message: `Deseja remover o visitante ${visitor.codename} da lista?`,
        header: 'Remover Visitante',
        acceptLabel: 'Sim',
        rejectLabel: 'Não',
        rejectProps: {
            label: 'Não',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Sim',
            severity: 'danger'
        },
        accept: async () => {
            await EventService.deleteVisitorParticipation(participationId);
            visitorParticipants.value = visitorParticipants.value.filter(v => v.$id !== participationId);

            toast.add({ severity: 'success', summary: 'Visitante removido da lista!', life: 3000 });
        }
    });
}

const checkInVisitor = async (participationId: string) => {
    confirm.require({
        message: `Deseja confirmar a presença do visitante?`,
        header: 'Confirmar Presença',
        acceptLabel: 'Sim',
        rejectLabel: 'Não',
        rejectProps: {
            label: 'Não',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Sim',
            severity: 'danger'
        },
        accept: async () => {
            await EventService.confirmVisitorAttendance(participationId);
            const visitorParticipantion = visitorParticipants.value.find(v => v.$id === participationId);

            if (visitorParticipantion) visitorParticipantion.checked_in = true;

            toast.add({ severity: 'success', summary: 'Presença confirmada do visitante!', life: 3000 });

            if (navigator.vibrate) navigator.vibrate(200);
            playBeep();
        }
    });
};

const requestCarpool = async (carpool: ICarpool<IVehicle<string>>) => {
    try {
        const { $id, vehicle, departure_point, departure_time } = carpool;
        const { codename, phone } = getOperator(vehicle.driver) as IOperator;

        const response = await CarpoolRequestService.create($id, operator.$id) as ICarpoolRequest<IOperator, ICarpool<IVehicle>>;

        requests.value.push({
            ...response,
            carpool
        });

        const message = `Fala ${codename}, solicitei uma vaga na sua carona pelo App do Êxodo para o evento *${event.value.title}* (Saída: ${departure_point} às ${departure_time}). Pode confirmar lá pra mim?`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

        window.open(url, "_blank");

        toast.add({ severity: 'info', summary: 'Solicitado', detail: 'Pedido enviado e WhatsApp aberto!', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao solicitar vaga.', life: 3000 });
    }
};

const handleUpdateStatus = async (request: ICarpoolRequest<IOperator, ICarpool<IVehicle>>, status: 'accepted' | 'rejected') => {
    try {
        await CarpoolRequestService.updateStatus(request.$id, status);

        request.status = status;

        if (status === 'accepted') {
            const carpool = carpools.value.find(carpool => carpool.$id === request.carpool.$id)!;

            carpool.available_seats--

            await CarpoolService.updateSeats(carpool.$id, carpool.available_seats);

            toast.add({ severity: 'success', summary: 'Confirmado!', detail: 'Carona confirmada!', life: 3000 });
        } else {
            toast.add({ severity: 'info', summary: 'Rejeitado!', detail: 'Carona rejeitada!', life: 3000 });
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Erro ao atualizar' });
    }
};

const canRequest = (carpool: ICarpool<IVehicle>) => {
    const isOwner = carpool.vehicle.driver === operator.$id;
    const hasPendingOrAccepted = requests.value.some(r =>
        r.carpool.$id === carpool.$id &&
        r.requester.$id === operator.$id &&
        r.status !== 'rejected'
    );

    return !isOwner && !hasPendingOrAccepted;
};

const getOperator = (id: string) => operatorsMap.value.get(id);
const getOperatorName = (id: string) => operatorsMap.value.get(id)?.codename || 'Desconhecido';
</script>

<style scoped>
.scanner-viewport {
    /* height: 450px; */
    display: flex;
    flex-direction: column;
}

.scanner-overlay {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    z-index: 1;
    padding-block: 2rem;
    background: transparent;
    position: relative;
}

.scanner-frame {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 260px;
    height: 260px;
    border: 0.5rem solid;
    border-image: linear-gradient(to bottom right, var(--p-blue-500), var(--p-red-500), var(--p-yellow-500), var(--p-yellow-500), var(--p-red-500), var(--p-blue-500)) 1;
    box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.4);
    pointer-events: none;
    z-index: 2;
}

.scanner-instructions {
    text-align: center;
    color: white;
    z-index: 2;
    padding: 0 2rem;
    font-weight: 500;
}

/* Estilo do SelectButton (Alternador Frontal/Traseira) */
:deep(.col-4, col-6, .col-12) {
    padding: 0 !important;
}

:deep(.exodo-camera-switch) {
    z-index: 3;
}
</style>