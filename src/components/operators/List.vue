<template>
  <div class="carousel-container w-full overflow-hidden p-2">
    <Carousel :key="dtValue.length" :circular="dtValue.length > 12" :showNavigators="dtValue.length > 1"
      :value="dtValue" :numVisible="12" :numScroll="1" :responsiveOptions="responsiveOptions" :autoplayInterval="4000"
      :showIndicators="false">
      <template #item="{ data: op }">
        <div v-if="loading" class="flex gap-2 p-2">
          <Skeleton width="100%" height="16rem" borderRadius="16px" />
        </div>
        <template v-else>
          <div class="flex justify-content-center align-items-center">
            <Avatar :image="op.avatar" :icon="!op.avatar ? 'pi pi-user' : undefined" size="xlarge" shape="circle"
              @click="router.push(`/operator/${op.instagram || op.$id}`)" class="bg-gray-300 cursor-pointer" />
          </div>
        </template>
      </template>
      <template #empty>
        <Empty label="Nenhum evento encontrado" icon="ri-calendar-event-line" />
      </template>
    </Carousel>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { OperatorService, type IOperator } from '@/services/operator';
import router from "@/router";

const operators = ref<IOperator[]>([]);
const loading = ref(true);

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  try {
    operators.value = await OperatorService.listActive();
  } catch (error) {
    console.error("Erro ao carregar:", error);
  } finally {
    loading.value = false;
  }
};

const dtValue = computed(() => {
  return loading.value ? new Array(5).fill({}) : operators.value;
});

const responsiveOptions = ref([
  {
    breakpoint: '1400px',
    numVisible: 12,
    numScroll: 1
  },
  {
    breakpoint: '1199px',
    numVisible: 6,
    numScroll: 1
  },
  {
    breakpoint: '767px',
    numVisible: 4,
    numScroll: 1
  },
  {
    breakpoint: '575px',
    numVisible: 2,
    numScroll: 1

  }
]);


</script>