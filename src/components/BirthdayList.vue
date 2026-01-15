<template>
  <Carousel v-if="allBirthdays.length > 0" :value="allBirthdays" :numVisible="5" :numScroll="1"
    :responsiveOptions="responsiveOptions" circular :autoplayInterval="4000">
    <template #item="{ data: birthday }">
      <div class="p-2 h-full">
        <Card class="h-full border-1 border-white-alpha-10 overflow-hidden flex flex-column">
          <template #content>
            <a class="no-underline"
              :href="isBirthdayToday(birthday.birth_date) ? `/happy-birthday/${birthday.$id}` : 'javascript:void(0);'">
              <div class="wrapper">
                <div v-if="isBirthdayToday(birthday.birth_date)"
                  class="w-full flex justify-content-between align-items-center absolute top-0 right-0 p-3 z-2">
                  <Tag value="Feliz Aniversário!" severity="warn" />
                  <i class="pi pi-gift text-base md:text-xl text-yellow-50"></i>
                </div>

                <Image v-if="birthday.avatar && isValidUrl(birthday.avatar)" :src="birthday.avatar"
                  :alt="birthday.codename" class="avatar" />
                <div v-else class="avatar">
                  <i class="pi pi-image text-3xl text-blue-200"></i>
                </div>
                <div class="content">
                  <span class="text-xs md:text-base font-bold text-yellow-500">{{ birthday.codename }}</span>
                  <span class="text-base md:text-2xl font-bold">{{ getShortName(birthday.name) }}</span>
                  <span class="text-xs md:text-base">{{ formatDate(birthday.birth_date, true) }}</span>
                </div>
              </div>
            </a>
          </template>
        </Card>
      </div>
    </template>
    <template #empty>Nenhum aniversariante encontrado.</template>
  </Carousel>
  <div v-else class="flex gap-3 p-4">
    <Skeleton height="20rem" class="w-full" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { formatDate, isBirthdayToday, getShortName } from '@/functions/utils';
import { OperatorService, type IOperator } from '@/services/operator';

const allBirthdays = ref<IOperator[]>([]);

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
  allBirthdays.value = await OperatorService.list();
  // allBirthdays.value = await OperatorService.listBirthdays() as IOperator[];
});
</script>

<style scoped>
.wrapper {
  position: relative;
  overflow: hidden;
  border-radius: var(--p-card-border-radius);
  background-color: var(--p-blue-300);
}

.wrapper::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, transparent 20%, rgba(0, 0, 0, 0.8) 80%);
}

.avatar {
  width: 100%;
  aspect-ratio: 3 / 4;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--p-blue-300);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.content {
  position: absolute;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1;
  color: white;
  text-transform: uppercase;
  bottom: 0;
  left: 0;
  padding: 1rem;
}

:deep(.avatar img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>