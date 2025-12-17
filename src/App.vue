<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import Toast from "primevue/toast";
</script>

<template>
  <Toast />

  <router-view />
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-family);
  background-color: var(--surface-ground);
  color: var(--text-color);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
