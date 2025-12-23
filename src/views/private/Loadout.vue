<template>
  <div class="flex flex-column gap-4">
    <OperatorLoadout v-model:items="operator.loadout" :owner="operator.$id"
      :min-complete-uniforms="MIN_COMPLETE_UNIFORMS" editable />
  </div>
</template>

<script setup>
import OperatorLoadout from "@/components/operators/OperatorLoadout.vue";
import { useAuthStore } from "@/stores/auth";
import { MIN_COMPLETE_UNIFORMS } from "@/constants/airsoft";

const { operator } = useAuthStore();
</script>
