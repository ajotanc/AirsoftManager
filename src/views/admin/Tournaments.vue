<template>
  <div class="card">
    <AppTable title="Torneio(s)" :value="tournaments" :fields="tournamentFields" :loading="loading"
      icon="ri-trophy-line">
      <template #header-actions>
        <Button label="Novo" icon="pi pi-plus" size="small" @click="newTournament" />
      </template>

      <template #actions="{ data }">
        <Skeleton v-if="loading" width="100%" height="1rem" />
        <div v-else class="flex gap-2 justify-content-center">
          <Button icon="pi pi-eye" text rounded severity="info" v-tooltip.top="'Acessar Torneio'"
            @click="viewTournament(data)" />
          <Button icon="pi pi-pencil" text rounded severity="secondary" v-tooltip.top="'Editar'"
            @click="editTournament(data)" />
          <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip.top="'Excluir'"
            @click="confirmDelete(data)" />
        </div>
      </template>
    </AppTable>

    <AppFormDialog v-model:visible="tournamentDialog" :initialValues="selectedTournament" :resolver="resolver"
      :fields="tournamentFields" header="Torneio" @submit="saveTournament" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Select from "primevue/select";
import DatePicker from "primevue/datepicker";
import ToggleSwitch from "primevue/toggleswitch";
import InputNumber from "primevue/inputnumber";
import Skeleton from "primevue/skeleton";
import { useConfirm } from "primevue";
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { TournamentService, STATUS_LABEL, type ITournament } from "@/services/tournament";
import dayjs from "dayjs";
import { formatDate, zRequired, type IFields } from "@/functions/utils";
import AppTable from "@/components/AppTable.vue";
import AppFormDialog from "@/components/AppFormDialog.vue";

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const tournaments = ref<ITournament[]>([]);
const loading = ref(true);
const tournamentDialog = ref(false);
const selectedTournament = ref<ITournament>({} as ITournament);

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  try {
    tournaments.value = await TournamentService.list();
  } catch (error) {
    console.error("Erro ao carregar torneios:", error);
  } finally {
    loading.value = false;
  }
};

const tournamentFields = computed<IFields[]>(() => [
  { name: "name", label: "Nome do Torneio", component: InputText, col: "12" },
  { name: "description", label: "Descrição", component: Textarea, col: "12", hiddenTable: true, props: { rows: 3 } },
  {
    name: "status", label: "Situação", component: Select, col: "6", props: {
      options: [
        { label: STATUS_LABEL.open, value: 'open', severity: 'success' },
        { label: STATUS_LABEL.ongoing, value: 'ongoing', severity: 'info' },
        { label: STATUS_LABEL.finished, value: 'finished', severity: 'warn' },
      ],
      optionLabel: "label",
      optionValue: "value",
      isTag: true
    }
  },
  {
    name: "type", label: "Tipo", component: Select, col: "6", props: {
      options: [
        { label: 'Eliminatória', value: 'knockout' },
        { label: 'Melhor de 3', value: 'bo3' },
        { label: 'Melhor de 5', value: 'bo5' },
      ],
      optionLabel: "label",
      optionValue: "value",
      isTag: true
    }
  },
  {
    name: "date", label: "Data", component: DatePicker, col: "6", props: {
      dateFormat: 'dd/mm/yy',
      showIcon: true
    }
  },
  {
    name: "mode", label: "Modo", component: InputNumber, col: "6", props: {
      min: 1,
      max: 10,
      showButtons: true
    }
  },
  {
    name: "allowed_class", label: "Classe Permitida", component: Select, col: "6", props: {
      options: [
        { label: 'Livre (Todas)', value: 'all' },
        { label: 'Pistola', value: 'pistol' },
        { label: 'Fuzil de Assalto', value: 'assault' },
        { label: 'DMR', value: 'dmr' },
        { label: 'Sniper', value: 'sniper' }
      ],
      optionLabel: "label",
      optionValue: "value",
      isTag: true
    }
  },
  {
    name: "is_paid", label: "Inscrição Paga?", component: ToggleSwitch, col: "6", props: {
      "onUpdate:modelValue": (val: boolean) => {
        selectedTournament.value.is_paid = val;
        if (!val) {
          selectedTournament.value.price = 0;
        }
      }
    }
  },
  {
    name: "price", label: "Valor da Inscrição (R$)", component: InputNumber, col: "6", props: {
      mode: 'currency',
      currency: 'BRL',
      locale: 'pt-BR',
      min: 0,
      disabled: !selectedTournament.value.is_paid
    }
  },
  { name: "awards", label: "Prêmios (separados por vírgula)", component: InputText, col: "12", hiddenTable: true, props: { placeholder: "1º Lugar: Troféu, 2º Lugar: Medalha..." } }
]);

const tournamentSchema = z.object({
  name: zRequired("Nome é obrigatório"),
  description: z.string().nullish().optional(),
  date: z.custom().refine((date) => date instanceof Date || typeof date === 'string', "Data obrigatória").transform((date) => date && formatDate(date as Date | string).toISOString()),
  mode: z.number({ error: "Modo é obrigatório" }).min(1, "Quantidade mínima 1"),
  type: zRequired("Selecione o tipo de chaveamento"),
  allowed_class: zRequired("Selecione a classe permitida"),
  status: z.string().default('open'),
  is_paid: z.boolean().default(false),
  price: z.number().nullish().optional(),
  awards: z.string().nullish().optional().transform((awards) => awards && awards.split(",").map((award) => award.trim())),
}).refine((data) => {
  if (data.is_paid && (!data.price || data.price <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Insira o valor da inscrição do torneio.",
  path: ["price"],
});

const resolver = ref(zodResolver(tournamentSchema));

const saveTournament = async (values: ITournament) => {
  try {
    const response = await TournamentService.upsert(selectedTournament.value.$id, values as ITournament);
    const index = tournaments.value.findIndex((item) => item.$id === response.$id);

    if (index !== -1) {
      tournaments.value[index] = response;
    } else {
      tournaments.value.push(response);
    }

    toast.add({
      severity: "success",
      summary: "Sucesso!",
      detail: "Torneio salvo com sucesso.",
      life: 3000,
    });
  } catch (error) {
    console.error("Erro ao salvar:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar o torneio.", life: 3000 });
  } finally {
    hideDialog();
  }
};

const confirmDelete = (tournament: ITournament) => {
  confirm.require({
    message: 'Você tem certeza que deseja excluir este torneio?',
    header: tournament.name,
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
        await TournamentService.delete(tournament.$id);
        tournaments.value = tournaments.value.filter((item) => item.$id !== tournament.$id);

        toast.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Torneio excluído com sucesso!",
          life: 3000,
        });

      } catch (error: any) {
        console.error("Erro ao excluir torneio:", error);
        toast.add({
          severity: "error",
          summary: "Erro",
          detail: error.message || "Falha ao excluir os dados.",
          life: 4000,
        });
      }
    },
  });
};

const newTournament = () => {
  selectedTournament.value = {
    mode: 1,
    type: 'knockout',
    allowed_class: 'all',
    status: 'open',
    is_paid: false,
    price: 0,
  } as ITournament;
  tournamentDialog.value = true;
};

const editTournament = (tournament: ITournament) => {
  selectedTournament.value = {
    ...tournament,
    date: dayjs(tournament.date).format("DD/MM/YYYY"),
  };

  tournamentDialog.value = true;
};

const viewTournament = (tournament: ITournament) => {
  router.push(`/tournament/${tournament.$id}`);
};

const hideDialog = () => {
  tournamentDialog.value = false;
};
</script>
