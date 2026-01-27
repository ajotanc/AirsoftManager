<template>
  <div class="p-3">
    <BadgesList v-model:operator="operator" :showActions="true" />
  </div>
</template>

<script setup lang="ts">
import BadgesList from '@/components/gamification/BadgesList.vue';
import { useOperator } from '@/composables/useOperator';

const { operator } = useOperator();
</script>