import { tables, TABLE_SKILL_RATINGS, DATABASE_ID } from "@/services/appwrite";
import { Query } from "appwrite";

export interface Rating {
  $id?: string;
  type: number;
  combat_shirt: boolean | null;
  tactical_pants: boolean | null;
  combat_boot: boolean | null;
  gloves: boolean | null;
  bonnie_hat: boolean | null;
  ski_mask: boolean | null;
  tactical_vest: boolean | null;
  tactical_belt: boolean | null;
  helmet: boolean | null;
  headset: boolean | null;
  knee_pads: boolean | null;
  holster: boolean | null;
  walkie_talkie: boolean | null;
}

export const RatingService = {
  async row(rowId: string) {
    try {
      return await tables.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_SKILL_RATINGS,
        rowId,
      });
    } catch (error) {
      console.error("Erro ao buscar arsenal:", error);
      return [];
    }
  },
  async list() {
    try {
      const response = await tables.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLE_SKILL_RATINGS,
        queries: [Query.orderDesc("$createdAt")],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar arsenais:", error);
      return [];
    }
  },
  async update(rowId: string, data: Rating) {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_SKILL_RATINGS,
      rowId,
      data,
    });
  },
  async create(data: Rating, rowId: string) {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_SKILL_RATINGS,
      rowId,
      data,
    });
  },
  async getRatingsForTarget(targetId: string) {
    try {
      return await tables.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLE_SKILL_RATINGS,
        queries: [Query.equal('target', targetId)],
      });
    } catch (error) {
      console.error("Erro ao buscar arsenais:", error);
      return [];
    }
  },
  getTierByScore(score: number) {
    if (score >= 4.5) return { label: 'ELITE', color: '#a855f7', icon: 'pi pi-crown' };
    if (score >= 3.5) return { label: 'VETERANO', color: '#f59e0b', icon: 'pi pi-shield' };
    if (score >= 2.0) return { label: 'OPERACIONAL', color: '#3b82f6', icon: 'pi pi-cog' };
    return { label: 'EM TREINAMENTO', color: '#22c55e', icon: 'pi pi-user' };
  },
};