<template>
  <div class="flex flex-column gap-4">
    <OperatorLoadout v-model:items="operator.loadout" :owner="operator.$id" editable />
  </div>
</template>

<script setup>
import OperatorLoadout from "@/components/operators/OperatorLoadout.vue";
import { useAuthStore } from "@/stores/auth";

const { operator } = useAuthStore();
</script>
