<template>
    <div class="carousel-container w-full overflow-hidden px-2">
        <Carousel :key="dtValue.length" :circular="dtValue.length > 5" :showNavigators="dtValue.length > 1"
            :value="dtValue" :numVisible="5" :numScroll="1" :responsiveOptions="responsiveOptions"
            :autoplayInterval="4000">
            <template #item="{ data: event }">
                <div v-if="loading" class="flex gap-2 p-2">
                    <Skeleton width="100%" height="16rem" borderRadius="16px" />
                </div>
                <template v-else>
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
                                        formatDate(event.date).toLocaleDateString('pt-BR') }}</span>
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
            </template>
            <template #empty>
                <div class="flex flex-column align-items-center p-4 text-gray-500">
                    <i class="pi pi-calendar text-5xl mb-2"></i>
                    <span class="text-sm">Nenhuma eventos econtrado.</span>
                </div>
            </template>
        </Carousel>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { EVENT_TYPES } from '@/constants/airsoft';
import { formatDate, severityEvent, goToEvent } from '@/functions/utils';
import { Skeleton, useToast } from 'primevue';
import { EventService, type IEvent } from '@/services/event';

const allEvents = ref<IEvent[]>([]);

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
        allEvents.value = await EventService.list() as IEvent[];
    } catch (error) {
        console.error("Erro ao carregar serviços:", error);
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados.' });
    } finally {
        loading.value = false;
    }
};

const dtValue = computed(() => {
    return loading.value ? new Array(5).fill({}) : allEvents.value;
});

</script>