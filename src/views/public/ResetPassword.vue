<template>
  <div class="flex align-items-center justify-content-center flex-1 surface-ground p-3">
    <div class="surface-card p-4 shadow-2 border-round w-full lg:w-4">
      <div class="text-center mb-3">
        <div class="text-900 text-3xl font-bold uppercase">ALTERAR SENHA</div>
        <span class="text-sm font-italic m-0">Mantenha seu perfil seguro e operacional.</span>
      </div>

      <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="handleSubmit"
        class="flex flex-column gap-3">
        <div class="flex flex-column gap-2">
          <FloatLabel variant="in">
            <Password name="password" :feedback="false" toggleMask class="w-full" fluid />
            <label for="password">Senha</label>
          </FloatLabel>
          <template v-if="$form.password?.invalid">
            <Message v-for="(error, index) of $form.password.errors" :key="index" severity="error" size="small"
              variant="simple">{{ error.message }}</Message>
          </template>
        </div>

        <div class="flex flex-column gap-2">
          <Button type="submit" label="Salvar" :loading="loading" class="w-full" />
        </div>
      </Form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';
import type { FormSubmitEvent } from '@primevue/forms';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import z from 'zod';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const loading = ref(false);
const initialValues = ref({
  password: "",
});


const resolver = zodResolver(
  z.object({
    password: z
      .string()
      .min(8, { error: "A senha deve ter no mínimo 8 caracteres." })
      .regex(/[A-Z]/, { error: "A senha deve conter pelo menos uma letra maiúscula." })
      .regex(/[a-z]/, { error: "A senha deve conter pelo menos uma letra minúscula." })
      .regex(/[0-9]/, { error: "A senha deve conter pelo menos um número." })
      .regex(/[^a-zA-Z0-9]/, { error: "A senha deve conter pelo menos um caractere especial." }),
  })
);

const handleSubmit = async ({ valid, values }: FormSubmitEvent) => {
  if (valid) {
    loading.value = true;

    try {
      const userId = route.query.userId as string;
      const secret = route.query.secret as string;

      await authStore.resetPassword(userId, secret, values.password);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Senha alterada! Faça login agora.', life: 3000 });
      router.push('/login');
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível trocar a senha.', life: 3000 });
    } finally {
      loading.value = false;
    }
  }
};
</script>