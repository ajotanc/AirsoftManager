<template>
  <div class="flex flex-column gap-4">
    <Loadout v-model:items="operator.loadout" :owner="operator.$id" :min-complete-uniforms="MIN_COMPLETE_UNIFORMS"
      editable />
  </div>
</template>

<script setup>
import Loadout from "@/components/operators/Loadout.vue";
import { useAuthStore } from "@/stores/auth";
import { MIN_COMPLETE_UNIFORMS } from "@/constants/airsoft";

const { operator } = useAuthStore();
</script>
