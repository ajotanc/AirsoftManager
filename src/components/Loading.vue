<template>
  <div v-if="loading" class="overlay">
    <div :class="['loading', { 'w-3rem h-3rem': !label }]">
      <i class="text-2xl ri-loader-2-line icon-spinner"></i>
      <span v-if="label">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label?: string
  loading: boolean
}>()
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--px-mask-background, var(--p-mask-background));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--p-button-gap);
  font-weight: bold;
  background-color: var(--p-blue-500);
  color: var(--p-surface-0);
  border-radius: var(--p-button-border-radius);
  padding: var(--p-button-sm-padding-y) var(--p-button-sm-padding-x);
}
</style>