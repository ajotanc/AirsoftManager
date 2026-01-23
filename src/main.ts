import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";

import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";
import ConfirmationService from "primevue/confirmationservice";
import { registerSW } from "virtual:pwa-register";
import StyleClass from 'primevue/styleclass';
import Ripple from 'primevue/ripple';

import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./style.css";

import "remixicon/fonts/remixicon.css";

const app = createApp(App);
const pinia = createPinia();

registerSW({
  immediate: true,
  onRegistered(r) {
    r && setInterval(() => {
      r.update();
    }, 60 * 60 * 1000);
  }
});

app.use(pinia);
app.use(router);
app.use(i18n);
app.use(ToastService);
app.use(ConfirmationService);

app.use(PrimeVue, {
  theme: {
    preset: ExodoPreset,
    options: {
      darkModeSelector: false,
      cssLayer: false,
    },
  },
  locale: {
    dayNames: [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ],
    dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"],
    dayNamesMin: ["D", "S", "T", "Q", "Q", "S", "S"],
    monthNames: [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ],
    monthNamesShort: [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ],
    today: "Hoje",
    clear: "Limpar",
    dateFormat: "dd/mm/yy",
    firstDayOfWeek: 0,
  },
});

app.directive("tooltip", Tooltip);
app.mount("#app");

import { useAuthStore } from "@/stores/auth";
import ExodoPreset from "./theme/exodo-preset";
const authStore = useAuthStore();

authStore
  .init()
  .then(() => {
    console.log("Auth inicializado com sucesso.");
  })
  .catch((err) => {
    console.error("Erro ao conectar no Appwrite:", err);
  });

app.directive('styleclass', StyleClass);
app.directive('ripple', Ripple);