<template>
  <div class="flex flex-column min-h-screen surface-ground">
    <Header />

    <div class="flex-grow-1">
      <router-view />
    </div>

    <div class="surface-section p-4 border-top-1 surface-border text-center">
      <div class="flex justify-content-center align-items-center gap-2 mb-2">
        <i class="pi pi-facebook text-xl text-600 cursor-pointer"></i>
        <i class="pi pi-instagram text-xl text-600 cursor-pointer"></i>
        <i class="pi pi-whatsapp text-xl text-600 cursor-pointer"></i>
      </div>
      <span class="text-500 text-sm">&copy; 2025 Airsoft Team Management. Todos os direitos
        reservados.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from "@/components/header/Public.vue";
</script>
