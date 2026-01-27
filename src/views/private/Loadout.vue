<template>
  <div class="flex flex-column gap-4">
    <Loadout v-model:items="loadout" :owner="operator.$id" :min-complete-uniforms="MIN_COMPLETE_UNIFORMS" editable />
  </div>
</template>

<script setup>
import Loadout from "@/components/operators/Loadout.vue";
import { MIN_COMPLETE_UNIFORMS } from "@/constants/airsoft";
import { useOperator } from "@/composables/useOperator";

const { operator, loadout } = useOperator();
</script>
