<template>
    <div class="badge-icon-container" :class="{ 'is-grouped': group }" tabindex="0"
        v-tooltip.top.focus="badgeInfo.label" :style="{
            width: size === 'large' ? '50px' : size === 'small' ? '38px' : '48px',
            height: size === 'large' ? '50px' : size === 'small' ? '38px' : '48px',
        }">
        <div v-if="badgeInfo.label" class="badge-mask">
            <div class="badge-circle flex align-items-center justify-content-center" :style="{
                backgroundColor: earned ? badgeInfo.color + '40' : '#f1f5f9',
                borderColor: earned ? badgeInfo.color : '#e2e8f0',
            }">
                <i :class="[earned ? badgeInfo.icon : 'ri-lock-line', size === 'large' ? 'text-2xl' : size === 'small' ? 'text-base' : 'text-xl']"
                    :style="{ color: earned ? badgeInfo.color : '#94a3b8' }"></i>
            </div>
        </div>
        <div v-if="!badgeInfo.label && counter" class="badge-mask cursor-pointer" @click="$router.push('/game/badges')">
            <div class="badge-circle flex align-items-center justify-content-center" :style="{
                backgroundColor: 'var(--p-gray-300)',
                borderColor: 'var(--p-gray-400)',
            }">
                <span class="text-sm font-bold" :style="{ color: 'var(--p-gray-700)' }">+{{ counter
                    }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ALL_BADGES_DEFINITION } from '@/constants/airsoft';

const props = defineProps<{
    slug?: string;
    earned?: boolean;
    group?: boolean;
    counter?: number;
    size?: 'small' | 'normal' | 'large';
}>();

const badgeInfo = computed(() => {
    return ALL_BADGES_DEFINITION.find(b => b.slug === props.slug) || {
        label: undefined,
        icon: 'ri-question-line',
        color: '#94a3b8'
    };
});
</script>

<style scoped>
.badge-container {
    display: inline-flex;
    position: relative;
    transition: transform 0.2s ease;
}

.is-grouped {
    margin-left: -16px;
}

.is-grouped:first-child {
    margin-left: 0;
}

.is-grouped:hover {
    transform: translateY(-4px);
    z-index: 10 !important;
}

.badge-mask {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: var(--surface-card, #ffffff);
    padding: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.badge-circle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 1px solid;
    overflow: hidden;
}

.badge-container:focus {
    outline: none;
}
</style>