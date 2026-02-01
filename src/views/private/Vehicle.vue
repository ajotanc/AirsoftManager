<template>
  <div class="card">
    <AppTable title="Veículo(s)" :value="vehicles" :fields="vehicleFields" :loading="loading" icon="ri-car-line">
      <template #header-actions>
        <Button label="Nova" icon="pi pi-plus" size="small" @click="newVehicle" />
      </template>

      <template #actions="{ data }">
        <Skeleton v-if="loading" width="100%" height="1rem" />
        <div v-else class="flex gap-2 justify-content-center">
          <Button icon="pi pi-pencil" text rounded severity="secondary" @click="editVehicle(data)" />
          <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(data)" />
        </div>
      </template>
    </AppTable>

    <AppFormDialog v-model:visible="vehicleDialog" :initialValues="selectedVehicle" :resolver="resolver"
      :fields="vehicleFields" header="Veículo" @submit="saveVehicle" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { ColorPicker, InputNumber, useConfirm } from "primevue";
import { VehicleService, type IVehicle, type IVehicleType } from "@/services/vehicle";
import { type IFields } from "@/functions/utils";
import { useOperator } from "../../composables/useOperator";
import { VEHICLE_TYPES } from "@/constants/airsoft";

const { operator } = useOperator();

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  try {
    vehicles.value = await VehicleService.listByOperator(operator.value.$id);
  } catch (error) {
    console.error("Erro ao carregar:", error);
  } finally {
    loading.value = false;
  }
};

const vehicles = ref<IVehicle[]>([]);

const toast = useToast();
const confirm = useConfirm();

const loading = ref(true);

const vehicleDialog = ref(false);
const selectedVehicle = ref<IVehicle>({} as IVehicle);

const vehicleFields = computed<IFields[]>(() => [
  {
    name: "type", label: "Tipo de Veículo", component: Select, col: "12", props: {
      options: Object.entries(VEHICLE_TYPES).map(([value, item]) => ({ label: item.label, value })),
      optionLabel: "label",
      optionValue: "value",
      "onUpdate:modelValue": (value: IVehicleType) => {
        selectedVehicle.value.type = value;

        if (value === 'motorcycle') {
          selectedVehicle.value.total_seats = 1;
        }
      },
      isTag: true
    },
  },
  { name: "brand", label: "Marca", component: InputText, col: "6" },
  { name: "model", label: "Modelo", component: InputText, col: "6" },
  {
    name: "total_seats", label: "Total de vagas", component: InputNumber, col: "6", props: {
      min: 1,
      max: getMaxSeats(selectedVehicle.value.type),
      showButtons: true
    }
  },
  {
    name: "color", label: "Cor", component: ColorPicker, col: "6", props: {
      format: 'hex'
    }
  },
]);

const vehicleSchema = z.object({
  brand: z.string({ error: "Marca obrigatório" }),
  model: z.string({ error: "Modelo obrigatório" }),
  color: z.string().nullish().optional(),
  type: z.string({ error: "Selecione o tipo de veículo" }),
  total_seats: z.number({ error: "Quantidade de vagas obrigtaório" }).min(1, "Quantidade de vagas deve ser maior que 0")
});

const resolver = ref(zodResolver(vehicleSchema));

const getMaxSeats = (type: IVehicleType) => {
  const seatMap = {
    motorcycle: 1,
    car: 7,
    van: 19
  } as Record<IVehicleType, number>;

  return seatMap[type] || 320;
}

const saveVehicle = async (values: IVehicle) => {
  try {
    const payload = {
      ...values,
      driver: operator.value.$id
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
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar o veículo.", life: 3000 });
  } finally {
    hideDialog();
  }
};

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