import { ID, Query, type Models } from "appwrite";
import {
  tables,
  permissions,
  DATABASE_ID,
  BUCKET_ID,
} from "@/services/appwrite";
import { OperatorService, type IOperator } from "@/services/operator";
import { XP_VALUES } from "@/constants/airsoft";

import { type IVisitor } from "./visitor";
import type { ICarpool } from "./carpool";
import { deleteFile, uploadFile } from "@/functions/utils";
import { BadgeService } from "./badge";

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
  file: File | null;
  thumbnail: string | null;
  minimum_effective: number;
  rule?: string;
  is_finished: boolean;
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

export interface IVisitorParticipation<TOv = string | IVisitor>
  extends Models.Row {
  event: string;
  visitor: TOv;
  checked_in: boolean;
}

export type IVisitorParticipationDetail = IVisitorParticipation<IVisitor<string>>;

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
        queries: [
          Query.select([
            "*",
            "participations.*",
            "participations.operator.*",
            "visitor_participations.*",
            "visitor_participations.visitor.*"
          ]),
          Query.orderAsc("date")
        ],
      });
      return response.rows;
    } catch (error) {
      console.error("Erro ao listar eventos:", error);
      return [];
    }
  },
  async create(data: IEvent): Promise<IEvent> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_EVENTS,
      rowId: ID.unique(),
      data,
      permissions
    });
  },
  async update(rowId: string, data: Partial<IEvent>): Promise<IEvent> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_EVENTS,
      rowId,
      data,
      permissions
    });
  },
  async upsert(
    rowId: string | undefined,
    data: IEvent | Partial<IEvent>,
    file?: File
  ): Promise<IEvent> {
    try {
      const isUpdate = !!rowId;
      const id = rowId || ID.unique();

      if (file instanceof File) {
        if (isUpdate) {
          await deleteFile(id);
        }

        data.thumbnail = await uploadFile(id, file, 'event-thumbnail');
      }

      if (isUpdate) {
        return await this.update(id, data as Partial<IEvent>);
      }

      return await this.create(data as IEvent);
    } catch (error) {
      console.error("Erro no upsert:", error);
      throw error;
    }
  },
  async delete(rowId: string, thumbnail?: string): Promise<{}> {
    if (thumbnail && thumbnail.includes(BUCKET_ID)) {
      await deleteFile(rowId);
    }

    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_EVENTS,
      rowId,
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
      const operator = await OperatorService.row(operatorId);

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
          permissions
        });
      }

      const opWithXp = await BadgeService.addActivityXp(operator, xpGain);
      return await BadgeService.syncOperatorBadges(opWithXp);
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
      permissions
    });
  },
  async deleteParticipation(participationId: string): Promise<{}> {
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PARTICIPATIONS,
      rowId: participationId,
    });
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
      permissions
    });
  },
  async confirmVisitorAttendance(participationId: string): Promise<IVisitorParticipation> {
    try {
      const updatedParticipation = await tables.updateRow<IVisitorParticipation>({
        databaseId: DATABASE_ID,
        tableId: TABLE_VISITOR_PARTICIPATIONS,
        rowId: participationId,
        data: { checked_in: true },
        permissions
      });

      if (updatedParticipation.visitor) {
        const visitor = updatedParticipation.visitor as IVisitor<IOperator>;
        const hostOperator = await OperatorService.row(visitor.operator.$id);

        if (hostOperator) {
          await BadgeService.addActivityXp(hostOperator, 25);
        }
      }

      return updatedParticipation;
    } catch (error) {
      console.error("Erro no check-in do visitante:", error);
      throw error;
    }
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
  },
  async finalize(rowId: string): Promise<IEvent> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_EVENTS,
      rowId,
      data: { is_finished: true },
      permissions
    });
  },
}
