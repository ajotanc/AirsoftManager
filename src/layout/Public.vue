<template>
  <div class="flex flex-column w-full min-h-screen">
    <Header />
    <router-view />
    <div class="text-center p-3 text-500 text-sm">
      AJOTA {{ year }} &copy; {{ description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from "@/components/header/Public.vue";
const year = new Date().getFullYear();
const description = import.meta.env.VITE_TITLE;
</script>
