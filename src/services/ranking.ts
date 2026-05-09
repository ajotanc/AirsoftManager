import { tables, DATABASE_ID, permissions } from "@/services/appwrite";
import { ID, Query, type Models } from "appwrite";
import type { ITournament, ITournamentMatch, ITournamentTeam } from "./tournament";
import type { IOperator } from "./operator";

export type HitLocation =
  | 'head' | 'torso'
  | 'mms_left' | 'mms_right'
  | 'mmi_left' | 'mmi_right';

export const TABLE_RANKINGS = "rankings";

export interface IRanking extends Models.Row {
  operator: IOperator;
  tournament?: ITournament;
  match?: ITournamentMatch;
  wins: number;
  losses: number;
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

export const TACTICAL_POINTS = {
  head: 3,
  torso: 10,
  mms_left: 5,
  mms_right: 5,
  mmi_left: 5,
  mmi_right: 5
};

export const RankingService = {
  async listByTournament(tournamentId: string): Promise<IRanking[]> {
    try {
      const response = await tables.listRows<IRanking>({
        databaseId: DATABASE_ID,
        tableId: TABLE_RANKINGS,
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
  async create(data: IRanking): Promise<IRanking> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_RANKINGS,
      rowId: ID.unique(),
      data,
      permissions
    });
  },
  async update(rowId: string, data: Partial<IRanking>): Promise<IRanking> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_RANKINGS,
      rowId,
      data,
      permissions
    });
  },
  async upsert(
    rowId: string | undefined,
    data: IRanking | Partial<IRanking>
  ): Promise<IRanking> {
    try {
      const isUpdate = !!rowId;

      if (isUpdate) {
        return this.update(rowId, data as Partial<IRanking>);
      }

      return this.create(data as IRanking);
    } catch (error) {
      console.error("Erro no upsert:", error);
      throw error;
    }
  },
  async updateMatchRankings(tournament: ITournament, currentRankings: IRanking[], match: ITournamentMatch, winnerId: string) {
    const teams = [match.top_side, match.bottom_side] as ITournamentTeam[];

    const rankingUpdates = teams.flatMap(team => {
      const isWinner = team.$id === winnerId;

      return team.operators.map((op) => {
        const operator = op as IOperator;
        const existing = currentRankings.find(r => r.operator.$id === operator.$id && r.match?.$id === match.$id);

        const wins = (existing?.wins || 0) + (isWinner ? 1 : 0);
        const losses = (existing?.losses || 0) + (isWinner ? 0 : 1);

        return RankingService.upsert(existing?.$id, {
          operator,
          tournament,
          match,
          wins,
          losses
        });
      });
    });

    return await Promise.all(rankingUpdates);
  }
};