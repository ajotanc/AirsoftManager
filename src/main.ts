import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";

import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";
import ConfirmationService from 'primevue/confirmationservice';

import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./style.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);
app.use(ToastService);
app.use(ConfirmationService);

app.use(PrimeVue, {
  theme: {
    preset: Aura,
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
const authStore = useAuthStore();

authStore
  .init()
  .then(() => {
    console.log("Auth inicializado com sucesso.");
  })
  .catch((err) => {
    console.error("Erro ao conectar no Appwrite:", err);
  });
