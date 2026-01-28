<template>
  <div class="carousel-container w-full overflow-hidden px-2">
    <Carousel :key="dtValue.length" :circular="dtValue.length > 5" :showNavigators="dtValue.length > 1" :value="dtValue"
      :numVisible="5" :numScroll="1" :responsiveOptions="responsiveOptions" :autoplayInterval="4000">

      <template #item="{ data }">
        <div v-if="loading" class="p-2">
          <Skeleton width="100%" height="20rem" borderRadius="16px" />
        </div>

        <template v-else>
          <div class="p-2 h-full">
            <Card class="h-full border-1 border-white-alpha-10 overflow-hidden shadow-3">
              <template #header>
                <div class="relative">
                  <div class="absolute top-0 right-0 m-2 z-1 flex gap-2">
                    <Tag v-if="data.isExpired" value="Finalizado" severity="danger" class="shadow-4" />
                    <Tag :value="`${calculatePercent(data)}%`" severity="warn" class="shadow-3" />
                  </div>

                  <div v-if="data.image_url && isValidUrl(data.image_url)" class="w-full" :style="{
                    height: '10rem',
                    backgroundImage: `url(${data.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }" />
                  <div v-else class="flex align-items-center justify-content-center bg-gray-800" style="height: 10rem;">
                    <i class="pi pi-image text-4xl text-gray-700"></i>
                  </div>
                </div>
              </template>

              <template #title>
                <div class="flex flex-column gap-1">
                  <span class="text-lg font-bold text-gold-500 line-clamp-1">{{ data.title }}</span>
                  <p class="text-sm font-normal text-gray-500 line-clamp-2 m-0">
                    {{ data.description }}
                  </p>
                </div>
              </template>

              <template #content>
                <div class="flex flex-column gap-3 text-gray-500 mt-1">
                  <div class="flex flex-column">
                    <div class="flex justify-content-between text-xs mb-1">
                      <span>Arrecadado: {{ formatCurrency(data.current_amount) }}</span>
                      <span class="font-bold text-blue-500">Meta: {{ formatCurrency(data.target_amount) }}</span>
                    </div>
                    <ProgressBar :value="calculatePercent(data)" :showValue="false" style="height: 0.5rem;"
                      :pt="{ value: { style: { backgroundColor: 'var(--p-yellow-800)' } } }" />
                  </div>

                  <div class="flex align-items-center text-xs text-gray-500 italic">
                    <i class="ri-calendar-line mr-1"></i>
                    Expira em: {{ dayjs(data.deadline).format('DD/MM/YYYY') }}
                  </div>
                </div>
              </template>

              <template #footer>
                <Button
                  :label="data.isExpired && !data.isCompleted ? 'Prazo Encerrado' : (data.isCompleted ? 'Meta Batida' : 'Contribuir')"
                  :icon="data.isExpired && !data.isCompleted ? 'pi pi-calendar-times' : 'ri-hand-heart-line'"
                  size="small" class="w-full" :severity="data.isExpired ? 'secondary' : 'warn'"
                  :disabled="!data.canContribute" @click="makeContribute(data)" />
              </template>
            </Card>
          </div>
        </template>
      </template>
      <template #empty>
        <Empty label="Nenhuma meta encontrado" icon="ri-gift-line" />
      </template>
    </Carousel>
  </div>

  <PaymentDialog v-model:visible="contributeDialog" :payment="selectedContribute" @submit="saveContribute" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { formatCurrency } from '@/functions/utils';
import { Skeleton, useToast } from 'primevue';
import { GoalService, type IGoal } from '@/services/goal';
import { PaymentService, type IPayment } from '@/services/payment';
import dayjs from 'dayjs';
import { useOperator } from '@/composables/useOperator';

const { operator } = useOperator();
const toast = useToast();

const loading = ref(true);
const contributeDialog = ref(false);

const goals = ref<IGoal[]>([]);
const selectedContribute = ref<IPayment>({} as IPayment);

const isValidUrl = (url: string) => {
  const pattern = /^https?:\/\//;
  return pattern.test(url);
};

const responsiveOptions = ref([
  {
    breakpoint: '1400px',
    numVisible: 5,
    numScroll: 1
  },
  {
    breakpoint: '1199px',
    numVisible: 3,
    numScroll: 1
  },
  {
    breakpoint: '767px',
    numVisible: 2,
    numScroll: 1
  },
  {
    breakpoint: '575px',
    numVisible: 1,
    numScroll: 1

  }
]);

onMounted(async () => {
  loadServices();
});

const loadServices = async () => {
  try {
    goals.value = await GoalService.list();
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados.' });
  } finally {
    loading.value = false;
  }
};

const dtValue = computed(() => {
  if (loading.value) return new Array(5).fill({});

  const now = dayjs();

  return goals.value.map(goal => {
    const isExpired = dayjs(goal.deadline).isBefore(now, 'day');
    const isCompleted = goal.current_amount >= goal.target_amount;

    return {
      ...goal,
      isExpired,
      isCompleted,
      canContribute: !isExpired && !isCompleted
    };
  });
});

const calculatePercent = (goal: IGoal) => {
  if (!goal.target_amount) return 0;
  const percent = (goal.current_amount / goal.target_amount) * 100;
  return Math.min(Math.round(percent), 100);
};

const makeContribute = (goal: IGoal) => {
  const now = dayjs();

  selectedContribute.value = {
    description: `Contribuição: ${goal.title}`,
    amount: 10.00,
    status: 'pending',
    category: 'goal',
    reference: now.format('MM/YYYY'),
    goal: goal.$id,
    receipt_url: null,
    due_date: now.toISOString(),
    operator: operator.value.$id,
  } as IPayment;

  contributeDialog.value = true;
};

const saveContribute = async ({ file, amount }: { file: File, amount: number }) => {
  try {
    const payload = { ...selectedContribute.value, amount } as IPayment;
    await PaymentService.contribute(payload, file);

    toast.add({
      severity: "success",
      summary: "Sucesso!",
      detail: "Comprovante enviado! Aguarde a aprovação do financeiro.",
      life: 4000,
    });

  } catch (error) {
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao enviar comprovante.", life: 3000 });
  } finally {
    contributeDialog.value = false;
  }
};

</script>