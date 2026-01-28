<template>
  <div class="surface-card shadow-2 border-round overflow-hidden">
    <DataTable :value="formattedValue" paginator :rows="rows" stripedRows v-model:filters="filters"
      :globalFilterFields="globalFields" dataKey="$id"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[5, 10, 25]"
      :currentPageReportTemplate="`Exibindo {first} a {last} de {totalRecords} ${resourceName}`"
      tableStyle="min-width: 60rem">
      <template #header v-if="header">
        <div class="flex flex-wrap align-items-center justify-content-between gap-3 p-2">
          <div class="flex align-items-center gap-3">
            <span class="text-xl font-bold">{{ title }}</span>
            <slot name="header-actions"></slot>
          </div>

          <IconField iconPosition="left">
            <InputIcon><i class="pi pi-search" /></InputIcon>
            <InputText v-model="filters['global'].value" placeholder="Procurar..." />
          </IconField>
        </div>
      </template>

      <slot name="extra-columns-start"></slot>

      <Column v-for="column in fields" :key="column.name" :header="column.label" :hidden="column.hiddenTable">
        <template #body="{ data }">
          <ColumnContent :column="column" :data="data" :loading="loading" />
        </template>
      </Column>

      <slot name="extra-columns-end"></slot>

      <Column v-if="$slots.actions" header="Ações" style="width: 10%">
        <template #body="{ data }">
          <Skeleton v-if="loading" width="100%" height="1rem" />
          <div v-else class="flex gap-2 justify-content-start align-items-center">
            <slot name="actions" :data="data"></slot>
          </div>
        </template>
      </Column>

      <template #empty>
        <Empty :label="`Nenhum(a) ${resourceName} encontrado(a)`" :icon="icon || 'ri-wallet-line'" />
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed } from "vue";
import { FilterMatchMode } from '@primevue/core/api';
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";
import Skeleton from "primevue/skeleton";
import ColumnContent from "@/components/ColumnContent.vue";
import type { IFields } from "@/functions/utils";
import dayjs from "dayjs";

const globalFields = ['_searchString'];

interface Props {
  value: T[];
  fields: IFields[];
  loading: boolean;
  title?: string;
  icon?: string;
  rows?: number;
  header?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 5,
  header: true,
});

const resourceName = computed(() => props.title?.toLowerCase() || 'registro(s)');

const filters = ref({
  'global': { value: '', matchMode: FilterMatchMode.CONTAINS },
});

const getSearchableString = (item: T, fields: IFields[]) => {
  return fields.map(field => {
    const val = field.name.split('.').reduce((obj, key) => obj?.[key], item);

    if (!val) return "";

    if (field.component?.name === 'Select' && field.props?.options) {
      const option = field.props.options.find((opt: any) => String(opt.value) === String(val));
      return option ? option.label : val;
    }

    if (field.component?.name === 'InputNumber' && field.props?.mode === 'currency') {
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Math.abs(Number(val)));

      return formatted.replace(/[\u00A0\u202F]/g, ' ');
    }

    if (field.component?.name === 'DatePicker') {
      return dayjs(val as any).format('DD/MM/YYYY');
    }

    if (field.component?.name === 'InputMask' && field.props?.mask) {
      const mask = field.props.mask;
      const cleanValue = String(val).replace(/\D/g, "");
      let i = 0;
      return mask.replace(/9/g, () => cleanValue[i++] || "");
    }

    return val;
  }).join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
};

const formattedValue = computed(() => {
  if (props.loading) return new Array(5).fill({});

  return props.value.map(item => ({
    ...item,
    _searchString: getSearchableString(item, props.fields)
  }));
});

</script>