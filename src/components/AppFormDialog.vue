<template>
  <Dialog v-model:visible="visible" :header="header" modal :style="{ width: '90vw', maxWidth: '667px' }"
    @hide="$emit('close')">
    <Form ref="formRef" :resolver="resolver" :initialValues="initialValues" @submit="onHandleSubmit" class="grid"
      :key="String(initialValues?.$id || 'new')">
      <template v-for="field in fields" :key="field.name">
        <div :class="`col-12 md:col-${field.col || 12}`" v-if="!field.hidden">
          <FormField :name="field.name" v-slot="$field" class="flex flex-column gap-1">
            <FloatLabel v-if="!['ToggleSwitch', 'ColorPicker', 'Rating', 'FileUpload'].includes(field.component?.name || '')"
              variant="in">
              <component :is="field.component" v-bind="field.props" v-model="$field.value" class="w-full"
                :class="{ 'p-invalid': $field.invalid }" fluid
                @update:model-value="(val: FormValue) => onFieldChange(field.name as keyof T, val)" />
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
                <template #content="{ files, removeFileCallback }">
                  <div v-for="(file, index) of files" :key="file.name + file.type + file.size"
                    class="flex align-items-center gap-3 p-2 border-round border-1 border-white-alpha-10 surface-card w-full my-2">
                    <img v-if="file.type.startsWith('image/')" :src="file.objectURL" :alt="file.name"
                      class="w-3rem h-3rem border-round object-fit-cover flex-shrink-0" />
                    <div v-else class="flex align-items-center justify-content-center border-round surface-hover w-3rem h-3rem flex-shrink-0">
                      <i class="ri-file-pdf-2-line text-3xl text-red-500"></i>
                    </div>
                    <div class="flex flex-column overflow-hidden flex-grow-1">
                      <span class="font-medium text-sm text-truncate">{{ file.name }}</span>
                      <span class="text-xs text-400">{{ formatFileSize(file.size) }}</span>
                    </div>
                    <Button icon="pi pi-times" severity="danger" text rounded @click="removeFileCallback(index)" class="flex-shrink-0" />
                  </div>
                </template>
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

      <slot name="extra-actions" />

      <div class="col-12 pb-0">
        <div class="flex justify-content-end gap-2">
          <Button :label="cancelLabel" outlined @click="visible = false" />
          <Button type="submit" :label="submitLabel" :loading="loading" :disabled="disabledButton" />
        </div>
      </div>
    </Form>
  </Dialog>
</template>

<script setup lang="ts" generic="T extends FormRecord">
import { ref, computed, watch } from 'vue';
import { Form, type FormSubmitEvent } from '@primevue/forms';
import { formatFileSize, type IFields, type AppFormResolver, type FieldChangePayload, type FormRecord, type FormValue } from '@/functions/utils';
import { Dialog, Button, type FileUploadSelectEvent } from 'primevue';

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

watch(
  () => props.initialValues,
  (newValues) => {
    formRef.value?.setValues(newValues);
  },
  { deep: true }
);

const emit = defineEmits<{
  submit: [values: T, file?: File];
  close: [];
  'field-change': [payload: FieldChangePayload<T>];
}>();

const visible = defineModel<boolean>('visible');
const formRef = ref();

// Adicione o computed corrigido
const disabledButton = computed(() => {
  // Se não for obrigatório, nunca desabilita por essa regra
  if (!props.requiredFile) return false;

  // Verifica se existe algum campo de FileUpload nos fields
  const hasFileUpload = props.fields.some(f => f.component?.name === 'FileUpload');
  if (!hasFileUpload) return false;

  // Pega o valor atual do campo 'file' (ou o nome que você deu ao campo de arquivo)
  // Se o formRef ainda não estiver pronto, checamos o initialValues
  const fileValue = formRef.value?.states?.file?.value || props.initialValues?.file;

  return !fileValue;
});

const onFieldChange = (name: keyof T, value: FormValue) => {
  emit('field-change', { name, value, form: formRef.value, data: props.initialValues });
};

const onHandleSubmit = (event: FormSubmitEvent) => {
  if (event.valid) {
    const { file, ...rest } = event.values as T;
    emit('submit', rest as T, (file instanceof File ? file : undefined));
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