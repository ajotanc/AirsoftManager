import { defineStore } from "pinia";
import { DATABASE_ID, realtime } from "@/services/appwrite";
import { TABLE_SETTINGS, SettingsService } from "@/services/settings";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    config: {} as Record<string, string>,
    loading: false,
  }),
  getters: {
    teamName: (state) => state.config["team_name"] || "Team Airsoft",
    isTournamentActive: (state) => String(state.config["tournament_active"]) === "true",
    recruitmentIsOpen: (state) => String(state.config["recruitment_open"]) === "true",
    monthlyFee: (state) => state.config["monthly_fee"] || import.meta.env.VITE_MONTHLY_FEE,
    registrationStartDate: (state) => state.config["registration_start_date"] || import.meta.env.VITE_REGISTRATION_START_DATE
  },
  actions: {
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

      // Se após o cache ainda estiver vazio, busca obrigatório com await
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
      if (this.loading) return; // Evita múltiplas chamadas simultâneas

      this.loading = true;
      try {
        const rows = await SettingsService.list();
        const map: Record<string, string> = {};

        rows.forEach((s) => {
          map[s.key] = s.value;
        });

        this.config = map;
        localStorage.setItem("app_settings", JSON.stringify(map));
      } catch (error) {
        console.error("Falha ao sincronizar configurações:", error);
      } finally {
        this.loading = false;
      }
    },
  },
});
