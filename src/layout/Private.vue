<template>
  <div class="flex flex-column min-h-screen">
    <Header />
    <div class="col-12 md:col p-3">
      <router-view />
    </div>
    <div class="text-center p-3 text-500 text-sm">
      AJOTA {{ year }} &copy; Airsoft Managerment System
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from "@/components/header/Private.vue";
const year = new Date().getFullYear();
</script>