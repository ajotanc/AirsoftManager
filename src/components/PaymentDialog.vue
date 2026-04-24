<template>
  <Dialog :visible="visible" @update:visible="$emit('update:visible', $event)"
    :header="payment?.description || 'Efetuar Pagamento'" modal :closable="true" :key="payment?.$id"
    :style="{ width: '90vw', maxWidth: '375px' }">
    <div class="grid">
      <div v-if="payment?.category === 'goal'" class="col-12">
        <FloatLabel>
          <InputNumber v-model="localAmount" mode="currency" currency="BRL" locale="pt-BR" :min="1" fluid />
          <label>Quanto deseja contribuir?</label>
        </FloatLabel>
      </div>

      <div class="col-12 flex flex-column align-items-center gap-3">
        <div v-if="loading"
          class="flex justify-content-center align-items-center w-full border-1 border-round border-blue-300 relative"
          style="height: 326px">
          <Skeleton width="276px" height="276px" border-radius="0" />
          <span class="absolute"><i class="ri-loop-right-line icon-spinner"></i> Atualizando QR Code...</span>
        </div>
        <img v-else :src="localPixData.base64" alt="QR Code Pix" class="w-full border-1 border-round border-blue-300" />

        <InputGroup>
          <IftaLabel>
            <InputText id="pix-copy" :value="localPixData.payload" readonly fluid />
            <label for="pix-copy">Código PIX Copia e Cola</label>
          </IftaLabel>
          <InputGroupAddon>
            <Button icon="pi pi-copy" @click="copyPix" class="h-full" :disabled="loading" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <Divider class="px-2 m-2" />

      <div class="col-12 pb-0">
        <FileUpload accept="image/*, application/pdf" customUpload @uploader="onUploader" :maxFileSize="MAX_FILE_SIZE"
          fluid chooseLabel="Buscar" uploadLabel="Enviar" :cancel-button-props="{ style: { display: 'none' } }">
          <template #empty>
            <span class="text-sm">Selecione o comprovante após pagar.</span>
          </template>
        </FileUpload>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  Dialog, Button, InputText, InputNumber, InputGroup, InputGroupAddon,
  FileUpload, Divider, FloatLabel, useToast, Skeleton
} from 'primevue';
import type { FileUploadUploaderEvent } from 'primevue/fileupload';
import { PaymentService, type IPayment } from '@/services/payment';

interface IProps {
  visible: boolean;
  payment: IPayment | null;
}

const props = defineProps<IProps>();
const emit = defineEmits(['update:visible', 'submit']);

const toast = useToast();
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const localAmount = ref<number>(0);
const loading = ref(false);
const localPixData = ref({ payload: '', base64: '' });

let debounceTimer: ReturnType<typeof setTimeout>;

const fetchPixData = async (amount: number) => {
  if (!props.payment) return;

  loading.value = true;
  try {
    const data = await PaymentService.generatePix(
      amount,
      props.payment.description,
      props.payment.$id
    );
    localPixData.value = data;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível gerar o QR Code.', life: 3000 });
  } finally {
    loading.value = false;
  }
};

watch(() => props.visible, async (isOpen) => {
  if (isOpen && props.payment) {
    localAmount.value = props.payment.amount || 0;
    await fetchPixData(localAmount.value);
  }
});

watch(localAmount, (newValue, oldValue) => {
  if (newValue === oldValue || newValue <= 0) return;

  loading.value = true;
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    await fetchPixData(newValue);
  }, 800);
});

const copyPix = () => {
  navigator.clipboard.writeText(localPixData.value.payload);
  toast.add({ severity: 'success', summary: 'Copiado', detail: 'PIX copiado!', life: 2000 });
};

const onUploader = (event: FileUploadUploaderEvent) => {
  const file = Array.isArray(event.files) ? event.files[0] : event.files;
  if (!file) return;

  emit('submit', {
    file,
    amount: localAmount.value
  });
};
</script>