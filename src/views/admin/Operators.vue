<template>
  <div class="card">
    <div class="surface-card shadow-3 border-round overflow-hidden">

      <DataTable :value="dtValue" paginator :rows="20" stripedRows v-model:filters="filters"
        :globalFilterFields="labels" v-model:editingRows="editingRows" editMode="row" dataKey="$id"
        @row-edit-save="handleUpdate"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[20, 40, 60, 80, 100]"
        currentPageReportTemplate="Exibindo {first} a {last} de {totalRecords} operadore(s)"
        tableStyle="min-width: 50rem" v-model:expandedRows="expandedRows" size="small">

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

        <Column header="Codinome" style="width: 12rem; min-width: 12rem;">
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

        <Column field="info.isComplete" header="Perfil" sortable style="width: 8rem; min-width: 8rem;">
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
                <span
                  :class="['text-xl', 'ri-graduation-cap-line', data.info.hasSchool ? 'text-green-500' : 'text-red-500']"
                  v-tooltip.top="`Escola: ${data.info.approvedCount}/${SCHOOL_CATEGORIES.length} Provas`" />
              </div>
            </template>
          </template>
        </Column>

        <Column header="Cursos" style="width: 14rem; min-width: 14rem;">
          <template #body="{ data }">
            <Skeleton v-if="isLoading" width="100%" height="1rem" />
            <template v-else>
              <CourseBadges :courses="data.courses" size="small" />
            </template>
          </template>
          <template #editor="{ data }">
            <MultiSelect v-model="data.courses" :options="COURSES" optionLabel="label" optionValue="value"
              placeholder="Selecione cursos" class="w-full" display="chip" fluid />
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

        <Column header="Cargo" field="role_label">
          <template #body="{ data }">
            <Skeleton v-if="isLoading" width="100%" height="1rem" />
            <template v-else>
              <Tag :value="data.role_label" :severity="'contrast'" />
            </template>
          </template>
          <template #editor="{ data }">
            <Select :options="ROLES" v-model="data.role" optionLabel="label" optionValue="value" class="w-full" fluid />
          </template>
        </Column>

        <Column header="Situação" field="status_label">
          <template #body="{ data }">
            <Skeleton v-if="isLoading" width="100%" height="1rem" />
            <template v-else>
              <Tag :value="data.status_label" :severity="data.status ? 'success' : 'danger'" />
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
          <div class="flex flex-wrap gap-2 p-2 justify-content-center">
            <Button icon="ri-reset-right-line" rounded @click="() => refetch()" size="small"
              v-tooltip.top="'Atualizar'" />
            <Button type="button" icon="ri-health-book-line" severity="danger" rounded size="small"
              v-tooltip.top="'Ficha Médica'" @click="exportHealth" />
            <Button type="button" icon="ri-download-2-line" severity="secondary" rounded size="small"
              v-tooltip.top="'Exportar Lista'" @click="exportData" />
            <Button type="button" icon="ri-t-shirt-2-line" severity="secondary" rounded size="small"
              v-tooltip.top="'Tamanhos de Camisa'" @click="exportShirtSize" />
            <Button type="button" icon="ri-archive-line" severity="secondary" rounded size="small"
              v-tooltip.top="'Exportar Loadouts'" @click="exportLoadouts" />
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
import MultiSelect from "primevue/multiselect";
import ToggleSwitch from "primevue/toggleswitch";
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Skeleton from "primevue/skeleton";

import Details from "@/components/operators/Details.vue";
import CourseBadges from "@/components/operators/CourseBadges.vue";
import { ROLES, COURSES, UNIFORMS, LOADOUT_ITEMS } from "@/constants/airsoft";

import { type IOperator, isOperatorProfileComplete, OperatorService } from "@/services/operator";
import { SchoolService, SCHOOL_CATEGORIES } from "@/services/school";
import type { ILoadout } from "@/services/loadout";
import { getSearchableKeys } from "@/functions/utils";
import { export2Excel, getShortName } from "@/functions/utils";
import Empty from "@/components/Empty.vue";
import { useOperator } from "@/composables/useOperator";
import { formatCPF, formatPhone } from "@brazilian-utils/brazilian-utils";

const toast = useToast();
const queryClient = useQueryClient();
const { operator, updateState } = useOperator();

const checkOperator = (op: IOperator) => {
  const isProfileComplete = isOperatorProfileComplete(op);
  const hasArsenal = op.arsenal && op.arsenal.length > 0;
  const hasLoadout = op.loadout && op.loadout.length > 0;
  const missing = SchoolService.getMissingCertificationsFromAnswers(op.school_answers || []);
  const hasSchool = missing.length === 0;

  return {
    isComplete: isProfileComplete && hasArsenal && hasLoadout && hasSchool,
    isProfileComplete,
    hasArsenal,
    hasLoadout,
    hasSchool,
    approvedCount: SCHOOL_CATEGORIES.length - missing.length
  };
};

const enrichOperator = (op: IOperator) => {
  const enriched = {
    ...op,
    info: checkOperator(op)
  };

  Object.defineProperty(enriched, 'role_label', {
    get() {
      return ROLES.find(r => r.value === this.role)?.label;
    },
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(enriched, 'status_label', {
    get() {
      return this.status ? 'Ativo' : 'Inativo';
    },
    enumerable: true,
    configurable: true,
  });

  return enriched;
};

const {
  data: operators,
  isLoading,
  refetch
} = useQuery({
  queryKey: ['operators', 'list'],
  queryFn: async () => {
    const response = await OperatorService.list();
    return response.map(enrichOperator);
  },
});

const expandedRows = ref({});
const editingRows = ref([]);

const operatorsFiltered = computed(() => operators.value?.filter(p => p.role !== 'visitor' && p.status && p.loadout?.length > 0) || []);

const filters = ref({
  'global': { value: '', matchMode: FilterMatchMode.CONTAINS },
});

const labels = computed(() => getSearchableKeys(operators.value?.[0], ['name', 'codename', 'role_label', 'status_label']));

const dtValue = computed(() => {
  return isLoading.value ? new Array(5).fill({}) : (operators.value || []);
});

type IOperatorWithInfo = ReturnType<typeof enrichOperator>;

const handleUpdate = async (event: DataTableRowEditSaveEvent<IOperator>) => {
  const { newData } = event;
  const { $id, rating, role, status, courses } = newData;

  try {
    const payload = { rating, role, status, courses };

    const operatorUpdated = await OperatorService.update($id, payload);

    const updatedWithInfo = enrichOperator(operatorUpdated);

    // Atualiza o cache local em vez de gastar requisições extra
    queryClient.setQueryData(['operators', 'list'], (oldData: IOperatorWithInfo[] | undefined) => {
      if (!oldData) return [];
      return oldData.map(op => op.$id === $id ? updatedWithInfo : op);
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
  if (!operatorsFiltered.value.length) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Não existem dados para exportar.' });
    return;
  }

  await export2Excel(`${dayjs().unix()}-LISTA-OPERADORES`, operatorsFiltered.value, 'Operadores');
  toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Ficheiro Excel gerado!', life: 3000 });
};

const exportShirtSize = async () => {
  if (!operatorsFiltered.value.length) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Não existem dados para exportar.' });
    return;
  }

  const dataToExport = operatorsFiltered.value.map(p => {
    return {
      "Codinome": p.codename,
      "Tamanho de Camisa": p.shirt_size
    }
  });

  const summary = "Tamanhos de Camisa";
  await export2Excel(`${dayjs().unix()}-TAMANHOS-DE-CAMISA`, dataToExport, summary);
  toast.add({ severity: 'success', summary, detail: 'Exportação concluída! Verifica a tua pasta de transferências.', life: 3000 });
};

const exportHealth = async () => {
  if (!operatorsFiltered.value.length) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Não existem dados para exportar.' });
    return;
  }

  const dataToExport = operatorsFiltered.value.map(p => {
    return {
      "Nome": p.name?.trim() || null,
      "Data de Nascimento": dayjs(p.birth_date).format('DD/MM/YYYY'),
      "CPF": p.identity && formatCPF(p.identity!),
      "Telefone": p.phone && formatPhone(p.phone, { mask: 'auto' }),
      "Plano de Saúde?": p.health_plan ? "Sim" : "Não",
      "Plano de Saúde - Nome": p.health_plan_name?.trim() || null,
      "Plano de Saúde - Número": p.health_plan_number,
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

const exportLoadouts = async () => {
  if (!operatorsFiltered.value.length) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Não existem dados para exportar.' });
    return;
  }

  const rows: Record<string, string>[] = [];

  for (const p of operatorsFiltered.value) {
    const codename = p.codename || p.name?.trim() || '';

    for (const l of p.loadout) {
      const uniformName = UNIFORMS[l.type_uniform] || `Uniforme ${l.type_uniform}`;
      const row: Record<string, string> = {
        "Codinome": codename,
        "Uniforme": uniformName,
      };
      for (const item of LOADOUT_ITEMS) {
        const val = l[item.key as keyof ILoadout];
        row[item.label] = val ? "Sim" : "Não";
      }
      rows.push(row);
    }
  }

  if (!rows.length) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Não existem dados de loadout para exportar.' });
    return;
  }

  const summary = "Loadouts dos Operadores";
  await export2Excel(`${dayjs().unix()}-LOADOUTS-OPERADORES`, rows, summary, true);
  toast.add({ severity: 'success', summary, detail: 'Exportação concluída! Verifica a tua pasta de transferências.', life: 3000 });
};
</script>

<style scoped>
:deep(.p-paginator-content-start) {
  width: 100%;
}
</style>