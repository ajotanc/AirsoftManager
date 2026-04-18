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