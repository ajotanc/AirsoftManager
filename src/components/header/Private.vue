<template>
  <div class="card relative z-2">
    <Menubar :model="navItems"
      class="border-none border-bottom-1 surface-border border-noround px-4 py-2 surface-section">
      <template #start>
        <div class="flex align-items-center gap-2 mr-4 cursor-pointer" @click="router.push('/dashboard')">
          <img src="/exd.webp" :alt="TEAM_NAME" class="h-4rem">
        </div>
      </template>

      <template #item="{ item, props, hasSubmenu }">
        <router-link v-if="item.route" v-slot="{ href, navigate, isActive }" :to="item.route" custom>
          <a :href="href" v-bind="props.action" @click="navigate" :class="{ 'text-primary font-bold': isActive }">
            <span :class="item.icon" />
            <span>{{ item.label }}</span>
          </a>
        </router-link>
        <a v-else :href="item.url" v-bind="props.action" :target="item.target" aria-hidden="false">
          <span :class="item.icon" />
          <span>{{ item.label }}</span>
          <span v-if="hasSubmenu" class="pi pi-fw pi-angle-down ml-2" />
        </a>
      </template>

      <template #end>
        <div class="flex align-items-center gap-3">
          <div
            class="flex align-items-center gap-2 cursor-pointer p-2 border-round hover:surface-100 transition-colors transition-duration-150"
            @click="toggleMenu" aria-haspopup="true" aria-controls="overlay_menu" v-if="authStore.operator">
            <div class="flex flex-column align-items-end hidden md:flex">
              <span class="text-sm font-medium text-900">{{
                authStore.operator.codename
              }}</span>
              <span class="text-xs text-500">{{
                ROLES.find((role) => role.code === authStore.operator.role)?.name
              }}</span>
            </div>

            <Avatar size="large" :image="authStore.operator.avatar"
              :icon="!authStore.operator.avatar ? 'pi pi-user' : undefined" shape="circle"
              class="bg-primary-100 text-primary-700" />

            <i class="pi pi-angle-down text-500 text-sm hidden md:block"></i>
          </div>

          <Menu ref="menu" id="overlay_menu" :model="userMenuItems" :popup="true" />
        </div>
      </template>
    </Menubar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import Menubar from "primevue/menubar";
import Avatar from "primevue/avatar";
import Menu from "primevue/menu";
import { ROLES, TEAM_NAME } from "@/constants/airsoft";

const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n();

const menu = ref();

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};

const navItems = computed(() => [
  {
    label: t("menu.dashboard"),
    icon: "ri-home-2-line",
    route: "/dashboard",
  },
  {
    label: "Equipamentos",
    icon: "ri-suitcase-2-line",
    visible: authStore.isActiveOperator,
    items: [
      {
        label: t("menu.arsenal"),
        icon: "ri-sword-line",
        route: "/arsenal",
        visible: authStore.isActiveOperator,
      },
      {
        label: t("menu.loadout"),
        icon: "ri-t-shirt-2-line",
        route: "/loadout",
        visible: authStore.isActiveOperator,
      },
      {
        label: "Veiculos",
        icon: "ri-car-line",
        route: "/vehicles",
        visible: authStore.isActiveOperator,
      },
    ],
  },
  {
    label: "Games",
    icon: "ri-gamepad-line",
    visible: authStore.isActiveOperator,
    items: [
      {
        label: "Ratings",
        icon: "ri-bookmark-3-line",
        route: "/game/ratings",
      },
      {
        label: "Player Card",
        icon: "ri-shield-user-line",
        route: "/game/player-card",
      },
    ],
  },
  {
    label: "Gestão",
    icon: "ri-briefcase-line",
    visible: authStore.isAdmin,
    items: [
      {
        label: "Usuários",
        icon: "ri-group-line",
        route: "/admin/operators",
      },
      {
        label: "Eventos",
        icon: "ri-calendar-event-line",
        route: "/admin/events",
      },
      {
        label: "Aniversariantes",
        icon: "ri-cake-2-line",
        route: "/admin/birthdays",
      },
      {
        label: "Visitantes",
        icon: "ri-group-3-line",
        route: "/admin/visitors",
      },
      {
        label: "Financeiro",
        icon: "ri-bank-line",
        route: "/admin/finance",
        disabled: true,
      },
    ],
  },
]);

const userMenuItems = computed(() => [
  {
    label: "Conta",
    items: [
      {
        label: t("menu.profile"),
        icon: "ri-user-line",
        command: () => router.push("/profile"),
      },
      {
        label: "Sair",
        icon: "ri-logout-box-r-line",
        command: handleLogout,
      },
    ],
  },
]);

const toggleMenu = (event: Event) => {
  menu.value.toggle(event);
};
</script>