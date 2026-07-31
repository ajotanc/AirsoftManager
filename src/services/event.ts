import { ID, Query, type Models } from "appwrite";
import dayjs from "dayjs";
import {
  tables,
  permissions,
  DATABASE_ID,
  BUCKET_ID,
} from "@/services/appwrite";
import { OperatorService, type IOperator } from "@/services/operator";
import { XP_VALUES } from "@/constants/airsoft";

import { type IGuest } from "./guest";
import type { ICarpool } from "./carpool";
import { deleteFile, uploadFile } from "@/functions/utils";
import { BadgeService } from "./badge";
import type { IFeedback } from "./feedback";

export const TABLE_EVENTS = "events";
export const TABLE_PARTICIPATIONS = "participations";
export const TABLE_GUEST_PARTICIPATIONS = "visitor_participations";

export interface IEvent extends Models.Row {
  title: string;
  types: string[] | number[];
  date: Date | string | null;
  reference: string;
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
  allow_visitors: boolean;
  list_open?: boolean;
  participations?: IParticipation[];
  guest_participations?: IGuestParticipation[];
  carpools?: ICarpool[];
  feedbacks?: IFeedback[];
}

export interface IParticipation<TOp = string | IOperator> extends Models.Row {
  event: string;
  operator: TOp;
  status: boolean;
  checked_in: boolean;
}

export interface IGuestParticipation<TOv = string | IGuest>
  extends Models.Row {
  event: string;
  guest: TOv;
  checked_in: boolean;
}

export type IGuestParticipationDetail = IGuestParticipation<
  IGuest<string>
>;

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
            "guest_participations.*",
            "guest_participations.guest.*",
            "carpools.*",
            "carpools.vehicle.*",
            "feedbacks.*",
            "feedbacks.operator.*",
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
      const reference = dayjs().format("YYYY");

      const response = await tables.listRows<IEvent>({
        databaseId: DATABASE_ID,
        tableId: TABLE_EVENTS,
        queries: [
          Query.select([
            "*",
            "participations.*",
            "participations.operator.*",
            "guest_participations.*",
            "guest_participations.guest.*",
          ]),
          Query.orderAsc("date"),
          Query.limit(1000),
          Query.or([
            Query.endsWith("reference", reference),
            Query.isNull("reference"),
          ]),
        ],
      });
      return response.rows;
    } catch (error) {
      console.error("Erro ao listar eventos:", error);
      return [];
    }
  },
  async listByMonth(): Promise<IEvent[]> {
    try {
      const currentMonth = dayjs().format("MM/YYYY");
      const nextMonth = dayjs().add(1, "month").format("MM/YYYY");

      const response = await tables.listRows<IEvent>({
        databaseId: DATABASE_ID,
        tableId: TABLE_EVENTS,
        queries: [
          Query.select([
            "*",
            "participations.*",
            "participations.operator.*",
            "guest_participations.*",
            "guest_participations.guest.*",
          ]),
          Query.orderAsc("date"),
          Query.limit(1000),
          Query.or([
            Query.equal("reference", currentMonth),
            Query.equal("reference", nextMonth),
            Query.isNull("reference"),
          ]),
        ],
      });
      return response.rows;
    } catch (error) {
      console.error("Erro ao listar eventos:", error);
      return [];
    }
  },
  async create(rowId: string, data: IEvent): Promise<IEvent> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_EVENTS,
      rowId,
      data,
      permissions,
    });
  },
  async update(rowId: string, data: Partial<IEvent>): Promise<IEvent> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_EVENTS,
      rowId,
      data,
      permissions,
    });
  },
  async upsert(
    rowId: string | undefined,
    data: IEvent | Partial<IEvent>,
    file?: File,
  ): Promise<IEvent> {
    try {
      const isUpdate = !!rowId;
      const id = rowId || ID.unique();

      if (file instanceof File) {
        if (isUpdate && data.thumbnail) {
          await deleteFile(id, "thumbnail");
        }

        data.thumbnail = await uploadFile(id, file, "thumbnail");
      }

      if (isUpdate) {
        return await this.update(id, data as Partial<IEvent>);
      }

      return await this.create(id, data as IEvent);
    } catch (error) {
      console.error("Erro no upsert:", error);
      throw error;
    }
  },
  async delete(event: IEvent): Promise<{}> {
    if (event.thumbnail && event.thumbnail.includes(BUCKET_ID)) {
      await deleteFile(event.$id, "thumbnail");
    }

    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_EVENTS,
      rowId: event.$id,
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
    operatorId: string,
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

      const xpGain = event.types.reduce((acc: number, t: string | number) => {
        return acc + (xpMap[t] || 0);
      }, 0) || XP_VALUES.GAME;

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
          permissions,
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
    operatorId: string,
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
      permissions,
    });
  },
  async deleteParticipation(participationId: string): Promise<{}> {
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PARTICIPATIONS,
      rowId: participationId,
    });
  },
  async addGuestToEvent(
    eventId: string,
    guestId: string,
  ): Promise<IGuestParticipation> {
    return await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_GUEST_PARTICIPATIONS,
      rowId: ID.unique(),
      data: {
        event: eventId,
        guest: guestId,
        checked_in: false,
      },
      permissions,
    });
  },
  async confirmVisitorAttendance(
    participationId: string,
  ): Promise<IGuestParticipation> {
    try {
      const updatedParticipation =
        await tables.updateRow<IGuestParticipation>({
          databaseId: DATABASE_ID,
          tableId: TABLE_GUEST_PARTICIPATIONS,
          rowId: participationId,
          data: { checked_in: true },
          permissions,
        });

      if (updatedParticipation.guest) {
        const guest = updatedParticipation.guest as IGuest<IOperator>;
        const hostOperator = await OperatorService.row(guest.operator.$id);

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
      tableId: TABLE_GUEST_PARTICIPATIONS,
      rowId: participationId,
    });
  },
  async listVisitorParticipations(
    eventId: string,
  ): Promise<IGuestParticipation[]> {
    const response = await tables.listRows<IGuestParticipation>({
      databaseId: DATABASE_ID,
      tableId: TABLE_GUEST_PARTICIPATIONS,
      queries: [
        Query.equal("event", eventId),
        Query.select(["*", "guest.*", "guest.operator.*"]),
      ],
    });
    return response.rows;
  },
  async finalize(rowId: string): Promise<IEvent> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_EVENTS,
      rowId,
      data: { is_finished: true },
      permissions,
    });
  },
};
