<template>
  <Form ref="formRef" :resolver="resolver" :initialValues="initialValues" @submit="handleSubmit"
    class="flex flex-column gap-3" v-asterisk="visitorSchema">

    <Panel header="Identificação" toggleable>
      <div class="grid formgrid">
        <FormField name="name" v-slot="$field" class="field col-12 md:col-6 flex flex-column gap-1">
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

        <div class="field col-12 md:col-4 flex flex-column gap-1">
          <FloatLabel variant="in">
            <InputText :modelValue="authStore.user?.email" class="w-full" disabled fluid />
            <label>E-mail</label>
          </FloatLabel>
        </div>

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

        <FormField name="team" v-slot="$field" class="field col-12 md:col-4 flex flex-column gap-1">
          <FloatLabel variant="in">
            <Select v-model="$field.value" :options="TEAMS" class="w-full" fluid filter />
            <label :for="$field.props.name">Equipe</label>
          </FloatLabel>
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
          <Checkbox v-model="$field.value" binary inputId="visitor_media_consent" />
          <label :for="$field.props.name" class="ml-2">Aceito o uso da minha imagem para fins de divulgação.</label>
        </FormField>

        <FormField name="terms_accepted" v-slot="$field" class="flex flex-column gap-1">
          <div class="flex align-items-center">
            <Checkbox v-model="$field.value" binary inputId="visitor_terms_accepted" @click.prevent="openTermsDialog" />
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
import Select from "primevue/select";
import Panel from "primevue/panel";

import { useOperator } from "@/composables/useOperator";
import { visitorSchema, type IOperator } from "@/services/operator";
import { CATEGORIES_OPTIONS, BLOOD_TYPES, TEAMS } from "@/constants/airsoft";
import TermsDialog from "./TermsDialog.vue";

const props = withDefaults(defineProps<{
  loading?: boolean;
}>(), {
  loading: false
});

const emit = defineEmits<{
  (e: "submit", payload: { valid: boolean; values: Partial<IOperator> }): void;
}>();

const { operator, authStore } = useOperator();

const formRef = ref();
const dialogTerms = ref(false);

type VisitorSchemaType = z.infer<typeof visitorSchema>;

const initialValues = computed(() => {
  const op = operator.value as IOperator;
  if (!op) return {} as IOperator;

  return {
    ...op,
    birth_date: op.birth_date ? dayjs(op.birth_date).format("DD/MM/YYYY") : null,
  };
});

const visitorFullSchema = visitorSchema.transform((data: VisitorSchemaType) => ({
  ...data,
  terms_accepted_at: data.terms_accepted ? new Date().toISOString() : null,
}));

const resolver = zodResolver(visitorFullSchema);

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

const handleSubmit = (event: { valid: boolean; values: Partial<IOperator> }) => {
  emit("submit", event);
};
</script>
