<template>
    <div class="grid flex flex-1 justify-content-center">
        <OperatorSkeleton v-if="loading" />
        <div v-else-if="operator.codename" class="col-12 md:col-4">
            <Level :operator="operator" detail />
            <div class="card">
                <Tabs value="0">
                    <TabList>
                        <Tab value="0"><i class="ri ri-function-line"></i></Tab>
                        <Tab value="1"><i class="ri ri-account-box-line"></i></Tab>
                        <Tab value="2"><i class="ri ri-trophy-line"></i></Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel value="0">
                            <Empty label="Nenhuma foto encontrada." icon="ri ri-multi-image-line" />
                        </TabPanel>
                        <TabPanel value="1">
                            <StatsCard v-model:operator="operator" />
                        </TabPanel>
                        <TabPanel value="2">
                            <BadgesList v-model:operator="operator" />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </div>
        </div>
        <Empty v-else label="Operador não encontrado." icon="ri ri-user-line" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { OperatorService, type IOperator } from '@/services/operator';
import Level from '@/components/operators/Level.vue';
import Empty from '@/components/Empty.vue';
import StatsCard from '@/components/gamification/StatsCard.vue';
import OperatorSkeleton from '@/components/skeleton/OperatorSkeleton.vue';

const route = useRoute();
const operator = ref<IOperator>({} as IOperator);
const loading = ref(true);

onMounted(async () => {
    const instagram = route.params.instagram?.toString().trim();

    if (!instagram) return;

    operator.value = await OperatorService.getByInstagram(instagram);
    loading.value = false;
});

</script>