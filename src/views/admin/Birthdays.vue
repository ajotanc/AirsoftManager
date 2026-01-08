<template>
    <div class="card">
        <div class="surface-card shadow-2 border-round overflow-hidden">

            <DataTable :value="operator" paginator :rows="5" stripedRows :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Exibindo {first} a {last} de {totalRecords} operadores"
                tableStyle="min-width: 60rem">

                <template #header>
                    <div class="flex flex-wrap align-operator-center justify-content-between gap-3 p-2">

                        <div class="flex align-operator-center gap-3">
                            <span class="text-xl font-bold">Aniversariantes do Mês</span>
                        </div>

                        <IconField iconPosition="left">
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Procurar..." />
                        </IconField>

                    </div>
                </template>

                <Column field="codename" header="Codinome" style="width: 10%; min-width: 8rem" />
                <Column header="Data de Nascimento" style="width: 10%; min-width: 8rem">
                    <template #body="{ data: operator }">
                        {{ formatDate(operator.birth_date, true) }}
                    </template>
                </Column>
                <Column header="Ações" style="width: 5%; min-width: 5rem">
                    <template #body="{ data: operator }">
                        <div v-if="isBirthday(operator.birth_date)" class="flex">
                            <Button icon="pi pi-link" as="a" :href="`/happy-birthday/${operator.$id}`" target="_blank"
                                rel="noopener" v-tooltip.top="'Feliz Aniversário'" rounded class="no-underline" />
                        </div>
                    </template>
                </Column>

                <template #loading>Carregando...</template>
                <template #empty>Nenhum Aniversariante encontrado.</template>
            </DataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { FilterMatchMode } from '@primevue/core/api';
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import Column from "primevue/column";
import Button from "primevue/button";
import DataTable from "primevue/datatable";
import InputText from "primevue/inputtext";
import { OperatorService, type IOperator } from "@/services/operator";
import { formatDate, isBirthday } from "@/functions/utils";

onMounted(() => {
    loadOperators();
});

const loadOperators = () => {
    OperatorService.listBirthdays().then((data) => {
        operator.value = data;
        loading.value = false;
    });
};

const loading = ref(true);
const operator = ref<IOperator[]>([]);

const filters = ref({
    'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
});

</script>