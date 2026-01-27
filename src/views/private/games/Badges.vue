<template>
  <div class="p-3">
    <BadgesList v-model:operator="operator" :showActions="true" />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import BadgesList from '@/components/gamification/BadgesList.vue';

const { operator } = useAuthStore();

</script>