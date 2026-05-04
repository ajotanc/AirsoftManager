<template>
  <div class="card">
    <div class="surface-card shadow-3 border-round overflow-hidden">

      <DataTable :value="dtValue" paginator :rows="20" stripedRows v-model:filters="filters"
        :globalFilterFields="labels" v-model:editingRows="editingRows" editMode="row" dataKey="$id"
        @row-edit-save="handleUpdate"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[20, 40, 60, 80, 100]"
        currentPageReportTemplate="Exibindo {first} a {last} de {totalRecords} operadore(s)"
        tableStyle="min-width: 50rem" v-model:expandedRows="expandedRows" :exportFilename="exportFilename"
        csvSeparator=";" size="small">

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
        <Column style="width: 5rem">
          <template #body="{ data: { $id, avatar } }">
            <Skeleton v-if="isLoading" width="100%" height="1rem" />
            <template v-else>
              <Avatar :image="avatar" :icon="!avatar ? 'pi pi-user' : undefined" class="mr-2" size="xlarge"
                shape="circle" @click="$router.push(`/verify/operator/${$id}`)" />
            </template>
          </template>
        </Column>

        <Column header="Codinome">
          <template #body="{ data: { name, codename } }">
            <Skeleton v-if="isLoading" width="100%" height="1rem" />
            <template v-else>
              <div class="flex flex-column">
                <span class="font-bold">{{ getShortName(name) }}</span>
                <small>{{ codename }}</small>
              </div>
            </template>
          </template>
        </Column>

        <Column field="info.isComplete" header="Perfil" sortable style="width: 10rem">
          <template #body="{ data }">
            <Skeleton v-if="isLoading" width="100%" height="1rem" />
            <template v-else>
              <div class="flex gap-2">
                <span
                  :class="['text-xl', 'ri-user-follow-line', data.info.isProfileComplete ? 'text-green-500' : 'text-red-500']"
                  v-tooltip.top="'Perfil'" />
                <span :class="['text-xl', 'ri-sword-line', data.info.hasArsenal ? 'text-green-500' : 'text-red-500']"
                  v-tooltip.top="'Arsenal'" />
                <span
                  :class="['text-xl', 'ri-t-shirt-2-line', data.info.hasLoadout ? 'text-green-500' : 'text-red-500']"
                  v-tooltip.top="'Loadout'" />
              </div>
            </template>
          </template>
        </Column>

        <Column header="Graduação">
          <template #body="{ data }">
            <Skeleton v-if="isLoading" width="100%" height="1rem" />
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
            <Skeleton v-if="isLoading" width="100%" height="1rem" />
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
            <Skeleton v-if="isLoading" width="100%" height="1rem" />
            <template v-else>
              <Tag :value="data.status ? 'Ativo' : 'Inativo'" :severity="data.status ? 'success' : 'danger'" />
            </template>
          </template>
          <template #editor="{ data }">
            <ToggleSwitch v-model="data.status" />
          </template>
        </Column>

        <Column :rowEditor="true" bodyStyle="text-align: right;" />

        <template #expansion="{ data: operator }">
          <Details :operator="operator" />
        </template>

        <template #empty>
          <Empty label="Nenhum operador encontrado." icon="ri-group-line" />
        </template>

        <template #paginatorstart>
          <Button icon="ri-reset-right-line" rounded @click="() => refetch()" size="small"
            v-tooltip.top="'Atualizar'" />
        </template>

        <template #paginatorend>
          <div class="flex gap-2">
            <Button type="button" icon="ri-download-2-line" rounded size="small" v-tooltip.top="'Exportar'"
              @click="exportData" />
            <Button type="button" icon="ri-health-book-line" severity="danger" rounded size="small"
              v-tooltip.top="'Ficha Médica'" @click="exportHealth" />
            <Button type="button" icon="ri-t-shirt-2-line" rounded size="small" v-tooltip.top="'Tamanhos de Camisa'"
              @click="exportShirtSize" />
          </div>
        </template>

      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from "primevue/usetoast";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import dayjs from "dayjs";

import Tag from "primevue/tag";
import DataTable, { type DataTableRowEditSaveEvent } from "primevue/datatable";
import Column from "primevue/column";
import Rating from "primevue/rating";
import Button from "primevue/button";
import Avatar from "primevue/avatar";
import Select from "primevue/select";
import ToggleSwitch from "primevue/toggleswitch";
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Skeleton from "primevue/skeleton";

import Details from "@/components/operators/Details.vue";
import { ROLES } from "@/constants/airsoft";

import { type IOperator, operatorSchema, OperatorService } from "@/services/operator";
import { export2Excel, getShortName } from "@/functions/utils";
import Empty from "@/components/Empty.vue";
import { useOperator } from "@/composables/useOperator";
import { formatCPF, formatPhone } from "@brazilian-utils/brazilian-utils";

const toast = useToast();
const queryClient = useQueryClient();
const { operator, updateState } = useOperator();

const checkOperator = (op: IOperator) => {
  const isProfileComplete = operatorSchema.safeParse(op).success;
  const hasArsenal = op.arsenal && op.arsenal.length > 0;
  const hasLoadout = op.loadout && op.loadout.length > 0;

  return {
    isComplete: isProfileComplete && hasArsenal && hasLoadout,
    isProfileComplete,
    hasArsenal,
    hasLoadout
  };
};

const {
  data: operators,
  isLoading,
  // isError,
  refetch
} = useQuery({
  queryKey: ['operators', 'list'],
  queryFn: async () => {
    const response = await OperatorService.list();

    return response.map(op => ({
      ...op,
      info: checkOperator(op)
    }));
  },
});

const expandedRows = ref({});
const editingRows = ref([]);

const exportFilename = computed(() => {
  return `${Date.now()}_LISTA_OPERADORES`;
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

const dtValue = computed(() => {
  return isLoading.value ? new Array(5).fill({}) : (operators.value || []);
});

const handleUpdate = async (event: DataTableRowEditSaveEvent<any>) => {
  const { newData } = event;
  const { $id, rating, role, status } = newData;

  try {
    const payload = { rating, role, status };

    const operatorUpdated = await OperatorService.update($id, payload);

    const updatedWithInfo = {
      ...operatorUpdated,
      info: checkOperator(operatorUpdated)
    };

    // Atualiza o cache local em vez de gastar requisições extra
    queryClient.setQueryData(['operators', 'list'], (oldData: any) => {
      if (!oldData) return [];
      return oldData.map((op: any) => op.$id === $id ? updatedWithInfo : op);
    });

    if (operator.value.$id === $id) {
      await updateState(operatorUpdated);
    }

    toast.add({ severity: "success", summary: "Sucesso", detail: "Operador atualizado com sucesso!", life: 3000 });
  } catch (error) {
    console.error("Falha ao guardar", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Não foi possível guardar as alterações.", life: 3000 });
  }
};

const exportData = async () => {
  const data = operators.value || [];
  if (!data.length) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Não existem dados para exportar.' });
    return;
  }
  await export2Excel(exportFilename.value, data, 'Operadores');
  toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Ficheiro Excel gerado!', life: 3000 });
};

const exportShirtSize = async () => {
  const data = operators.value || [];
  const dataToExport = data.map(p => {
    return {
      "Nome Completo": p.name.trim(),
      "Codinome": p.codename,
      "Tamanho de Camisa": p.shirt_size
    }
  });

  const summary = "Tamanhos de Camisa";
  await export2Excel(`${dayjs().unix()}-TAMANHOS-DE-CAMISA`, dataToExport, summary);
  toast.add({ severity: 'success', summary, detail: 'Exportação concluída! Verifica a tua pasta de transferências.', life: 3000 });
};

const exportHealth = async () => {
  const data = operators.value || [];
  const dataToExport = data.map(p => {
    return {
      "Nome Completo": p.name.trim(),
      "Data de Nascimento": dayjs(p.birth_date).format('DD/MM/YYYY'),
      "CPF": p.identity && formatCPF(p.identity!),
      "Telefone": p.phone && formatPhone(p.phone, { mask: 'auto' }),
      "Contato Emergência": p.emergency_contact?.trim(),
      "Contato Emergência - Telefone": p.emergency_contact_phone && formatPhone(p.emergency_contact_phone, { mask: 'auto' }),
      "Tipo Sanguíneo": p.blood_type,
      "Alergias": p.allergies?.join(', ') || null,
      "Medicação Contínua": p.medication_details?.join(', ') || null,
    }
  });

  const summary = "Ficha Médica";
  await export2Excel(`${dayjs().unix()}-FICHA-MÉDICA`, dataToExport, summary);
  toast.add({ severity: 'success', summary, detail: 'Exportação concluída! Verifica a tua pasta de transferências.', life: 3000 });
};
</script>