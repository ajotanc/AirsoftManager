<template>
  <Form ref="formRef" v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="handleSubmit"
    class="flex flex-column gap-3" v-asterisk="operatorSchema">

    <Panel header="Identificação" toggleable>
      <div class="grid formgrid">
        <FormField name="name" v-slot="$field" class="field col-12 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputText v-model="$field.value" class="w-full" fluid />
            <label :for="$field.props.name">Nome Completo</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="codename" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputText v-model="$field.value" class="w-full" fluid />
            <label :for="$field.props.name">Codinome / Nome de Guerra</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="identity" v-slot="$field" class="field col-12 md:col-3 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputMask v-model="$field.value" mask="999.999.999-99" inputmode="numeric" class="w-full" fluid />
            <label :for="$field.props.name">CPF</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="general_registration" v-slot="$field" class="field col-12 md:col-3 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputText v-model="$field.value" inputmode="numeric" class="w-full" fluid />
            <label :for="$field.props.name">RG</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="birth_date" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
          <FloatLabel variant="in">
            <DatePicker v-model="$field.value" class="w-full" showIcon showButtonBar iconDisplay="input"
              :showOnFocus="true" :manualInput="false" fluid />
            <label :for="$field.props.name">Data de Nascimento</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="blood_type" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
          <FloatLabel variant="in">
            <Select v-model="$field.value" :options="BLOOD_TYPES" class="w-full" fluid />
            <label :for="$field.props.name">Tipo Sanguíneo</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
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
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
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
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="category" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
          <FloatLabel variant="in">
            <Select v-model="$field.value" :options="CATEGORIES_OPTIONS" optionLabel="label" optionValue="value"
              class="w-full" fluid />
            <label :for="$field.props.name">Categoria</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
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
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="shirt_size" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
          <FloatLabel variant="in">
            <Select v-model="$field.value" :options="SHIRT_SIZES" class="w-full" fluid />
            <label :for="$field.props.name">Tamanho da Camisa</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
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
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="availability" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
          <FloatLabel variant="in">
            <Select v-model="$field.value" :options="AVAILABILITY_TYPES" optionLabel="label" optionValue="value"
              class="w-full" fluid />
            <label :for="$field.props.name">Disponibilidade</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
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
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="address" v-slot="$field" class="field col-12 md:col-7 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputText v-model="$field.value" class="w-full" fluid />
            <label :for="$field.props.name">Logradouro (Rua/Av)</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="address_number" v-slot="$field" class="field col-12 md:col-2 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputText v-model="$field.value" class="w-full" fluid />
            <label :for="$field.props.name">Nº</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="neighborhood" v-slot="$field" class="field col-12 md:col-5 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputText v-model="$field.value" class="w-full" fluid />
            <label :for="$field.props.name">Bairro</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="city" v-slot="$field" class="field col-12 md:col-5 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputText v-model="$field.value" class="w-full" fluid />
            <label :for="$field.props.name">Cidade</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="state" v-slot="$field" class="field col-12 md:col-2 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputText v-model="$field.value" class="w-full" fluid />
            <label :for="$field.props.name">UF</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>
      </div>
    </Panel>

    <Panel header="Ficha Médica" toggleable>
      <div class="grid formgrid">
        <FormField name="health_plan" v-slot="$field" class="field col-12 md:col-3 flex align-items-center">
          <div class="flex align-items-center">
            <Checkbox v-model="$field.value" binary inputId="op_health_plan" />
            <label :for="$field.props.name" class="ml-2 cursor-pointer">Possui Plano de Saúde?</label>
          </div>
        </FormField>

        <FormField name="health_plan_name" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputText v-model="$field.value" class="w-full" :disabled="!$form.health_plan?.value" fluid />
            <label :for="$field.props.name">Nome do plano</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="health_plan_number" v-slot="$field" class="field col-12 md:col-3 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputText v-model="$field.value" class="w-full" :disabled="!$form.health_plan?.value" fluid />
            <label :for="$field.props.name">Nº da Carteira</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="continuous_medication" v-slot="$field" class="field col-12 md:col-3 flex align-items-center">
          <div class="flex align-items-center">
            <Checkbox v-model="$field.value" binary inputId="op_continuous_medication" />
            <label :for="$field.props.name" class="ml-2 cursor-pointer">Usa medicação contínua?</label>
          </div>
        </FormField>

        <FormField name="medication_details" v-slot="$field" class="field col-12 md:col-9 flex flex-column gap-1">
          <FloatLabel variant="in">
            <AutoComplete inputId="op_medication_details" v-model="$field.value" multiple fluid
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
            <AutoComplete inputId="op_allergies" v-model="$field.value" multiple fluid :suggestions="filteredAllergies"
              @keydown.enter.prevent @complete="(e) => filteredAllergies = search(e.query, ALLERGIES)" />
            <label :for="$field.props.name">Alergias</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="is_donor" v-slot="$field" class="field col-12 md:col-9 flex flex-column gap-1">
          <label :for="$field.props.name">Doador de sangue?</label>
          <ToggleSwitch inputId="op_is_donor" v-model="$field.value" />
        </FormField>
      </div>
    </Panel>

    <Panel header="Contato de Emergência" toggleable>
      <div class="grid formgrid">
        <FormField name="emergency_contact" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputText v-model="$field.value" class="w-full" fluid />
            <label :for="$field.props.name">Nome do Contato</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>

        <FormField name="emergency_contact_phone" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputMask v-model="$field.value" mask="(99) 99999-9999" class="w-full" fluid />
            <label :for="$field.props.name">Telefone do Contato</label>
          </FloatLabel>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>
      </div>
    </Panel>

    <div class="grid formgrid">
      <div class="col-12 mt-4">
        <FormField name="media_consent" v-slot="$field" class="flex align-items-center mb-3">
          <Checkbox v-model="$field.value" binary inputId="op_media_consent" />
          <label :for="$field.props.name" class="ml-2">Aceito o uso da minha imagem para fins de divulgação.</label>
        </FormField>

        <FormField name="terms_accepted" v-slot="$field" class="flex flex-column gap-1">
          <div class="flex align-items-center">
            <Checkbox v-model="$field.value" binary inputId="op_terms_accepted" @click.prevent="openTermsDialog" />
            <label :for="$field.props.name" class="ml-2" @click.prevent="openTermsDialog">
              Li e aceito os termos de serviço e regulamento interno.
            </label>
          </div>
          <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </FormField>
      </div>
    </div>

    <div class="col-12">
      <Button type="submit" label="Salvar" :loading="loading" />
    </div>

    <TermsDialog v-model:visible="dialogTerms" @accept="handleAcceptTerms" @refuse="handleRefuseTerms" />
  </Form>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import dayjs from "dayjs";
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
import ToggleSwitch from "primevue/toggleswitch";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";

import { addressByCep, search } from "@/functions/utils";
import { useOperator } from "@/composables/useOperator";
import { operatorSchema, type IOperator } from "@/services/operator";
import {
  CATEGORIES_OPTIONS,
  SOURCES,
  SHIRT_SIZES,
  BLOOD_TYPES,
  EXPERIENCES,
  ALLERGIES,
  MEDICATIONS,
  AVAILABILITY_TYPES,
  PROFESSION_TYPES,
} from "@/constants/airsoft";
import TermsDialog from "./TermsDialog.vue";

const props = withDefaults(defineProps<{
  loading?: boolean;
}>(), {
  loading: false
});

const emit = defineEmits<{
  (e: "submit", payload: { valid: boolean; values: Partial<IOperator> }): void;
}>();

const { operator } = useOperator();

const formRef = ref();
const dialogTerms = ref(false);

const filteredAllergies = ref<string[]>([]);
const filteredMedications = ref<string[]>([]);
const filteredProfessions = ref<string[]>([]);

type FullSchema = z.infer<typeof operatorSchema> & z.infer<typeof medicalSchema>;

const initialValues = computed(() => {
  const op = operator.value as IOperator;
  if (!op) return {} as IOperator;

  return {
    ...op,
    birth_date: op.birth_date ? dayjs(op.birth_date).format("DD/MM/YYYY") : null,
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
      ctx.addIssue({ code: "custom", message: "Informe o nome do plano de saúde", path: ["health_plan_name"] });
    }
    if (!data.health_plan_number?.trim()) {
      ctx.addIssue({ code: "custom", message: "Informe o número da carteira", path: ["health_plan_number"] });
    }
  }

  if (data.continuous_medication === true && !data.medication_details?.length) {
    ctx.addIssue({ code: "custom", message: "Informe quais medicamentos você utiliza", path: ["medication_details"] });
  }
});

const fullSchema = operatorSchema
  .and(medicalSchema)
  .transform((data: FullSchema) => ({
    ...data,
    terms_accepted_at: data.terms_accepted ? new Date().toISOString() : null,
  }));

const resolver = zodResolver(fullSchema);

const openTermsDialog = () => {
  const isChecked = formRef.value?.states?.terms_accepted?.value;
  if (isChecked) {
    formRef.value.setValues({ terms_accepted: false });
    return;
  }
  dialogTerms.value = true;
};

const handleAcceptTerms = () => {
  formRef.value.setValues({ terms_accepted: true });
};

const handleRefuseTerms = () => {
  formRef.value.setValues({ terms_accepted: false });
};

const handleCep = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const cep = input.value.replace(/\D/g, "");
  if (cep.length !== 8) return;

  try {
    const address = await addressByCep(cep);
    if (address && !address.erro) {
      formRef.value.setValues({
        address: address.logradouro,
        neighborhood: address.bairro,
        city: address.localidade,
        state: address.uf,
      });
    }
  } catch (err) {
    console.error("Erro ao buscar CEP:", err);
  }
};

const handleSubmit = (event: { valid: boolean; values: Partial<IOperator> }) => {
  emit("submit", event);
};
</script>
