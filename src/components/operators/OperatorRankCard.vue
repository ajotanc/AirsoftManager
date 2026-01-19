<template>
    <Card class="bg-surface-900 overflow-hidden">
        <template #content>
            <div class="flex flex-column align-items-center text-center p-3">
                <div class="flex relative mb-2 cursor-pointer"
                    v-tooltip.top="`Status de Progressão: ${xpInLevel} / 200 XP`">
                    <!-- <div class="xp-ring absolute p-4 border-circle" :style="ringStyle">
                    </div> -->
                    <Avatar :image="operator.avatar" shape="circle" class="operator-avatar z-1 border-surface-900" />
                    <Knob v-model="xpPercent" class="xp-ring" :min="0" :max="EXPERIENCE_PER_LEVEL" :strokeWidth="5"
                        readonly :size="140" />
                    <div
                        class="level-tag bg-white text-sm text-surface-900 font-bold border-circle flex align-items-center justify-content-center shadow-4 z-1">
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

                <div class="flex flex-column mt-4">
                    <div class="text-center mb-2 text-xs font-bold uppercase">
                        Registro Tático
                    </div>
                    <Qrcode :id="operator.$id" />
                </div>
            </div>
        </template>
    </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { LEVELS, EXPERIENCE_PER_LEVEL } from '@/constants/airsoft';
import { useAuthStore } from '@/stores/auth';
import Qrcode from './Qrcode.vue';

const { operator } = useAuthStore();

const xpInLevel = computed(() => operator.xp % EXPERIENCE_PER_LEVEL);
const xpPercent = computed(() => (xpInLevel.value / EXPERIENCE_PER_LEVEL) * 100);

const currentRank = computed(() => {
    return LEVELS.find(r => operator.level >= r.min && operator.level <= r.max) || LEVELS[0];
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