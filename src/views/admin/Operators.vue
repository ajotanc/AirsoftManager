<template>
  <div class="card">
    <div class="surface-card shadow-2 border-round overflow-hidden">

      <DataTable ref="dt" :value="dtValue" paginator :rows="5" stripedRows v-model:filters="filters"
        :globalFilterFields="labels" v-model:editingRows="editingRows" editMode="row" dataKey="$id"
        @row-edit-save="handleUpdate"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Exibindo {first} a {last} de {totalRecords} operadore(s)"
        tableStyle="min-width: 50rem" v-model:expandedRows="expandedRows" :exportFilename="exportFilename"
        csvSeparator=";">

        <template #header>
          <div class="flex flex-wrap align-items-center justify-content-between gap-3 p-2">

            <div class="flex align-items-center gap-3">
              <span class="text-xl font-bold">Operadore(s)</span>
            </div>

            <IconField iconPosition="left">
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="filters['global'].value" placeholder="Procurar..." />
            </IconField>

          </div>
        </template>

        <Column expander style="width: 5rem" />
        <Column header="Avatar">
          <template #body="{ data: { avatar } }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>
              <Avatar :image="avatar" :icon="!avatar ? 'pi pi-user' : undefined" class="mr-2" size="xlarge"
                shape="circle" />
            </template>
          </template>
        </Column>

        <Column header="Codinome">
          <template #body="{ data: { name, codename } }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>
              <div class="flex flex-column">
                <span class="font-bold">{{ getShortName(name) }}</span>
                <small>{{ codename }}</small>
              </div>
            </template>
          </template>
        </Column>

        <Column header="Graduação">
          <template #body="{ data }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>
              <Rating v-model="data.rating" :readonly="true" />
            </template>
          </template>
          <template #editor="{ data }">
            <Rating v-model="data.rating" />
          </template>
        </Column>

        <Column header="Cargo">
          <template #body="{ data }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>
              <Tag :value="ROLES.find((item) => item.value === data.role)?.label" :severity="'contrast'" />
            </template>
          </template>
          <template #editor="{ data }">
            <Select :options="ROLES" v-model="data.role" optionLabel="label" optionValue="value" class="w-full" fluid />
          </template>
        </Column>

        <Column header="Situação">
          <template #body="{ data }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>
              <Tag :value="data.status ? 'Ativo' : 'Inativo'" :severity="data.status ? 'success' : 'danger'" />
            </template>
          </template>
          <template #editor="{ data }">
            <ToggleSwitch v-model="data.status" />
          </template>
        </Column>

        <Column :rowEditor="true" bodyStyle="text-align: right;"></Column>

        <template #expansion="{ data: operator }">
          <Details :operator="operator" />
        </template>

        <template #empty>
          <Empty label="Nenhum operador encontrado." icon="ri ri-group-line" />
        </template>

        <template #paginatorstart>
          <Button icon="pi pi-refresh" rounded raised @click="loadServices" size="small" v-tooltip.top="'Atualizar'" />
        </template>

        <template #paginatorend>
          <Button type="button" icon="pi pi-download" rounded raised size="small" v-tooltip.top="'Exportar'"
            @click="exportData" />
        </template>

      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from "primevue/usetoast";

import Tag from "primevue/tag";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Rating from "primevue/rating";
import Button from "primevue/button";
import Avatar from "primevue/avatar";
import Select from "primevue/select";
import ToggleSwitch from "primevue/toggleswitch";
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';

import Details from "@/components/operators/Details.vue";
import { ROLES } from "@/constants/airsoft";

import { OperatorService } from "@/services/operator";
import { useAuthStore } from "@/stores/auth";
import { getShortName } from "@/functions/utils";
import Empty from "@/components/Empty.vue";

const toast = useToast();
const authStore = useAuthStore();

const loading = ref(true);
const operators = ref([]);
const expandedRows = ref({});
const dt = ref();
const editingRows = ref([]);

const exportFilename = computed(() => {
  const date = Date.now();
  return `${date}_LISTA_OPERADORES`;
});

const filters = ref({
  'global': { value: '', matchMode: FilterMatchMode.CONTAINS },
});

const labels = computed(() => {
  const firstItem = operators.value?.[0];

  if (!firstItem) return ['$id'];

  return Object.keys(firstItem)
    .filter(key => !key.startsWith('$'));
});

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  try {
    operators.value = await OperatorService.list();
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados.' });
  } finally {
    loading.value = false;
  }
};

const dtValue = computed(() => {
  return loading.value ? new Array(5).fill({}) : operators.value;
});

const handleUpdate = async (event) => {
  const { newData: { $id, rating, role, status }, index } = event;

  try {
    const payload = {
      rating,
      role,
      status
    };

    const operatorUpdated = await OperatorService.update(
      $id,
      payload
    );

    operators.value[index] = operatorUpdated;

    if (authStore.operator && authStore.operator.$id === $id) {
      authStore.$patch((state) => {
        state.operator = { ...state.operator, ...payload };
      });
    }

    toast.add({
      severity: "success",
      summary: "Sucesso",
      detail: "Operador atualizado",
      life: 3000,
    });
  } catch (error) {
    loadServices();
    console.error("Falha ao salvar", error);
    toast.add({
      severity: "error",
      summary: "Erro",
      detail: "Não foi possível salvar",
      life: 3000,
    });
  }
};

const exportData = () => {
  dt.value.exportCSV();
};
</script>
