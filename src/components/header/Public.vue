<template>
  <div class="card relative z-2">
    <Menubar :model="items" class="border-none border-bottom-1 surface-border border-noround p-3 surface-overlay">
      <template #start>
        <div class="flex align-items-center gap-2 mr-4 cursor-pointer" @click="router.push('/')">
          <img src="/exd.webp" :alt="TEAM_NAME" class="h-4rem">
        </div>
      </template>

      <template #end>
        <div class="flex flex-column md:flex-row gap-2">
          <Button label="Entrar" outlined @click="router.push('/login')" />
          <Button label="Alistar-se" @click="router.push('/register')" />
        </div>
      </template>
    </Menubar>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import Menubar from "primevue/menubar";
import Button from "primevue/button";
import { TEAM_NAME } from "@/constants/airsoft";

const router = useRouter();

const items = [
  { label: "A Equipe", icon: "pi pi-users", command: () => router.push("/") },
  { label: "Contato", icon: "pi pi-envelope" },
];
</script>