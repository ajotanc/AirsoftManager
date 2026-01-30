<template>
  <Dialog v-model:visible="visible" :header="header" :modal="true" :style="{ width: '100%', maxWidth: '640px' }"
    class="m-3" @hide="$emit('close')">
    <Form ref="formRef" :resolver="resolver" :initialValues="initialValues" @submit="onHandleSubmit" class="grid"
      :key="initialValues.$id || 'new'">
      <template v-for="field in fields" :key="field.name">
        <div :class="`col-12 md:col-${field.col || 12}`" v-if="!field.hidden">
          <FormField :name="field.name" v-slot="$field" class="flex flex-column gap-1">
            <FloatLabel v-if="!['ToggleSwitch', 'ColorPicker'].includes(field.component.name)" variant="in">
              <component :is="field.component" v-bind="field.props" v-model="$field.value" class="w-full"
                :class="{ 'p-invalid': $field.invalid }" fluid
                @update:model-value="(val: any) => onFieldChange(field.name as keyof T, val)" />
              <label :for="field.name">{{ field.label }}</label>
            </FloatLabel>

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
          <Button type="submit" :label="submitLabel" :loading="loading" />
        </div>
      </div>
    </Form>
  </Dialog>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref } from 'vue';
import { Form, type FormSubmitEvent } from '@primevue/forms';
import type { IFields, AppFormResolver } from '@/functions/utils';
import { Dialog } from 'primevue';

interface Props {
  header: string;
  fields: IFields[];
  resolver: AppFormResolver;
  initialValues: T;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  submitLabel: 'Salvar',
  cancelLabel: 'Cancelar',
  loading: false
});

const emit = defineEmits<{
  submit: [values: T];
  close: [];
  'field-change': [payload: { name: keyof T, value: any, form: any, data: T }];
}>();

const visible = defineModel<boolean>('visible');
const formRef = ref();

const onFieldChange = (name: keyof T, value: any) => {
  emit('field-change', { name, value, form: formRef.value, data: props.initialValues.value });
};

const onHandleSubmit = (event: FormSubmitEvent) => {
  if (event.valid) {
    emit('submit', event.values as T);
  }
};

defineExpose({
  setFieldValue: (name: keyof T, value: T) => formRef.value?.setFieldValue(name, value)
});
</script>