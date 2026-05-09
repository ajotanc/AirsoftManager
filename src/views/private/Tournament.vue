<template>
  <TournamentSkeleton v-if="isInitialLoading" />
  <div v-else class="p-3">
    <Accordion :value="['panel', 'info', 'bracket', 'leaderboard']" multiple unstyled>
      <AccordionPanel value="panel" class="tournament-wrapper" v-if="authStore.isAdmin">
        <AccordionHeader class="tournament-header">
          <div class="section-title">Painel Administrativo</div>
        </AccordionHeader>
        <AccordionContent>
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
                  severity="success" size="small" :disabled="!canGenerate" @click="handleStartTournament" />
                <Button v-if="tournament.status === 'ongoing'" label="Encerrar Torneio" icon="ri-flag-2-line"
                  severity="warn" size="small" @click="handleEndTournament" :disabled="!hasChampion" />
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="info" class="tournament-wrapper">
        <AccordionHeader class="tournament-header">
          <div class="section-title">Informações do Torneio</div>
        </AccordionHeader>
        <AccordionContent>
          <TournamentInfo :tournament="tournament" />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="bracket" class="tournament-wrapper">
        <AccordionHeader class="tournament-header">
          <div class="section-title">Chaveamento</div>
        </AccordionHeader>
        <AccordionContent>
          <TournamentBracket :matches="bracketMatches" :tournament="tournament" :rankings="rankings"
            @update-score="handleUpdateScore" @set-winner="handleSetWinner" @set-stat="handleSetRanking" />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="leaderboard" class="tournament-wrapper" v-if="rankings.length > 0">
        <AccordionHeader class="tournament-header">
          <div class="section-title">Destaques & Leaderboard</div>
        </AccordionHeader>
        <AccordionContent>
          <Leaderboard :rankings="rankings" :teams="teams" />
        </AccordionContent>
      </AccordionPanel>

    </Accordion>


    <Loading :loading="loading" />
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
import { RankingService, TABLE_RANKINGS, type IRanking } from '@/services/ranking';

import TournamentBracket from '@/components/tournament/TournamentBracket.vue';
import TournamentInfo from '@/components/tournament/TournamentInfo.vue';
import Leaderboard from '@/components/Leaderboard.vue';

import '@/components/tournament/style.css';
import { DATABASE_ID, realtime } from '@/services/appwrite';
import Loading from '@/components/Loading.vue';
import TournamentSkeleton from '@/components/skeleton/TournamentSkeleton.vue';

const route = useRoute();
const toast = useToast();
const confirm = useConfirm();
const { authStore } = useOperator();

const tournamentId = route.params.id as string;
const tournament = ref<ITournament>({} as ITournament);

const registrations = ref<ITournamentRegistration[]>([]);
const operators = ref<IOperator[]>([]);
const bracketMatches = ref<ITournamentMatch[]>([]);
const rankings = ref<IRanking[]>([]);
const teams = ref<ITournamentTeam[]>([]);

const loading = ref(false);
const isInitialLoading = ref(true);

onMounted(async () => {
  try {
    await loadServices();
    setupStatsRealtime();
  } finally {
    isInitialLoading.value = false; // Desativa após carregar tudo
  }
});

const loadServices = async () => {
  const data = await TournamentService.row(tournamentId);
  tournament.value = data;

  registrations.value = data.registrations?.filter(r => r.status === 'confirmed') || [];
  operators.value = registrations.value.map(r => r.operator as IOperator);
  teams.value = data.teams || [];

  bracketMatches.value = data.matches as ITournamentMatch[];
  rankings.value = await RankingService.listByTournament(tournamentId);
};

const setupStatsRealtime = () => {
  const channel = [
    `databases.${DATABASE_ID}.collections.${TABLE_RANKINGS}.documents`,
    `databases.${DATABASE_ID}.collections.${TABLE_TOURNAMENT_MATCHES}.documents`
  ];

  return realtime.subscribe(channel, async (response) => {

    const event = response.events.some(e => e.includes('.update') || e.includes('.create'));
    if (!event) return;

    if (response.events.some(e => e.includes(TABLE_RANKINGS))) {
      const payload = response.payload as IRanking;
      const index = rankings.value.findIndex(s => s.$id === payload.$id);

      if (index !== -1) {
        rankings.value[index] = { ...rankings.value[index], ...payload };
      } else {
        rankings.value.push(payload);
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

  loading.value = true;

  try {
    const { current } = await TournamentService.advanceWinner(match, winnerId);
    await RankingService.updateMatchRankings(tournament.value, rankings.value, current, winnerId);

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
  } finally {
    loading.value = false;
  }
};

const handleSetRanking = async (rowId: string | undefined, stat: IRanking) => {
  loading.value = true;

  try {
    await RankingService.upsert(rowId, stat)

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
  } finally {
    loading.value = false;
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
      loading.value = true;

      try {
        await TournamentService.update(tournamentId, { status: 'finished' });
        toast.add({ severity: 'success', summary: 'Torneio Finalizado', detail: 'O campeão foi coroado!', life: 3000 });
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível finalizar o torneio.', life: 3000 });
      } finally {
        loading.value = false;
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
