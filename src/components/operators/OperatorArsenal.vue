<template>
  <DataTable :value="items" paginator :rows="5" stripedRows>
    <template #header>
      <div class="font-bold text-lg mb-2">Arsenal</div>
    </template>

    <Column v-for="col in ARSENAL_COLUMNS" :key="col.field" :field="col.field" :header="col.header">
      <template #body="{ data: arm }">
        <Tag v-if="col.isTag" :value="col.map[arm[col.field]]" :severity="col.severity" />
        <span v-else-if="col.isDate">
          {{
            arm[col.field]
              ? new Date(arm[col.field]).toLocaleDateString("pt-BR")
              : "-"
          }}
        </span>
        <span v-else>
          {{ arm[col.field] }}
        </span>
      </template>
    </Column>
  </DataTable>
</template>

<script setup>
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import { ARSENAL_COLUMNS } from "@/constants/airsoft";

// Recebe a lista de armas (Array)
defineProps({
  items: {
    type: Array,
    required: true,
    default: () => [],
  },
});
</script>
