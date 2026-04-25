<template>
  <div class="p-3 min-h-screen">
    <div class="flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
      <h1 class="text-2xl font-bold m-0 text-900">Transparência Financeira</h1>
      <div class="flex">
        <InputGroup>
          <Select v-model="selectedYear" :options="years" @change="loadServices" placeholder="Ano" class="w-10rem" />
          <InputGroupAddon>
            <Button icon="pi pi-refresh" @click="loadServices" :loading="loading" severity="secondary" />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>

    <FinancialTransparencySkeleton v-if="loading" />

    <div v-else class="grid">
      <div class="col-12 md:col-3">
        <div
          class="card shadow-2 p-3 border-round h-full flex flex-column justify-content-between bg-yellow-100 border-left-3 border-yellow-900 text-gray-900">
          <div class="flex align-items-center justify-content-between mb-3">
            <div>
              <span class="block font-bold mb-2">Saúde Operacional</span>
              <div class="font-bold text-xl">
                {{ paidOperatorsCount }}/{{ totalActiveOperators }} <span class="text-sm font-normal">pagantes</span>
              </div>
            </div>
            <div class="bg-yellow-200 border-round w-3rem h-3rem flex align-items-center justify-content-center">
              <i class="ri-team-line text-xl text-yellow-900"></i>
            </div>
          </div>

          <ProgressBar :value="percentage" :showValue="false" style="height: 0.5rem;"
            :pt="{ value: { style: { backgroundColor: 'var(--p-yellow-900)' } } }" />

          <div class="mt-2 text-sm flex justify-content-between">
            <div class="flex gap-1 font-bold">
              <span @click="setActiveMonth(1)" class="cursor-pointer transition-colors"
                :class="activeMonth === dayjs().subtract(1, 'month').format('MM/YYYY') ? 'text-yellow-900' : 'text-400'">
                {{ dayjs().subtract(1, 'month').format('MMMM').toUpperCase() }}
              </span>
              <span class="text-400">/</span>
              <span @click="setActiveMonth(0)" class="cursor-pointer transition-colors"
                :class="activeMonth === dayjs().format('MM/YYYY') ? 'text-yellow-900' : 'text-400'">
                {{ dayjs().format('MMMM').toUpperCase() }}
              </span>
            </div>
            <span>{{ percentage }}% concluído</span>
          </div>
        </div>
      </div>

      <div class="col-12 md:col-3">
        <div
          class="card shadow-2 p-3 border-round h-full flex flex-column justify-content-between bg-blue-100 border-left-3 border-blue-900 text-blue-900 relative">
          <div class="flex align-items-center justify-content-between">
            <div>
              <span class="block font-bold mb-2 opacity-90">Saldo em Caixa</span>
              <div class="font-bold text-xl">{{ visibility.balance ? formatCurrency(totalBalance) : 'R$ •••••' }}</div>
            </div>
            <div class="bg-blue-200 border-round w-3rem h-3rem flex align-items-center justify-content-center">
              <i class="ri-wallet-line text-xl"></i>
            </div>
          </div>
          <div class="mt-2 text-sm font-medium">Acumulado em {{ selectedYear }}</div>
          <i :class="['absolute right-0 bottom-0 m-3 cursor-pointer', visibility.balance ? 'ri-eye-off-line' : 'ri-eye-line']"
            @click="toggleVisibility('balance')"></i>
        </div>
      </div>

      <div class="col-12 md:col-3">
        <div
          class="card shadow-2 p-3 border-round h-full flex flex-column justify-content-between bg-green-100 border-left-3 border-green-900 text-green-900 relative">
          <div class="flex align-items-center justify-content-between">
            <div>
              <span class="block font-bold mb-2">Total Entradas</span>
              <div class="font-bold text-xl">+ {{ visibility.income ? formatCurrency(totalIncomes) : 'R$ •••••' }}</div>
            </div>
            <div class="bg-green-200 border-round w-3rem h-3rem flex align-items-center justify-content-center">
              <i class="ri-arrow-up-line text-xl"></i>
            </div>
          </div>
          <div class="mt-2 text-sm font-bold">
            <span :class="trends.income >= 0 ? 'text-green-900' : 'text-red-900'">
              <i :class="trends.income >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i> {{ Math.abs(trends.income) }}%
            </span>
            <span class="ml-1 font-normal">vs mês anterior</span>
          </div>
          <i :class="['absolute right-0 bottom-0 m-3 cursor-pointer', visibility.income ? 'ri-eye-off-line' : 'ri-eye-line']"
            @click="toggleVisibility('income')"></i>
        </div>
      </div>

      <div class="col-12 md:col-3">
        <div
          class="card shadow-2 p-3 border-round h-full flex flex-column justify-content-between bg-red-100 border-left-3 border-red-900 relative">
          <div class="flex align-items-center justify-content-between">
            <div>
              <span class="block text-red-900 font-bold mb-2">Total Saídas</span>
              <div class="text-red-900 font-bold text-xl">- {{ visibility.expense ? formatCurrency(totalExpenses) :
                'R$•••••' }}</div>
            </div>
            <div class="bg-red-200 border-round w-3rem h-3rem flex align-items-center justify-content-center">
              <i class="ri-arrow-down-line text-red-900 text-xl"></i>
            </div>
          </div>
          <div class="mt-2 text-sm font-bold text-red-900">
            <span :class="trends.expense <= 0 ? 'text-green-900' : 'text-red-900'">
              <i :class="trends.expense <= 0 ? 'pi pi-arrow-down' : 'pi pi-arrow-up'"></i> {{ Math.abs(trends.expense)
              }}%
            </span>
            <span class="ml-1 font-normal">vs mês anterior</span>
          </div>
          <i :class="['absolute right-0 bottom-0 m-3 cursor-pointer', visibility.expense ? 'ri-eye-off-line' : 'ri-eye-line']"
            @click="toggleVisibility('expense')"></i>
        </div>
      </div>

      <div class="col-12 lg:col-8">
        <div class="card shadow-2 p-4 border-round bg-white">
          <span class="text-xl font-bold block mb-4">Evolução Mensal (R$)</span>
          <div class="chart-container">
            <Chart type="bar" :data="barData" :options="barOptions" class="h-full" />
          </div>
        </div>
      </div>

      <div class="col-12 lg:col-4">
        <div class="card shadow-2 p-4 border-round bg-white">
          <span class="text-xl font-bold block mb-4">Gastos por Categoria</span>
          <div class="chart-container">
            <Chart type="doughnut" :data="pieData" :options="pieOptions" class="h-full" />
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="card shadow-2 p-4 border-round bg-white">
          <div class="flex justify-content-between align-items-center mb-4">
            <span class="text-xl font-bold">Últimas Movimentações</span>
            <Button label="Histórico" icon="pi pi-list" class="p-button-text" @click="cashflowDialog = true" />
          </div>

          <ul v-if="cashflows.length > 0" class="list-none p-0 m-0">
            <li v-for="flow in cashflows.slice(0, 10)" :key="flow.$id"
              class="flex align-items-center py-3 border-bottom-1 surface-border">
              <div :class="['w-3rem h-3rem flex align-items-center justify-content-center border-round mr-3',
                flow.type === 'income' ? 'bg-green-100' : 'bg-red-100']">
                <i :class="[flow.type === 'income' ? 'pi pi-plus text-green-600' : 'pi pi-minus text-red-600']"></i>
              </div>
              <div class="flex-grow-1">
                <div class="font-bold text-900">{{ flow.description }}</div>
                <div class="text-500 text-sm">
                  {{ flow.payment?.operator?.codename || 'Sem operador' }} · {{ dayjs(flow.date).format('DD/MM/YYYY') }}
                  · {{ CATEGORY_MAP[flow.category] || flow.category }}
                </div>
              </div>
              <div :class="['font-bold text-lg', flow.type === 'income' ? 'text-green-600' : 'text-red-600']">
                {{ flow.type === 'income' ? '+' : '-' }} {{ visibility[flow.type] ?
                  formatCurrency(Math.abs(flow.amount)) : 'R$ •••••' }}
              </div>
            </li>
          </ul>
          <Empty v-else label="Nenhuma transação encontrada." icon="ri-exchange-funds-line" />
        </div>
      </div>
    </div>

    <Dialog v-model:visible="cashflowDialog" header="Histórico de Movimentações" modal
      :style="{ width: '90vw', maxWidth: '768px' }">
      <AppTable :value="cashflows" :fields="fields" :loading="loading" :header="false" />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import Chart from 'primevue/chart';
import Button from 'primevue/button';
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import ProgressBar from 'primevue/progressbar';
import dayjs from "dayjs";
import 'dayjs/locale/pt-br';

import { CashflowService, type ICashflow } from "@/services/cashflow";
import { CASHFLOW_TYPES, TRANSACTION_CATEGORIES } from "@/constants/airsoft";
import AppTable from "@/components/AppTable.vue";
import { DatePicker, InputNumber, InputText } from "primevue";
import FinancialTransparencySkeleton from "@/components/skeleton/FinancialTransparencySkeleton.vue";
import { PaymentService, type IPayment } from "@/services/payment";
import { formatCurrency } from "@/functions/utils";
import Empty from "@/components/Empty.vue";
import type { IOperator } from "@/services/operator";

dayjs.locale('pt-br');

// --- ESTADO ---
const cashflows = ref<ICashflow<IPayment<IOperator>>[]>([]);
const payments = ref<IPayment[]>([]);
const loading = ref(true);
const cashflowDialog = ref(false);

const selectedYear = ref(dayjs().year());
const activeMonth = ref(dayjs().format('MM/YYYY')); // Mês selecionado para o card de Saúde
const years = ref([2024, 2025, 2026]);

const visibility = ref({ balance: true, income: true, expense: true });

// --- MÉTODOS ---
const toggleVisibility = (key: keyof typeof visibility.value) => visibility.value[key] = !visibility.value[key];

const setActiveMonth = (monthsAgo: number) => {
  activeMonth.value = dayjs().subtract(monthsAgo, 'month').format('MM/YYYY');
};

async function loadServices() {
  loading.value = true;
  try {
    const [cashflowsData, paymentsData] = await Promise.all([
      CashflowService.listAnnual<IPayment<IOperator>>(selectedYear.value),
      PaymentService.list()
    ]);
    cashflows.value = cashflowsData;
    payments.value = paymentsData;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

onMounted(loadServices);

const CATEGORY_MAP = Object.fromEntries(TRANSACTION_CATEGORIES.map(c => [c.value, c.label]));

const totalActiveOperators = computed(() =>
  payments.value.filter(p => p.category === 'monthly_fee' && p.reference === activeMonth.value).length
);

const paidOperatorsCount = computed(() =>
  cashflows.value.filter(c => c.category === 'monthly_fee' && c.reference === activeMonth.value).length
);

const percentage = computed(() =>
  totalActiveOperators.value ? Math.round((paidOperatorsCount.value / totalActiveOperators.value) * 100) : 0
);

// Totais Anuais
const incomes = computed(() => cashflows.value.filter(c => c.type === 'income'));
const totalIncomes = computed(() => incomes.value.reduce((acc, curr) => acc + Number(curr.amount), 0));
const expenses = computed(() => cashflows.value.filter(c => c.type === 'expense'));
const totalExpenses = computed(() => expenses.value.reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0));
const totalBalance = computed(() => totalIncomes.value - totalExpenses.value);

// Tendências (Compara Mês Atual vs Anterior)
const trends = computed(() => {
  const current = dayjs().format('MM/YYYY');
  const prev = dayjs().subtract(1, 'month').format('MM/YYYY');

  const getTotals = (ref: string) => cashflows.value
    .filter(f => f.reference === ref)
    .reduce((acc, f) => {
      const val = Math.abs(Number(f.amount));
      f.type === 'income' ? acc.inc += val : acc.exp += val;
      return acc;
    }, { inc: 0, exp: 0 });

  const currTotals = getTotals(current);
  const prevTotals = getTotals(prev);

  const calc = (c: number, p: number) => p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100);

  return { income: calc(currTotals.inc, prevTotals.inc), expense: calc(currTotals.exp, prevTotals.exp) };
});

// Gráficos
const monthlyTotals = computed(() => {
  const inc = Array(12).fill(0);
  const exp = Array(12).fill(0);

  cashflows.value.forEach(({ reference, type, amount }) => {
    if (reference.endsWith(selectedYear.value.toString())) {
      const index = parseInt(reference.substring(0, 2), 10) - 1;
      const val = Math.abs(Number(amount));
      type === 'income' ? inc[index] += val : exp[index] += val;
    }
  });
  return { inc, exp };
});

const barData = computed(() => ({
  labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  datasets: [
    { label: 'Entradas', backgroundColor: '#99C19B', data: monthlyTotals.value.inc },
    { label: 'Saídas', backgroundColor: '#E595A4', data: monthlyTotals.value.exp }
  ]
}));

const pieData = computed(() => {
  const catTotals: Record<string, number> = {};
  
  expenses.value.forEach(e => {
    const label = CATEGORY_MAP[e.category] || e.category;
    catTotals[label] = (catTotals[label] || 0) + Math.abs(Number(e.amount));
  });

  return {
    labels: Object.keys(catTotals),
    datasets: [{ data: Object.values(catTotals), backgroundColor: ['#8095B5', '#99C19B', '#E7C67F', '#A384E6', '#E595A4'] }]
  };
});

// Configurações Table/Chart
const fields = ref([
  { name: "payment.operator.codename", label: "Operador", component: InputText },
  { name: "date", label: "Data", component: DatePicker },
  { name: "description", label: "Descrição", component: InputText },
  { name: "category", label: "Categoria", component: Select, props: { options: TRANSACTION_CATEGORIES } },
  { name: "type", label: "Tipo", component: Select, props: { options: CASHFLOW_TYPES } },
  { name: "amount", label: "Valor", component: InputNumber, props: { mode: 'currency', currency: 'BRL', locale: 'pt-BR' } }
]);

const barOptions = { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { ticks: { callback: (v: any) => formatCurrency(v) } } } };
const pieOptions = { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 40vh;
  min-height: 300px;
}
</style>