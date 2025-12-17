<template>
  <div class="card relative z-2">
    <Menubar :model="items" class="border-none border-bottom-1 surface-border border-noround p-3 surface-overlay">
      <template #start>
        <div class="flex align-items-center gap-2 mr-4 cursor-pointer" @click="router.push('/')">
          <i class="pi pi-shield text-2xl text-orange-500"></i>
          <span class="font-bold text-xl text-900">Êxodo Airsoft</span>
        </div>
      </template>

      <template #end>
        <div class="flex gap-2">
          <Button label="Entrar" icon="pi pi-sign-in" text @click="router.push('/login')" />
          <Button label="Alistar-se" icon="pi pi-user-plus" severity="warning" @click="router.push('/register')" />
        </div>
      </template>
    </Menubar>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import Menubar from "primevue/menubar";
import Button from "primevue/button";

const router = useRouter();

const items = [
  { label: "A Equipe", icon: "pi pi-users", command: () => router.push("/") },
  { label: "Contato", icon: "pi pi-envelope" },
];
</script>