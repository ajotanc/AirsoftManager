
import dayjs from 'dayjs';
import { defineStore } from "pinia";
import { account } from "@/services/appwrite";
import { ID, type Models } from "appwrite";
import {
  operatorSchema,
  OperatorService,
  type IOperator,
  type IOperatorDraft,
} from "@/services/operator";
import { PaymentService, type IPayment } from "@/services/payment";
import { DUE_DATE, MONTHLY_FEE, TEAM_NAME } from "@/constants/airsoft";
import { SCHOOL_CATEGORIES, SchoolService, type ISchoolAnswer, type SchoolCategory } from '@/services/school';

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as Models.User<Models.Preferences> | null,
    operator: {} as IOperator,
    loading: true,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isProfileComplete: (state): boolean => {
      if (!state.operator?.$id) return false;
      return operatorSchema.safeParse(state.operator).success;
    },
    isVisitor: (state) => state.operator?.role === "visitor",
    isRecruit: (state) => state.operator?.role === "recruit",
    hasArsenal: (state) => (state.operator?.arsenal?.length ?? 0) > 0,
    hasLoadout: (state) => (state.operator?.loadout?.length ?? 0) > 0,
    isActiveOperator: (state) => state.operator && state.operator.status === true,
    canAccessFinance(_state): boolean {
      return this.isActiveOperator || (!this.isRecruit && !this.isActiveOperator);
    },
    isArsenalLocked(): boolean {
      return !this.isProfileComplete;
    },
    isLoadoutLocked(): boolean {
      return !this.isProfileComplete || !this.hasArsenal;
    },
    isArmorer: (state) => state.operator && state.operator.role === 'armorer',
    isEventManagement: (state) => state.operator && ['admin', 'event', 'media', 'administrative'].includes(state.operator.role),
    isAdministrativeManagement: (state) => state.operator && state.operator.role === 'administrative',
    isFinancialManagement: (state) => state.operator && state.operator.role === 'financial',
    isAdmin: (state) => state.operator && state.operator.role === "admin",
    isManager: (state) => state.operator && !["recruit", "operator", "visitor"].includes(state.operator.role),
    missingCertifications: (state): SchoolCategory[] => {
      const { start } = SchoolService.getSemesterInfo();
      const allCategories: SchoolCategory[] = ['rescom', 'fta', 'sar'];

      const school_answers = state.operator.school_answers as ISchoolAnswer[];
      const completed = school_answers
        .filter(ans => dayjs(ans.completed_at).isAfter(start) || dayjs(ans.completed_at).isSame(start))
        .map(ans => ans.category);

      return allCategories.filter(cat => !completed.includes(cat));
    },
    isSchoolLocked(): boolean {
      if (this.isVisitor) return false;

      const baseDone = this.isProfileComplete && this.hasArsenal && this.hasLoadout;
      if (!baseDone) return false;

      const info = SchoolService.getSemesterInfo();
      const missing = this.missingCertifications;
      const hasCompletedAll = missing.length === 0;

      const status = SchoolService.getIReadinessLevel(
        info.daysRemaining,
        hasCompletedAll,
        info.isRecoveryPeriod
      );

      return !!status.force;
    }
  },

  actions: {
    async init() {
      this.loading = true;
      try {
        this.user = await account.get();
        if (this.user) {
          const [op, school] = await Promise.all([
            OperatorService.row(this.user.$id),
            SchoolService.getAnswers(this.user.$id, SCHOOL_CATEGORIES)
          ]);

          this.operator = op || {} as IOperator;
          this.operator.school_answers = school.all;
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
        this.operator = row || {} as IOperator;
      } catch (error) {
        console.error("Operador não encontrado no banco:", error);
        this.operator = {} as IOperator;
      }
    },
    async register(role: string, email: string, password: string, name: string, team?: string) {
      try {
        const userAccount = await account.create({
          userId: ID.unique(),
          email,
          password,
          name,
        });

        await account.createEmailPasswordSession({ email, password });

        const codename = name.trim().split(" ")[0]!;

        const payload: IOperatorDraft = {
          $id: userAccount.$id,
          name,
          codename,
          role,
          status: false,
          avatar: "",
          rating: 0,
          xp: 0,
          level: 1,
          prestige: 0,
          arsenal: [],
          loadout: [],
          badges: [],
          featured_badges: [],
          birth_date: null,
          team
        };

        const operator = await OperatorService.create(payload as IOperator, userAccount.$id);

        if (role === "recruit") {
          const description = `Matrícula · ${TEAM_NAME}`;

          const date = dayjs();
          const reference = date.format("MM/YYYY");
          const due_date = date.add(DUE_DATE, 'day').toISOString();

          const payment = {
            amount: MONTHLY_FEE,
            status: 'created',
            category: 'enrollment',
            reference,
            description,
            receipt_url: null,
            due_date,
            operator: operator.$id
          } as IPayment;

          await PaymentService.create(payment);
        }

        await this.init();

        return await account.createEmailVerification({
          url: `${window.location.origin}/verify-email`
        });
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
    async resendVerification() {
      try {
        return await account.createEmailVerification({
          url: `${window.location.origin}/verify-email`
        });
      } catch (error) {
        console.error("Erro ao reenviar verificação:", error);
        throw error;
      }
    },
    async forgotPassword(email: string) {
      try {
        return await account.createRecovery({
          email,
          url: `${window.location.origin}/reset-password`
        });
      } catch (error) {
        console.error("Erro ao solicitar recuperação:", error);
        throw error;
      }
    },
    async resetPassword(userId: string, secret: string, password: string) {
      try {
        return await account.updateRecovery({
          userId,
          secret,
          password
        });
      } catch (error) {
        console.error("Erro ao resetar senha:", error);
        throw error;
      }
    },
    async updatePassword(newPassword: string, oldPassword: string) {
      try {
        return await account.updatePassword({ password: newPassword, oldPassword });
      } catch (error) {
        console.error("Erro ao atualizar senha:", error);
        throw error;
      }
    }
  },
});
