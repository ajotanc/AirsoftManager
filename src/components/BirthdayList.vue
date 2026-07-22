<template>
  <Carousel :key="dtValue.length" :circular="dtValue.length > 5" :showNavigators="false" :value="dtValue"
    :numVisible="5" :numScroll="1" :responsiveOptions="responsiveOptions" :autoplayInterval="4000">
    <template #item="{ data: birthday }">
      <div v-if="loading" class="flex gap-2">
        <Skeleton width="100%" style="aspect-ratio: 3 / 4;" borderRadius="16px" />
      </div>
      <template v-else>
        <Card class="border-1 border-white-alpha-10 overflow-hidden shadow-3 m-2">
          <template #content>
            <div class="wrapper" @click="goToBirthday(birthday)">
              <div v-if="isBirthdayToday(birthday.birth_date)"
                class="w-full flex justify-content-between align-items-center absolute top-0 right-0 p-3 z-2">
                <Tag value="Feliz Aniversário!" severity="warn" />
                <i class="pi pi-gift text-base md:text-xl text-yellow-50"></i>
              </div>

              <img v-if="birthday.avatar && isValidUrl(birthday.avatar)" :src="birthday.avatar"
                :alt="birthday.codename" class="avatar-img" />
              <div v-else class="avatar-fallback flex justify-content-center align-items-center">
                <i class="pi pi-image text-3xl text-blue-200"></i>
              </div>
              <div class="content">
                <span class="text-xs md:text-base font-bold text-yellow-500">{{ birthday.codename }}</span>
                <span class="text-base md:text-2xl font-bold">{{ getShortName(birthday.name) }}</span>
                <span class="text-xs md:text-base">{{ formatDate(birthday.birth_date).toLocaleDateString('pt-BR')
                }}</span>
              </div>
            </div>
          </template>
        </Card>
      </template>
    </template>
    <template #empty>
      <Empty label="Nenhum aniversariante encontrado para este mês" icon="ri-cake-2-line" />
    </template>
  </Carousel>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { formatDate, isBirthdayToday, getShortName } from '@/functions/utils';
import { OperatorService, type IOperator } from '@/services/operator';
import { useToast } from 'primevue';
import Empty from './Empty.vue';
import router from '@/router';

const allBirthdays = ref<IOperator[]>([]);

const loading = ref(true);

const toast = useToast();

const isValidUrl = (url: string) => {
  const pattern = /^https?:\/\//;
  return pattern.test(url);
};

const responsiveOptions = ref([
  {
    breakpoint: '1400px',
    numVisible: 5,
    numScroll: 1
  },
  {
    breakpoint: '1199px',
    numVisible: 3,
    numScroll: 1
  },
  {
    breakpoint: '767px',
    numVisible: 2,
    numScroll: 1
  },
  {
    breakpoint: '575px',
    numVisible: 1,
    numScroll: 1

  }
]);

onMounted(async () => {
  loadServices();
});

const loadServices = async () => {
  try {
    allBirthdays.value = await OperatorService.listBirthdays();
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados.' });
  } finally {
    loading.value = false;
  }
};

const goToBirthday = (operator: IOperator) => {
  isBirthdayToday(operator.birth_date) && router.push({ name: 'happy-birthday', params: { id: operator.$id } });
};

const dtValue = computed(() => {
  return loading.value ? new Array(5).fill({}) : allBirthdays.value;
});

</script>

<style scoped>
:deep(.p-card-body) {
  padding: 0;
}

.wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: inherit;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  -webkit-mask-image: -webkit-radial-gradient(white, black);
  mask-image: -webkit-radial-gradient(white, black);
}

.wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 20%, rgba(0, 0, 0, 0.8) 80%);
  border-radius: inherit;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  background-color: var(--p-surface-800);
}

.content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  z-index: 1;
  color: white;
  text-transform: uppercase;
  padding: 1.5rem 1rem 1rem 1rem;
}
</style>