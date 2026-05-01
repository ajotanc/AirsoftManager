<template>
  <div class="p-3" v-if="tournament">

    <div v-if="authStore.isAdmin" class="tournament-wrapper">
      <div class="section-title">Painel Administrativo</div>
      <div class="info-grid grid">
        <div class="info-card col-12 md:col-6 accent-green">
          <div class="info-card-bg">OPS</div>
          <div class="info-label">✅ Confirmados</div>
          <div class="info-value">{{ registrations.length }} <span>ops</span></div>
        </div>
        <div class="info-card col-12 md:col-6">
          <div class="info-card-bg">BAR</div>
          <div class="info-label">📊 Progresso</div>
          <ProgressBar :value="registrationProgress" :showValue="false" style="height: 8px; margin-top: 6px;" />
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
            {{ validation.current }}/{{ validation.required }} ops
          </div>
        </div>

        <div v-if="authStore.isManager" class="info-card col-12">
          <div class="flex align-items-center justify-content-between flex-wrap gap-2">
            <small :class="['font-bold', canGenerate ? 'text-green-500' : 'text-red-500']">{{ validationMessage
            }}</small>
            <Button v-if="tournament.status === 'open'" label="Gerar Times e Chaveamento" icon="pi pi-sitemap"
              severity="success" size="small" :disabled="!canGenerate" :loading="loadingGenerate"
              @click="handleStartTournament" />
            <Button v-if="tournament.status === 'ongoing'" label="Encerrar Torneio" icon="ri-flag-2-line"
              severity="warn" size="small" @click="handleEndTournament" :disabled="!hasChampion" />
          </div>
        </div>
      </div>
    </div>

    <TournamentInfo :tournament="tournament" />

    <TournamentBracket :matches="bracketMatches" :tournament="tournament" :stats="stats"
      @update-score="handleUpdateScore" @set-winner="handleSetWinner" @set-stat="handleSetStats" />

    <TournamentLeaderboard v-if="stats.length > 0" :stats="stats" :teams="teams" />
  </div>
</template>

<script setup lang="ts">
import { TABLE_TOURNAMENT_MATCHES, TABLE_TOURNAMENTS, TournamentService, type ITournament, type ITournamentMatch, type ITournamentRegistration, type ITournamentTeam } from '@/services/tournament';
import { useConfirm, useToast } from 'primevue';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import confetti from 'canvas-confetti';

import { useOperator } from '@/composables/useOperator';
import type { IOperator } from '@/services/operator';
import { StatsService, TABLE_TOURNAMENT_STATS, type ITournamentOperatorStat } from '@/services/stats';

import TournamentBracket from '@/components/tournament/TournamentBracket.vue';
import TournamentLeaderboard from '@/components/tournament/TournamentLeaderboard.vue';
import TournamentInfo from '@/components/tournament/TournamentInfo.vue';

import '@/components/tournament/style.css';
import { DATABASE_ID, realtime } from '@/services/appwrite';

const route = useRoute();
const toast = useToast();
const confirm = useConfirm();
const { authStore } = useOperator();

const tournamentId = route.params.id as string;
const tournament = ref<ITournament>({} as ITournament);

const registrations = ref<ITournamentRegistration[]>([]);
const operators = ref<IOperator[]>([]);
const bracketMatches = ref<ITournamentMatch[]>([]);
const stats = ref<ITournamentOperatorStat[]>([]);
const teams = ref<ITournamentTeam[]>([]);

const loading = ref(false);
const loadingGenerate = ref(false);

onMounted(async () => {
  await loadServices()
  setupStatsRealtime();
});

const loadServices = async () => {
  const data = await TournamentService.row(tournamentId);
  tournament.value = data;

  registrations.value = data.registrations?.filter(r => r.status === 'confirmed') || [];
  operators.value = registrations.value.map(r => r.operator as IOperator);
  teams.value = data.teams || [];

  bracketMatches.value = data.matches as ITournamentMatch[];
  stats.value = await StatsService.getSatsTournamet(tournamentId);
};

const setupStatsRealtime = () => {
  const channel = [
    `databases.${DATABASE_ID}.collections.${TABLE_TOURNAMENT_STATS}.documents`,
    `databases.${DATABASE_ID}.collections.${TABLE_TOURNAMENT_MATCHES}.documents`
  ];

  return realtime.subscribe(channel, async (response) => {

    const event = response.events.some(e => e.includes('.update') || e.includes('.create'));
    if (!event) return;

    if (response.events.some(e => e.includes(TABLE_TOURNAMENT_STATS))) {
      const payload = response.payload as ITournamentOperatorStat;
      const index = stats.value.findIndex(s => s.$id === payload.$id);

      if (index !== -1) {
        stats.value[index] = { ...stats.value[index], ...payload };
      } else {
        stats.value.push(payload);
      }
    }

    if (response.events.some(e => e.includes(TABLE_TOURNAMENT_MATCHES))) {
      const payload = response.payload as ITournamentMatch;
      const existing = await TournamentService.getMatch(payload.$id);

      const index = bracketMatches.value.findIndex(m => m.$id === existing.$id)
      if (index !== -1) {
        bracketMatches.value[index] = existing
      }
    }

    if (response.events.some(e => e.includes(TABLE_TOURNAMENTS))) {
      const payload = response.payload as ITournament;

      if (payload.status === 'finished' && tournament.value.status !== 'finished') {
        tournament.value = {
          ...tournament.value,
          ...payload
        };

        triggerCelebration();
      }
    }
  });
};

const validation = computed(() => {
  return TournamentService.canStart(registrations.value.length, tournament.value.mode);
});

const canGenerate = computed(() => validation.value.valid);
const validationMessage = computed(() => validation.value.message);

const registrationProgress = computed(() => {
  return (registrations.value.length / validation.value.required) * 100;
});

const hasChampion = computed(() => {
  const finalMatch = bracketMatches.value.find(m => !m.next_match);
  return finalMatch && finalMatch.winner;
});

const handleStartTournament = async () => {
  loading.value = true;
  try {
    const allTeams = await TournamentService.drawTeams(tournamentId, operators.value, tournament.value.mode);
    await TournamentService.generateBracket(tournamentId, allTeams);

    const fullTournament = await TournamentService.update(tournamentId, { status: 'ongoing' });

    tournament.value = fullTournament;
    teams.value = fullTournament.teams || [];
    registrations.value = fullTournament.registrations?.filter(r => r.status === 'confirmed') || [];
    bracketMatches.value = fullTournament.matches || [];

    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Torneio iniciado!', life: 3000 });
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao iniciar torneio!', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const handleUpdateScore = async (match: ITournamentMatch, side: 'top' | 'bottom') => {
  const scoreField = side === 'top' ? 'top_score' : 'bottom_score';
  const currentScore = match[scoreField] ?? 0;

  try {
    // 1. Incrementa o score localmente para resposta instantânea (Opcional UX)
    // 2. Persiste no banco
    const updatedMatch = await TournamentService.updateMatch(match.$id, {
      [scoreField]: currentScore + 1
    });

    // 4. Lógica de BO3
    const type = tournament.value.type;

    if (type.startsWith('bo')) {
      // Extrai o número (3, 5, 7...)
      const totalGames = parseInt(type.replace('bo', ''));

      // Calcula o threshold: metade + 1 (ex: 3 -> 2, 5 -> 3)
      const winsNeeded = Math.ceil(totalGames / 2);

      if (updatedMatch[scoreField] >= winsNeeded) {
        const topSide = updatedMatch.top_side as ITournamentTeam;
        const bottomSide = updatedMatch.bottom_side as ITournamentTeam;

        const teamWinner = side === 'top' ? topSide : bottomSide;

        if (teamWinner) {
          await handleSetWinner(updatedMatch, teamWinner.$id);
        }
      }
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível atualizar o placar' });
  }
};

const handleSetWinner = async (match: ITournamentMatch, winnerId: string) => {
  try {
    await TournamentService.advanceWinner(match, winnerId);

    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Vencedor promovido!',
      life: 3000
    });
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao promover vencedor!',
      life: 3000
    });
  }
};

const handleSetStats = async (rowId: string | undefined, stat: ITournamentOperatorStat) => {
  try {
    await StatsService.setStats(rowId, stat)

    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Estatística atualizada!',
      life: 3000
    })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao salvar estatística!',
      life: 3000
    })
  }
}

const handleEndTournament = async () => {
  confirm.require({
    message: 'Deseja realmente encerrar o torneio? O ranking final será consolidado.',
    header: tournament.value.name,
    rejectProps: {
      label: 'Não',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Sim',
      severity: 'danger'
    },
    accept: async () => {
      try {
        await TournamentService.update(tournamentId, { status: 'finished' });
        toast.add({ severity: 'success', summary: 'Torneio Finalizado', detail: 'O campeão foi coroado!', life: 3000 });
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível finalizar o torneio.', life: 3000 });
      }
    },
  });
};

const triggerCelebration = () => {
  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: number = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) return clearInterval(interval);

    const particleCount = 50 * (timeLeft / duration);

    // Lança confetes de dois pontos laterais para o centro
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
};
</script>
