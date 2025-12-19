<template>
  <div class="flex align-items-center justify-content-center min-h-screen surface-ground p-4">
    <div v-if="loading">Buscando dados no sistema...</div>

    <div v-else-if="weapon" class="surface-card p-4 shadow-4 border-round max-w-30rem w-full text-center">
      <i class="pi pi-shield text-6xl text-green-500 mb-4"></i>
      <h1 class="text-2xl font-bold mb-2">{{ weapon.name }}</h1>
      <Tag :value="WEAPON_TYPES[weapon.type]" severity="success" class="mb-4"></Tag>

      <div class="text-left border-top-1 border-gray-200 pt-3">
        <p><strong>Proprietário:</strong> {{ weapon.operator.codename }} <a
            :href="`https://wa.me/${weapon.operator.phone}`" target="_blank"><span class="pi pi-whatsapp"
              style="color: green"></span></a></p>
        <p><strong>FPS:</strong> {{ weapon.fps }}</p>
        <p><strong>Joule:</strong> {{ weapon.joule }}</p>
        <p><strong>Serial:</strong> {{ weapon.serial_number }}</p>
        <p class="mt-3 text-sm text-gray-500">
          Se você encontrou este equipamento perdido, por favor entre em contato com a equipe.
        </p>
      </div>
    </div>
    <div v-else class="text-red-500 font-bold">
      Equipamento não encontrado ou QR Code inválido.
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { WEAPON_TYPES } from '@/constants/airsoft';
import { ArsenalService } from '@/services/arsenal';

const route = useRoute();
const weapon = ref(null);
const loading = ref(true);

onMounted(async () => {
  const weaponId = route.params.id;

  try {
    const response = await ArsenalService.row(weaponId);

    weapon.value = response;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

</script>