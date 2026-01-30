<template>
  <div class="flex flex-column md:flex-row gap-3">
    <DatePicker v-model="selectedDate" inline :minDate="minDate" class="w-full lg:w-4 xl:w-3" fluid>
      <template #date="slotProps">
        <span :class="{ 'not-schedule': !hasSchedule(slotProps.date), 'has-schedule': hasSchedule(slotProps.date) }">
          {{ slotProps.date.day }}
        </span>
      </template>
    </DatePicker>
    <Transition name="fade" mode="out-in" class="w-full">
      <div v-if="schedulesOfTheDay.length > 0" :key="selectedDate.toString()"
        class="flex flex-column border-round border-1 border-gray-400 gap-2 p-3">
        <h3 class="m-0 uppercase">{{ dayjs(selectedDate).format('DD [de] MMMM [de] YYYY') }}</h3>

        <template v-for="schedule in schedulesOfTheDay" :key="schedule.$id">
          <div class="flex flex-column gap-2 align-items-start">
            <Tag :value="SCHEDULE_TYPES[schedule.type].label" :severity="SCHEDULE_TYPES[schedule.type].severity" />
            <div class="flex flex-column gap-1">
              <span class="text-xs font-bold opacity-50">HORÁRIO </span>
              <div class="flex align-items-center gap-2">
                <span class="text-primary font-bold">07:00 — 09:00</span>
                <Tag :value="SCHEDULE_STATUS[schedule.status].label"
                  :severity="SCHEDULE_STATUS[schedule.status].severity" />
              </div>
            </div>
            <span class="line-height-2 py-2">{{ schedule.description }}</span>
            <div class="flex flex-column gap-1">
              <span class="text-xs font-bold opacity-50">LÍDER</span>
              <span class="text-primary font-bold">{{ schedule.leader.codename }}</span>
            </div>
          </div>

          <Divider class="my-3" />

          <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
            <div class="flex flex-column gap-2">
              <span class="text-xs font-bold opacity-50 uppercase">Operadores Escalados</span>
              <AvatarGroup>
                <Avatar :image="schedule.leader.avatar" :icon="!schedule.leader.avatar ? 'pi pi-user' : undefined"
                  shape="circle" class="avatar-group"
                  @click="router.push(`/operator/${schedule.leader.instagram || schedule.leader.$id}`)" />
                <Avatar v-for="op in getOperators(schedule)" :key="op.$id" :image="op.avatar"
                  :icon="!op.avatar ? 'pi pi-user' : undefined" shape="circle" class="avatar-group"
                  @click="router.push(`/operator/${op.instagram || op.$id}`)" />
              </AvatarGroup>
            </div>

            <Button v-if="getFinalizeStatus(schedule).visible" label="Relatório" size="small" outlined
              severity="success" @click="editSchedule(schedule)" :disabled="!getFinalizeStatus(schedule).disabled" />
          </div>
        </template>
      </div>

      <div v-else
        class="flex flex-column w-full align-items-center justify-content-center border-1 border-round border-gray-400 p-3">
        <Empty label="Selecione uma data marcada no calendário" icon="ri-calendar-schedule-line" />
      </div>
    </Transition>
  </div>

  <AppFormDialog v-model:visible="scheduleDialog" :initialValues="selectedSchedule" :resolver="resolver"
    :fields="scheduleFields" :header="`Finalizar · ${SCHEDULE_TYPES[selectedSchedule.type]?.label}`"
    @submit="finalizeSchedule" submitLabel="Finalizar" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { type ISchedule } from '@/services/schedule';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

import { SCHEDULE_TYPES, SCHEDULE_STATUS } from "@/constants/airsoft";
import router from "@/router";
import type { IOperator } from '@/services/operator';
import Empty from './Empty.vue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import z from 'zod';
import { MultiSelect, Textarea } from 'primevue';
import { type IFields } from "@/functions/utils";
import { useSchedule } from "@/composables/useSchedule";

dayjs.locale('pt-br');

const { loadSchedules, getFinalizeStatus, schedules, minDate, scheduleDialog, selectedSchedule, finalizeSchedule, editSchedule } = useSchedule();

onMounted(loadSchedules);

const selectedDate = ref(new Date());

const scheduleFields = computed<IFields[]>(() => [
  {
    name: "attended",
    label: "Operadores Presentes",
    component: MultiSelect,
    col: "12",
    hiddenTable: true,
    props: {
      options: selectedSchedule.value.selected || [],
      optionLabel: "codename",
      optionValue: "$id",
      display: "chip",
      fluid: true
    }
  },
  {
    name: "report",
    label: "Relatório",
    component: Textarea,
    col: "12",
    width: '20%',
    props: { rows: 5 }
  },
]);

const scheduleSchema = z.object({
  attended: z.array(z.string(), { error: "Operadores presentes obrigatórios" }).min(1, { message: "Marque ao menos um operador presente" }),
  report: z.string({ error: "Relátio da manutenção obrigatório" }),
});

const resolver = ref(zodResolver(scheduleSchema));

const getOperators = (item: ISchedule<IOperator>) => {
  return item.operators.filter(o => o.$id !== item.leader.$id);
};

const formatSlotDate = (date: { day: number, month: number, year: number }) => dayjs(new Date(date.year, date.month, date.day)).format('YYYY-MM-DD');

const hasSchedule = (date: { day: number, month: number, year: number }) => {
  return schedules.value.some(s => dayjs(s.date).format('YYYY-MM-DD') === formatSlotDate(date));
};

const schedulesOfTheDay = computed(() => {
  if (!selectedDate.value) return [];
  const d = dayjs(selectedDate.value).format('YYYY-MM-DD');
  return schedules.value.filter(s => dayjs(s.date).format('YYYY-MM-DD') === d);
});
</script>

<style scoped>
:deep(.p-avatar.avatar-group) {
  width: 3rem;
  height: 3rem;
  cursor: pointer;
}

:deep(.p-datepicker-day:has(.not-schedule)) {
  color: var(--p-gray-500);
  opacity: var(--p-disabled-opacity);
  pointer-events: none !important;
}

:deep(.p-datepicker-today .p-disabled) {
  color: var(--p-gray-900);
}

:deep(.p-datepicker-day:has(.has-schedule)) {
  background-color: var(--p-primary-500);
  color: var(--p-primary-50);
}

:deep(.p-datepicker-day.p-datepicker-day-selected:has(.has-schedule)) {
  background-color: var(--p-red-500);
  color: var(--p-red-50);
}
</style>