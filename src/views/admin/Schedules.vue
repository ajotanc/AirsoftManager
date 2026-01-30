<template>
  <div class="card">
    <AppTable title="Cronograma(s)" :value="schedules" :fields="scheduleFields" :loading="loading"
      icon="ri-calendar-schedule-line">
      <template #header-actions>
        <Button label="Novo" icon="pi pi-plus" size="small" @click="newSchedule" />
      </template>

      <template #extra-columns-start>
        <Column header="Operador" style="width: 15%;">
          <template #body="{ data }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>
              <div class="flex flex-column gap-2">
                <div v-for="operator in data.operators" :key="operator.$id" class="flex align-items-center gap-2">
                  <i v-if="data.attended?.length > 0 && data.status === 'completed'"
                    :class="['pi', data.attended.includes(operator.$id) ? 'pi-check text-green-500' : 'pi-times text-red-500']"></i>
                  <Avatar :image="operator.avatar" :icon="!operator.avatar ? 'pi pi-user' : undefined" shape="circle"
                    size="small" />
                  <span>{{ operator.codename }}</span>
                </div>
              </div>
            </template>
          </template>
        </Column>
      </template>

      <template #actions="{ data }">
        <Skeleton v-if="loading" width="100%" height="1rem" />
        <div v-else class="flex gap-2 justify-content-center">
          <Button icon="pi pi-pencil" text rounded severity="secondary" @click="editSchedule(data)"
            :disabled="['completed', 'canceled'].includes(data.status)" />
          <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(data)"
            :disabled="['completed', 'canceled'].includes(data.status)" />
        </div>
      </template>
    </AppTable>

    <AppFormDialog v-model:visible="scheduleDialog" :initialValues="selectedSchedule" :resolver="resolver"
      :fields="scheduleFields" :header="SCHEDULE_TYPES[selectedSchedule.type]?.label || 'Cronograma'"
      @submit="saveSchedule" @field-change="onFieldChange" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { DatePicker, MultiSelect, Textarea, Select, Button, Column, Skeleton, Avatar } from "primevue";
import { type ISchedule } from "@/services/schedule";
import { dateToISOString, type IFields } from "@/functions/utils";
import { SCHEDULE_STATUS, SCHEDULE_TYPES } from "@/constants/airsoft";
import { type FieldChangePayload, type FormInstance } from "@/functions/utils";
import { useSchedule } from "@/composables/useSchedule";

import AppFormDialog from "@/components/AppFormDialog.vue";

const {
  loading,
  loadSchedules,
  operators,
  leaders,
  schedules,
  scheduleDialog,
  selectedSchedule,
  newSchedule,
  editSchedule,
  saveSchedule,
  confirmDelete,
  setLeadersOptions
} = useSchedule();

onMounted(() => loadSchedules(true));

const scheduleFields = computed<IFields[]>(() => [
  {
    name: "operators",
    label: "Operadores",
    component: MultiSelect,
    col: "12",
    hiddenTable: true,
    props: {
      options: operators.value,
      optionLabel: "codename",
      optionValue: "$id",
      display: "chip",
      fluid: true
    }
  },
  {
    name: "leader", label: "Líder", component: Select, col: "6",
    width: '10%',
    props: {
      options: leaders.value,
      optionLabel: "codename",
      optionValue: "$id",
    },
    isTag: true,
  },
  {
    name: "status", label: "Situação", component: Select, col: "6",
    width: '5%',
    props: {
      options: Object.entries(SCHEDULE_STATUS).map(([value, item]) => ({ label: item.label, value })),
      optionLabel: "label",
      optionValue: "value",
    }
  },
  {
    name: "type", label: "Tipo", component: Select, col: "6",
    width: '15%',
    props: {
      options: Object.entries(SCHEDULE_TYPES).map(([value, item]) => ({ label: item.label, value })),
      optionLabel: "label",
      optionValue: "value",
    }
  },
  {
    name: "date", label: "Data", component: DatePicker, col: "6",
    width: '5%',
    props: {
      showButtonBar: true,
      manualInput: false,
      showIcon: true,
      focusOnShow: false,
      iconDisplay: 'input',
      variant: 'filled'
    }
  },
  {
    name: "description",
    label: "Pauta",
    component: Textarea,
    col: "12",
    width: '20%',
    props: { rows: 5 }
  },
  {
    name: "report",
    label: "Relatório",
    component: Textarea,
    col: "12",
    hidden: true,
    width: '20%',
    props: { rows: 5 }
  },
]);

const scheduleSchema = z.object({
  type: z.string({ error: "Obrigatório" }),
  status: z.string({ error: "Obrigatório" }),
  operators: z.array(z.string({ error: "Operadores obrigatórios" }), { error: "Lista de operadores obrigatório" }).min(5, "Mínimo 5 operadores"),
  leader: z.string({ error: "Obrigatório" }),
  description: z.string().nullish().optional(),
  date: z.custom().refine((date) => date instanceof Date || typeof date === 'string', "Data da manutenção obrigatória").transform((date) => dateToISOString(date as Date | string)),
});

const resolver = ref(zodResolver(scheduleSchema));

const onFieldChange = (payload: FieldChangePayload<ISchedule>) => {
  const { name, value, form } = payload;

  if (name === 'operators') {
    handleOperatorsChange(value, form);
  }
};

const handleOperatorsChange = (selectedIds: string[], form: FormInstance) => {
  setLeadersOptions(selectedIds);

  const currentLeaderId = selectedSchedule.value.leader as string;

  if (currentLeaderId && !selectedIds.includes(currentLeaderId)) {
    form.setFieldValue('leader', null);
    selectedSchedule.value.leader = null;

    console.log("Líder removido pois saiu da lista de operadores.");
  }
};
</script>