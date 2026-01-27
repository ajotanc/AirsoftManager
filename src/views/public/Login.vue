<template>
  <div class="flex align-items-center justify-content-center flex-1 surface-ground p-3">
    <div class="surface-card p-4 shadow-2 border-round w-full lg:w-4">
      <div class="text-center mb-3">
        <img src="/exd.webp" alt="Êxodo Airsoft" class="w-6rem h-6rem" />
        <div class="text-900 text-3xl font-bold uppercase">{{ TEAM_NAME }}</div>
        <blockquote class="text-sm font-italic m-0" :cite="TEAM_NAME">"{{ TEAM_MOTTO }}"</blockquote>
      </div>

      <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="handleLogin"
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
          <FloatLabel variant="in">
            <Password name="password" :feedback="false" toggleMask class="w-full" fluid />
            <label for="password">Senha</label>
          </FloatLabel>
          <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
            {{ $form.password.error.message }}
          </Message>
        </div>

        <div class="flex flex-column gap-2">
          <Button type="submit" label="Entrar" :loading="loading" />
        </div>
      </Form>

      <div class="mt-2 text-right">
        <a @click="router.push('/forgot-password')"
          class="font-medium no-underline ml-2 text-blue-500 cursor-pointer">Esqueci minha senha</a>
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

import { Form, type FormSubmitEvent } from "@primevue/forms";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import Message from "primevue/message";
import FloatLabel from "primevue/floatlabel";
import { useToast } from "primevue";
import { TEAM_NAME, TEAM_MOTTO } from "@/constants/airsoft";

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
    email: z.email({ error: "Email inválido." }),
    password: z
      .string({ error: "A senha é obrigatória." })
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