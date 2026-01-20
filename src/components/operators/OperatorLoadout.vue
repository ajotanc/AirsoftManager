<template>
  <div class="card">
    <div class="surface-card shadow-2 border-round overflow-hidden">

      <DataTable :value="items" paginator :rows="5" stripedRows :filters="filters"
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
              <Tag :value="UNIFORMS[uniform.type_uniform as keyof typeof UNIFORMS]" severity="info" />
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
          <Empty label="Nenhum uniforme cadastrado" icon="ri ri-t-shirt-line" />
        </template>
      </DataTable>
    </div>

    <Dialog v-model:visible="uniformDialog" :style="{ width: '360px' }" header="Detalhes do Loadout" :modal="true">
      <div class="flex flex-column gap-3">
        <FloatLabel variant="in">
          <Select :options="UNIFORMS_OPTIONS_FILTER" optionLabel="label" optionValue="value" name="type_uniform"
            v-model="selectedUniform.type_uniform" class="w-full" :disabled="!!selectedUniform.$id" fluid />
          <label>Uniformes</label>
        </FloatLabel>
        <div
          class="inventory flex flex-column gap-3 relative overflow-hidden border-gray-600 border-1 border-round-lg relative p-3">
          <div class=" flex justify-content-between align-items-center">
            <span class="text-gray-400 font-bold text-sm uppercase tracking-widest">Equipamentos</span>
            <Tag :value="`${activeCount}/${totalMandatoryItems}`" severity="warn" />
          </div>
          <Image :src="getTypeUniform()" alt="Operador" imageClass="absolute w-full opacity-50 left-50"
            imageStyle="mask-image: linear-gradient(to bottom, black 60%, transparent 100%); transform: translateX(-50%);" />
          <div class="flex justify-content-center align-items-center relative">
            <div class="gap-3" style="display: grid; grid-template-columns: repeat(3, 1fr);">
              <div v-for="(item, index) in GRID_LAYOUT" :key="index">
                <div v-if="['rating', 'patch'].includes(item)"
                  class="flex justify-content-center align-items-center border-solid text-gray-700 border-gray-600 border-1 border-round-lg bg-black-alpha-20 overflow-hidden"
                  style="aspect-ratio: 1; width: 80px;">
                  <Image preview v-if="isStandard" :src="getImageUrl(item)" :alt="item"
                    imageClass="w-full h-full p-2 transition-all transition-duration-500" style="scale: 1.1;" />
                  <i v-else class="pi pi-minus-circle"></i>
                </div>

                <div v-else-if="isException(item, selectedUniform.type_uniform)"
                  class="flex justify-content-center align-items-center border-solid text-gray-700 border-gray-600 border-1 border-round-lg bg-black-alpha-20 overflow-hidden"
                  style="aspect-ratio: 1; width: 80px;">
                  <i class="pi pi-minus-circle"></i>
                </div>

                <div v-else
                  class="flex border-solid border-1 border-round-lg bg-black-alpha-20 transition-all transition-duration-500 cursor-pointer"
                  :class="[
                    isEquipped(item)
                      ? 'border-orange-200'
                      : 'border-gray-600 hover:border-orange-400'
                  ]" style="aspect-ratio: 1; width: 80px;" @click="
                    toggleItem(item)">

                  <Image :src="getImageUrl(item)" :alt="item" class="flex overflow-hidden"
                    :imageClass="['p-2 transition-all transition-duration-500 transition-ease-in-out', isEquipped(item) ? 'opacity-100' : 'opacity-70']"
                    :imageStyle="{
                      filter: isEquipped(item) ? 'none' : 'grayscale(100%)',
                      scale: isEquipped(item) ? '1.1' : '1',
                      objectFit: 'cover'
                    }" />
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-content-end gap-2">
            <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
            <Button type="submit" label="Salvar" icon="pi pi-check" @click="saveUniform" />
          </div>
        </div>
      </div>
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
  opacity: 0.8;
  top: 0;
  left: 0
}
</style>

<script setup lang="ts">
import { ref, computed, nextTick, type PropType } from "vue";
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
import { getAssetUrl } from "@/functions/utils";

const items = defineModel('items', {
  type: Array as PropType<ILoadout[]>,
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

const confirmDelete = (uniform: ILoadout) => {
  confirm.require({
    message: 'Você tem certeza que deseja excluir este uniforme?',
    header: UNIFORMS[uniform.type_uniform as keyof typeof UNIFORMS],
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
        items.value = items.value.filter((item: ILoadout) => item.$id !== uniform.$id);

        toast.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Uniforme excluído com sucesso!",
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

const filters = ref({
  'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const checkUniformComplete = (uniform: ILoadout) => {
  return LOADOUT_ITEMS.every((field) => {

    if (!isItemMandatory(field.key, uniform.type_uniform)) {
      return true;
    }

    const value = (uniform as Record<string, any>)[field.key];
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
};

const editUniform = async (uniform: ILoadout) => {
  selectedUniform.value = { ...uniform };
  uniformDialog.value = true;
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

    const response = await LoadoutService.upsert(selectedUniform.value.$id, payload) as unknown as ILoadout;

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
}

const isEquipped = (key: string) => {
  return !!selectedUniform.value[key as keyof ILoadout];
};

const toggleItem = (key: string) => {
  const currentKey = key as keyof ILoadout;
  (selectedUniform.value as any)[currentKey] = !selectedUniform.value[currentKey];
};

const getImageUrl = (itemKey: string) => {
  let fileName = itemKey;

  if (CAMO_DEPENDENT_ITEMS.includes(itemKey)) {
    fileName = `${itemKey}_${selectedUniform.value.type_uniform}`;
  }

  return getAssetUrl(`${fileName}.webp`);
};

const getTypeUniform = () => {
  return getAssetUrl(`type_uniform_${selectedUniform.value.type_uniform}.webp`);
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