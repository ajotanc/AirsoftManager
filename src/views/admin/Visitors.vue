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
              <span class="text-xl font-bold">Visitantes</span>
              <Button label="Novo" icon="pi pi-plus" size="small" @click="newRating" />
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

        <Column header="Operador">
          <template #body="{ data: codename }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>{{ codename.codename }}</template>
          </template>
        </Column>

        <Column header="Ações" style="width: 10%; min-width: 8rem" bodyStyle="text-align: center">
          <template #body="{ data: visitor }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <div v-else class="flex gap-2 justify-content-center">
              <Button icon="pi pi-pencil" text rounded severity="secondary" v-tooltip.top="'Editar'"
                @click="editVisitor(visitor)" />
              <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip.top="'Excluir'"
                @click="confirmDelete(visitor)" />
            </div>
          </template>
        </Column>

        <template #empty>Nenhum voto encontrado.</template>
      </DataTable>
    </div>

    <Dialog v-model:visible="visitorDialog" :style="{ width: '512px' }" header="Visitante" :modal="true">
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
        <div v-for="field in fields" :key="field.name" :class="`col-${field.col}`">
          <FormField :name="field.name" v-slot="$field" class="flex flex-column gap-1">
            <label :for="field.name" class="font-bold">{{ field.label }}</label>
            <component :is="field.component" :id="field.name" v-bind="field.props" v-model="$field.value" class="w-full"
              :class="{ 'p-invalid': $field.invalid }" fluid />

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
import { InputMask, useConfirm } from "primevue";
import { VisitorService, type IVisitor } from "@/services/visitor";
import { OperatorService, type IOperator } from "@/services/operator";
import type { IFields } from "@/functions/utils";
import ColumnContent from "@/components/ColumnContent.vue";

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  try {
    const [visitorsData, operatorsData] = await Promise.all([
      VisitorService.list(),
      OperatorService.list()
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

const dtValue = computed(() => {
  return loading.value ? new Array(5).fill({}) : visitors.value;
});

const loading = ref(true);
const visitors = ref<IVisitor[]>([]);
const operators = ref<IOperator[]>([]);

const toast = useToast();
const confirm = useConfirm();

const visitorDialog = ref(false);
const selectedVisitor = ref<IVisitor>({} as IVisitor);

const filters = ref({
  'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const visitorSchema = z.object({
  name: z.string({ error: "Nome Completo obrigatório" }),
  codename: z.string({ error: "Codinome obrigatório" }),
  phone: z.string({ error: "Telefone / Whatsapp obrigatório" }).transform((v) => v.replace(/\D/g, "")),
  operator: z.string({ error: "Selecione um operador" }),
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
    callback: (value: string) => formatPhone(value),
    button: {
      severity: "success",
      icon: "pi pi-whatsapp",
      callback: ({ phone }: IVisitor) => {
        window.open(`https://wa.me/55${phone}`, '_blank');
      }
    },
    component: InputMask, col: '6', props: { mask: '(99) 99999-9999' }
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

const newRating = async () => {
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

const formatPhone = (value: string) => {
  return value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

</script>