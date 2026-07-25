<template>
  <div class="carousel-container w-full">
    <Carousel :key="dtValue.length" :circular="dtValue.length > 3" :showNavigators="dtValue.length > 3" :value="dtValue"
      :numVisible="3" :numScroll="1" :responsiveOptions="responsiveOptions"
      :autoplayInterval="dtValue.length > 3 ? 5000 : 0">
      <template #item="{ data: tournament }">
        <div v-if="loading" class="p-2 h-full">
          <Skeleton width="100%" height="20rem" borderRadius="16px" />
        </div>
        <template v-else>
          <div class="p-2 h-full w-full">
            <Card
              class="h-full border-1 border-200 flex flex-column overflow-hidden shadow-2 surface-card tournament-card">
              <template #title>
                <div class="flex flex-column gap-2">
                  <!-- Badges Header -->
                  <div class="flex align-items-center justify-content-between">
                    <Tag :value="statusLabel(tournament.status)" :severity="severityStatus(tournament.status)"
                      class="font-semibold text-xs" />
                    <Tag v-if="tournament.is_paid" icon="pi pi-dollar" :value="`R$ ${formatCurrency(tournament.price)}`"
                      severity="success" class="font-bold text-xs" />
                    <Tag v-else icon="pi pi-ticket" value="Gratuito" severity="info" class="font-bold text-xs" />
                  </div>

                  <!-- Date & Title -->
                  <div class="flex align-items-center gap-2 text-xs font-semibold text-600 mt-1">
                    <i class="pi pi-calendar text-gold-600"></i>
                    <span>{{ dayjs(tournament.date).format('DD [de] MMMM, YYYY') }}</span>
                  </div>

                  <div class="text-xl font-bold text-900 line-clamp-1">
                    {{ tournament.name }}
                  </div>
                </div>
              </template>

              <template #content>
                <div class="flex flex-column gap-3 text-sm flex-1">
                  <!-- Badges Specs -->
                  <div class="flex flex-wrap gap-2">
                    <Tag icon="pi pi-users" :value="`${tournament.mode}v${tournament.mode}`" severity="info"
                      class="text-xs" />
                    <Tag icon="pi pi-shield" :value="classLabel(tournament.allowed_class)" severity="secondary"
                      class="text-xs" />
                    <Tag icon="pi pi-sitemap" :value="typeLabel(tournament.type)" severity="contrast" class="text-xs" />
                  </div>

                  <!-- Description -->
                  <p v-if="tournament.description" class="text-xs text-600 m-0 description-text">
                    {{ limitWords(tournament.description, 30) }}
                  </p>

                  <!-- Awards Section -->
                  <div v-if="tournament.awards && tournament.awards.length > 0"
                    class="flex flex-column mt-auto pt-3 border-top-1 border-100">
                    <div class="flex flex-column gap-1">
                      <div v-for="(award, idx) in tournament.awards" :key="idx"
                        class="flex align-items-center gap-2 text-xs font-medium px-2 py-1 border-round"
                        :class="medalClass(idx)">
                        <span class="text-base">{{ medalEmoji(idx) }}</span>
                        <span>{{ award }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <template #footer>
                <div class="mt-auto pt-2">
                  <Button label="Ver Torneio" icon="pi pi-bolt" aria-label="Ver detalhes do torneio"
                    class="w-full p-button-sm p-button-warning font-bold shadow-1"
                    @click="goToTournament(tournament.$id)" />
                </div>
              </template>
            </Card>
          </div>
        </template>
      </template>

      <template #empty>
        <Empty label="Nenhum torneio encontrado para este mês em diante" icon="ri-trophy-line" />
      </template>
    </Carousel>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { formatCurrency } from '@brazilian-utils/brazilian-utils';
import Carousel from 'primevue/carousel';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import Empty from '@/components/Empty.vue';
import { limitWords } from '@/functions/utils';
import { TournamentService, STATUS_LABEL, type ITournament, type TournamentStatus } from '@/services/tournament';

const router = useRouter();
const tournaments = ref<ITournament[]>([]);
const loading = ref(true);

const responsiveOptions = ref([
  {
    breakpoint: '1400px',
    numVisible: 3,
    numScroll: 1
  },
  {
    breakpoint: '1199px',
    numVisible: 2,
    numScroll: 1
  },
  {
    breakpoint: '767px',
    numVisible: 1,
    numScroll: 1
  }
]);

onMounted(() => {
  loadTournaments();
});

const loadTournaments = async () => {
  try {
    tournaments.value = await TournamentService.list();
  } catch (error) {
    console.error('Erro ao carregar torneios:', error);
  } finally {
    loading.value = false;
  }
};

const dtValue = computed(() => {
  return loading.value ? new Array(3).fill({}) : tournaments.value;
});

const statusLabel = (status: TournamentStatus) => STATUS_LABEL[status] || 'Indefinido';

const severityStatus = (status: TournamentStatus) => {
  switch (status) {
    case 'open':
      return 'success';
    case 'ongoing':
      return 'info';
    case 'finished':
      return 'warn';
    default:
      return 'secondary';
  }
};

const classLabel = (allowedClass: string) => {
  if (allowedClass === 'all') return 'Livre';
  if (allowedClass === 'pistol') return 'Pistola';
  if (allowedClass === 'assault') return 'Fuzil';
  if (allowedClass === 'dmr') return 'DMR';
  if (allowedClass === 'sniper') return 'Sniper';
  return allowedClass;
};

const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    knockout: 'Eliminatória',
    bo3: 'Melhor de 3',
    bo5: 'Melhor de 5',
  };
  return map[type] ?? type;
};

const medalClass = (idx: number | string) => {
  const index = Number(idx);
  const classes = [
    'bg-yellow-100 text-yellow-900 font-bold',  // ouro - mais forte
    'bg-gray-100 text-gray-700',                // prata
    'bg-orange-100 text-orange-800',            // bronze
  ];
  return classes[index] ?? 'surface-50 text-700';
};

const medalEmoji = (idx: number | string) => {
  const index = Number(idx);
  const emojis = ['🥇', '🥈', '🥉'];
  return emojis[index] ?? '🎖️';
};

const goToTournament = (id: string) => {
  router.push(`/tournament/${id}`);
};
</script>

<style scoped>
:deep(.p-carousel-items),
:deep(.p-carousel-item) {
  display: flex;
}

:deep(.p-carousel-item) {
  padding-bottom: 0.5rem;
  align-items: stretch;
}

:deep(.p-card) {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

:deep(.p-card:hover) {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08) !important;
  transform: translateY(-2px);
}

:deep(.p-card-body) {
  display: flex;
  flex-direction: column;
  flex: 1;
}

:deep(.p-card-content) {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.tournament-card {
  min-height: 20rem;
}

.description-text {
  min-height: 2.2rem;
}
</style>