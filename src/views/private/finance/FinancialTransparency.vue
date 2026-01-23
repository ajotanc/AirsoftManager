<template>
  <div class="surface-ground p-3 min-h-screen">
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
                {{ paidOperatorsCount }} / {{ totalActiveOperators }} <span class="text-sm font-normal">pagantes</span>
              </div>
            </div>
            <div class="bg-yellow-200 border-round w-3rem h-3rem flex align-items-center justify-content-center">
              <i class="pi pi-users text-xl text-yellow-900"></i>
            </div>
          </div>

          <ProgressBar :value="percentage" :showValue="false" style="height: 0.5rem;"
            :pt="{ value: { style: { backgroundColor: 'var(--p-yellow-900)' } } }" />

          <div class="mt-2 text-sm flex justify-content-between">
            <span class="font-bold">{{ currentMonthName }}</span>
            <span>{{ percentage }}% concluído</span>
          </div>
        </div>
      </div>

      <div class="col-12 md:col-3">
        <div
          class="card shadow-2 p-3 border-round h-full flex flex-column justify-content-between bg-blue-100 border-left-3 border-blue-900 text-blue-900">
          <div class="flex align-items-center justify-content-between">
            <div>
              <span class="block font-bold mb-2 opacity-90">Saldo em Caixa</span>
              <div class="font-bold text-xl">{{ formatCurrency(totalBalance) }}</div>
            </div>
            <div class="bg-blue-200 border-round w-3rem h-3rem flex align-items-center justify-content-center">
              <i class="pi pi-wallet text-xl"></i>
            </div>
          </div>
          <div class="mt-2 text-sm font-medium">Acumulado em {{ selectedYear }}</div>
        </div>
      </div>

      <div class="col-12 md:col-3">
        <div
          class="card shadow-2 p-3 border-round h-full flex flex-column justify-content-between  bg-green-100 border-left-3 border-green-900 text-green-900">
          <div class="flex align-items-center justify-content-between">
            <div>
              <span class="block font-bold mb-2">Total Entradas</span>
              <div class="font-bold text-xl">+ {{ formatCurrency(totalIncomes) }}</div>
            </div>
            <div class="bg-green-200 border-round w-3rem h-3rem flex align-items-center justify-content-center">
              <i class="pi pi-arrow-up  text-xl"></i>
            </div>
          </div>
          <div class="mt-2 text-sm font-bold">
            <span :class="trends.income >= 0 ? 'text-green-900' : 'text-red-900'">
              <i :class="trends.income >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i> {{ Math.abs(trends.income) }}%
            </span>
            <span class="ml-1 font-normal">vs mês anterior</span>
          </div>
        </div>
      </div>

      <div class="col-12 md:col-3">
        <div
          class="card shadow-2 p-3 border-round h-full flex flex-column justify-content-between bg-red-100 border-left-3 border-red-900">
          <div class="flex align-items-center justify-content-between">
            <div>
              <span class="block text-red-900 font-bold mb-2">Total Saídas</span>
              <div class="text-red-900 font-bold text-xl">- {{ formatCurrency(totalExpenses) }}</div>
            </div>
            <div class="bg-red-200 border-round w-3rem h-3rem flex align-items-center justify-content-center">
              <i class="pi pi-arrow-down text-red-900 text-xl"></i>
            </div>
          </div>
          <div class="mt-2 text-sm font-bold text-red-900">
            <span :class="trends.expense <= 0 ? 'text-green-900' : 'text-red-900'">
              <i :class="trends.expense <= 0 ? 'pi pi-arrow-down' : 'pi pi-arrow-up'"></i> {{ Math.abs(trends.expense)
              }}%
            </span>
            <span class="ml-1 font-normal">vs mês anterior</span>
          </div>
        </div>
      </div>

      <div class="col-12 lg:col-8">
        <div class="card shadow-2 p-4 border-round bg-white">
          <span class="text-xl font-bold block mb-4">Evolução Mensal (R$)</span>
          <Chart type="bar" :data="barData" :options="barOptions" :height="300" />
        </div>
      </div>

      <div class="col-12 lg:col-4">
        <div class="card shadow-2 p-4 border-round bg-white">
          <span class="text-xl font-bold block mb-4">Gastos por Categoria</span>
          <Chart type="doughnut" :data="pieData" :options="pieOptions" :height="300" />
        </div>
      </div>

      <div class="col-12">
        <div class="card shadow-2 p-4 border-round bg-white">
          <div class="flex justify-content-between align-items-center mb-4">
            <span class="text-xl font-bold">Últimas Movimentações</span>
            <Button label="Histórico" icon="pi pi-list" class="p-button-text" @click="cashflowDialog = true" />
          </div>

          <ul v-if="cashflows.length > 0" class="list-none p-0 m-0">
            <li v-for="flow in cashflows.slice(0, 6)" :key="flow.$id"
              class="flex align-items-center py-3 border-bottom-1 surface-border">
              <div :class="['w-3rem h-3rem flex align-items-center justify-content-center border-round mr-3',
                flow.type === 'income' ? 'bg-green-100' : 'bg-red-100']">
                <i :class="[flow.type === 'income' ? 'pi pi-plus text-green-600' : 'pi pi-minus text-red-600']"></i>
              </div>
              <div class="flex-grow-1">
                <div class="font-bold text-900">{{ flow.description }}</div>
                <div class="text-500 text-sm">
                  {{ dayjs(flow.date).format('DD/MM/YYYY') }} · {{ categoryMap[flow.category] || flow.category }}
                </div>
              </div>
              <div :class="['font-bold text-lg', flow.type === 'income' ? 'text-green-600' : 'text-red-600']">
                {{ flow.type === 'income' ? '+' : '-' }} {{ formatCurrency(Math.abs(flow.amount)) }}
              </div>
            </li>
          </ul>
          <Empty v-else label="Nenhuma transação encontrada." icon="ri ri-exchange-funds-line" />
        </div>
      </div>
    </div>

    <Dialog v-model:visible="cashflowDialog" header="Histórico de Movimentações" :modal="true"
      :style="{ width: '100%', maxWidth: '768px' }">
      <AppTable title="Transações" :value="cashflows" :fields="fields" :loading="loading" :header="false" />
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

dayjs.locale('pt-br');

const cashflows = ref<ICashflow[]>([]);
const payments = ref<IPayment[]>([]);
const loading = ref(true);
const cashflowDialog = ref(false);
const selectedYear = ref(dayjs().year());
const years = ref([2024, 2025, 2026]);

onMounted(loadServices);

async function loadServices() {
  loading.value = true;
  try {
    const [cashflowsData, paymentsData] = await Promise.all([
      CashflowService.listAnnual(selectedYear.value),
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

const fields = ref([
  { name: "date", label: "Data", component: DatePicker },
  { name: "description", label: "Descrição", component: InputText },
  { name: "category", label: "Categoria", component: Select, props: { options: TRANSACTION_CATEGORIES } },
  { name: "type", label: "Tipo de Transação", component: Select, props: { options: CASHFLOW_TYPES } },
  { name: "amount", label: "Valor", component: InputNumber, props: { mode: 'currency', currency: 'BRL', locale: 'pt-BR' } }
]);

const currentMonthName = computed(() => dayjs().format('MMMM').toUpperCase());
const totalActiveOperators = computed(() => payments.value.filter(p => p.category === 'monthly_fee').length);
const paidOperatorsCount = computed(() => {
  const currentMonth = dayjs().format('MM/YYYY');
  return cashflows.value.filter(c => c.category === 'monthly_fee' && dayjs(c.date).format('MM/YYYY') === currentMonth).length;
});
const percentage = computed(() => totalActiveOperators.value ? Math.round((paidOperatorsCount.value / totalActiveOperators.value) * 100) : 0);

const categoryMap = computed(() => Object.fromEntries(TRANSACTION_CATEGORIES.map(c => [c.value, c.label])));

const totalIncomes = computed(() => cashflows.value.filter(c => c.type === 'income' && dayjs(c.date).year() === selectedYear.value).reduce((acc, curr) => acc + Number(curr.amount), 0));
const totalExpenses = computed(() => cashflows.value.filter(c => c.type === 'expense' && dayjs(c.date).year() === selectedYear.value).reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0));
const totalBalance = computed(() => totalIncomes.value - totalExpenses.value);

const trends = computed(() => {
  const now = dayjs();
  const currentM = now.month();
  const prevM = now.subtract(1, 'month').month();
  let currIn = 0, prevIn = 0, currOut = 0, prevOut = 0;

  cashflows.value.forEach(f => {
    const d = dayjs(f.date);
    const m = d.month();
    const val = Math.abs(Number(f.amount));
    if (m === currentM && d.year() === now.year()) f.type === 'income' ? currIn += val : currOut += val;
    else if (m === prevM) f.type === 'income' ? prevIn += val : prevOut += val;
  });

  const calc = (cur: number, pre: number) => {
    if (pre === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - pre) / pre) * 100);
  };
  return { income: calc(currIn, prevIn), expense: calc(currOut, prevOut) };
});

const monthlyTotals = computed(() => {
  const inc = Array(12).fill(0);
  const exp = Array(12).fill(0);
  cashflows.value.forEach(f => {
    const d = dayjs(f.date);
    if (d.year() === selectedYear.value) {
      const m = d.month();
      f.type === 'income' ? inc[m] += Number(f.amount) : exp[m] += Math.abs(Number(f.amount));
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
  const expenses = cashflows.value.filter(c => c.type === 'expense' && dayjs(c.date).year() === selectedYear.value);
  const cats = [...new Set(expenses.map(c => c.category))];
  const data = cats.map(cat => expenses.filter(e => e.category === cat).reduce((a, b) => a + Math.abs(Number(b.amount)), 0));
  return {
    labels: cats.map(c => categoryMap.value[c] || c),
    datasets: [{ data, backgroundColor: ['#8095B5', '#99C19B', '#E7C67F', '#A384E6', '#E595A4'] }]
  };
});

const barOptions = { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c: any) => `${c.dataset.label}: ${formatCurrency(c.raw)}` } } }, scales: { y: { ticks: { callback: (v: any) => formatCurrency(v) } } } };
const pieOptions = { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c: any) => ` ${c.label}: ${formatCurrency(c.raw)}` } } } };
</script>