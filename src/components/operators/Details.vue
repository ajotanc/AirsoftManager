<template>
  <div class="flex flex-column gap-4">
    <Loadout v-model:items="operator.loadout" :show-status="true"
      :min-complete-uniforms="MIN_COMPLETE_UNIFORMS" />
    <Arsenal v-model:items="operator.arsenal" />
  </div>
</template>

<script setup>
import Loadout from "@/components/operators/Loadout.vue";
import Arsenal from "@/components/operators/Arsenal.vue";
import { MIN_COMPLETE_UNIFORMS } from "@/constants/airsoft";

defineProps(["operator"]);
</script>
