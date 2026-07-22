<template>
  <div class="card">
    <AppTable title="Configurações do Sistema" :value="settingsList" :fields="settingFields" :loading="loading" icon="ri-settings-4-line">
      <template #header-actions>
        <Button label="Nova Configuração" icon="pi pi-plus" size="small" @click="newSetting" />
      </template>

      <template #actions="{ data }">
        <Skeleton v-if="loading" width="100%" height="1rem" />
        <div v-else class="flex gap-2 justify-content-center">
          <Button icon="pi pi-pencil" text rounded severity="secondary" v-tooltip.top="'Editar'" @click="editSetting(data)" />
          <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip.top="'Excluir'" @click="confirmDelete(data)" />
        </div>
      </template>
    </AppTable>

    <AppFormDialog v-model:visible="settingDialog" :initialValues="selectedSetting" :resolver="resolver"
      :fields="settingFields" header="Configuração" @submit="saveSetting" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Skeleton from "primevue/skeleton";
import { useConfirm } from "primevue/useconfirm";
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { SettingsService, type ISetting } from "@/services/settings";
import { useSettingsStore } from "@/stores/settings";
import { type IFields } from "@/functions/utils";
import AppTable from "@/components/AppTable.vue";
import AppFormDialog from "@/components/AppFormDialog.vue";

const settingsStore = useSettingsStore();
const toast = useToast();
const confirm = useConfirm();

const loading = ref(true);
const settingDialog = ref(false);
const settingsList = ref<ISetting[]>([]);
const selectedSetting = ref<ISetting>({} as ISetting);

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  try {
    settingsList.value = await SettingsService.list();
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao carregar configurações.", life: 3000 });
  } finally {
    loading.value = false;
  }
};

const settingFields = computed<IFields[]>(() => [
  { name: "key", label: "Chave (Key)", component: InputText, col: "6" },
  { name: "value", label: "Valor (Value)", component: InputText, col: "6" },
  { name: "description", label: "Descrição", component: Textarea, col: "12", props: { rows: 2, autoResize: true } },
  { name: "args", label: "Argumentos (Opcional)", component: InputText, col: "12" },
]);

const settingSchema = z.object({
  key: z.string({ error: "Chave obrigatória" }).min(1, "Chave obrigatória"),
  value: z.string({ error: "Valor obrigatório" }),
  description: z.string().nullish().optional(),
  args: z.string().nullish().optional(),
});

const resolver = ref(zodResolver(settingSchema));

const newSetting = () => {
  selectedSetting.value = {} as ISetting;
  settingDialog.value = true;
};

const editSetting = (setting: ISetting) => {
  selectedSetting.value = { ...setting };
  settingDialog.value = true;
};

const saveSetting = async (values: ISetting) => {
  try {
    const payload = {
      key: values.key,
      value: values.value,
      description: values.description || "",
      args: values.args || ""
    };

    const response = await SettingsService.upsert(selectedSetting.value.$id, payload);
    const index = settingsList.value.findIndex((item) => item.$id === response.$id);

    if (index !== -1) {
      settingsList.value[index] = response;
    } else {
      settingsList.value.push(response);
    }

    await settingsStore.refresh();

    toast.add({
      severity: "success",
      summary: "Sucesso!",
      detail: "Configuração salva com sucesso.",
      life: 3000,
    });
  } catch (error) {
    console.error("Erro ao salvar:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao salvar configuração.", life: 3000 });
  } finally {
    settingDialog.value = false;
  }
};

const confirmDelete = (setting: ISetting) => {
  confirm.require({
    message: `Tem certeza que deseja excluir a chave "${setting.key}"?`,
    header: "Confirmar Exclusão",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: 'Não',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Sim, excluir',
      severity: 'danger'
    },
    accept: async () => {
      try {
        const success = await SettingsService.delete(setting.$id);
        if (success) {
          settingsList.value = settingsList.value.filter(s => s.$id !== setting.$id);
          await settingsStore.refresh();
          toast.add({ severity: "success", summary: "Excluído", detail: "Configuração excluída com sucesso.", life: 3000 });
        } else {
          throw new Error("Falha na exclusão");
        }
      } catch (error) {
        toast.add({ severity: "error", summary: "Erro", detail: "Não foi possível excluir a configuração.", life: 3000 });
      }
    }
  });
};
</script>
