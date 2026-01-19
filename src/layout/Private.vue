<template>
  <div class="flex flex-column min-h-screen">
    <Header />
    <router-view />
    <div class="text-center p-3 text-500 text-sm">
      AJOTA {{ year }} &copy; {{ description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from "@/components/header/Private.vue";
const year = new Date().getFullYear();
const description = import.meta.env.VITE_TITLE;
</script>