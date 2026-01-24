<template>
  <div class="flex align-items-center justify-content-center flex-1 surface-ground p-3">
    <div class="surface-card p-4 shadow-2 border-round w-full lg:w-4">
      <div class="text-center mb-3">
        <div class="text-900 text-3xl font-bold uppercase">RECUPERAR SENHA</div>
        <span class="text-sm font-italic m-0">Insira seu e-mail para receber o link de
          redefinição.</span>
      </div>

      <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="handleSubmit"
        class="flex flex-column gap-3">
        <div class="flex flex-column gap-2">
          <FloatLabel variant="in">
            <InputText name="email" type="text" class="w-full" fluid />
            <label for="email">E-mail</label>
          </FloatLabel>
          <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
            {{ $form.email.error.message }}
          </Message>
        </div>

        <div class="flex flex-column gap-2">
          <Button type="submit" label="Enviar" :loading="loading" class="w-full" />
          <Button label="Voltar" variant="text" @click="router.push('/login')" />
        </div>
      </Form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import type { FormSubmitEvent } from '@primevue/forms';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import z from 'zod';

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const initialValues = ref({
  email: "",
});

const resolver = zodResolver(
  z.object({
    email: z.email({ message: "Email inválido." }),
  })
);

const handleSubmit = async ({ valid, values }: FormSubmitEvent) => {
  if (valid) {
    loading.value = true;

    try {
      await authStore.forgotPassword(values.email);
      toast.add({ severity: 'success', summary: 'E-mail enviado', detail: 'Verifique sua caixa de entrada.', life: 5000 });
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erro', detail: 'E-mail não encontrado.', life: 3000 });
    } finally {
      loading.value = false;
    }
  }
};
</script>