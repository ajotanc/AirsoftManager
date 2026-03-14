<template>
  <div class="card">
    <div class="surface-card shadow-2 border-round overflow-hidden">

      <DataTable :value="dtValue" paginator :rows="5" stripedRows v-model:filters="filters" :globalFilterFields="labels"
        v-model:editingRows="editingRows" editMode="row" dataKey="$id" @row-edit-save="handleUpdate"
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
        <Column style="width: 5rem">
          <template #body="{ data: { $id, avatar } }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>
              <Avatar :image="avatar" :icon="!avatar ? 'pi pi-user' : undefined" class="mr-2" size="xlarge"
                shape="circle" @click="$router.push(`/verify/operator/${$id}`)" />
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

        <Column field="info.isComplete" header="Perfil" sortable style="width: 10rem">
          <template #body="{ data }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
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

        <Column :rowEditor="true" bodyStyle="text-align: right;" />

        <template #expansion="{ data: operator }">
          <Details :operator="operator" />
        </template>

        <template #empty>
          <Empty label="Nenhum operador encontrado." icon="ri-group-line" />
        </template>

        <template #paginatorstart>
          <Button icon="ri-reset-right-line" rounded @click="loadServices" size="small" v-tooltip.top="'Atualizar'" />
        </template>

        <template #paginatorend>
          <div class="flex gap-2">
            <Button type="button" icon="ri-download-2-line" rounded size="small" v-tooltip.top="'Exportar'"
              @click="exportData" />
            <Button type="button" icon="ri-health-book-line" severity="danger" rounded size="small"
              v-tooltip.top="'Ficha Médica'" @click="exportHealth" /> <Button type="button" icon="ri-t-shirt-2-line"
              rounded size="small" v-tooltip.top="'Tamanhos de Camisa'" @click="exportShirtSize" />
          </div>
        </template>

      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from "primevue/usetoast";

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

import Details from "@/components/operators/Details.vue";
import { ROLES } from "@/constants/airsoft";

import { type IOperator, operatorSchema, OperatorService } from "@/services/operator";
import { export2Excel, getShortName } from "@/functions/utils";
import Empty from "@/components/Empty.vue";
import { useOperator } from "@/composables/useOperator";
import { formatCPF, formatPhone } from "@brazilian-utils/brazilian-utils";

const toast = useToast();
const { operator, updateState } = useOperator();

const loading = ref(true);
const operators = ref<IOperator[]>([]);
const expandedRows = ref({});
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
    const response = await OperatorService.list();

    operators.value = response.map(op => {
      const info = checkOperator(op);

      return {
        ...op,
        info
      };
    });
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

const handleUpdate = async (event: DataTableRowEditSaveEvent<any>) => {
  const { newData } = event;
  const { $id, rating, role, status } = newData;

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

    const index = operators.value.findIndex(op => op.$id === $id);

    if (index !== -1) {
      operators.value[index] = operatorUpdated;
    }

    if (operator.value.$id === $id) {
      await updateState(operatorUpdated);
    }

    toast.add({
      severity: "success",
      summary: "Sucesso",
      detail: "Operador atualizado!",
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

const exportData = async () => {
  if (!operators.value.length) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Não há dados para exportar.' });
    return;
  }

  await export2Excel(exportFilename.value, operators.value, 'Operadores');

  toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Planilha Excel gerada!', life: 3000 });
};

const checkOperator = (operator: IOperator) => {
  const isProfileComplete = operatorSchema.safeParse(operator).success;
  const hasArsenal = operator.arsenal.length > 0;
  const hasLoadout = operator.loadout.length > 0;

  const isComplete = isProfileComplete && hasArsenal && hasLoadout;

  return {
    isComplete,
    isProfileComplete,
    hasArsenal,
    hasLoadout
  }
};

const exportShirtSize = async () => {
  const dataToExport = operators.value.map(p => {
    return {
      "Nome Completo": p.name.trim(),
      "Codinome": p.codename,
      "Tamanho de Camisa": p.shirt_size
    }
  });

  const summary = "Tamanhos de Camisa";

  await export2Excel(`${dayjs().unix()}-TAMANHOS-DE-CAMISA`, dataToExport, summary);

  toast.add({
    severity: 'success',
    summary,
    detail: 'Exportação concluída! Verifique seu download.',
    life: 3000
  });
};

const exportHealth = async () => {
  const dataToExport = operators.value.map(p => {
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

  toast.add({
    severity: 'success',
    summary,
    detail: 'Exportação concluída! Verifique seu download.',
    life: 3000
  });
};

</script>
