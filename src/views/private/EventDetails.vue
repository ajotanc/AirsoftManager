<template>
    <EventSkeleton v-if="loading" />
    <div v-else class="p-3">
        <div class="border-bottom-1 border-black-alpha-20 pb-4 mb-4">
            <div class="grid">
                <div class="col-12">
                    <div
                        class="flex flex-column justify-content-between align-items-start md:flex-row md:align-items-center gap-2">
                        <h1 class="text-4xl font-bold uppercase m-0 break-words">
                            <i
                                :class="['text-4xl', event.is_finished ? 'ri-checkbox-fill text-green-400' : 'ri-checkbox-indeterminate-fill text-red-600']"></i>
                            {{ event.title }}
                        </h1>
                        <Tag v-if="event.is_finished" value="Finalizado" icon="pi pi-check-circle" severity="warn" />
                    </div>
                </div>
                <div class="col-12">
                    <div class="flex align-items-center">
                        <div class="types-tags">
                            <Tag v-for="t in event.types" :key="t"
                                :value="EVENT_TYPES[t as keyof typeof EVENT_TYPES] || 'Padrão'" severity="contrast" />
                            <Tag v-if="event.rule" :value="event.rule" />
                        </div>
                        <div class="flex flex-column align-items-end justify-content-end ml-auto">
                            <span class="text-3xl font-bold text-primary-500">{{ checkinsCount }}</span>
                            <span class="text-xs text-gray-500 uppercase font-bold ">Check-ins</span>
                        </div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="flex flex-column md:flex-row text-gray-500 gap-2">
                        <span class="flex align-items-center gap-2"><i class="pi pi-calendar"></i> {{
                            formatDate(event.date).toLocaleDateString('pt-BR') }} - {{
                                event.startTime }} às {{ event.endTime }}</span>
                        <span v-if="isConfirmed" class="flex align-items-center gap-2 text-green-400 font-bold">
                            <i class=" pi pi-check-circle text-green-400"></i>Presença Confirmada
                        </span>
                    </div>
                    <div class="flex flex-column md:flex-row text-gray-500 gap-2 pt-2">
                        <span class="flex align-items-center gap-2"><i class="ri-user-3-line"></i> <strong>Efetivo
                                Mínimo:</strong> {{
                                    event.minimum_effective }} <i class="ri-group-3-line"></i> <strong>Efetivo
                                Atual:</strong> {{ totalParticipants }}/{{
                                    event.minimum_effective }}
                        </span>
                    </div>
                </div>
                <div v-if="isFinished" class="col-12">
                    <Rating :modelValue="averageFeedback" :stars="5" readonly />
                </div>
                <div class="col-12">
                    <div class="flex flex-column md:flex-row gap-2">
                        <template v-if="!isFinished">
                            <Button v-if="isConfirmed" label="Cancelar Presença" icon="pi pi-times" severity="error"
                                @click="toggleParticipation" class="w-auto" />
                            <Button v-else label="Confirmar Presença" icon="pi pi-plus-circle" severity="primary"
                                @click="toggleParticipation"
                                :disabled="deadlineInfo.isOver || isBlockedByPendingPayment" class="w-auto" />
                            <Button v-if="isConfirmed" label="Adicionar à Agenda" icon="pi pi-calendar-plus"
                                severity="help" @click="handleCalendarDynamic" class="w-auto" />
                        </template>
                        <div class="flex flex-row gap-2">
                            <ButtonShare :event="event" icon="pi pi-copy" outlined v-tooltip.top="'Copiar Missão'" />
                            <ButtonShare :event="event" :share="true" icon="pi pi-share-alt" outlined
                                v-tooltip.top="'Compartilhar'" />
                        </div>
                        <Button v-if="isFinished" label="Feedback" icon="pi pi-star" severity="warn"
                            @click="addFeedback" :disabled="hasRating" class="w-auto" />
                        <div v-if="hasPendingSchoolCerts"
                            class="flex gap-2 align-items-center p-2 md:py-0 md:px-3 border-1 border-yellow-400 bg-yellow-100 text-yellow-900 border-round text-sm cursor-pointer"
                            @click="$router.push('/administrative/school')">
                            <span><strong>Atenção Escola {{ NAME }}:</strong> Você tem {{
                                authStore.missingCertifications.length }} certificação(ões)
                                pendente(s). <span class="font-bold">Regularize para manter seu acesso em dia (3
                                    min)</span>.</span>
                        </div>
                        <div v-if="isBlockedByPendingPayment"
                            class="flex gap-2 align-items-center p-2 md:py-0 md:px-3 border-1 border-red-400 bg-red-100 text-red-900 border-round text-sm cursor-pointer"
                            @click="$router.push('/administrative/finance/payments')">
                            <span><i class="pi pi-exclamation-triangle mr-1"></i><strong>Pendência Financeira:</strong>
                                Você possui mensalidade
                                em atraso e não pode se inscrever em Eventos. <span class="font-bold">Regularize para
                                    liberar sua
                                    presença</span>.</span>
                        </div>
                        <div v-if="event.list_open && !isFinished"
                            class="flex gap-2 align-items-center p-2 md:py-0 md:px-3 border-1 border-amber-300 bg-amber-100 text-amber-900 border-round text-sm">
                            <span><i class="pi pi-unlock mr-1"></i><strong>Lista Extra Liberada:</strong> A lista de
                                participantes foi aberta
                                extraordinariamente pela administração.</span>
                        </div>
                        <div v-else-if="deadlineInfo.isOver && !isFinished"
                            class="flex gap-2 align-items-center p-2 md:py-0 md:px-3 border-1 border-red-300 bg-red-100 text-red-800 border-round text-sm">
                            <span><strong>Inscrições Encerradas:</strong> O limite para confirmação de efetivo foi até
                                <span class="font-bold">{{ deadlineInfo.formatted }}</span>. A lista de operação já está
                                consolidada.</span>
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
                            class="overflow-hidden border-round w-full" imageClass="w-full" preview />
                        <h2 class="uppercase text-gray-500 border-bottom-1 border-gray-300 pb-2">
                            Briefing da Missão
                        </h2>
                        <div class="text-html" v-html="event.description"></div>
                    </template>
                </Card>
                <Card class="bg-blue-900 border-1 border-white-alpha-10">
                    <template #content>
                        <h4 class="text-sm uppercase text-gray-500 border-bottom-1 border-white-alpha-10 mt-0 pb-2">
                            Localização
                        </h4>
                        <div class="p-3 border-round bg-gray-50 flex justify-content-between align-items-center">
                            <span>{{ event.location }}</span>
                            <Button icon="pi pi-map-marker" label="Abrir no Maps" @click="openMaps" severity="warning"
                                text />
                        </div>
                        <div v-if="mapUrl" class="mt-3 border-round overflow-hidden" style="height: 300px">
                            <iframe width="100%" height="100%" frameborder="0" style="border:0;" :src="mapUrl"
                                allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"
                                sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
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
                            <Button label="Check-in" icon="pi pi-qrcode" class="w-full" severity="success"
                                @click="openScannerDialog = true" :disabled="!canCheckin" />
                            <Button label="Adicionar Convidado" icon="pi pi-plus" class="w-full" severity="info"
                                :disabled="availableVisitors.length === 0 || isFinished || !isConfirmed"
                                @click="newVisitor" />
                            <Button :label="event.list_open ? 'Fechar Lista Extra' : 'Liberar Lista Extra'"
                                :icon="event.list_open ? 'pi pi-lock' : 'pi pi-unlock'"
                                :severity="event.list_open ? 'warn' : 'help'" class="w-full" :disabled="isFinished"
                                @click="toggleListOpen" />
                        </div>
                        <h4 class="text-sm uppercase text-gray-500 border-bottom-1 border-white-alpha-10 mt-0 pb-2">
                            Lista de Operadores
                        </h4>
                        <Tabs :value="0">
                            <TabList>
                                <Tab :value="0">Operadores ({{ participants.length }})</Tab>
                                <Tab :value="1">Convidados ({{
                                    guestParticipants.length }})</Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel :value="0">
                                    <div v-if="participants.length > 0">
                                        <div v-for="{ $id, operator, checked_in } in participants" :key="$id"
                                            class="flex align-items-center gap-3 mb-2 p-2 border-round">

                                            <Avatar :image="operator.avatar"
                                                :icon="!operator.avatar ? 'pi pi-user' : ''" shape="circle" />

                                            <div class="flex flex-column gap-1">
                                                <span class="font-bold line-height-1" :class="{
                                                    'text-green-500': checked_in,
                                                    'text-red-400': isFinished && !checked_in,
                                                    'text-700': !isFinished && !checked_in
                                                }">
                                                    {{ getDisplayName(operator) }}
                                                </span>
                                                <small v-if="operator.role === 'visitor'"
                                                    class="text-gray-600 uppercase text-xs">
                                                    Visitante
                                                </small>
                                            </div>

                                            <div class="ml-auto">
                                                <template v-if="isFinished">
                                                    <Tag :severity="checked_in ? 'success' : 'danger'"
                                                        :icon="checked_in ? 'ri-check-double-line' : 'ri-close-line'"
                                                        :value="checked_in ? 'Presente' : 'Faltou'" rounded />
                                                </template>
                                                <template v-else>
                                                    <i v-if="checked_in"
                                                        class="ri-check-double-line text-green-500 text-xl"></i>
                                                    <Button v-else-if="canManualCheckin" icon="ri-rfid-line"
                                                        severity="secondary" rounded size="small"
                                                        @click="onDetect(operator.$id)"
                                                        v-tooltip.top="'Realizar Check-in Manualmente'" />
                                                </template>
                                            </div>
                                        </div>
                                    </div>

                                    <Empty v-else label="Nenhum operador nesta missão." icon="pi pi-users" />
                                </TabPanel>
                                <TabPanel :value="1">
                                    <div v-if="guestParticipants.length > 0">
                                        <div v-for="{ $id, guest, checked_in } in guestParticipants" :key="$id"
                                            class="flex align-items-center gap-3 mb-2 p-2 border-round">
                                            <div class="flex flex-column gap-1">
                                                <span class="font-bold line-height-1" :class="{
                                                    'text-green-600': checked_in,
                                                    'text-red-400': isFinished && !checked_in
                                                }">
                                                    {{ guest.codename }} ({{ guest.team || 'Independente' }})
                                                </span>

                                                <small class="text-500">
                                                    Convidado por <strong class="text-700">{{
                                                        getOperatorName(guest.operator) }}</strong>
                                                </small>
                                            </div>

                                            <div v-if="!event.is_finished && isAdmin" class="flex gap-2 ml-auto">
                                                <Button icon="pi pi-check" severity="success" rounded text
                                                    @click="checkInVisitor($id)" :disabled="checked_in"
                                                    v-tooltip.top="'Confirmar Presença'" />
                                                <Button icon="pi pi-trash" severity="danger" rounded text
                                                    @click="deleteVisitorParticipation($id, guest)"
                                                    :disabled="checked_in" v-tooltip.top="'Excluir'" />
                                            </div>

                                            <div v-if="isFinished" class="ml-auto">
                                                <Tag :severity="checked_in ? 'success' : 'danger'"
                                                    :icon="checked_in ? 'ri-check-double-line' : 'ri-close-line'"
                                                    :value="checked_in ? 'Presente' : 'Faltou'" rounded />
                                            </div>
                                            <i v-else-if="checked_in && !isAdmin"
                                                class="ri-check-double-line text-green-500 ml-auto"></i>
                                        </div>
                                    </div>

                                    <Empty v-else label="Nenhum visitante adicionado à missão." icon="pi pi-users" />
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                        <div v-if="isAdmin || isAdministrativeManagement" class="actions">
                            <h4 class="text-sm uppercase text-gray-500 border-bottom-1 border-white-alpha-10 mt-3 pb-2">
                                Acesso Rápido
                            </h4>
                            <div class="buttons">
                                <Button label="Ficha Médica" icon="ri-health-book-line" severity="danger"
                                    @click="exportHealth" />
                            </div>
                        </div>
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
                                        class="flex flex-column">
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
                                                        :style="{ backgroundColor: `#${carpool.vehicle.color}`, width: '0.9rem', height: '0.9rem' }"></i>
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
                                                <Button v-if="canRequest(carpool)" icon="pi pi-plus" severity="warn"
                                                    rounded @click="requestCarpool(carpool)" size="small"
                                                    v-tooltip.top="'Solicitar Carona'"
                                                    :disabled="carpool.available_seats === 0 || !isConfirmed" />
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
                                        v-for="({ $id, requester, carpool: { vehicle } }, _index) in carpoolAccepteds"
                                        :key="$id" class="flex align-items-center text-sm mb-1">
                                        <div class="w-full">
                                            <strong>{{ getOperatorName(vehicle.driver) }}</strong> aceitou a
                                            solicitação de <strong>{{
                                                requester.codename }}</strong> no veículo {{ vehicle.model
                                                }}
                                        </div>
                                        <div v-if="vehicle.color" class="border-1 border-circle ml-auto"
                                            :style="{ backgroundColor: `#${vehicle.color}`, width: '0.9rem', height: '0.9rem' }">
                                        </div>
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
            <div v-if="isFinished" class="col-12 md:col-8 mt-2">
                <Card class="bg-blue-900 border-1 border-white-alpha-10">
                    <template #content>
                        <h4 class="text-sm uppercase text-gray-500 border-bottom-1 border-white-alpha-10 mt-0 pb-2">
                            Feedbacks ({{ feedbacks.length }})
                        </h4>
                        <div v-if="feedbacks.length > 0" v-for="feedback in feedbacks" :key="feedback.$id"
                            class="flex flex-column gap-2 bg-gray-100 p-3 text-gray-700"
                            :class="{ 'mb-3': feedbacks.length > 1 }">
                            <div class="flex gap-2">
                                <Avatar :image="feedback.operator.avatar"
                                    :icon="!feedback.operator.avatar ? 'pi pi-user' : undefined" shape="circle" />
                                <div class="flex flex-column">
                                    <span class="text-sm font-bold uppercase">{{ getShortName(feedback.operator.name)
                                        }}</span>
                                    <span class="text-xs uppercase">{{ feedback.operator.codename }}</span>
                                </div>
                            </div>
                            <span class="py-2 text-sm">{{ feedback.comment }}</span>
                            <div class="flex align-items-center justify-content-between">
                                <div class="flex align-items-center gap-2 text-xs">
                                    <Rating :modelValue="feedback.stars" :stars="5" readonly class="feedback" />
                                    <span>·</span>
                                    <span>{{ dayjs(feedback.$updatedAt).format('DD/MM/YYYY') }}</span>
                                    <div v-if="feedback.operator.$id === operator.$id" class="flex gap-1">
                                        <span class="pi pi-pencil text-xs cursor-pointer"
                                            @click="editFeedback(feedback)"></span>
                                        <span class="pi pi-trash text-xs text-red-500 cursor-pointer"
                                            @click="deleteFeedback(feedback)"></span>
                                    </div>
                                </div>
                                <div class="flex align-items-center gap-1">
                                    <span class="text-xs">{{ feedback.likes.length }}</span>
                                    <span
                                        class="pi text-xs text-red-500 cursor-pointer transition-transform active:scale-150"
                                        :class="{
                                            'pi-heart-fill': feedback.likes?.includes(operator.$id),
                                            'pi-heart': !feedback.likes?.includes(operator.$id)
                                        }" @click="handleToggleLike(feedback)" />
                                </div>
                            </div>
                        </div>
                        <div v-else class="flex flex-column gap-2 bg-gray-100 p-3 text-gray-700">
                            <Empty label="Nenhum feedback para esta missão." icon="pi pi-star" />
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <AppScanner v-model:visible="openScannerDialog" @detect="onDetect" header="Check-in de Operador" />

        <Dialog v-model:visible="openVisitorDialog" header="Adicionar Convidados" modal
            :style="{ width: '90vw', maxWidth: '375px' }">
            <div class="col-12">
                <FloatLabel variant="in">
                    <MultiSelect v-model="selectedVisitors" :options="availableVisitors" optionLabel="codename" filter
                        :maxSelectedLabels="3" class="w-full" display="chip">
                        <template #option="slotProps">
                            <div class="flex flex-column">
                                <span class="font-bold">{{ getShortName(slotProps.option.name) }} ({{
                                    slotProps.option.codename
                                    }})</span>
                                <small class="text-gray-500">Convidado por {{
                                    slotProps.option.operator.codename }}</small>
                            </div>
                        </template>
                        <template #empty>Nenhum visitante disponível</template>
                    </MultiSelect>
                    <label>Convidados</label>
                </FloatLabel>
                <Button label="Adicionar Convidados" icon="pi pi-check-circle" severity="success" class="w-full mt-2"
                    :disabled="selectedVisitors.length === 0" @click="addVisitorParcipations" />
            </div>
        </Dialog>

        <Dialog v-model:visible="openCarpoolDialog" header="Veículo" modal
            :style="{ width: '90vw', maxWidth: '667px' }">
            <Form :resolver="resolverCarpool" :initialValues="selectedCarpool" @submit="saveCarpool" class="grid"
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

        <AppFormDialog v-model:visible="openFeedbackDialog" :initialValues="selectedFeedback"
            :resolver="resolverFeedback" :fields="eventRatingFields" header="Feedback" @submit="saveFeedback" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Divider, InputMask, InputNumber, InputText, Rating, Select, Textarea, useConfirm } from "primevue";
import dayjs from 'dayjs';
import { useToast } from "primevue/usetoast";
import { atcb_action } from 'add-to-calendar-button';
import { EventService, type IEvent, type IParticipation, type IGuestParticipation, type IGuestParticipationDetail } from '@/services/event';
import { DEADLINE_HOUR, EVENT_TYPES, TEAM_NAME, DUE_DATE, NAME } from '@/constants/airsoft';
import { export2Excel, formatDate, normalizeEventTypes, playBeep, type IFields, getShortName, invoice } from '@/functions/utils';
import type { ATCBActionEventConfig } from 'add-to-calendar-button';

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
import { GuestService, type IGuest } from '@/services/guest';
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
import { FeedbackService, type IFeedback } from '@/services/feedback';
import AppFormDialog from '@/components/AppFormDialog.vue';
import { formatCPF, formatPhone } from '@brazilian-utils/brazilian-utils';

const route = useRoute();
const toast = useToast();
const confirm = useConfirm();

const { operator, isAdmin, authStore } = useOperator();
const { isAdministrativeManagement } = authStore;

const rawEvent = ref<IEvent>({} as IEvent);
const participants = ref<IParticipation<IOperator>[]>([]);
const guestParticipants = ref<IGuestParticipationDetail[]>([]);

const guests = ref<IGuest<IOperator>[]>([]);
const selectedVisitors = ref<IGuest<IOperator>[]>([]);

const carpools = ref<ICarpool<IVehicle<string>>[]>([]);

const requests = ref<ICarpoolRequest<IOperator, ICarpoolDetail>[]>([]);

const selectedFeedback = ref<IFeedback>({} as IFeedback);
const feedbacks = ref<IFeedback<IOperator, string>[]>([]);

const pendingPayments = computed(() => {
    const payments = operator.value.payments || [];

    return payments.some(payment => {
        const isMonthlyFee = payment.category === 'monthly_fee';
        const isPending = payment.status === 'created';

        if (!isMonthlyFee || !isPending) return false;

        if (payment.due_date) {
            return dayjs().isAfter(dayjs(payment.due_date), 'day');
        }

        const isPastDueDay = dayjs().date() > DUE_DATE;
        const isInvoiceOverdue = invoice(payment).overdue;

        return isPastDueDay || isInvoiceOverdue;
    });
});

const isBlockedByPendingPayment = computed(() => {
    const isEvent = event.value.types?.some(t => Number(t) === 2)
    return pendingPayments.value && isEvent;
});

const averageFeedback = computed(() => {
    if (feedbacks.value.length === 0) return 0;
    const sum = feedbacks.value.reduce((acc, curr) => acc + curr.stars, 0);
    return Number((sum / feedbacks.value.length).toFixed(1));
});

const hasRating = computed(() => feedbacks.value.some(feedback => feedback.operator.$id === operator.value.$id));
const hasCarpools = computed(() => carpools.value.some(carpool => carpool.vehicle.driver === operator.value.$id));
const isFinished = computed(() => event.value.is_finished);
const hasPendingSchoolCerts = computed(() => {
    return !authStore.isVisitor && (authStore.missingCertifications?.length ?? 0) > 0 && !isFinished.value;
});

const canCheckin = computed(() => {
    if (loading.value || !event.value?.date) return false;

    const eventDate = dayjs(event.value.date);
    const today = dayjs().startOf('day');

    const isTodayOrAfter = today.isSame(eventDate, 'day') || today.isAfter(eventDate, 'day');
    return isTodayOrAfter && !isFinished.value && isConfirmed.value;
});

const canManualCheckin = computed(() => {
    if (!isAdmin.value && !isAdministrativeManagement) return false;
    if (!event.value?.date) return false;

    const date = dayjs(event.value.date).format('YYYY-MM-DD');
    const time = event.value.startTime;
    const eventStart = dayjs(`${date}T${time}:00`);

    return dayjs().isAfter(eventStart) || dayjs().isSame(eventStart);
});

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
        guest_participations: guestParticipants.value
    };
});

const totalParticipants = computed(() => {
    return participants.value.length + guestParticipants.value.length;
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
const openFeedbackDialog = ref(false);

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

const resolverCarpool = ref(zodResolver(carpoolSchema));

const eventRatingSchema = z.object({
    stars: z.number({ error: "Nota obrigatória" }),
    comment: z.string({ error: "Comentário obrigatório" }).nullish().optional()
});

const eventRatingFields = computed<IFields[]>(() => [
    { name: "stars", label: "Nota", component: Rating, col: "6" },
    { name: "comment", label: "Comentário", component: Textarea, col: "12", props: { rows: 5 } },
]);

const resolverFeedback = ref(zodResolver(eventRatingSchema));

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
    if (!vehicleId) return null;

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
        const participation = participants.value.find(p => p.operator.$id === operatorId);

        if (participation) {
            participation.checked_in = true;
        }

        toast.add({
            severity: 'success',
            summary: 'Check-in',
            detail: `O operador ${participation?.operator.codename} foi identificado e confirmado.`,
            life: 3000
        });

        if (navigator.vibrate) navigator.vibrate(200);
        playBeep();
    } catch (e) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        toast.add({ severity: 'error', summary: 'Falha no Check-in', life: 3000 });
    } finally {
        openScannerDialog.value = false;
    }
}

const handleCalendarDynamic = () => {
    const startDate = new Date(event.value.date as Date).toISOString().split('T')[0];
    const { startTime, endTime, location, description, types } = event.value;
    const typeLabel = normalizeEventTypes(types);

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

const checkinsCount = computed(() => (participants.value.filter(p => p.checked_in).length || 0) + (guestParticipants.value.filter(p => p.checked_in).length || 0));

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
        guestParticipants.value = eventDetails.guest_participations as IGuestParticipationDetail[];
        carpools.value = eventDetails.carpools as ICarpool<IVehicle<string>>[];

        const carpoolIds = carpools.value.map(c => c.$id);

        const [requestsData, vehiclesData, guestsData] = await Promise.all([
            carpoolIds.length > 0 ? CarpoolRequestService.listByCarpools(carpoolIds) : [],
            VehicleService.listByOperator(operator.value.$id),
            GuestService.list()
        ]);

        requests.value = requestsData as ICarpoolRequest<IOperator, ICarpoolDetail>[];
        vehicles.value = vehiclesData as IVehicle[];
        guests.value = guestsData as IGuest<IOperator>[];

        feedbacks.value = eventDetails.feedbacks as IFeedback<IOperator, string>[] || [];

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
    if (isBlockedByPendingPayment) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Você possui pendências financeiras',
            life: 3000
        });
        return;
    }

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
    const alreadyInEventIds = guestParticipants.value.map(p => p.guest.$id);
    return guests.value.filter(v => !alreadyInEventIds.includes(v.$id));
});

const addVisitorParcipations = async () => {
    try {
        const eventId = event.value.$id;

        const promises = selectedVisitors.value.map(guest =>
            EventService.addGuestToEvent(eventId, guest.$id)
        )

        const participations = await Promise.all(promises) as IGuestParticipation<IGuest<IOperator>>[];
        const participationsHydrated: IGuestParticipationDetail[] = participations.map((vp) => ({
            ...vp,
            guest: {
                ...vp.guest,
                operator: vp.guest.operator.$id
            }
        }));

        guestParticipants.value.push(...participationsHydrated);

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

const deleteVisitorParticipation = async (participationId: string, guest: IGuest) => {
    confirm.require({
        message: `Deseja remover o visitante ${guest.codename} da lista?`,
        header: 'Remover Convidado',
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
            guestParticipants.value = guestParticipants.value.filter(v => v.$id !== participationId);

            toast.add({ severity: 'success', summary: 'Convidado removido da lista!', life: 3000 });
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
            const guestParticipantion = guestParticipants.value.find(v => v.$id === participationId);

            if (guestParticipantion) guestParticipantion.checked_in = true;

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

const addFeedback = async () => {
    selectedFeedback.value = {} as IFeedback;
    openFeedbackDialog.value = true;
};

const editFeedback = async (eventRating: IFeedback<IOperator, string>) => {
    selectedFeedback.value = eventRating;
    openFeedbackDialog.value = true;
};

const deleteFeedback = (eventRating: IFeedback) => {
    confirm.require({
        message: 'Você tem certeza que deseja excluir este feedback?',
        header: "Excluir feedback",
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
                await FeedbackService.delete(eventRating.$id);
                feedbacks.value = feedbacks.value.filter((item: IFeedback) => item.$id !== eventRating.$id);

                toast.add({
                    severity: "success",
                    summary: "Sucesso",
                    detail: "Feedback excluída com sucesso!",
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

const handleToggleLike = async (feedback: IFeedback<IOperator, string>) => {
    try {
        const operatorId = operator.value.$id;

        const updatedRating = await FeedbackService.toggleLike(
            feedback.$id,
            operatorId,
            feedback.likes || []
        );

        feedback.likes = updatedRating.likes;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível curtir.' });
    }
};

const saveFeedback = async (values: IFeedback) => {
    try {
        const payload = {
            ...values,
            operator: operator.value.$id,
            event: event.value.$id,
        }

        const eventRating = await FeedbackService.upsert(selectedFeedback.value.$id, payload) as IFeedback<IOperator, string>;
        const index = feedbacks.value.findIndex((item) => item.$id === eventRating.$id);

        if (index !== -1) {
            feedbacks.value[index] = eventRating;
        } else {
            feedbacks.value.push(eventRating);
        }

        toast.add({
            severity: "success",
            summary: "Sucesso!",
            detail: "Feedback salvo com sucesso!",
            life: 3000,
        });
    } catch (error: any) {
        console.error("Erro ao salvar:", error);
        toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar o feedback.", life: 3000 });
    } finally {
        openFeedbackDialog.value = false;
    }
};

const exportHealth = async () => {
    const dataToExport = participants.value.map(p => {
        const { name, birth_date, identity, blood_type, phone, emergency_contact, emergency_contact_phone, allergies, medication_details } = getOperator(p.operator.$id)!;

        return {
            "Nome Completo": name.trim(),
            "Data de Nascimento": dayjs(birth_date).format('DD/MM/YYYY'),
            "CPF": formatCPF(identity!),
            "Telefone": phone && formatPhone(phone, { mask: 'auto' }),
            "Contato Emergência": emergency_contact?.trim(),
            "Contato Emergência - Telefone": emergency_contact_phone && formatPhone(emergency_contact_phone, { mask: 'auto' }),
            "Tipo Sanguíneo": blood_type,
            "Alergias": allergies?.join(', ') || null,
            "Medicação Contínua": medication_details?.join(', ') || null,
        }
    });

    const summary = "Ficha Médica";

    await export2Excel(`${dayjs().unix()}-${event.value.$id}-FICHA-MÉDICA`, dataToExport, summary);

    toast.add({
        severity: 'success',
        summary,
        detail: 'Exportação concluída! Verifique seu download.',
        life: 3000
    });
};

// const exportHealth = () => {
//     const headers = [
//         "Nome Completo",
//         "Data de Nascimento",
//         "CPF",
//         "Telefone",
//         "Contato de Emergência",
//         "Contato de Emergência - Telefone",
//         "Tipo Sanguíneo",
//         "Alergias",
//         "Medicação Contínua"
//     ];

//     const dataToExport = participants.value.map(p => {
//         const { name, birth_date, identity, blood_type, phone, emergency_contact, emergency_contact_phone, allergies, medication_details } = getOperator(p.operator.$id)!;

//         return {
//             name,
//             birth_date: dayjs(birth_date).format('DD/MM/YYYY'),
//             identity: formatCPF(identity!),
//             phone: formatPhone(phone!, { mask: 'auto' }),
//             emergency_contact: emergency_contact?.trim(),
//             emergency_contact_phone: formatPhone(emergency_contact_phone!, { mask: 'auto' }),
//             blood_type,
//             allergies: allergies?.join(', ') || null,
//             medication_details: medication_details?.join(', ') || null,
//         };
//     });

//     export2CSV("lista_participantes", dataToExport, headers);
// };

const deadlineInfo = computed(() => {
    if (!event.value?.date) {
        return { isOver: false, formatted: '' };
    }

    const eventDate = dayjs(event.value.date);
    const deadline = eventDate.subtract(1, 'day').hour(DEADLINE_HOUR).minute(0).second(0);
    const isDeadlineOver = dayjs().isAfter(deadline);

    return {
        isOver: isFinished.value || (!event.value.list_open && isDeadlineOver),
        formatted: deadline.format('DD/MM [às] HH:mm')
    };
});

const toggleListOpen = async () => {
    try {
        const newListOpenState = !event.value.list_open;
        await EventService.update(event.value.$id, { list_open: newListOpenState });
        rawEvent.value.list_open = newListOpenState;

        toast.add({
            severity: newListOpenState ? 'warn' : 'info',
            summary: newListOpenState ? 'Lista Extra Liberada' : 'Lista Extra Fechada',
            detail: newListOpenState
                ? 'A lista de participantes foi aberta extraordinariamente.'
                : 'A validação padrão de prazo foi reativada.',
            life: 3000
        });
    } catch (error) {
        console.error("Erro ao alterar status da lista:", error);
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível alterar o status da lista.', life: 3000 });
    }
};

const getOperator = (id: string) => operatorsMap.value.get(id);
const getOperatorName = (id: string) => operatorsMap.value.get(id)?.codename || 'Desconhecido';

const getDisplayName = (op: IOperator) => {
    const team = op.team || 'Independente';
    return op.role === 'visitor' ? `${op.codename} (${team})` : op.codename;
};
</script>

<style scoped>
:deep(.feedback .p-rating-icon) {
    width: 0.9rem;
    height: 0.9rem;
    font-size: 0.9rem;
}

.types-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

/* Mobile e telas menores */
@media (max-width: 480px) {
    .types-tags {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>