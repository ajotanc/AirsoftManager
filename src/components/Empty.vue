<template>
  <div class="flex flex-column align-items-center p-4 text-gray-500">
    <i :class="[props.icon, 'text-5xl mb-2']"></i>
    <span class="text-sm">{{ props.label }}</span>
  </div>
</template>

<script setup lang="ts">

defineOptions({
  inheritAttrs: false
});

const props = defineProps<{
  label: string;
  icon: string;
}>();

</script>