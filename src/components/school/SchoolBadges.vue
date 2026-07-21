<template>
  <div class="flex flex-wrap align-items-center gap-2">
    <Tag :value="timeText" :severity="timeSeverity" rounded />
    <Tag :value="xpText" :severity="xpSeverity" rounded />
  </div>
</template>

<script setup lang="ts">
import Tag from 'primevue/tag';

withDefaults(defineProps<{
  timeText?: string;
  xpText?: string;
  timeSeverity?: string;
  xpSeverity?: string;
}>(), {
  timeText: '⏱️ Leva 3 a 5 min',
  xpText: '🏆 Ganhe +250 XP',
  timeSeverity: 'secondary',
  xpSeverity: 'success'
});
</script>
