<template>
    <div class="card">
        <div class="surface-card shadow-2 border-round overflow-hidden">

            <DataTable :value="events" paginator :rows="5" stripedRows :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Exibindo {first} a {last} de {totalRecords} evento(s)"
                tableStyle="min-width: 60rem">

                <template #header>
                    <div class="flex flex-wrap align-events-center justify-content-between gap-3 p-2">

                        <div class="flex align-events-center gap-3">
                            <span class="text-xl font-bold">Loadout</span>
                            <Button label="Novo" icon="pi pi-plus" size="small" @click="newEvent" />
                        </div>

                        <IconField iconPosition="left">
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Procurar..." />
                        </IconField>

                    </div>
                </template>

                <Column v-for="col in EVENTS_COLUMNS" :key="col.field" :field="col.field" :header="col.header">
                    <template #body="{ data: weapon }">
                        <Tag v-if="col.isTag" :value="col.map[weapon[col.field] as keyof typeof col.map]"
                            :severity="col.severity" />
                        <span v-else-if="col.isDate">
                            {{
                                weapon[col.field]
                                    ? new Date(weapon[col.field]).toLocaleDateString("pt-BR")
                                    : "-"
                            }}
                        </span>
                        <span v-else>
                            {{ weapon[col.field] }}
                        </span>
                    </template>
                </Column>

                <Column header="Ações" style="width: 10%; min-width: 8rem" bodyStyle="text-align: center">
                    <template #body="{ data: event }">
                        <div class="flex gap-2 justify-content-center">
                            <Button asChild v-slot="slotProps" rounded class="p-button p-button-primary">
                                <RouterLink :to="`/events/${event.$id}`" rounded class="no-underline"
                                    :class="slotProps.class" v-tooltip.top="'Detalhes'">
                                    <i class="pi pi-link"></i>
                                </RouterLink>
                            </Button>
                            <Button icon="pi pi-pencil" text rounded severity="info" v-tooltip.top="'Editar'"
                                @click="editEvent(event)" />
                            <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip.top="'Excluir'"
                                @click="confirmDelete(event)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="eventDialog" :style="{ width: '512px' }" header="Detalhes do Evento" :modal="true">
            <Form ref="form" :resolver="resolver" :initialValues="selectedEvent" @submit="saveEvent"
                :key="selectedEvent.$id || 'new'" class="grid">
                <div class=" grid">
                    <div v-for="field in formFields" :key="field.name" :class="`col-${field.col}`">
                        <FormField :name="field.name" v-slot="$field" class="flex flex-column gap-1">
                            <FloatLabel variant="in">
                                <component :is="field.component" :id="field.name" v-bind="field.props"
                                    v-model="$field.value" class="w-full" :class="{ 'p-invalid': $field.invalid }"
                                    fluid />
                                <label :for="field.name">{{ field.label }}</label>
                            </FloatLabel>

                            <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                                {{ $field.error?.message }}
                            </Message>
                        </FormField>
                    </div>

                    <div class="col-12">
                        <FormField name="thumbnail" v-slot="$field" class="flex flex-column gap-1">
                            <FileUpload mode="basic" @select="onFileSelect" accept="image/*" class="w-full"
                                :class="{ 'p-invalid': $field.invalid }" label="Escolher Imagem" fluid />

                            <Image v-if="selectedEvent.thumbnail" :src="selectedEvent.thumbnail"
                                :alt="selectedEvent.title" width="150" preview />

                            <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                                {{ $field.error?.message }}
                            </Message>
                        </FormField>
                    </div>

                    <div class="col-12">
                        <Button type="submit" label="Publicar Missão Tática" icon="pi pi-save" class="w-full shadow-6"
                            severity="success" />
                    </div>
                </div>
            </Form>
        </Dialog>
    </div>
</template>

<style scoped>
.inventory::after {
    content: '';
    width: 100%;
    height: 100%;
    position: absolute;
    background: url("../../assets/background.webp") center center / cover no-repeat;
    mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
    z-index: -1;
    opacity: 0.2;
    top: 0;
    left: 0
}
</style>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { FilterMatchMode } from '@primevue/core/api';
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import DataTable from "primevue/datatable";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import DatePicker from "primevue/datepicker";
import InputMask from "primevue/inputmask";
import FileUpload from "primevue/fileupload";
import Message from "primevue/message";
import { Form } from '@primevue/forms';
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { formatDateToLocal } from "@/functions/utils";
import { EVENTS_COLUMNS, EVENT_TYPES } from "@/constants/airsoft";
import { Textarea, useConfirm, type FileUploadSelectEvent } from "primevue";
import { EventService, type IEvent } from "@/services/event";

onMounted(() => {
    loadEvents();
});

const loadEvents = () => {
    EventService.list().then((data) => {
        events.value = data;
        loading.value = false;
    });
};

const loading = ref(true);
const events = ref<IEvent[]>([]);

const form = ref();

const toast = useToast();
const confirm = useConfirm();

const eventDialog = ref(false);
const selectedEvent = ref({} as IEvent);

const filters = ref({
    'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
];

// 1. Schema do Zod (Missão Tática)
const missionSchema = z.object({
    title: z.string({ error: "Campo obrigatório" }).min(5, { error: "Título muito curto" }),
    description: z.string({ error: "Campo obrigatório" }).min(10, { error: "Briefing insuficiente" }),
    location: z.string({ error: "Campo obrigatório" }).min(3, { error: "Local obrigatório" }),
    type: z.string({ error: "Selecione o tipo" }).transform((type) => Number.parseInt(type)),
    date: z.custom().refine((date) => date instanceof Date || typeof date === 'string', "Data obrigatória").transform((date
    ) => formatDateToLocal(date as Date)),
    startTime: z.string({ error: "Início obrigatório" }),
    endTime: z.string({ error: "Término obrigatório" }),
    location_url: z.url({ error: "Insira uma URL válida" }).refine((val) => {
        return val.includes('maps/place') || val.includes('goo.gl/maps');
    }, {
        message: "A URL deve ser um link válido do Google Maps"
    }),
    thumbnail: z.any()
        .optional()
        .refine((file) => {
            if (!file || !(file instanceof File)) return true;
            return ACCEPTED_IMAGE_TYPES.includes(file.type);
        }, {
            message: "São aceitos arquivos JPEG, JPG, PNG e WEBP.",
        })
        .refine((file) => {
            if (!file || !(file instanceof File)) return true;
            return file.size <= MAX_FILE_SIZE;
        }, {
            message: "O tamanho da imagem deve ser menor que 5MB.",
        }),
});

const resolver = ref(zodResolver(missionSchema));

const saveEvent = async ({ valid, values }: any) => {
    if (!valid) return false;

    try {
        const response = await EventService.upsert(selectedEvent.value.$id, values, values.thumbnail) as IEvent;

        const index = events.value.findIndex((item: IEvent) => item.$id === response.$id);

        if (index !== -1) {
            events.value[index] = response;
        } else {
            events.value.push(response);
        }

        toast.add({
            severity: "success",
            summary: "Sucesso",
            detail: "Evento salvo com sucesso!",
            life: 3000,
        });
    } catch (error: any) {
        console.error("Erro ao salvar:", error);
        toast.add({
            severity: "error",
            summary: "Erro",
            detail: error.message || "Falha ao salvar.",
            life: 4000,
        });
    } finally {
        hideDialog();
    }
};

const formFields = [
    { name: 'title', label: 'Nome da Missão', component: InputText, col: '12' },
    {
        name: 'description', label: 'Briefing', component: Textarea, col: '12', props: {
            rows: 5,
            cols: 30,
            style: "resize: none"
        }
    },
    {
        name: 'date', label: 'Data da Missão', component: DatePicker, col: '12', props: {
            showIcon: true, dateFormat: 'dd/mm/yy', showButtonBar: true,
            iconDisplay: "input", manualInput: false, showOnFocus: true
        }
    },
    { name: 'startTime', label: 'Início', component: InputMask, col: '6', props: { mask: '99:99' } },
    { name: 'endTime', label: 'Término', component: InputMask, col: '6', props: { mask: '99:99' } },
    {
        name: 'type', label: 'Tipo de Missão', component: Select, col: '12',
        props: { options: Object.entries(EVENT_TYPES).map(([value, label]) => ({ label, value })), optionLabel: 'label', optionValue: 'value' }
    },
    { name: 'location', label: 'Nome do Local', component: InputText, col: '12' },
    { name: 'location_url', label: 'URL Google Maps', component: InputText, col: '12' },
];


const onFileSelect = (event: FileUploadSelectEvent) => {
    const file = event.files[0];

    selectedEvent.value.thumbnail = file;

    if (form.value) {
        form.value.setFieldValue("thumbnail", file);
    }
};

const confirmDelete = (event: IEvent) => {
    confirm.require({
        message: 'Você tem certeza que deseja excluir este evento?',
        header: event.title,
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
                await EventService.delete(event.$id, event.thumbnail);
                events.value = events.value.filter((item: IEvent) => item.$id !== event.$id);

                toast.add({
                    severity: "success",
                    summary: "Sucesso",
                    detail: "Evente excluído com sucesso!",
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

const newEvent = async () => {
    selectedEvent.value = {} as IEvent;
    eventDialog.value = true;
};

const editEvent = async (event: IEvent) => {
    selectedEvent.value = {
        ...event,
        date: event.date ? new Date(event.date).toLocaleDateString("pt-BR") : null,
        type: event.type.toString()
    };

    eventDialog.value = true;
};

const hideDialog = () => {
    eventDialog.value = false;
};

</script>