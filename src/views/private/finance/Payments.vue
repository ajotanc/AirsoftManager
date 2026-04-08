<template>
  <div class="card">
    <AppTable title="Pagamento(s)" resourceName="transações" :value="payments" :fields="fields" :loading="loading">
      <template v-if="accessAdmin" #header-actions>
        <Button label="Nova" icon="pi pi-plus" size="small" @click="newTransaction" />
      </template>
      <template #extra-columns-end>
        <Column header="Atraso">
          <template #body="{ data }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>
              <Tag v-if="invoice(data).overdue" :value="invoice(data).days" severity="danger" />
            </template>
          </template>
        </Column>
        <Column header="Comprovante">
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
        <Button v-if="accessAdmin" icon="pi pi-check" rounded @click="confirmPayment(data)"
          :disabled="data.status !== 'pending'" severity="success" v-tooltip.top="'Confirmar Pagamento'" />
        <Button v-if="operator.$id === data.operator.$id" icon="pi pi-dollar" rounded @click="makePayment(data)"
          :disabled="!['created', 'overdue'].includes(data.status)" v-tooltip.top="'Efetuar Pagamento'" />
        <Button v-if="accessAdmin" icon="pi pi-trash" rounded @click="deletePayment(data)"
          :disabled="data.status === 'paid'" severity="danger" v-tooltip.top="'Excluir Pagamento'" />
      </template>

      <template #extra-button-page-end>
        <InputGroup>
          <Select :options="months" v-model="selectedMonth" optionValue="value" optionLabel="label" />
          <InputGroupAddon>
            <Button severity="success" icon="ri-file-excel-line" v-tooltip.top="'Exportar'" @click="exportPayments" />
          </InputGroupAddon>
        </InputGroup>
      </template>
    </AppTable>

    <PaymentDialog v-model:visible="paymentDialog" :payment="selectedPayment" :pixData="pixData"
      @submit="savePayment" />

    <AppFormDialog v-model:visible="transactionDialog"
      :header="selectedPayment.$id ? 'Editar Transação' : 'Nova Transação'" :fields="fields"
      :initialValues="selectedPayment" :resolver="resolver" @submit="saveTransaction" @field-change="onFieldChange" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { DatePicker, InputNumber, useConfirm } from "primevue";
import { PaymentService, type IPayment } from "@/services/payment";
import { dateToISOString, export2Excel, toSentenceCase, type FieldChangePayload, type IFields } from "@/functions/utils";
import { TRANSACTION_STATUS, TRANSACTION_CATEGORIES } from "@/constants/airsoft";
import PaymentDialog from "@/components/PaymentDialog.vue";
import { OperatorService, type IOperator } from "@/services/operator";
import { useRoute } from "vue-router";
import { useOperator } from "@/composables/useOperator";
import z from "zod";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import AppFormDialog from "@/components/AppFormDialog.vue";
import { GoalService, type IGoal } from "@/services/goal";
import { formatCurrency } from "@brazilian-utils/brazilian-utils";

const { operator, isAdmin } = useOperator();

const toast = useToast();
const confirm = useConfirm();
const route = useRoute();

const payments = ref<IPayment[]>([]);
const pixData = ref({ payload: '', base64: '' });

const operators = ref<IOperator[]>([]);
const goals = ref<IGoal[]>([]);

const loading = ref(true);

const paymentDialog = ref(false);
const transactionDialog = ref(false);
const selectedPayment = ref<IPayment>({} as IPayment);

const accessAdmin = computed(() => {
  return isAdmin && route.path.includes('admin');
})

const selectedMonth = ref('ALL');

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

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  try {
    if (accessAdmin.value) {
      payments.value = await PaymentService.list();
    } else {
      payments.value = await PaymentService.listByOperator(operator.value.$id);
    }

    operators.value = await OperatorService.listActive();
    goals.value = await GoalService.list();
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados.' });
  } finally {
    loading.value = false;
  }
};

const fields = computed<IFields[]>(() => [
  {
    name: "operator",
    label: "Operador",
    component: Select,
    col: '12',
    props: {
      options: operators.value,
      optionLabel: "codename",
      optionValue: "$id",
      filter: true,
    },
    hiddenTable: !accessAdmin.value
  },
  { name: "description", label: "Descrição", component: InputText, col: "12" },
  {
    name: "amount", label: "Valor", component: InputNumber, col: "6", props: {
      mode: 'currency', currency: 'BRL', locale: 'pt-BR',
      minFractionDigits: 2
    }
  },
  {
    name: "reference", label: "Mês de Referência", component: InputText, col: "6", hidden: true
  },
  {
    name: "due_date", label: "Data de vencimento", component: DatePicker, col: "6", props: {
      showButtonBar: true,
      manualInput: false,
      showIcon: true,
      focusOnShow: false,
      iconDisplay: 'input',
      variant: 'filled'
    }
  },
  {
    name: "category", label: "Categoria", component: Select, col: "6", props: {
      options: TRANSACTION_CATEGORIES,
      optionLabel: "label",
      optionValue: "value",
    },
  },
  {
    name: "status", label: "Status", component: Select, col: "6", props: {
      options: TRANSACTION_STATUS,
      optionLabel: "label",
      optionValue: "value",
      readonly: true
    },
  },
  {
    name: "goal",
    label: "Meta Relacionada",
    component: Select,
    col: "12",
    hidden: selectedPayment.value.category !== 'goal',
    hiddenTable: true,
    props: {
      options: goals.value,
      optionLabel: "title",
      optionValue: "$id",
    }
  },
]);

const transactionSchema = z.object({
  operator: z.string({ error: "Operador obrigatório" }),
  description: z.string({ error: "Descrição obrigatória" }),
  amount: z.number({ error: "Valor obrigatório" }),
  status: z.string({ error: "Status obrigatório" }),
  due_date: z.custom().refine((date) => date instanceof Date || typeof date === 'string', "Data obrigatória").transform((date) => dateToISOString(date as Date | string)),
});

const goalSchema = z.object({
  category: z.string({ error: "Categoria obrigatória" }),
  goal: z.string().nullish().optional(),
}).superRefine((data, ctx) => {
  if (data.category === 'goal' && !data.goal) {
    ctx.addIssue({
      code: 'custom',
      message: "Selecione a meta para esta transação",
      path: ['goal'],
    });
  }
});

const resolver = zodResolver(transactionSchema.and(goalSchema));

const onFieldChange = (payload: FieldChangePayload<IPayment>) => {
  const { name, value } = payload;
  selectedPayment.value = {
    ...selectedPayment.value,
    [name]: value
  };
};

const makePayment = async (payment: IPayment) => {
  selectedPayment.value = payment;
  paymentDialog.value = true;
};

const savePayment = async ({ file }: { file: File }) => {
  try {
    const response = await PaymentService.payment(selectedPayment.value.$id, file);
    const index = payments.value.findIndex((item) => item.$id === response.$id);

    if (index !== -1) {
      payments.value[index] = response;
    } else {
      payments.value.push(response);
    }

    toast.add({
      severity: "success",
      summary: "Sucesso!",
      detail: "Pagamento encaminhado com sucesso, aguarde a aprovação do financeiro.",
      life: 3000,
    });
  } catch (error: any) {
    console.error("Erro ao salvar:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar o pagamento.", life: 3000 });
  } finally {
    selectedPayment.value = {} as IPayment;
    paymentDialog.value = false;
  }
};

const confirmPayment = (payment: IPayment) => {
  const operator = payment.operator as IOperator;

  confirm.require({
    message: 'Você tem certeza que deseja confirmar este pagamento?',
    header: `${payment.description} · ${operator.codename} `,
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
        const response = await PaymentService.confirmPayment(payment.$id);

        const paymentDetails = payments.value.find((item) => item.$id === payment.$id)!;
        paymentDetails.status = response.status;

        toast.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Pagamento confirmado com sucesso!",
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

const deletePayment = (payment: IPayment) => {
  const operator = payment.operator as IOperator;

  if (payment.status === 'paid') {
    return toast.add({
      severity: "error",
      summary: "Erro",
      detail: "Você não pode excluir um pagamento já pago.",
      life: 3000,
    })
  }

  confirm.require({
    message: 'Você tem certeza que deseja excluir este pagamento?',
    header: `${payment.description} · ${operator.codename} `,
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
        await PaymentService.delete(payment);
        payments.value = payments.value.filter((item: IPayment) => item.$id !== payment.$id);

        toast.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Pagamento excluído com sucesso!",
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

const newTransaction = () => {
  selectedPayment.value = {
    status: "pending",
    due_date: dayjs().format('DD/MM/YYYY')
  } as IPayment;
  transactionDialog.value = true;
};

const saveTransaction = async (values: IPayment) => {
  try {
    const payload = {
      ...values,
      reference: dayjs().format('MM/YYYY')
    }

    const response = await PaymentService.transaction(payload);
    const index = payments.value.findIndex((item) => item.$id === response.$id);

    if (index !== -1) {
      payments.value[index] = response;
    } else {
      payments.value.push(response);
    }

    toast.add({
      severity: "success",
      summary: "Sucesso!",
      detail: "Pagamento cadastrado com sucesso.",
      life: 3000,
    });
  } catch (error: any) {
    console.error("Erro ao salvar:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar o pagamento.", life: 3000 });
  } finally {
    selectedPayment.value = {} as IPayment;
    transactionDialog.value = false;
  }
}

const invoice = (payment: IPayment) => {

  if (payment.status === 'paid') {
    return {
      overdue: false,
      days: 0
    }
  }
  const today = dayjs();
  const dueDate = dayjs(payment?.due_date);

  const days = today.diff(dueDate, 'days');

  return {
    overdue: today.isAfter(dueDate) && days > 0,
    days: `${days} dia${days > 1 ? 's' : ''}`
  }
}

const exportPayments = async () => {
  const data = payments.value.filter(p => {
    if (selectedMonth.value === 'ALL') return true;
    return p.reference === selectedMonth.value;
  });

  const dataToExport = data.map(p => {
    const operator = p.operator as IOperator;
    return {
      "Codinome": operator.codename,
      "Descrição": p.description,
      "Referência": p.reference,
      "Valor": formatCurrency(p.amount),
      "Categoria": TRANSACTION_CATEGORIES.find(c => c.value === p.category)?.label,
      "Status": TRANSACTION_STATUS.find(s => s.value === p.status)?.label,
    }
  });

  const summary = "Pagamentos";
  await export2Excel(`${dayjs().unix()}-PAGAMENTOS`, dataToExport, summary);
  toast.add({ severity: 'success', summary, detail: 'Exportação concluída! Verifica a tua pasta de transferências.', life: 3000 });
};
</script>