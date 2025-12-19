<template>
  <div class="flex flex-column align-items-center gap-4 py-4">

    <Button label="Baixar para Stories" icon="pi pi-instagram" @click="downloadCard" :loading="generatingImage"
      severity="help" raised />

    <div ref="cardRef"
      class="story-layout bg-gray-900 text-white relative overflow-hidden flex flex-column align-items-center justify-content-between">

      <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
      </div>

      <div
        class="w-full p-4 flex justify-content-between align-items-center relative z-1 border-bottom-1 border-white-alpha-10">
        <div class="flex flex-column">
          <span class="text-sm text-gray-400 font-bold tracking-widest">Registro Tático</span>
          <span class="text-sm text-gray-400 tracking-widest">{{ operator.$id }}</span>
        </div>
        <span class="text-sm text-gray-400">{{ new Date().toLocaleDateString('pt-BR') }}</span>
      </div>

      <div class="flex flex-column align-items-center w-full px-4 relative z-1 flex-grow-1 justify-content-center">

        <div class="relative mb-3">
          <Avatar :image="operator.avatar" shape="circle" class="border-3 border-green-500 shadow-8"
            style="width: 180px; height: 180px; object-fit: cover;" />
          <div class="absolute -bottom-3 left-0 w-full flex justify-content-center">
            <Tag :value="CATEGORIES[operator.category] || 'OPERADOR'" severity="warning" class="text-lg px-3 shadow-4">
            </Tag>
          </div>
        </div>

        <div class="text-center mt-4 mb-4">
          <h1 class="text-4xl font-bold uppercase m-0 text-green-400 tracking-wider"
            style="text-shadow: 0 0 10px rgba(34,197,94,0.5)">
            {{ operator.codename }}
          </h1>
          <p class="font-italic text-gray-300 mt-2 px-2 text-center" style="max-width: 300px; line-height: 1.4;">
            "{{ operator.quote || 'Sem frase definida.' }}"
          </p>
        </div>

        <div class="chart-wrapper flex align-items-center justify-content-center">
          <RadarStats :stats="calculatedStats" />
        </div>

        <div class="mt-4 flex align-items-center gap-3 px-4 py-2 border-round-2xl border-1 shadow-4" :style="{
          borderColor: currentTier.color,
          backgroundColor: currentTier.color + '15'
        }">
          <i :class="currentTier.icon" class="text-3xl" :style="{ color: currentTier.color }"></i>
          <div class="flex flex-column text-left">
            <span class="font-bold text-xl tracking-wider" :style="{ color: currentTier.color }">
              {{ currentTier.label }}
            </span>
            <span class="text-xs text-gray-400">CLASS RATING</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { toPng } from 'html-to-image';

import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Tag from 'primevue/tag';

import RadarStats from '@/components/gamification/RadarStats.vue';

import { RatingService } from '@/services/rating';
import { useAuthStore } from '@/stores/auth';
import { SKILL_ATTRIBUTES, CATEGORIES } from '@/constants/airsoft';

const { operator } = useAuthStore();
const cardRef = ref(null);
const generatingImage = ref(false);

const calculatedStats = reactive({});

onMounted(async () => {
  await calculateAverages(operator.$id);
});

const currentTier = computed(() => {
  const totalSkills = SKILL_ATTRIBUTES.length;
  let sum = 0;

  SKILL_ATTRIBUTES.forEach(attr => {
    sum += (calculatedStats[attr.key] || 0);
  });

  const finalAverage = totalSkills > 0 ? (sum / totalSkills) : 0;

  return RatingService.getTierByScore(finalAverage);
});

const calculateAverages = async (targetId) => {
  try {
    const { total, rows: ratings } = await RatingService.getRatingsForTarget(targetId);

    if (total === 0) {
      SKILL_ATTRIBUTES.forEach(attr => calculatedStats[attr.key] = 0);
      return;
    }

    SKILL_ATTRIBUTES.forEach(attr => {
      const key = attr.key;

      const sum = ratings.reduce((acc, vote) => {
        return acc + (Number(vote[key]) || 0);
      }, 0);

      calculatedStats[key] = Number((sum / total).toFixed(1));
    });

  } catch (error) {
    console.error("Erro ao calcular médias:", error);
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
    });

    const link = document.createElement('a');
    link.download = `${Date.now()}-${operator.$id}.png`;
    link.href = dataUrl;
    link.click();

  } catch (error) {
    console.error('Erro ao gerar o card:', error);
  } finally {
    generatingImage.value = false;
  }
};
</script>

<style scoped>
.story-layout {
  width: 100%;
  aspect-ratio: 9 / 16;
  max-width: 512px;
  background-color: #111827;
}

.chart-wrapper {
  width: 50%;
  aspect-ratio: 1;
}
</style>