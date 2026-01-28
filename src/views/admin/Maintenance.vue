<template>
  <div class="card">
    <AppTable title="Manutenções" :value="maintenance" :fields="fields" :loading="loading" icon="ri-hammer-line">
      <template #header-actions>
        <Button label="Nova" icon="pi pi-plus" size="small" @click="newMaintenance" />
      </template>

      <template #extra-columns-start>
        <Column header="Operador">
          <template #body="{ data }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>
              <span>{{ data.operator.codename }}</span>
            </template>
          </template>
        </Column>
      </template>

      <template #actions="{ data }">
        <Skeleton v-if="loading" width="100%" height="1rem" />
        <div v-else class="flex gap-2 justify-content-center">
          <Button icon="pi pi-pencil" text rounded severity="secondary" @click="editMaintenance(data)"
            :disabled="data.status === 'completed'" />
          <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(data)"
            :disabled="data.status === 'completed'" />
        </div>
      </template>
    </AppTable>

    <Dialog v-model:visible="maintenanceDialog" header="Manutenção" :modal="true"
      :style="{ width: '100%', maxWidth: '640px' }" class="m-3">
      <Form ref="form" :resolver="resolver" :initialValues="selectedMaintenance" @submit="saveMaintenance" class="grid"
        :key="selectedMaintenance.$id || 'new'">
        <div class="col-12">
          <FormField name="operator" v-slot="$field" class="flex flex-column gap-1">
            <FloatLabel variant="in">
              <Select id="operator" v-model="$field.value" :options="availableOperators" optionLabel="codename"
                optionValue="$id" class="w-full" :class="{ 'p-invalid': $field.invalid }"
                @update:model-value="getArsenalData" fluid>
                <template #option="slotProps">
                  <div class="flex align-items-center gap-2">
                    <Avatar :image="slotProps.option.avatar" :icon="!slotProps.option.avatar ? 'pi pi-user' : undefined"
                      shape="circle" size="small" />
                    <span>{{ slotProps.option.codename }}</span>
                  </div>
                </template>

                <template #value="slotProps">
                  <div v-if="slotProps.value" class="flex align-items-center gap-2">
                    <Avatar :image="getOperatorData(slotProps.value)?.avatar" shape="circle" size="small" />
                    <span>{{ getOperatorData(slotProps.value)?.codename || 'Carregando...' }}</span>
                  </div>
                </template>
              </Select>
              <label for="target">Convite</label>
            </FloatLabel>
            <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>
        </div>
        <template v-for="{ name, label, component, col, hidden, props } in fields" :key="name">
          <div :class="`col-12 md:col-${col}`" v-if="!hidden">
            <FormField v-if="component.name === 'ColorPicker'" :name="name" v-slot="$field" class="flex gap-1">
              <div class="flex flex-column align-items-center gap-2">
                <label class="font-bold" :for="name">{{ label }}</label>
                <component :is="component" :id="name" v-bind="props" :name="name" v-model="$field.value" fluid />
              </div>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                {{ $field.error?.message }}
              </Message>
            </FormField>
            <FormField v-else-if="component.name === 'ToggleSwitch'" :name="name" v-slot="$field" class="flex gap-1">
              <div class="flex align-items-center gap-2">
                <component :is="component" :id="name" v-bind="props" :name="name" v-model="$field.value" fluid />
                <label class="font-bold" :for="name">{{ label }}</label>
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
        </template>
        <div class="col-12 pb-0">
          <div class="flex justify-content-end gap-2">
            <Button label="Cancelar" outlined @click="maintenanceDialog = false" />
            <Button type="submit" label="Salvar" />
          </div>
        </div>
      </Form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import FloatLabel from "primevue/floatlabel";
import Select from "primevue/select";
import Message from "primevue/message";
import { Form } from '@primevue/forms';
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { DatePicker, MultiSelect, Textarea, useConfirm } from "primevue";
import { MaintenanceService, type IMaintenance } from "@/services/maintenance";
import { OperatorService, type IOperator } from "@/services/operator";
import { dateToISOString, type IFields } from "@/functions/utils";
import { MAINTENANCE_STATUS_TYPES, MAINTENANCE_TYPES } from "@/constants/airsoft";
import { type IArsenal } from "@/services/arsenal";
import { useOperator } from "@/composables/useOperator";

const toast = useToast();
const confirm = useConfirm();
const { operator, authStore } = useOperator();

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  try {
    const [maintenanceData, operatorsData] = await Promise.all([
      MaintenanceService.list(),
      OperatorService.list()
    ]);

    maintenance.value = maintenanceData;
    operators.value = operatorsData;
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados.' });
  } finally {
    loading.value = false;
  }
};

const loading = ref(true);
const maintenance = ref<IMaintenance<IOperator, IArsenal>[]>([]);
const operators = ref<IOperator[]>([]);
const arsenals = ref<IArsenal[]>([]);

const maintenanceDialog = ref(false);
const selectedMaintenance = ref<IMaintenance>({} as IMaintenance);

const fields = computed<IFields[]>(() => [
  {
    name: "arsenal", label: "Equipamento", component: Select, col: "12", props: {
      options: arsenals.value,
      optionLabel: "name",
      optionValue: "$id",
    },
    isTag: true
  },
  {
    name: "type", label: "Tipo de Manutenção", component: MultiSelect, col: "12", props: {
      options: MAINTENANCE_TYPES,
      optionLabel: "label",
      optionValue: "value",
      display: "chip",
    },
    isTag: true
  },
  {
    name: "maintenance_at", label: "Data da Manutenção", component: DatePicker, col: "6", props: {
      showButtonBar: true,
      manualInput: false,
      showIcon: true,
      focusOnShow: false,
      iconDisplay: 'input',
      variant: 'filled'
    }
  },
  {
    name: "status", label: "Status", component: Select, col: "6", props: {
      options: MAINTENANCE_STATUS_TYPES,
      optionLabel: "label",
      optionValue: "value",
    },
    isTag: true
  },
  { name: "technical_report", label: "Relatório Técnico", component: Textarea, col: '12', props: { rows: 5 } },
]);

const maintenanceSchema = z.object({
  operator: z.string({ error: "Selecione um operador" }),
  arsenal: z.string({ error: "Selecione o equipamento" }),
  type: z.array(z.string({ error: "Selecione ao menos um tipo de manutenção" })),
  status: z.string({ error: "Status obrigatório" }),
  maintenance_at: z.custom().refine((date) => date instanceof Date || typeof date === 'string', "Data da manutenção obrigatória").transform((date) => dateToISOString(date as Date | string)),
  technical_report: z.string().nullish().optional(),
});

const resolver = ref(zodResolver(maintenanceSchema));

const availableOperators = computed(() => {
  if (selectedMaintenance.value.$id) {
    return [selectedMaintenance.value.selected] as IOperator[];
  }

  return operators.value;
});

const getOperatorData = (id: string) => {
  return availableOperators.value.find(op => op && op.$id === id);
};

const getArsenalData = (operatorId: string) => {
  const operator = operators.value.find(op => op && op.$id === operatorId);
  const operatorArsenal = operator?.arsenal || [];

  const idsInMaintenance = maintenance.value
    .filter(m => {
      const isCurrentEditing = selectedMaintenance.value?.$id && m.$id === selectedMaintenance.value.$id;
      return m.status !== 'completed' && !isCurrentEditing;
    })
    .map(m => m.arsenal.$id);

  arsenals.value = operatorArsenal.filter((item) => {
    const isAlreadySelected = item.$id === selectedMaintenance.value?.arsenal;
    return !idsInMaintenance.includes(item.$id) || isAlreadySelected;
  });
};
const saveMaintenance = async ({ valid, values }: any) => {
  if (!valid) return false;

  try {
    const response = await MaintenanceService.upsert(selectedMaintenance.value.$id, values) as IMaintenance<IOperator, IArsenal>;
    const index = maintenance.value.findIndex((item: IMaintenance) => item.$id === response.$id);

    if (index !== -1) {
      maintenance.value[index] = response;
    } else {
      maintenance.value.push(response);
    }

    if (selectedMaintenance.value.operator === operator.value.$id) {
      await authStore.fetchOperator();
    }

    toast.add({
      severity: "success",
      summary: "Sucesso!",
      detail: "Manutenção salvo com sucesso.",
      life: 3000,
    });
  } catch (error: any) {
    console.error("Erro ao salvar:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar o visitante.", life: 3000 });
  } finally {
    hideDialog();
  }
};

const confirmDelete = (data: IMaintenance) => {
  confirm.require({
    message: 'Você tem certeza que deseja excluir este visitante?',
    header: "Manutenção",
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
        await MaintenanceService.delete(data.$id);
        maintenance.value = maintenance.value.filter((item) => item.$id !== data.$id);

        toast.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Manutenção excluído com sucesso!",
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

const newMaintenance = async () => {
  selectedMaintenance.value = {} as IMaintenance;
  maintenanceDialog.value = true;
};

const editMaintenance = async (maintenance: IMaintenance<IOperator, IArsenal>) => {
  selectedMaintenance.value = {
    ...maintenance,
    operator: maintenance.operator.$id,
    arsenal: maintenance.arsenal.$id,
    selected: maintenance.operator,
    maintenance_at: maintenance.maintenance_at ? dayjs(maintenance.maintenance_at).format('DD/MM/YYYY') : null,
  };

  getArsenalData(maintenance.operator.$id);
  maintenanceDialog.value = true;
};

const hideDialog = () => {
  maintenanceDialog.value = false;
};
</script>