<template>
  <div class="w-full flex flex-column align-items-center py-3">
    <div class="flex gap-2 mb-3">
      <Button label="Download" icon="pi pi-download" @click="downloadCard" :loading="generatingImage" severity="help"
        raised />
    </div>
    <div class="flex flex-column align-items-center justify-content-center mt-1">
      <div ref="cardRef" class="stacked-cards flex" tabindex="0" :style="styleDownloadCard">
        <div class="card front" :class="{ 'is-exporting': generatingImage }">
          <div class="flex flex-1 p-2 pb-0">
            <img v-if="operator.avatar" class="avatar" :src="operator.avatar" />
            <div class="flex flex-column gap-2">
              <span class="font-bold uppercase">{{ TEAM_NAME }}</span>
              <div class="info">
                <span class="label">Nome</span>
                <span class="name">{{ operator.name }}</span>
              </div>
              <div class="flex justify-content-between">
                <div class="info"> <span class="label">Data de Nascimento</span>
                  <span class="value">{{ dayjs(operator.birth_date).format('DD/MM/YYYY') || '30/07/1991' }}</span>
                </div>
                <div class="info">
                  <span class="label">Tipo Sanguíneo</span>
                  <span class="value text-red-500 font-bold">{{ operator.blood_type || 'O+' }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-content-between p-2">
            <div v-if="operator.health_plan" class="info">
              <span class="label">Plano de Saúde</span>
              <span class="value">{{ operator.health_plan_name || 'N/A' }} ({{ operator.health_plan_number ||
                'N/A' }})</span>
            </div>
            <div class="info">
              <span class="label">Ingressou</span>
              <span class="value">{{ dayjs(operator.$createdAt).format('DD/MM/YYYY') }}</span>
            </div>
          </div>
          <div class="footer bg-blue-900 text-blue-50 px-2">
            <div class="flex w-full justify-content-between">
              <div v-if="!generatingImage" class="info">
                <span class="label">Graduação</span>
                <Rating :modelValue="operator.rating" :stars="5" readonly :cancel="false" />
              </div>
              <div class="flex align-items-center gap-2 ml-auto">
                <div class="info text-right">
                  <span class="label text-yellow-500">Nº FBDA</span>
                  <span class="value">{{ operator.number_fdba || 'N/A' }}</span>
                </div>
                <img src="/fbda.webp" alt="FBDA" class="w-3rem">
              </div>
            </div>
          </div>
        </div>
        <div class="card back" :class="{ 'is-exporting': generatingImage }">
          <div class="flex flex-column flex-1 p-2 pb-0">
            <div class="flex w-full justify-content-between">
              <div class="info">
                <QrcodeVue :value="operator.$id" :size="60" background="#fff" :margin="2" render-as="svg" />
              </div>
              <div class="info">
                <QrcodeVue value="https://instagram.com/exodoairsoft" :size="60" background="#fff" :margin="2"
                  render-as="svg" />
              </div>
            </div>
            <div class="info flex-1 align-items-end justify-content-end pb-2">
              <span class="label">Validade</span>
              <span class="value">{{ dayjs(operator.$createdAt).add(1, 'year').format('MM/YYYY') }}</span>
            </div>
          </div>
          <div class="footer bg-blue-900 text-blue-50 px-2">
            <div class="flex justify-content-center">
              <span class="label">{{ TEAM_MOTTO }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue';
import dayjs from 'dayjs';
import { TEAM_NAME, TEAM_MOTTO } from '@/constants/airsoft';
import { useOperator } from '@/composables/useOperator';
import { toPng } from 'html-to-image';
import QrcodeVue from 'qrcode.vue';

const { operator } = useOperator();

const cardRef = ref(null);
const generatingImage = ref(false);

const downloadCard = async () => {
  if (!cardRef.value) return;
  generatingImage.value = true;

  await nextTick();

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
    cardRef.value = null;
  }
};

const styleDownloadCard = computed(() => ({
  width: generatingImage.value ? 'calc(85.6mm * 2)' : '85.6mm'
}));

// const verifyOperator = computed(() => `${window.location.origin}/verify/operator/${operator.value.$id}`);
</script>

<style scoped>
.stacked-cards {
  position: relative;
  cursor: pointer;
  height: 53.98mm;
}

.card {
  width: 85.6mm;
  height: 53.98mm;
  top: 0;
  left: 0;
  position: absolute;
  width: 100%;
  height: 100%;
  transition: all 0.9s cubic-bezier(0.23, 1, 0.32, 1);

  background-color: var(--p-gray-200);

  /* ADICIONE ISSO AQUI: */
  background-image: url('/exd.webp');
  background-repeat: no-repeat;
  background-size: contain;
  background-blend-mode: overlay;
  background-position: center center;
  /* position: relative; */
  overflow: hidden;
  border: 1px solid var(--p-gray-300);
  color: var(--p-blue-900);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card.is-exporting {
  position: relative !important;
  transition: none !important;
  transform: none !important;
  opacity: 1 !important;
}

.avatar {
  width: 80px;
  height: 106px;
  object-fit: cover;
  border: 1px solid #ccc;
  margin-right: 0.5rem;
}

.info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.1rem;
}

.label {
  color: var(--p-blue-500);
  display: block;
  font-size: 0.6rem;
  text-transform: uppercase;
  font-weight: 800;
}

.name,
.value {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.footer {
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer .label {
  color: var(--p-blue-50);
}

.front {
  z-index: 2;
  transform: translateX(0) scale(1);
}

.back {
  z-index: 1;
  transform: translateY(-16px) scale(0.9);
  opacity: 0.8;
}

.stacked-cards:hover .front,
.stacked-cards:focus .front {
  z-index: 1;
  transform: translateY(-16px) scale(0.9);
  opacity: 0.8;
}

.stacked-cards:hover .back,
.stacked-cards:focus .back {
  z-index: 2;
  transform: translateY(0) scale(1);
  opacity: 1;
}

.front::before {
  background-position: 0% center;
}

.back::before {
  background-position: 80% center;
}

:deep(.p-rating-icon) {
  width: 0.8rem;
  height: 0.8rem;
  font-size: 0.8rem;
}
</style>