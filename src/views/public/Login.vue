<template>
  <div class="flex align-items-center justify-content-center min-h-screen surface-ground px-4">
    <div class="surface-card p-4 shadow-2 border-round w-full lg:w-4">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">Bem-vindo</div>
        <span class="text-600 font-medium line-height-3">Faça login para continuar</span>
      </div>

      <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="handleLogin"
        class="flex flex-column gap-4">
        <div class="flex flex-column gap-2">
          <FloatLabel variant="in">
            <InputText name="email" type="text" class="w-full" fluid />
            <label for="email">Email</label>
          </FloatLabel>
          <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
            {{ $form.email.error.message }}
          </Message>
        </div>

        <div class="flex flex-column gap-2">
          <FloatLabel variant="in">
            <Password name="password" :feedback="false" toggleMask class="w-full" fluid />
            <label for="password">Senha</label>
          </FloatLabel>
          <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
            {{ $form.password.error.message }}
          </Message>
        </div>

        <Button type="submit" label="Entrar" icon="pi pi-sign-in" :loading="loading" />
      </Form>

      <div class="mt-4 text-center">
        <span class="text-600 font-medium">Não tem conta? </span>
        <a @click="router.push('/register')" class="font-medium no-underline ml-2 text-blue-500 cursor-pointer">Crie
          agora</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { z } from "zod";

// Componentes PrimeVue
import { Form, type FormSubmitEvent } from "@primevue/forms";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import Message from "primevue/message";
import FloatLabel from "primevue/floatlabel";
import { useToast } from "primevue";

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const loading = ref(false);
const initialValues = ref({
  email: "",
  password: "",
});

const resolver = zodResolver(
  z.object({
    email: z.email({ message: "Email inválido." }),
    password: z
      .string()
      .min(8, { message: "A senha deve ter no mínimo 8 caracteres." }),
  })
);

const handleLogin = async ({ valid, values }: FormSubmitEvent) => {
  if (valid) {
    loading.value = true;
    try {
      await authStore.login(values.email, values.password);
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast.add({
        severity: "error",
        summary: "Erro",
        detail: `Falha ao criar conta: ${error.message}`,
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  }
};
</script>