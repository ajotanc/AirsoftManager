import { definePreset } from "@primevue/themes";
import Aura from "@primevue/themes/aura";
import { palette } from "@primevue/themes";

const surface = palette("#081534");

const success = palette("#388E3C");
const danger = palette("#dc143c");
const warn = palette("#daa520");
const help = palette("#7c4dff");

const ExodoPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      light: {
        surface,
        content: {
          background: "{surface.500}",
          color: "{surface.0}",
        },
        success,
        danger,
        warn,
        help,
      },
    },
  },
  components: {
    button: {
      colorScheme: {
        light: {
          root: {
            danger: {
              background: "{danger.500}",
              hoverBackground: "{danger.600}",
              activeBackground: "{danger.700}",
              borderColor: "{danger.500}",
              hoverBorderColor: "{danger.600}",
              activeBorderColor: "{danger.700}",
              color: "#ffffff",
              hoverColor: "#ffffff",
              activeColor: "#ffffff",
              focusRing: {
                color: "{danger.500}",
                shadow: "none",
              },
            },
            help: {
              background: "{help.500}",
              hoverBackground: "{help.600}",
              activeBackground: "{help.700}",
              borderColor: "{help.500}",
              hoverBorderColor: "{help.600}",
              activeBorderColor: "{help.700}",
              color: "#ffffff",
              hoverColor: "#ffffff",
              activeColor: "#ffffff",
              focusRing: {
                color: "{help.500}",
                shadow: "none",
              },
            },
          },
        },
      },
    },
  },
});

export default ExodoPreset;
