<template>
    <Carousel :value="allEvents" :numVisible="3" :numScroll="1" :responsiveOptions="responsiveOptions" circular
        :autoplayInterval="3000" class="m-2">
        <template #item="{ data: event }">
            <Card class="overflow-hidden mission-card">
                <template #header>
                    <div class="relative overflow-hidden">
                        <Tag :value="EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] || 'Padrão'"
                            :severity="severity(event.type)" class="absolute top-0 left-0 m-3 z-2" />

                        <div v-if="event.thumbnail && isValidUrl(event.thumbnail)" class="w-full rounded"
                            :style="{ minHeight: '12rem', backgroundImage: `url(${event.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center center' }" />
                        <div v-else class="flex align-items-center justify-content-center bg-gray-200"
                            style="min-height: 12rem;">
                            <i class="pi pi-image"></i>
                        </div>
                    </div>
                </template>
                <template #title>{{ event.title }}</template>
                <template #subtitle>{{ event.location }}</template>
                <template #content>
                    <div class="flex gap-2 align-items-center text-gray-400">
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-calendar text-primary"></i>
                            <span>{{ formatDate(event.date, true) }}</span>
                        </div>
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-clock text-primary"></i>
                            <span>{{ event.startTime }} - {{ event.endTime }}</span>
                        </div>
                    </div>
                </template>
                <template #footer>
                    <Button label="Ver mais..." icon="pi pi-external-link" class="w-full" severity="primary"
                        @click="goToEvent(event.$id)" />
                </template>
            </Card>
        </template>
    </Carousel>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { EventService, type IEvent } from '@/services/event';
import { EVENT_TYPES } from '@/constants/airsoft';
import { formatDate } from '@/functions/utils';

const router = useRouter();
const allEvents = ref<IEvent[]>([]);

const isValidUrl = (url: string) => {
    const pattern = /^https?:\/\//;
    return pattern.test(url);
};

const responsiveOptions = ref([
    {
        breakpoint: '1400px',
        numVisible: 2,
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

const severity = (type: number): string => {
    switch (type) {
        case 1:
            return 'success';
        case 2:
            return 'warn';
        case 3:
            return 'danger';
        case 4:
            return 'info';
        case 5:
            return 'helper';
        case 6:
            return 'primary';
        default:
            return 'secondary';
    }
};

onMounted(async () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const result = await EventService.list() as IEvent[];
    // const result = await EventService.listFromDate(firstDayOfMonth) as IEvent[];
    allEvents.value = result;
});

const goToEvent = (id: string) => router.push(`/events/${id}`);
</script>

<style scoped>
.mission-card {
    background: linear-gradient(180deg, #001A33 0%, #000D1A 100%);
    margin-inline: 0.25rem;
}

.mission-card:hover {
    box-shadow: 0 10px 30px rgba(212, 175, 55, 0.15);
}

:deep(.p-dataview-content) {
    background: transparent !important;
}
</style>