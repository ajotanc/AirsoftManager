<template>
  <Skeleton v-if="loading" width="80%" height="1.2rem" />

  <template v-else>
    <Tag v-if="['Select', 'MultiSelect'].includes(componentName)" :value="displayValue" :severity="severity" />
    <Rating v-else-if="componentName === 'Rating'" :modelValue="Number(cellValue)" readonly :cancel="false" />
    <ColorPicker v-else-if="componentName === 'ColorPicker'" :modelValue="cellValue" style="pointer-events: none;" />
    <div v-else-if="componentName === 'Editor'" v-html="displayValue" class="rich-text-content"></div>
    <template v-else-if="componentName === 'ToggleSwitch'">
      <i v-if="cellValue" :class="[column.icon || PrimeIcons.CHECK, `text-${column.iconColor || 'primary'}-500`]" />
      <i v-else :class="[PrimeIcons.TIMES, 'text-red-300']" />
    </template>

    <div v-else-if="column.button" class="flex align-items-center gap-2">
      <span>{{ displayValue }}</span>

      <Button v-tooltip.top="column.label" :icon="column.button.icon"
        :severity="column.button.severity" @click="column.button.callback(data)" rounded outlined size="small" />
    </div>
    <template v-else>{{ displayValue }}</template>
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Skeleton from 'primevue/skeleton';
import Tag from 'primevue/tag';
import Rating from 'primevue/rating';
import Button from 'primevue/button';
import { PrimeIcons } from '@primevue/core/api';
import type { IFields, FormRecord, FormValue } from "@/functions/utils";

const props = defineProps<{
  column: IFields;
  data: FormRecord;
  loading: boolean;
}>();

const componentName = computed(() => props.column.component?.name || '');

const cellValue = computed((): FormValue => {
  if (!props.column.name || !props.data) return "";
  return props.column.name.split('.').reduce<FormValue>((obj, key) => {
    if (obj && typeof obj === 'object' && !Array.isArray(obj) && !(obj instanceof Date) && !(obj instanceof File)) {
      return (obj as FormRecord)[key] ?? "";
    }
    return "";
  }, props.data);
});

// Resolve a option dentro de `options` que corresponde ao valor da célula,
// respeitando optionValue configurado e sendo à prova de objetos populados
// (ex: relacionamento "operator" que vem como objeto, não como id).
const findOption = (options: FormRecord[], optValueKey: string, val: FormValue) => {
  if (!options || val === undefined || val === null) return undefined;

  const compareVal = val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date) && !(val instanceof File)
    ? (val as FormRecord)[optValueKey]
    : val;

  if (compareVal === undefined || compareVal === null) return undefined;

  return options.find((opt) => opt != null && String(opt[optValueKey]) === String(compareVal));
};

const severity = computed(() => {
  if (componentName.value === 'Select' && props.column.props?.options) {
    const options = props.column.props.options as FormRecord[];
    const optValueKey = (props.column.props.optionValue as string) || 'value';

    const option = findOption(options, optValueKey, cellValue.value);
    return option ? (option.severity as string | undefined) : undefined;
  }

  return props.column.props?.severity as string | undefined;
});

const displayValue = computed(() => {
  const val = cellValue.value;
  if (val === null || val === undefined || val === "") return "";

  const compName = componentName.value;

  if (compName === 'InputMask') {
    return formatByMask(val, props.column.props?.mask as string | undefined);
  }

  if (compName === 'InputNumber' && props.column.props?.mode === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: (props.column.props?.currency as string) || 'BRL' }).format(Number(val));
  }

  if (compName === 'DatePicker') {
    const date = new Date(val as string | number | Date);
    return isNaN(date.getTime()) ? String(val) : date.toLocaleDateString("pt-BR");
  }

  if (compName === 'MultiSelect' && props.column.props?.options) {
    const options = (props.column.props.options as FormRecord[]) || [];
    const optValueKey = (props.column.props.optionValue as string) || 'value';
    const optLabelKey = (props.column.props.optionLabel as string) || 'label';

    const values = Array.isArray(val) ? val : [];
    return options
      .flatMap((opt) => {
        if (!opt) return [];
        const optVal = opt[optValueKey];
        return values.some((v) => String(v) === String(optVal)) ? String(opt[optLabelKey] ?? '') : [];
      })
      .join(' · ');
  }

  if (compName === 'Select' && props.column.props?.options) {
    const options = (props.column.props.options as FormRecord[]) || [];
    const optValueKey = (props.column.props.optionValue as string) || 'value';
    const optLabelKey = (props.column.props.optionLabel as string) || 'label';

    const option = findOption(options, optValueKey, val);
    if (option) return String(option[optLabelKey] ?? '');

    // Fallback: valor já é o objeto relacionado (ex: operador populado)
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date) && !(val instanceof File)) {
      return String((val as FormRecord)[optLabelKey] || "");
    }

    return String(val ?? "");
  }

  if (typeof props.column.callback === 'function') {
    return props.column.callback(val);
  }

  return String(val);
});

const formatByMask = (value: FormValue, mask: string | undefined): string => {
  if (!value || !mask) return String(value || "");

  const cleanValue = String(value).replace(/\D/g, "");
  let i = 0;

  return mask.replace(/9/g, () => cleanValue[i++] || "");
};
</script>

<style scoped>
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.rich-text-content :deep(img) {
  max-width: 100%;
}
</style>