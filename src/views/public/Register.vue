<template>
  <div class="flex align-items-center justify-content-center min-h-screen surface-ground px-4">
    <div class="surface-card p-4 shadow-2 border-round w-full lg:w-4">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">
          Junte-se ao esquadrão
        </div>
        <span class="text-600 font-medium line-height-3">...</span>
      </div>

      <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="handleRegister"
        class="flex flex-column gap-4">
        <div class="flex flex-column gap-2">
          <FloatLabel variant="in">
            <InputText name="name" type="text" class="w-full" fluid />
            <label for="name">Nome Completo</label>
          </FloatLabel>
          <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
            {{ $form.name.error.message }}
          </Message>
        </div>

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

        <Button type="submit" label="Cadastrar" icon="pi pi-sign-in" :loading="loading" />
      </Form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { z } from "zod";

import { Form, type FormSubmitEvent } from "@primevue/forms";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import Message from "primevue/message";
import FloatLabel from "primevue/floatlabel";

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const initialValues = ref({
  name: "",
  email: "",
  password: "",
});

const resolver = zodResolver(
  z.object({
    name: z.string().min(1, { message: "O nome competo é obrigatório." }),
    email: z
      .email({ message: "Email inválido." }),
    password: z
      .string()
      .min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
  })
);

const handleRegister = async ({ valid, values }: FormSubmitEvent) => {
  if (valid) {
    loading.value = true;
    try {
      await authStore.register(values.email, values.password, values.name);
      toast.add({
        severity: "success",
        summary: "Bem-vindo",
        detail: "Conta criada!",
        life: 3000,
      });

      router.push("/profile");
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao criar conta.",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  }
};
</script>