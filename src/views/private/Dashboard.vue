<template>
  <div class="grid">
    <div v-if="!authStore.isActiveOperator" class="col-12">
      <Card class="border-top-3 border-red-500 text-center">
        <template #content>
          <i class="pi pi-lock text-4xl text-red-500 mb-3"></i>
          <h2>{{ t("dashboard.pending") }}</h2>
          <p>Aguardando validação do comando.</p>
        </template>
      </Card>
    </div>

    <div v-else class="col-12">
      <h1>Visão Geral</h1>
      <div class="grid">
        <div class="col-12 md:col-4">
          <Card>
            <template #title>Arsenal</template>
            <template #content>0 Armas cadastradas</template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useI18n } from "vue-i18n";

import Card from "primevue/card";

const authStore = useAuthStore();
const { t } = useI18n();
</script>