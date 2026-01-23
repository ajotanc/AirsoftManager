<template>
    <div class="card">
        <AppTable title="Voto(s)" :value="ratings" :fields="fields" :loading="loading" icon="ri-bookmark-3-line">
            <template #header-actions>
                <Button label="Nova" icon="pi pi-plus" size="small" @click="newRating" />
            </template>
            <template #actions="{ data }">
                <Button icon="pi pi-pencil" text rounded severity="secondary" @click="editRating(data)" />
                <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(data)" /> </template>
        </AppTable>

        <Dialog v-model:visible="ratingDialog" header="Detalhes do Voto" :modal="true" :style="{ width: '100%', maxWidth: '640px' }"
            class="m-3">
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
                                        <Avatar :icon="!slotProps.option.avatar ? 'pi pi-user' : undefined"
                                            :image="slotProps.option.avatar" shape="circle" size="small" />
                                        <span>{{ slotProps.option.codename }}</span>
                                    </div>
                                </template>

                                <template #value="slotProps">
                                    <div v-if="slotProps.value" class="flex align-items-center gap-2">
                                        <Avatar
                                            :icon="!availableOperators.find(op => op.$id === slotProps.value)?.avatar ? 'pi pi-user' : undefined"
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
                <template v-for="{ name, label, component, col, hidden, props } in fields" :key="name">
                    <div :class="`col-${col}`" v-if="!hidden">
                        <FormField v-if="component.name === 'ColorPicker'" :name="name" v-slot="$field"
                            class="flex gap-1">
                            <div class="flex flex-column align-items-center gap-2">
                                <label class="font-bold" :for="name">{{ label }}</label>
                                <component :is="component" :id="name" v-bind="props" :name="name" v-model="$field.value"
                                    fluid />
                            </div>
                            <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                                {{ $field.error?.message }}
                            </Message>
                        </FormField>
                        <FormField v-else-if="component.name === 'ToggleSwitch'" :name="name" v-slot="$field"
                            class="flex gap-1">
                            <div class="flex align-items-center gap-2">
                                <component :is="component" :id="name" v-bind="props" :name="name" v-model="$field.value"
                                    fluid />
                                <label class="font-bold" :for="name">{{ label }}</label>
                            </div>
                            <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                                {{ $field.error?.message }}
                            </Message>
                        </FormField>
                        <FormField v-else-if="component.name === 'Rating'" :name="name" v-slot="$field"
                            class="flex flex-column gap-1">
                            <label :for="name" class="font-bold">{{ label }}</label>
                            <component :is="component" :id="name" v-bind="props" v-model="$field.value" class="w-full"
                                :class="{ 'p-invalid': $field.invalid }" fluid />

                            <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                                {{ $field.error?.message }}
                            </Message>
                        </FormField>
                        <FormField v-else :name="name" v-slot="$field" class="flex flex-column gap-1">
                            <FloatLabel variant="in">
                                <component :is="component" :id="name" v-bind="props" v-model="$field.value"
                                    class="w-full" :class="{ 'p-invalid': $field.invalid }" fluid />
                                <label :for="name">{{ label }}</label>
                            </FloatLabel>

                            <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                                {{ $field.error?.message }}
                            </Message>
                        </FormField>
                    </div>
                </template>

                <div class="col-12 pb-0">
                    <div class="flex justify-content-end gap-2">
                        <Button label="Cancelar" outlined @click="ratingDialog = false" />
                        <Button type="submit" label="Salvar" />
                    </div>
                </div>
            </Form>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
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
import { type IFields } from "@/functions/utils";

const { operator } = useAuthStore();

onMounted(() => {
    loadServices();
});

const loadServices = async () => {
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

const fields = computed<IFields[]>(() => [
    { name: "target.codename", label: "Operador", component: InputText, hidden: true },
    ...SKILL_ATTRIBUTES.map(({ field: name, header: label }) => {
        return {
            name, label, component: Rating, isRating: true, col: '6', props: { stars: 5 }
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