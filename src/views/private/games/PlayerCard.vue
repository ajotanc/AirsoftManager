<template>
  <div class="flex align-items-center justify-content-center py-3">
    <StatsCard :operator="operator" buttons />
  </div>
</template>

<script setup lang="ts">
import StatsCard from '@/components/gamification/StatsCard.vue';
import { useOperator } from '@/composables/useOperator';

const { operator } = useOperator();
</script>