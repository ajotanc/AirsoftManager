<template>
  <Toast />
  <ConfirmDialog :style="{ width: '360px' }"></ConfirmDialog>
  <router-view />
  <InstallPrompt />
  <ReloadPrompt />
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-family);
  background-color: var(--p-content-background);
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

<script setup lang="ts">
import InstallPrompt from '@/components/InstallPrompt.vue';
import ReloadPrompt from '@/components/ReloadPrompt.vue';
</script>