<template>
  <div class="flex align-items-center justify-content-center min-h-screen surface-ground px-2 py-2">
    <div class="surface-card p-4 shadow-2 border-round w-full lg:w-12">
      <div class="flex justify-content-between align-items-start mb-3">
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

      <Message v-if="!authStore.isProfileComplete" severity="error" class="mb-3" closable>
        <strong>Complete seu perfil para acessar todas as funcionalidades do sistema.</strong>
      </Message>

      <Form ref="form" v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="handleUpdateProfile"
        class="flex flex-column gap-3" v-asterisk="operatorSchema">

        <Panel header="Identificação" toggleable>
          <div class="grid formgrid">
            <FormField name="name" v-slot="$field" class="field col-12 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label :for="$field.props.name">Nome Completo</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="codename" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label :for="$field.props.name">Codinome / Nome de Guerra</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="identity" v-slot="$field" class="field col-12 md:col-3 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputMask v-model="$field.value" mask="999.999.999-99" inputmode="numeric" class="w-full" fluid />
                <label :for="$field.props.name">CPF</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="general_registration" v-slot="$field" class="field col-12 md:col-3 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" inputmode="numeric" class="w-full" fluid />
                <label :for="$field.props.name">RG</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="birth_date" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <DatePicker v-model="$field.value" class="w-full" showIcon showButtonBar iconDisplay="input"
                  :showOnFocus="true" :manualInput="false" fluid />
                <label :for="$field.props.name">Data de Nascimento</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="blood_type" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <Select v-model="$field.value" :options="BLOOD_TYPES" class="w-full" fluid />
                <label :for="$field.props.name">Tipo Sanguíneo</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="number_fdba" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label :for="$field.props.name">Nº de Registro FBDA</label>
              </FloatLabel>
            </FormField>

            <FormField name="mother_name" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label :for="$field.props.name">Nome da Mãe</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="father_name" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label :for="$field.props.name">Nome do Pai</label>
              </FloatLabel>
            </FormField>

            <FormField name="phone" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputMask v-model="$field.value" mask="(99) 99999-9999" class="w-full" inputmode="numeric" fluid />
                <label :for="$field.props.name">Celular / WhatsApp</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="category" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <Select v-model="$field.value" :options="CATEGORIES_OPTIONS" optionLabel="label" optionValue="value"
                  class="w-full" fluid />
                <label :for="$field.props.name">Categoria</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="experience" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <Select v-model="$field.value" :options="EXPERIENCES" optionLabel="label" optionValue="value"
                  class="w-full" fluid />
                <label :for="$field.props.name">Nível de Conhecimento</label>
              </FloatLabel>
            </FormField>

            <FormField name="instagram" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <InputGroup>
                <InputGroupAddon>
                  <span><i class="pi pi-instagram"></i></span>
                </InputGroupAddon>
                <FloatLabel variant="in">
                  <InputText v-model="$field.value" class="w-full" fluid />
                  <label :for="$field.props.name">Instagram</label>
                </FloatLabel>
              </InputGroup>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="shirt_size" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <Select v-model="$field.value" :options="SHIRT_SIZES" class="w-full" fluid />
                <label :for="$field.props.name">Tamanho da Camisa</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="referral_source" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <Select v-model="$field.value" :options="SOURCES" optionLabel="label" optionValue="value" class="w-full"
                  fluid />
                <label :for="$field.props.name">Como conheceu?</label>
              </FloatLabel>
            </FormField>

            <FormField name="quote" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label :for="$field.props.name">Citação</label>
              </FloatLabel>
            </FormField>

            <FormField name="profession" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <AutoComplete v-model="$field.value" fluid :suggestions="filteredProfessions" @keydown.enter.prevent
                  @complete="(e) => filteredProfessions = search(e.query, PROFESSION_TYPES)" />
                <label :for="$field.props.name">Profissão</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="availability" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
              <FloatLabel variant="in">
                <Select v-model="$field.value" :options="AVAILABILITY_TYPES" optionLabel="label" optionValue="value"
                  class="w-full" fluid />
                <label :for="$field.props.name">Disponibilidade</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>
          </div>
        </Panel>

        <Panel header="Endereço" toggleable>
          <div class="grid formgrid">
            <FormField name="cep" v-slot="$field" class="field col-12 md:col-3 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputMask v-model="$field.value" mask="99999-999" class="w-full" @blur="handleCep" fluid />
                <label :for="$field.props.name">CEP</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="address" v-slot="$field" class="field col-12 md:col-7 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label :for="$field.props.name">Logradouro (Rua/Av)</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="address_number" v-slot="$field" class="field col-12 md:col-2 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label :for="$field.props.name">Nº</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="neighborhood" v-slot="$field" class="field col-12 md:col-5 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label :for="$field.props.name">Bairro</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="city" v-slot="$field" class="field col-12 md:col-5 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label :for="$field.props.name">Cidade</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="state" v-slot="$field" class="field col-12 md:col-2 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label :for="$field.props.name">UF</label>
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
                <label :for="$field.props.name" class="ml-2 cursor-pointer">Possui Plano de Saúde?</label>
              </div>
            </FormField>

            <FormField name="health_plan_name" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" :disabled="!$form.health_plan?.value" fluid />
                <label :for="$field.props.name">Nome do plano</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="health_plan_number" v-slot="$field" class="field col-12 md:col-3 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" :disabled="!$form.health_plan?.value" fluid />
                <label :for="$field.props.name">Nº da Carteira</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="continuous_medication" v-slot="$field"
              class="field col-12 md:col-3 flex align-items-center">
              <div class="flex align-items-center">
                <Checkbox v-model="$field.value" binary inputId="continuous_medication" />
                <label :for="$field.props.name" class="ml-2 cursor-pointer">Usa medicação contínua?</label>
              </div>
            </FormField>

            <FormField name="medication_details" v-slot="$field" class="field col-12 md:col-9 flex flex-column gap-1">
              <FloatLabel variant="in">
                <AutoComplete inputId="medication_details" v-model="$field.value" multiple fluid
                  :suggestions="filteredMedications" @keydown.enter.prevent
                  @complete="(e) => filteredMedications = search(e.query, MEDICATIONS)"
                  :disabled="!$form.continuous_medication?.value" />
                <label :for="$field.props.name">Medicamentos de Uso Contínuo</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                {{ $field.error.message }}
              </Message>
            </FormField>

            <FormField name="allergies" v-slot="$field" class="field col-12 flex flex-column gap-1">
              <FloatLabel variant="in">
                <AutoComplete inputId="allergies" v-model="$field.value" multiple fluid :suggestions="filteredAllergies"
                  @keydown.enter.prevent @complete="(e) => filteredAllergies = search(e.query, ALLERGIES)" />
                <label :for="$field.props.name">Alergias</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{
                $field.error.message }}
              </Message>
            </FormField>

            <FormField name="is_donor" v-slot="$field" class="field col-12 md:col-9 flex flex-column gap-1">
              <label :for="$field.props.name">Doador de sangue?</label>
              <ToggleSwitch inputId="is_donor" v-model="$field.value" />
            </FormField>
          </div>
        </Panel>

        <Panel header=" Contato de Emergência" toggleable>
          <div class="grid formgrid">
            <FormField name="emergency_contact" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputText v-model="$field.value" class="w-full" fluid />
                <label :for="$field.props.name">Nome do Contato</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{
                $field.error.message }}
              </Message>
            </FormField>

            <FormField name="emergency_contact_phone" v-slot="$field"
              class="field col-12 md:col-6 flex flex-column gap-1">
              <FloatLabel variant="in">
                <InputMask v-model="$field.value" mask="(99) 99999-9999" class="w-full" fluid />
                <label :for="$field.props.name">Telefone do Contato</label>
              </FloatLabel>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{
                $field.error.message }}
              </Message>
            </FormField>
          </div>
        </Panel>

        <div class="grid formgrid">
          <span>Estatuto e Conduta da equipe <strong>{{ TEAM_NAME }}</strong></span>
          <ScrollPanel @scroll.capture="handleScroll" class="col-12 border-1 border-gray-400 border-round mt-3 p-3"
            style="height: 15rem;">
            <p class="m-0 line-height-2 font-bold">
              TERMO DE CIÊNCIA E ACEITE – ESTATUTO INTEGRAL E CÓDIGO DE CONDUTA
            </p>
            <p class="line-height-2">
              Ao prosseguir, declaro que li, compreendo e aceito integralmente os termos estabelecidos no Estatuto
              Integral e Código de Conduta do Êxodo Airsoft, comprometendo-me a seguir as diretrizes abaixo descritas:
            </p>
            <p class="line-height-2">
              <strong>IDENTIDADE E COMPROMISSO:</strong> Compreendo que o uso do Patch da unidade é um privilégio que
              implica na
              aceitação total deste estatuto. Comprometo-me a zelar pela imagem da equipe, agindo com honra e respeito
              em qualquer evento, treino ou operação.

            </p>
            <p class="line-height-2"> <strong>SEGURANÇA E PROTEÇÃO:</strong> Declaro ciência de que a segurança é o
              pilar inegociável. É
              terminantemente proibida
              a retirada da proteção ocular em "Zona Quente". Reconheço que o descumprimento de normas de segurança
              básica ou conduta de risco facultará à liderança a minha expulsão imediata da atividade ou da unidade.
            </p>
            <p class="line-height-2">
              <strong>LEGALIDADE DO EQUIPAMENTO:</strong> Certifico que meu equipamento de airsoft (AEG/GBB) está em
              conformidade com a
              legislação vigente, possuindo obrigatoriamente a ponta laranja ou vermelha e a devida nota fiscal de
              compra. Assumo total responsabilidade pelo transporte e porte do equipamento conforme as normas do
              Exército Brasileiro.
            </p>
            <p class="line-height-2">
              <strong>DOUTRINA E FAIR PLAY:</strong> Aceito os pilares de União, Lealdade e Respeito. Comprometo-me com
              a honestidade nas
              eliminações, combatendo o "Highlanderismo" (não marcar o acerto). Entendo que o Airsoft é um jogo de honra
              e que minha conduta reflete em todo o grupo.
            </p>
            <p class="line-height-2">
              <strong>REGIME DISCIPLINAR:</strong> Estou ciente de que qualquer desvio de conduta, ato de insubordinação
              ou comportamento
              antidesportivo me sujeitará ao conselho disciplinar da unidade, podendo resultar em advertência, suspensão
              ou exclusão definitiva, sem prejuízo de responsabilidades civis.
            </p>
            <p class="line-height-2">
              <strong>CONFIDENCIALIDADE:</strong> Comprometo-me a manter sigilo sobre táticas, comunicações internas e
              estratégias da
              Unidade Êxodo, respeitando a hierarquia e a organização estabelecida pela liderança.
            </p>
            <p class="line-height-2">
              Declaro ser maior de idade (ou possuir autorização legal) e estar em pleno gozo de minhas capacidades
              físicas e mentais para a prática do esporte, isentando a Unidade Êxodo de responsabilidade por incidentes
              decorrentes do descumprimento destas normas.
            </p>
          </ScrollPanel>
          <div class="col-12 mt-4">
            <FormField name="media_consent" v-slot="$field" class="flex align-items-center mb-3">
              <Checkbox v-model="$field.value" binary inputId="media_consent" />
              <label :for="$field.props.name" class="ml-2">Aceito o uso da minha imagem para fins de divulgação.</label>
            </FormField>

            <FormField name="terms_accepted" v-slot="$field" class="flex flex-column gap-1">
              <div class="flex align-items-center">
                <Checkbox v-model="$field.value" binary inputId="terms_accepted" />
                <label :for="$field.props.name" class="ml-2">Li e aceito os termos de serviço e regulamento
                  interno.</label>
              </div>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}
              </Message>
            </FormField>
          </div>
        </div>

        <div class="col-12">
          <Button type="submit" label="Salvar" :loading="loading" :disabled="!canAccept" />
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

import {
  addressByCep,
  search
} from "@/functions/utils";
import { useOperator } from "@/composables/useOperator";
import { operatorSchema, OperatorService, type IOperator } from "@/services/operator";

import { CATEGORIES_OPTIONS, SOURCES, SHIRT_SIZES, BLOOD_TYPES, EXPERIENCES, ALLERGIES, MEDICATIONS, AVAILABILITY_TYPES, PROFESSION_TYPES, TEAM_NAME } from "@/constants/airsoft";
import { BadgeService } from "@/services/badge";

const { updateState, operator, authStore } = useOperator();

const router = useRouter();
const toast = useToast();

const loading = ref(false);
const loadingAvatar = ref(false);
const canAccept = ref(false);

const form = ref();

const filteredAllergies = ref<string[]>([]);
const filteredMedications = ref<string[]>([]);
const filteredProfessions = ref<string[]>([]);

const fileInput = ref<HTMLInputElement | null>(null);

const initialValues = computed(() => {
  const op = operator.value as IOperator;
  if (!op) return {} as IOperator;

  return {
    ...op,
    birth_date: op.birth_date ? new Date(op.birth_date).toLocaleDateString("pt-BR") : null,
  };
});

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

const resolver = zodResolver(operatorSchema.and(medicalSchema).transform((data) => ({
  ...data,
  terms_accepted_at: data.terms_accepted ? new Date().toISOString() : null,
})));

const handleUpdateProfile = async ({ valid, values }: any) => {
  if (!valid) return;

  try {
    loading.value = true;

    const operatorUpdated = await OperatorService.update(operator.value.$id, values);
    const opWithBadges = await BadgeService.syncOperatorBadges(operatorUpdated);

    await updateState(opWithBadges);

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
    loadingAvatar.value = true;

    const operatorUpdated = await OperatorService.changeAvatar(
      operator.value.$id,
      operator.value.avatar,
      file
    );

    if (operator) {
      await updateState(operatorUpdated);
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
    loadingAvatar.value = false;
  }
};

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  const bottomReached = target.scrollTop + target.clientHeight >= target.scrollHeight - 5;

  canAccept.value = bottomReached;
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
  /* z-index: 10; */
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

.required-field label::after {
  content: " *";
  color: var(--p-red-500);
  /* Usa a cor do PrimeVue */
  font-weight: bold;
}
</style>