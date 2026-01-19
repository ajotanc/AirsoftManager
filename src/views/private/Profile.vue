<template>
  <div class="flex align-items-center justify-content-center min-h-screen surface-ground px-2 py-2">
    <div class="surface-card p-4 shadow-2 border-round w-full lg:w-12">
      <div class="flex justify-content-between align-items-start">
        <div class="avatar-wrapper cursor-pointer" @click="triggerFileInput">
          <Avatar :image="operator.avatar" :icon="!operator.avatar ? 'pi pi-user' : undefined"
            class="text-xl bg-gray-200" size="xlarge" shape="circle" :style="loading ? 'opacity: 0.5' : ''" />

          <div class="avatar-overlay">
            <i class="pi pi-camera text-white text-xl"></i>
          </div>

          <div v-if="loading" class="avatar-loading">
            <i class="pi pi-spin pi-spinner text-white text-2xl font-bold"></i>
          </div>
          <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleUpdateAvatar" />
        </div>
        <div class="flex flex-column ml-3">
          <div class="text-900 text-right font-bold">Graduação</div>
          <Rating v-model="operator.rating" />
        </div>
      </div>

      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">Ficha de Cadastro</div>
        <span class="text-600 font-medium">Preencha seus dados completos</span>
      </div>

      <Form ref="form" v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="handleUpdateProfile"
        class="flex flex-column gap-3">

        <Panel header="Identificação" toggleable>
          <div class="grid formgrid">
            <FormField name="name" v-slot="$field" class="field col-12 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label>Nome Completo</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="codename" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label>Codinome / Nome de Guerra</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="identity" v-slot="$field" class="field col-12 md:col-3 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputMask v-model="$field.value" mask="999.999.999-99" inputmode="numeric" class="w-full" fluid />
                <label>CPF</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="general_registration" v-slot="$field" class="field col-12 md:col-3 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" inputmode="numeric" class="w-full" fluid />
                <label>RG</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="birth_date" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <DatePicker v-model="$field.value" class="w-full" dateFormat="dd/mm/yy" showIcon showButtonBar
                  iconDisplay="input" :showOnFocus="true" :manualInput="false" fluid />
                <label>Data de Nascimento</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="blood_type" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <Select v-model="$field.value" :options="BLOOD_TYPES" class="w-full" fluid />
                <label>Tipo Sanguíneo</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="number_fdba" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label>Nº de Registro FBDA</label>
              </FloatLabel>
            </FormField>

            <FormField name="mother_name" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label>Nome da Mãe</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="father_name" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label>Nome do Pai</label>
              </FloatLabel>
            </FormField>

            <FormField name="phone" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputMask v-model="$field.value" mask="(99) 99999-9999" class="w-full" inputmode="numeric" fluid />
                <label>Celular / WhatsApp</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="category" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <Select v-model="$field.value" :options="CATEGORIES_OPTIONS" optionLabel="label" optionValue="value"
                  class="w-full" fluid />
                <label>Categoria</label>
              </FloatLabel>
            </FormField>

            <FormField name="experience" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <Select v-model="$field.value" :options="EXPERIENCES" optionLabel="label" optionValue="value"
                  class="w-full" fluid />
                <label>Nível de Conhecimento</label>
              </FloatLabel>
            </FormField>

            <FormField name="instagram" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label>Instagram (Opcional)</label>
              </FloatLabel>
            </FormField>

            <FormField name="shirt_size" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <Select v-model="$field.value" :options="SHIRT_SIZES" class="w-full" fluid />
                <label>Tamanho da Camisa</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="referral_source" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <Select v-model="$field.value" :options="SOURCES" optionLabel="label" optionValue="value" class="w-full"
                  fluid />
                <label>Como conheceu?</label>
              </FloatLabel>
            </FormField>

            <FormField name="quote" v-slot="$field" class="field col-12 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label>Citação</label>
              </FloatLabel>
            </FormField>
          </div>
        </Panel>

        <Panel header="Endereço" toggleable>
          <div class="grid formgrid">
            <FormField name="cep" v-slot="$field" class="field col-12 md:col-3 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputMask v-model="$field.value" mask="99999-999" class="w-full" @blur="handleCep" fluid />
                <label>CEP</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="address" v-slot="$field" class="field col-12 md:col-7 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label>Logradouro (Rua/Av)</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="address_number" v-slot="$field" class="field col-12 md:col-2 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label>Nº</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="neighborhood" v-slot="$field" class="field col-12 md:col-5 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label>Bairro</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="city" v-slot="$field" class="field col-12 md:col-5 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label>Cidade</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="state" v-slot="$field" class="field col-12 md:col-2 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label>UF</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>
          </div>
        </Panel>

        <Panel header="Ficha Médica" toggleable>
          <div class="grid formgrid">
            <FormField name="health_plan" v-slot="$field" class="field col-12 md:col-3 flex align-items-center">
              <div class="flex align-items-center">
                <Checkbox v-model="$field.value" binary inputId="health_plan" />
                <label for="health_plan" class="ml-2 cursor-pointer">Possui Plano de Saúde?</label>
              </div>
            </FormField>

            <FormField name="health_plan_name" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" :disabled="!$form.health_plan?.value" fluid />
                <label>Nome do plano</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="health_plan_number" v-slot="$field" class="field col-12 md:col-3 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" :disabled="!$form.health_plan?.value" fluid />
                <label>Nº da Carteira</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="continuous_medication" v-slot="$field"
              class="field col-12 md:col-3 flex align-items-center">
              <div class="flex align-items-center">
                <Checkbox v-model="$field.value" binary inputId="continuous_medication" />
                <label for="continuous_medication" class="ml-2 cursor-pointer">Usa medicação contínua?</label>
              </div>
            </FormField>

            <FormField name="medication_details" v-slot="$field" class="field col-12 md:col-9 flex flex-column gap-1">
              <FloatLabel variant="in">
                <AutoComplete v-model="$field.value" multiple :typeahead="false" fluid
                  :disabled="!$form.continuous_medication?.value"
                  @keydown="(e: KeyboardEvent) => handleAddItem(e, $field)" :input-props="{
                    enterkeyhint: 'done',
                    inputmode: 'text'
                  }" />
                <label>Quais medicamentos? (Separe com , ou ;)</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="allergies" v-slot="$field" class="field col-12 flex flex-column gap-1">
              <FloatLabel variant="in">
                <AutoComplete v-model="$field.value" multiple :typeahead="false" fluid
                  @keydown="(e: KeyboardEvent) => handleAddItem(e, $field)" :input-props="{
                    enterkeyhint: 'done',
                    inputmode: 'text'
                  }" />
                <label>Alergias (Separe com , ou ;)</label>
              </FloatLabel>
            </FormField>
          </div>
        </Panel>

        <Panel header=" Contato de Emergência" toggleable>
          <div class="grid formgrid">
            <FormField name="emergency_contact" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label>Nome do Contato</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{
                $field.error.message }}
              </Message>
            </FormField>

            <FormField name="emergency_contact_phone" v-slot="$field"
              class="field col-12 md:col-6 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputMask v-model="$field.value" mask="(99) 99999-9999" class="w-full" fluid />
                <label>Telefone do Contato</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{
                $field.error.message }}
              </Message>
            </FormField>
          </div>
        </Panel>

        <div class="grid formgrid">
          <div class="col-12 mt-4">
            <FormField name="media_consent" v-slot="$field" class="flex align-items-center mb-3">
              <Checkbox v-model="$field.value" binary inputId="media_consent" />
              <label for="media_consent" class="ml-2">Aceito o uso da minha imagem para fins de divulgação.</label>
            </FormField>

            <FormField name="terms_accepted" v-slot="$field" class="flex flex-column gap-1">
              <div class="flex align-items-center">
                <Checkbox v-model="$field.value" binary inputId="terms_accepted" />
                <label for="terms_accepted" class="ml-2">Li e aceito os termos de serviço e regulamento interno.</label>
              </div>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>
          </div>
        </div>

        {{ $form.errors }}
        <div class="mt-4">
          <Button type="submit" label="Salvar" class="w-full md:w-auto" :loading="loading" />
        </div>
      </Form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { storeToRefs } from "pinia";
import { z } from "zod";
import { Form, FormField } from "@primevue/forms";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Message from "primevue/message";
import FloatLabel from "primevue/floatlabel";
import InputMask from "primevue/inputmask";
import Checkbox from "primevue/checkbox";
import DatePicker from "primevue/datepicker";
import AutoComplete from "primevue/autocomplete";
import Select from "primevue/select";
import Panel from "primevue/panel";
import Rating from "primevue/rating";

import { useAuthStore } from "@/stores/auth";
import {
  isValidIdentity,
  addressByCep,
  formatDate,
  handleAddItem
} from "@/functions/utils";
import { OperatorService, type IOperator } from "@/services/operator";

import { CATEGORIES_OPTIONS, SOURCES, SHIRT_SIZES, BLOOD_TYPES, EXPERIENCES } from "@/constants/airsoft";

const authStore = useAuthStore();
const { operator } = storeToRefs(authStore);

const router = useRouter();
const toast = useToast();

const loading = ref(false);
const form = ref();

const fileInput = ref<HTMLInputElement | null>(null);

const initialValues = computed(() => {
  const op = operator.value as IOperator;
  if (!op) return {} as IOperator;

  return {
    ...op,
    birth_date: op.birth_date ? new Date(op.birth_date).toLocaleDateString("pt-BR") : null,
  };
});

const staticSchema = z.object({
  name: z.string({ error: "Nome completo obrigatório" }).min(1, "Nome completo obrigatório"),
  codename: z.string({ error: "Codinome obrigatório" }).min(1, "Codinome obrigatório"),
  identity: z.string({ error: "CPF obrigatório" })
    .refine(isValidIdentity, "CPF inválido")
    .transform((v) => v.replace(/\D/g, "")),
  general_registration: z.string({ error: "RG obrigatório" })
    .transform((v) => v.replace(/\D/g, "")),
  birth_date: z.custom().refine((date) => date instanceof Date || typeof date === 'string', "Data obrigatória").transform((date) => date && formatDate(date).toISOString()),
  blood_type: z.string({ error: "Tipo sanguíneo obrigatório" }),
  mother_name: z.string({ error: "Nome da mãe obrigatório" }),
  phone: z.string({ error: "Telefone obrigatório" }).transform((v) => v.replace(/\D/g, "")),
  cep: z.string({ error: "CEP obrigatório" }).transform((v) => v.replace(/\D/g, "")),
  address: z.string({ error: "Endereço obrigatório" }),
  address_number: z.string({ error: "Número obrigatório" }),
  neighborhood: z.string({ error: "Bairro obrigatório" }),
  city: z.string({ error: "Cidade obrigatória" }),
  state: z.string({ error: "Estado obrigatório" }),
  emergency_contact: z.string({ error: "Nome do Contato obrigatório" }),
  emergency_contact_phone: z.string({ error: "Telefone do Contato obrigatório" }).transform((v) => v.replace(/\D/g, "")),
  shirt_size: z.string({ error: "Tamanho obrigatório" }),
  terms_accepted: z.boolean({ error: "Aceite os termos obrigatório" }).refine(v => v === true, "Aceite os termos obrigatório"),
}).loose();

const medicalSchema = z.object({
  health_plan: z.boolean().nullish(),
  health_plan_name: z.string().nullish(),
  health_plan_number: z.string().nullish(),
  continuous_medication: z.boolean().nullish(),
  medication_details: z.array(z.string()).nullish(),
}).superRefine((data, ctx) => {
  if (data.health_plan === true) {
    if (!data.health_plan_name?.trim()) {
      ctx.addIssue({ code: 'custom', message: "Informe o nome do plano de saúde", path: ["health_plan_name"] });
    }
    if (!data.health_plan_number?.trim()) {
      ctx.addIssue({ code: 'custom', message: "Informe o número da carteira", path: ["health_plan_number"] });
    }
  }

  if (data.continuous_medication === true && !data.medication_details?.length) {
    ctx.addIssue({ code: 'custom', message: "Informe quais medicamentos você utiliza", path: ["medication_details"] });
  }
});

const resolver = zodResolver(
  staticSchema.and(medicalSchema).transform((data) => ({
    ...data,
    terms_accepted_at: data.terms_accepted ? new Date().toISOString() : null,
  }))
);

const handleUpdateProfile = async ({ valid, values }: any) => {
  if (!valid) return;

  try {
    loading.value = true;

    const operatorUpdated = await OperatorService.update(operator.value.$id, values);

    authStore.$patch((state) => {
      state.operator = { ...state.operator, ...operatorUpdated };
    });

    toast.add({
      severity: "success",
      summary: "Sucesso",
      detail: "Dados salvos com sucesso!",
      life: 3000,
    });

    router.push("/profile");
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);
  } finally {
    loading.value = false;
  }
};

const handleCep = async (event: any) => {
  const cep = event.target.value.replace(/\D/g, "");
  if (cep.length !== 8) return;

  try {
    const address = await addressByCep(cep);
    if (address && !address.erro) {
      form.value.setValues({
        address: address.logradouro,
        neighborhood: address.bairro,
        city: address.localidade,
        state: address.uf
      });
    }
  } catch (err) {
    console.error("Erro ao buscar CEP:", err);
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleUpdateAvatar = async (event: Event) => {
  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];

  if (!file) return;

  try {
    loading.value = true;

    const operatorUpdated = await OperatorService.changeAvatar(
      operator.value.$id,
      operator.value.avatar,
      file
    );

    if (operator) {
      authStore.$patch((state) => {
        state.operator = { ...state.operator, ...operatorUpdated };
      });
    }

    toast.add({
      severity: "success",
      summary: "Sucesso",
      detail: "Foto de perfil atualizada!",
      life: 3000,
    });
  } catch (error) {
    console.error("Erro no processo de avatar:", error);
    toast.add({
      severity: "error",
      summary: "Erro",
      detail: "Falha ao processar a imagem.",
      life: 3000,
    });
  } finally {
    loading.value = false;
    input.value = "";
  }
};
</script>

<style scoped>
.avatar-wrapper {
  position: relative;
  display: inline-block;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  aspect-ratio: 1;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
  border-radius: 50%;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 20;
  border-radius: 50%;
}
</style>