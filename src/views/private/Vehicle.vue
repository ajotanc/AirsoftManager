<template>
  <div class="card">
    <AppTable title="Veículo(s)" :value="vehicles" :fields="fields" :loading="loading" icon="ri ri-car-line">
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

    <Dialog v-model:visible="vehicleDialog" header="Veículo" :modal="true" :style="{ width: '100%', maxWidth: '640px' }"
      class="m-3">
      <Form :resolver="resolver" :initialValues="selectedVehicle" @submit="saveVehicle" class="grid"
        :key="selectedVehicle.$id || 'new'">
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
            <Button label="Cancelar" outlined @click="vehicleDialog = false" />
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

const vehicles = ref<IVehicle[]>([]);

const toast = useToast();
const confirm = useConfirm();

const loading = ref(true);

const vehicleDialog = ref(false);
const selectedVehicle = ref<IVehicle>({} as IVehicle);

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