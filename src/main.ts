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

import { useOperator } from "@/composables/useOperator";
import ExodoPreset from "./theme/exodo-preset";

import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./style.css";

import "remixicon/fonts/remixicon.css";
import '@/assets/rpg-Awesome/css/rpg-awesome.css';

const app = createApp(App);
const pinia = createPinia();

registerSW({
  immediate: true,
  onRegistered(r) {
    if (r) {
      setInterval(() => {
        console.log('Verificando atualizações no servidor...');
        r.update();
      }, 10 * 60 * 1000);
    }
  },
  onNeedRefresh() {
    location.reload();
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

const { authStore } = useOperator();

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

app.directive('asterisk', {
  mounted(el, binding) {
    const schema = binding.value;
    if (!schema || !schema.shape) return;

    const shapes = schema.shape;
    const labels = el.querySelectorAll('label');

    labels.forEach((label: HTMLLabelElement) => {
      const container = label.closest('.p-formfield');
      if (!container) return;

      const input = container.querySelector('input[name], select[name], textarea[name]') as HTMLInputElement;

      const fieldName = input ? input.name : label.htmlFor;

      if (fieldName && shapes[fieldName]) {
        const fieldSchema = shapes[fieldName];

        const isOptional = fieldSchema.safeParse(undefined).success;
        const isRequired = !isOptional;

        if (isRequired && !label.querySelector('.auto-asterisk')) {
          const star = document.createElement('span');
          star.innerText = '*';
          star.style.paddingLeft = '0.15rem';
          star.style.color = 'var(--p-red-500)';
          star.style.fontWeight = 'bold';
          star.classList.add('auto-asterisk');
          label.appendChild(star);
        }
      }
    });
  }
});