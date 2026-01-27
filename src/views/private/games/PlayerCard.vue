<template>
  <div class="flex align-items-center justify-content-center py-3">
    <StatsCard :operator="operator" buttons />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import StatsCard from '@/components/gamification/StatsCard.vue';

const { operator } = useAuthStore();
</script>