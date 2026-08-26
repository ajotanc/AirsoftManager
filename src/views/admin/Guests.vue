<template>
  <div class="card">
    <AppTable title="Convidado(s)" :value="guests" :fields="fields" :loading="loading" icon="ri-group-3-line">
      <template #header-actions>
        <Button label="Novo" icon="pi pi-plus" size="small" @click="newGuest" />
      </template>

      <template #actions="{ data }">
        <Skeleton v-if="loading" width="100%" height="1rem" />
        <div v-else class="flex gap-2 justify-content-center">
          <Button icon="pi pi-pencil" text rounded severity="secondary" @click="editGuest(data)" />
          <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(data)" />
        </div>
      </template>
    </AppTable>

    <AppFormDialog v-model:visible="guestDialog" :header="selectedVisitor.$id ? 'Editar Convidado' : 'Novo Convidado'"
      :fields="fields" :initialValues="selectedVisitor" :resolver="resolver" @submit="saveGuest" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { InputMask, useConfirm } from "primevue";
import { GuestService, type IGuest } from "@/services/guest";
import { OperatorService, type IOperator } from "@/services/operator";
import type { IFields } from "@/functions/utils";
import { TEAMS } from "@/constants/airsoft";

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  try {
    const [guestsData, operatorsData] = await Promise.all([
      GuestService.list(),
      OperatorService.listActive()
    ]);

    guests.value = guestsData;
    operators.value = operatorsData;

  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados.' });
  } finally {
    loading.value = false;
  }
};

const loading = ref(true);
const guests = ref<IGuest[]>([]);
const operators = ref<IOperator[]>([]);

const toast = useToast();
const confirm = useConfirm();

const guestDialog = ref(false);
const selectedVisitor = ref<IGuest>({} as IGuest);

const guestSchema = z.object({
  name: z.string({ error: "Nome Completo obrigatório" }),
  codename: z.string({ error: "Codinome obrigatório" }),
  phone: z.string({ error: "Telefone / Whatsapp obrigatório" }).transform((v) => v.replace(/\D/g, "")),
  operator: z.string({ error: "Selecione um operador" }),
  team: z.string({ error: "Selecione a sua equipe" })
});

const fields = computed<IFields<IGuest>[]>(() => [
  {
    name: "operator",
    label: "Quem Convidou?",
    component: Select,
    col: '12',
    props: {
      options: operators.value,
      optionLabel: "codename",
      optionValue: "$id",
      filter: true,
    }
  },
  { name: "name", label: "Nome do Convidado", component: InputText, col: '12' },
  { name: "codename", label: "Codinome", component: InputText, col: '6' },
  {
    name: "phone",
    label: "Telefone / Whatsapp",
    button: {
      severity: "success",
      icon: "pi pi-whatsapp",
      callback: ({ phone }: IGuest) => {
        window.open(`https://wa.me/55${phone}`, '_blank');
      }
    },
    component: InputMask, col: '6', props: { mask: '(99) 99999-9999' }
  },
  {
    name: "team", label: "Equipe", component: Select, col: "12", props: {
      options: TEAMS,
      filter: true,
    },
    isTag: true
  },
]);

const resolver = ref(zodResolver(guestSchema));

const saveGuest = async (values: IGuest) => {
  try {
    const response = await GuestService.upsert(selectedVisitor.value.$id, values);
    const index = guests.value.findIndex((item: IGuest) => item.$id === response.$id);

    if (index !== -1) {
      guests.value[index] = response;
    } else {
      guests.value.push(response);
    }

    toast.add({
      severity: "success",
      summary: "Sucesso!",
      detail: "Convidado salvo com sucesso.",
      life: 3000,
    });
  } catch (error) {
    console.error("Erro ao salvar:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar o visitante.", life: 3000 });
  } finally {
    hideDialog();
  }
};

const confirmDelete = (guest: IGuest) => {
  confirm.require({
    message: 'Você tem certeza que deseja excluir este visitante?',
    header: "Convidado",
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
        await GuestService.delete(guest.$id);
        guests.value = guests.value.filter((item: IGuest) => item.$id !== guest.$id);

        toast.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Convidado excluído com sucesso!",
          life: 3000,
        });

      } catch (error) {
        const err = error as Error;
        console.error("Erro ao enviar formulário:", err);

        toast.add({
          severity: "error",
          summary: "Erro",
          detail: err.message || "Falha ao excluir os dados. Tente novamente.",
          life: 4000,
        });
      }
    },
  });
};

const newGuest = async () => {
  selectedVisitor.value = {} as IGuest;
  guestDialog.value = true;
};

const editGuest = async (guest: IGuest<IOperator>) => {
  selectedVisitor.value = { ...guest, operator: guest.operator.$id, selected: guest.operator };
  guestDialog.value = true;
};

const hideDialog = () => {
  guestDialog.value = false;
};
</script>