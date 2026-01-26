<template>
    <div class="flex flex-column align-items-center text-center p-3">
        <div class="flex relative mb-2 cursor-pointer" v-tooltip.top="`Status de Progressão: ${xpInLevel} / 200 XP`">
            <Avatar :image="operator.avatar" shape="circle" class="operator-avatar border-surface-900" />
            <Knob :showValue="false" v-model="xpInLevel" class="xp-ring" :min="0" :max="EXPERIENCE_PER_LEVEL"
                :strokeWidth="5" readonly :size="140" />
            <div
                class="level-tag bg-white text-sm text-surafce-900 font-bold border-circle flex align-items-center justify-content-center shadow-4">
                {{ operator.level }}
            </div>
        </div>
        <h2 class="text-3xl font-bold m-0 mt-3 uppercase">{{ operator.codename }}</h2>
        <div class="flex align-items-center gap-2 mt-3">
            <span class="font-bold uppercase text-sm">
                {{ currentRank?.label }}
            </span>
        </div>

        <p class="text-xs text-gray-500 m-0 px-2 line-height-3 font-italic">
            "{{ currentRank?.description }}"
        </p>

        <div v-if="featuredBadges.length > 0" class="flex flex-row mt-3">
            <template v-for="badge in featuredBadges" :key="badge.slug">
                <BadgeIcon :slug="badge.slug" earned group />
            </template>
            <BadgeIcon group :counter="extraBadgesCount" />
        </div>

        <div v-if="qrcode" class="flex flex-column mt-3">
            <div class="text-center mb-2 text-xs font-bold uppercase">
                Registro Tático
            </div>
            <Qrcode :id="operator.$id" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { LEVELS, EXPERIENCE_PER_LEVEL, ALL_BADGES_DEFINITION } from '@/constants/airsoft';
import { useAuthStore } from '@/stores/auth';
import Qrcode from './Qrcode.vue';
import type { IOperator } from '@/services/operator';

const authStore = useAuthStore();


const operator = defineModel('operator', {
    type: Object as PropType<IOperator>,
    default: () => ({} as IOperator),
});

const props = defineProps<{
    qrcode?: boolean;
}>();

onMounted(() => {
    if (!operator.value || !operator.value.$id) {
        operator.value = authStore.operator;
    }
});

// Lógica de XP: Usamos o valor real (0-200) no Knob
const xpInLevel = computed(() => (operator.value.xp || 0) % EXPERIENCE_PER_LEVEL);

const currentRank = computed(() => {
    const level = operator.value.level || 1;
    return LEVELS.find(r => level >= r.min && level <= r.max) || LEVELS[0];
});

const extraBadgesCount = computed(() => {
    const total = operator.value.badges?.length || 0;
    const featuredCount = operator.value.featured_badges?.length || 0;
    return total - featuredCount;
});

// Filtra apenas as medalhas que o cara escolheu destacar
const featuredBadges = computed(() => {
    const featured = operator.value.featured_badges || [];
    return ALL_BADGES_DEFINITION.filter(b => featured.includes(b.slug));
});

</script>

<style scoped>
.xp-ring {
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    position: absolute;
    margin-top: 2px;
}

.operator-avatar {
    width: 100px;
    height: 100px;
    background-color: var(--p-gray-50);
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