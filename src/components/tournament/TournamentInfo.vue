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
    <div class="info-card col-12 col-12 md:col-4 lg:col-2" :class="{
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
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '@brazilian-utils/brazilian-utils';
import { STATUS_LABEL, type ITournament } from '@/services/tournament';

interface Props {
  tournament: ITournament
}

const props = defineProps<Props>();

const formattedDate = computed(() => {
  if (!props.tournament.date) return '-'
  return dayjs(props.tournament.date).format('DD MMM. YYYY')
})

const typeLabel = computed(() => {
  const map: Record<string, string> = {
    knockout: 'Eliminatória',
    bo3: 'Melhor de 3',
    bo5: 'Melhor de 5',
  }
  return map[props.tournament.type] ?? props.tournament.type
})

const classLabel = computed(() => {
  if (props.tournament.allowed_class === 'all') return 'Livre'
  if (props.tournament.allowed_class === 'pistol') return 'Pistola'
  return props.tournament.allowed_class
})
</script>