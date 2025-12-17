import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

// Layouts
import MainLayout from "@/layout/MainLayout.vue";
import PublicLayout from "@/layout/PublicLayout.vue";

// Views
import Home from "@/views/public/Home.vue";
import Login from "@/views/public/Login.vue";
import Register from "@/views/public/Register.vue";

import Dashboard from "@/views/private/Dashboard.vue";
import Profile from "@/views/private/Profile.vue";
import Arsenal from "@/views/private/Arsenal.vue";
import Loadout from "@/views/private/Loadout.vue";

import Operators from "@/views/admin/Operators.vue";
import Finance from "@/views/admin/Finance.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // --- ÁREA PÚBLICA (Header Institucional) ---
    {
      path: "/",
      component: PublicLayout,
      // Não exige auth, mas se já estiver logado e tentar ir pro login, joga pro dashboard
      children: [
        { path: "", component: Home }, // A URL será apenas /
        { path: "login", component: Login },
        { path: "register", component: Register },
      ],
    },

    // --- ÁREA PRIVADA (Header do Sistema) ---
    {
      path: "/", // Raiz compartilhada, mas diferenciada pelos filhos
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: "dashboard",
          component: Dashboard,
        },
        {
          path: "profile",
          component: Profile,
        },
        {
          path: "arsenal",
          component: Arsenal,
        },
        {
          path: "loadout",
          component: Loadout,
        },
        {
          path: "admin/operators",
          component: Operators,
        },
        {
          path: "admin/finance",
          component: Finance,
        },
      ],
    },

    // Qualquer rota não encontrada vai pra Home
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (authStore.loading) await authStore.init();

  const isAuth = authStore.isAuthenticated;
  const requiresAuth = to.meta.requiresAuth;

  // 1. Tenta acessar área privada sem login -> Manda pro Login
  if (requiresAuth && !isAuth) {
    return next("/login");
  }

  // 2. Tenta acessar Login/Register já estando logado -> Manda pro Dashboard
  if (isAuth && (to.path === "/login" || to.path === "/register")) {
    return next("/dashboard");
  }

  // 3. Controle de Setup (Recruta)
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
