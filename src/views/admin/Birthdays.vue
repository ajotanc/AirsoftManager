<template>
    <div class="card">
        <div class="surface-card shadow-2 border-round overflow-hidden">

            <DataTable :value="dtValue" paginator :rows="5" stripedRows :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Exibindo {first} a {last} de {totalRecords} operadores"
                tableStyle="min-width: 60rem">

                <template #header>
                    <div class="flex flex-wrap align-operators-center justify-content-between gap-3 p-2">

                        <div class="flex align-operators-center gap-3">
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

                <Column header="Codinome">
                    <template #body="{ data: operators }">
                        <Skeleton v-if="loading" width="100%" height="1rem" />
                        <template v-else>{{ operators.codename }}</template>
                    </template>
                </Column>

                <Column header="Data de Nascimento">
                    <template #body="{ data: operators }">
                        <Skeleton v-if="loading" width="100%" height="1rem" />
                        <template v-else>{{ formatDate(operators.birth_date).toLocaleDateString('pt-BR') }}</template>
                    </template>
                </Column>

                <Column header="Ações" style="width: 10%; min-width: 8rem" bodyStyle="text-align: center">
                    <template #body="{ data: operators }">
                        <Skeleton v-if="loading" width="100%" height="1rem" />
                        <template v-else>
                            <div v-if="isBirthdayToday(operators.birth_date)" class="flex">
                                <Button icon="pi pi-link" as="a" :href="`/happy-birthday/${operators.$id}`"
                                    target="_blank" rel="noopener" v-tooltip.top="'Feliz Aniversário'" rounded
                                    class="no-underline" />
                            </div>
                        </template>
                    </template>
                </Column>

                <template #empty>
                    <Empty label="Nenhum aniversariante encontrado para este mês" icon="ri ri-cake-2-line" />
                </template>
            </DataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { FilterMatchMode } from '@primevue/core/api';
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import Column from "primevue/column";
import Button from "primevue/button";
import DataTable from "primevue/datatable";
import InputText from "primevue/inputtext";
import { OperatorService, type IOperator } from "@/services/operator";
import { formatDate, isBirthdayToday } from "@/functions/utils";

onMounted(() => {
    loadServices();
});

const loadServices = async () => {
    try {
        operators.value = await OperatorService.listBirthdays();
    } catch (error) {
        console.error("Erro ao carregar:", error);
    } finally {
        loading.value = false;
    }
};

const dtValue = computed(() => {
    return loading.value ? new Array(5).fill({}) : operators.value;
});

const loading = ref(true);
const operators = ref<IOperator[]>([]);

const filters = ref({
    'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
});

</script>