<template>
  <div v-if="!isActiveOperator" class="col-12">
    <Card class="border-top-3 border-red-500 text-center">
      <template #content>
        <div class="flex flex-column gap-3">
          <i class="pi pi-lock text-4xl text-red-500"></i>
          <h2 class="m-0">Aguardando Aprovação</h2>
          <div class="flex flex-column gap-1">
            <span>Aguardando validação do comando.</span>
            <span>Finalize o seu cadastro, <span class="font-bold cursor-pointer text-red-500"
                @click="$router.push('/profile')">clique aqui</span>!</span>
          </div>
        </div>
      </template>
    </Card>
  </div>

  <div v-else-if="isActiveOperator" class="grid p-3">

    <div class="col-12">
      <Level :operator="operator" :qrcode="true" />
    </div>

    <template v-if="!isVisitor">
      <div class="col-12 md:col-3">
        <Card>
          <template #title>Financeiro</template>
          <template #content>{{ openPayments.length }} Pagamento(s) em aberto</template>
        </Card>
      </div>
      <div class="col-12 md:col-3">
        <Card>
          <template #title>Escola</template>
          <template #content>{{ missingCerts?.length }} Prova(s) pendente(s)</template>
        </Card>
      </div>
      <div class="col-12 md:col-3">
        <Card>
          <template #title>Arma(s)</template>
          <template #content>{{ arsenal.length }} Arma(s) cadastrada(s)</template>
        </Card>
      </div>
      <div class="col-12 md:col-3">
        <Card>
          <template #title>Loadout(s)</template>
          <template #content>{{ loadout.length }} Loadout(s) cadastrado(s)</template>
        </Card>
      </div>
      <div class="col-12">
        <Card>
          <template #title>Cronograma</template>
          <template #content>
            <ArenaSchedule />
          </template>
        </Card>
      </div>
      <div class="col-12">
        <Card>
          <template #content>
            <OperatorList />
          </template>
        </Card>
      </div>
    </template>

    <div class="col-12">
      <Card>
        <template #title>Evento(s)</template>
        <template #content>
          <EventList />
        </template>
      </Card>
    </div>

    <template v-if="!isVisitor">
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
    </template>
  </div>

  <nav v-if="isAdmin" class="admin-nav-container shadow-3">
    <div v-for="(item, index) in adminActions" :key="index" class="nav-item">
      <router-link v-if="item.to" :to="item.to" class="nav-link">
        <i :class="[item.icon, 'nav-icon']"></i>
        <span v-if="item.label" class="nav-label">{{ item.label }}</span>
      </router-link>
      <button v-else @click="item.command" class="nav-link btn-action">
        <i :class="[item.icon, 'nav-icon']"></i>
        <span v-if="item.label" class="nav-label">{{ item.label }}</span>
      </button>
    </div>
  </nav>

  <AppScanner v-model:visible="openScannerDialog" @detect="onDetect" header="QR Code" />

</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import router from "@/router";

import Card from "primevue/card";

import Level from "@/components/operators/Level.vue";
import EventList from "@/components/EventList.vue";
import BirthdayList from "@/components/BirthdayList.vue";
import OperatorList from "@/components/operators/List.vue";
import GoalList from "@/components/GoalList.vue";
import ArenaSchedule from "@/components/ArenaSchedule.vue";
import AppScanner from "@/components/AppScanner.vue";

import { PaymentService, type IPayment } from "@/services/payment";
import { SchoolService } from "@/services/school";
import { useOperator } from "@/composables/useOperator";
import type { AdminAction } from "@/functions/utils";

const { operator, isActiveOperator, isAdmin, authStore: { isVisitor } } = useOperator();
const { $id, arsenal, loadout } = operator.value;

const openScannerDialog = ref(false);

const {
  data: missingCerts,
} = useQuery({
  queryKey: ['school', 'missing', $id],
  queryFn: () => SchoolService.getMissingCertifications($id),
});

const {
  data: payments,
  // isLoading
} = useQuery({
  queryKey: ['payments', 'operator', $id],
  queryFn: () => PaymentService.listByOperator($id),
});

const openPayments = computed(() => {
  if (!payments.value) return [];
  return payments.value.filter((p: IPayment) => p.status === 'created');
});

function onDetect(operatorId?: string) {
  if (operatorId) {
    router.push(`/verify/operator/${operatorId}`);
  }
};

const adminActions = ref<AdminAction[]>([
  {
    icon: 'ri-group-line',
    to: '/management/operators'
  },
  {
    icon: 'ri-wallet-line',
    to: '/management/finance/payments'
  },
  {
    icon: 'ri-exchange-funds-line',
    to: '/management/finance/payments'
  },
  {
    icon: 'ri-calendar-event-line',
    to: '/management/events'
  },
  {
    icon: 'ri-calendar-schedule-line',
    to: '/management/schedules'
  },
  {
    icon: 'ri-health-book-line',
    command: () => openScannerDialog.value = true
  },
]);

</script>

<style>
.admin-nav-container {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 90vw;
  max-width: 375px;
  background: var(--p-card-background);
  border-radius: var(--p-card-border-radius);
  box-shadow: var(--p-card-shadow);
  padding: 1rem;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-item .nav-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: var(--p-button-border-radius);
  text-decoration: none;
  color: var(--p-blue-500);
  background-color: var(--p-blue-100);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.nav-item .nav-link:hover {
  background-color: var(--p-blue-200);
}
</style>