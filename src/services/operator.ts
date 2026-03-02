import {
  tables,
  TABLE_OPERATORS,
  DATABASE_ID,
  BUCKET_ID,
  storage,
} from "@/services/appwrite";
import { Query, type Models } from "appwrite";
import type { IArsenal } from "./arsenal";
import type { ILoadout } from "./loadout";
import { uploadFile } from "@/functions/utils";

export interface IOperator extends Models.Row {
  name: string;
  codename: string;
  identity?: string;
  general_registration?: string;
  blood_type?: string;
  birth_date: Date | string | null;
  mother_name?: string;
  father_name?: string;
  phone?: string;
  cep?: string;
  address?: string;
  address_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  health_plan?: boolean;
  health_plan_name?: string;
  health_plan_number?: string;
  emergency_contact?: string;
  emergency_contact_phone?: string;
  allergies?: Array<string>;
  continuous_medication?: boolean;
  medication_details?: Array<string>;
  category?: number;
  experience?: number;
  instagram?: string;
  shirt_size?: string;
  referral_source?: number;
  number_fdba?: string;
  role: string;
  avatar: string;
  status: boolean;
  rating: number;
  media_consent?: boolean;
  terms_accepted?: boolean;
  terms_accepted_at?: Date;
  quote?: string;
  xp: number;
  level: number;
  prestige: number;
  is_donor?: boolean;
  arsenal: IArsenal[];
  loadout: ILoadout[];
  badges: string[];
  featured_badges: string[];
  profession?: string;
  availability?: "saturday" | "sunday" | "both" | "none";
}

export type IOperatorDraft = Omit<IOperator, keyof Models.Row> & {
  $id: string;
};

export const OperatorService = {
  async row(rowId: string): Promise<IOperator> {
    try {
      return await tables.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        rowId,
        queries: [Query.select(["*", "arsenal.*", "loadout.*"])],
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return {} as IOperator;
    }
  },
  async list(): Promise<IOperator[]> {
    try {
      const response = await tables.listRows<IOperator>({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        queries: [
          Query.select(["*", "arsenal.*", "loadout.*"]),
          Query.orderAsc("codename"),
          Query.limit(1000),
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  },
  async listActive(): Promise<IOperator[]> {
    try {
      const response = await tables.listRows<IOperator>({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        queries: [
          Query.orderAsc("codename"),
          Query.select(["*", "arsenal.*", "loadout.*"]),
          Query.equal("status", true),
          Query.limit(1000),
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  },
  async update(rowId: string, data: Partial<IOperator>): Promise<IOperator> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_OPERATORS,
      rowId,
      data,
    });
  },
  async create(data: IOperator, rowId: string): Promise<IOperator> {
    return await tables.createRow<IOperator>({
      databaseId: DATABASE_ID,
      tableId: TABLE_OPERATORS,
      rowId,
      data,
    });
  },
  async changeAvatar(
    rowId: string,
    avatar: string,
    file: File
  ): Promise<IOperator> {

    if (avatar) {
      await storage.deleteFile({ bucketId: BUCKET_ID, fileId: `avatar-${rowId}` });
    }

    const urlFormatted = await uploadFile(rowId, file, 'avatar');

    return await tables.updateRow<IOperator>({
      databaseId: DATABASE_ID,
      tableId: TABLE_OPERATORS,
      rowId,
      data: {
        avatar: urlFormatted,
      },
    });
  },
  async listBirthdays(): Promise<IOperator[]> {
    try {
      const response = await tables.listRows<IOperator>({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        queries: [Query.equal("status", true), Query.orderDesc("birth_date")],
      });

      const currentMonth = new Date().getMonth();

      return response.rows.filter((operator) => {
        if (!operator.birth_date) return false;
        const birthMonth = new Date(operator.birth_date).getMonth();
        return birthMonth === currentMonth;
      });
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  },
  async getByUsername(username: string): Promise<IOperator> {
    try {
      const response = await tables.listRows<IOperator>({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        queries: [Query.or([
          Query.equal("instagram", username),
          Query.equal("$id", username),
        ])],
      });

      return response.total === 1
        ? (response.rows[0] as IOperator)
        : ({} as IOperator);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return {} as IOperator;
    }
  },
};
