<template>
    <div v-if="loading" class="flex justify-content-center">
        <ProgressSpinner />
    </div>
    <div v-else-if="operator.codename" class="flex flex-column align-items-center justify-content-center">
        <div class="w-full">
            <Level :operator="operator" />
        </div>
    </div>
    <Empty v-else label="Operador não encontrado." icon="ri ri-user-line" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { OperatorService, type IOperator } from '@/services/operator';
import PlayerCard from './games/PlayerCard.vue';
import Level from '@/components/operators/Level.vue';

const route = useRoute();
const operator = ref<IOperator>({} as IOperator);
const loading = ref(true);

const getAvailabilityLabel = (val?: string) => {
    const maps: any = { saturday: 'Sábados', sunday: 'Domingos', both: 'Fim de Semana', none: 'Indisponível' };
    return maps[val || 'none'];
};

onMounted(async () => {
    const instagram = route.params.instagram as string;
    operator.value = await OperatorService.getByInstagram(instagram);
    loading.value = false;
});

</script>