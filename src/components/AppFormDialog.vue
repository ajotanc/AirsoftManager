<template>
  <Dialog v-model:visible="visible" :header="header" modal :style="{ width: '90vw', maxWidth: '667px' }"
    @hide="$emit('close')">
    <Form ref="formRef" :resolver="resolver" :initialValues="initialValues" @submit="onHandleSubmit" class="grid"
      :key="initialValues.$id || 'new'">
      <template v-for="field in fields" :key="field.name">
        <div :class="`col-12 md:col-${field.col || 12}`" v-if="!field.hidden">
          <FormField :name="field.name" v-slot="$field" class="flex flex-column gap-1">
            <FloatLabel v-if="!['ToggleSwitch', 'ColorPicker', 'Rating', 'FileUpload'].includes(field.component.name)"
              variant="in">
              <component :is="field.component" v-bind="field.props" v-model="$field.value" class="w-full"
                :class="{ 'p-invalid': $field.invalid }" fluid
                @update:model-value="(val: any) => onFieldChange(field.name as keyof T, val)" />
              <label :for="field.name">{{ field.label }}</label>
            </FloatLabel>

            <template v-else-if="field.component.name === 'Rating'" :name="field.name" class="flex flex-column gap-1">
              <label :for="field.name" class="font-bold">{{ field.label }}</label>
              <component :is="field.component" :id="field.name" v-bind="field.props" v-model="$field.value"
                class="w-full" :class="{ 'p-invalid': $field.invalid }" fluid />
            </template>

            <template v-else-if="field.component.name === 'FileUpload'">
              <component :is="field.component" v-bind="field.props" fluid
                @select="(e: FileUploadSelectEvent) => onFileSelect(field.name, e)"
                @remove="() => onFileClear(field.name)" @clear="() => onFileClear(field.name)">
                <template #empty>
                  <span>{{ field.emptyMessage || 'Nenhum arquivo selecionado.' }}</span>
                </template>
              </component>
            </template>

            <template v-else>
              <div class="flex align-items-center gap-2">
                <component :is="field.component" v-bind="field.props" v-model="$field.value" />
                <label class="font-bold">{{ field.label }}</label>
              </div>
            </template>

            <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>
        </div>
      </template>

      <div class="col-12 pb-0">
        <div class="flex justify-content-end gap-2">
          <Button :label="cancelLabel" outlined @click="visible = false" />
          <Button type="submit" :label="submitLabel" :loading="loading" :disabled="disabledButton" />
        </div>
      </div>
    </Form>
  </Dialog>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref } from 'vue';
import { Form, type FormSubmitEvent } from '@primevue/forms';
import type { IFields, AppFormResolver } from '@/functions/utils';
import { Dialog, type FileUploadSelectEvent } from 'primevue';

interface Props {
  header: string;
  fields: IFields[];
  resolver: AppFormResolver;
  initialValues: T;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  requiredFile?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  submitLabel: 'Salvar',
  cancelLabel: 'Cancelar',
  loading: false
});

const emit = defineEmits<{
  submit: [values: T, file?: File];
  close: [];
  'field-change': [payload: { name: keyof T, value: any, form: any, data: T }];
}>();

const visible = defineModel<boolean>('visible');
const formRef = ref();

// Adicione o computed corrigido
const disabledButton = computed(() => {
  // Se não for obrigatório, nunca desabilita por essa regra
  if (!props.requiredFile) return false;

  // Verifica se existe algum campo de FileUpload nos fields
  const hasFileUpload = props.fields.some(f => f.component.name === 'FileUpload');
  if (!hasFileUpload) return false;

  // Pega o valor atual do campo 'file' (ou o nome que você deu ao campo de arquivo)
  // Se o formRef ainda não estiver pronto, checamos o initialValues
  const fileValue = formRef.value?.states?.file?.value || props.initialValues?.file;

  return !fileValue;
});

const onFieldChange = (name: keyof T, value: any) => {
  emit('field-change', { name, value, form: formRef.value, data: props.initialValues.value });
};

const onHandleSubmit = (event: FormSubmitEvent) => {
  if (event.valid) {
    const { file, ...rest } = event.values as T;
    emit('submit', rest as T, file);
  }
};

const onFileSelect = (name: string, event: FileUploadSelectEvent) => {
  const file = Array.isArray(event.files) ? event.files[0] : event.files;
  formRef.value?.setValues({ [name]: file });
  onFieldChange(name as keyof T, file);
};

const onFileClear = (name: string) => {
  formRef.value?.setValues({ [name]: null });
  onFieldChange(name as keyof T, null);
};

defineExpose({
  setFieldValue: (name: keyof T, value: T) => formRef.value?.setFieldValue(name, value)
});
</script>