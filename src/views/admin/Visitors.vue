<template>
  <div class="card">
    <AppTable title="Visitante(s)" :value="visitors" :fields="fields" :loading="loading" icon="ri-group-3-line">
      <template #header-actions>
        <Button label="Novo" icon="pi pi-plus" size="small" @click="newVisitor" />
      </template>

      <template #actions="{ data }">
        <Skeleton v-if="loading" width="100%" height="1rem" />
        <div v-else class="flex gap-2 justify-content-center">
          <Button icon="pi pi-pencil" text rounded severity="secondary" @click="editVisitor(data)" />
          <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(data)" />
        </div>
      </template>
    </AppTable>

    <Dialog v-model:visible="visitorDialog" header="Visitante" :modal="true"
      :style="{ width: '100%', maxWidth: '640px' }" class="m-3">
      <Form ref="form" :resolver="resolver" :initialValues="selectedVisitor" @submit="saveVisitor" class="grid"
        :key="selectedVisitor.$id || 'new'">
        <div class="col-12">
          <FormField name="operator" v-slot="$field" class="flex flex-column gap-1">
            <FloatLabel variant="in">
              <Select id="operator" v-model="$field.value" :options="availableOperators" optionLabel="codename"
                optionValue="$id" class="w-full" :class="{ 'p-invalid': $field.invalid }" fluid>
                <template #option="slotProps">
                  <div class="flex align-items-center gap-2">
                    <Avatar :image="slotProps.option.avatar" :icon="!slotProps.option.avatar ? 'pi pi-user' : undefined"
                      shape="circle" size="small" />
                    <span>{{ slotProps.option.codename }}</span>
                  </div>
                </template>

                <template #value="slotProps">
                  <div v-if="slotProps.value" class="flex align-items-center gap-2">
                    <Avatar :image="availableOperators.find(op => op.$id === slotProps.value)?.avatar" shape="circle"
                      size="small" />
                    <span>{{availableOperators.find(op => op.$id ===
                      slotProps.value)?.codename
                    }}</span>
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
            <Button label="Cancelar" outlined @click="visitorDialog = false" />
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
import { InputMask, useConfirm } from "primevue";
import { VisitorService, type IVisitor } from "@/services/visitor";
import { OperatorService, type IOperator } from "@/services/operator";
import type { IFields } from "@/functions/utils";
import { TEAMS } from "@/constants/airsoft";

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  try {
    const [visitorsData, operatorsData] = await Promise.all([
      VisitorService.list(),
      OperatorService.listActive()
    ]);

    visitors.value = visitorsData;
    operators.value = operatorsData;

  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados.' });
  } finally {
    loading.value = false;
  }
};

const loading = ref(true);
const visitors = ref<IVisitor[]>([]);
const operators = ref<IOperator[]>([]);

const toast = useToast();
const confirm = useConfirm();

const visitorDialog = ref(false);
const selectedVisitor = ref<IVisitor>({} as IVisitor);

const visitorSchema = z.object({
  name: z.string({ error: "Nome Completo obrigatório" }),
  codename: z.string({ error: "Codinome obrigatório" }),
  phone: z.string({ error: "Telefone / Whatsapp obrigatório" }).transform((v) => v.replace(/\D/g, "")),
  operator: z.string({ error: "Selecione um operador" }),
  team: z.string({ error: "Selecione a sua equipe" })
});

const resolver = ref(zodResolver(visitorSchema));

const availableOperators = computed(() => {
  if (selectedVisitor.value.$id) {
    return [selectedVisitor.value.selected] as IOperator[];
  }

  return operators.value;
});

const saveVisitor = async ({ valid, values }: any) => {
  if (!valid) return false;

  try {
    const response = await VisitorService.upsert(selectedVisitor.value.$id, values);
    const index = visitors.value.findIndex((item: IVisitor) => item.$id === response.$id);

    if (index !== -1) {
      visitors.value[index] = response;
    } else {
      visitors.value.push(response);
    }

    toast.add({
      severity: "success",
      summary: "Sucesso!",
      detail: "Visitante salvo com sucesso.",
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
  { name: "name", label: "Nome do Visitante", component: InputText, col: '12' },
  { name: "codename", label: "Codinome", component: InputText, col: '6' },
  {
    name: "phone",
    label: "Telefone / Whatsapp",
    button: {
      severity: "success",
      icon: "pi pi-whatsapp",
      callback: ({ phone }: IVisitor) => {
        window.open(`https://wa.me/55${phone}`, '_blank');
      }
    },
    component: InputMask, col: '6', props: { mask: '(99) 99999-9999' }
  },
  {
    name: "team", label: "Equipe", component: Select, col: "12", props: {
      options: TEAMS,
      filter: true,
    },
    isTag: true
  },
]);

const confirmDelete = (visitor: IVisitor) => {
  confirm.require({
    message: 'Você tem certeza que deseja excluir este visitante?',
    header: "Visitante",
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
        await VisitorService.delete(visitor.$id);
        visitors.value = visitors.value.filter((item: IVisitor) => item.$id !== visitor.$id);

        toast.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Visitante excluído com sucesso!",
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

const newVisitor = async () => {
  selectedVisitor.value = {} as IVisitor;
  visitorDialog.value = true;
};

const editVisitor = async (visitor: IVisitor<IOperator>) => {
  selectedVisitor.value = { ...visitor, operator: visitor.operator.$id, selected: visitor.operator };
  visitorDialog.value = true;
};

const hideDialog = () => {
  visitorDialog.value = false;
};
</script>