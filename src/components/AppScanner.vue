<template>
  <Dialog v-model:visible="visible" :header="header" :modal="true"
    :style="{ width: '100%', maxWidth: '384px', overflow: 'hidden' }" class="m-3"
    :contentStyle="{ padding: '0', display: 'flex', flexDirection: 'column' }" @hide="onClose">
    <div class="relative scanner-viewport">
      <QrcodeStream class="qrcode-stream-wrapper" @detect="onDetectInternal" @init="onInit" :track="paintOutline"
        :constraints="{ facingMode }">
        <div class="scanner-overlay">
          <div class="scanner-frame"></div>

          <SelectButton v-model="facingMode" :options="cameraOptions" optionLabel="label" optionValue="value"
            class="camera-switch" :allowEmpty="false" />

          <div class="scanner-instructions">
            <p class="text-xs m-0">Posicione o QR Code dentro da linha e aguarde.</p>
            <p class="text-xs opacity-70 m-0">A leitura é automática.</p>
          </div>
        </div>
      </QrcodeStream>

      <div v-if="scannerError" class="center-all p-3 bg-red-900 text-white w-full text-center z-5">
        {{ scannerError }}
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QrcodeStream, type DetectedBarcode } from 'vue-qrcode-reader';
import { Dialog, SelectButton } from 'primevue';

interface Props {
  header?: string;
}

withDefaults(defineProps<Props>(), {
  header: 'QR Code'
});

const visible = defineModel<boolean>('visible');
const emit = defineEmits<{
  detect: [code?: string];
  error: [message: string];
}>();

const facingMode = ref<'environment' | 'user'>('environment');
const scannerError = ref('');

const cameraOptions = [
  { label: 'Traseira', value: 'environment' },
  { label: 'Frontal', value: 'user' }
];

// Desenha a linha verde ao redor do código detectado
function paintOutline(detectedCodes: DetectedBarcode[], ctx: CanvasRenderingContext2D) {
  for (const { cornerPoints } of detectedCodes) {
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cornerPoints[0].x, cornerPoints[0].y);
    cornerPoints.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(cornerPoints[0].x, cornerPoints[0].y);
    ctx.stroke();
  }
}

// Emite o valor detectado para o componente pai
function onDetectInternal(detectedCodes: DetectedBarcode[]) {
  if (detectedCodes.length > 0) {
    const code = detectedCodes[0]?.rawValue;
    emit('detect', code);
  }
}

async function onInit(promise: Promise<any>) {
  try {
    scannerError.value = '';
    await promise;
  } catch (err: any) {
    scannerError.value = err.name === 'NotAllowedError' ? 'Sem permissão de câmera' : 'Erro ao iniciar câmera';
    emit('error', scannerError.value);
  }
}

function onClose() {
  scannerError.value = '';
}
</script>

<style scoped>
.scanner-viewport {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  /* border-radius: var(--p-dialog-border-radius); */
}

.scanner-overlay {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  z-index: 1;
  padding-block: 2rem;
  background: transparent;
  position: relative;
}

.qrcode-stream-wrapper {
  width: 100%;
  height: 100%;
}

.scanner-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 260px;
  height: 260px;
  border: 0.5rem solid;
  border-image: linear-gradient(to bottom left, var(--p-blue-500), var(--p-red-500), var(--p-yellow-500), var(--p-yellow-500), var(--p-red-500), var(--p-blue-500)) 1;
  box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.6);
  pointer-events: none;
  z-index: 2;
}

.scanner-instructions {
  text-align: center;
  color: white;
  z-index: 2;
  padding: 0 1rem;
  font-weight: 500;
}

:deep(.col-4, col-6, .col-12) {
  padding: 0 !important;
}

:deep(.camera-switch) {
  z-index: 3;
}
</style>