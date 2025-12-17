<template>
  <DataTable :value="items" stripedRows>
    <template #header>
      <div class="flex justify-content-between align-items-center">
        <span class="font-bold text-lg">Loadout Tático</span>
        <Tag v-if="showStatus && isStandard" severity="warn" :value="`Padrão ${TEAM_NAME}`" icon="pi pi-star-fill">
        </Tag>
      </div>
    </template>

    <Column header="Tipo de Uniforme">
      <template #body="{ data: uniform }">
        <div class="flex align-items-center gap-2">
          <Tag :value="UNIFORMS[uniform.type_unifrom]" severity="info" />
          <i v-if="checkUniformComplete(uniform)" class="pi pi-heart-fill text-red-500"
            v-tooltip.top="'Uniforme Completo'"></i>
        </div>
      </template>
    </Column>

    <Column v-for="item in LOADOUT_ITEMS" :key="item.key" :header="item.label" class="text-center">
      <template #body="{ data: loadout }">
        <i v-if="loadout[item.key]" class="pi pi-check text-green-500" style="font-size: 1rem; font-weight: bold"></i>
        <i v-else class="pi pi-times text-red-300" style="font-size: 1rem"></i>
      </template>
    </Column>

    <template #footer v-if="showStatus && !isStandard">
      <div class="w-full p-2 border-round text-center bg-gray-50 text-gray-600 border-1 border-gray-200">
        <div class="flex align-items-center justify-content-center gap-2">
          <i class="pi pi-info-circle"></i>
          <span class="font-medium">
            Loadout incompleto. Possui
            <strong>{{ currentCompleteCount }}</strong> de
            <strong>{{ minCompleteUniforms }}</strong> uniformes necessários.
          </span>
        </div>
      </div>
    </template>
  </DataTable>
</template>

<script setup>
import { computed } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import { TEAM_NAME, UNIFORMS, LOADOUT_ITEMS } from "@/constants/airsoft";

const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => [],
  },
  showStatus: {
    type: Boolean,
    default: false,
  },
  minCompleteUniforms: {
    type: Number,
    default: 1,
  },
});

const checkUniformComplete = (uniform) => {
  return LOADOUT_ITEMS.every((field) => {
    const value = uniform[field.key];
    return value === true || value === 1;
  });
};

const currentCompleteCount = computed(() => {
  if (!props.items || props.items.length === 0) return 0;

  return props.items.filter((uniform) => checkUniformComplete(uniform)).length;
});

const isStandard = computed(() => {
  return currentCompleteCount.value >= props.minCompleteUniforms;
});
</script>
