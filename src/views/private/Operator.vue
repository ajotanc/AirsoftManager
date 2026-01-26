<template>
    <div v-if="loading" class="flex justify-content-center">
        <ProgressSpinner />
    </div>

    <div v-else-if="op" class="flex flex-column align-items-center justify-content-center">
        <div class="w-full">
            <Level :operator="op" />
        </div>
    </div>

    <div v-else class="text-center">
        <i class="ri-user-search-line text-6xl text-secondary"></i>
        <p>Operador não encontrado.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { OperatorService, type IOperator } from '@/services/operator';
import PlayerCard from './games/PlayerCard.vue';
import Level from '@/components/operators/Level.vue';

const route = useRoute();
const op = ref<IOperator | null>(null);
const loading = ref(true);

const getAvailabilityLabel = (val?: string) => {
    const maps: any = { saturday: 'Sábados', sunday: 'Domingos', both: 'Fim de Semana', none: 'Indisponível' };
    return maps[val || 'none'];
};

onMounted(async () => {
    const instagram = route.params.instagram as string;
    op.value = await OperatorService.getByInstagram(instagram);
    loading.value = false;
});
</script>