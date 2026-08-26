<template>
  <div class="card">
    <div class="surface-card shadow-3 border-round overflow-hidden">

      <Message v-if="!authStore.hasLoadout" severity="error" class="m-3" closable>
        <strong>Configure seu loadout para acessar todas as ferramentas do sistema.</strong>
      </Message>

      <DataTable :value="items" paginator :rows="5" stripedRows v-model:filters="filters" :globalFilterFields="labels"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Exibindo {first} a {last} de {totalRecords} uniforme(s)"
        tableStyle="min-width: 60rem">

        <template #header>
          <div class="flex flex-wrap align-items-center justify-content-between gap-3 p-2">

            <div class="flex align-items-center gap-3">
              <span class="text-xl font-bold">Loadout(s)</span>
              <Button v-if="editable" label="Novo" icon="pi pi-plus" size="small" @click="newUniform"
                :disabled="checkedAmountUniforms" :loading="isLoadingDialog" />
            </div>

            <IconField iconPosition="left">
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="filters['global'].value" placeholder="Procurar..." />
            </IconField>

          </div>
        </template>

        <Column header="Tipo de Uniforme">
          <template #body="{ data: uniform }">
            <div class="flex align-items-center gap-2">
              <Tag :value="UNIFORMS[uniform.type_uniform]" severity="info" />
              <Tag v-if="checkUniformComplete(uniform)" severity="warn" icon="pi pi-crown">
              </Tag>
            </div>
          </template>
        </Column>

        <Column v-for="item in LOADOUT_ITEMS" :key="item.key" :header="item.label" class="text-center">
          <template #body="{ data: uniform }">
            <i v-if="uniform[item.key]" class="pi pi-check text-green-500"
              style="font-size: 1rem; font-weight: bold"></i>
            <i v-else class="pi pi-times text-red-300" style="font-size: 1rem"></i>
          </template>
        </Column>

        <Column header="Ações" v-if="editable" style="width: 10%; min-width: 8rem" bodyStyle="text-align: center">
          <template #body="{ data: uniform }">
            <div class="flex gap-2 justify-content-center">
              <Button icon="pi pi-pencil" text rounded severity="info" v-tooltip.top="'Editar'"
                :disabled="isLoadingDialog" @click="editUniform(uniform)" />
              <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip.top="'Excluir'"
                :disabled="isLoadingDialog" @click="confirmDelete(uniform)" />
            </div>
          </template>
        </Column>

        <template #footer>
          <div v-if="!isStandard" class="flex align-items-center justify-content-center gap-2">
            <i class="pi pi-info-circle"></i>
            <span class="font-medium">
              Loadout incompleto. Possui
              <strong>{{ currentCompleteCount }}</strong> de
              <strong>{{ minCompleteUniforms }}</strong> uniformes necessários.
            </span>
          </div>
          <div v-else class="flex align-items-center justify-content-end">
            <Tag severity="warn" :value="`Padrão ${TEAM_NAME}`" icon="pi pi-star-fill">
            </Tag>
          </div>
        </template>

        <template #empty>
          <Empty label="Nenhum uniforme cadastrado" icon="ri-t-shirt-line" />
        </template>
      </DataTable>
    </div>

    <Dialog v-model:visible="uniformDialog" header="Detalhes do Loadout" modal
      :style="{ width: '90vw', maxWidth: '375px', overflow: 'hidden', maxHeight: '100%' }">
      <div class="flex flex-column gap-3">
        <FloatLabel variant="in">
          <Select :options="UNIFORMS_OPTIONS_FILTER" optionLabel="label" optionValue="value" name="type_uniform"
            v-model="selectedUniform.type_uniform" class="w-full" :disabled="!!selectedUniform.$id" fluid />
          <label>Uniformes</label>
        </FloatLabel>
        <div
          class="inventory flex flex-column gap-3 relative overflow-hidden border-gray-600 border-1 border-round-lg relative p-3">
          <div class=" flex justify-content-between align-items-center">
            <span class="font-bold text-sm uppercase tracking-widest">Equipamentos</span>
            <Tag :value="`${activeCount}/${totalMandatoryItems}`" severity="warn" />
          </div>
          <Image :src="getTypeUniform()" alt="Operador"
            :imageClass="['absolute w-full left-50 opacity-40 transition-all transition-duration-500', { 'z-1 opacity-100': shownUniform }]"
            imageStyle="transform: translate(-50%, -8%);" />
          <div
            :class="['flex justify-content-center align-items-center relative transition-all transition-duration-500', { 'opacity-40': shownUniform }]">
            <div class="gap-3" style="display: grid; grid-template-columns: repeat(3, 1fr);">
              <div v-for="(item, index) in GRID_LAYOUT" :key="index">
                <div v-if="['rating', 'patch'].includes(item)"
                  class="flex justify-content-center align-items-center border-solid text-gray-700 border-gray-600 border-1 border-round-lg bg-black-alpha-20 overflow-hidden square">
                  <Image preview v-if="isStandard" :src="getImage(item)" :alt="item"
                    imageClass="p-2 transition-all transition-duration-500 square" style="scale: 1.1;" width="80"
                    height="80" />
                  <i v-else class="pi pi-minus-circle"></i>
                </div>

                <div v-else-if="isException(item, selectedUniform.type_uniform)"
                  class="flex justify-content-center align-items-center border-solid text-gray-700 border-gray-600 border-1 border-round-lg bg-black-alpha-20 overflow-hidden square">
                  <i class="pi pi-minus-circle"></i>
                </div>

                <div v-else
                  class="flex border-solid border-1 border-round-lg bg-black-alpha-20 transition-all transition-duration-500 cursor-pointer square"
                  :class="[
                    isEquipped(item)
                      ? 'border-yellow-800'
                      : 'border-gray-600 hover:border-yellow-400'
                  ]" @click="toggleItem(item)">
                  <Image :src="getImage(item)" :alt="item" class="flex overflow-hidden"
                    :imageClass="['p-2 transition-all transition-duration-500 transition-ease-in-out square']"
                    :imageStyle="{
                      filter: isEquipped(item) ? 'none' : 'grayscale(100%)',
                      scale: isEquipped(item) ? '1.1' : '1',
                    }" width="80" height="80" />
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-content-between align-items-center gap-2 z-1">
            <Button :icon="shownUniform ? 'pi pi-eye-slash' : 'pi pi-eye'" text @click="shownUniform = !shownUniform" />
            <div class="flex gap-2">
              <Button label="Cancelar" outlined @click="uniformDialog = false" />
              <Button type="submit" label="Salvar" @click="saveUniform" />
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
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

import { TEAM_NAME, UNIFORMS, UNIFORMS_OPTIONS, LOADOUT_ITEMS, UNIFORM_IDS, PMC_EXCEPTIONS } from "@/constants/airsoft";
import { LoadoutService, type ILoadout } from "@/services/loadout";
import { useConfirm } from "primevue";
import { useOperator } from "@/composables/useOperator";

const items = defineModel<ILoadout[]>('items', {
  default: () => []
});

const props = defineProps({
  owner: {
    required: false,
    type: String,
    default: '',
  },
  editable: {
    type: Boolean,
    default: false
  },
  minCompleteUniforms: {
    type: Number,
    default: 1,
  },
});

const toast = useToast();
const confirm = useConfirm();
const { authStore } = useOperator();

const confirmDelete = (uniform: ILoadout) => {
  confirm.require({
    message: 'Você tem certeza que deseja excluir este uniforme?',
    header: UNIFORMS[uniform.type_uniform],
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
        await LoadoutService.delete(uniform.$id);

        const index = items.value.findIndex((item: ILoadout) => item.$id === uniform.$id);
        if (index !== -1) {
          items.value.splice(index, 1);
        }

        toast.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Uniforme excluído com sucesso!",
          life: 3000,
        });

      } catch (error) {
        const err = error as Error;
        console.error("Erro ao enviar formulário:", err);

        toast.add({
          severity: "error",
          summary: "Erro",
          detail: err.message || "Falha ao salvar os dados. Tente novamente.",
          life: 4000,
        });
      }
    },
  });
};

const GRID_LAYOUT = [
  'patch', 'headset', 'rating',
  'helmet', 'ski_mask', 'bonnie_hat',
  'tactical_vest', 'combat_shirt', 'walkie_talkie',
  'holster', 'tactical_pants', 'tactical_belt',
  'gloves', 'combat_boot', 'knee_pads',
];

const CAMO_DEPENDENT_ITEMS = [
  'bonnie_hat',
  'combat_shirt',
  'tactical_pants',
  'ski_mask',
];

const UNIFORMS_OPTIONS_FILTER = computed(() => {
  if (selectedUniform.value.$id) {
    return UNIFORMS_OPTIONS;
  }

  const usedCodes = items.value.map(u => u.type_uniform);
  return UNIFORMS_OPTIONS.filter(option => !usedCodes.includes(option.value));
});

const uniformDialog = ref(false);
const selectedUniform = ref({} as ILoadout);
const allOptions = ref(LOADOUT_ITEMS);

const isLoadingDialog = ref(false);
const shownUniform = ref(false);

const filters = ref({
  'global': { value: '', matchMode: FilterMatchMode.CONTAINS },
});

watch(
  items,
  (list) => {
    if (Array.isArray(list)) {
      list.forEach((item) => item.uniform_name = UNIFORMS[item.type_uniform]);
    }
  },
  { immediate: true, deep: true }
);

const labels = computed(() => {
  const firstItem = items.value?.[0];

  if (!firstItem) return ['$id'];

  return (Object.keys(firstItem) as (keyof typeof firstItem)[]).filter(key => {
    if (typeof key === 'string' && key.startsWith('$')) return false;
    const val = firstItem[key];
    return val !== null && val !== undefined && typeof val !== 'object';
  }) as string[];
});

const checkUniformComplete = (uniform: ILoadout) => {
  return LOADOUT_ITEMS.every((field) => {

    if (!isItemMandatory(field.key, uniform.type_uniform)) {
      return true;
    }

    const value = uniform[field.key as keyof ILoadout];
    return value === true || value === 1;
  });
};

const newUniform = async () => {
  selectedUniform.value = {} as ILoadout;

  await nextTick();

  const firstAvailable = UNIFORMS_OPTIONS_FILTER.value[0];
  const defaultType = firstAvailable ? firstAvailable.value : 1;

  selectedUniform.value = { type_uniform: defaultType } as ILoadout;
  uniformDialog.value = true;
  shownUniform.value = false;
};

const editUniform = async (uniform: ILoadout) => {
  const { uniform_name, ...data } = uniform;
  selectedUniform.value = data;
  uniformDialog.value = true;
  shownUniform.value = false;
};

const hideDialog = () => {
  uniformDialog.value = false;
};

const saveUniform = async () => {
  try {
    const payload = {
      ...selectedUniform.value,
      operator: props.owner
    };

    const response = await LoadoutService.upsert(selectedUniform.value.$id, payload);

    const index = items.value.findIndex((item: ILoadout) => item.$id === response.$id);

    if (index !== -1) {
      items.value[index] = response;
    } else {
      items.value.push(response);
    }

    toast.add({
      severity: "success",
      summary: "Sucesso",
      detail: "Loadout salvo com sucesso!",
      life: 3000,
    });
  } catch (error) {
    const err = error as Error;
    console.error("Erro ao salvar:", err);
    toast.add({
      severity: "error",
      summary: "Erro",
      detail: err.message || "Falha ao salvar.",
      life: 4000,
    });
  } finally {
    hideDialog();
  }
}

const isEquipped = (key: string) => {
  return !!selectedUniform.value[key as keyof ILoadout];
};

const toggleItem = (key: string) => {
  const currentKey = key as keyof ILoadout;
  (selectedUniform.value[currentKey] as boolean) = !selectedUniform.value[currentKey];
};

const getImage = (itemKey: string) => {
  let fileName = itemKey;

  if (CAMO_DEPENDENT_ITEMS.includes(itemKey)) {
    fileName = `${itemKey}_${selectedUniform.value.type_uniform}`;
  }

  return `/images/loadouts/${fileName}.webp`;
};

const getTypeUniform = () => {
  return `/images/loadouts/type_uniform_${selectedUniform.value.type_uniform}.webp`;
};

const currentCompleteCount = computed(() => {
  if (!items.value || items.value.length === 0) return 0;
  return items.value.filter((uniform) => checkUniformComplete(uniform)).length;
});

const isStandard = computed(() => {
  return currentCompleteCount.value >= props.minCompleteUniforms;
});

const checkedAmountUniforms = computed(() => {
  return items.value.length === UNIFORMS_OPTIONS.length;
});

const activeCount = computed(() => {
  return allOptions.value.filter(opt => {
    if (!isItemMandatory(opt.key, selectedUniform.value.type_uniform)) return false;

    return selectedUniform.value[opt.key as keyof ILoadout];
  }).length;
});

const totalMandatoryItems = computed(() => {
  return allOptions.value.filter(opt => isItemMandatory(opt.key, selectedUniform.value.type_uniform)).length;
});

const isItemMandatory = (itemKey: string, uniformType: number) => {
  const baseRule = LOADOUT_ITEMS.find((i) => i.key === itemKey);

  if (!baseRule || baseRule.optional) return false;

  if (uniformType === UNIFORM_IDS.PMC) {
    if (PMC_EXCEPTIONS.includes(itemKey)) {
      return false;
    }
  }

  return true;
};

const isException = (itemKey: string, uniformType: number) => {
  if (UNIFORM_IDS.PMC === uniformType && PMC_EXCEPTIONS.includes(itemKey)) {
    return true;
  }
  return false;
};

</script>

<style scoped>
.square {
  width: 80px;
  height: 80px;
}
</style>
