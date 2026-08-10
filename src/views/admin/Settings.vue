<template>
  <div class="card">
    <div class="surface-card p-4 shadow-2 border-round border-1 border-white-alpha-10 mb-4">
      <div class="flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div class="flex align-items-center gap-2">
          <i class="ri-settings-4-line text-primary text-2xl"></i>
          <h2 class="text-xl font-bold m-0 text-white">Configurações Gerais do Sistema</h2>
        </div>
        <Button label="Editar Configurações" icon="pi pi-pencil" size="small" severity="primary" @click="editSettings" />
      </div>

      <Skeleton v-if="loading" height="12rem" class="w-full" />

      <div v-else-if="settingsData" class="grid">
        <div class="col-12 md:col-6 lg:col-4">
          <div class="p-3 surface-ground border-round border-1 border-white-alpha-10 h-full">
            <span class="text-secondary text-sm block mb-1">Nome da Equipe</span>
            <span class="font-bold text-lg text-white">{{ settingsData.team_name || 'Não configurado' }}</span>
          </div>
        </div>

        <div class="col-12 md:col-6 lg:col-4">
          <div class="p-3 surface-ground border-round border-1 border-white-alpha-10 h-full">
            <span class="text-secondary text-sm block mb-1">Mensalidade</span>
            <span class="font-bold text-lg text-gold-500">R$ {{ settingsData.monthly_fee || '0,00' }}</span>
          </div>
        </div>

        <div class="col-12 md:col-6 lg:col-4">
          <div class="p-3 surface-ground border-round border-1 border-white-alpha-10 h-full">
            <span class="text-secondary text-sm block mb-1">Tolerância de Pagamento</span>
            <span class="font-bold text-lg text-white">{{ settingsData.max_pending_payments || 3 }} meses</span>
          </div>
        </div>

        <div class="col-12 md:col-6 lg:col-4">
          <div class="p-3 surface-ground border-round border-1 border-white-alpha-10 h-full">
            <span class="text-secondary text-sm block mb-1">Início das Inscrições</span>
            <span class="font-bold text-lg text-white">{{ settingsData.registration_start_date || 'N/A' }}</span>
          </div>
        </div>

        <div class="col-12 md:col-6">
          <div class="p-3 surface-ground border-round border-1 border-white-alpha-10 h-full">
            <span class="text-secondary text-sm block mb-1">Base Azul (A)</span>
            <span class="font-bold text-lg text-blue-400">{{ settingsData.blue_base || 'Base A' }}</span>
          </div>
        </div>

        <div class="col-12 md:col-6">
          <div class="p-3 surface-ground border-round border-1 border-white-alpha-10 h-full">
            <span class="text-secondary text-sm block mb-1">Base Amarela (B)</span>
            <span class="font-bold text-lg text-yellow-400">{{ settingsData.yellow_base || 'Base B' }}</span>
          </div>
        </div>

        <div class="col-12">
          <div class="p-3 surface-ground border-round border-1 border-white-alpha-10">
            <span class="text-secondary text-sm block mb-3 font-bold">Módulos & Recursos Ativos</span>
            <div class="flex flex-wrap gap-3">
              <Tag :value="settingsData.tactical_map ? 'Mapa Tático: ATIVO' : 'Mapa Tático: INATIVO'"
                   :severity="settingsData.tactical_map ? 'success' : 'danger'" />
              <Tag :value="settingsData.global_map ? 'Mapa Global: ATIVO' : 'Mapa Global: INATIVO'"
                   :severity="settingsData.global_map ? 'success' : 'danger'" />
              <Tag :value="settingsData.tournament_active ? 'Torneio: ATIVO' : 'Torneio: INATIVO'"
                   :severity="settingsData.tournament_active ? 'success' : 'warn'" />
              <Tag :value="settingsData.recruitment_open ? 'Recrutamento: ABERTO' : 'Recrutamento: FECHADO'"
                   :severity="settingsData.recruitment_open ? 'info' : 'secondary'" />
            </div>
          </div>
        </div>
      </div>

      <Empty v-else label="Nenhuma configuração encontrada no banco de dados." icon="ri-settings-4-line" />
    </div>

    <AppFormDialog v-model:visible="settingDialog" :initialValues="formInitialValues" :resolver="resolver"
      :fields="settingFields" header="Editar Configurações do Sistema" submitLabel="Salvar Configurações" :loading="saving" @submit="saveSettings">
      <template #extra-actions>
        <div class="col-12 flex flex-wrap gap-2 my-2 p-3 surface-ground border-round border-1 border-white-alpha-10">
          <span class="w-full font-bold text-sm text-secondary mb-1">Captura Rápida de GPS (Sua Posição Atual):</span>
          <Button label="Puxar GPS (Base Azul - A)" icon="ri-map-pin-user-line" size="small" severity="info" outlined :loading="isGpsLoading" @click="fetchGpsLocation('blue_base')" />
          <Button label="Puxar GPS (Base Amarela - B)" icon="ri-map-pin-user-line" size="small" severity="warning" outlined :loading="isGpsLoading" @click="fetchGpsLocation('yellow_base')" />
        </div>
      </template>
    </AppFormDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import ToggleSwitch from "primevue/toggleswitch";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { SettingsService, type ISetting } from "@/services/settings";
import { useSettingsStore } from "@/stores/settings";
import { useGps } from "@/composables/useGps";
import { type IFields } from "@/functions/utils";
import AppFormDialog from "@/components/AppFormDialog.vue";
import Empty from "@/components/Empty.vue";
import { InputNumber } from "primevue";

const settingsStore = useSettingsStore();
const toast = useToast();
const { getCurrentLocation, isLoading: isGpsLoading } = useGps();

const loading = ref(true);
const saving = ref(false);
const settingDialog = ref(false);
const settingsData = ref<ISetting>({} as ISetting);
const formInitialValues = ref<ISetting>({} as ISetting);

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  loading.value = true;
  try {
    const data = await SettingsService.get() as ISetting;
    settingsData.value = data;
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao carregar configurações.", life: 3000 });
  } finally {
    loading.value = false;
  }
};

const settingFields = computed<IFields[]>(() => [
  { name: "team_name", label: "Nome da Equipe", component: InputText, col: "6" },
  { name: "monthly_fee", label: "Mensalidade (R$)", component: InputNumber, col: "6" },
  { name: "max_pending_payments", label: "Meses de Tolerância (Inadimplência)", component: InputNumber, col: "6" },
  { name: "blue_base", label: "Base Azul (A)", component: InputText, col: "6" },
  { name: "yellow_base", label: "Base Amarela (B)", component: InputText, col: "6" },
  { name: "registration_start_date", label: "Data de Início das Inscrições", component: InputText, col: "12" },
  { name: "tactical_map", label: "Exibir Mapa Tático", component: ToggleSwitch, col: "6" },
  { name: "global_map", label: "Exibir Mapa Global", component: ToggleSwitch, col: "6" },
  { name: "tournament_active", label: "Torneio Ativo", component: ToggleSwitch, col: "6" },
  { name: "recruitment_open", label: "Recrutamento Aberto", component: ToggleSwitch, col: "6" },
]);

const settingSchema = z.object({
  team_name: z.string().optional().nullable(),
  monthly_fee: z.number().optional().nullable(),
  max_pending_payments: z.number().optional().nullable(),
  blue_base: z.string().optional().nullable(),
  yellow_base: z.string().optional().nullable(),
  registration_start_date: z.string().optional().nullable(),
  tactical_map: z.boolean().optional().nullable(),
  global_map: z.boolean().optional().nullable(),
  tournament_active: z.boolean().optional().nullable(),
  recruitment_open: z.boolean().optional().nullable(),
});

const resolver = ref(zodResolver(settingSchema));

const editSettings = () => {
  formInitialValues.value = settingsData.value;
  settingDialog.value = true;
};

const fetchGpsLocation = async (field: 'blue_base' | 'yellow_base') => {
  try {
    const pos = await getCurrentLocation();
    const formatted = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
    formInitialValues.value = {
      ...formInitialValues.value,
      [field]: formatted
    };
    toast.add({
      severity: "success",
      summary: "GPS Capturado!",
      detail: `Coordenadas capturadas: ${formatted}`,
      life: 4000,
    });
  } catch (err: any) {
    toast.add({
      severity: "error",
      summary: "Erro GPS",
      detail: err.message || "Não foi possível obter a localização GPS atual.",
      life: 4000,
    });
  }
};

const saveSettings = async (values: Record<string, any>) => {
  saving.value = true;
  try {
    const payload: Partial<ISetting> = {
      team_name: values.team_name || "",
      monthly_fee: values.monthly_fee || "",
      max_pending_payments: values.max_pending_payments || 4,
      blue_base: values.blue_base || "",
      yellow_base: values.yellow_base || "",
      registration_start_date: values.registration_start_date || "",
      tactical_map: !!values.tactical_map,
      global_map: !!values.global_map,
      tournament_active: !!values.tournament_active,
      recruitment_open: !!values.recruitment_open,
    };

    const docId = settingsData.value?.$id;
    const response = await SettingsService.upsert(docId, payload);
    settingsData.value = response;

    await settingsStore.refresh();

    toast.add({
      severity: "success",
      summary: "Sucesso!",
      detail: "Configurações salvas com sucesso.",
      life: 3000,
    });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao salvar configurações.", life: 3000 });
  } finally {
    saving.value = false;
    settingDialog.value = false;
  }
};
</script>
