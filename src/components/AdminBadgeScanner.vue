<template>
  <Card class="mt-4 border-round shadow-2">
    <template #title>
      <div class="flex align-items-center gap-2 text-primary">
        <i class="ri-radar-line text-2xl"></i>
        <span>Sincronização Tática de Conquistas</span>
      </div>
    </template>
    <template #content>
      <p class="mb-4 text-secondary">
        Este scanner analisa o comportamento, loadouts, financeiro e status de todos os
        operadores do <strong>{{ TEAM_NAME }}</strong> para atribuir novas medalhas acumulativas.
      </p>

      <div class="flex flex-column gap-3">
        <div v-if="loading" class="w-full">
          <ProgressBar :value="progress" class="mb-2" />
          <span class="text-sm">Processando operadores...</span>
        </div>

        <Button label="Iniciar Varredura Tática" icon="ri-shield-flash-line" :loading="loading" @click="startScan"
          class="w-full md:w-max" />

        <InlineMessage v-if="result" severity="success">
          Varredura concluída! {{ result.updated }} operadores receberam novas honrarias.
        </InlineMessage>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BadgeService } from '@/services/badge';
import { OperatorService, type IOperator } from '@/services/operator';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import InlineMessage from 'primevue/inlinemessage';
import { TEAM_NAME } from '@/constants/airsoft';
import { useOperator } from '@/composables/useOperator';

const { operator, updateState } = useOperator();

const loading = ref(false);
const progress = ref(0);
const result = ref<{ total: number, updated: number } | null>(null);
const toast = useToast();

const startScan = async () => {
  loading.value = true;
  progress.value = 0;
  result.value = null;

  try {
    const operators = await OperatorService.list();
    let updatedCount = 0;

    if (!operators.length) return result.value = null;

    for (let i = 0; i < operators.length; i++) {
      const op = operators[i] as IOperator;
      const updatedOp = await BadgeService.syncOperatorBadges(op);

      if (updatedOp.badges?.length !== (op.badges?.length || 0)) {
        updatedCount++;
      }

      if (updatedOp.$id === operator.value.$id) {
        await updateState(updatedOp);
      }

      progress.value = Math.round(((i + 1) / operators.length) * 100);
    }

    result.value = { total: operators.length, updated: updatedCount };
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Todas as patentes foram atualizadas.', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha na comunicação com a base tática.', life: 5000 });
  } finally {
    loading.value = false;
  }
};
</script>