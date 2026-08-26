<template>
  <div class="surface-card shadow-3 border-round overflow-hidden">
    <DataTable :value="formattedValue" paginator :rows="rows" stripedRows v-model:filters="filters"
      :globalFilterFields="globalFields" dataKey="$id"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[20, 40, 60, 80, 100]"
      :currentPageReportTemplate="`Exibindo {first} a {last} de {totalRecords} ${resourceName}`"
      tableStyle="min-width: 60rem" size="small">
      <template #header v-if="header">
        <div class="flex flex-wrap align-items-center justify-content-between gap-3 p-2">
          <div class="flex align-items-center gap-3">
            <span class="text-xl font-bold">{{ title }}</span>
            <slot name="header-actions"></slot>
          </div>

          <div class="flex align-items-center gap-3">
            <slot name="header-filter"></slot>

            <IconField iconPosition="left">
              <InputIcon><i class="pi pi-search" /></InputIcon>
              <InputText v-model="filters['global'].value" placeholder="Procurar..." fluid />
            </IconField>
          </div>
        </div>
      </template>

      <slot name="extra-columns-start"></slot>
      <Column v-for="column in fields" :key="column.name" :field="column.name" :header="column.label"
        :hidden="column.hiddenTable" :style="{ width: column.width || 'auto' }" sortable>
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

      <template #paginatorstart>
        <slot name="extra-button-page-start"></slot>
      </template>

      <template #paginatorend>
        <slot name="extra-button-page-end"></slot>
      </template>

      <template #footer>
        <slot name="extra-footer"></slot>
      </template>

      <template #empty>
        <Empty :label="`Nenhum(a) ${resourceName} encontrado(a)`" :icon="icon || 'ri-wallet-line'" />
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts" generic="T extends FormRecord">
import { ref, computed } from "vue";
import { FilterMatchMode } from '@primevue/core/api';
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";
import Skeleton from "primevue/skeleton";
import ColumnContent from "@/components/ColumnContent.vue";
import type { IFields, FormRecord, FormValue } from "@/functions/utils";
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
  rows: 20,
  header: true,
});

const resourceName = computed(() => props.title?.toLowerCase() || 'registro(s)');

const filters = ref({
  'global': { value: '', matchMode: FilterMatchMode.CONTAINS },
});

const getSearchableString = (item: T, fields: IFields[]) => {
  return fields.map(field => {
    // 1. Pegar o valor bruto (trata caminhos como 'operator.codename')
    const val = field.name.split('.').reduce<FormValue>((obj, key) => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj) && !(obj instanceof Date) && !(obj instanceof File)) {
        return (obj as FormRecord)[key];
      }
      return undefined;
    }, item);

    if (val === null || val === undefined) return "";

    const compName = field.component?.name || '';

    // 2. Lógica para Select e MultiSelect (Respeitando labels dinâmicos)
    if (['Select', 'MultiSelect'].includes(compName) && field.props?.options) {
      const options = (field.props.options as FormRecord[]) || [];
      const optValueKey = (field.props.optionValue as string) || 'value';
      const optLabelKey = (field.props.optionLabel as string) || 'label';

      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date) && !(val instanceof File)) {
        return String((val as FormRecord)[optLabelKey] ?? "");
      }

      const option = options.find((opt) => opt && String(opt[optValueKey]) === String(val));
      if (option) return String(option[optLabelKey] ?? "");

      return String(val ?? "");
    }

    // 3. Lógica para Moeda (Garante que "R$ 50,00" seja pesquisável como "50,00")
    if (compName === 'InputNumber' && field.props?.mode === 'currency') {
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }).format(Number(val));
      return formatted.replace(/[\u00A0\u202F]/g, ' '); // Remove espaços inquebráveis do Intl
    }

    // 4. Lógica para Data
    if (compName === 'DatePicker') {
      return dayjs(val as string | number | Date).format('DD/MM/YYYY');
    }

    return String(val);
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