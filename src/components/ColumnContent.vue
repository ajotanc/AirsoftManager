<template>
  <Skeleton v-if="loading" width="100%" height="1rem" />

  <template v-else>
    <Tag v-if="column.isTag" :value="displayValue" />

    <Rating v-else-if="column.isRating" :modelValue="cellValue" readonly />

    <div v-else class="flex align-items-center gap-2 w-full overflow-hidden">

      <div v-if="column.isHtml" v-html="displayValue" class="rich-text-content"></div>
      <span v-else class="text-truncate">{{ displayValue || '' }}</span>

      <Button v-if="column.button" v-tooltip.top="column.label" :icon="column.button.icon"
        :severity="column.button.severity" @click="column.button.callback(data)" rounded outlined size="small" />
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Tag, Rating, Button } from "primevue";
import type { IFields } from "@/functions/utils";

const { column, data, loading } = defineProps<{
  column: IFields;
  data: any;
  loading: boolean;
}>();

const cellValue = computed(() => {
  const name = column.name;
  if (!name || !data) return "";
  return name.split('.').reduce((obj, key) => (obj ? obj[key] : ""), data);
});

const displayValue = computed(() => {
  const val = cellValue.value;

  if (column.isTag && column.props?.options) {
    return getLabelFromOptions(column.props.options, val);
  }

  if (column.callback) {
    return column.callback(val);
  }

  return val;
});

const getLabelFromOptions = (options: any[] | undefined, value: any): string => {
  if (!options || value === undefined || value === null) return "N/A";

  const option = options.find((opt) => opt.value === value.toString());
  return option ? option.label : value;
};
</script>