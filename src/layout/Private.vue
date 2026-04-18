<template>
  <div class="flex flex-column w-full min-h-screen">
    <Header />
    <Breadcrumb v-if="items.length > 0" :home="home" :model="items" />
    <router-view />
    <div class="text-center p-3 text-500 text-sm">
      AJOTA {{ year }} &copy; {{ description }}
    </div>
  </div>
</template>

<script lang="ts">
const year = new Date().getFullYear();
const description = import.meta.env.VITE_TITLE;
</script>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Breadcrumb } from "primevue";

import Header from "@/components/header/Private.vue";
import { navItems, type AppMenuItem } from "@/constants/navigation";

const route = useRoute();
const home = ref<AppMenuItem>({ icon: 'ri-home-2-line', url: '/dashboard' });
const items = ref<AppMenuItem[]>([]);

// Função recursiva que busca o caminho completo até a URL alvo
const findBreadcrumbTrail = (
  targetUrl: string,
  menuArray: AppMenuItem[],
  currentTrail: AppMenuItem[] = []
): AppMenuItem[] | undefined => {

  for (const item of menuArray) {
    if (item.url === targetUrl && item.breadcrumb === false) {
      return undefined;
    }
    // Monta o nó atual. Se não tiver URL (menu pai), manda só o label para o PrimeVue não gerar um link clicável vazio.
    const currentItem: AppMenuItem = {
      label: item.label,
      icon: item.icon,
      ...(item.url && { url: item.url })
    };

    // Gera o novo histórico imutável
    const newTrail = [...currentTrail, currentItem];

    // Se bateu com a rota final, retorna o rastro completo
    if (item.url === targetUrl) {
      return newTrail;
    }

    // Se tiver submenus, continua a busca mais a fundo
    if (item.items) {
      const found = findBreadcrumbTrail(targetUrl, item.items as AppMenuItem[], newTrail);
      if (found) return found;
    }
  }

  return undefined;
};

watch(
  () => route.path,
  (newPath) => {
    const trail = findBreadcrumbTrail(newPath, navItems.value);
    items.value = trail ?? [];
  },
  { immediate: true }
);
</script>