<template>
  <div class="flex flex-column gap-4">
    <Arsenal v-model:items="arsenal" :owner="operator.$id" :qrcode="true" editable />
  </div>
</template>

<script setup>
import Arsenal from "@/components/operators/Arsenal.vue";
import { useOperator } from "@/composables/useOperator";

const { operator, arsenal } = useOperator();
</script>
