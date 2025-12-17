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
      <Button label="Junte-se ao Pelotão" icon="pi pi-arrow-right" class="p-button-rounded p-button-lg"
        @click="router.push('/register')" />
    </div>

    <div class="surface-ground px-4 py-8 md:px-6 lg:px-8">
      <div class="grid">
        <div class="col-12 md:col-4 mb-4 px-5">
          <span class="p-3 shadow-2 mb-3 inline-block surface-card" style="border-radius: 10px">
            <i class="pi pi-desktop text-4xl text-blue-500"></i>
          </span>
          <div class="text-900 mb-3 font-medium">Gestão de Arsenal</div>
          <span class="text-700 text-sm line-height-3">Cadastre suas AEGs, GBBs e mantenha o controle das manutenções e
            cronagens.</span>
        </div>
        <div class="col-12 md:col-4 mb-4 px-5">
          <span class="p-3 shadow-2 mb-3 inline-block surface-card" style="border-radius: 10px">
            <i class="pi pi-users text-4xl text-orange-500"></i>
          </span>
          <div class="text-900 mb-3 font-medium">Hierarquia Militar</div>
          <span class="text-700 text-sm line-height-3">Sistema de patentes e funções: Assaulter, Sniper, DMR, Médico e
            Suporte.</span>
        </div>
        <div class="col-12 md:col-4 mb-4 px-5">
          <span class="p-3 shadow-2 mb-3 inline-block surface-card" style="border-radius: 10px">
            <i class="pi pi-shield text-4xl text-green-500"></i>
          </span>
          <div class="text-900 mb-3 font-medium">Loadouts</div>
          <span class="text-700 text-sm line-height-3">Organize seu equipamento para diferentes tipos de missão e
            jogos.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import { useRouter } from "vue-router";

const router = useRouter();
</script>