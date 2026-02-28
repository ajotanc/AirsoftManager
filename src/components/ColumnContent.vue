<template>
  <Skeleton v-if="loading" width="80%" height="1.2rem" />

  <template v-else>
    <Tag v-if="['Select', 'MultiSelect'].includes(column.component?.name)" :value="displayValue" :severity="severity" />
    <Rating v-else-if="column.component?.name === 'Rating'" :modelValue="Number(cellValue)" readonly :cancel="false" />
    <ColorPicker v-else-if="column.component?.name === 'ColorPicker'" :modelValue="cellValue"
      style="pointer-events: none;" />
    <div v-else-if="column.component?.name === 'Editor'" v-html="displayValue" class="rich-text-content"></div>
    <template v-else-if="column.component.name === 'ToggleSwitch'">
      <i v-if="cellValue" :class="[column.icon || PrimeIcons.CHECK, `text-${column.iconColor || 'primary'}-500`]" />
      <i v-else :class="[PrimeIcons.TIMES, 'text-red-300']" />
    </template>

    <div v-else-if="column.button" class="flex align-items-center gap-2">
      <span>{{ displayValue }}</span>

      <Button v-if="column.button" v-tooltip.top="column.label" :icon="column.button.icon"
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
import type { IFields } from "@/functions/utils";

const props = defineProps<{
  column: IFields;
  data: any;
  loading: boolean;
}>();

const cellValue = computed(() => {
  if (!props.column.name || !props.data) return "";
  return props.column.name.split('.').reduce((obj, key) => (obj?.[key] ?? ""), props.data);
});

const severity = computed(() => {
  if (props.column.component?.name === 'Select' && props.column.props?.options) {
    const options = props.column.props.options;
    const option = options.find(({ value }: { value: string }) => String(value) === String(cellValue.value));

    return option ? option.severity : undefined;
  }

  return props.column.props?.severity;
});

const displayValue = computed(() => {
  const val = cellValue.value;
  if (val === null || val === undefined || val === "") return "";

  if (props.column.component?.name === 'InputMask') {
    return formatByMask(val, props.column.props?.mask);
  }

  if (props.column.component?.name === 'InputNumber' && props.column.props?.mode === 'currency') {
    return new Intl.NumberFormat(props.column.props?.locale, { style: props.column.props.mode, currency: props.column.props.currency }).format(Number(val));
  }

  if (props.column.component?.name === 'DatePicker') {
    const date = new Date(val);
    return isNaN(date.getTime()) ? val : date.toLocaleDateString("pt-BR");
  }

  if (props.column.component?.name === 'MultiSelect' && props.column.props?.options) {
    const options = props.column.props.options;
    return options
      .flatMap((opt: { value: string; label: string; }) => val?.includes(opt.value) ? opt.label : [])
      .join(' · ');
  }

  if (props.column.component?.name === 'Select' && props.column.props?.options) {
    const options = props.column.props.options;
    const option = options.find(({ value }: { value: string }) => String(value) === String(val));

    if (!option) {
      return val[props.column.props.optionLabel] || val;
    }

    return option ? option.label : val;
  }

  if (props.column.callback) {
    return props.column.callback(val);
  }

  return val;
});

const formatByMask = (value: any, mask: string | undefined): string => {
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