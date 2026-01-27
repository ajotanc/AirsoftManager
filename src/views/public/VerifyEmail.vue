<template>
  <div class="flex align-items-center justify-content-center flex-1 surface-ground p-3">
    <div class="surface-card p-4 shadow-2 border-round w-full lg:w-4">
      <div class="flex flex-column align-items-center gap-3 text-center">
        <img src="/exd.webp" alt="Êxodo Airsoft" class="w-6rem h-6rem" />
        <h2 class="text-900 font-bold m-0">Verificação de E-mail</h2>

        <div v-if="state === 'loading'" class="w-full flex flex-column align-items-center gap-3">
          <ProgressSpinner class="w-3rem h-3rem" strokeWidth="4" />
          <p class="m-0 text-700">Validando sua credencial...</p>
        </div>

        <div v-if="state === 'success'" class="w-full flex flex-column align-items-center gap-3">
          <i class="pi pi-check-circle text-green-500 text-6xl"></i>
          <div class="flex flex-column">
            <p class="m-0 text-900 font-bold text-lg">E-mail verificado com sucesso!</p>
            <p class="m-0 mt-1 text-600">Agora você tem acesso ao sistema do time.</p>
          </div>
          <Button label="Dashboard" class="w-full mt-2" @click="router.push('/dashboard')" />
        </div>

        <div v-if="state === 'error'" class="w-full flex flex-column align-items-center gap-3">
          <i class="pi pi-times-circle text-red-500 text-6xl"></i>
          <div class="flex flex-column">
            <p class="m-0 text-900 font-bold text-lg">Falha na verificação</p>
            <p class="m-0 mt-1 text-600">Link de verificação inválido.</p>
          </div>
          <Button label="Tentar Novamente" class="w-full" @click="router.push('/login')" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { account } from '@/services/appwrite';
import { useOperator } from '@/composables/useOperator';

const route = useRoute();
const router = useRouter();
const { authStore } = useOperator();


type VerificationState = 'loading' | 'success' | 'error';
const state = ref<VerificationState>('loading');

onMounted(async () => {
  const userId = route.query.userId as string;
  const secret = route.query.secret as string;

  if (!userId || !secret) {
    state.value = 'error';
    return;
  }

  try {
    await account.updateEmailVerification({ userId, secret });
    await authStore.init();

    state.value = 'success';
  } catch (error: any) {
    state.value = 'error';
  }
});
</script>