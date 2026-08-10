import { defineStore } from "pinia";
import { DATABASE_ID, realtime } from "@/services/appwrite";
import { TABLE_SETTINGS, SettingsService, type ISetting } from "@/services/settings";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    config: {} as Partial<ISetting>,
    loading: false,
  }),
  getters: {
    teamName: (state) => state.config.team_name || "Team Airsoft",
    isTournamentActive: (state) => !!state.config.tournament_active,
    showTacticalMap: (state) => state.config.tactical_map ?? false,
    showGlobalMap: (state) => state.config.global_map ?? false,
    recruitmentIsOpen: (state) => !!state.config.recruitment_open,
    monthlyFee: (state) => state.config.monthly_fee || import.meta.env.VITE_MONTHLY_FEE || "0.00",
    maxPendingPayments: (state) => state.config.max_pending_payments ?? 3,
    registrationStartDate: (state) => state.config.registration_start_date || import.meta.env.VITE_REGISTRATION_START_DATE || "",
    blueBase: (state) => state.config.blue_base || "-12.890545, -38.31959",
    yellowBase: (state) => state.config.yellow_base || "-12.890610, -38.318789",
    blueBaseCoords: (state): [number, number] => {
      return useSettingsStore().formatCoordinates(state.config.blue_base);
    },
    yellowBaseCoords: (state): [number, number] => {
      return useSettingsStore().formatCoordinates(state.config.yellow_base);
    },
  },
  actions: {
    formatCoordinates(str?: string, defaultCoords: [number, number] = [-12.890545, -38.31959]): [number, number] {
      if (str && str.includes(",")) {
        const [lat, lng] = str.split(",").map((s) => Number(s.trim()));
        if (lat && !isNaN(lat) && lng && !isNaN(lng)) {
          return [lat, lng];
        }
      }

      return defaultCoords;
    },
    async init() {
      const cached = localStorage.getItem("app_settings");

      if (cached) {
        try {
          this.config = JSON.parse(cached);
          this.refresh();
        } catch (e) {
          localStorage.removeItem("app_settings");
        }
      }

      if (Object.keys(this.config).length === 0) {
        await this.refresh();
      }

      const channel = `databases.${DATABASE_ID}.collections.${TABLE_SETTINGS}.documents`;

      realtime.subscribe(channel, (response) => {
        const isChange = response.events.some(
          (e) => e.includes(".update") || e.includes(".create") || e.includes(".delete")
        );

        if (isChange) {
          this.refresh();
        }
      });
    },

    async refresh() {
      if (this.loading) return;

      this.loading = true;
      try {
        const doc = await SettingsService.get();
        if (doc) {
          this.config = doc;
          localStorage.setItem("app_settings", JSON.stringify(doc));
        }
      } catch (error) {
        console.error("Falha ao sincronizar configurações:", error);
      } finally {
        this.loading = false;
      }
    },
  },
});
