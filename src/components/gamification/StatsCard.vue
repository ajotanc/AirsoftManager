<template>
  <div class="w-full flex flex-column align-items-center">
    <div v-if="buttons" class="flex gap-2 mb-3">
      <FileUpload mode="basic" @select="onFileSelect" customUpload auto chooseLabel="Trocar Imagem"
        chooseIcon="pi pi-image" />
      <Button severity="danger" icon="pi pi-times" :disabled="!img" @click="img = null" />
      <Button label="Download" icon="pi pi-instagram" @click="downloadCard" :loading="generatingImage" severity="help"
        raised />
    </div>

    <div ref="cardRef" class="card-wrapper text-gray-100">
      <div class="flex flex-column align-items-start p-3">
        <div class="flex w-full justify-content-between align-items-center">
          <div class="flex flex-column">
            <span class="text-xs font-bold text-yellow-500 uppercase mb-2">{{ TEAM_NAME }}</span>
            <span class="text-xs font-light uppercase">{{ getShortName(operator.name) }}</span>
            <span class="text-3xl font-bold uppercase">{{ operator.codename }}</span>
            <div class="flex align-items-center gap-1 uppercase text-xs">
              <span>Nível {{ operator.level }}</span>
              <span>·</span>
              <span>{{ getSpecialtyLabel(operator.category) }}</span>
              <span>·</span>
              <span class="font-bold" :style="{
                backgroundColor: currentTier.backgroundColor,
                color: currentTier.color,
                padding: '3px 4px',
                borderRadius: '4px'
              }">{{ currentTier.label
              }}</span>
            </div>
          </div>
          <div class="flex flex-column align-items-center gap-1">
            <img src="/exd.webp" :alt="TEAM_NAME" class="w-5rem" />
            <Rating v-model="operator.rating" readonly />
          </div>
        </div>
        <span class="text-xs font-italic mt-2" v-if="operator.quote">"{{ operator.quote.trim() }}"</span>
      </div>
      <div class="card-content">
        <div class="p-4">
          <RadarStats :stats="calculatedStats" width="240px" height="240px" />
        </div>
        <div class="w-full flex justify-content-between align-items-center text-xs">
          <div class="flex flex-column">
            <span class="font-bold">Registro Tático</span>
            <span>{{ operator.$id }}</span>
          </div>
          <span>{{ new Date().toLocaleDateString('pt-BR') }}</span>
        </div>
      </div>
      <div class="avatar-wrapper">
        <img :src="(img as string) || operator.avatar" :alt="operator.codename" class="avatar" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { toPng } from 'html-to-image';

import Button from 'primevue/button';

import RadarStats from '@/components/gamification/RadarStats.vue';

import { RatingService } from '@/services/rating';
import { MIN_VOTES_REQUIRED, SKILL_ATTRIBUTES } from '@/constants/airsoft';
import type { IOperator } from '@/services/operator';
import type { PropType } from 'vue';
import { getSpecialtyLabel, getShortName } from '@/functions/utils'
import { TEAM_NAME } from '@/constants/airsoft';
import type { FileUploadSelectEvent } from 'primevue';

const operator = defineModel('operator', {
  type: Object as PropType<IOperator>,
  default: () => ({} as IOperator),
});

const props = defineProps<{
  buttons?: boolean;
}>();

const cardRef = ref(null);
const generatingImage = ref(false);

const img = ref<string | ArrayBuffer | null>(null);
const calculatedStats = reactive<Record<string, number>>({});

onMounted(async () => {
  await calculateAverages(operator.value.$id);
});

const currentTier = computed(() => {
  const totalSkills = SKILL_ATTRIBUTES.length;
  let sum = 0;

  SKILL_ATTRIBUTES.forEach(attr => {
    sum += (calculatedStats[attr.field] || 0);
  });

  const finalAverage = totalSkills > 0 ? (sum / totalSkills) : 0;
  return RatingService.getTierByScore(finalAverage);
});

const calculateAverages = async (targetId: string) => {
  try {
    const { total, rows: ratings } = await RatingService.getRatingsForTarget(targetId);

    // CONFIGURAÇÃO TÁTICA
    // m = MIN_VOTES_REQUIRED (Quantos votos são necessários para atingir o potencial máximo da nota)

    SKILL_ATTRIBUTES.forEach(attr => {
      const fieldName = attr.field;

      if (total === 0) {
        calculatedStats[fieldName] = 0;
        return;
      }

      const sum = ratings.reduce((acc, vote) => {
        const attrs = vote.attributes ? JSON.parse(vote.attributes) : {};
        return acc + (Number(attrs[fieldName]) || 0);
      }, 0);

      // 1. Média Real (ex: 1 voto de 5 = média 5.0)
      const realAverage = sum / total;

      // 2. Fator de Confiança (Se tem 1 voto de 10 necessários, o fator é 0.1)
      const confidenceFactor = Math.min(total / MIN_VOTES_REQUIRED, 1);

      // 3. Resultado Final: Média Real x Confiança
      // Ex: 1 voto '5' com meta de 10 votos: 5.0 * 0.1 = 0.5 de nota no radar.
      const finalScore = realAverage * confidenceFactor;

      calculatedStats[fieldName] = Number(finalScore.toFixed(1));
    });
  } catch (error) {
    console.error("Erro ao processar médias dinâmicas:", error);
  }
};

const downloadCard = async () => {
  if (!cardRef.value) return;
  generatingImage.value = true;

  try {
    const dataUrl = await toPng(cardRef.value, {
      quality: 1.0,
      cacheBust: true,
      skipFonts: true,
      pixelRatio: 3,
    });

    const link = document.createElement('a');
    link.download = `${Date.now()}-${operator.value.$id}.png`;
    link.href = dataUrl;
    link.click();

  } catch (error) {
    console.error('Erro ao gerar o card:', error);
  } finally {
    generatingImage.value = false;
  }
};

const onFileSelect = (event: FileUploadSelectEvent) => {
  const file = event.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    img.value = reader.result;
  };

  reader.readAsDataURL(file);
};
</script>

<style scoped>
.brand {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.card-wrapper {
  width: 100%;
  aspect-ratio: 9 / 16;
  max-width: 360px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  /* ADICIONE ISSO AQUI: */
  isolation: isolate;
  background-color: #000;
}

.card-content {
  flex: 1;
  width: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: end;
  z-index: 1
}

.avatar-wrapper {
  position: absolute;
  overflow: hidden;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.avatar-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(0, 0, 0, 0.75);
  /* background: linear-gradient(to bottom,
      rgba(0, 0, 0, 0.8) 0%,
      transparent 80%,
      transparent 20%,
      rgba(0, 0, 0, 0.8) 100%); */

}

.avatar {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

:deep(.p-rating-icon) {
  width: 0.75rem !important;
}
</style>