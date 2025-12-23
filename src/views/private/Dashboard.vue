<template>
  <div class="grid">
    <div v-if="!isActiveOperator" class="col-12">
      <Card class="border-top-3 border-red-500 text-center">
        <template #content>
          <i class="pi pi-lock text-4xl text-red-500 mb-3"></i>
          <h2>{{ t("dashboard.pending") }}</h2>
          <p>Aguardando validação do comando.</p>
        </template>
      </Card>
    </div>

    <div v-else class="col-12">
      <h1 class="text-gray-900">Visão Geral</h1>
      <div class="grid">
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useI18n } from "vue-i18n";

import Card from "primevue/card";

const { isActiveOperator, operator: { arsenal, loadout } } = useAuthStore();
const { t } = useI18n();
</script>