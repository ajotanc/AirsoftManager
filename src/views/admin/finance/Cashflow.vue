<template>
  <div class="card">
    <AppTable title="Transações" :value="cashflowsFiltered" :fields="fields" :loading="loading">
      <template #header-actions>
        <Button label="Nova" icon="pi pi-plus" size="small" @click="newCashflow" />
        <Button icon="ri-file-excel-line" severity="success" size="small" v-tooltip.top="'Exportar Excel'" @click="exportCashflow" />
      </template>
      <template #header-filter>
        <Select v-model="selectedMonth" :options="months" optionLabel="label" optionValue="value" />
      </template>

      <template #extra-columns-end>
        <Column header="Imagem">
          <template #body="{ data }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>
              <Image :src="data.receipt_url" :alt="data.title" width="50" height="50" v-if="data.receipt_url"
                class="overflow-hidden border-circle border-1 border-100" preview style="object-fit: cover;" />
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

      <template #extra-footer>
        <div class="flex flex-column lg:flex-row justify-content-between align-items-center gap-3 py-2 px-2">
          <div class="flex align-items-center gap-2 text-sm text-color-secondary">
            <i class="pi pi-calendar text-primary"></i>
            <span class="font-medium">Mês selecionado:</span>
            <Tag :value="selectedMonthLabel" severity="info" class="font-bold uppercase" />
            <span class="text-xs text-muted-color">({{ cashflowsFiltered.length }} {{ cashflowsFiltered.length === 1 ? 'transação' : 'transações' }})</span>
          </div>

          <div class="flex flex-wrap align-items-center justify-content-center lg:justify-content-end gap-3 md:gap-4 w-full lg:w-auto">
            <!-- Entradas -->
            <div class="flex align-items-center gap-2 p-2 border-round surface-ground border-1 border-white-alpha-10">
              <div class="flex align-items-center justify-content-center w-2rem h-2rem border-round bg-green-500 text-white">
                <i class="pi pi-arrow-down-left font-bold text-sm"></i>
              </div>
              <div class="flex flex-column">
                <span class="text-xs text-color-secondary uppercase font-semibold">Entradas</span>
                <Skeleton v-if="loading" width="4.5rem" height="1.2rem" />
                <span v-else class="text-green-400 font-bold text-base">
                  + {{ formatCurrency(totalIncomes) }}
                </span>
              </div>
            </div>

            <!-- Saídas -->
            <div class="flex align-items-center gap-2 p-2 border-round surface-ground border-1 border-white-alpha-10">
              <div class="flex align-items-center justify-content-center w-2rem h-2rem border-round bg-red-500 text-white">
                <i class="pi pi-arrow-up-right font-bold text-sm"></i>
              </div>
              <div class="flex flex-column">
                <span class="text-xs text-color-secondary uppercase font-semibold">Saídas</span>
                <Skeleton v-if="loading" width="4.5rem" height="1.2rem" />
                <span v-else class="text-red-400 font-bold text-base">
                  - {{ formatCurrency(totalExpenses) }}
                </span>
              </div>
            </div>

            <!-- Saldo Atual (Real sem filtro) -->
            <div class="flex align-items-center gap-2 p-2 border-round surface-ground border-1 border-white-alpha-10" v-tooltip.top="'Saldo real acumulado (sem filtro)'">
              <div
                class="flex align-items-center justify-content-center w-2rem h-2rem border-round"
                :class="currentBalance >= 0 ? 'bg-primary text-primary-contrast' : 'bg-red-500 text-white'"
              >
                <i
                  class="pi font-bold text-sm"
                  :class="currentBalance >= 0 ? 'pi-wallet' : 'pi-exclamation-circle'"
                ></i>
              </div>
              <div class="flex flex-column">
                <span class="text-xs text-color-secondary uppercase font-semibold">Saldo Atual</span>
                <Skeleton v-if="loading" width="5rem" height="1.2rem" />
                <span
                  v-else
                  class="font-bold text-base"
                  :class="currentBalance >= 0 ? 'text-primary' : 'text-red-400'"
                >
                  {{ formatCurrency(currentBalance) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #extra-button-page-end>
        <InputGroup>
          <Select :options="months" v-model="selectedMonth" optionValue="value" optionLabel="label" />
          <InputGroupAddon>
            <Button severity="success" icon="ri-file-excel-line" v-tooltip.top="'Exportar'" @click="exportCashflow" />
          </InputGroupAddon>
        </InputGroup>
      </template>
    </AppTable>

    <Dialog v-model:visible="cashflowDialog" header="Meta" modal :style="{ width: '90vw', maxWidth: '667px' }">
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
import { dateToISOString, export2Excel, formatCurrency, toSentenceCase, type IFields } from "@/functions/utils";
import AppTable from "@/components/AppTable.vue";
import { CASHFLOW_TYPES, TRANSACTION_CATEGORIES, MAX_FILE_SIZE } from "@/constants/airsoft";
import dayjs from "dayjs";
import Image from "primevue/image";
import Skeleton from "primevue/skeleton";
import FileUpload from "primevue/fileupload";
import Tag from "primevue/tag";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";
import type { IPayment } from "@/services/payment";
import type { IOperator } from "@/services/operator";

const toast = useToast();
const confirm = useConfirm();

const selectedMonth = ref('ALL');

const cashflowsFiltered = computed(() => {
  if (selectedMonth.value === 'ALL') return cashflows.value;

  return cashflows.value.filter(cashflow => {
    return cashflow.reference === selectedMonth.value;
  });
});

const months = [
  { label: 'Todos', value: 'ALL' },
  ...Array.from({ length: dayjs().month() + 1 }, (_, i) => {
    const month = dayjs().month(i);
    return {
      label: toSentenceCase(month.format('MMMM')),
      value: month.format('MM/YYYY')
    }
  })
];

const selectedMonthLabel = computed(() => {
  const found = months.find((m) => m.value === selectedMonth.value);
  return found ? found.label : selectedMonth.value;
});

// Cálculos de soma de entradas e saídas para o mês selecionado
const totalIncomes = computed<number>(() => {
  return cashflowsFiltered.value
    .filter((item: ICashflow) => item.type === "income")
    .reduce((acc: number, item: ICashflow) => acc + Number(item.amount || 0), 0);
});

const totalExpenses = computed<number>(() => {
  return cashflowsFiltered.value
    .filter((item: ICashflow) => item.type === "expense")
    .reduce((acc: number, item: ICashflow) => acc + Math.abs(Number(item.amount || 0)), 0);
});

// Saldo atual disponível geral (todas as entradas e saídas de tudo)
const currentBalance = computed<number>(() => {
  const allIncomes = cashflows.value
    .filter((item: ICashflow) => item.type === "income")
    .reduce((acc: number, item: ICashflow) => acc + Number(item.amount || 0), 0);

  const allExpenses = cashflows.value
    .filter((item: ICashflow) => item.type === "expense")
    .reduce((acc: number, item: ICashflow) => acc + Math.abs(Number(item.amount || 0)), 0);

  return allIncomes - allExpenses;
});

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
  { name: "payment.operator.codename", label: "Operador", component: InputText, hidden: true },
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
      filter: true,
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

const saveCashflow = async ({ valid, values }: { valid: boolean; values: Partial<ICashflow> }) => {
  if (!valid) return false;

  try {
    const file = selectedCashflow.value.file as File;
    const payload = {
      ...values,
      receipt_url: selectedCashflow.value.receipt_url,
    }

    const response = await CashflowService.upsert(selectedCashflow.value.$id, payload, file);
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
  } catch (error) {
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
        await CashflowService.delete(cashflow);
        cashflows.value = cashflows.value.filter((item: ICashflow) => item.$id !== cashflow.$id);

        toast.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Meta excluída com sucesso!",
          life: 3000,
        });

      } catch (error) {
        const err = error as Error;
        console.error("Erro ao enviar formulário:", err);

        toast.add({
          severity: "error",
          summary: "Erro",
          detail: err.message || "Falha ao excluir os dados. Tente novamente.",
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

const exportCashflow = async () => {
  try {
    const dataToExport = cashflowsFiltered.value.map((c: ICashflow) => {
      const payment = typeof c.payment === "object" && c.payment !== null ? (c.payment as IPayment) : undefined;
      const operator =
        payment && typeof payment.operator === "object" && payment.operator !== null
          ? (payment.operator as IOperator)
          : undefined;

      return {
        "Descrição": c.description,
        "Tipo": CASHFLOW_TYPES.find((t) => t.value === c.type)?.label || (c.type === "income" ? "Entrada" : "Saída"),
        "Categoria": TRANSACTION_CATEGORIES.find((cat) => cat.value === c.category)?.label || c.category,
        "Valor": formatCurrency(c.amount),
        "Data": c.date ? dayjs(c.date).format("DD/MM/YYYY") : "",
        "Referência": c.reference,
        "Operador": operator?.codename || "",
      };
    });

    const summary = "Fluxo de Caixa";
    await export2Excel(`${dayjs().unix()}-FLUXO-DE-CAIXA`, dataToExport, summary);
    toast.add({
      severity: "success",
      summary,
      detail: "Exportação concluída! Verifica a tua pasta de transferências.",
      life: 3000,
    });
  } catch (error) {
    const err = error as Error;
    console.error("Erro ao exportar fluxo de caixa:", err);
    toast.add({
      severity: "error",
      summary: "Erro",
      detail: err.message || "Falha ao exportar os dados.",
      life: 3000,
    });
  }
};
</script>