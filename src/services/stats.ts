// services/StatsService.ts
import { tables, DATABASE_ID, permissions } from "@/services/appwrite";
import { ID, Query, type Models } from "appwrite";
import type { ITournament, ITournamentMatch } from "./tournament";
import type { IOperator } from "./operator";

export const TABLE_TOURNAMENT_STATS = "tournament_stats";

export interface ITournamentOperatorStat extends Models.Row {
  operator: IOperator;
  tournament?: ITournament;
  match?: ITournamentMatch;
  kills: number;
  deaths: number;
  head_hits: number;
  torso_hits: number;
  mms_left_hits: number;
  mms_right_hits: number;
  mmi_left_hits: number;
  mmi_right_hits: number;
  points_total: number;
}

export type HitLocation =
  | 'head' | 'torso'
  | 'mms_left' | 'mms_right'
  | 'mmi_left' | 'mmi_right';

export const TACTICAL_POINTS = {
  head: 3,
  torso: 10,
  mms_left: 5,
  mms_right: 5,
  mmi_left: 5,
  mmi_right: 5
};

export const StatsService = {
  async getSatsTournamet(tournamentId: string): Promise<ITournamentOperatorStat[]> {
    try {
      const response = await tables.listRows<ITournamentOperatorStat>({
        databaseId: DATABASE_ID,
        tableId: TABLE_TOURNAMENT_STATS,
        queries: [
          Query.select([
            "*",
            "operator.*",
            "tournament.*",
            "match.*"
          ]),
          Query.equal("tournament", tournamentId)
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return [];
    }
  },
  async create(data: ITournamentOperatorStat): Promise<ITournamentOperatorStat> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_TOURNAMENT_STATS,
      rowId: ID.unique(),
      data,
      permissions
    });
  },
  async update(rowId: string, data: Partial<ITournamentOperatorStat>): Promise<ITournamentOperatorStat> {
    console.log("Atualizando estatísticas:", { rowId, data });
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_TOURNAMENT_STATS,
      rowId,
      data,
      permissions
    });
  },
  async setStats(
    rowId: string | undefined,
    data: ITournamentOperatorStat | Partial<ITournamentOperatorStat>
  ): Promise<ITournamentOperatorStat> {
    try {
      const isUpdate = !!rowId;

      if (isUpdate) {
        return this.update(rowId, data as Partial<ITournamentOperatorStat>);
      }

      return this.create(data as ITournamentOperatorStat);
    } catch (error) {
      console.error("Erro no upsert:", error);
      throw error;
    }
  },
};