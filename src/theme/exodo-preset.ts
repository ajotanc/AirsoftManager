import { definePreset } from "@primevue/themes";
import Aura from "@primevue/themes/aura";
import { palette } from "@primevue/themes";

const primary = palette("#081534");
const success = palette("#388E3C");
const danger = palette("#dc143c");
const warn = palette("#daa520");
const help = palette("#7c4dff");

const ExodoPreset = definePreset(Aura, {
  primitive: {
    green: success,
    red: danger,
    yellow: warn,
    purple: help,
    blue: primary,
  },
  semantic: {
    colorScheme: {
      light: {
        primary,
        surface: primary,
        content: {
          background: "{surface.0}",
          color: "{surface.500}",
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
            success: {
              background: "{success.500}",
              hoverBackground: "{success.600}",
              activeBackground: "{success.700}",
              borderColor: "{success.500}",
              hoverBorderColor: "{success.600}",
              activeBorderColor: "{success.700}",
              color: "#ffffff",
              hoverColor: "#ffffff",
              activeColor: "#ffffff",
              focusRing: {
                color: "{success.500}",
                shadow: "none",
              },
            },
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
            warn: {
              background: "{warn.500}",
              hoverBackground: "{warn.600}",
              activeBackground: "{warn.700}",
              borderColor: "{warn.500}",
              hoverBorderColor: "{warn.600}",
              activeBorderColor: "{warn.700}",
              color: "#ffffff",
              hoverColor: "#ffffff",
              activeColor: "#ffffff",
              focusRing: {
                color: "{warn.500}",
                shadow: "none",
              },
            },
          },
        },
      },
    },
    tag: {
      colorScheme: {
        light: {
          warn: {
            background: '{yellow.100}',
            color: '{yellow.700}'
          },
        },
      }
    },
    rating: {
      icon: {
        colorScheme: {
          light: {
            color: '{yellow.600}',
            hoverColor: '{yellow.500}',
            activeColor: '{yellow.500}'
          },
        }
      }
    }
  },
});

export default ExodoPreset;
