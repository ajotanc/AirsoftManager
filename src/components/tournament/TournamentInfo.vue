<template>
  <div class="info-grid grid mb-3">
    <div class="info-card col-12">
      <div class="info-card-bg">NAME</div>
      <div class="info-label">🏆 Nome</div>
      <div class="info-value">{{ tournament.name }}</div>
      <div class="info-description">{{ tournament.description }}</div>
    </div>
  </div>
  <div class="info-grid grid">
    <div class="info-card col-12 md:col-4 lg:col-2">
      <div class="info-card-bg">DATE</div>
      <div class="info-label">📅 Data</div>
      <div class="info-value">{{ formattedDate }}</div>
    </div>
    <div class="info-card col-12 md:col-4 lg:col-2" :class="{
      'accent-green': tournament.status === 'ongoing',
      'accent-red': tournament.status === 'finished',
    }">
      <div class="info-card-bg">STA</div>
      <div class="info-label">🚨 Situação</div>
      <div class="info-value">{{ STATUS_LABEL[tournament.status] }}</div>
    </div>
    <div class="info-card col-12 md:col-4 lg:col-2">
      <div class="info-card-bg">TYPE</div>
      <div class="info-label">⚔️ Tipo</div>
      <div class="info-value">{{ typeLabel }}</div>
    </div>
    <div class="info-card col-12 md:col-4 lg:col-2">
      <div class="info-card-bg">MODE</div>
      <div class="info-label">👥 Modo</div>
      <div class="info-value">{{ tournament.mode }}v{{ tournament.mode }}</div>
    </div>
    <div class="info-card col-12 md:col-4 lg:col-2">
      <div class="info-card-bg">CLS</div>
      <div class="info-label">🎖️ Classe</div>
      <div class="info-value">{{ classLabel }}</div>
    </div>
    <div class="info-card col-12 md:col-4 lg:col-2" :class="{ 'accent-green': tournament.is_paid }">
      <div class="info-card-bg">{{ tournament.is_paid ? 'PAID' : 'FREE' }}</div>
      <div class="info-label">💰 Inscrição</div>
      <div class="info-value">{{ tournament.is_paid ? `R$ ${formatCurrency(tournament.price)}` : 'Gratuito' }}</div>
    </div>
    <div class="info-card col-12 md:col-12 gold">
      <div class="info-card-bg">AWDS</div>
      <div class="info-label">🎁 Prêmios</div>
      <div class="info-value">
        <div class="flex flex-column md:flex-row awards-list md:gap-3">
          <div v-for="(award, index) in tournament.awards" :key="index" :class="['award-item md:pr-3 md:border-right-1 border-blue-200', {
            'rank-1': index === 0,
            'rank-2': index === 1,
            'rank-3': index === 2,
          }]">{{ award }}</div>
        </div>
      </div>
    </div>

    <!-- Actions / Enrollment Section -->
    <div class="info-card col-12 accent-red">
      <div class="info-card-bg">JOIN</div>
      <div class="flex flex-column sm:flex-row align-items-start sm:align-items-center justify-content-between gap-3">
        <div>
          <div class="info-label">📝 Inscrição de Operador</div>
          <div class="text-xs text-400 mt-1" v-if="!userRegistration">
            {{ tournament.is_paid ? `Valor: R$ ${formatCurrency(tournament.price)} (via PIX)` : 'Torneio Gratuito' }}
          </div>
          <div class="text-xs text-400 mt-1" v-else-if="userRegistration.status === 'confirmed'">
            Você já está inscrito neste torneio!
          </div>
          <div class="text-xs text-400 mt-1" v-else>
            Comprovante enviado. Aguardando aprovação do pagamento pelo financeiro.
          </div>
        </div>

        <div class="flex align-items-center gap-2 w-full sm:w-auto">
          <Tag v-if="userRegistration?.status === 'confirmed'" value="Inscrição Confirmada" severity="success" icon="pi pi-check" class="font-bold text-sm px-3 py-2" />
          
          <template v-else-if="userRegistration?.status === 'pending'">
            <Tag value="Aguardando Confirmação" severity="warn" icon="pi pi-clock" class="font-bold text-sm px-3 py-2" />
          </template>

          <template v-else>
            <Button
              v-if="tournament.status === 'open'"
              :label="tournament.is_paid ? 'Inscrever-se & Pagar' : 'Inscrever-se Grátis'"
              :icon="tournament.is_paid ? 'pi pi-dollar' : 'pi pi-user-plus'"
              severity="warning"
              class="font-bold shadow-2 w-full sm:w-auto"
              :loading="submitting"
              @click="handleRegister"
            />
            <Tag v-else value="Inscrições Encerradas" severity="secondary" class="font-semibold text-xs" />
          </template>
        </div>
      </div>
    </div>
  </div>

  <PaymentDialog v-model:visible="paymentDialog" :payment="selectedPayment" @submit="savePayment" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { formatCurrency } from '@brazilian-utils/brazilian-utils';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';

import { STATUS_LABEL, TournamentService, type ITournament, type ITournamentRegistration } from '@/services/tournament';
import { PaymentService, type IPayment } from '@/services/payment';
import { useOperator } from '@/composables/useOperator';
import PaymentDialog from '@/components/PaymentDialog.vue';

interface Props {
  tournament: ITournament;
}

const props = defineProps<Props>();
const emit = defineEmits(['registered']);

const toast = useToast();
const { operator } = useOperator();

const userRegistration = ref<ITournamentRegistration | null>(null);
const paymentDialog = ref(false);
const selectedPayment = ref<IPayment | null>(null);
const submitting = ref(false);

const formattedDate = computed(() => {
  if (!props.tournament.date) return '-';
  return dayjs(props.tournament.date).format('DD MMM. YYYY');
});

const typeLabel = computed(() => {
  const map: Record<string, string> = {
    knockout: 'Eliminatória',
    bo3: 'Melhor de 3',
    bo5: 'Melhor de 5',
  };
  return map[props.tournament.type] ?? props.tournament.type;
});

const classLabel = computed(() => {
  if (props.tournament.allowed_class === 'all') return 'Livre';
  if (props.tournament.allowed_class === 'pistol') return 'Pistola';
  if (props.tournament.allowed_class === 'assault') return 'Fuzil';
  if (props.tournament.allowed_class === 'dmr') return 'DMR';
  if (props.tournament.allowed_class === 'sniper') return 'Sniper';
  return props.tournament.allowed_class;
});

const checkRegistration = async () => {
  if (!props.tournament?.$id || !operator.value?.$id) return;
  try {
    userRegistration.value = await TournamentService.getUserRegistration(props.tournament.$id, operator.value.$id);
  } catch (error) {
    console.error('Erro ao verificar inscrição do operador:', error);
  }
};

watch(() => [props.tournament?.$id, operator.value?.$id], checkRegistration, { immediate: true });

const handleRegister = async () => {
  if (!operator.value?.$id) {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Operador não identificado.', life: 3000 });
    return;
  }

  // Restriction check
  if (props.tournament.allowed_class && !TournamentService.checkRestriction(operator.value, props.tournament.allowed_class)) {
    toast.add({
      severity: 'error',
      summary: 'Restrição de Categoria',
      detail: 'Você não possui réplicas cadastradas no arsenal compatíveis com a categoria deste torneio.',
      life: 3000,
    });
    return;
  }

  if (!props.tournament.is_paid) {
    // Free tournament direct registration
    try {
      submitting.value = true;
      const newRegistration = await TournamentService.registerOperator(props.tournament.$id, operator.value.$id, 'confirmed');

      toast.add({
        severity: 'success',
        summary: 'Inscrição Confirmada!',
        detail: 'Sua inscrição no torneio foi realizada com sucesso.',
        life: 4000,
      });
      await checkRegistration();
      emit('registered', newRegistration);
    } catch (error) {
      console.error('Erro ao realizar inscrição:', error);
      toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao realizar inscrição.', life: 3000 });
    } finally {
      submitting.value = false;
    }
  } else {
    // Paid tournament: setup payment dialog
    const now = dayjs();

    selectedPayment.value = {
      description: `Inscrição Torneio: ${props.tournament.name}`,
      amount: props.tournament.price,
      status: 'pending',
      category: 'tournament_registration',
      reference: dayjs(props.tournament.date).format("MM/YYYY"),
      due_date: now.toISOString(),
      operator: operator.value.$id,
      tournament: props.tournament.$id
    } as IPayment;

    paymentDialog.value = true;
  }
};

const savePayment = async ({ file, amount }: { file: File; amount: number }) => {
  if (!selectedPayment.value || !operator.value?.$id) return;

  try {
    submitting.value = true;
    const payload = { ...selectedPayment.value, amount } as IPayment;

    await PaymentService.contribute(payload, file);
    const newRegistration = await TournamentService.registerOperator(props.tournament.$id, operator.value.$id, 'pending');

    toast.add({
      severity: 'success',
      summary: 'Comprovante Enviado!',
      detail: 'Sua inscrição foi enviada e aguarda confirmação do pagamento.',
      life: 4000,
    });

    await checkRegistration();
    emit('registered', newRegistration);
  } catch (error) {
    console.error('Erro ao enviar comprovante de inscrição:', error);
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao enviar comprovante de inscrição.', life: 3000 });
  } finally {
    submitting.value = false;
    paymentDialog.value = false;
  }
};
</script>
