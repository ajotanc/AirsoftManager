<template>
  <div class="flex flex-wrap align-items-center justify-content-center gap-1">
    <div v-for="badge in courseGroups" :key="badge.key" class="course-badge-box"
      :class="[sizeClass, badge.hasCourse ? 'earned' : 'unearned']">
      <Image :src="badge.image" :alt="badge.label" preview
        v-tooltip.top="`${badge.hasCourse ? badge.label : `${badge.label} (Não concluído)`}`">
        <template #original="{ class: className, style: styleName, previewCallback }">
          <div class="flex flex-column align-items-center justify-content-center gap-2 pointer-events-auto">
            <img :src="badge.image" :alt="badge.label"
              :class="[className, badge.hasCourse ? 'badge-earned' : 'badge-unearned']" :style="styleName"
              @click="previewCallback" />
            <div class="flex align-itens-center gap-2">
              <Tag :value="badge.label" severity="secondary" />
              <Tag :value="badge.hasCourse ? 'Concluído' : 'Não concluído'"
                :severity="badge.hasCourse ? 'success' : 'danger'" />
            </div>
          </div>
        </template>
      </Image>
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

  return groups.value.map(({ prefix, key }) => {
    const items = COURSES.filter(course => course.group.startsWith(prefix));
    const matched = items.filter(item => userCourses.includes(item.value));
    const selected = matched[matched.length - 1] ?? items[0] ?? COURSES[0];

    return {
      key,
      hasCourse: matched.length > 0,
      label: selected?.label,
      image: `/images/courses/${selected?.value}.webp`,
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
  width: 2.5rem;
  height: 2.5rem;
}

.size-large {
  width: 3rem;
  height: 3rem;
}

.earned {
  cursor: pointer;
}

.unearned {
  opacity: 0.4;
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

:global(.p-image-original.badge-unearned) {
  filter: grayscale(100%) !important;
}
</style>
