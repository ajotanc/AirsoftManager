<template>
  <div class="card">
    <DataTable ref="dt" v-model:editingRows="editingRows" editMode="row" dataKey="id" @row-edit-save="handleUpdate"
      :exportFilename="exportFilename" csvSeparator=";" :value="operators" paginator :rows="5"
      :rowsPerPageOptions="[5, 10, 20, 50]" tableStyle="min-width: 50rem" :loading="loading"
      v-model:expandedRows="expandedRows">
      <template #header>
        <div class="flex flex-wrap align-items-center justify-content-between gap-2">
          <span class="text-xl font-bold">Operadores</span>
          <div class="flex gap-2">
            <Button icon="pi pi-refresh" rounded raised @click="loadOperators" size="small"
              v-tooltip.top="'Atualizar'" />
            <Button type="button" icon="pi pi-download" rounded raised size="small" v-tooltip.top="'Exportar'"
              @click="exportData" />
          </div>
        </div>
      </template>
      <Column expander style="width: 5rem" />
      <Column field="avatar">
        <template #body="{ data, field }">
          <Avatar :image="data[field]" class="mr-2" size="xlarge" shape="circle" />
        </template>
      </Column>
      <Column field="codename" header="Codinome"></Column>
      <Column field="rating" header="Graduação">
        <template #body="{ data, field }">
          <Rating v-model="data[field]" :readonly="true" />
        </template>
        <template #editor="{ data, field }">
          <Rating v-model="data[field]" />
        </template>
      </Column>
      <Column field="role" header="Cargo">
        <template #body="{ data, field }">
          <Tag :value="ROLES.find((role) => role.code === data[field])?.name" :severity="'contrast'" />
        </template>
        <template #editor="{ data, field }">
          <Select :options="ROLES" v-model="data[field]" optionLabel="name" optionValue="code" class="w-full" fluid />
        </template>
        >
      </Column>
      <Column field="status" header="Situação">
        <template #body="{ data, field }">
          <Tag :value="data[field] ? 'Ativo' : 'Inativo'" :severity="data[field] ? 'success' : 'danger'" />
        </template>
        <template #editor="{ data, field }">
          <ToggleSwitch v-model="data[field]" />
        </template>
      </Column>
      <Column :rowEditor="true" bodyStyle="text-align: right;"></Column>
      <template #expansion="{ data: operator }">
        <OperatorDetails :operator="operator" />
      </template>
      <template #empty>Nenhum operador encontrado.</template>
      <template #loading>Carregando...</template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";

import Tag from "primevue/tag";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Rating from "primevue/rating";
import Button from "primevue/button";
import Avatar from "primevue/avatar";
import Select from "primevue/select";
import ToggleSwitch from "primevue/toggleswitch";

import OperatorDetails from "@/components/operators/OperatorDetails.vue";
import { ROLES } from "@/constants/airsoft";

import { OperatorService } from "@/services/operator";
import { useAuthStore } from "@/stores/auth";

const toast = useToast();
const authStore = useAuthStore();

const exportFilename = computed(() => {
  const date = Date.now();
  return `${date}_LISTA_OPERADORES`;
});

onMounted(() => {
  loadOperators();
});

const loadOperators = () => {
  OperatorService.list().then((data) => {
    operators.value = data;
    loading.value = false;
  });
};

const loading = ref(true);
const operators = ref([]);
const expandedRows = ref([]);
const dt = ref();
const editingRows = ref([]);

const handleUpdate = async (event) => {
  const { newData, index } = event;

  try {
    const rowId = newData.$id;

    const payload = {
      rating: newData.rating,
    };

    const operatorUpdated = await OperatorService.updateOperator(
      rowId,
      payload
    );

    operators.value[index] = newData;

    if (authStore.operator && authStore.operator.$id === rowId) {
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
    loadOperators();
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
