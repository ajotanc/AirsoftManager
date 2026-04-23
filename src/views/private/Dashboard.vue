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
          <template #title>Base Militar</template>
          <template #content>
            <OperatorList />
          </template>
        </Card>
      </div>
      <div v-if="isAdmin" class="col-12">
        <Card class="mt-2">
          <template #title>Verificar Operador</template>
          <template #content>
            <Button label="QR Code" icon="pi pi-qrcode" class="camera-switch p-button-outlined mt-2"
              @click="openScannerDialog = true" />
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

  <AppScanner v-model:visible="openScannerDialog" @detect="onDetect" header="QR Code" />

</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import router from "@/router";

import Card from "primevue/card";
import Button from "primevue/button";

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
</script>