import { createRouter, createWebHistory } from "vue-router";
import { useOperator } from "@/composables/useOperator";
import { checkRegistrationPeriod } from "@/functions/utils";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("../layout/Public.vue"),
      children: [
        { path: "", component: () => import("../views/public/Home.vue") },
        { path: "login", component: () => import("../views/public/Login.vue") },
        {
          path: "register",
          component: () => import("../views/public/Register.vue"),
          props: () => ({
            role: "recruit",
          }),
        },
        {
          path: "visitor-registration",
          component: () => import("../views/public/Register.vue"), // Certifique-se que o caminho está correto
          props: () => ({
            role: "visitor",
          }),
        },
        {
          path: "verify-email",
          component: () => import("../views/public/VerifyEmail.vue"),
        },
        {
          path: "awaiting-verification",
          component: () => import("../views/public/AwaitingVerification.vue"),
        },
        {
          path: "forgot-password",
          component: () => import("../views/public/ForgotPassword.vue"),
        },
        {
          path: "reset-password",
          component: () => import("../views/public/ResetPassword.vue"),
        },
      ],
    },
    {
      path: "/",
      component: () => import("../layout/Private.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "dashboard",
          component: () => import("../views/private/Dashboard.vue"),
        },
        {
          path: "profile",
          component: () => import("../views/private/Profile.vue"),
        },
        {
          path: "arsenal",
          component: () => import("../views/private/Arsenal.vue"),
        },
        {
          path: "loadout",
          component: () => import("../views/private/Loadout.vue"),
        },
        {
          path: "vehicles",
          component: () => import("../views/private/Vehicle.vue"),
        },
        {
          path: "game/badges",
          component: () => import("../views/private/games/Badges.vue"),
        },
        {
          path: "game/ratings",
          component: () => import("../views/private/games/Ratings.vue"),
        },
        {
          path: "game/player-card",
          component: () => import("../views/private/games/PlayerCard.vue"),
        },
        {
          path: "game/card",
          component: () => import("../views/private/games/Card.vue"),
        },
        {
          path: "/schedules",
          component: () => import("../views/private/Schedules.vue"),
        },
        {
          path: "operator/:username",
          name: "operator-profile",
          component: () => import("../views/private/Operator.vue"),
        },
        {
          path: "events/:id",
          name: "event-details",
          component: () => import("../views/private/EventDetails.vue"),
        },
        {
          path: "/happy-birthday/:id",
          name: "happy-birthday",
          component: () => import("../views/private/HappyBirthday.vue"),
        },
        {
          path: "finance/payments",
          component: () => import("../views/private/finance/Payments.vue"),
        },
        {
          path: "finance/cashflow",
          component: () =>
            import("../views/private/finance/FinancialTransparency.vue"),
        },
        {
          path: "/verify/operator/:id",
          name: "verify-operator",
          component: () => import("../views/public/VerifyOperator.vue"),
        },
        {
          path: "admin/operators",
          component: () => import("../views/admin/Operators.vue"),
        },
        {
          path: "admin/events",
          component: () => import("../views/admin/Events.vue"),
        },
        {
          path: "admin/birthdays",
          component: () => import("../views/admin/Birthdays.vue"),
        },
        {
          path: "admin/visitors",
          component: () => import("../views/admin/Visitors.vue"),
        },
        {
          path: "admin/schedules",
          component: () => import("../views/admin/Schedules.vue"),
        },
        {
          path: "admin/finance/payments",
          component: () => import("../views/private/finance/Payments.vue"),
        },
        {
          path: "admin/finance/goals",
          component: () => import("../views/admin/finance/Goals.vue"),
        },
        {
          path: "admin/finance/cashflow",
          component: () => import("../views/admin/finance/Cashflow.vue"),
        },
        {
          path: "admin/armory/maintenance",
          component: () => import("../views/admin/Maintenance.vue"),
        },
      ],
    },
    {
      path: "/verify/weapon/:id",
      name: "verify-weapon",
      component: () => import("../views/public/VerifyWeapon.vue"),
      meta: {
        isPublic: true,
        layout: "blank",
      },
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, behavior: 'smooth' };
    }
  },
});

router.beforeEach(async (to, _, next) => {
  const { authStore } = useOperator();

  if (authStore.loading) {
    await authStore.init();
  }

  const {
    user,
    isAuthenticated,
    isProfileComplete,
    isActiveOperator,
    isRecruit,
    isVisitor,
    hasArsenal,
    hasLoadout
  } = authStore;

  if (to.path === '/register' && !checkRegistrationPeriod()) {
    return next("/");
  }

  // 2. Proteção Geral (Auth e E-mail)
  if (to.meta.requiresAuth) {
    if (!user) return next("/login");
    if (!user.emailVerification && to.path !== "/awaiting-verification") {
      return next("/awaiting-verification");
    }
  }

  // 3. Redirecionamento de Logados
  if (isAuthenticated && ["/login", "/register", "visitor-registration", "/"].includes(to.path)) {
    return next("/dashboard");
  }

  // 4. REGRAS ESPECÍFICAS PARA VISITANTES
  if (isAuthenticated && isVisitor) {
    // TRAVA DE PERFIL: Se não completou o perfil, força ir para /profile e não sai de lá
    if (!isProfileComplete && to.path !== "/profile") {
      return next("/profile");
    }

    // Definimos o que o visitante PODE acessar (Rotas base + Gamificação/Game)
    const allowedPaths = ["/dashboard", "/profile", "/game/badges", "/game/ratings", "/game/player-card"];

    // Verifica se a rota atual está na lista de permitidas ou se é um detalhe de evento (pelo nome ou path)
    const isAllowed = allowedPaths.includes(to.path) || to.name?.toString().includes('event-details') || to.path.startsWith('/events/');

    // Se ele tentar acessar algo fora das permissões (Admin, Financeiro, Arsenal, etc)
    const isTryingRestricted =
      to.path.startsWith('/admin') ||
      to.path.startsWith('/finance') ||
      ["/arsenal", "/loadout", "/vehicles"].includes(to.path);

    if (isTryingRestricted || !isAllowed) {
      return next("/dashboard");
    }

    return next();
  }

  // 5. FLUXO OBRIGATÓRIO DE CADASTRO (Apenas para Operadores/Recrutas)
  if (isAuthenticated && to.meta.requiresAuth && !isVisitor) {
    if (isRecruit || (!isRecruit && isActiveOperator)) {
      if (!isProfileComplete && to.path !== "/profile") return next("/profile");

      if (isProfileComplete && !hasArsenal && to.path !== "/arsenal") {
        return next("/arsenal");
      }

      if (isProfileComplete && hasArsenal && !hasLoadout && to.path !== "/loadout") {
        return next("/loadout");
      }
    }
  }

  next();
});

export default router;
