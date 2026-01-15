import { defineStore } from "pinia";
import { account } from "@/services/appwrite";
import { ID, type Models } from "appwrite";
import {
  OperatorService,
  type IOperator,
  type IOperatorDraft,
} from "@/services/operator";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as Models.User<Models.Preferences> | null,
    operator: {} as IOperator,
    loading: true,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    hasCompletedSetup: (state) =>
      state.operator && state.operator.role !== "recruit",
    isActiveOperator: (state) => state.operator && state.operator.status,
    isAdmin: (state) => state.operator && state.operator.role === "admin",
  },

  actions: {
    async init() {
      this.loading = true;
      try {
        this.user = await account.get();
        if (this.user) {
          await this.fetchOperator();
        }
      } catch (error) {
        this.user = null;
        this.operator = {} as IOperator;
      } finally {
        this.loading = false;
      }
    },
    async fetchOperator() {
      if (!this.user) return;

      try {
        const row = await OperatorService.row(this.user.$id);
        this.operator = row;
      } catch (error: any) {
        if (error.code === 404) {
          console.warn(
            "Usuário sem perfil detectado. Tentando auto-recuperação..."
          );

          try {
            const name = this.user.name;
            const codename = name.split(" ")[0] || "Recruta";

            const payload: IOperatorDraft = {
              $id: this.user.$id,
              name,
              codename,
              role: "recruit",
              status: false,
              avatar: "",
              rating: 0,
              xp: 0,
              level: 1,
              prestige: 0,
              arsenal: [],
              loadout: [],
              participations: [],
              birth_date: null
            };

            await OperatorService.create(payload as IOperator, this.user.$id);

            this.operator = payload as IOperator;
            console.log("Perfil recuperado com sucesso!");
          } catch (createError) {
            console.error(
              "Falha crítica: Não foi possível criar o perfil.",
              createError
            );
            this.operator = {} as IOperator;
          }
        } else {
          this.operator = {} as IOperator;
          console.error("Erro desconhecido:", error);
        }
      }
    },

    async register(email: string, password: string, name: string) {
      try {
        const userAccount = await account.create({
          userId: ID.unique(),
          email,
          password,
          name,
        });

        await account.createEmailPasswordSession({ email, password });

        const codename = name.trim().split(" ")[0] || "Recruta";

        const payload: IOperatorDraft = {
          $id: userAccount.$id,
          name,
          codename,
          role: "recruit",
          status: false,
          avatar: "",
          rating: 0,
          xp: 0,
          level: 1,
          prestige: 0,
          arsenal: [],
          loadout: [],
          participations: [],
          birth_date: null
        };

        await OperatorService.create(payload as IOperator, userAccount.$id);

        await this.init();
      } catch (error) {
        console.error("Erro no fluxo de registro:", error);
        throw error;
      }
    },

    async login(email: string, password: string) {
      await account.createEmailPasswordSession({ email, password });
      await this.init();
    },

    async logout() {
      await account.deleteSession({ sessionId: "current" });
      this.user = null;
      this.operator = {} as IOperator;
    },
  },
});
