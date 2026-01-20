<template>
  <div class="card">
    <div class="surface-card shadow-2 border-round overflow-hidden">
      <DataTable :value="dtValue" paginator :rows="5" stripedRows :filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Exibindo {first} a {last} de {totalRecords} voto(s)" tableStyle="min-width: 60rem">

        <template #header>
          <div class="flex flex-wrap align-items-center justify-content-between gap-3 p-2">

            <div class="flex align-items-center gap-3">
              <span class="text-xl font-bold">Veículo(s)</span>
              <Button label="Novo" icon="pi pi-plus" size="small" @click="newVehicle" />
            </div>

            <IconField iconPosition="left">
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="filters['global'].value" placeholder="Procurar..." />
            </IconField>

          </div>
        </template>

        <Column v-for="column in fields" :key="column.name" :header="column.label">
          <template #body="{ data }">
            <ColumnContent :column="column" :data="data" :loading="loading" />
          </template>
        </Column>

        <Column header=" Ações" style="width: 10%">
          <template #body="{ data }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <div v-else class="flex gap-2 justify-content-center">
              <Button icon="pi pi-pencil" text rounded severity="secondary" @click="editVehicle(data)" />
              <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>

        <template #empty>
          <Empty label="Nenhum veículo cadastrado" icon="ri ri-car-line" />
        </template>
      </DataTable>
    </div>

    <Dialog v-model:visible="vehicleDialog" :style="{ width: '512px' }" header="Veículo" :modal="true">
      <Form :resolver="resolver" :initialValues="selectedVehicle" @submit="saveVehicle" class="grid"
        :key="selectedVehicle.$id || 'new'">
        <div v-for="{ name, label, component, col, props } in fields" :key="name" :class="`col-${col}`">
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

        <div class="col-12">
          <Button type="submit" label="Salvar" class="w-full shadow-6" severity="success" />
        </div>
      </Form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue/usetoast";
import { FilterMatchMode } from '@primevue/core/api';
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import Column from "primevue/column";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import DataTable from "primevue/datatable";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Message from "primevue/message";
import { Form } from '@primevue/forms';
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { ColorPicker, InputNumber, useConfirm } from "primevue";
import { VehicleService, type IVehicle } from "@/services/vehicle";
import { useAuthStore } from "@/stores/auth";
import { type IFields } from "@/functions/utils";
import ColumnContent from "@/components/ColumnContent.vue";

const { operator } = useAuthStore();

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  try {
    vehicles.value = await VehicleService.listByOperator(operator.$id);
  } catch (error) {
    console.error("Erro ao carregar:", error);
  } finally {
    loading.value = false;
  }
};

const dtValue = computed(() => {
  return loading.value ? new Array(5).fill({}) : vehicles.value;
});

const vehicles = ref<IVehicle[]>([]);

const toast = useToast();
const confirm = useConfirm();

const loading = ref(true);

const vehicleDialog = ref(false);
const selectedVehicle = ref<IVehicle>({} as IVehicle);

const filters = ref({
  'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const vehicleSchema = z.object({
  type: z.string({ error: "Selecione o tipo de veículo" }),
  brand: z.string({ error: "Marca obrigatório" }),
  model: z.string({ error: "Modelo obrigatório" }),
  color: z.string().nullable().optional(),
  total_seats: z.number({ error: "Quantidade de vagas obrigtaório" })
});

const resolver = ref(zodResolver(vehicleSchema));

const saveVehicle = async ({ valid, values }: any) => {
  if (!valid) return false;

  try {
    const payload = {
      ...values,
      driver: operator.$id
    }

    const response = await VehicleService.upsert(selectedVehicle.value.$id, payload);
    const index = vehicles.value.findIndex((item: IVehicle) => item.$id === response.$id);

    if (index !== -1) {
      vehicles.value[index] = response;
    } else {
      vehicles.value.push(response);
    }

    toast.add({
      severity: "success",
      summary: "Sucesso!",
      detail: "Veículo salvo com sucesso.",
      life: 3000,
    });
  } catch (error: any) {
    console.error("Erro ao salvar:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar o visitante.", life: 3000 });
  } finally {
    hideDialog();
  }
};

const fields = computed<IFields[]>(() => [
  {
    name: "type", label: "Tipo de Veículo", component: Select, col: "12", props: {
      options: [{
        label: "Carro",
        value: "car"
      }, {
        label: "Moto",
        value: "motorcycle"
      }], optionLabel: "label", optionValue: "value",
    },
    isTag: true
  },
  { name: "brand", label: "Marca", component: InputText, col: "6" },
  { name: "model", label: "Modelo", component: InputText, col: "6" },
  { name: "total_seats", label: "Total de vagas", component: InputNumber, col: "6" },
  {
    name: "color", label: "Cor", component: ColorPicker, col: "6", props: {
      format: 'hex'
    }
  },
]);

const confirmDelete = (vehicle: IVehicle) => {
  confirm.require({
    message: 'Você tem certeza que deseja excluir este veículo?',
    header: vehicle.model,
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
        await VehicleService.delete(vehicle.$id);
        vehicles.value = vehicles.value.filter((item: IVehicle) => item.$id !== vehicle.$id);

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

const newVehicle = async () => {
  selectedVehicle.value = {} as IVehicle;
  vehicleDialog.value = true;
};

const editVehicle = async (vehicle: IVehicle) => {
  selectedVehicle.value = vehicle;
  vehicleDialog.value = true;
};

const hideDialog = () => {
  vehicleDialog.value = false;
};

</script>