<template>
  <div class="flex flex-wrap align-items-center justify-content-center gap-1">
    <div v-for="badge in courseGroups" :key="badge.key" class="course-badge-box"
      :class="[sizeClass, badge.hasCourse ? 'earned' : 'unearned']">
      <Image :src="badge.image" :alt="badge.label" :preview="badge.hasCourse"
        v-tooltip.top="`${badge.hasCourse ? badge.label : `${badge.label} (Não concluído)`}`" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Image from 'primevue/image';
import { COURSES, TEAM_TAG } from '@/constants/airsoft';

const props = withDefaults(
  defineProps<{
    courses?: string[];
    size?: 'small' | 'normal' | 'large';
  }>(),
  {
    courses: () => [],
    size: 'normal',
  }
);

const groups = computed(() => [
  { key: TEAM_TAG, prefix: TEAM_TAG },
  { key: 'bootcamp', prefix: 'bootcamp' },
  { key: 'sar', prefix: 'sar' },
  { key: 'fta', prefix: 'fta' },
  { key: 'aph', prefix: 'aph' },
]);

const courseGroups = computed(() => {
  const userCourses = props.courses || [];
  return groups.value.map(g => {
    const items = COURSES.filter(c => (c.group || c.value).startsWith(g.prefix));
    const matched = items.filter(c => userCourses.includes(c.value) || userCourses.includes(c.label));
    const isTeamBadge = g.key === TEAM_TAG;
    const hasCourse = isTeamBadge || matched.length > 0;
    const selected = (hasCourse && matched.length > 0) ? matched[matched.length - 1] : items[0];
    return {
      key: g.key,
      hasCourse: hasCourse && !!selected,
      label: selected?.label ?? '',
      image: selected ? `/images/courses/${selected.value}.webp` : '',
    };
  });
});

const sizeClass = computed(() => {
  if (props.size === 'small') return 'size-small';
  if (props.size === 'large') return 'size-large';
  return 'size-normal';
});
</script>

<style scoped>
.course-badge-box {
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-small {
  width: 2.25rem;
  height: 2.25rem;
}

.size-normal {
  width: 3.25rem;
  height: 3.25rem;
}

.size-large {
  width: 4.5rem;
  height: 4.5rem;
}

.earned {
  cursor: pointer;
}

.unearned {
  opacity: 0.36;
  filter: grayscale(100%);
}

:deep(.p-image img),
:deep(.p-image-preview-container img) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

:deep(.p-image-preview-indicator),
:deep(.p-image-preview-mask) {
  background: transparent !important;
  background-color: transparent !important;
}

:deep(.p-image-preview-icon),
:deep(.p-image-preview-indicator i),
:deep(.p-image-preview-indicator svg) {
  width: 1rem;
  height: 1rem;
  color: var(--p-surface-0);
}
</style>
