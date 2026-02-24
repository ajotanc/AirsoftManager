<template>
    <EventSkeleton v-if="loading" />
    <div v-else class="p-3">
        <div class="border-bottom-1 border-black-alpha-20 pb-4 mb-4">
            <div class="grid">
                <div class="col-12">
                    <div
                        class="flex flex-column justify-content-between align-items-start md:flex-row md:align-items-center gap-2">
                        <h1 class="text-4xl font-bold uppercase m-0">
                            {{ event.title }}
                        </h1>
                        <Tag v-if="event.is_finished" value="Finalizado" icon="pi pi-check-circle" severity="warn" />
                    </div>
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
                    <p class="flex flex-column md:flex-row text-gray-500 gap-2">
                        <span class="flex align-items-center gap-2"><i class="pi pi-calendar"></i> {{
                            formatDate(event.date).toLocaleDateString('pt-BR') }} - {{
                                event.startTime }} às {{ event.endTime }}</span>
                        <span v-if="isConfirmed" class="flex align-items-center gap-2 text-green-400 font-bold">
                            <i class=" pi pi-check-circle text-green-400"></i>Presença Confirmada
                        </span>
                    </p>
                    <p class="flex flex-column md:flex-row text-gray-500 gap-2">
                        <span class="flex align-items-center gap-2"><i class="ri-user-3-line"></i> <strong>Efetivo
                                Mínimo:</strong> {{
                                    event.minimum_effective }} <i class="ri-group-3-line"></i> <strong>Efetivo
                                Atual:</strong> {{ totalParticipants }}/{{
                                    event.minimum_effective }}</span>
                    </p>
                </div>
                <div class="col-12">
                    <div class="flex flex-column md:flex-row gap-2">
                        <div v-if="!isFinished" class="flex flex-column md:flex-row gap-2">
                            <Button v-if="isConfirmed" label="Cancelar Presença" icon="pi pi-times" severity="error"
                                @click="toggleParticipation" />
                            <Button v-else label="Confirmar Presença" icon="pi pi-plus-circle" severity="primary"
                                @click="toggleParticipation" />
                            <Button v-if="isConfirmed" label="Adicionar à Agenda" icon="pi pi-calendar-plus"
                                severity="help" @click="handleCalendarDynamic" />
                        </div>
                        <div class="flex gap-2">
                            <ButtonShare :event="event" icon="pi pi-copy" outlined v-tooltip.top="'Copiar Missão'" />
                            <ButtonShare :event="event" :share="true" icon="pi pi-share-alt" outlined
                                v-tooltip.top="'Compartilhar'" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="grid">
            <div class="col-12 md:col-8">
                <Card class="border-1 border-black-alpha-10 mb-4">
                    <template #content>
                        <Image v-if="event.thumbnail" :src="event.thumbnail" :alt="event.title"
                            class="overflow-hidden border-round" imageClass="w-full" preview />
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
                        <div v-if="isAdmin || isAdministrativeManagement" class="buttons flex flex-column gap-2 mb-3">
                            <Button v-if="canFinalize" label="Finalizar" icon="pi pi-check" severity="secondary"
                                class="w-full" @click="finalizeEvent" :disabled="isFinished" />
                            <Button label="Check-in QR Code" icon="pi pi-qrcode" class="w-full" severity="success"
                                @click="openScannerDialog = true" :disabled="isFinished" />
                            <Button label="Adicionar Visitante" icon="pi pi-plus" class="w-full" severity="info"
                                :disabled="availableVisitors.length === 0 || isFinished || !isConfirmed"
                                @click="newVisitor" />
                        </div>
                        <h4 class="text-sm uppercase text-gray-500 border-bottom-1 border-white-alpha-10 mt-0 pb-2">
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
                                        <span class="font-bold"
                                            :class="{ 'text-green-400': checked_in, 'text-red-400': event.is_finished && !checked_in }">{{
                                                operator.codename }}</span>
                                        <i v-if="isFinished && checked_in"
                                            class="pi pi-check text-green-300 ml-auto"></i>
                                        <i v-else-if="isFinished && !checked_in"
                                            class="pi pi-times text-red-300 ml-auto"></i>
                                    </div>
                                    <Empty v-else label=" Nenhum operador participando dessa missão."
                                        icon="pi pi-users" />
                                </TabPanel>
                                <TabPanel :value="1">
                                    <div v-if="visitorParticipants.length > 0"
                                        v-for="{ $id, visitor, checked_in } in visitorParticipants" :key="$id"
                                        class="flex align-items-center gap-3 mb-3">
                                        <Avatar :label="visitor.name[0]" shape="circle" size="small" />
                                        <div class="flex flex-column">
                                            <span class="font-bold"
                                                :class="{ 'text-green-600': checked_in, 'text-red-400': event.is_finished && !checked_in }">{{
                                                    visitor.codename }} ({{ visitor.team }})</span>
                                            <small class="text-gray-700">Convidado por <strong>{{
                                                getOperatorName(visitor.operator) }}</strong></small>
                                        </div>
                                        <div v-if="!event.is_finished && operator.role === 'admin'"
                                            class="flex gap-1 ml-auto">
                                            <Button icon=" pi pi-check" severity="success" rounded
                                                @click="checkInVisitor($id)" size="small"
                                                v-tooltip.top="'Confirmar Presença'" :disabled="checked_in" />
                                            <Button icon=" pi pi-trash" severity="danger" rounded
                                                @click="deleteVisitorParticipation($id, visitor)" size="small"
                                                v-tooltip.top="'Excluir Presença'" :disabled="checked_in" />
                                        </div>
                                        <i v-if="isFinished && checked_in"
                                            class="pi pi-check text-green-300 ml-auto"></i>
                                        <i v-else-if="isFinished && !checked_in"
                                            class="pi pi-times text-red-300 ml-auto"></i>
                                    </div>
                                    <Empty v-else label="Nenhum visitante adicionado a missão." icon="pi pi-users" />
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </template>
                </Card>
                <Card class="bg-blue-900 border-1 border-white-alpha-10">
                    <template #content>
                        <div v-if="isConfirmed && vehicles.length > 0" class="buttons flex flex-column gap-2 mb-3">
                            <Button label="Adicionar Carona" icon="pi pi-plus" class="w-full" severity="info"
                                @click="newCarpool" :disabled="availableVehicles.length === 0 || isFinished" />
                        </div>
                        <h4 class="text-sm uppercase text-gray-500 border-bottom-1 border-white-alpha-10 mt-0 pb-2">
                            Lista de Caronas
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
                                        class="flex flex-column text-gray-700">
                                        <div class="flex justify-content-between align-items-center">
                                            <div class="flex flex-column gap-2">
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
                                            <div v-if="!isFinished" class="buttons flex align-items-center gap-1">
                                                <Button v-if="!canRequest(carpool)" icon="pi pi-plus" severity="warn"
                                                    rounded @click="requestCarpool(carpool)" size="small"
                                                    v-tooltip.top="'Solicitar Carona'"
                                                    :disabled="carpool.available_seats === 0" />
                                                <template v-if="carpool.vehicle.driver === operator.$id">
                                                    <Button icon="pi pi-pencil" size="small" rounded
                                                        @click="editCarpool(carpool)" v-tooltip.top="'Editar'" />
                                                    <Button icon="pi pi-trash" size="small" severity="danger" rounded
                                                        @click="deleteCarpool(carpool)" v-tooltip.top="'Excluir'" />
                                                </template>
                                            </div>
                                        </div>
                                        <Divider />
                                    </div>
                                    <Empty v-else label="Nenhuma carona para esta missão ainda." icon="pi pi-car" />
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
                                    <Empty v-else label="Nenhuma carona solicitada foi aceita."
                                        icon="pi pi-list-check" />
                                </TabPanel>
                                <TabPanel :value="2">
                                    <div v-if="carpoolRequests.length > 0" v-for="request in carpoolRequests"
                                        :key="request.$id"
                                        class="flex text-gray-700 justify-content-between align-items-center gap-3 mb-3">
                                        <span class="text-sm font-bold">{{ request.requester.codename }}</span>
                                        <div v-if="!isFinished" class="flex gap-2">
                                            <Button icon="pi pi-check" severity="success" rounded size="small"
                                                @click="handleUpdateStatus(request, 'accepted')"
                                                v-tooltip.top="'Aceitar'" />
                                            <Button icon="pi pi-times" severity="danger" rounded size="small"
                                                @click="handleUpdateStatus(request, 'rejected')"
                                                v-tooltip.top="'Rejeitar'" />
                                        </div>
                                    </div>
                                    <Empty v-else label="Nenhum solicitão foi enviada." icon="pi pi-list" />
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </template>
                </Card>
            </div>
        </div>

        <AppScanner v-model:visible="openScannerDialog" @detect="onDetect" header="Check-in de Operador" />

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
                    <Button type="submit" label="Salvar" class="w-full" severity="success" />
                </div>
            </Form>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Divider, InputMask, InputNumber, InputText, Select, useConfirm } from "primevue";
import { useToast } from "primevue/usetoast";
import { atcb_action } from 'add-to-calendar-button';
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
import Empty from '@/components/Empty.vue';
import { useOperator } from '@/composables/useOperator';
import AppScanner from '@/components/AppScanner.vue';

const route = useRoute();
const toast = useToast();
const confirm = useConfirm();

const { operator, isAdmin, authStore: { isAdministrativeManagement } } = useOperator();

const rawEvent = ref<IEvent>({} as IEvent);
const participants = ref<IParticipation<IOperator>[]>([]);
const visitorParticipants = ref<IVisitorParticipationDetail[]>([]);

const visitors = ref<IVisitor<IOperator>[]>([]);
const selectedVisitors = ref<IVisitor<IOperator>[]>([]);

const carpools = ref<ICarpool<IVehicle<string>>[]>([]);

const requests = ref<ICarpoolRequest<IOperator, ICarpoolDetail>[]>([]);

const hasCarpools = computed(() => carpools.value.some(carpool => carpool.vehicle.driver === operator.value.$id));
const isFinished = computed(() => event.value.is_finished);

const carpoolAccepteds = computed(() => requests.value.filter(request => request.status === 'accepted'));
const carpoolRequests = computed(() => {
    return requests.value.filter(request => {
        if (request.status !== 'pending') return false;
        return request.carpool.vehicle.driver === operator.value.$id;
    });
});

const event = computed(() => {
    return {
        ...rawEvent.value,
        participations: participants.value,
        visitor_participations: visitorParticipants.value
    };
});

const totalParticipants = computed(() => {
    return participants.value.length + visitorParticipants.value.length;
});

const canFinalize = computed(() => {
    if (!event.value?.date || !event.value?.endTime) {
        return false;
    }

    const { endTime, date, minimum_effective } = event.value;

    const endDateTime = new Date(date.toString().split('T')[0] + 'T00:00:00');

    const [hours, minutes] = endTime.toString().split(':').map(Number);
    endDateTime.setHours(hours!, minutes!, 0, 0);

    const now = new Date();

    const expiredTime = now > endDateTime;
    const effective = totalParticipants.value < minimum_effective;

    return expiredTime || effective;
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
        .trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (00:00 - 23:59)"),
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
    const vehicle = availableVehicles.value.find(v => v?.$id === vehicleId)!;
    return vehicle.total_seats;
};
// CARPOOLS

const newVisitor = () => {
    selectedVisitors.value = [];
    openVisitorDialog.value = true;
};

async function onDetect(operatorId?: string) {
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

const checkinsCount = computed(() => (participants.value.filter(p => p.checked_in).length || 0) + (visitorParticipants.value.filter(p => p.checked_in).length || 0));

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
        visitorParticipants.value = eventDetails.visitor_participations as IVisitorParticipationDetail[];
        carpools.value = eventDetails.carpools as ICarpool<IVehicle<string>>[];

        const carpoolIds = carpools.value.map(c => c.$id);

        const [requestsData, vehiclesData, visitorsData] = await Promise.all([
            carpoolIds.length > 0 ? CarpoolRequestService.listByCarpools(carpoolIds) : [],
            VehicleService.listByOperator(operator.value.$id),
            VisitorService.list()
        ]);

        requests.value = requestsData as ICarpoolRequest<IOperator, ICarpoolDetail>[];
        vehicles.value = vehiclesData as IVehicle[];
        visitors.value = visitorsData as IVisitor<IOperator>[];

        isConfirmed.value = participants.value.some(p => p.operator.$id === operator.value.$id);

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
            const userParticipation = participants.value.find(p => p.operator.$id === operator.value.$id);
            if (userParticipation?.$id) {
                await EventService.deleteParticipation(userParticipation.$id);

                participants.value = participants.value.filter(p => p.$id !== userParticipation.$id);
                isConfirmed.value = false;

                toast.add({ severity: 'info', summary: 'Cancelado', detail: 'Sua presença foi removida.', life: 3000 });
            }
        } else {
            const newParticipation = await EventService.createParticipation(event.value.$id, operator.value.$id);

            participants.value.push({
                ...newParticipation,
                operator: operator.value
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

        const response = await CarpoolRequestService.create($id, operator.value.$id) as ICarpoolRequest<IOperator, ICarpool<IVehicle>>;

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

    if (hasCarpools.value) return false;

    const isOwner = carpool.vehicle.driver === operator.value.$id;

    const hasPendingOrAccepted = requests.value.some(r =>
        r.carpool.$id === carpool.$id &&
        r.requester.$id === operator.value.$id &&
        r.status !== 'rejected'
    );

    return !isOwner && !hasPendingOrAccepted;
};

const finalizeEvent = async () => {
    try {
        await EventService.finalize(event.value.$id);
        rawEvent.value.is_finished = true;

        toast.add({ severity: 'success', summary: 'Missão finalizada!', detail: 'A missão foi finalizada com sucesso.', life: 3000 });
    } catch (error) {
        console.error("Erro ao finalizar evento:", error);
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível finalizar o evento.', life: 3000 });
    }
};


const getOperator = (id: string) => operatorsMap.value.get(id);
const getOperatorName = (id: string) => operatorsMap.value.get(id)?.codename || 'Desconhecido';
</script>