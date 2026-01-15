// src/services/event.ts
import {
  tables,
  DATABASE_ID,
  storage,
  BUCKET_ID,
  TABLE_OPERATORS,
} from "@/services/appwrite";
import { OperatorService, type IOperator } from "@/services/operator";
import { XP_VALUES, calculateLevel } from "@/constants/airsoft";
import { ID, Query, type Models } from "appwrite";
import type { IVisitor } from "./visitor";
import type { ICarpool } from "./carpool";

// IDs das tabelas que você vai criar no Appwrite
export const TABLE_EVENTS = "events";
export const TABLE_PARTICIPATIONS = "participations";
export const TABLE_VISITOR_PARTICIPATIONS = "visitor_participations";

export interface IEvent extends Models.Row {
  title: string;
  type: number | string;
  date: Date | string | null;
  startTime: string;
  endTime: string;
  location: string;
  location_url: string;
  location_coords?: string;
  description: string;
  thumbnail?: string;
  participations?: IParticipation[];
  visitor_participations?: IVisitorParticipation[];
  carpools?: ICarpool[];
}

export interface IParticipation<TOp = string | IOperator>
  extends Models.Row {
  event: string;
  operator: TOp;
  status: boolean;
  checked_in: boolean;
}

export type IParticipations = IParticipation<IOperator>;

export interface IVisitorParticipation<TOv = string | IVisitor>
  extends Models.Row {
  event: string;
  visitor: TOv;
  checked_in: boolean;
}

export const EventService = {
  async row(rowId: string): Promise<IEvent> {
    try {
      return await tables.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_EVENTS,
        rowId,
        queries: [
          Query.select([
            "*",
            "participations.*",
            "participations.operator.*",
            "visitor_participations.*",
            "visitor_participations.visitor.*",
            "carpools.*",
            "carpools.vehicle.*",
          ]),
        ],
      });
    } catch (error) {
      console.error("Erro ao buscar arsenal:", error);
      return {} as IEvent;
    }
  },
  async list(): Promise<IEvent[]> {
    try {
      const response = await tables.listRows<IEvent>({
        databaseId: DATABASE_ID,
        tableId: TABLE_EVENTS,
        queries: [Query.orderDesc("date")],
      });
      return response.rows;
    } catch (error) {
      console.error("Erro ao listar eventos:", error);
      return [] as IEvent[];
    }
  },
  async update(rowId: string, data: IEvent): Promise<IEvent> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_EVENTS,
      rowId,
      data,
    });
  },
  async upsert(
    rowId: string | undefined,
    data: Partial<IEvent>,
    file?: File
  ): Promise<IEvent> {
    try {
      const isUpdate = !!rowId;
      const id = rowId || ID.unique();

      console.log(file);
      if (file instanceof File) {
        if (isUpdate) {
          this.deleteThumbnail(id);
        }

        data.thumbnail = await this.uploadThumbnail(id, file);
      }

      return await tables.upsertRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_EVENTS,
        rowId: id,
        data,
      });
    } catch (error) {
      console.error("Erro no upsert:", error);
      throw error;
    }
  },
  async delete(rowId: string, thumbnail?: string): Promise<{}> {
    if (thumbnail && thumbnail.includes(BUCKET_ID)) {
      await this.deleteThumbnail(rowId);
    }

    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_EVENTS,
      rowId,
    });
  },
  async create(data: IEvent, rowId: string): Promise<IEvent> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_EVENTS,
      rowId,
      data,
    });
  },
  async listFromDate(startDate: string): Promise<IEvent[]> {
    try {
      const response = await tables.listRows<IEvent>({
        databaseId: DATABASE_ID,
        tableId: TABLE_EVENTS,
        queries: [
          Query.orderDesc("date"),
          Query.greaterThanEqual("date", startDate),
          Query.orderAsc("date"),
          Query.limit(20),
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao listar missões táticas:", error);
      return [];
    }
  },
  /**
   * Confirma a presença (Check-in) e calcula XP automaticamente
   */
  async confirmAttendance(
    rowId: string,
    operatorId: string
  ): Promise<IOperator> {
    try {
      const event = await tables.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_EVENTS,
        rowId: rowId,
      });

      const xpMap: Record<string | number, number> = {
        "1": XP_VALUES.GAME,
        "2": XP_VALUES.MAINTENANCE,
        "3": XP_VALUES.PRESENCE,
        "4": XP_VALUES.COURSE,
      };

      const xpGain = xpMap[event.type] || XP_VALUES.GAME;
      const operator = (await OperatorService.row(operatorId)) as IOperator;

      const newXp = (operator.xp || 0) + xpGain;
      const newLevel = calculateLevel(newXp);

      const participation = await tables.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLE_PARTICIPATIONS,
        queries: [
          Query.equal("event", rowId),
          Query.equal("operator", operatorId),
        ],
      });

      if (participation.total > 0 && participation.rows?.[0]) {
        await tables.updateRow({
          databaseId: DATABASE_ID,
          tableId: TABLE_PARTICIPATIONS,
          rowId: participation.rows[0].$id,
          data: { checked_in: true },
        });
      }

      return await tables.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        rowId: operatorId,
        data: {
          xp: newXp,
          level: newLevel,
        },
      });
    } catch (error) {
      console.error("Erro no check-in:", error);
      throw error;
    }
  },
  async createParticipation(
    rowId: string,
    operatorId: string
  ): Promise<IParticipation> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PARTICIPATIONS,
      rowId: ID.unique(),
      data: {
        event: rowId,
        operator: operatorId,
        status: true,
        checked_in: false,
      },
    });
  },
  async deleteParticipation(participationId: string): Promise<{}> {
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PARTICIPATIONS,
      rowId: participationId,
    });
  },
  async uploadThumbnail(rowId: string, file: File): Promise<string> {
    const fileId = `thumbnail-${rowId}`;

    try {
      await storage.createFile({
        bucketId: BUCKET_ID,
        fileId,
        file,
      });

      const url = storage.getFileView({ bucketId: BUCKET_ID, fileId });
      return `${url.toString()}&v=${Date.now()}`;
    } catch (error) {
      console.error("Erro no upload da imagem:", error);
      throw new Error("Falha ao processar imagem da missão.");
    }
  },
  async deleteThumbnail(rowId: string): Promise<{}> {
    const fileId = `thumbnail-${rowId}`;

    try {
      return await storage.deleteFile({ bucketId: BUCKET_ID, fileId });
    } catch (error) {
      console.error("Erro ao excluir da imagem:", error);
      throw new Error("Falha ao processar imagem da missão.");
    }
  },
  async addVisitorToEvent(eventId: string, visitorId: string): Promise<IVisitorParticipation> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_VISITOR_PARTICIPATIONS,
      rowId: ID.unique(),
      data: {
        event: eventId,
        visitor: visitorId,
        checked_in: false,
      },
    });
  },
  async confirmVisitorAttendance(participationId: string): Promise<IVisitorParticipation> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_VISITOR_PARTICIPATIONS,
      rowId: participationId,
      data: { checked_in: true },
    });
  },
  async deleteVisitorParticipation(participationId: string): Promise<{}> {
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_VISITOR_PARTICIPATIONS,
      rowId: participationId,
    });
  },
  async listVisitorParticipations(eventId: string): Promise<IVisitorParticipation[]> {
    const response = await tables.listRows<IVisitorParticipation>({
      databaseId: DATABASE_ID,
      tableId: TABLE_VISITOR_PARTICIPATIONS,
      queries: [Query.equal("event", eventId), Query.select(["*", "visitor.*", "visitor.operator.*"])]
    });
    return response.rows;
  }
};
