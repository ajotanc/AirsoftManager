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

        <Column v-for="col in ARSENAL_COLUMNS" :key="col.field" :field="col.field" :header="col.header">
          <template #body="{ data: weapon }">
            <div v-if="col.field === 'name' && weapon.is_favorite" class="flex align-items-center gap-2">
              <span>{{ weapon[col.field] }}</span>
              <i class="pi pi-star-fill text-yellow-500 text-sm" v-tooltip.top="'Arma Favorito'"></i>
            </div>
            <Tag v-else-if="col.isTag" :value="col.map[weapon[col.field] as keyof typeof col.map]"
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
      <Form v-slot="$form" :resolver="resolver" :initialValues="selectedWeapon" class="flex flex-column gap-3"
        @submit="saveWeapon">
        <div class="grid formgrid">
          <div class="field col-12">
            <FloatLabel variant="in">
              <InputText name="name" class="w-full" fluid />
              <label>Nome</label>
            </FloatLabel>
            <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">{{
              $form.name.error.message }}</Message>
          </div>
          <div class="field col-12">
            <FloatLabel variant="in">
              <Select :options="WEAPON_TYPES_OPTIONS" optionLabel="name" optionValue="code" name="type" class="w-full"
                fluid />
              <label>Tipo</label>
            </FloatLabel>
            <Message v-if="$form.type?.invalid" severity="error" size="small" variant="simple">{{
              $form.type.error.message }}</Message>
          </div>
          <div class="field col-12">
            <FloatLabel variant="in">
              <Select :options="CATEGORIES_OPTIONS" optionLabel="name" optionValue="code" name="category" class="w-full"
                fluid />
              <label>Categoria</label>
            </FloatLabel>
            <Message v-if="$form.category?.invalid" severity="error" size="small" variant="simple">{{
              $form.category.error.message }}</Message>
          </div>
          <div class="field col-6">
            <FloatLabel variant="in">
              <InputMask name="joule" mask="9.99" class="w-full" inputmode="numeric" fluid />
              <label>Joule</label>
            </FloatLabel>
            <Message v-if="$form.joule?.invalid" severity="error" size="small" variant="simple">{{
              $form.joule.error.message }}</Message>
          </div>
          <div class="field col-6">
            <FloatLabel variant="in">
              <InputNumber name="fps" class="w-full" inputmode="numeric" fluid />
              <label>FPS</label>
            </FloatLabel>
            <Message v-if="$form.fps?.invalid" severity="error" size="small" variant="simple">{{
              $form.fps.error.message }}</Message>
          </div>
          <div class="field col-12">
            <FloatLabel variant="in">
              <DatePicker name="maintained_at" class="w-full" dateFormat="dd/mm/yy" showIcon showButtonBar
                iconDisplay="input" :showOnFocus="true" :manualInput="false" fluid />
              <label>Última Manutenção</label>
            </FloatLabel>
            <Message v-if="$form.maintained_at?.invalid" severity="error" size="small" variant="simple">{{
              $form.maintained_at.error.message }}</Message>
          </div>
          <div class="field col-12">
            <div class="flex gap-2">
              <ToggleSwitch name="is_favorite" fluid />
              <label>Arma Favorita</label>
            </div>
          </div>
          <div class="field col-12" v-if="selectedWeapon.$id && !selectedWeapon.invoice">
            <FileUpload mode="advanced" accept="application/pdf" :maxFileSize="MAX_SIZE" @select="onSelectedFiles">
              <template #header="{ chooseCallback, clearCallback, files }">
                <div class="flex flex-wrap justify-between items-center flex-1 gap-4">
                  <div class="flex gap-2">
                    <Button @click="chooseCallback" icon="pi pi-file-pdf" rounded variant="outlined"
                      severity="secondary" :disabled="files.length === 1" v-tooltip.top="'Anexar Nota Fiscal'"></Button>
                    <Button @click="uploadInvoice" icon="pi pi-cloud-upload" rounded variant="outlined"
                      severity="success" :disabled="files.length === 0" :loading="uploading"
                      v-tooltip.top="'Upload'"></Button>
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
        </div>
        <div class="flex justify-content-end gap-2">
          <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
          <Button type="submit" label="Salvar" icon="pi pi-check" />
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
import { ref, nextTick, type PropType } from "vue";
import QrcodeVue from 'qrcode.vue';
import { toPng } from 'html-to-image';
import { useToast } from "primevue/usetoast";
import { FilterMatchMode } from '@primevue/core/api';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { z } from "zod";

import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import DataTable from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import InputNumber from "primevue/inputnumber";
import FileUpload, { type FileUploadSelectEvent } from "primevue/fileupload";

import { ARSENAL_COLUMNS, WEAPON_TYPES_OPTIONS, CATEGORIES_OPTIONS } from "@/constants/airsoft";
import { ArsenalService, type Arsenal } from "@/services/arsenal";
import { formatDateToLocal } from "@/functions/utils";
import { useConfirm } from "primevue";

const invoice = ref();

const items = defineModel('items', {
  type: Array as PropType<Arsenal[]>,
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

const confirmDelete = (weapon: Arsenal) => {
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
        items.value = items.value.filter((item: Arsenal) => item.$id !== weapon.$id);

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

const resolver = zodResolver(
  z.object({
    name: z.string("Nome é obrigatório!").min(2, "O nome precisa ter ao menos 2 caractere!"),
    type: z.number({ error: "Selecione o tipo" }),
    category: z.number({ error: "Selecione a categoria" }),
    joule: z.coerce.number({ error: "Informe o Joule" }).gt(0, { error: "Joule deve ser maior que 0.00" }).transform((value) => value && value.toString()),
    fps: z.number({ error: "Informe o FPS" }).max(550, { error: "FPS deve ser menor ou igual a 550" }).gt(0, { error: "FPS deve ser maior que 0" }),
    maintained_at: z.coerce
      .date({ error: "Data de nascimento obrigatória" })
      .nullable()
      .optional()
      .transform((date) => date && formatDateToLocal(date)),
    is_favorite: z.boolean().nullable().optional(),
  })
);

const weaponDialog = ref(false);
const qrDialog = ref(false);

const selectedWeapon = ref({} as Arsenal);
const label = ref(null);

const downloading = ref(false);
const uploading = ref(false);

const filters = ref({
  'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const generateUrl = (weaponId: string) => {
  return `${window.location.origin}/verify/weapon/${weaponId}`;
};

const openQrDialog = (weapon: Arsenal) => {
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
  selectedWeapon.value = {} as Arsenal;
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
          await ArsenalService.upsert(currentFavorite.$id, { ...{ is_favorite: false } as Arsenal });

          currentFavorite.is_favorite = false;
        }
      }

      const response = await ArsenalService.upsert(selectedWeapon.value.$id, { ...values, operator: props.owner }) as unknown as Arsenal;

      const index = items.value.findIndex((item: Arsenal) => item.$id === response.$id);

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

const editWeapon = (weapon: Arsenal) => {
  console.log(weapon);
  const data = { ...weapon, maintained_at: weapon.maintained_at ? new Date(weapon.maintained_at) : null };
  selectedWeapon.value = data;
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
    ) as unknown as Arsenal;

    const index = items.value.findIndex((item: Arsenal) => item.$id === response.$id);
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