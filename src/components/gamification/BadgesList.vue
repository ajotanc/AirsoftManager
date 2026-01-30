<template>
    <div v-if="showActions" class="flex flex-column md:flex-row justify-content-between align-items-center mb-3">
        <div class="flex flex-column text-center md:text-left mb-3 md:mb-0">
            <h2 class="text-2xl font-bold m-0">Minhas Conquistas</h2>
            <span class="text-lg">{{ operator.badges?.length || 0 }}/{{ ALL_BADGES_DEFINITION.length }}</span>
        </div>
        <Tag severity="warn" :value="`${operator.featured_badges?.length || 0} / 5 Destaques`" icon="pi pi-star-fill" />
    </div>

    <div class="flex flex-wrap justify-content-center gap-3">
        <div v-for="badge in ALL_BADGES_DEFINITION" :key="badge.slug"
            class="badge-item flex flex-column justify-content-center align-items-center gap-3 p-3 border-2 border-round transition-all transition-duration-300 relative"
            :class="{
                'earned-badge': isEarned(badge.slug),
                'locked-badge': !isEarned(badge.slug),
                'featured-badge': isFeatured(badge.slug)
            }" tabindex="0" v-tooltip.bottom.focus="badge.description" :style="{
                backgroundColor: isFeatured(badge.slug) ? badge.color + '25' : '',
                borderColor: isFeatured(badge.slug) ? badge.color + '60' : ''
            }">
            <BadgeIcon :slug="badge.slug" :earned="isEarned(badge.slug)" size="large" />

            <span class="badge-label font-bold text-xs text-center uppercase">
                {{ badge.label }}
            </span>
            <Button v-if="showActions" @click="toggleFeatured(badge.slug)" severity="warn"
                class="absolute top-0 right-0" :icon="isFeatured(badge.slug) ? 'ri-star-fill' : 'ri-star-line'"
                :disabled="(operator.featured_badges?.length === 5 && !isFeatured(badge.slug) || !isEarned(badge.slug))"
                text size="small" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ALL_BADGES_DEFINITION } from '@/constants/airsoft';
import { OperatorService, type IOperator } from '@/services/operator';
import { useToast } from 'primevue/usetoast';
import Tag from 'primevue/tag';

// console.log(ALL_BADGES_DEFINITION.map(b => b.slug).join(', '));

const toast = useToast();

const operator = defineModel<IOperator>('operator', {
    required: true
});

const props = defineProps({
    showActions: {
        type: Boolean,
        default: false
    }
});

const isEarned = (slug: string): boolean => {
    return operator.value.badges?.includes(slug) || false;
};

const isFeatured = (slug: string): boolean => {
    return operator.value.featured_badges?.includes(slug) || false;
};

const toggleFeatured = async (slug: string) => {
    if (!isEarned(slug)) return;

    let featured = [...(operator.value.featured_badges || [])];

    if (isFeatured(slug)) {
        featured = featured.filter(s => s !== slug);
    } else {
        if (featured.length >= 5) {
            toast.add({ severity: 'warn', summary: 'Limite de Destaques', detail: 'Você já selecionou as 5 melhores medalhas.', life: 3000 });
            return;
        }
        featured.push(slug);
    }

    operator.value.featured_badges = featured;
    await OperatorService.update(operator.value.$id, { featured_badges: featured });
};
</script>

<style scoped>
.badge-item {
    width: 100%;
    max-width: 120px;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    cursor: pointer;
    border: 2px solid var(--p-gray-300);
}

.badge-item:hover {
    transform: translateY(-5px);
    filter: brightness(1.1);
}

.badge-icon-wrapper {
    width: 50px;
    height: 50px;
    border-radius: 50%;
}

.locked-badge {
    opacity: 0.6;
    filter: grayscale(1);
    cursor: not-allowed;
}

.badge-label {
    color: var(--text-color);
}
</style>