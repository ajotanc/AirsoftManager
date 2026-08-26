<template>
  <div class="card">
    <div class="surface-card p-4 shadow-2 border-round border-1 border-white-alpha-10 mb-4">
      <div class="flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div class="flex align-items-center gap-2">
          <i class="ri-settings-4-line text-primary text-2xl"></i>
          <h2 class="text-xl font-bold m-0 text-white">Configurações Gerais do Sistema</h2>
        </div>
        <Button label="Editar Configurações" icon="pi pi-pencil" size="small" severity="primary"
          @click="editSettings" />
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

        <!-- Times de Jogo Interno -->
        <div class="col-12 md:col-6">
          <div class="p-3 surface-ground border-round border-1 border-white-alpha-10 h-full">
            <div class="flex align-items-center justify-content-between mb-2">
              <span class="text-blue-400 text-sm font-bold flex align-items-center gap-2">
                <i class="ri-shield-user-line"></i> Time Azul ({{ settingsData.blue_team?.length || 0 }})
              </span>
            </div>
            <div v-if="settingsData.blue_team?.length" class="flex flex-wrap gap-2">
              <Tag v-for="opId in settingsData.blue_team" :key="opId" :value="getOperatorCodename(opId)"
                severity="info" />
            </div>
            <span v-else class="text-xs text-500 italic">Nenhum operador escalado</span>
          </div>
        </div>

        <div class="col-12 md:col-6">
          <div class="p-3 surface-ground border-round border-1 border-white-alpha-10 h-full">
            <div class="flex align-items-center justify-content-between mb-2">
              <span class="text-yellow-400 text-sm font-bold flex align-items-center gap-2">
                <i class="ri-shield-user-line"></i> Time Amarelo ({{ settingsData.yellow_team?.length || 0 }})
              </span>
            </div>
            <div v-if="settingsData.yellow_team?.length" class="flex flex-wrap gap-2">
              <Tag v-for="opId in settingsData.yellow_team" :key="opId" :value="getOperatorCodename(opId)"
                severity="warn" />
            </div>
            <span v-else class="text-xs text-500 italic">Nenhum operador escalado</span>
          </div>
        </div>

        <!-- Rangers / Fiscais -->
        <div class="col-12">
          <div class="p-3 surface-ground border-round border-1 border-white-alpha-10 h-full">
            <div class="flex align-items-center justify-content-between mb-2">
              <span class="text-green-400 text-sm font-bold flex align-items-center gap-2">
                <i class="ri-eye-line"></i> Rangers do Jogo / Fiscais ({{ settingsData.rangers?.length || 0 }})
              </span>
            </div>
            <div v-if="settingsData.rangers?.length" class="flex flex-wrap gap-2">
              <Tag v-for="opId in settingsData.rangers" :key="opId" :value="getOperatorCodename(opId)"
                severity="success" icon="ri-eye-line" />
            </div>
            <span v-else class="text-xs text-500 italic">Nenhum ranger escalado</span>
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
              <Tag :value="settingsData.split_teams ? 'Separação de Equipes: ATIVA' : 'Separação de Equipes: INATIVA'"
                :severity="settingsData.split_teams ? 'success' : 'secondary'" />
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
      :fields="settingFields" header="Editar Configurações do Sistema" submitLabel="Salvar Configurações"
      :loading="saving" @field-change="onSettingsFieldChange" @submit="saveSettings">
      <template #extra-actions>
        <div class="col-12 flex flex-wrap gap-2 my-2 p-3 surface-ground border-round border-1 border-white-alpha-10">
          <span class="w-full font-bold text-sm text-secondary mb-1">Captura Rápida de GPS (Sua Posição Atual):</span>
          <Button label="Puxar GPS (Base Azul - A)" icon="ri-map-pin-user-line" size="small" severity="info" outlined
            :loading="isGpsLoading" @click="fetchGpsLocation('blue_base')" />
          <Button label="Puxar GPS (Base Amarela - B)" icon="ri-map-pin-user-line" size="small" severity="warning"
            outlined :loading="isGpsLoading" @click="fetchGpsLocation('yellow_base')" />
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
import MultiSelect from "primevue/multiselect";
import { InputNumber } from "primevue";
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { SettingsService, type ISetting } from "@/services/settings";
import { OperatorService, type IOperator } from "@/services/operator";
import { useSettingsStore } from "@/stores/settings";
import { useGps } from "@/composables/useGps";
import { type IFields, type FieldChangePayload } from "@/functions/utils";
import AppFormDialog from "@/components/AppFormDialog.vue";
import Empty from "@/components/Empty.vue";

const settingsStore = useSettingsStore();
const toast = useToast();
const { getCurrentLocation, isLoading: isGpsLoading } = useGps();

const loading = ref(true);
const saving = ref(false);
const settingDialog = ref(false);
const settingsData = ref<ISetting>({} as ISetting);
const formInitialValues = ref<ISetting>({} as ISetting);
const operatorsList = ref<IOperator[]>([]);

const selectedBlueTeam = ref<string[]>([]);
const selectedYellowTeam = ref<string[]>([]);
const selectedRangers = ref<string[]>([]);

const blueTeamOptions = computed(() => {
  return operatorsList.value.filter((op) => !selectedYellowTeam.value.includes(op.$id) && !selectedRangers.value.includes(op.$id));
});

const yellowTeamOptions = computed(() => {
  return operatorsList.value.filter((op) => !selectedBlueTeam.value.includes(op.$id) && !selectedRangers.value.includes(op.$id));
});

const rangerOptions = computed(() => {
  return operatorsList.value.filter((op) => !selectedBlueTeam.value.includes(op.$id) && !selectedYellowTeam.value.includes(op.$id));
});

const getOperatorCodename = (id: string) => {
  return operatorsList.value.find((op) => op.$id === id)?.codename || id;
};

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  loading.value = true;
  try {
    const [data, ops] = await Promise.all([
      SettingsService.get(),
      OperatorService.all()
    ]);
    settingsData.value = data;
    operatorsList.value = ops;
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
  {
    name: "blue_team",
    label: "Time Azul (Base A)",
    component: MultiSelect,
    col: "6",
    props: {
      options: blueTeamOptions.value,
      optionLabel: "codename",
      optionValue: "$id",
      filter: true,
      display: "chip",
      class: "w-full"
    }
  },
  {
    name: "yellow_team",
    label: "Time Amarelo (Base B)",
    component: MultiSelect,
    col: "6",
    props: {
      options: yellowTeamOptions.value,
      optionLabel: "codename",
      optionValue: "$id",
      filter: true,
      display: "chip",
      class: "w-full"
    }
  },
  {
    name: "rangers",
    label: "Rangers do Jogo",
    component: MultiSelect,
    col: "12",
    props: {
      options: rangerOptions.value,
      optionLabel: "codename",
      optionValue: "$id",
      filter: true,
      display: "chip",
      class: "w-full"
    }
  },
  { name: "registration_start_date", label: "Data de Início das Inscrições", component: InputText, col: "12" },
  { name: "split_teams", label: "Ativar Separação de Equipes", component: ToggleSwitch, col: "6" },
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
  blue_team: z.array(z.string()).optional().nullable(),
  yellow_team: z.array(z.string()).optional().nullable(),
  rangers: z.array(z.string()).optional().nullable(),
  split_teams: z.boolean().optional().nullable(),
  registration_start_date: z.string().optional().nullable(),
  tactical_map: z.boolean().optional().nullable(),
  global_map: z.boolean().optional().nullable(),
  tournament_active: z.boolean().optional().nullable(),
  recruitment_open: z.boolean().optional().nullable(),
});

const resolver = ref(zodResolver(settingSchema));

const editSettings = () => {
  selectedBlueTeam.value = [...(settingsData.value?.blue_team || [])];
  selectedYellowTeam.value = [...(settingsData.value?.yellow_team || [])];
  selectedRangers.value = [...(settingsData.value?.rangers || [])];
  formInitialValues.value = {
    ...settingsData.value,
    blue_team: selectedBlueTeam.value,
    yellow_team: selectedYellowTeam.value,
    rangers: selectedRangers.value
  };
  settingDialog.value = true;
};

const onSettingsFieldChange = (payload: FieldChangePayload<ISetting>) => {
  if (payload.name === 'blue_team') {
    selectedBlueTeam.value = Array.isArray(payload.value) ? payload.value : [];
  } else if (payload.name === 'yellow_team') {
    selectedYellowTeam.value = Array.isArray(payload.value) ? payload.value : [];
  } else if (payload.name === 'rangers') {
    selectedRangers.value = Array.isArray(payload.value) ? payload.value : [];
  }
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
  } catch (err) {
    const error = err as Error;
    toast.add({
      severity: "error",
      summary: "Erro GPS",
      detail: error.message || "Não foi possível obter a localização GPS atual.",
      life: 4000,
    });
  }
};

const saveSettings = async (values: ISetting) => {
  saving.value = true;
  try {
    const payload: Partial<ISetting> = {
      team_name: values.team_name || "",
      monthly_fee: values.monthly_fee ?? 30,
      max_pending_payments: values.max_pending_payments ?? 4,
      blue_base: values.blue_base || "",
      yellow_base: values.yellow_base || "",
      blue_team: values.blue_team || [],
      yellow_team: values.yellow_team || [],
      rangers: values.rangers || [],
      split_teams: !!values.split_teams,
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
