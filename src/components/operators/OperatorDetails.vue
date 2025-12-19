<template>
  <div class="flex flex-column gap-4">
    <OperatorLoadout v-model:items="operator.loadout" :show-status="true"
      :min-complete-uniforms="MIN_COMPLETE_UNIFORMS" />
    <OperatorArsenal v-model:items="operator.arsenal" />
  </div>
</template>

<script setup>
import OperatorLoadout from "@/components/operators/OperatorLoadout.vue";
import OperatorArsenal from "@/components/operators/OperatorArsenal.vue";
import { MIN_COMPLETE_UNIFORMS } from "@/constants/airsoft";

defineProps(["operator"]);
</script>
