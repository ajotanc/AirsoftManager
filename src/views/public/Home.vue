<template>
  <div>
    <div class="surface-section px-4 py-8 md:px-6 lg:px-8 text-center">
      <div class="mb-3 font-bold text-2xl">
        <span class="text-900">Operações Táticas, </span>
        <span class="text-orange-500">Gestão Eficiente</span>
      </div>
      <div class="text-700 text-sm mb-6">
        Controle seu arsenal, loadout e carreira no Airsoft.
      </div>
      <Button v-if="checkRegistrationPeriod()" rounded size="large" label="Junte-se ao Pelotão" icon="pi pi-arrow-right" @click="router.push('/register')" />
      <div v-else class="text-orange-500 font-bold italic">
        Recrutamento encerrado. Aguarde a próxima convocação.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import { useRouter } from "vue-router";
import { checkRegistrationPeriod } from "@/functions/utils";

const router = useRouter();
</script>