import { defineStore } from "pinia";
import { account } from "@/services/appwrite";
import { ID, type Models } from "appwrite";
import { OperatorService, type Operator } from "@/services/operator";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as Models.User<Models.Preferences> | null,
    operator: {} as Operator,
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
        this.operator = {} as Operator;
      } finally {
        this.loading = false;
      }
    },
    async fetchOperator() {
      if (!this.user) return;

      try {
        const row = await OperatorService.row(this.user.$id);
        this.operator = row as unknown as Operator;
      } catch (error: any) {
        if (error.code === 404) {
          console.warn(
            "Usuário sem perfil detectado. Tentando auto-recuperação..."
          );

          try {
            const name = this.user.name;
            const codename = name.split(" ")[0] || "Recruta";

            const payload: Operator = {
              $id: this.user.$id,
              codename,
              role: "recruit",
              status: false,
              rating: 0,
            };

            await OperatorService.create(payload, this.user.$id);

            this.operator = payload;
            console.log("Perfil recuperado com sucesso!");
          } catch (createError) {
            console.error(
              "Falha crítica: Não foi possível criar o perfil.",
              createError
            );
            this.operator = {} as Operator;
          }
        } else {
          this.operator = {} as Operator;
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
        const payload: Operator = {
          $id: userAccount.$id,
          codename,
          role: "recruit",
          status: false,
          rating: 0,
        };

        await OperatorService.create(payload, userAccount.$id);

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
      this.operator = {} as Operator;
    },
  },
});
