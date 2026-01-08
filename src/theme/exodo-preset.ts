import { definePreset } from "@primevue/themes";
import Aura from "@primevue/themes/aura";

export const ExodoPreset = definePreset(Aura, {
  semantic: {
    // COR PRIMÁRIA: Dourado do Logo ÊXODO
    // primary: {
    //   500: "#D4AF37",
    //   600: "#B8860B", // Tom mais escuro para o hover
    // },
    // CORES DOS BOTÕES (Mantendo o padrão tático que você gostou)
    success: { 500: "#22c55e" }, // Verde Check-in
    error: { 500: "#ef4444" }, // Vermelho Alerta (Ex: Cancelar Presença)
    warn: { 500: "#f59e0b" }, // Laranja Aviso
    info: { 500: "#3b82f6" }, // Azul Info

    colorScheme: {
      light: {
        // Definimos no 'light' para ser o tema único e fixo
        surface: {
          0: "#ffffff",
          50: "#f9fafb",
          // Tons de Azul Marinho extraídos do logo para o fundo
          800: "#001A33", // Fundo dos cards
          900: "#081534", // Fundo principal (Marinho Profundo)
          950: "#00050D",
        },
        content: {
          background: "{surface.900}",
          color: "{surface.0}",
        },
      },
    },
  },
});
