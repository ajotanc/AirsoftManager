import type { MenuItem } from "primevue/menuitem";
import router from "@/router";
import { useAuthStore } from "@/stores/auth";
import { openPage } from "@/functions/utils";

const authStore = useAuthStore();
const { value: disabled } = computed(() => !authStore.isActiveOperator);

export interface AppMenuItem extends MenuItem {
  breadcrumb?: boolean;
  requiresAdmin?: boolean;
  items?: AppMenuItem[];
}

export const navItems = computed<AppMenuItem[]>(() => [
  {
    label: "Dashboard",
    icon: "ri-home-2-line",
    url: "/dashboard",
    breadcrumb: false,
  },
  {
    label: "Equipamentos",
    icon: "ri-suitcase-2-line",
    visible: authStore.isAuthenticated,
    items: [
      {
        label: "Arsenal",
        icon: "ri-sword-line",
        url: "/arsenal",
        disabled: authStore.isArsenalLocked
      },
      {
        label: "Loadout",
        icon: "ri-t-shirt-2-line",
        url: "/loadout",
        visible: !authStore.isVisitor,
        disabled: authStore.isLoadoutLocked
      },
      {
        label: "Veiculos",
        icon: "ri-car-line",
        url: "/vehicles",
        visible: !authStore.isVisitor,
        disabled
      },
    ],
  },
  {
    label: "Games",
    icon: "ri-gamepad-line",
    visible: authStore.isAuthenticated,
    items: [
      { label: "Conquistas", icon: "ri-medal-line", url: "/game/badges", disabled },
      { label: "Ratings", icon: "ri-bookmark-3-line", url: "/game/ratings", disabled },
      { label: "Carteira", icon: "ri-id-card-line", url: "/game/card", disabled, visible: !authStore.isVisitor },
      { label: "Player Card", icon: "ri-shield-user-line", url: "/game/player-card", disabled },
    ],
  },
  {
    label: "Administrativo",
    icon: "ri-briefcase-line",
    visible: !authStore.isVisitor,
    items: [
      { label: "Cronograma", icon: "ri-calendar-schedule-line", url: "/administrative/schedules", disabled },
      { label: "Escola", icon: "ri-graduation-cap-line", url: "/administrative/school", disabled, visible: authStore.isManager },
      {
        label: "Financeiro",
        icon: "ri-bank-line",
        items: [
          { label: "Pagamentos", icon: "ri-wallet-line", url: "/administrative/finance/payments", disabled: !authStore.canAccessFinance },
          { label: "Transparência", icon: "ri-auction-line", url: "/administrative/finance/cashflow", disabled },
        ],
      },
    ]
  },
  {
    key: "help",
    label: "Ajuda",
    icon: "ri-question-line",
    visible: authStore.isAuthenticated,
    items: [
      { label: "Código de Conduta", icon: "ri-file-pdf-2-line", url: "https://docs.google.com/document/d/1xHYJ2ykv0pmuz9YVpoaHdn_Yw8j2y0exFLa204OKyRU/preview", key: "code-of-conduct" },
      { label: "Regime Disciplinar", icon: "ri-file-pdf-2-line", url: "https://docs.google.com/document/d/1tKmugjzNvw2xJmgRGn7Av9M5LXu7emk0VGey_BuHtQw/preview", key: "disciplinary-regime" },
      {
        key: "links",
        label: "Links",
        icon: "ri-link",
        items: [
          {
            key: "courses",
            label: "Cursos",
            icon: "ri-graduation-cap-line",
            url: "https://drive.google.com/drive/folders/1p3iEL5luK2QF7wT7DxRhqJOW_v1UwzNO?usp=sharing"
          },
          {
            label: "Equipamentos",
            icon: "ri-file-excel-2-line",
            url: "https://docs.google.com/spreadsheets/d/1DaZQZVTGFtRX9wUaXwXqKtHkJQch_Sy2jtnS9oLlANU/edit?usp=sharing"
          },
          {
            key: "radio-communication",
            label: "Configuração de Rádio",
            icon: "ri-radio-2-line",
            url: "https://docs.google.com/document/d/1q2mNTuXd2M0yne7-yrc40CastBpdez9qApl5hzqDNlE/preview",
          },
        ]
      },
      {
        key: "manuals",
        label: "Manuais",
        icon: "ri-booklet-line",
        items: [
          {
            label: "FTA Brasil",
            category: "fta",
            description: "Esta avaliação valida o conhecimento do operador sobre as normas fundamentais de segurança e convivência, abrangendo desde limites técnicos de potência e distâncias até as condutas éticas e a legislação vigente. O objetivo é garantir a compreensão total sobre as regras de funcionamento das missões e os princípios de honra que sustentam o esporte.",
            icon: "ri-shield-flash-line",
            url: "https://drive.google.com/file/d/1RLnEKGevGGdlZ09-EGpe4T73x1IWuHIK/view"
          },
          {
            label: "SAR",
            category: "sar",
            description: "O foco desta etapa é a capacidade de orientação e apoio logístico em ambientes hostis, tratando de situações onde a navegação precisa e a sinalização correta são vitais para o resgate de aliados. A prova contextualiza o uso de ferramentas de direção e protocolos de auxílio, assegurando a localização e extração de componentes isolados em qualquer terreno.",
            icon: "ri-shield-cross-line",
            url: "https://drive.google.com/file/d/1vUw46NY6prJTZi70Enbtv77ck1pM-dAY/view"
          },
          {
            label: "RESCOM",
            category: "rescom",
            description: "Esta avaliação valida o conhecimento do operador sobre as normas fundamentais de segurança e convivência, abrangendo desde limites técnicos de potência e distâncias até as condutas éticas e a legislação vigente. O objetivo é garantir a compreensão total sobre as regras de funcionamento das missões e os princípios de honra que sustentam o esporte.",
            icon: "ri-shield-star-line",
            url: "https://drive.google.com/file/d/18ng3NR6r6NOQ57MGPQ2V0XZy1rnxvu4U/view"
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
      { label: "Operadores", icon: "ri-group-line", url: "/management/operators", visible: authStore.isManager },
      { label: "Eventos", icon: "ri-calendar-event-line", url: "/management/events", visible: authStore.isEventManagement },
      { label: "Torneios", icon: "ri-trophy-line", url: "/management/tournaments", visible: authStore.isAdmin || authStore.isEventManagement },
      { label: "Aniversariantes", icon: "ri-cake-2-line", url: "/management/birthdays" },
      { label: "Convidados", icon: "ri-group-3-line", url: "/management/guests", visible: authStore.isAdmin || authStore.isAdministrativeManagement },
      { label: "Cronograma", icon: "ri-calendar-schedule-line", url: "/management/schedules", visible: authStore.isAdmin || authStore.isAdministrativeManagement },
      {
        label: "Financeiro",
        icon: "ri-bank-line",
        visible: authStore.isAdmin || authStore.isFinancialManagement,
        items: [
          { label: "Pagamentos", icon: "ri-wallet-line", url: "/management/finance/payments" },
          { label: "Metas", icon: "ri-gift-line", url: "/management/finance/goals" },
          { label: "Caixa", icon: "ri-exchange-funds-line", url: "/management/finance/cashflow" },
        ],
      },
      {
        label: "Armaria",
        icon: "ri-sword-line",
        visible: authStore.isAdmin || authStore.isArmorer,
        items: [
          { label: "Manutenção", icon: "ri-hammer-line", url: "/management/armory/maintenance" },
        ]
      },
      { label: "Configurações", icon: "ri-settings-4-line", url: "/management/settings", visible: authStore.isAdmin },
    ],
  },
]);

export const userMenuItems = computed(() => [
  {
    label: "Conta",
    items: [
      { label: "Perfil", icon: "ri-user-line", command: () => router.push("/profile") },
      { label: "Sair", icon: "ri-logout-box-r-line", command: handleLogout },
    ],
  },
]);

export const handleLogout = async () => {
  await authStore.logout();
  router.push("/");
};

/**
 * Busca um item do menu por chave. Se o item tiver sub-itens (items), retorna a lista AppMenuItem[].
 * Caso contrário, retorna o próprio objeto AppMenuItem (ou [] se não encontrar).
 * @param key Chave identificadora do item
 * @param items Lista de itens onde buscar (por padrão navItems.value)
 * @returns AppMenuItem | AppMenuItem[]
 */
export const findNavItemByKey = (
  key?: string,
  items: AppMenuItem[] = navItems.value
): AppMenuItem[] => {
  if (!key) return [];

  for (const item of items) {
    if (item.key === key) {
      return item.items?.length ? item.items : [item];
    }

    if (item.items?.length) {
      const found = findNavItemByKey(key, item.items);
      if (found.length > 0) {
        return found;
      }
    }
  }

  return [];
};

/**
 * Busca um item do menu pela sua chave (key) e abre a página ou URL associada.
 * @param key Chave do item do menu
 * @returns void
 */
export const openLink = (key: string) => {
  const [item] = findNavItemByKey(key);
  if (item?.url) openPage(item.url);
};
