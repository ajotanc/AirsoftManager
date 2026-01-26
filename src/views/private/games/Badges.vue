<template>
  <BadgesList v-model:items="operator.badges" :header="true" />
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import BadgesList from '@/components/gamification/BadgesList.vue';

const { operator } = useAuthStore();

</script>