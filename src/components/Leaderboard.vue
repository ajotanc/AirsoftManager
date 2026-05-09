<template>
  <div class="info-grid grid highlights">
    <div v-if="mvpPoints" class="info-card col-12 md:col-4 gold">
      <div class="info-card-bg">PTS</div>
      <div class="mvp-label">⭐ Maior Pontuação</div>
      <div class="mvp-operator">{{ mvpPoints.operator.codename || mvpPoints.operator.name }}</div>
      <div class="mvp-team">{{ getTeamName(mvpPoints.operator.$id) }}</div>
      <div class="mvp-value">{{ mvpPoints.points_total ?? 0 }} <span>pts</span></div>
    </div>
    <div v-if="mvpKills" class="info-card col-12 md:col-4 red">
      <div class="info-card-bg">KLS</div>
      <div class="mvp-label">🎯 Maior Kills</div>
      <div class="mvp-operator">{{ mvpKills.operator.codename || mvpKills.operator.name }}</div>
      <div class="mvp-team">{{ getTeamName(mvpKills.operator.$id) }}</div>
      <div class="mvp-value">{{ mvpKills.kills ?? 0 }} <span>kills</span></div>
    </div>
    <div v-if="mvpHeadshots" class="info-card col-12 md:col-4 blue">
      <div class="info-card-bg">HS</div>
      <div class="mvp-label">💀 Headshots</div>
      <div class="mvp-operator">{{ mvpHeadshots.operator.codename || mvpHeadshots.operator.name }}</div>
      <div class="mvp-team">{{ getTeamName(mvpHeadshots.operator.$id) }}</div>
      <div class="mvp-value">{{ mvpHeadshots.head_hits ?? 0 }} <span>hs</span></div>
    </div>
  </div>
  <div class="lb-table">
    <div class="lb-header">
      <div class="lb-cell center">#</div>
      <div class="lb-cell">Operador</div>
      <div class="lb-cell center">K</div>
      <div class="lb-cell center">D</div>
      <div class="lb-cell center">K/D</div>
      <div class="lb-cell center">HS</div>
      <div class="lb-cell center">Torso</div>
      <div class="lb-cell center">MMS-E</div>
      <div class="lb-cell center">MMS-D</div>
      <div class="lb-cell center">MMI-E</div>
      <div class="lb-cell center">MMI-D</div>
      <div class="lb-cell center">W</div>
      <div class="lb-cell center">L</div>
      <div class="lb-cell center">Pts</div>
    </div>

    <div v-for="(row, index) in ranked.slice(0, 10)" :key="row.operator.$id" :class="['lb-row', {
      'rank-1': index === 0,
      'rank-2': index === 1,
      'rank-3': index === 2,
    }]">
      <div :class="['lb-cell center rank', { r1: index === 0, r2: index === 1, r3: index === 2 }]">
        {{ topRank[index + 1] || index + 1 }}
      </div>
      <div class="lb-cell">
        <div class="op-name">{{ row.operator.codename || row.operator.name }}</div>
        <div class="op-team">{{ getTeamName(row.operator.$id) }}</div>
      </div>
      <div class="lb-cell center stat">{{ row.kills ?? 0 }}</div>
      <div class="lb-cell center stat deaths">{{ row.deaths ?? 0 }}</div>
      <div class="lb-cell center stat">{{ kd(row) }}</div>
      <div class="lb-cell center stat">{{ hitRate(row.head_hits ?? 0, row.kills ?? 0) }}</div>
      <div class="lb-cell center stat">{{ hitRate(row.torso_hits ?? 0, row.kills ?? 0) }}</div>
      <div class="lb-cell center stat">{{ hitRate(row.mms_left_hits ?? 0, row.kills ?? 0) }}</div>
      <div class="lb-cell center stat">{{ hitRate(row.mms_right_hits ?? 0, row.kills ?? 0) }}</div>
      <div class="lb-cell center stat">{{ hitRate(row.mmi_left_hits ?? 0, row.kills ?? 0) }}</div>
      <div class="lb-cell center stat">{{ hitRate(row.mmi_right_hits ?? 0, row.kills ?? 0) }}</div>
      <div class="lb-cell center stat">{{ row.wins ?? 0 }}</div>
      <div class="lb-cell center stat">{{ row.losses ?? 0 }}</div>
      <div class="lb-cell center stat pts">{{ row.points_total ?? 0 }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ITournamentTeam } from '@/services/tournament'
import type { IRanking } from '@/services/ranking'
import type { IOperator } from '@/services/operator'

interface Props {
  rankings: IRanking[]
  teams: ITournamentTeam[]
}

const props = defineProps<Props>()

const topRank: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

const kd = (s: IRanking) => {
  const kills = Number(s.kills) || 0
  const deaths = Number(s.deaths) || 1
  return (kills / deaths).toFixed(2)
}

const ranked = computed(() => {
  const map = new Map<string, IRanking>()

  for (const s of props.rankings) {
    const opId = s.operator.$id
    const existing = map.get(opId)

    if (existing) {
      map.set(opId, {
        ...existing,
        wins: (Number(existing.wins) || 0) + (Number(s.wins) || 0),
        losses: (Number(existing.losses) || 0) + (Number(s.losses) || 0),
        kills: (Number(existing.kills) || 0) + (Number(s.kills) || 0),
        deaths: (Number(existing.deaths) || 0) + (Number(s.deaths) || 0),
        points_total: (Number(existing.points_total) || 0) + (Number(s.points_total) || 0),
        head_hits: (Number(existing.head_hits) || 0) + (Number(s.head_hits) || 0),
        torso_hits: (Number(existing.torso_hits) || 0) + (Number(s.torso_hits) || 0),
        mms_left_hits: (Number(existing.mms_left_hits) || 0) + (Number(s.mms_left_hits) || 0),
        mms_right_hits: (Number(existing.mms_right_hits) || 0) + (Number(s.mms_right_hits) || 0),
        mmi_left_hits: (Number(existing.mmi_left_hits) || 0) + (Number(s.mmi_left_hits) || 0),
        mmi_right_hits: (Number(existing.mmi_right_hits) || 0) + (Number(s.mmi_right_hits) || 0),
      })
    } else {
      map.set(opId, { ...s })
    }
  }

  return Array.from(map.values())
    .sort((a, b) => {
      // 1. Critério principal: Pontos
      if ((b.points_total ?? 0) !== (a.points_total ?? 0)) {
        return (b.points_total ?? 0) - (a.points_total ?? 0)
      }

      // 2. Primeiro desempate: Mais Kills
      if ((b.kills ?? 0) !== (a.kills ?? 0)) {
        return (b.kills ?? 0) - (a.kills ?? 0)
      }

      // 3. Segundo desempate: Menos Mortes (Invertido, pois menor é melhor)
      return (a.deaths ?? 0) - (b.deaths ?? 0)
    })
})

const mvpPoints = computed(() => ranked.value[0] ?? null)
const mvpKills = computed(() => [...ranked.value].sort((a, b) => (b.kills ?? 0) - (a.kills ?? 0))[0] ?? null)
const mvpHeadshots = computed(() => [...ranked.value].sort((a, b) => (b.head_hits ?? 0) - (a.head_hits ?? 0))[0] ?? null)

function getTeamName(operatorId: string): string {
  const team = props.teams?.find(t => {
    const ops = t.operators as IOperator[];
    return ops.some(op => op.$id === operatorId);
  })

  return team?.name ?? ''
}

const hitRate = (hits: number, kills: number) => {
  if (!kills) return '-'
  return `${Math.round((hits / kills) * 100)}%`
}
</script>