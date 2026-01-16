<template>
  <div class="card">
    <div class="surface-card shadow-2 border-round overflow-hidden">

      <DataTable :value="items" paginator :rows="5" stripedRows :filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Exibindo {first} a {last} de {totalRecords} arma(s)" tableStyle="min-width: 50rem">

        <template #header>
          <div class="flex flex-wrap align-items-center justify-content-between gap-3 p-2">

            <div class="flex align-items-center gap-3">
              <span class="text-xl font-bold">Arsenal</span>
              <Button v-if="editable" label="Novo" icon="pi pi-plus" size="small" @click="newWeapon" />
            </div>

            <IconField iconPosition="left">
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="filters['global'].value" placeholder="Procurar..." />
            </IconField>

          </div>
        </template>

        <Column v-for="column in fields" :key="column.name" :header="column.label">
          <template #body="{ data }">
            <ColumnContent :column="column" :data="data" :loading="false" />
          </template>
        </Column>

        <Column header="Ações" v-if="qrcode || editable" style="width: 10%; min-width: 8rem"
          bodyStyle="text-align: center">
          <template #body="{ data: weapon }">
            <div class="flex gap-2 justify-content-start align-items-center">
              <Button as="a" :href="weapon.invoice" target="_blank" rel="noopener" v-if="weapon.invoice"
                icon="pi pi-file-pdf" text rounded severity="secondary" v-tooltip.top="'Nota Fiscal'" download
                style="text-decoration: none;" />
              <Button v-if="qrcode" icon="pi pi-qrcode" text rounded severity="secondary" v-tooltip.top="'QRCode'"
                @click="openQrDialog(weapon)" />
              <Button icon="pi pi-pencil" text rounded severity="info" v-tooltip.top="'Editar'"
                @click="editWeapon(weapon)" />
              <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip.top="'Excluir'"
                @click="confirmDelete(weapon)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="weaponDialog" header="Detalhes do Arsenal" :style="{ width: '50vw' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
      <Form :resolver="resolver" :initialValues="selectedWeapon" @submit="saveWeapon" class="grid"
        :key="selectedWeapon.$id || 'new'">
        <div v-for="{ name, label, component, col, props } in fields" :key="name" :class="`col-${col}`">
          <FormField v-if="component.name === 'ToggleSwitch'" :name="name" v-slot="$field"
            class="flex flex-column gap-1">
            <div class="flex gap-2">
              <component :is="component" :id="name" v-bind="props" :name="name" v-model="$field.value" fluid />
              <label :for="name">{{ label }}</label>
            </div>
            <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>
          <FormField v-else :name="name" v-slot="$field" class="flex flex-column gap-1">
            <FloatLabel variant="in">
              <component :is="component" :id="name" v-bind="props" v-model="$field.value" class="w-full"
                :class="{ 'p-invalid': $field.invalid }" fluid />
              <label :for="name">{{ label }}</label>
            </FloatLabel>

            <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
              {{ $field.error?.message }}
            </Message>
          </FormField>
        </div>

        <div class="col-12" v-if="selectedWeapon.$id && !selectedWeapon.invoice">
          <FileUpload mode="advanced" accept="application/pdf" :maxFileSize="MAX_SIZE" @select="onSelectedFiles">
            <template #header="{ chooseCallback, clearCallback, files }">
              <div class="flex flex-wrap justify-between items-center flex-1 gap-4">
                <div class="flex gap-2">
                  <Button @click="chooseCallback" icon="pi pi-file-pdf" rounded variant="outlined" severity="secondary"
                    :disabled="files.length === 1" v-tooltip.top="'Anexar Nota Fiscal'"></Button>
                  <Button @click="uploadInvoice" icon="pi pi-save" rounded variant="outlined" severity="success"
                    :disabled="files.length === 0" :loading="uploading" v-tooltip.top="'Upload'"></Button>
                  <Button @click="clearCallback" icon="pi pi-times" rounded variant="outlined" severity="danger"
                    :disabled="files.length === 0" v-tooltip.top="'Limpar'"></Button>
                </div>
              </div>
            </template>
            <template #content="{ files, messages }">
              <div class="flex flex-column" v-if="files.length > 0">
                <Message v-for="message of messages" :key="message" severity="error">
                  {{ message }}
                </Message>

                <div class="flex flex-wrap">
                  <div v-for="(file) of files" :key="file.name + file.type + file.size"
                    class="flex justify-content-center align-items-center border border-surface items-center gap-2">
                    <i class="pi pi-file-pdf"></i>
                    <span class="font-semibold text-ellipsis max-w-60 whitespace-nowrap overflow-hidden">{{
                      file.name }}</span>
                  </div>
                </div>
              </div>
            </template>
            <template #empty>
              <span>Selecione a <strong>Nota Fiscal</strong> (Nf-e) da sua arma.</span>
            </template>
          </FileUpload>
        </div>

        <div class="col-12">
          <div class="flex justify-content-end gap-2">
            <Button label="Cancelar" outlined @click="hideDialog" />
            <Button type="submit" label="Salvar" />
          </div>
        </div>
      </Form>
    </Dialog>

    <Dialog v-model:visible="qrDialog" modal header="Etiqueta de Patrimônio" :style="{ width: '360px' }">
      <div class="flex flex-column align-items-center gap-4">
        <div ref="label" class="border-2 border-round p-3 text-center surface-0 shadow-2 bg-white">
          <div class="text-xs mb-2 text-gray-600 font-mono">
            {{ selectedWeapon.name }}
          </div>
          <QrcodeVue :value="generateUrl(selectedWeapon.$id)" :size="200" level="H" background="#ffffff"
            foreground="#000000" />
          <div class="text-xs mt-2 text-gray-600 font-mono">
            ID: {{ selectedWeapon.$id }}
          </div>
        </div>

        <div class="flex flex-column w-full gap-2">
          <Button label="Baixar Etiqueta" icon="pi pi-download" @click="downloadQrCode" severity="success"
            :loading="downloading" />
          <small class="text-center text-gray-500">Imprima e cole no equipamento.</small>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, type PropType, computed } from "vue";
import QrcodeVue from 'qrcode.vue';
import { toPng } from 'html-to-image';
import { useToast } from "primevue/usetoast";
import { FilterMatchMode, PrimeIcons } from '@primevue/core/api';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { z } from "zod";


import Column from "primevue/column";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import DataTable from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import InputNumber from "primevue/inputnumber";
import FileUpload, { type FileUploadSelectEvent } from "primevue/fileupload";

import { WEAPON_TYPES_OPTIONS, CATEGORIES_OPTIONS } from "@/constants/airsoft";
import { ArsenalService, type IArsenal } from "@/services/arsenal";
import { InputMask, ToggleSwitch, useConfirm } from "primevue";
import { formatDate, type IFields } from "@/functions/utils";
import ColumnContent from "../ColumnContent.vue";

const invoice = ref();

const items = defineModel('items', {
  type: Array as PropType<IArsenal[]>,
  default: () => []
});

const onSelectedFiles = (event: FileUploadSelectEvent) => {
  invoice.value = event.files;
};

const props = defineProps({
  owner: {
    required: false,
    type: String,
    default: '',
  },
  qrcode: {
    type: Boolean,
    default: false,
  },
  editable: {
    type: Boolean,
    default: false
  }
});

const toast = useToast();
const confirm = useConfirm();

const confirmDelete = (weapon: IArsenal) => {
  confirm.require({
    message: 'Você tem certeza que deseja excluir esta arma?',
    header: weapon.name,
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
        await ArsenalService.delete(weapon.$id);
        items.value = items.value.filter((item: IArsenal) => item.$id !== weapon.$id);

        toast.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Arma excluída com sucesso!",
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

const MAX_SIZE = 5 * 1024 * 1024;

const fields = computed<IFields[]>(() => [
  {
    name: "name", label: "Nome", component: InputText, col: '12',
  },
  {
    name: "type", label: "Tipo de Arma", component: Select, col: "6", props: {
      options: WEAPON_TYPES_OPTIONS, optionLabel: "label", optionValue: "value",
    },
    isTag: true
  },
  {
    name: "category", label: "Categoria", component: Select, col: "6", props: {
      options: CATEGORIES_OPTIONS, optionLabel: "label", optionValue: "value",
    },
    isTag: true
  },
  { name: "fps", label: "FPS", component: InputNumber, col: '6' },
  {
    name: "joule", label: "Joule", component: InputMask, col: '6', props: {
      mask: "9.99", inputmode: "numeric"
    }
  },
  {
    name: "maintained_at", label: "Última Manutenção", component: DatePicker, col: '6',
    props: {
      dateFormat: "dd/mm/yy", showIcon: true, showButtonBar: true, iconDisplay: "input", showOnFocus: true
    }
  },
  {
    name: "is_favorite", label: "Arma Favorita", component: ToggleSwitch, col: '12',
    isHtml: true,
    icon: PrimeIcons.STAR_FILL,
    iconColor: 'yellow',
  }
]);

const weaponSchema = z.object({
  name: z.string("Nome é obrigatório!").min(2, "O nome precisa ter ao menos 2 caractere!"),
  type: z.number({ error: "Selecione o tipo" }),
  category: z.number({ error: "Selecione a categoria" }),
  joule: z.coerce.number({ error: "Informe o Joule" }).gt(0, { error: "Joule deve ser maior que 0.00" }).transform((value) => value && value.toString()),
  fps: z.number({ error: "Informe o FPS" }).max(550, { error: "FPS deve ser menor ou igual a 550" }).gt(0, { error: "FPS deve ser maior que 0" }),
  maintained_at: z.custom().refine((date) => date instanceof Date || typeof date === 'string', "Data obrigatória").transform((date) => date && formatDate(date).toISOString()),
  is_favorite: z.boolean().nullish(),
});

const resolver = ref(zodResolver(weaponSchema));

const weaponDialog = ref(false);
const qrDialog = ref(false);

const selectedWeapon = ref({} as IArsenal);
const label = ref(null);

const downloading = ref(false);
const uploading = ref(false);

const filters = ref({
  'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const generateUrl = (weaponId: string) => {
  return `${window.location.origin}/verify/weapon/${weaponId}`;
};

const openQrDialog = (weapon: IArsenal) => {
  selectedWeapon.value = weapon;
  qrDialog.value = true;
};

const downloadQrCode = async () => {
  if (!label.value || !selectedWeapon.value) return;

  downloading.value = true;

  try {
    await nextTick();

    const dataUrl = await toPng(label.value, {
      quality: 1.0,
      skipFonts: true,
    });

    const link = document.createElement('a');
    link.download = `ETIQUETA_${selectedWeapon.value.$id}.png`;
    link.href = dataUrl;
    link.click();

  } catch (error) {
    console.error("Erro ao gerar etiqueta", error);
  } finally {
    downloading.value = false;
  }
};

const newWeapon = () => {
  selectedWeapon.value = {} as IArsenal;
  weaponDialog.value = true;
};

const hideDialog = () => {
  weaponDialog.value = false;
};

const saveWeapon = async ({ valid, values }: any) => {
  if (valid) {
    try {

      if (values.is_favorite) {
        const currentFavorite = items.value.find(
          (item) => item.is_favorite && item.$id !== selectedWeapon.value.$id
        );

        if (currentFavorite) {
          await ArsenalService.upsert(currentFavorite.$id, { ...{ is_favorite: false } as IArsenal });

          currentFavorite.is_favorite = false;
        }
      }

      const response = await ArsenalService.upsert(selectedWeapon.value.$id, { ...values, operator: props.owner }) as unknown as IArsenal;

      const index = items.value.findIndex((item: IArsenal) => item.$id === response.$id);

      if (index !== -1) {
        items.value[index] = response;
      } else {
        items.value.push(response);
      }

      toast.add({
        severity: "success",
        summary: "Sucesso",
        detail: "Arma salva com sucesso!",
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
    } finally {
      hideDialog();
    }
  };
}

const editWeapon = (weapon: IArsenal) => {
  selectedWeapon.value = {
    ...weapon,
    maintained_at: weapon.maintained_at ? new Date(weapon.maintained_at) : null
  };
  weaponDialog.value = true;
};


const uploadInvoice = async () => {
  if (invoice.value.length === 0) return;
  const file = invoice.value[0];

  try {
    uploading.value = true;

    const response = await ArsenalService.uploadInvoice(
      selectedWeapon.value.$id,
      file
    ) as unknown as IArsenal;

    const index = items.value.findIndex((item: IArsenal) => item.$id === response.$id);
    items.value[index] = response;

    toast.add({
      severity: "success",
      summary: "Sucesso",
      detail: "Nota fiscal enviada com sucesso!",
      life: 3000,
    });
  } catch (error) {
    console.error("Erro no processo de avatar:", error);
    toast.add({
      severity: "error",
      summary: "Erro",
      detail: "Falha ao processar nota fiscal.",
      life: 3000,
    });
  } finally {
    uploading.value = false;
    hideDialog();
  }
}
</script>