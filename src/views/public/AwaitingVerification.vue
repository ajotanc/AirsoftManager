<template>
  <div class="flex align-items-center justify-content-center flex-1 surface-ground p-3">
    <div class="surface-card p-4 shadow-2 border-round w-full lg:w-4">
      <div class="flex flex-column gap-3 mb-3 text-center">
        <i class="pi pi-envelope text-blue-500 text-6xl"></i>
        <h2 class="text-900 font-bold m-0">Verifique seu E-mail</h2>
        <p class="text-600 m-0">Enviamos um link de confirmação para o seu e-mail. Você precisa verificar sua conta
          para acessar o sistema do time.</p>
      </div>
      <div class="flex flex-column gap-3">
        <Button label="Já verifiquei, fazer login" @click="handleCheck" />
        <Button label="Reenviar e-mail" severity="secondary" text @click="handleResend" :loading="loading" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();
const loading = ref(false);

const handleCheck = async () => {
  await authStore.logout();
  router.push('/login');
};

const handleResend = async () => {
  loading.value = true;
  try {
    await authStore.resendVerification();
    toast.add({ severity: 'info', summary: 'E-mail enviado', detail: 'Verifique sua caixa de entrada.', life: 3000 });
  } finally {
    loading.value = false;
  }
};
</script>