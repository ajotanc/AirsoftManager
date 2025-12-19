import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";


import MainLayout from "@/layout/MainLayout.vue";
import PublicLayout from "@/layout/PublicLayout.vue";


import Home from "@/views/public/Home.vue";
import Login from "@/views/public/Login.vue";
import Register from "@/views/public/Register.vue";
import VerifyWeapon from "@/views/public/VerifyWeapon.vue";

import Dashboard from "@/views/private/Dashboard.vue";
import Profile from "@/views/private/Profile.vue";
import Arsenal from "@/views/private/Arsenal.vue";
import Loadout from "@/views/private/Loadout.vue";

import Operators from "@/views/admin/Operators.vue";
import Finance from "@/views/admin/Finance.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: PublicLayout,
      children: [
        { path: "", component: Home },
        { path: "login", component: Login },
        { path: "register", component: Register },
      ],
    },
    {
      path: "/",
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
    {
      path: '/verify/weapon/:id',
      name: 'verify-weapon',
      component: VerifyWeapon,
      meta: {
        isPublic: true,
        layout: 'blank'
      }
    },

    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to, from, next) => {
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
