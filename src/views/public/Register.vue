<template>
  <div class="flex align-items-center justify-content-center flex-1 surface-ground p-3">
    <div class="surface-card p-4 shadow-2 border-round w-full lg:w-4">
      <div class="text-center mb-3">
        <div class="text-900 text-3xl font-bold uppercase">JUNTE-SE A NÓS</div>
        <span class="text-sm font-italic m-0">Onde a estratégia encontra a irmandade.</span>
      </div>

      <Form :resolver="resolver" :initialValues="initialValues" @submit="handleRegister" class="flex flex-column gap-4">
        <FormField name="name" v-slot="$field" class="flex flex-column gap-2">
          <FloatLabel variant="in">
            <InputText type="text" class="w-full" v-model="$field.value" fluid />
            <label>Nome Completo</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>
        <FormField name="email" v-slot="$field" class="flex flex-column gap-2">
          <FloatLabel variant="in">
            <InputText type="text" class="w-full" v-model="$field.value" fluid />
            <label>E-mail</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>
        <FormField name="password" v-slot="$field" class="flex flex-column gap-2">
          <FloatLabel variant="in">
            <Password :feedback="false" toggleMask class="w-full" v-model="$field.value" fluid />
            <label>Senha</label>
          </FloatLabel>
          <template v-if="$field.invalid">
            <Message v-for="(error, index) of $field.errors" :key="index" severity="error" size="small" class="text-xs"
              variant="simple">{{ error.message }}</Message>
          </template>
        </FormField>
        <FormField name="confirmPassword" v-slot="$field" class="flex flex-column gap-2">
          <FloatLabel variant="in">
            <Password :feedback="false" toggleMask class="w-full" v-model="$field.value" fluid />
            <label>Confirmar Senha</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <Button type="submit" label="Cadastrar" :loading="loading" />
      </Form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { z } from "zod";

import { Form, FormField, type FormSubmitEvent } from "@primevue/forms";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import Message from "primevue/message";
import { useOperator } from "@/composables/useOperator";

const { authStore } = useOperator();
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const initialValues = ref({
  name: "",
  email: "",
  password: "",
  confirmPassword: ""
});

const resolver = zodResolver(
  z.object({
    name: z.string().min(1, { error: "O nome completo é obrigatório." })
      .trim()
      .regex(/^[A-ZÀ-Ÿa-zà-ÿ]+(?:\s+[A-ZÀ-Ÿa-zà-ÿ]+)+$/, {
        error: "Informe o seu nome completo.",
      }),
    email: z.string().min(1, { error: "O e-mail é obrigatório." }).email({ error: "Email inválido." }),
    password: z
      .string()
      .min(8, { error: "A senha deve ter no mínimo 8 caracteres." })
      .regex(/[A-Z]/, { error: "Pelo menos uma letra maiúscula." })
      .regex(/[a-z]/, { error: "Pelo menos uma letra minúscula." })
      .regex(/[0-9]/, { error: "Pelo menos um número." })
      .regex(/[^a-zA-Z0-9]/, { error: "Pelo menos um caractere especial." }),
    confirmPassword: z.string().min(1, { error: "A confirmação é obrigatória." }),
  })
    .refine((data) => data.password === data.confirmPassword, {
      error: "As senhas não coincidem.",
      path: ["confirmPassword"],
    })
);

const handleRegister = async ({ valid, values }: FormSubmitEvent) => {
  if (valid) {
    loading.value = true;
    try {
      await authStore.register(values.email, values.password, values.name);
      toast.add({ severity: "success", summary: "Bem-vindo", detail: "Verifique seu e-mail!", life: 5000 });
      router.push("/awaiting-verification");
    } catch (error: any) {
      toast.add({ severity: "error", summary: "Erro", detail: error.error || error.message, life: 3000 });
    } finally {
      loading.value = false;
    }
  }
};
</script>