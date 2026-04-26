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
    isChampionshipActive: (state) =>
      JSON.parse(state.config["championship_active"] || "false"),
    monthlyFee: (state) => Number(state.config["monthly_fee"] || 0),
  },
  actions: {
    async init() {
      const cached = localStorage.getItem("app_settings");

      if (cached) {
        try {
          this.config = JSON.parse(cached);
        } catch (e) {
          localStorage.removeItem("app_settings");
        }
      }

      await this.refresh();

      const channel = `databases.${DATABASE_ID}.collections.${TABLE_SETTINGS}.documents`;

      realtime.subscribe(channel, (response) => {
        if (
          response.events.some(
            (e) => e.includes(".update") || e.includes(".create"),
          )
        ) {
          this.refresh();
        }
      });
    },

    async refresh() {
      this.loading = true;
      const rows = await SettingsService.list();
      const map: Record<string, string> = {};

      rows.forEach((s) => {
        map[s.key] = s.value;
      });

      this.config = map;
      localStorage.setItem("app_settings", JSON.stringify(map));
      this.loading = false;
    },
  },
});
