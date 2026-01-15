<template>
    <div class="carousel-container w-full overflow-hidden px-2">
        <Carousel v-if="allEvents.length > 0" :value="allEvents" :numVisible="5" :numScroll="1"
            :responsiveOptions="responsiveOptions" circular :autoplayInterval="4000">
            <template #item="{ data: event }">
                <div class="p-2 h-full">
                    <Card class="h-full border-1 border-white-alpha-10 overflow-hidden flex flex-column">
                        <template #header>
                            <div class="relative">
                                <Tag :value="EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] || 'Padrão'"
                                    :severity="severityEvent(event.type)" class="absolute top-0 left-0 m-2 z-2" />
                                <div v-if="event.thumbnail && isValidUrl(event.thumbnail)" class="w-full" :style="{
                                    height: '10rem',
                                    backgroundImage: `url(${event.thumbnail})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }" />
                                <div v-else class="flex align-items-center justify-content-center bg-gray-800"
                                    style="height: 10rem;">
                                    <i class="pi pi-image text-3xl text-gray-600"></i>
                                </div>
                            </div>
                        </template>

                        <template #title>
                            <div class="text-lg font-bold text-gold-500 line-clamp-1 mt-2">
                                {{ event.title }}
                            </div>
                        </template>

                        <template #content>
                            <div class="flex flex-column gap-1 text-sm text-gray-400">
                                <span><i class="pi pi-map-marker mr-1 text-xs"></i>{{ event.location }}</span>
                                <span><i class="pi pi-calendar mr-1 text-xs text-primary-500"></i>{{
                                    formatDate(event.date, true) }}</span>
                            </div>
                        </template>

                        <template #footer>
                            <div class="mt-auto">
                                <Button label="Ver Missão" icon="pi pi-search" class="w-full p-button-sm"
                                    @click="goToEvent(event.$id)" />
                            </div>
                        </template>
                    </Card>
                </div>
            </template>
        </Carousel>
        <div v-else class="flex gap-3 p-4">
            <Skeleton height="20rem" class="w-full" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { EventService, type IEvent } from '@/services/event';
import { EVENT_TYPES } from '@/constants/airsoft';
import { formatDate, severityEvent } from '@/functions/utils';

const router = useRouter();
const allEvents = ref<IEvent[]>([]);

const isValidUrl = (url: string) => {
    const pattern = /^https?:\/\//;
    return pattern.test(url);
};

const responsiveOptions = ref([
    {
        breakpoint: '1400px',
        numVisible: 5, // Telas grandes: 3 itens
        numScroll: 1
    },
    {
        breakpoint: '1199px',
        numVisible: 3, // Telas médias: 2 itens
        numScroll: 1
    },
    {
        breakpoint: '767px',
        numVisible: 2, // Tablets/Mobile: 1 item (Essencial para não esmagar os cards)
        numScroll: 1
    },
    {
        breakpoint: '575px',
        numVisible: 1,
        numScroll: 1

    }
]);

onMounted(async () => {
    allEvents.value = await EventService.list() as IEvent[];
});

const goToEvent = (id: string) => router.push(`/events/${id}`);
</script>