<template>
  <div class="card">
    <AppTable title="Pagamento(s)" resourceName="transações" :value="payments" :fields="fields" :loading="loading">
      <template #extra-columns-end>
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
          :disabled="data.status !== 'created'" v-tooltip.top="'Efetuar Pagamento'" />
      </template>
    </AppTable>

    <PaymentDialog v-model:visible="paymentDialog" :payment="selectedPayment" :pixData="pixData"
      @submit="savePayment" />
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
import { type IFields } from "@/functions/utils";
import { TRANSACTION_STATUS, TRANSACTION_CATEGORIES } from "@/constants/airsoft";
import PaymentDialog from "@/components/PaymentDialog.vue";
import type { IOperator } from "@/services/operator";
import { useRoute } from "vue-router";
import { useOperator } from "@/composables/useOperator";

const { operator, isAdmin } = useOperator();

const toast = useToast();
const confirm = useConfirm();
const route = useRoute();

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
  } catch (error) {
    console.error("Erro ao carregar:", error);
  } finally {
    loading.value = false;
  }
};

const payments = ref<IPayment[]>([]);
const pixData = ref({ payload: '', base64: '' });

const loading = ref(true);

const paymentDialog = ref(false);
const selectedPayment = ref<IPayment>({} as IPayment);

const accessAdmin = computed(() => {
  return isAdmin && route.path.includes('admin');
})

const fields = computed<IFields[]>(() => [
  { name: "operator.codename", label: "Operador", component: InputText, col: "6", show: !accessAdmin.value },
  { name: "reference", label: "Referência", component: InputText, col: "6" },
  {
    name: "due_date", label: "Data de Vencimento", component: DatePicker, col: "6", props: {
      showButtonBar: true,
      manualInput: false,
      showIcon: true,
      focusOnShow: false,
      iconDisplay: 'input',
      variant: 'filled'
    }
  },
  { name: "description", label: "Descrição", component: InputText, col: "6" },
  {
    name: "category", label: "Categoria", component: Select, col: "12", props: {
      options: TRANSACTION_CATEGORIES, optionLabel: "label", optionValue: "value",
    },
  },
  {
    name: "status", label: "Status", component: Select, col: "12", props: {
      options: TRANSACTION_STATUS, optionLabel: "label", optionValue: "value",
    },
  },
  {
    name: "amount", label: "Valor", component: InputNumber, col: "6", props: {
      mode: 'currency', currency: 'BRL', locale: 'pt-BR',
      minFractionDigits: 2
    }
  },
]);

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
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar o visitante.", life: 3000 });
  } finally {
    selectedPayment.value = {} as IPayment;
    paymentDialog.value = false;
  }
};

const confirmPayment = (payment: IPayment) => {
  const operator = payment.operator as IOperator;

  confirm.require({
    message: 'Você tem certeza que deseja confirmar este pagamento?',
    header: `${payment.description} · ${operator.codename}`,
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
</script>