<template>
  <Menubar :model="navItems" class="hidden sticky top-0 z-1 md:flex border-none shadow-2 px-3 py-2">
    <template #start>
      <div class="flex align-items-center gap-2 mr-4 cursor-pointer" @click="router.push('/dashboard')">
        <img src="/exd.webp" :alt="TEAM_NAME" class="h-4rem">
      </div>
    </template>

    <template #item="{ item, props, hasSubmenu }">
      <template v-if="item.route && !item.disabled">
        <a v-if="isExternal(item.route)" :href="item.route" target="_blank" v-bind="props.action" class="no-underline">
          <i :class="item.icon" class="mr-2" />
          <span>{{ item.label }}</span>
          <i class="ri-external-link-line ml-auto opacity-50" />
        </a>

        <router-link v-else :to="item.route" v-slot="{ href, navigate, isActive }" custom>
          <a :href="href" v-bind="props.action" @click="navigate" :class="{ 'text-blue-500 font-bold': isActive }"
            class="no-underline">
            <i :class="item.icon" />
            <span>{{ item.label }}</span>
          </a>
        </router-link>
      </template>

      <a v-else v-bind="props.action" :class="{ 'opacity-50 cursor-not-allowed pointer-events-none': item.disabled }"
        class="flex align-items-center no-underline">
        <i :class="item.icon" />
        <span>{{ item.label }}</span>
        <span v-if="hasSubmenu" class="pi pi-angle-down ml-auto" />
      </a>
    </template>

    <template #end>
      <div class="flex align-items-center gap-3" v-if="authStore.operator">
        <div class="flex flex-column align-items-end">
          <span class="text-sm font-bold text-900">{{ authStore.operator.codename }}</span>
          <span class="text-xs text-500">{{ROLES.find(r => r.value === authStore.operator.role)?.label}}</span>
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
      <div class="flex flex-column h-full pt-4">
        <div class="flex align-items-center justify-content-between p-3 shrink-0">
          <span class="inline-flex align-items-center">
            <img src="/exd.webp" :alt="TEAM_NAME" class="h-3rem">
            <span class="font-bold text-xl uppercase text-900 ml-2">{{ TEAM_NAME }}</span>
          </span>
          <Button type="button" @click="closeCallback" icon="pi pi-times" rounded text severity="secondary"></Button>
        </div>

        <div class="overflow-y-auto mt-2">
          <ul class="list-none p-3 m-0">
            <li v-for="item in navItems" :key="item.label">
              <template v-if="item.visible !== false">
                <template v-if="item.route && !item.disabled">
                  <a v-if="isExternal(item.route)" :href="item.route" target="_blank" v-ripple
                    class="flex align-items-center cursor-pointer p-2 border-round text-700 hover:surface-100 no-underline">
                    <i :class="[item.icon, 'mr-3 text-xl']"></i>
                    <span class="font-medium">{{ item.label }}</span>
                    <i class="ri-external-link-line ml-auto opacity-50" />
                  </a>
                  <router-link v-else :to="item.route" @click="visible = false" v-slot="{ isActive }"
                    class="no-underline">
                    <a v-ripple
                      class="flex align-items-center cursor-pointer p-2 border-round text-700 hover:surface-100"
                      :class="{ 'bg-primary-50 text-primary font-bold': isActive }">
                      <i :class="[item.icon, 'mr-3 text-xl']"></i>
                      <span class="font-medium">{{ item.label }}</span>
                    </a>
                  </router-link>
                </template>

                <div v-else class="mt-3">
                  <span class="text-xs font-bold text-500 uppercase px-3" :class="{ 'opacity-50': item.disabled }">
                    {{ item.label }}
                  </span>
                  <ul class="list-none p-0 m-0">
                    <li v-for="sub in item.items" :key="sub.label">
                      <template v-if="sub.route && !sub.disabled">
                        <a v-if="isExternal(sub.route)" :href="sub.route" target="_blank" v-ripple
                          class="flex align-items-center cursor-pointer p-2 pl-4 border-round text-700 hover:surface-100 no-underline">
                          <i :class="[sub.icon, 'mr-3']"></i>
                          <span>{{ sub.label }}</span>
                          <i class="ri-external-link-line ml-auto opacity-50" />
                        </a>
                        <router-link v-else :to="sub.route" @click="visible = false" v-slot="{ isActive }"
                          class="no-underline">
                          <a v-ripple
                            class="flex align-items-center cursor-pointer p-2 pl-4 border-round text-700 hover:surface-100">
                            <i :class="[sub.icon, 'mr-3']"></i>
                            <span :class="{ 'text-primary font-bold': isActive }">{{ sub.label }}</span>
                          </a>
                        </router-link>
                      </template>
                      <div v-else-if="sub.items" class="mt-2">
                        <span class="text-xs font-semibold text-400 uppercase pl-4 block mb-1">
                          {{ sub.label }}
                        </span>
                        <ul class="list-none p-0 m-0">
                          <li v-for="child in sub.items" :key="child.label">
                            <template v-if="child.route">
                              <a v-if="isExternal(child.route)" :href="child.route" target="_blank" v-ripple
                                class="flex align-items-center cursor-pointer p-2 pl-5 border-round text-700 hover:surface-100 no-underline">
                                <i :class="[child.icon, 'mr-3 text-sm']"></i>
                                <span>{{ child.label }}</span>
                                <i class="ri-external-link-line ml-auto opacity-50" />
                              </a>
                              <router-link v-else :to="child.route" @click="visible = false" v-slot="{ isActive }"
                                class="no-underline">
                                <a v-ripple
                                  class="flex align-items-center cursor-pointer p-2 pl-5 border-round text-700 hover:surface-100">
                                  <i :class="[child.icon, 'mr-3 text-sm']"></i>
                                  <span :class="{ 'text-primary font-bold': isActive }">{{ child.label }}</span>
                                </a>
                              </router-link>
                            </template>
                          </li>
                        </ul>
                      </div>
                    </li>
                  </ul>
                </div>
              </template>
            </li>
          </ul>
        </div>

        <div class="mt-auto border-top-1 surface-border p-2" v-if="authStore.operator">
          <div class="flex align-items-center gap-3 border-round hover:surface-100 cursor-pointer p-2"
            @click="router.push('/profile'); visible = false">
            <Avatar :image="authStore.operator.avatar" shape="circle" size="large" />
            <div class="flex flex-column flex-1">
              <span class="font-bold text-sm text-900">{{ authStore.operator.codename }}</span>
              <span class="text-xs text-500">{{ROLES.find(r => r.value === authStore.operator.role)?.label}}</span>
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
import Avatar from "primevue/avatar";
import { ROLES, TEAM_NAME } from "@/constants/airsoft";
import { useOperator } from "@/composables/useOperator";

const { authStore } = useOperator();
import router from '@/router';

const visible = ref(false);
const userMenu = ref();

const { value: disabled } = computed(() => !authStore.isActiveOperator);

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};

const toggleUserMenu = (event: Event) => {
  userMenu.value.toggle(event);
};

// Interface para o menu
interface IMenu {
  label: string;
  icon?: string;
  route?: string;
  visible?: boolean;
  disabled?: boolean;
  items?: IMenu[];
}

// DEFINIÇÃO DOS ITENS DE NAVEGAÇÃO
const navItems = computed<IMenu[]>(() => [
  {
    label: "Dashboard",
    icon: "ri-home-2-line",
    route: "/dashboard",
  },
  {
    label: "Equipamentos",
    icon: "ri-suitcase-2-line",
    items: [
      {
        label: "Arsenal",
        icon: "ri-sword-line",
        route: "/arsenal",
        disabled: authStore.isArsenalLocked
      },
      {
        label: "Loadout",
        icon: "ri-t-shirt-2-line",
        route: "/loadout",
        disabled: authStore.isLoadoutLocked
      },
      {
        label: "Veiculos",
        icon: "ri-car-line",
        route: "/vehicles",
        disabled
      },
    ],
  },
  {
    label: "Games",
    icon: "ri-gamepad-line",
    items: [
      { label: "Conquistas", icon: "ri-medal-line", route: "/game/badges", disabled },
      { label: "Ratings", icon: "ri-bookmark-3-line", route: "/game/ratings", disabled },
      { label: "Carteira", icon: "ri-id-card-line", route: "/game/card", disabled },
      { label: "Player Card", icon: "ri-shield-user-line", route: "/game/player-card", disabled },
    ],
  },
  {
    label: "Administrativo",
    icon: "ri-briefcase-line",
    items: [
      { label: "Cronograma", icon: "ri-calendar-schedule-line", route: "/schedules", disabled },
      {
        label: "Financeiro",
        icon: "ri-bank-line",
        items: [
          { label: "Meus Pagamentos", icon: "ri-wallet-line", route: "/finance/payments", disabled: !authStore.canAccessFinance },
          { label: "Transparência", icon: "ri-auction-line", route: "/finance/cashflow", disabled },
        ],
      },
    ]
  },
  {
    label: "Ajuda",
    icon: "ri-question-line",
    items: [
      { label: "Código de Conduta", icon: "ri-file-pdf-2-line", route: "https://docs.google.com/document/d/1xHYJ2ykv0pmuz9YVpoaHdn_Yw8j2y0exFLa204OKyRU/preview" },
      {
        label: "Manuais",
        icon: "ri-booklet-line",
        items: [
          { label: "FTA Brasil", icon: "ri-file-pdf-2-line", route: "https://drive.google.com/file/d/1RLnEKGevGGdlZ09-EGpe4T73x1IWuHIK/view" },
          { label: "SAR", icon: "ri-file-pdf-2-line", route: "https://drive.google.com/file/d/1vUw46NY6prJTZi70Enbtv77ck1pM-dAY/view" },
          { label: "RESCOM", icon: "ri-file-pdf-2-line", route: "https://drive.google.com/file/d/18ng3NR6r6NOQ57MGPQ2V0XZy1rnxvu4U/view" },
        ],
      },
    ]
  },
  {
    label: "Gestão",
    icon: "ri-briefcase-4-line",
    visible: authStore.isManager,
    items: [
      { label: "Operadores", icon: "ri-group-line", route: "/admin/operators", visible: authStore.isAdmin },
      { label: "Eventos", icon: "ri-calendar-event-line", route: "/admin/events", visible: authStore.isEventManagement },
      { label: "Aniversariantes", icon: "ri-cake-2-line", route: "/admin/birthdays" },
      { label: "Visitantes", icon: "ri-group-3-line", route: "/admin/visitors", visible: authStore.isAdmin || authStore.isAdministrativeManagement },
      { label: "Cronograma", icon: "ri-calendar-schedule-line", route: "/admin/schedules", visible: authStore.isAdmin || authStore.isAdministrativeManagement },
      {
        label: "Financeiro",
        icon: "ri-bank-line",
        visible: authStore.isAdmin || authStore.isFinancialManagement,
        items: [
          { label: "Pagamentos", icon: "ri-wallet-line", route: "/admin/finance/payments" },
          { label: "Metas", icon: "ri-gift-line", route: "/admin/finance/goals" },
          { label: "Caixa", icon: "ri-exchange-funds-line", route: "/admin/finance/cashflow" },
        ],
      },
      {
        label: "Armaria",
        icon: "ri-sword-line",
        visible: authStore.isAdmin || authStore.isArmorer,
        items: [
          { label: "Manutenção", icon: "ri-hammer-line", route: "/admin/armory/maintenance" },
        ]
      },
    ],
  },
]);

const userMenuItems = computed(() => [
  {
    label: "Conta",
    items: [
      { label: "Perfil", icon: "ri-user-line", command: () => router.push("/profile") },
      { label: "Sair", icon: "ri-logout-box-r-line", command: handleLogout },
    ],
  },
]);

// FUNÇÃO PARA VERIFICAR SE O LINK É EXTERNO
const isExternal = (url?: string) => url?.startsWith('http');
</script>

<style scoped>
/* Aumenta o afastamento do submenu (Desktop) */
:deep(.p-menubar-submenu) {
  margin-top: 15px !important;
  /* Aumentado para 15px */
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--surface-border);
}

/* Garante que o item ativo tenha um respiro visual */
:deep(.p-menubar-item-link) {
  border-radius: 8px;
  margin: 0 2px;
}
</style>