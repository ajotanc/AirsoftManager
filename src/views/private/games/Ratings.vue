<template>
    <div class="card">
        <div class="surface-card shadow-2 border-round overflow-hidden">
            <DataTable :value="ratings" paginator :rows="5" stripedRows :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Exibindo {first} a {last} de {totalRecords} voto(s)"
                tableStyle="min-width: 60rem">

                <template #header>
                    <div class="flex flex-wrap align-ratings-center justify-content-between gap-3 p-2">

                        <div class="flex align-ratings-center gap-3">
                            <span class="text-xl font-bold">Votos</span>
                            <Button label="Novo" icon="pi pi-plus" size="small" @click="newRating" />
                        </div>

                        <IconField iconPosition="left">
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Procurar..." />
                        </IconField>

                    </div>
                </template>

                <Column header="Operador">
                    <template #body="{ data: vote }">
                        <span>{{ vote.target.codename }}</span>
                    </template>
                </Column>
                <Column v-for="col in SKILL_ATTRIBUTES" :key="col.field" :field="col.field" :header="col.header">
                    <template #body="{ data: vote }">
                        <Rating v-model="vote[col.field]" readonly />
                    </template>
                </Column>

                <Column header="Ações" style="width: 10%; min-width: 8rem" bodyStyle="text-align: center">
                    <template #body="{ data: rating }">
                        <div class="flex gap-2 justify-content-center">
                            <Button icon="pi pi-pencil" text rounded severity="secondary" v-tooltip.top="'Editar'"
                                @click="editRating(rating)" />
                            <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip.top="'Excluir'"
                                @click="confirmDelete(rating)" />
                        </div>
                    </template>
                </Column>

                <template #loading>Carregando...</template>
                <template #empty>Nenhum voto encontrado.</template>
            </DataTable>
        </div>

        <Dialog v-model:visible="ratingDialog" :style="{ width: '512px' }" header="Detalhes do Voto" :modal="true">
            <Form ref="form" :resolver="resolver" :initialValues="selectedRating" @submit="saveRating" class="grid"
                :key="selectedRating.$id || 'new'">
                <div class="col-12">
                    <FormField name="target" v-slot="$field" class="flex flex-column gap-1">
                        <FloatLabel variant="in">
                            <Select id="target" v-model="$field.value" :options="availableOperators"
                                optionLabel="codename" optionValue="$id" class="w-full"
                                :class="{ 'p-invalid': $field.invalid }" fluid>
                                <template #option="slotProps">
                                    <div class="flex align-items-center gap-2">
                                        <Avatar icon="pi pi-user" :image="slotProps.option.avatar" shape="circle"
                                            size="small" />
                                        <span>{{ slotProps.option.codename }}</span>
                                    </div>
                                </template>

                                <template #value="slotProps">
                                    <div v-if="slotProps.value" class="flex align-items-center gap-2">
                                        <Avatar icon="pi pi-user"
                                            :image="availableOperators.find(op => op.$id === slotProps.value)?.avatar"
                                            shape="circle" size="small" />
                                        <span>{{availableOperators.find(op => op.$id ===
                                            slotProps.value)?.codename
                                        }}</span>
                                    </div>
                                </template>
                            </Select>
                            <label for="target">Operador</label>
                        </FloatLabel>
                        <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>
                </div>
                <div v-for="field in formFields" :key="field.name" :class="`col-${field.col}`">
                    <FormField :name="field.name" v-slot="$field" class="flex flex-column gap-1">
                        <label :for="field.name" class="font-bold">{{ field.label }}</label>
                        <component :is="field.component" :id="field.name" v-bind="field.props" v-model="$field.value"
                            class="w-full" :class="{ 'p-invalid': $field.invalid }" fluid />

                        <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>
                </div>

                <div class="col-12">
                    <Button type="submit" label="Votar" icon="pi pi-save" class="w-full shadow-6" severity="success" />
                </div>
            </Form>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue/usetoast";
import { FilterMatchMode } from '@primevue/core/api';
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import Column from "primevue/column";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import DataTable from "primevue/datatable";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Message from "primevue/message";
import { Form } from '@primevue/forms';
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { SKILL_ATTRIBUTES } from "@/constants/airsoft";
import { Rating, useConfirm } from "primevue";
import { RatingService, type IRating } from "@/services/rating";
import { OperatorService, type IOperator } from "@/services/operator";
import { useAuthStore } from "@/stores/auth";
import { sl } from "zod/locales";

const { operator } = useAuthStore();

onMounted(() => {
    loadServices();
});

const loadServices = async () => {
    loading.value = true;

    try {
        const [ratingsData, operatorsData] = await Promise.all([
            RatingService.getRatingsForVoter(operator.$id),
            OperatorService.list()
        ]);

        ratings.value = ratingsData.map(vote => {
            try {
                const parsedAttributes = vote.attributes ? JSON.parse(vote.attributes) : {};

                return {
                    ...vote,
                    ...parsedAttributes
                };
            } catch (e) {
                console.error("Erro ao processar atributos do voto:", vote.$id);
                return vote;
            }
        });

        const votedOperatorIds = ratings.value.map((vote) => vote.target.$id);

        operators.value = operatorsData.filter((op) => {
            const isMe = op.$id === operator.$id;
            const alreadyVoted = votedOperatorIds.includes(op.$id);
            return !isMe && !alreadyVoted;
        });

    } catch (error) {
        console.error("Erro ao carregar serviços:", error);
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados.' });
    } finally {
        loading.value = false;
    }
};

const loading = ref(true);
const ratings = ref<IRating<IOperator, IOperator>[]>([]);
const operators = ref<IOperator[]>([]);

const toast = useToast();
const confirm = useConfirm();

const ratingDialog = ref(false);
const selectedRating = ref({} as IRating);

const filters = ref({
    'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const ratingSchema = z.number({
    error: "Escolha quantas estrelas deseja votar"
})
    .min(1, "Mínimo 1")
    .max(5, "Máximo 5");

const voteSchema = z.object({
    target: z.string({ error: "Selecione um operador" }),
    ...Object.fromEntries(
        SKILL_ATTRIBUTES.map(({ field }) => [field, ratingSchema])
    )
});

const resolver = ref(zodResolver(voteSchema));

const availableOperators = computed(() => {
    if (selectedRating.value.$id) {
        return [selectedRating.value.selected] as IOperator[];
    }

    return operators.value;
});

const saveRating = async ({ valid, values }: any) => {
    if (!valid) return false;

    const { target, ...attributes } = values;

    try {
        const payload = {
            voter: operator.$id,
            target,
            attributes: JSON.stringify(attributes),
        };

        const response = await RatingService.upsert(selectedRating.value.$id, payload) as IRating;

        const formattedResponse = {
            ...response,
            ...attributes,
            target: operators.value.find(op => op.$id === target) || response.target
        };

        const index = ratings.value.findIndex((item: IRating) => item.$id === response.$id);

        if (index !== -1) {
            ratings.value[index] = formattedResponse;
        } else {
            ratings.value.push(formattedResponse);
            operators.value = operators.value.filter(op => op.$id !== target);
        }

        toast.add({
            severity: "success",
            summary: "Voto Confirmado",
            detail: "As habilidades do operador foram atualizadas.",
            life: 3000,
        });

        hideDialog();
    } catch (error: any) {
        console.error("Erro ao salvar:", error);
        toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar voto." });
    }
};

const formFields = computed(() => [
    ...SKILL_ATTRIBUTES.map(({ field: name, header: label }) => {
        return {
            name, label, component: Rating, col: '6', props: { stars: 5 }
        }
    })
]);

const confirmDelete = (rating: IRating) => {
    confirm.require({
        message: 'Você tem certeza que deseja excluir este ratingo?',
        header: "Voto",
        rejectProps: {
            label: 'Não',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Sim',
            severity: 'danger'
        },
        accept: async () => {
            try {
                await RatingService.delete(rating.$id);
                ratings.value = ratings.value.filter((item: IRating) => item.$id !== rating.$id);
                operators.value.push(rating.target as IOperator);

                toast.add({
                    severity: "success",
                    summary: "Sucesso",
                    detail: "Ratinge excluído com sucesso!",
                    life: 3000,
                });

            } catch (error: any) {
                console.error("Erro ao enviar formulário:", error);

                toast.add({
                    severity: "error",
                    summary: "Erro",
                    detail: error.message || "Falha ao salvar os dados. Tente novamente.",
                    life: 4000,
                });
            }
        },
    });
};

const newRating = async () => {
    selectedRating.value = {} as IRating;
    ratingDialog.value = true;
};

const editRating = async (rating: IRating<IOperator, IOperator>) => {
    selectedRating.value = { ...rating, target: rating.target.$id, selected: rating.target };
    ratingDialog.value = true;
};

const hideDialog = () => {
    ratingDialog.value = false;
};

</script>