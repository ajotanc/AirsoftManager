<template>
  <div class="flex align-items-center justify-content-center min-h-screen surface-ground p-4">
    <div v-if="loading">Buscando dados no sistema...</div>

    <div v-else-if="operator" class="surface-card p-4 shadow-4 border-round max-w-30rem w-full text-center">
      <Avatar :image="operator.avatar" :icon="!operator.avatar ? 'pi-user' : undefined" class="w-6rem h-6rem" shape="circle" />
      <h1 class="text-2xl font-bold m-0">{{ operator.name }}</h1>
      <span>{{ operator.codename }}</span>
    </div>
    <div v-else class="text-red-500 font-bold">
      Operador não encontrado ou QR Code inválido.
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { OperatorService, type IOperator } from '@/services/operator';

const route = useRoute();
const operator = ref < IOperator > ({} as IOperator);
const loading = ref(true);

onMounted(async () => {
  const operatorId = route.params.id as string;

  try {
    const response = await OperatorService.row(operatorId);
    operator.value = response;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

</script>