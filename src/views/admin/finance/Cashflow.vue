<template>
  <div class="card">
    <AppTable title="Transações" :value="cashflows" :fields="fields" :loading="loading">
      <template #header-actions>
        <Button label="Nova" icon="pi pi-plus" size="small" @click="newCashflow" />
      </template>
      <template #extra-columns-end>
        <Column header="Imagem">
          <template #body="{ data }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>
              <Image :src="data.receipt_url" :alt="data.title" width="50" height="50" v-if="data.receipt_url"
                class="overflow-hidden border-circle" preview />
            </template>
          </template>
        </Column>
      </template>
      <template #actions="{ data }">
        <template v-if="data.type === 'expense' || !data.payment">
          <Button icon="pi pi-pencil" text rounded severity="secondary" @click="editCashflow(data)" />
          <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(data)" />
        </template>
      </template>
    </AppTable>

    <Dialog v-model:visible="cashflowDialog" header="Meta" :modal="true" :style="{ width: '100%', maxWidth: '640px' }"
      class="m-3">
      <Form :resolver="resolver" :initialValues="selectedCashflow" @submit="saveCashflow" class="grid"
        :key="selectedCashflow.$id || 'new'">
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

        <div class="col-12">
          <FileUpload accept="image/*" :maxFileSize="MAX_FILE_SIZE" fluid chooseLabel="Imagem" @select="onSelectFile"
            @remove="onRemoveFile" @clear="onClearFiles" :upload-button-props="{ style: { display: 'none' } }">
            <template #empty>
              <span>Nenhum comprovante ou NF-e selecionado.</span>
            </template>
          </FileUpload>
        </div>

        <div class="col-12 pb-0">
          <div class="flex justify-content-end gap-2">
            <Button label="Cancelar" outlined @click="cashflowDialog = false" />
            <Button type="submit" label="Salvar" :disabled="!selectedCashflow.file && !selectedCashflow.receipt_url" />
          </div>
        </div>
      </Form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue/usetoast";
import Column from "primevue/column";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import FloatLabel from "primevue/floatlabel";
import Message from "primevue/message";
import { Form } from '@primevue/forms';
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { DatePicker, InputNumber, InputText, Select, useConfirm, type FileUploadSelectEvent } from "primevue";
import { CashflowService, type ICashflow } from "@/services/cashflow";
import { dateToISOString, type IFields } from "@/functions/utils";
import AppTable from "@/components/AppTable.vue";
import { CASHFLOW_TYPES, TRANSACTION_CATEGORIES } from "@/constants/airsoft";
import dayjs from "dayjs";
import Image from "primevue/image";
import Skeleton from "primevue/skeleton";
import FileUpload from "primevue/fileupload";

const toast = useToast();
const confirm = useConfirm();

const MAX_FILE_SIZE = 2 * 1024 * 1024;

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  try {
    cashflows.value = await CashflowService.list();
  } catch (error) {
    console.error("Erro ao carregar:", error);
  } finally {
    loading.value = false;
  }
};

const cashflows = ref<ICashflow[]>([]);
const loading = ref(true);

const cashflowDialog = ref(false);
const selectedCashflow = ref<ICashflow>({} as ICashflow);

const fields = computed<IFields[]>(() => [
  { name: "description", label: "Descrição", component: InputText, col: "12" },
  {
    name: "date", label: "Data", component: DatePicker, col: "6", props: {
      showButtonBar: true,
      manualInput: false,
      showIcon: true,
      focusOnShow: false,
      iconDisplay: 'input',
      variant: 'filled'
    }
  },
  {
    name: "amount", label: "Valor", component: InputNumber, col: "6", props: {
      mode: 'currency', currency: 'BRL', locale: 'pt-BR',
      minFractionDigits: 2,
    }
  },
  {
    name: "type", label: "Tipo de Transação", component: Select, col: "6", props: {
      options: CASHFLOW_TYPES,
      optionLabel: "label",
      optionValue: "value",
    },
  },
  {
    name: "category", label: "Categoria", component: Select, col: "6", props: {
      options: TRANSACTION_CATEGORIES,
      optionLabel: "label",
      optionValue: "value",
    },
  },
]);

const cashflowSchema = z.object({
  description: z.string({ error: "Descrição obrigatória" }),
  amount: z.number({ error: "Valor obrigatório" }),
  type: z.string({ error: "Tipo obrigatório" }),
  category: z.string({ error: "Categoria obrigatória" }),
  date: z.custom().refine((date) => date instanceof Date || typeof date === 'string', "Data obrigatória").transform((date) => dateToISOString(date as Date | string)),
  file: z.any().optional()
});

const resolver = ref(zodResolver(cashflowSchema));

const onSelectFile = async (event: FileUploadSelectEvent) => {
  const file = Array.isArray(event.files) ? event.files[0] : event.files;
  selectedCashflow.value.file = file;
};

const onRemoveFile = () => {
  selectedCashflow.value.file = null;
};

const onClearFiles = () => {
  selectedCashflow.value.file = null;
};

const saveCashflow = async ({ valid, values }: any) => {
  if (!valid) return false;

  try {
    const file = selectedCashflow.value.file as File;

    const response = await CashflowService.upsert(selectedCashflow.value.$id, values, file);
    const index = cashflows.value.findIndex((item: ICashflow) => item.$id === response.$id);

    if (index !== -1) {
      cashflows.value[index] = response;
    } else {
      cashflows.value.push(response);
    }

    toast.add({
      severity: "success",
      summary: "Sucesso!",
      detail: "Meta salvo com sucesso.",
      life: 3000,
    });
  } catch (error: any) {
    console.error("Erro ao salvar:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar a meta.", life: 3000 });
  } finally {
    cashflowDialog.value = false;
  }
};

const confirmDelete = (cashflow: ICashflow) => {
  confirm.require({
    message: 'Você tem certeza que deseja excluir está meta?',
    header: cashflow.description,
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
        await CashflowService.delete(cashflow.$id);
        cashflows.value = cashflows.value.filter((item: ICashflow) => item.$id !== cashflow.$id);

        toast.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Meta excluída com sucesso!",
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

const newCashflow = async () => {
  selectedCashflow.value = {} as ICashflow;
  cashflowDialog.value = true;
};

const editCashflow = async (cashflow: ICashflow) => {
  selectedCashflow.value = {
    ...cashflow,
    date: cashflow.date ? dayjs(cashflow.date).format('DD/MM/YYYY') : null,
  };
  cashflowDialog.value = true;
};

</script>