<template>
  <div class="flex flex-column min-h-screen bg-gray-50 dark:bg-gray-900">
    <AppHeader />
    <div class="flex-grow-1 md:p-6 p-4">
      <router-view />
    </div>
    <div class="text-center p-3 text-500 text-sm border-top-1 surface-border">
      &copy; 2025 Airsoft Ops System
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from "@/components/AppHeader.vue";
</script>