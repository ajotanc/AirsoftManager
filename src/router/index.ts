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
          path: "game",
          children: [
            {
              path: "badges",
              component: () => import("../views/private/games/Badges.vue"),
            },
            {
              path: "ratings",
              component: () => import("../views/private/games/Ratings.vue"),
            },
            {
              path: "player-card",
              component: () => import("../views/private/games/PlayerCard.vue"),
            },
            {
              path: "card",
              component: () => import("../views/private/games/Card.vue"),
            },
          ]
        },
        {
          path: "administrative",
          children: [
            {
              path: "schedules",
              component: () => import("../views/private/Schedules.vue"),
            },
            {
              path: "school",
              component: () => import("../views/private/school/Dashboard.vue"),
            },
            {
              path: "school/quiz/:category/:id?",
              name: "school-quiz",
              component: () => import("../views/private/school/Quiz.vue"),
            },
            {
              path: "school/recovery",
              component: () => import("../views/private/school/Recovery.vue"),
            },
            {
              path: "finance",
              children: [
                {
                  path: "payments",
                  component: () => import("../views/private/finance/Payments.vue"),
                },
                {
                  path: "cashflow",
                  component: () => import("../views/private/finance/FinancialTransparency.vue"),
                },
              ]
            }
          ]
        },
        {
          path: "operator/:username",
          component: () => import("../views/private/Operator.vue"),
        },
        {
          path: "events/:id",
          component: () => import("../views/private/EventDetails.vue"),
        },
        {
          path: "tournament/:id",
          name: "tournament-details",
          component: () => import("../views/private/Tournament.vue"),
        },
        {
          path: "/happy-birthday/:id",
          name: "happy-birthday",
          component: () => import("../views/private/HappyBirthday.vue"),
        },
        {
          path: "/verify/operator/:id",
          component: () => import("../views/public/VerifyOperator.vue"),
        },
        {
          path: "management",
          children: [
            {
              path: "operators",
              component: () => import("../views/admin/Operators.vue"),
            },
            {
              path: "events",
              component: () => import("../views/admin/Events.vue"),
            },
            {
              path: "birthdays",
              component: () => import("../views/admin/Birthdays.vue"),
            },
            {
              path: "guests",
              component: () => import("../views/admin/Guests.vue"),
            },
            {
              path: "schedules",
              component: () => import("../views/admin/Schedules.vue"),
            },
            {
              path: "finance",
              children: [
                {
                  path: "payments",
                  component: () => import("../views/private/finance/Payments.vue"),
                },
                {
                  path: "goals",
                  component: () => import("../views/admin/finance/Goals.vue"),
                },
                {
                  path: "cashflow",
                  component: () => import("../views/admin/finance/Cashflow.vue"),
                },
              ]
            },
            {
              path: "armory",
              children: [
                {
                  path: "maintenance",
                  component: () => import("../views/admin/Maintenance.vue"),
                },
              ]
            }
          ]
        },
      ],
    },
    {
      path: "/verify/weapon/:id",
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
  // AJUSTE: Só manda pro Dashboard se já tiver o básico (Perfil e Arsenal)
  if (isAuthenticated && ["/login", "/register", "visitor-registration", "/"].includes(to.path)) {
    if (isProfileComplete && hasArsenal) {
      return next("/dashboard");
    }
    // Se não tiver o básico, deixa passar para as regras 4 ou 5 tratarem o redirecionamento correto
  }

  // 4. REGRAS ESPECÍFICAS PARA VISITANTES
  if (isAuthenticated && isVisitor) {
    // PASSO 1: Perfil
    if (!isProfileComplete && to.path !== "/profile") {
      return next("/profile");
    }

    // PASSO 2 (NOVO): Arsenal Obrigatório para Visitante também
    if (isProfileComplete && !hasArsenal && to.path !== "/arsenal") {
      return next("/arsenal");
    }

    const allowedPaths = ["/dashboard", "/profile", "/arsenal", "/game/badges", "/game/ratings", "/game/player-card"];
    const isAllowed = allowedPaths.includes(to.path) || to.name?.toString().includes('event-details') || to.path.startsWith('/events/') || to.name?.toString().includes('tournament-details');

    // Removido "/arsenal" da lista isTryingRestricted para o visitante poder entrar
    const isTryingRestricted =
      to.path.startsWith('/management') ||
      to.path.startsWith('/administrative') ||
      ["/loadout", "/vehicles"].includes(to.path);

    if (isTryingRestricted || !isAllowed) {
      return next("/dashboard");
    }

    return next();
  }

  // 5. FLUXO OBRIGATÓRIO DE CADASTRO (Operadores/Recrutas)
  if (isAuthenticated && to.meta.requiresAuth && !isVisitor) {
    if (isRecruit || (!isRecruit && isActiveOperator)) {
      if (!isProfileComplete && to.path !== "/profile") return next("/profile");

      if (isProfileComplete && !hasArsenal && to.path !== "/arsenal") {
        return next("/arsenal");
      }

      if (isProfileComplete && hasArsenal && !hasLoadout && to.path !== "/loadout") {
        return next("/loadout");
      }

      if (authStore.isSchoolLocked) {
        const RECOVERY_PATH = "/administrative/school/recovery";
        if (to.path !== RECOVERY_PATH) {
          return next(RECOVERY_PATH);
        }
      }
    }
  }

  next();
});

export default router;
