import { tables, TABLE_OPERATORS, DATABASE_ID } from "@/services/appwrite";
import dayjs from "dayjs";
import { isValidCpf } from "@brazilian-utils/brazilian-utils";
import { Query, type Models } from "appwrite";
import type { IArsenal } from "./arsenal";
import type { ILoadout } from "./loadout";
import { deleteFile, formatDate, uploadFile, z } from "@/functions/utils";
import type { ISchoolAnswer } from "./school";

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
  team?: string;
  school_answers?: ISchoolAnswer[];
}

export type IOperatorDraft = Omit<IOperator, keyof Models.Row> & {
  $id: string;
};

export const operatorSchema = z
  .object({
    name: z
      .required("Nome completo obrigatório"),
    codename: z
      .required("Codinome obrigatório"),
    identity: z
      .required("CPF obrigatório")
      .refine(isValidCpf, "CPF inválido")
      .transform((v) => v.replace(/\D/g, "")),
    general_registration: z
      .required("RG obrigatório")
      .transform((v) => v.replace(/\D/g, "")),
    birth_date: z
      .custom()
      .refine(
        (date) => date instanceof Date || typeof date === "string",
        "Data obrigatória",
      )
      .transform((date) => date && formatDate(date).toISOString()),
    blood_type: z.required("Tipo sanguíneo obrigatório"),
    mother_name: z.required("Nome da mãe obrigatório"),
    phone: z
      .required("Telefone obrigatório")
      .transform((v) => v.replace(/\D/g, "")),
    cep: z
      .required("CEP obrigatório", 2)
      .transform((v) => v.replace(/\D/g, "")),
    address: z.required("Endereço obrigatório"),
    address_number: z.required("Número obrigatório"),
    neighborhood: z.required("Bairro obrigatório"),
    city: z.required("Cidade obrigatória"),
    state: z.required("Estado obrigatório"),
    emergency_contact: z.required("Nome do Contato obrigatório"),
    emergency_contact_phone: z
      .required("Telefone do Contato obrigatório")
      .transform((v) => v.replace(/\D/g, "")),
    category: z.number({ error: "Categoria obrigatória" }),
    shirt_size: z.required("Tamanho obrigatório"),
    terms_accepted: z
      .boolean({ error: "Aceite os termos obrigatório" })
      .refine((v) => v === true, "Aceite os termos obrigatório"),
    availability: z.required("Escolha sua disponibilidade"),
    instagram: z
      .string()
      .regex(
        /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]*$/,
        "Formato de usuário inválido (ex: exodoairsoft)",
      )
      .nullish()
      .transform((value) => value?.replace("@", "").toLowerCase()),
  })
  .loose();

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
          Query.notEqual("role", "visitor"),
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
    operator: IOperator,
    file: File,
  ): Promise<IOperator> {
    if (operator.avatar) {
      await deleteFile(operator.$id, "avatar");
    }

    const urlFormatted = await uploadFile(operator.$id, file, "avatar");

    return await tables.updateRow<IOperator>({
      databaseId: DATABASE_ID,
      tableId: TABLE_OPERATORS,
      rowId: operator.$id,
      data: {
        avatar: urlFormatted,
      },
    });
  },
  async listBirthdays(includeNextMonth: boolean = false): Promise<IOperator[]> {
    try {
      const response = await tables.listRows<IOperator>({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        queries: [
          Query.equal("status", true),
          Query.notEqual("role", "visitor"),
          Query.limit(1000)
        ],
      });

      const now = dayjs();
      const currentMonth = now.month(); // 0 a 11
      const nextMonth = now.add(1, "month").month();

      const filtered = response.rows.filter((operator) => {
        if (!operator.birth_date) return false;

        const birthDate = dayjs(operator.birth_date);
        const birthMonth = birthDate.month();

        if (includeNextMonth) {
          return birthMonth === currentMonth || birthMonth === nextMonth;
        }

        return birthMonth === currentMonth;
      });

      // Ordenar por dia do mês para facilitar a visualização no mural/lista
      return filtered.sort((a, b) => {
        const dayA = dayjs(a.birth_date).date();
        const dayB = dayjs(b.birth_date).date();

        // Se incluir o próximo mês, precisamos ordenar primeiro pelo mês, depois pelo dia
        const monthA = dayjs(a.birth_date).month();
        const monthB = dayjs(b.birth_date).month();

        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
      });
    } catch (error) {
      console.error("Erro ao buscar aniversariantes:", error);
      return [];
    }
  },
  async getByUsername(username: string): Promise<IOperator> {
    try {
      const response = await tables.listRows<IOperator>({
        databaseId: DATABASE_ID,
        tableId: TABLE_OPERATORS,
        queries: [
          Query.or([
            Query.equal("instagram", username),
            Query.equal("$id", username),
          ]),
        ],
      });

      return response.total === 1
        ? (response.rows[0] as IOperator)
        : ({} as IOperator);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return {} as IOperator;
    }
  },
  async activate(rowId: string): Promise<IOperator> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_OPERATORS,
      rowId,
      data: {
        status: true,
        role: "operator",
      },
    });
  },
};
