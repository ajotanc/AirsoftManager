<template>
  <div class="flex flex-column gap-4">
    <Arsenal v-model:items="operator.arsenal" :owner="operator.$id" :qrcode="true" editable />
  </div>
</template>

<script setup>
import Arsenal from "@/components/operators/Arsenal.vue";
import { useAuthStore } from "@/stores/auth";

const { operator } = useAuthStore();
</script>
