<template>
  <Menubar :model="navItems"
    class="hidden sticky top-0 z-1 md:flex border-none border-bottom-1 surface-border border-noround px-4 py-2">
    <template #start>
      <div class="flex align-items-center gap-2 mr-4 cursor-pointer" @click="router.push('/dashboard')">
        <img src="/exd.webp" :alt="TEAM_NAME" class="h-3rem">
      </div>
    </template>

    <template #item="{ item, props, hasSubmenu }">
      <router-link v-if="item.route && !item.disabled" v-slot="{ href, navigate, isActive }" :to="item.route" custom>
        <a :href="href" v-bind="props.action" @click="navigate" :class="{ 'text-primary font-bold': isActive }"
          class="no-underline">
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
        </a>
      </router-link>

      <a v-else v-bind="props.action" :class="{ 'opacity-50 cursor-not-allowed pointer-events-none': item.disabled }"
        class="flex align-items-center no-underline">
        <i :class="item.icon" />
        <span>{{ item.label }}</span>
        <span v-if="hasSubmenu" class="pi pi-angle-down" />
      </a>
    </template>

    <template #end>
      <div class="flex align-items-center gap-3" v-if="authStore.operator">
        <div class="flex flex-column align-items-end">
          <span class="text-sm font-bold text-900">{{ authStore.operator.codename }}</span>
          <span class="text-xs text-500">{{ROLES.find(r => r.value === authStore.operator.role)?.label
          }}</span>
        </div>
        <Avatar :image="authStore.operator.avatar" shape="circle" size="large" @click="toggleUserMenu"
          class="cursor-pointer" />
        <Menu ref="userMenu" :model="userMenuItems" :popup="true" />
      </div>
    </template>
  </Menubar>

  <div
    class="md:hidden sticky top-0 z-1 bg-gray-50 flex align-items-center justify-content-between p-2 border-bottom-1 surface-border">
    <img src="/exd.webp" :alt="TEAM_NAME" class="h-3rem" @click="router.push('/dashboard')">
    <Button icon="pi pi-bars" @click="visible = true" severity="secondary" text />
  </div>

  <Drawer v-model:visible="visible" header="Menu" :closable="true" :block-scroll="true">
    <template #container="{ closeCallback }">
      <div class="flex flex-column h-full">
        <div class="flex align-items-center justify-content-between p-3 shrink-0">
          <span class="inline-flex align-items-center">
            <img src="/exd.webp" :alt="TEAM_NAME" class="h-3rem">
            <span class="font-bold text-xl uppercase text-900 ml-2">{{ TEAM_NAME }}</span>
          </span>
          <Button type="button" @click="closeCallback" icon="pi pi-times" rounded text severity="secondary"></Button>
        </div>

        <div class="overflow-y-auto">
          <ul class="list-none p-3 m-0">
            <li v-for="item in navItems" :key="item.label">
              <template v-if="item.visible !== false">
                <router-link v-if="item.route && !item.disabled" :to="item.route" @click="visible = false"
                  v-slot="{ isActive }" class="no-underline">
                  <a v-ripple class="flex align-items-center cursor-pointer p-2 border-round text-700 hover:surface-100"
                    :class="{ 'bg-primary-50 text-primary font-bold': isActive }">
                    <i :class="[item.icon, 'mr-3 text-xl']"></i>
                    <span class="font-medium">{{ item.label }}</span>
                  </a>
                </router-link>

                <div v-else class="mt-3">
                  <span class="text-xs font-bold text-500 uppercase px-3" :class="{ 'opacity-50': item.disabled }">
                    {{ item.label }}
                  </span>
                  <ul class="list-none p-0 m-0">
                    <li v-for="sub in item.items" :key="sub.label">
                      <router-link v-if="sub.route && !sub.disabled" :to="sub.route" @click="visible = false"
                        v-slot="{ isActive }" class="no-underline">
                        <a v-ripple
                          class="flex align-items-center cursor-pointer p-2 pl-4 border-round text-700 hover:surface-100">
                          <i :class="[sub.icon, 'mr-3']"></i>
                          <span :class="{ 'text-primary font-bold': isActive }">{{ sub.label }}</span>
                        </a>
                      </router-link>

                      <div v-else-if="sub.items" class="mt-2">
                        <span class="text-xs font-semibold text-400 uppercase pl-4 block mb-1">
                          {{ sub.label }}
                        </span>
                        <ul class="list-none p-0 m-0">
                          <li v-for="child in sub.items" :key="child.label">
                            <router-link :to="child.route!" @click="visible = false" v-slot="{ isActive }"
                              class="no-underline">
                              <a v-ripple
                                class="flex align-items-center cursor-pointer p-2 pl-5 border-round text-700 hover:surface-100">
                                <i :class="[child.icon, 'mr-3 text-sm']"></i>
                                <span :class="{ 'text-primary font-bold': isActive }">{{ child.label }}</span>
                              </a>
                            </router-link>
                          </li>
                        </ul>
                      </div>

                      <div v-else class="flex align-items-center p-2 pl-4 opacity-50 cursor-not-allowed">
                        <i :class="[sub.icon, 'mr-3']"></i>
                        <span>{{ sub.label }}</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </template>
            </li>
          </ul>
        </div>

        <div class="mt-auto border-top-1 surface-border" v-if="authStore.operator">
          <div class="flex align-items-center gap-3 border-round hover:surface-100 cursor-pointer p-2"
            @click="router.push('/profile'); visible = false">
            <Avatar :image="authStore.operator.avatar" shape="circle" size="large" />
            <div class="flex flex-column flex-1">
              <span class="font-bold text-sm text-900">{{ authStore.operator.codename }}</span>
              <span class="text-xs text-500">{{ROLES.find(r => r.value === authStore.operator.role)?.label
              }}</span>
            </div>
            <Button icon="pi pi-sign-out" text rounded severity="danger" @click.stop="handleLogout" />
          </div>
        </div>
      </div>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

import Avatar from "primevue/avatar";
import { ROLES, TEAM_NAME } from "@/constants/airsoft";
import { useOperator } from "@/composables/useOperator";

const { authStore } = useOperator();
const router = useRouter();

const visible = ref(false);
const userMenu = ref();

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};

interface IMenu {
  label: string;
  icon?: string;
  route?: string;
  visible?: boolean;
  disabled?: boolean;
  items?: IMenu[];
}

const navItems = computed<IMenu[]>(() => [
  {
    label: "Dashboard",
    icon: "ri-home-2-line",
    route: "/dashboard",
  },
  {
    label: "Equipamentos",
    icon: "ri-suitcase-2-line",
    visible: authStore.isActiveOperator,
    items: [
      {
        label: "Arsenal",
        icon: "ri-sword-line",
        route: "/arsenal",
        visible: authStore.isActiveOperator,
      },
      {
        label: "Loadout",
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
        label: "Conquistas",
        icon: "ri-medal-line",
        route: "/game/badges",
      },
      {
        label: "Ratings",
        icon: "ri-bookmark-3-line",
        route: "/game/ratings",
      },
      {
        label: "Carteira",
        icon: "ri-id-card-line",
        route: "/game/card",
        visible: authStore.isManager,
      },
      {
        label: "Player Card",
        icon: "ri-shield-user-line",
        route: "/game/player-card",
      },
    ],
  },
  {
    label: "Administrativo",
    icon: "ri-briefcase-line",
    visible: authStore.isActiveOperator,
    items: [
      {
        label: "Cronograma",
        icon: "ri-calendar-schedule-line",
        route: "/schedules",
        visible: authStore.isActiveOperator,
      },
      {
        label: "Financeiro",
        icon: "ri-bank-line",
        visible: authStore.isActiveOperator,
        items: [
          {
            label: "Meus Pagamentos",
            icon: "ri-wallet-line",
            route: "/finance/payments",
          },
          {
            label: "Transparência",
            icon: "ri-auction-line",
            route: "/finance/cashflow",
          },
        ],
      },

    ]
  },
  {
    label: "Gestão",
    icon: "ri-briefcase-4-line",
    visible: authStore.isManager,
    items: [
      {
        label: "Usuários",
        icon: "ri-group-line",
        route: "/admin/operators",
        visible: authStore.isAdmin,
      },
      {
        label: "Eventos",
        icon: "ri-calendar-event-line",
        route: "/admin/events",
        visible: authStore.isEventManagement,
      },
      {
        label: "Aniversariantes",
        icon: "ri-cake-2-line",
        route: "/admin/birthdays",
        visible: authStore.isManager,
      },
      {
        label: "Visitantes",
        icon: "ri-group-3-line",
        route: "/admin/visitors",
        visible: authStore.isAdmin || authStore.isAdministrativeManagement,
      },
      {
        label: "Cronograma",
        icon: "ri-calendar-schedule-line",
        route: "/admin/schedules",
        visible: authStore.isAdmin || authStore.isAdministrativeManagement,
      },
      {
        label: "Financeiro",
        icon: "ri-bank-line",
        visible: authStore.isAdmin || authStore.isFinancialManagement,
        items: [
          {
            label: "Pagamentos",
            icon: "ri-wallet-line",
            route: "/admin/finance/payments",
          },
          {
            label: "Metas",
            icon: "ri-gift-line",
            route: "/admin/finance/goals",
          },
          {
            label: "Caixa",
            icon: "ri-exchange-funds-line",
            route: "/admin/finance/cashflow",
          },
        ],
      },
      {
        label: "Armaria",
        icon: "ri-sword-line",
        visible: authStore.isAdmin || authStore.isArmorer,
        items: [
          {
            label: "Manutenção",
            icon: "ri-hammer-line",
            route: "/admin/armory/maintenance",
          },
        ]
      },
    ],
  },
]);

const userMenuItems = computed(() => [
  {
    label: "Conta",
    items: [
      {
        label: "Perfil",
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

const toggleUserMenu = (event: Event) => {
  userMenu.value.toggle(event);
};
</script>