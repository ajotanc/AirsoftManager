<template>
  <div v-if="!isActiveOperator" class="col-12">
    <Card class="border-top-3 border-red-500 text-center">
      <template #content>
        <i class="pi pi-lock text-4xl text-red-500 mb-3"></i>
        <h2>Aguardando Aprovação</h2>
        <p>Aguardando validação do comando.</p>
      </template>
    </Card>
  </div>

  <div v-else class="grid">
    <div class="col-12">
      <Level :operator="operator" :qrcode="true" />
    </div>
    <div class="col-12 md:col-4">
      <Card>
        <template #title>Financeiro</template>
        <template #content>{{ openPayments.length }} Pagamento(s) em aberto</template>
      </Card>
    </div>
    <div class="col-12 md:col-4">
      <Card>
        <template #title>Arma(s)</template>
        <template #content>{{ arsenal.length }} Arma(s) cadastrada(s)</template>
      </Card>
    </div>
    <div class="col-12 md:col-4">
      <Card>
        <template #title>Loadout(s)</template>
        <template #content>{{ loadout.length }} Loadout(s) cadastrado(s)</template>
      </Card>
    </div>
    <div class="col-12">
      <Card>
        <template #title>Operadore(s) ativo(s)</template>
        <template #content>
          <OperatorList />
        </template>
      </Card>
    </div>
    <div v-if="isAdmin" class="col-12">
      <AdminBadgeScanner />
    </div>
    <div class="col-12">
      <Card>
        <template #title>Evento(s)</template>
        <template #content>
          <EventList />
        </template>
      </Card>
    </div>
    <div class="col-12">
      <Card>
        <template #title>Meta(s)</template>
        <template #content>
          <GoalList />
        </template>
      </Card>
    </div>
    <div class="col-12">
      <Card>
        <template #title>Aniversariante(s)</template>
        <template #content>
          <BirthdayList />
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import Card from "primevue/card";
import { useAuthStore } from "@/stores/auth";

import Level from "@/components/operators/Level.vue";
import EventList from "@/components/EventList.vue";
import BirthdayList from "@/components/BirthdayList.vue";
import GoalList from "@/components/GoalList.vue";
import { computed, onMounted, ref } from "vue";
import { PaymentService, type IPayment } from "@/services/payment";
import AdminBadgeScanner from "@/components/AdminBadgeScanner.vue";
import OperatorList from "@/components/operators/List.vue";

const { isActiveOperator, isAdmin, operator } = useAuthStore();
const { $id, arsenal, loadout } = operator;

const payments = ref<IPayment[]>([]);
const loading = ref(true);

onMounted(loadServices);

async function loadServices() {
  loading.value = true;

  try {
    payments.value = await PaymentService.listByOperator($id)
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

const openPayments = computed(() => payments.value.filter(p => p.status === 'created'));
</script>