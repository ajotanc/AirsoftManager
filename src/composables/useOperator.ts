// src/composables/useOperator.ts
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { computed } from 'vue';
import type { IOperator } from '@/services/operator';

export function useOperator() {
  const authStore = useAuthStore();

  const { operator, isActiveOperator, isAdmin } = storeToRefs(authStore);

  const arsenal = computed(() => operator.value?.arsenal || []);
  const loadout = computed(() => operator.value?.loadout || []);
  const badgesCount = computed(() => operator.value?.badges?.length || 0);

  const updateState = async (operator: IOperator) => authStore.$patch((state) => {
    state.operator = { ...state.operator, ...operator };
  });

  return {
    authStore,
    operator,
    isActiveOperator,
    isAdmin,
    arsenal,
    loadout,
    badgesCount,
    updateState
  };
}