<template>
  <div class="flex align-items-center justify-content-center min-h-screen surface-ground px-2 py-2">
    <div class="surface-card p-4 shadow-2 border-round w-full lg:w-12">
      <div class="flex justify-content-between align-items-start">
        <div class="avatar-wrapper cursor-pointer" @click="triggerFileInput">
          <Avatar :image="authStore.operator.avatar" :icon="!authStore.operator.avatar ? 'pi pi-user' : undefined"
            class="text-xl" size="xlarge" shape="circle" :style="loading ? 'opacity: 0.5' : ''" />

          <div class="avatar-overlay">
            <i class="pi pi-camera text-white text-xl"></i>
          </div>

          <div v-if="loading" class="avatar-loading">
            <i class="pi pi-spin pi-spinner text-white text-2xl font-bold"></i>
          </div>
          <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleUpdateAvatar" />
        </div>
        <div class="flex flex-column ml-3">
          <div class="text-900 text-right font-bold">Grauação</div>
          <Rating v-model="authStore.operator.rating" />
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
            <div class="field col-6">
              <FloatLabel variant="in">
                <InputText name="codename" class="w-full" fluid />
                <label>Codinome / Nome de Guerra</label>
              </FloatLabel>
              <Message v-if="$form.codename?.invalid" severity="error" size="small" variant="simple">{{
                $form.codename.error.message }}</Message>
            </div>

            <div class="field col-12 md:col-3">
              <FloatLabel variant="in">
                <InputMask name="identity" mask="999.999.999-99" inputmode="numeric" class="w-full" fluid />
                <label>CPF</label>
              </FloatLabel>
              <Message v-if="$form.identity?.invalid" severity="error" size="small" variant="simple">{{
                $form.identity.error.message }}</Message>
            </div>

            <div class="field col-12 md:col-3">
              <FloatLabel variant="in">
                <InputText name="general_registration" class="w-full" inputmode="numeric" fluid />
                <label>RG</label>
              </FloatLabel>
              <Message v-if="$form.general_registration?.invalid" severity="error" size="small" variant="simple">{{
                $form.general_registration.error.message }}</Message>
            </div>
            <div class="field col-12 md:col-4">
              <FloatLabel variant="in">
                <DatePicker name="birth_date" class="w-full" dateFormat="dd/mm/yy" showIcon showButtonBar
                  iconDisplay="input" :showOnFocus="true" :manualInput="false" fluid />
                <label>Data de Nascimento</label>
              </FloatLabel>
              <Message v-if="$form.birth_date?.invalid" severity="error" size="small" variant="simple">{{
                $form.birth_date.error.message }}</Message>
            </div>

            <div class="field col-12 md:col-4">
              <FloatLabel variant="in">
                <Select :options="BLOOD_TYPES" name="blood_type" class="w-full" fluid />
                <label>Tipo Sanguíneo</label>
              </FloatLabel>
              <Message v-if="$form.blood_type?.invalid" severity="error" size="small" variant="simple">{{
                $form.blood_type.error.message }}</Message>
            </div>
            <div class="field col-12 md:col-4">
              <FloatLabel variant="in">
                <InputText name="number_fdba" class="w-full" fluid />
                <label>Nº de Registro FBDA</label>
              </FloatLabel>
            </div>

            <div class="field col-12 md:col-6">
              <FloatLabel variant="in">
                <InputText name="mother_name" class="w-full" fluid />
                <label>Nome da Mãe</label>
              </FloatLabel>
              <Message v-if="$form.mother_name?.invalid" severity="error" size="small" variant="simple">{{
                $form.mother_name.error.message }}</Message>
            </div>
            <div class="field col-12 md:col-6">
              <FloatLabel variant="in">
                <InputText name="father_name" class="w-full" fluid />
                <label>Nome do Pai</label>
              </FloatLabel>
            </div>
            <div class="field col-12 md:col-4">
              <FloatLabel variant="in">
                <InputMask name="phone" mask="(99) 99999-9999" class="w-full" inputmode="numeric" fluid />
                <label>Celular / WhatsApp</label>
              </FloatLabel>
              <Message v-if="$form.phone?.invalid" severity="error" size="small" variant="simple">{{
                $form.phone.error.message }}</Message>
            </div>
            <div class="field col-12 md:col-4">
              <FloatLabel variant="in">
                <Select :options="CATEGORIES_OPTIONS" name="category" optionLabel="name" optionValue="code"
                  class="w-full" fluid />
                <label>Categoria</label>
              </FloatLabel>
            </div>
            <div class="field col-12 md:col-4">
              <FloatLabel variant="in">
                <Select :options="EXPERIENCES" name="experience" optionLabel="name" optionValue="code" class="w-full"
                  fluid />
                <label>Nível de Conhecimento</label>
              </FloatLabel>
            </div>
            <div class="field col-12 md:col-4">
              <FloatLabel variant="in">
                <InputText name="instagram" class="w-full" fluid>
                  <i class="pi pi-instagram"></i>
                </InputText>
                <label>Instagram (Opcional)</label>
              </FloatLabel>
            </div>
            <div class="field col-12 md:col-4">
              <FloatLabel variant="in">
                <Select :options="SHIRT_SIZES" name="shirt_size" class="w-full" fluid />
                <label>Tamanho da Camisa</label>
              </FloatLabel>
              <Message v-if="$form.shirt_size?.invalid" severity="error" size="small" variant="simple">{{
                $form.shirt_size.error.message }}</Message>
            </div>
            <div class="field col-12 md:col-4">
              <FloatLabel variant="in">
                <Select :options="SOURCES" name="referral_source" optionLabel="name" optionValue="code" class="w-full"
                  fluid />
                <label>Como conheceu?</label>
              </FloatLabel>
            </div>
            <div class="field col-12">
              <FloatLabel variant="in">
                <InputText name="quote" class="w-full" fluid />
                <label>Citação</label>
              </FloatLabel>
            </div>
          </div>
        </Panel>
        <Panel header="Endereço" toggleable>
          <div class="grid formgrid">
            <div class="field col-12 md:col-3">
              <FloatLabel variant="in">
                <InputMask name="cep" v-model="initialValues.cep" mask="99999-999" class="w-full" @blur="handleCep"
                  fluid />
                <label>CEP</label>
              </FloatLabel>
              <Message v-if="$form.cep?.invalid" severity="error" size="small" variant="simple">{{
                $form.cep.error.message }}
              </Message>
            </div>

            <div class="field col-12 md:col-7">
              <FloatLabel variant="in">
                <InputText name="address" v-model="initialValues.address" class="w-full" fluid />
                <label>Logradouro (Rua/Av)</label>
              </FloatLabel>
              <Message v-if="$form.address?.invalid" severity="error" size="small" variant="simple">{{
                $form.address.error.message }}</Message>
            </div>

            <div class="field col-12 md:col-2">
              <FloatLabel variant="in">
                <InputText name="address_number" v-model="initialValues.address_number" class="w-full" fluid />
                <label>Nº</label>
              </FloatLabel>
              <Message v-if="$form.address_number?.invalid" severity="error" size="small" variant="simple">{{
                $form.address_number.error.message }}</Message>
            </div>

            <div class="field col-12 md:col-5">
              <FloatLabel variant="in">
                <InputText name="neighborhood" v-model="initialValues.neighborhood" class="w-full" fluid />
                <label>Bairro</label>
              </FloatLabel>
              <Message v-if="$form.neighborhood?.invalid" severity="error" size="small" variant="simple">{{
                $form.neighborhood.error.message }}</Message>
            </div>
            <div class="field col-12 md:col-5">
              <FloatLabel variant="in">
                <InputText name="city" v-model="initialValues.city" class="w-full" fluid /><label>Cidade</label>
              </FloatLabel>
              <Message v-if="$form.city?.invalid" severity="error" size="small" variant="simple">{{
                $form.city.error.message }}
              </Message>
            </div>
            <div class="field col-12 md:col-2">
              <FloatLabel variant="in">
                <InputText name="state" v-model="initialValues.state" class="w-full" fluid /><label>UF</label>
              </FloatLabel>
              <Message v-if="$form.state?.invalid" severity="error" size="small" variant="simple">{{
                $form.state.error.message
              }}</Message>
            </div>
          </div>
        </Panel>
        <Panel header="Ficha Médica" toggleable>
          <div class="grid formgrid">
            <div class="field col-12 md:col-3 flex align-items-center">
              <div class="flex align-items-center">
                <Checkbox binary name="health_plan" inputId="health_plan" />
                <label for="health_plan" class="ml-2 cursor-pointer">Possui Plano de Saúde?</label>
              </div>
            </div>
            <div class="field col-12 md:col-6">
              <FloatLabel variant="in">
                <InputText name="health_plan_name" class="w-full" :disabled="!$form.health_plan?.value" fluid />
                <label>Nome do plano</label>
              </FloatLabel>
              <Message v-if="$form.health_plan_name?.invalid" severity="error" size="small" variant="simple">{{
                $form.health_plan_name.error.message }}</Message>
            </div>
            <div class="field col-12 md:col-3">
              <FloatLabel variant="in">
                <InputText name="health_plan_number" class="w-full" :disabled="!$form.health_plan?.value" fluid />
                <label>Nº da Carteira</label>
              </FloatLabel>
              <Message v-if="$form.health_plan_number?.invalid" severity="error" size="small" variant="simple">{{
                $form.health_plan_number.error.message }}</Message>
            </div>

            <div class="field col-12 md:col-3 flex align-items-center">
              <div class="flex align-items-center">
                <Checkbox binary name="continuous_medication" inputId="continuous_medication" />
                <label for="continuous_medication" class="ml-2 cursor-pointer">Usa medicação contínua?</label>
              </div>
            </div>
            <div class="field col-12 md:col-9">
              <FloatLabel variant="in">
                <AutoComplete name="medication_details" class="w-full" multiple
                  :disabled="!$form.continuous_medication?.value" :typeahead="false" fluid />
                <label>Quais medicamentos? (Digite e tecle Enter)</label>
              </FloatLabel>
              <Message v-if="$form.medication_details?.invalid" severity="error" size="small" variant="simple">{{
                $form.medication_details.error.message }}</Message>
            </div>

            <div class="field col-12">
              <FloatLabel variant="in">
                <AutoComplete name="allergies" class="w-full" multiple :typeahead="false" fluid />
                <label>Alergias (Digite e tecle Enter)</label>
              </FloatLabel>
            </div>
          </div>
        </Panel>
        <Panel header="Contato de Emergência" toggleable>
          <div class="grid formgrid">
            <div class="field col-12 md:col-6">
              <FloatLabel variant="in">
                <InputText name="emergency_contact" class="w-full" fluid />
                <label>Nome do Contato</label>
              </FloatLabel>
              <Message v-if="$form.emergency_contact?.invalid" severity="error" size="small" variant="simple">{{
                $form.emergency_contact.error.message }}</Message>
            </div>
            <div class="field col-12 md:col-6">
              <FloatLabel variant="in">
                <InputMask name="emergency_contact_phone" mask="(99) 99999-9999" class="w-full" fluid />
                <label>Telefone do Contato</label>
              </FloatLabel>
              <Message v-if="$form.emergency_contact_phone?.invalid" severity="error" size="small" variant="simple">{{
                $form.emergency_contact_phone.error.message }}</Message>
            </div>
          </div>
        </Panel>
        <div class="grid formgrid">
          <div class="col-12 mt-4">
            <div class="flex align-items-center mb-3">
              <Checkbox binary name="media_consent" inputId="media_consent" />
              <label for="media_consent" class="ml-2">Aceito o uso da minha imagem para fins de divulgação.</label>
            </div>

            <div class="flex align-items-center">
              <Checkbox binary name="terms_accepted" inputId="terms_accepted" />
              <label for="terms_accepted" class="ml-2">Li e aceito os termos de serviço e regulamento interno.</label>
            </div>
          </div>
        </div>
        <div class="mt-4">
          <Button type="submit" label="Finalizar Cadastro" icon="pi pi-check" class="w-full md:w-auto"
            :loading="loading" />
        </div>
      </Form>
    </div>
  </div>
</template>

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

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { z } from "zod";
import {
  isValidIdentity,
  addressByCep,
  formatDateToLocal,
} from "@/functions/utils";
import { OperatorService } from "@/services/operator";

import { Form } from "@primevue/forms";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Message from "primevue/message";
import FloatLabel from "primevue/FloatLabel";
import InputMask from "primevue/inputmask";
import Checkbox from "primevue/checkbox";
import DatePicker from "primevue/datepicker";
import AutoComplete from "primevue/autocomplete";
import Select from "primevue/select";
import Panel from "primevue/panel";

import { CATEGORIES_OPTIONS, SOURCES, SHIRT_SIZES, BLOOD_TYPES, EXPERIENCES } from "@/constants/airsoft";
const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const form = ref();

const fileInput = ref<HTMLInputElement | null>(null);

const initialValues = ref({
  codename: "",
  identity: "",
  general_registration: "",
  blood_type: "",
  birth_date: null,
  mother_name: "",
  father_name: "",
  phone: "",
  cep: "",
  address: "",
  address_number: "",
  neighborhood: "",
  city: "",
  state: "",
  health_plan: false,
  health_plan_name: null,
  health_plan_number: null,
  emergency_contact: "",
  emergency_contact_phone: "",
  allergies: [],
  continuous_medication: false,
  medication_details: [],
  shirt_size: "",
  instagram: "",
  referral_source: null,
  category: null,
  experience: null,
  number_fdba: "",
  media_consent: false,
  terms_accepted: false,
  quote: "",
});

const resolver = zodResolver(
  z
    .object({
      codename: z.string().min(1, { error: "Codinome obrigatório" }),
      identity: z
        .string()
        .refine(isValidIdentity, "CPF inválido")
        .transform((v) => v.replace(/\D/g, "")),
      general_registration: z
        .string()
        .min(1, { error: "RG obrigatório" })
        .transform((v) => v.replace(/\D/g, "")),

      birth_date: z.coerce
        .date({ error: "Data de nascimento obrigatória" })
        .transform((date) => formatDateToLocal(date)),

      blood_type: z.string().min(1, { error: "Tipo sanguíneo obrigatório" }),
      mother_name: z.string().min(1, { error: "Nome da mãe obrigatório" }),
      father_name: z.string().optional(),
      phone: z
        .string()
        .min(1, { error: "Telefone obrigatório" })
        .transform((v) => v.replace(/\D/g, "")),

      cep: z
        .string()
        .min(1, { error: "CEP obrigatório" })
        .transform((v) => v.replace(/\D/g, "")),
      address: z.string().min(1, { error: "Endereço obrigatório" }),
      address_number: z.string().min(1, { error: "Número obrigatório" }),
      neighborhood: z.string().min(1, { error: "Bairro obrigatório" }),
      city: z.string().min(1, { error: "Cidade obrigatória" }),
      state: z.string().min(1, { error: "Estado obrigatório" }),

      health_plan: z.boolean(),
      health_plan_name: z.string().optional(),
      health_plan_number: z.string().nullable(),

      allergies: z.array(z.string()).optional(),
      continuous_medication: z.boolean(),
      medication_details: z.array(z.string()).optional(),

      emergency_contact: z.string().min(1, { error: "Contato obrigatório" }),
      emergency_contact_phone: z
        .string()
        .min(1, { error: "Telefone obrigatório" })
        .transform((v) => v.replace(/\D/g, "")),

      shirt_size: z.string().min(1, { error: "Tamanho obrigatório" }),
      instagram: z.string().optional(),
      media_consent: z.boolean(),
      terms_accepted: z.boolean().refine((v) => v === true, "Aceite os termos"),

      referral_source: z.coerce.number().nullable(),
      category: z.coerce.number().nullable(),
      experience: z.coerce.number().nullable(),
      number_fdba: z.string().optional(),
      quote: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.health_plan) {
        if (!data.health_plan_name) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Informe o plano de saúde",
            path: ["health_plan_name"],
          });
        }
        if (!data.health_plan_number) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Informe o número da carteira do plano de saúde",
            path: ["health_plan_number"],
          });
        }
      }

      if (data.continuous_medication && !data.medication_details?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe os medicamentos",
          path: ["medication_details"],
        });
      }
    })
    .transform((data) => {
      if (data.terms_accepted) {
        return {
          ...data,
          terms_accepted_at: new Date().toISOString(),
        };
      }

      return {
        ...data,
        terms_accepted_at: null,
      };
    })
);

onMounted(() => {
  if (!authStore.operator) return;

  Object.keys(initialValues.value).forEach((key) => {
    const value = (authStore.operator as any)[key];

    if (value) {
      form.value.setFieldValue(
        key,
        key === "birth_date"
          ? new Date(value).toLocaleDateString("pt-BR")
          : value
      );
    }
  });
});

const handleUpdateProfile = async ({ valid, values }: any) => {
  if (valid) {
    try {
      loading.value = true;

      const payload = { ...values };

      await OperatorService.update(authStore.operator.$id, payload);

      toast.add({
        severity: "success",
        summary: "Sucesso",
        detail: "Dados salvos com sucesso!",
        life: 3000,
      });

      router.push("/profile");
    } catch (error: any) {
      console.error("Erro ao enviar formulário:", error);

      toast.add({
        severity: "error",
        summary: "Erro",
        detail: error.message || "Falha ao salvar os dados. Tente novamente.",
        life: 4000,
      });
    } finally {
      loading.value = false;
    }
  }
};

const handleCep = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const cep = target.value.replace(/\D/g, "");

  if (cep.length !== 8) return;

  try {
    const address = await addressByCep(cep);

    if (address && !address.erro) {
      form.value.setFieldValue("address", address.logradouro);
      form.value.setFieldValue("neighborhood", address.bairro);
      form.value.setFieldValue("city", address.localidade);
      form.value.setFieldValue("state", address.uf);
    }
  } catch (err) {
    console.error(err);
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
      authStore.operator.$id,
      file
    ) as unknown as typeof authStore.operator;

    authStore.operator = operatorUpdated;

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
