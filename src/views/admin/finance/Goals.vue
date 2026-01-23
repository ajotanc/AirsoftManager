<template>
  <div class="card">
    <AppTable title="Meta(s)" :value="goals" :fields="fields" :loading="loading">
      <template #header-actions>
        <Button label="Nova" icon="pi pi-plus" size="small" @click="newGoal" />
      </template>
      <template #extra-columns-end>
        <Column header="Imagem">
          <template #body="{ data }">
            <Skeleton v-if="loading" width="100%" height="1rem" />
            <template v-else>
              <Image :src="data.image_url" :alt="data.title" width="50" height="50" v-if="data.image_url"
                class="overflow-hidden border-circle" preview />
            </template>
          </template>
        </Column>
      </template>
      <template #actions="{ data }">
        <Button icon="pi pi-pencil" text rounded severity="secondary" @click="editGoal(data)" />
        <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(data)" /> </template>
    </AppTable>

    <Dialog v-model:visible="goalDialog" header="Meta" :modal="true" :style="{ width: '100%', maxWidth: '640px' }"
      class="m-3">
      <Form :resolver="resolver" :initialValues="selectedGoal" @submit="saveGoal" class="grid"
        :key="selectedGoal.$id || 'new'">
        <template v-for="{ name, label, component, col, hidden, props } in fields" :key="name">
          <div :class="`col-12 md:col-${col}`" v-if="!hidden">
            <FormField v-if="component.name === 'ColorPicker'" :name="name" v-slot="$field" class="flex gap-1">
              <div class="flex flex-column align-items-center gap-2">
                <label class="font-bold" :for="name">{{ label }}</label>
                <component :is="component" :id="name" v-bind="props" :name="name" v-model="$field.value" fluid />
              </div>
              <Message v-if="$field.invalid" severity="error" size="small" variant="simple">
                {{ $field.error?.message }}
              </Message>
            </FormField>
            <FormField v-else-if="component.name === 'ToggleSwitch'" :name="name" v-slot="$field" class="flex gap-1">
              <div class="flex align-items-center gap-2">
                <component :is="component" :id="name" v-bind="props" :name="name" v-model="$field.value" fluid />
                <label class="font-bold" :for="name">{{ label }}</label>
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
        </template>

        <div class="col-12">
          <FileUpload accept="image/*" :maxFileSize="MAX_FILE_SIZE" fluid chooseLabel="Imagem" @select="onSelectFile"
            @remove="onRemoveFile" @clear="onClearFiles" :upload-button-props="{ style: { display: 'none' } }">
            <template #empty>
              <span>Nenhum comprovante selecionado.</span>
            </template>
          </FileUpload>
        </div>

        <div class="col-12 pb-0">
          <div class="flex justify-content-end gap-2">
            <Button label="Cancelar" outlined @click="goalDialog = false" />
            <Button type="submit" label="Salvar" :disabled="!selectedGoal.file && !selectedGoal.image_url" />
          </div>
        </div>
      </Form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue/usetoast";
import Column from "primevue/column";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import { Form } from '@primevue/forms';
import { z } from 'zod';
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { DatePicker, InputNumber, Textarea, useConfirm, type FileUploadSelectEvent } from "primevue";
import { GoalService, type IGoal } from "@/services/goal";
import { dateToISOString, type IFields } from "@/functions/utils";
import AppTable from "@/components/AppTable.vue";
import dayjs from "dayjs";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  try {
    goals.value = await GoalService.list();
  } catch (error) {
    console.error("Erro ao carregar:", error);
  } finally {
    loading.value = false;
  }
};

const goals = ref<IGoal[]>([]);

const toast = useToast();
const confirm = useConfirm();

const loading = ref(true);

const goalDialog = ref(false);
const selectedGoal = ref<IGoal>({} as IGoal);

const fields = computed<IFields[]>(() => [
  { name: "title", label: "Título", component: InputText, col: "12" },
  { name: "description", label: "Descrição", component: Textarea, col: "12" },
  {
    name: "deadline", label: "Prazo final", component: DatePicker, col: "6", props: {
      showButtonBar: true,
      manualInput: false,
      showIcon: true,
      focusOnShow: false,
      iconDisplay: 'input',
      variant: 'filled'
    }
  },
  {
    name: "target_amount", label: "Valor", component: InputNumber, col: "6", props: {
      mode: 'currency', currency: 'BRL', locale: 'pt-BR',
      minFractionDigits: 2,
    }
  },
  {
    name: "current_amount", label: "Valor atual", component: InputNumber, col: "6", hidden: true, props: {
      mode: 'currency', currency: 'BRL', locale: 'pt-BR',
      minFractionDigits: 2,
      readonly: true,
    }
  },
]);

const goalSchema = z.object({
  title: z.string({ error: "Título obrigatório" }),
  description: z.string({ error: "Descrição obrigatória" }),
  target_amount: z.number({ error: "Valor alvo obrigatório" }),
  deadline: z.custom().refine((date) => date instanceof Date || typeof date === 'string', "Data obrigatória").transform((date) => dateToISOString(date as Date | string)),
});

const resolver = ref(zodResolver(goalSchema));

const onSelectFile = async (event: FileUploadSelectEvent) => {
  const file = Array.isArray(event.files) ? event.files[0] : event.files;
  selectedGoal.value.file = file;
};

const onRemoveFile = () => {
  selectedGoal.value.file = null;
};

const onClearFiles = () => {
  selectedGoal.value.file = null;
};

const saveGoal = async ({ valid, values }: any) => {
  if (!valid) return false;

  try {
    const file = selectedGoal.value.file as File;

    const response = await GoalService.upsert(selectedGoal.value.$id, values, file);
    const index = goals.value.findIndex((item: IGoal) => item.$id === response.$id);

    if (index !== -1) {
      goals.value[index] = response;
    } else {
      goals.value.push(response);
    }

    toast.add({
      severity: "success",
      summary: "Sucesso!",
      detail: "Meta salvo com sucesso.",
      life: 3000,
    });
  } catch (error: any) {
    console.error("Erro ao salvar:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar a meta.", life: 3000 });
  } finally {
    hideDialog();
  }
};

const confirmDelete = (goal: IGoal) => {
  confirm.require({
    message: 'Você tem certeza que deseja excluir está meta?',
    header: goal.title,
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
        await GoalService.delete(goal.$id);
        goals.value = goals.value.filter((item: IGoal) => item.$id !== goal.$id);

        toast.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Meta excluída com sucesso!",
          life: 3000,
        });

      } catch (error: any) {
        console.error("Erro ao enviar formulário:", error);

        toast.add({
          severity: "error",
          summary: "Erro",
          detail: error.message || "Falha ao excluir os dados. Tente novamente.",
          life: 4000,
        });
      }
    },
  });
};

const newGoal = async () => {
  selectedGoal.value = {} as IGoal;
  goalDialog.value = true;
};

const editGoal = async (goal: IGoal) => {
  selectedGoal.value = {
    ...goal,
    deadline: goal.deadline ? dayjs(goal.deadline).format('DD/MM/YYYY') : null,
  };
  goalDialog.value = true;
};

const hideDialog = () => {
  goalDialog.value = false;
};

</script>