<template>
    <div class="flex flex-1 flex-column align-items-center text-center gap-2 py-2 overflow-hidden">
        <Avatar :image="operator.avatar" shape="circle" class="operator-avatar shadow-3" />

        <div class="flex flex-column">
            <div class="flex align-items-center justify-content-center gap-2">
                <h2 class="text-2xl font-bold m-0 line-height-2 uppercase">{{ operator.codename }}</h2>
            </div>
            <div class="flex justify-content-center align-items-center gap-1 text-xs text-gray-500 font-medium mt-1">
                <span>{{ getSpecialtyLabel(operator.category) }}</span>
                <span>·</span>
                <span>Nível {{ operator.level }}</span>
                <span>·</span>
                <i class="ri-trophy-fill text-yellow-500"></i>
                <span>{{ operator.badges?.length || 0 }}</span>
                <template v-if="operator.prestige > 0">
                    <span>·</span>
                    <i class="ri-vip-crown-fill text-purple-500"></i>
                    <span>{{ operator.prestige }}</span>
                </template>
            </div>
        </div>

        <div class="experience flex flex-column align-items-center gap-1 w-full px-4 text-gray-500">
            <span class="text-xs">{{ operator.xp % 200 }} / {{ EXPERIENCE_PER_LEVEL }} XP</span>
            <ProgressBar :showValue="false" :value="progressValue" style="height: 6px; width: 100%; max-width: 150px;"
                :pt="{
                    root: { style: { backgroundColor: 'var(--p-gray-200)', borderRadius: '10px' } },
                    value: { style: { backgroundColor: 'var(--p-red-600)', borderRadius: '10px' } }
                }" />
        </div>

        <div class="flex flex-column px-2">
            <span class="font-bold text-sm text-gray-800">{{ currentRank?.label }}</span>
            <p class="text-xs text-gray-500 m-0 line-height-2 font-italic">
                "{{ currentRank?.description }}"
            </p>
        </div>

        <div v-if="featuredBadges.length > 0" class="flex flex-row py-1">
            <template v-for="badge in featuredBadges" :key="badge.slug">
                <BadgeIcon :slug="badge.slug" earned group size="normal" />
            </template>
            <BadgeIcon v-if="badgesCount > 0" group :counter="badgesCount" size="normal" />
        </div>

        <template v-if="detail">
            <div v-if="operator.profession || operator.availability" class="flex gap-4 text-xs w-full px-3">
                <div v-if="operator.profession" class="w-6 flex flex-column text-right">
                    <span class="text-gray-500 uppercase font-bold" style="font-size: 0.6rem">Profissão</span>
                    <span class="text-gray-700 font-bold">{{ operator.profession }}</span>
                </div>
                <Divider layout="vertical" class="m-0" />
                <div v-if="operator.availability" class="w-6 flex flex-column text-left">
                    <span class="text-gray-500 uppercase font-bold" style="font-size: 0.6rem">Disponibilidade</span>
                    <span class="text-gray-700 font-bold">{{ getAvailabilityLabel(operator.availability) }}</span>
                </div>
            </div>

            <div class="flex gap-3 mt-1">
                <a :href="`https://wa.me/+55${operator.phone}?text=Ol%C3%A1%20${operator.codename}%2C%20vim%20atrav%C3%A9s%20do%20aplicativo%20da%20%2A${TEAM_NAME}%2A%2C%20gostaria%20de%20saber%20mais%20sobre%20seus%20servi%C3%A7os%21`"
                    target="_blank" class="no-underline text-green-500 hover:scale-110 transition-transform">
                    <i class="pi pi-whatsapp text-xl"></i>
                </a>
                <a :href="`https://instagram.com/${operator.instagram}`" target="_blank"
                    class="no-underline text-purple-500 hover:scale-110 transition-transform">
                    <i class="pi pi-instagram text-xl"></i>
                </a>
            </div>
        </template>

        <div v-if="qrcode" class="flex flex-column align-items-center">
            <span class="text-xs text-gray-500 uppercase font-bold my-1">Registro Tático</span>
            <Qrcode :id="operator.$id" :size="80" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { LEVELS, EXPERIENCE_PER_LEVEL, ALL_BADGES_DEFINITION, TEAM_NAME } from '@/constants/airsoft';
import Qrcode from './Qrcode.vue';
import type { IOperator } from '@/services/operator';
import { getSpecialtyLabel, getAvailabilityLabel } from '@/functions/utils'

const operator = defineModel('operator', {
    type: Object as PropType<IOperator>,
    default: () => ({} as IOperator),
});

const props = defineProps<{
    qrcode?: boolean;
    detail?: boolean;
}>();

const progressValue = computed(() => {
    // Calcula a porcentagem baseada apenas no XP do nível atual (0-200)
    const currentLevelXp = (operator.value.xp || 0) % EXPERIENCE_PER_LEVEL;
    return (currentLevelXp / EXPERIENCE_PER_LEVEL) * 100;
});

const currentRank = computed(() => {
    const level = operator.value.level || 1;
    return LEVELS.find(r => level >= r.min && level <= r.max) || LEVELS[0];
});

const badgesCount = computed(() => {
    const total = operator.value.badges?.length || 0;
    const featuredCount = operator.value.featured_badges?.length || 0;
    return total - featuredCount;
});

const featuredBadges = computed(() => {
    const featured = operator.value.featured_badges || [];
    return ALL_BADGES_DEFINITION.filter(b => featured.includes(b.slug));
});

</script>

<style scoped>
.operator-avatar {
    width: 6rem;
    height: 6rem;
    padding: 0.25rem;
    background-color: var(--p-gray-300);
}

.level-tag {
    position: absolute;
    left: 50%;
    top: calc(100% - 18px);
    transform: translateX(-50%);
    width: 36px;
    height: 36px;
    border: 3px solid;
    border-color: var(--p-primary-500);
}
</style>