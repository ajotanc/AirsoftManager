<template>
  <div class="card">
    <AppTable title="Cronograma(s)" :value="schedulesOperator" :fields="scheduleFields" :loading="loading"
      icon="ri-calendar-schedule-line">
      <template #extra-columns-start>
        <Column header="Operador" style="width: 15%">
          <template #body="{ data }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>
              <div class="flex flex-column gap-2">
                <div v-for="operator in data.operators" :key="operator.$id" class="flex align-items-center gap-2">
                  <i v-if="data.attended.length > 0 && data.status === 'completed'"
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
        <div v-else-if="getFinalizeStatus(data).visible" class="flex gap-2 justify-content-center">
          <Button icon="pi pi-pencil" rounded @click="editSchedule(data)"
            :disabled="!getFinalizeStatus(data).disabled" />
        </div>
      </template>
    </AppTable>

    <AppFormDialog v-model:visible="scheduleDialog" :initialValues="selectedSchedule" :resolver="resolver"
      :fields="scheduleFields" :header="`Finalizar · ${SCHEDULE_TYPES[selectedSchedule.type]?.label}`"
      @submit="finalizeSchedule" submitLabel="Finalizar" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import Button from "primevue/button";
import Select from "primevue/select";
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { DatePicker, MultiSelect, Textarea } from "primevue";
import { type IOperator } from "@/services/operator";
import { type IFields } from "@/functions/utils";
import { SCHEDULE_STATUS, SCHEDULE_TYPES } from "@/constants/airsoft";
import { useSchedule } from "@/composables/useSchedule";

const { loading, getFinalizeStatus, loadSchedules, schedulesOperator, scheduleDialog, selectedSchedule, finalizeSchedule, editSchedule } = useSchedule();

onMounted(loadSchedules);

const leaders = ref<IOperator[]>([]);

const scheduleFields = computed<IFields[]>(() => [
  {
    name: "leader", label: "Líder", component: Select, col: "6",
    width: '10%',
    hidden: true,
    props: {
      options: leaders.value,
      optionLabel: "codename",
      optionValue: "$id",
    },
    isTag: true,
  },
  {
    name: "type", label: "Tipo", component: Select, col: "6",
    width: '15%',
    hidden: true,
    props: {
      options: Object.entries(SCHEDULE_TYPES).map(([value, item]) => ({ label: item.label, value })),
      optionLabel: "label",
      optionValue: "value",
    }
  },
  {
    name: "status", label: "Situação", component: Select, col: "12",
    width: '5%',
    hidden: true,
    props: {
      options: Object.entries(SCHEDULE_STATUS).map(([value, item]) => ({ label: item.label, value })),
      optionLabel: "label",
      optionValue: "value",
    }
  },
  {
    name: "date", label: "Data", component: DatePicker, col: "6",
    width: '5%',
    hidden: true,
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
    hidden: true,
    props: { rows: 5 }
  },
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
</script>