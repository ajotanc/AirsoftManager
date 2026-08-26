<template>
  <div class="info-grid" v-if="matches.length > 0">
    <div class="info-card red">
      <div class="info-card-bg">CHA</div>
      <div class="bracket-wrapper">
        <div class="bracket">
          <template v-for="(rd, ri) in rounds" :key="rd.round">

            <div class="round-col">
              <div class="round-label">{{ roundLabel(rd.round) }}</div>

              <div v-for="(match, mi) in rd.matches" :key="match.$id" :style="slotStyle(ri, mi)">
                <div class="match-card shadow-3">
                  <template v-for="side in (['top', 'bottom'] as const)" :key="side">
                    <div :class="['match-side', sideClass(match, side), {
                      'cursor-pointer': getSide(match, side)
                    }]">
                      <div class="flex align-items-center gap-2">
                        <Button v-if="getSide(match, side)" class="button-icon" text icon="ri-arrow-right-s-line"
                          @click="toggleOperators(match.$id, side)" :class="{
                            'rotate-90': isExpanded(match.$id, side),
                            'winner-arrow': isWinner(match, side)
                          }" severity="danger">
                        </Button>
                        <span :class="['side-name', { tbd: !getSide(match, side) }]">
                          {{ getSide(match, side)?.name ?? 'A definir' }}
                        </span>
                      </div>

                      <div class="match-actions">
                        <Button v-if="isBo" :label="getSideScore(match, side).toString() ?? '0'" class="button-icon"
                          severity="danger" size="small" text readonly />

                        <template v-if="isAdmin && !match.winner && match.top_side && match.bottom_side">
                          <Button v-if="isBo" class="button-icon" icon="ri-add-line" severity="secondary" size="small"
                            @click="emit('update-score', match, side)" />
                          <Button class="button-icon" icon="ri-check-line" severity="success" size="small"
                            @click="onSetWinner(match, side)" :disabled="!canSetWinner(match, side)" />
                        </template>
                      </div>
                    </div>

                    <transition>
                      <div v-if="isExpanded(match.$id, side)" class="operators-drawer">
                        <TournamentStat v-for="op in getOperatorTeam(getSide(match, side)?.$id)" :key="op.$id" :op="op"
                          :stat="getOpStat(match.$id, op.$id)"
                          :is-admin="isAdmin && !!match.top_side && !!match.bottom_side" :disabled="!!match.winner"
                          @kill="openShotClinic($event, match)" @death="onSetDeath($event, match)" />
                      </div>
                    </transition>
                  </template>
                </div>
              </div>
            </div>

            <div v-if="ri < rounds.length - 1" class="connector-col">
              <div class="round-label">&nbsp;</div>
              <svg width="32" :height="connectorHeight(ri)">
                <template v-for="(_, pi) in Math.floor(rd.matches.length / 2)" :key="pi">
                  <line v-bind="connPairLine(ri, pi, 'top-h')" stroke="var(--p-blue-200)" stroke-width="2" />
                  <line v-bind="connPairLine(ri, pi, 'bot-h')" stroke="var(--p-blue-200)" stroke-width="2" />
                  <line v-bind="connPairLine(ri, pi, 'vert')" stroke="var(--p-blue-200)" stroke-width="2" />
                  <line v-bind="connPairLine(ri, pi, 'out')" stroke="var(--p-blue-200)" stroke-width="2" />
                </template>
              </svg>
            </div>
          </template>

          <div class="connector-col">
            <div class="round-label">&nbsp;</div>
            <svg width="16" :height="CARD_H * rounds.length">
              <line x1="0" :y1="championConnectorMargin + MATCH_H" x2="16" :y2="championConnectorMargin + MATCH_H"
                stroke="var(--p-blue-200)" stroke-width="2" />
            </svg>
          </div>

          <div class="round-col">
            <div class="round-label">Campeão</div>
            <div :style="{ marginTop: `${championConnectorMargin + (MATCH_H / 2)}px` }">
              <div class="match-champion shadow-3">
                <i class="ri-trophy-fill trophy-icon" />
                <span class="champion-name">{{ champion?.name || 'A definir' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="info-grid" v-else>
    <div class="info-card blue">
      <div class="info-card-bg">AUTO</div>
      <div class="flex flex-column align-items-center justify-content-center text-center gap-3 p-3 text-blue-500">
        <i class="ri-cpu-line text-5xl"></i>
        <div class="info-value">Aguardando Mobilização</div>
        <span class="text-sm">
          O motor de sorteio está em standby. As chaves serão geradas
          <strong>automaticamente</strong> assim que o efetivo mínimo de operadores confirmados for atingido.
        </span>
      </div>
    </div>
  </div>

  <Dialog v-model:visible="clinic.visible" header="Registro de Eliminação" modal
    :style="{ width: '90vw', maxWidth: '375px' }">
    <div class="tactical-silhouette-wrapper">
      <h3 class="m-0 text-red-500 font-mono tracking-widest text-sm uppercase">Escolha a Zona de Acerto</h3>

      <svg width="100%" height="auto" viewBox="0 0 1080 1920">
        <g>
          <path class="hit-zone zone-torso" @click="onSetStats('torso')"
            d="M550.336,1040.855c-1.397,-2.861 -5.875,-5.346 -10.336,-5.642c-4.462,0.296 -8.939,2.781 -10.336,5.642c-27.705,-56.277 -79.561,-84.54 -152.246,-88.641c5.601,-26.78 11.317,-52.945 15.57,-82.928l1.065,-5.257c0.744,-6.156 0.798,-6.045 1.573,-12.133l0.52,-3.386c12.381,-99.965 3.115,-140.591 -8.234,-184.88l-2.447,-7.214c-5.95,-19.86 -6.271,-33.739 -10.617,-32.924c41.193,-165.933 -17.351,-240.662 -17.351,-240.662c39.508,-10.417 47.278,-16.341 99.028,-52.717c1.83,-1.365 1.813,-1.362 1.976,-1.474c0.616,-0.424 0.614,-0.306 1.198,-0.707c9.869,-7.239 10.753,-6.457 16.237,-15.271c18.735,10.672 40.142,15.515 64.065,14.867c23.923,0.647 45.33,-4.195 64.065,-14.867c5.484,8.814 6.368,8.032 16.237,15.271c0.583,0.401 0.581,0.283 1.198,0.707c0.162,0.112 0.146,0.109 1.976,1.474c51.75,36.376 59.521,42.3 99.028,52.717c0,0 -58.544,74.729 -17.351,240.662c-4.346,-0.814 -4.667,13.064 -10.617,32.924l-2.447,7.214c-11.349,44.289 -20.615,84.915 -8.234,184.88l0.52,3.386c0.775,6.088 0.829,5.977 1.573,12.133l1.065,5.257c4.253,29.984 9.969,56.149 15.57,82.928c-72.684,4.102 -124.541,32.364 -152.246,88.641Z" />
        </g>
        <path class="hit-zone zone-arms" @click="onSetStats('mmi_left')"
          d="M529.664,1040.855c-2.446,5.01 -22.833,98.519 -23.112,99.929l-0.73,3.285c-6.592,30.98 -8.219,39.769 -8.862,43.242l-1.405,5.202c-0.417,2.351 -2.38,13.411 -5.638,29.312c-15.402,75.189 -16.166,93.589 -29.225,131.445l-1.701,5.122c-13.807,40.465 -26.075,59.376 -32.943,91.791c-9.411,44.416 -1.476,45.351 -9.281,90.125c-1.785,10.243 -21.803,83.997 -28.754,126.088l-1.355,5.213c-1.129,6.941 -1.033,6.847 -2.131,13.826l-1.128,5.257c-1.957,19.159 -3.303,25.771 0.885,43.04l2.581,7.209c6.422,12.031 4.436,18.144 3.897,20.755c-4.047,19.58 -2.482,45.347 -2.736,58.734c-0.521,27.455 -18.475,21.795 -32.236,19.584c-17.416,-2.799 -74.776,-3.785 -69.407,-23.115c4.762,-17.144 27.897,-14.492 37.74,-86.487c0.635,-4.647 3.483,-25.479 -1.919,-58.595c-12.372,-75.835 -23.343,-137.535 -8.954,-195.403c14.184,-57.046 35.084,-69.053 36.483,-105.656c0.668,-17.466 -2.938,-18.159 7.596,-48.516c13.855,-39.927 8.587,-44.168 4.159,-101.976l-0.283,-3.452c-1.11,-15.553 -0.847,-15.475 -2.037,-31.106l-0.376,-5.161c-0.427,-8.065 -0.434,-8.013 -0.461,-8.711c-4.055,-103.78 7.26,-163.071 19.087,-219.622c72.684,4.102 124.541,32.364 152.246,88.641Z" />
        <path class="hit-zone zone-arms" @click="onSetStats('mmi_right')"
          d="M702.582,952.213c11.827,56.55 23.141,115.842 19.087,219.622c-0.027,0.697 -0.034,0.645 -0.461,8.711l-0.376,5.161c-1.191,15.632 -0.927,15.553 -2.037,31.106l-0.283,3.452c-4.429,57.808 -9.696,62.049 4.159,101.976c10.534,30.357 6.928,31.049 7.596,48.516c1.399,36.603 22.3,48.61 36.483,105.656c14.388,57.868 3.418,119.568 -8.954,195.403c-5.403,33.116 -2.554,53.948 -1.919,58.595c9.843,71.995 32.978,69.343 37.74,86.487c5.369,19.33 -51.99,20.317 -69.407,23.115c-13.761,2.211 -31.715,7.871 -32.236,-19.584c-0.254,-13.387 1.311,-39.154 -2.736,-58.734c-0.54,-2.611 -2.525,-8.723 3.897,-20.755l2.581,-7.209c4.188,-17.269 2.842,-23.881 0.885,-43.04l-1.128,-5.257c-1.098,-6.979 -1.002,-6.885 -2.131,-13.826l-1.355,-5.213c-6.95,-42.091 -26.968,-115.846 -28.754,-126.088c-7.805,-44.775 0.13,-45.709 -9.281,-90.125c-6.868,-32.414 -19.136,-51.325 -32.943,-91.791l-1.701,-5.122c-13.059,-37.855 -13.823,-56.256 -29.225,-131.445c-3.257,-15.901 -5.22,-26.961 -5.638,-29.312l-1.405,-5.202c-0.643,-3.472 -2.27,-12.262 -8.862,-43.242l-0.73,-3.285c-0.278,-1.41 -20.665,-94.919 -23.112,-99.929c27.705,-56.277 79.561,-84.54 152.246,-88.641Z" />
        <path class="hit-zone zone-head" @click="onSetStats('head')"
          d="M540,327.527c-23.923,0.647 -45.33,-4.195 -64.065,-14.867c0.997,-1.753 0.92,-1.674 1.666,-3.537c5,-15.763 0.236,-27.748 -3.796,-40.173l-1.561,-5.209c-3.33,-13.467 -0.786,-14.954 -6.819,-19.626c-3.403,-2.635 -25.872,-20.032 -17.177,-50.981c2.81,-10.002 6.149,-9.452 5.488,-29.575c-1.127,-34.319 19.924,-62.794 39.213,-73.666c15.599,-8.791 31.725,-12.474 47.051,-11.863c15.327,-0.611 31.452,3.072 47.051,11.863c19.289,10.871 40.34,39.347 39.213,73.666c-0.661,20.123 2.678,19.573 5.488,29.575c8.695,30.95 -13.774,48.347 -17.177,50.981c-6.034,4.671 -3.489,6.159 -6.819,19.626l-1.561,5.209c-4.032,12.425 -8.796,24.41 -3.796,40.173c0.746,1.863 0.669,1.784 1.666,3.537c-18.735,10.672 -40.142,15.515 -64.065,14.867Z" />
        <path class="hit-zone zone-legs" @click="onSetStats('mms_left')"
          d="M374.847,623.49c-1.197,0.224 -14.246,31.94 -15.403,34.752c-2.098,5.1 -10.556,25.658 -14.788,67.333l-1.134,5.213c-5.22,39.818 -9.63,68.699 -17.747,96.703c-17.103,59.012 -40.33,89.287 -43.658,117.865c-3.146,27.016 7.793,25.764 11.591,67.387l0.002,1.743l0.076,5.177l0.003,5.19c-0.929,14.273 -2.3,31.871 7.391,49.791c5.228,9.669 2.236,10.406 -4.682,18.938c-13.885,17.123 -44.108,1.932 -57.373,-19.148c-16.745,-26.61 -9.622,-36.872 -4.7,-79.059l0.485,-3.372c2.369,-27.788 2.863,-38.663 2.27,-67.484c-3.284,-159.465 32.727,-244.461 46.115,-300.902c29.2,-123.1 19.531,-149.068 25.606,-174.767c13.84,-58.554 37.792,-63.174 48.595,-66.023c0,0 58.544,74.729 17.351,240.662Z" />
        <path class="hit-zone zone-legs" @click="onSetStats('mms_right')"
          d="M722.503,382.829c10.803,2.848 34.755,7.469 48.595,66.023c6.074,25.699 -3.594,51.668 25.606,174.767c13.388,56.441 49.399,141.437 46.115,300.902c-0.594,28.82 -0.1,39.696 2.27,67.484l0.485,3.372c4.922,42.188 12.044,52.45 -4.7,79.059c-13.265,21.08 -43.487,36.27 -57.373,19.148c-6.918,-8.531 -9.91,-9.269 -4.682,-18.938c9.69,-17.92 8.319,-35.518 7.391,-49.791l0.003,-5.19l0.076,-5.177l0.002,-1.743c3.799,-41.623 14.737,-40.371 11.591,-67.387c-3.328,-28.579 -26.555,-58.854 -43.658,-117.865c-8.117,-28.005 -12.526,-56.885 -17.747,-96.703l-1.134,-5.213c-4.231,-41.675 -12.689,-62.233 -14.788,-67.333c-1.157,-2.812 -14.206,-34.528 -15.403,-34.752c-41.193,-165.933 17.351,-240.662 17.351,-240.662Z" />
      </svg>

      <div class="flex gap-4 text-xs text-500 uppercase">
        <div class="flex flex-column align-items-center">
          <i class="ri-square-fill text-blue-300"></i>
          <span class="font-bold mt-1">Cabeça</span>
          <span>3p</span>
        </div>
        <div class="flex flex-column align-items-center">
          <i class="ri-square-fill text-blue-200"></i>
          <span class="font-bold mt-1">MMS/MMI</span>
          <span>5p</span>
        </div>
        <div class="flex flex-column align-items-center">
          <i class="ri-square-fill"></i>
          <span class="font-bold mt-1">Torso</span>
          <span>10p</span>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ITournament, ITournamentMatch, ITournamentTeam } from '@/services/tournament'
import { useOperator } from '@/composables/useOperator'
import type { IOperator } from '@/services/operator'
import { TACTICAL_POINTS, type HitLocation, type IRanking } from '@/services/ranking'
import TournamentStat from './TournamentStat.vue'

const CARD_H = 84;
const GAP_MIN = 30;
const MATCH_H = CARD_H / 2;

interface Props {
  matches: ITournamentMatch[]
  tournament: ITournament
  rankings: IRanking[]
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update-score', match: ITournamentMatch, side: 'top' | 'bottom'): void
  (e: 'set-winner', match: ITournamentMatch, winnerId: string): void
  (e: 'set-stat', rowId: string | undefined, stat: IRanking): void
}>()

const { authStore } = useOperator();
const { isAdmin } = authStore;

const isBo = computed(() => props.tournament.type !== 'knockout')

const expanded = ref<{ matchId: string; side: 'top' | 'bottom' } | null>(null)

const clinic = ref<{
  visible: boolean
  operator: IOperator | null
  match: ITournamentMatch | null
}>({ visible: false, operator: null, match: null })

function toggleOperators(matchId: string, side: 'top' | 'bottom') {
  const isSame = expanded.value?.matchId === matchId && expanded.value?.side === side
  expanded.value = isSame ? null : { matchId, side }
}

function isExpanded(matchId: string, side: 'top' | 'bottom') {
  return expanded.value?.matchId === matchId && expanded.value?.side === side
}

const getOperatorTeam = (id: string | undefined) => {
  if (!id) return [];
  const team = props.tournament.teams?.find(t => t.$id === id);
  return team?.operators as IOperator[];
};

function openShotClinic(operator: IOperator, match: ITournamentMatch) {
  clinic.value = { visible: true, operator, match }
}

const getSide = (m: ITournamentMatch, s: 'top' | 'bottom') => (s === 'top' ? m.top_side : m.bottom_side) as ITournamentTeam | null
const getSideScore = (m: ITournamentMatch, s: 'top' | 'bottom') => s === 'top' ? m.top_score : m.bottom_score
const isWinner = (m: ITournamentMatch, s: 'top' | 'bottom') => {
  const winnerId = m.winner ? (typeof m.winner === 'object' ? m.winner.$id : m.winner) : null;
  const side = getSide(m, s);
  const sideId = side ? (typeof side === 'object' ? side.$id : side) : null;
  return Boolean(winnerId && winnerId === sideId);
};

const getOpStat = (matchId: string | undefined, operatorId: string) => {
  return props.rankings.find(s => s.match?.$id === matchId && s.operator.$id === operatorId);
};

function buildStatPayload(
  operator: IOperator,
  match: ITournamentMatch,
  patch: Partial<IRanking>
): IRanking {
  const existing = getOpStat(match.$id, operator.$id)

  return {
    ...(existing ?? {
      tournament: props.tournament,
      operator,
      match,
    }),
    ...patch,
  } as IRanking
}

function onSetStats(stat: HitLocation) {
  if (!clinic.value.operator || !clinic.value.match) return

  const points = TACTICAL_POINTS[stat]
  const hitField = `${stat}_hits` as keyof IRanking
  const existing = getOpStat(clinic.value.match.$id, clinic.value.operator.$id)

  const payload = buildStatPayload(clinic.value.operator, clinic.value.match, {
    kills: (Number(existing?.kills) || 0) + 1,
    points_total: (Number(existing?.points_total) || 0) + points,
    [hitField]: (Number(existing?.[hitField]) || 0) + 1,
  })

  emit('set-stat', existing?.$id, payload)
  clinic.value = { visible: false, operator: null, match: null }
}

function onSetDeath(operator: IOperator, match: ITournamentMatch) {
  const existing = getOpStat(match.$id, operator.$id)

  const payload = buildStatPayload(operator, match, {
    deaths: (Number(existing?.deaths) || 0) + 1,
  })

  emit('set-stat', existing?.$id, payload)
}

function sideClass(match: ITournamentMatch, side: 'top' | 'bottom') {
  const winner = isWinner(match, side)
  const isFinished = !!match.winner
  return { winner, loser: isFinished && !winner }
}

function onSetWinner(match: ITournamentMatch, side: 'top' | 'bottom') {
  const team = getSide(match, side)
  if (team) emit('set-winner', match, team.$id)
}

// --- Organização de Rounds ---
const rounds = computed(() => {
  const map = new Map<number, ITournamentMatch[]>()
  props.matches.forEach(m => {
    const list = map.get(m.round) ?? []
    list.push(m); map.set(m.round, list)
  })
  return Array.from(map.entries()).sort(([a], [b]) => a - b).map(([round, matches]) => ({ round, matches }))
})

// --- Cálculos de Layout Exponencial ---
const slotH = (ri: number) => Math.pow(2, ri) * (CARD_H + GAP_MIN)
const topPad = (ri: number) => (slotH(ri) - CARD_H) / 2
const gapBetween = (ri: number) => slotH(ri) - CARD_H

function slotStyle(ri: number, mi: number) {
  const margin = mi === 0 ? topPad(ri) : gapBetween(ri)
  return { marginTop: `${margin}px` }
}

function connectorHeight(ri: number) {
  const n = rounds.value[ri]?.matches.length ?? 0
  return (n * CARD_H) + ((n - 1) * gapBetween(ri)) + (topPad(ri) * 2)
}

function connPairLine(ri: number, pi: number, part: 'top-h' | 'bot-h' | 'vert' | 'out') {
  const pad = topPad(ri)
  const gap = gapBetween(ri)
  const y0 = pad + (pi * 2) * (CARD_H + gap) + CARD_H / 2
  const y1 = pad + (pi * 2 + 1) * (CARD_H + gap) + CARD_H / 2
  const yM = (y0 + y1) / 2

  const map = {
    'top-h': { x1: '0', y1: y0, x2: '16', y2: y0 },
    'bot-h': { x1: '0', y1: y1, x2: '16', y2: y1 },
    'vert': { x1: '16', y1: y0, x2: '16', y2: y1 },
    'out': { x1: '16', y1: yM, x2: '32', y2: yM }
  }
  return map[part]
}

const championConnectorMargin = computed(() => topPad(rounds.value.length - 1))

const champion = computed(() => (props.matches.find(m => !m.next_match)?.winner as ITournamentTeam) ?? null)

const canSetWinner = (match: ITournamentMatch, side: 'top' | 'bottom') => {
  const oppositeSide = side === 'top' ? 'bottom' : 'top';

  const team = getSide(match, side);
  const enemyTeam = getSide(match, oppositeSide);

  if (!team || !enemyTeam) return false;

  const operators = getOperatorTeam(team.$id);
  const enemyOperators = getOperatorTeam(enemyTeam.$id);

  const matchStats = props.rankings.filter(s => s.match?.$id === match.$id);

  const teamKills = matchStats
    .filter(s => operators.some(op => op.$id === s.operator.$id))
    .reduce((acc, s) => acc + (s.kills || 0), 0);

  const enemyDeaths = matchStats
    .filter(s => enemyOperators.some(op => op.$id === s.operator.$id))
    .reduce((acc, s) => acc + (s.deaths || 0), 0);

  return teamKills >= props.tournament.mode && enemyDeaths >= props.tournament.mode;
};

function roundLabel(r: number) {
  const t = rounds.value.length
  if (r === t) return 'Final'
  if (r === t - 1) return 'Semifinal'
  return `Round ${r}`
}
</script>