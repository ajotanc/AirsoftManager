<template>
  <div class="p-3">
    <!-- 1. Painel Administrativo Skeleton -->
    <div class="tournament-wrapper mb-4">
      <Skeleton width="180px" height="1.5rem" class="mb-3" />
      <div class="grid">
        <div class="col-12 md:col-6">
          <Skeleton height="100px" borderRadius="12px" />
        </div>
        <div class="col-12 md:col-6">
          <Skeleton height="100px" borderRadius="12px" />
        </div>
      </div>
    </div>

    <!-- 2. Info Skeleton -->
    <div class="tournament-wrapper mb-4">
      <div class="section-title">
        <Skeleton width="200px" height="1.5rem" />
      </div>
      <div class="info-grid grid">
        <div v-for="i in 6" :key="'info-' + i" class="col-12 md:col-4 lg:col-2">
          <div class="info-card">
            <Skeleton width="50px" height="0.7rem" class="mb-2" />
            <Skeleton width="100%" height="1.2rem" />
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Bracket Skeleton (CORRIGIDO) -->
    <div class="tournament-wrapper mb-4">
      <div class="section-title">
        <Skeleton width="150px" height="1.5rem" />
      </div>
      <div class="info-grid">
        <div class="info-card red">
          <div class="bracket-wrapper overflow-hidden">
            <div class="bracket flex gap-5">
              <!-- Round 1: 4 partidas -->
              <div class="round-col">
                <div class="round-label">
                  <Skeleton width="60px" height="16px" />
                </div>
                <div v-for="m in 4" :key="'r1-' + m" class="match-card shadow-3" style="margin-top: 20px;">
                  <div class="p-2 border-bottom-1 border-200">
                    <Skeleton width="80px" height="20px" />
                  </div>
                  <div class="p-2">
                    <Skeleton width="80px" height="20px" />
                  </div>
                </div>
              </div>
              <!-- Round 2: 2 partidas -->
              <div class="round-col hidden md:block">
                <div class="round-label">
                  <Skeleton width="60px" height="16px" />
                </div>
                <div v-for="m in 2" :key="'r2-' + m" class="match-card shadow-3" style="margin-top:67px;"
                  :style="[m === 2 ? { marginTop: '114px' } : {}]">
                  <div class="p-2 border-bottom-1 border-200">
                    <Skeleton width="80px" height="20px" />
                  </div>
                  <div class="p-2 border-bottom-1 border-200">
                    <Skeleton width="80px" height="20px" />
                  </div>
                </div>
              </div>
              <!-- Round 3: 1 partida -->
              <div class="round-col hidden lg:block">
                <div class="round-label">
                  <Skeleton width="60px" height="16px" />
                </div>
                <div v-for="m in 1" :key="'r3-' + m" class="match-card shadow-3" style="margin-top: 162px;">
                  <div class="p-2 border-bottom-1 border-200">
                    <Skeleton width="80px" height="20px" />
                  </div>
                  <div class="p-2">
                    <Skeleton width="80px" height="20px" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 1. Skeleton dos Cards de Destaque (MVP) -->
    <div class="tournament-wrapper">
      <div class="section-title">
        <Skeleton width="120px" height="1.5rem" />
      </div>
      <div class="info-grid grid">
        <!-- 3 Cards (Pontos, Kills, Headshots) -->
        <div v-for="i in 3" :key="'mvp-' + i" class="col-12 md:col-4">
          <div class="info-card">
            <!-- Simula o BG (PTS, KLS, HS) -->
            <Skeleton width="40px" height="0.7rem" class="mb-3" />
            <!-- Simula Label (Estrela, Alvo, Caveira) -->
            <Skeleton width="60%" height="0.9rem" class="mb-3" />
            <!-- Simula Nome do Operador -->
            <Skeleton width="80%" height="1.4rem" class="mb-2" />
            <!-- Simula Nome do Time -->
            <Skeleton width="40%" height="0.7rem" class="mb-3" />
            <!-- Simula Valor Grande -->
            <Skeleton width="100px" height="2rem" />
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Skeleton do Leaderboard Geral -->
    <div class="tournament-wrapper">
      <div class="section-title">
        <Skeleton width="180px" height="1.5rem" />
      </div>
      <div class="lb-table">
        <!-- Header da Tabela -->
        <div class="lb-header">
          <div class="lb-cell center" style="width: 40px;">
            <Skeleton width="15px" />
          </div>
          <div class="lb-cell" style="flex: 2;">
            <Skeleton width="80px" />
          </div>
          <!-- 10 colunas de stats -->
          <div v-for="h in 10" :key="'h-' + h" class="lb-cell center">
            <Skeleton width="20px" />
          </div>
        </div>

        <!-- 5 Linhas de Exemplo -->
        <div v-for="row in 5" :key="'row-' + row" class="lb-row">
          <div class="lb-cell center rank">
            <Skeleton shape="circle" size="1.8rem" />
          </div>
          <div class="lb-cell" style="flex: 2;">
            <Skeleton width="120px" height="1rem" class="mb-1" />
            <Skeleton width="60px" height="0.6rem" />
          </div>
          <!-- Stats Cells -->
          <div v-for="s in 10" :key="'s-' + s" class="lb-cell center">
            <Skeleton width="25px" height="0.9rem" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Skeleton from "primevue/skeleton";
import "@/components/tournament/style.css";

</script>

<style scoped></style>