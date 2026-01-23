<template>
    <div class="card">
        <AppTable title="Aniversariantes do Mês" :value="operators" :fields="fields" :loading="loading">
            <template #actions="{ data }">
                <div v-if="isBirthdayToday(data.birth_date)" class="flex">
                    <Button icon="pi pi-link" as="a" :href="`/happy-birthday/${data.$id}`" target="_blank"
                        rel="noopener" v-tooltip.top="'Feliz Aniversário'" rounded class="no-underline" />
                </div>
            </template>
        </AppTable>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { OperatorService, type IOperator } from "@/services/operator";
import { isBirthdayToday, type IFields } from "@/functions/utils";
import { DatePicker } from "primevue";

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

const fields = computed<IFields[]>(() => [
    { name: "name", label: "Nome", component: InputText, col: "6" },
    { name: "codename", label: "Codinome", component: InputText, col: "6" },
    {
        name: "birth_date", label: "Data de Nascimento", component: DatePicker, col: "6", props: {
            showButtonBar: true,
            manualInput: false,
            showIcon: true,
            focusOnShow: false,
            iconDisplay: 'input',
            variant: 'filled'
        }
    },
]);

const loading = ref(true);
const operators = ref<IOperator[]>([]);
</script>