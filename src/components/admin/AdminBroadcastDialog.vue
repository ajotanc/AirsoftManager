<template>
  <AppFormDialog v-model:visible="visible" header="Central de Comunicados & IA" :fields="broadcastFields"
    :resolver="resolver" :initialValues="initialValues" submitLabel="Gerar Mensagem" cancelLabel="Fechar"
    :loading="isGenerating" @submit="handleGenerate" @field-change="onFieldChange">
    <template #extra-actions>
      <div v-if="initialValues.messageText" class="col-12 flex flex-column md:flex-row gap-2">
        <Button label="Compartilhar no WhatsApp" icon="pi pi-whatsapp" severity="success" fluid
          @click="shareWhatsApp" />
        <Button label="Copiar Texto" icon="pi pi-copy" severity="secondary" fluid @click="copyToClipboard" />
      </div>
    </template>
  </AppFormDialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { z } from 'zod';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import { useToast } from 'primevue';

import { TEAM_NAME } from '@/constants/airsoft';
import AppFormDialog from '@/components/AppFormDialog.vue';
import type { IFields } from '@/functions/utils';
import { isBirthdayTodayOrYesterday } from '@/functions/utils';
import { GeminiService, type BroadcastPromptType } from '@/services/gemini';
import { OperatorService, type IOperator } from '@/services/operator';

interface IBroadcastForm {
  promptType: BroadcastPromptType;
  operatorId?: string;
  extraContext?: string;
  messageText?: string;
}

const visible = defineModel<boolean>('visible', { default: false });
const toast = useToast();

const isGenerating = ref(false);
const activeOperators = ref<IOperator[]>([]);

const initialValues = ref<IBroadcastForm>({
  promptType: 'school_reminder',
  operatorId: '',
  extraContext: '',
  messageText: ''
});

onMounted(async () => {
  try {
    const birthdays = await OperatorService.listBirthdays();
    activeOperators.value = birthdays.filter(op => isBirthdayTodayOrYesterday(op.birth_date));
  } catch (e) {
    console.error("Erro ao carregar lista de aniversariantes:", e);
  }
});

const typeOptions = [
  { label: '🎓 Lembrete de Prova (Escola Êxodo)', value: 'school_reminder' },
  { label: '🚨 Urgência de Recuperação Tática', value: 'recovery_reminder' },
  { label: '🎂 Parabéns ao Aniversariante do Dia', value: 'birthday_reminder' },
  { label: '💳 Lembrete de Mensalidade do Time', value: 'monthly_fee_reminder' },
  { label: '🪖 Comunicado Tático Geral', value: 'custom' },
];

const broadcastFields = computed<IFields[]>(() => [
  {
    name: 'promptType',
    label: 'Tipo de Comunicado',
    component: Select,
    col: '12',
    props: {
      options: typeOptions,
      optionLabel: 'label',
      optionValue: 'value',
      'onUpdate:modelValue': (val: BroadcastPromptType) => {
        initialValues.value.promptType = val;
        initialValues.value.messageText = '';
        initialValues.value.operatorId = '';
        initialValues.value.extraContext = '';
      }
    }
  },
  {
    name: 'operatorId',
    label: 'Aniversariante',
    component: Select,
    col: '12',
    hidden: initialValues.value.promptType !== 'birthday_reminder',
    props: {
      options: activeOperators.value,
      optionLabel: 'codename',
      optionValue: '$id',
      filter: true
    }
  },
  {
    name: 'extraContext',
    label: 'Contexto do Comunicado',
    component: InputText,
    col: '12',
    hidden: initialValues.value.promptType !== 'custom'
  },
  {
    name: 'messageText',
    label: 'Mensagem Formatada',
    component: Textarea,
    col: '12',
    props: {
      rows: 6,
      autoResize: true
    }
  }
]);

const broadcastSchema = z.object({
  promptType: z.string({ error: 'Selecione o tipo de comunicado' }),
  operatorId: z.string().optional().nullable(),
  extraContext: z.string().optional().nullable(),
  messageText: z.string().optional().nullable(),
}).refine((data) => {
  if (data.promptType === 'birthday_reminder' && !data.operatorId) {
    return false;
  }
  return true;
}, {
  message: 'Selecione o aniversariante na lista',
  path: ['operatorId']
});

const resolver = ref(zodResolver(broadcastSchema));

const onFieldChange = ({ name, value }: { name: keyof IBroadcastForm; value: IBroadcastForm[keyof IBroadcastForm] }) => {
  initialValues.value = {
    ...initialValues.value,
    [name]: value
  };

  if (name !== 'messageText') {
    initialValues.value.messageText = '';
  }
};

const handleGenerate = async (values: IBroadcastForm) => {
  isGenerating.value = true;
  try {
    const selectedOp = values.promptType === 'birthday_reminder'
      ? activeOperators.value.find(op => op.$id === values.operatorId)
      : undefined;

    const text = await GeminiService.generateBroadcast({
      promptType: values.promptType,
      operatorName: selectedOp?.name,
      codename: selectedOp?.codename,
      operatorId: selectedOp?.$id,
      extraContext: values.extraContext
    });

    initialValues.value = {
      promptType: values.promptType,
      operatorId: values.promptType === 'birthday_reminder' ? values.operatorId : '',
      extraContext: values.promptType === 'custom' ? values.extraContext : '',
      messageText: text
    };
    
    toast.add({ severity: 'success', summary: 'Gerado com Sucesso!', detail: 'Mensagem pronta para compartilhamento.', life: 3000 });
  } catch (error) {
    console.error("Erro ao gerar mensagem:", error);
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao gerar comunicado.', life: 3000 });
  } finally {
    isGenerating.value = false;
  }
};

const shareWhatsApp = async () => {
  if (!initialValues.value.messageText) return;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Comunicado ${TEAM_NAME}`,
        text: initialValues.value.messageText,
      });
      return;
    } catch (e) {
      // Fallback para link WhatsApp se o diálogo Web Share for descartado
    }
  }

  const encodedText = encodeURIComponent(initialValues.value.messageText);
  window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
};

const copyToClipboard = async () => {
  if (!initialValues.value.messageText) return;

  try {
    await navigator.clipboard.writeText(initialValues.value.messageText);
    toast.add({ severity: 'info', summary: 'Copiado!', detail: 'Mensagem copiada para a área de transferência.', life: 3000 });
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível copiar o texto.', life: 3000 });
  }
};
</script>
