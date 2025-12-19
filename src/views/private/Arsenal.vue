<template>
  <div class="flex flex-column gap-4">
    <OperatorArsenal v-model:items="operator.arsenal" :owner="operator.$id" :qrcode="true" editable />
  </div>
</template>

<script setup>
import OperatorArsenal from "@/components/operators/OperatorArsenal.vue";
import { useAuthStore } from "@/stores/auth";

const { operator } = useAuthStore();
</script>
