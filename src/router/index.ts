import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

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
        }, {
          path: "vehicles",
          component: () => import("../views/private/Vehicle.vue"),
        },
        {
          path: "game/player-card",
          component: () => import("../views/private/games/PlayerCard.vue"),
        },
        {
          path: "game/ratings",
          component: () => import("../views/private/games/Ratings.vue"),
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
          component: () => import("../views/private/finance/FinancialTransparency.vue"),
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
});

router.beforeEach(async (to, _, next) => {
  const authStore = useAuthStore();

  if (authStore.loading) await authStore.init();

  const isAuth = authStore.isAuthenticated;
  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth && !isAuth) {
    return next("/login");
  }

  if (isAuth && (to.path === "/login" || to.path === "/register")) {
    return next("/dashboard");
  }

  if (isAuth) {
    if (
      !authStore.hasCompletedSetup &&
      authStore.isActiveOperator &&
      to.path !== "/profile"
    ) {
      return next("/profile");
    }
  }

  next();
});

export default router;
