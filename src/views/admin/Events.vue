<template>
    <div class="card">
        <div class="surface-card shadow-2 border-round overflow-hidden">

            <DataTable :value="dtValue" paginator :rows="5" stripedRows :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Exibindo {first} a {last} de {totalRecords} evento(s)"
                tableStyle="min-width: 60rem;">

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

                <Column v-for="column in fields" :key="column.name" :header="column.label" :hidden="column.hidden"
                    :style="{ width: column.width || '50%' }">
                    <template #body="{ data }">
                        <ColumnContent :column="column" :data="data" :loading="loading" />
                    </template>
                </Column>

                <Column header="Ações" style="width: 10%; min-width: 8rem" bodyStyle="text-align: center">
                    <template #body="{ data: event }">
                        <Skeleton v-if="loading" width="100%" height="1rem" />
                        <div v-else class="flex gap-2 justify-content-center">
                            <ButtonShare :event="event" icon="pi pi-copy" text rounded severity="warn"
                                v-tooltip.top="'Copiar Conteúdo'" />
                            <ButtonShare :event="event" icon="pi pi-share-alt" text rounded severity="help"
                                v-tooltip.top="'Compartilhar'" />
                            <Button icon="pi pi-link" @click="goToEvent(event.$id)" text rounded
                                v-tooltip.top="'Detalhes'">
                            </Button>
                            <Button icon="pi pi-pencil" text rounded severity="info" v-tooltip.top="'Editar'"
                                @click="editEvent(event)" />
                            <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip.top="'Excluir'"
                                @click="confirmDelete(event)" />
                        </div>
                    </template>
                </Column>
                
                <template #empty>
                    <Empty label="Nenhum evento encontrado" icon="ri-calendar-event-line" />
                </template>
            </DataTable>
        </div>

        <Dialog v-model:visible="eventDialog" :style="{ width: '512px' }" header="Detalhes do Evento" :modal="true">
            <Form ref="form" :resolver="resolver" :initialValues="selectedEvent" @submit="saveEvent"
                :key="selectedEvent.$id || 'new'" class="grid">
                <div v-for="field in fields" :key="field.name" :class="`col-${field.col}`">
                    <FormField v-if="field.name === 'description'" :name="field.name" v-slot="$field"
                        class="flex flex-column gap-1">
                        <label class="font-bold">{{ field.label }}</label>
                        <Editor v-model="$field.value" editorStyle="height: 260px"
                            placeholder="Escreva os detalhes da operação aqui..." />
                        <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>
                    <FormField v-else :name="field.name" v-slot="$field" class="flex flex-column gap-1">
                        <FloatLabel variant="in">
                            <component :is="field.component" :id="field.name" v-bind="field.props"
                                v-model="$field.value" class="w-full" :class="{ 'p-invalid': $field.invalid }" fluid />
                            <label :for="field.name">{{ field.label }}</label>
                        </FloatLabel>

                        <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>
                </div>
                <div class="col-12">
                    <FormField name="thumbnail" v-slot="$field" class="flex flex-column gap-1">
                        <Image :src="(src as string) || (selectedEvent.thumbnail as string)" alt="Thumbnail do Evento"
                            imageClass="w-full h-full object-cover mb-2" preview />
                        <FileUpload mode="basic" @select="onFileSelect" accept="image/*" class="w-full"
                            :class="{ 'p-invalid': $field.invalid }" label="Escolher Imagem" fluid />
                        <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>
                </div>
                <div class="col-12">
                    <Button type="submit" label="Publicar Missão Tática" icon="pi pi-save" class="w-full shadow-6"
                        severity="success" />
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
import DatePicker from "primevue/datepicker";
import InputMask from "primevue/inputmask";
import FileUpload from "primevue/fileupload";
import Message from "primevue/message";
import { Form } from '@primevue/forms';
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { InputNumber, useConfirm, type FileUploadSelectEvent } from "primevue";
import { EventService, type IEvent } from "@/services/event";
import { formatDate, goToEvent, type IFields } from "@/functions/utils";
import { EVENT_TYPES, RULES } from "@/constants/airsoft";
import Editor from "primevue/editor";
import ButtonShare from "@/components/ButtonShare.vue";

onMounted(() => {
    loadServices();
});

const loadServices = async () => {
    try {
        events.value = await EventService.list();
    } catch (error) {
        console.error("Erro ao carregar serviços:", error);
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados.' });
    } finally {
        loading.value = false;
    }
};

const dtValue = computed(() => {
    return loading.value ? new Array(5).fill({}) : events.value;
});

const loading = ref(true);
const events = ref<IEvent[]>([]);

const form = ref();

const toast = useToast();
const confirm = useConfirm();

const eventDialog = ref(false);
const selectedEvent = ref({} as IEvent);

const src = ref<string | ArrayBuffer | null>(null);

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
    date: z.custom().refine((date) => date instanceof Date || typeof date === 'string', "Data obrigatória").transform((date) => date && formatDate(date).toISOString()),
    startTime: z.string({ error: "Início obrigatório" }),
    endTime: z.string({ error: "Término obrigatório" }),
    rule: z.string().nullish(),
    minimum_effective: z.number({ error: "Efetivo mínimo obrigatório" }),
    location_url: z.url({ error: "Insira uma URL válida" }).refine((val) => {
        return val.includes('maps.app.goo.gl');
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
        const payload = {
            ...values,
            location_coords: selectedEvent.value.location_coords
        }

        const response = await EventService.upsert(selectedEvent.value.$id, payload, values.thumbnail) as IEvent;

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

const fields: IFields[] = [
    { name: 'title', label: 'Nome da Missão', component: InputText, col: '12', width: '25%' },
    {
        name: 'description', label: 'Briefing da Missão', component: Editor, col: '12', props: {
            rows: 5,
            cols: 30,
            style: "resize: none",
            editorStyle: "height: 12.5rem"
        },
        isHtml: true
    },
    {
        name: 'date',
        label: 'Data da Missão',
        component: DatePicker,
        col: '12',
        props: {
            showIcon: true,
            dateFormat: 'dd/mm/yy',
            showButtonBar: true,
            iconDisplay: "input", showOnFocus: true
        },
    },
    { name: 'startTime', label: 'Início', component: InputMask, col: '4', props: { mask: '99:99' } },
    { name: 'endTime', label: 'Término', component: InputMask, col: '4', props: { mask: '99:99' } },
    { name: 'minimum_effective', label: 'Efetivo Mínimo', component: InputNumber, col: '4' },
    {
        name: 'type', label: 'Tipo de Missão', component: Select, col: '6', isTag: true,
        props: { options: Object.entries(EVENT_TYPES).map(([value, label]) => ({ label, value })), optionLabel: 'label', optionValue: 'value' }
    },
    {
        name: 'rule', label: 'Tipo de Regra', component: Select, col: '6', isTag: true,
        props: { options: RULES }
    },
    { name: 'location', label: 'Nome do Local', component: InputText, col: '12' },
    { name: 'location_url', label: 'URL Google Maps', component: InputText, col: '12', hidden: true },
];


const onFileSelect = (event: FileUploadSelectEvent) => {
    const file = event.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        src.value = reader.result;
    };

    reader.readAsDataURL(file);

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