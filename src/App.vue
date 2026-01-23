<template>
  <Toast :breakpoints="{ '512px': { width: '92vw', left: '4vw', right: '4vw' } }" />
  <ConfirmDialog :style="{ width: '360px' }"></ConfirmDialog>
  <router-view :key="$route.fullPath" />
</template>

<script setup lang="ts">
import { useToast } from 'primevue';
import { TEAM_NAME } from './constants/airsoft';

const toast = useToast();

onMounted(() => {
  if (localStorage.getItem('pwa_updated')) {
    toast.add({
      severity: 'secondary',
      summary: 'Atualizado!',
      detail: `Nova versão do ${TEAM_NAME} ativa.`,
      life: 3000
    });

    localStorage.removeItem('pwa_updated');
  }
});
</script>

<style>
* {
  box-sizing: border-box;
}

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