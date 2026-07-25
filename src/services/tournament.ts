import { tables, DATABASE_ID, permissions } from "@/services/appwrite";
import { ID, Query, type Models } from "appwrite";
import type { IOperator } from "./operator";
import type { IArsenal } from "./arsenal";
import { fisherYatesShuffle } from '@/functions/utils';
import { CATEGORIES } from "@/constants/airsoft";

export const TABLE_TOURNAMENTS = "tournaments";
export const TABLE_TOURNAMENT_TEAMS = "tournament_teams";
export const TABLE_TOURNAMENT_MATCHES = "tournament_matches";
export const TABLE_TOURNAMENT_REGISTRATIONS = "tournament_registrations";

export type TournamentType = "knockout" | "bo3" | "bo5";
export type TournamentAllowedClass = "all" | "pistol" | string;
export type TournamentStatus = "open" | "ongoing" | "finished";

export type TournamentRegistrationStatus = "pending" | "confirmed";

export interface ITournament extends Models.Row {
  name: string;
  description: string;
  date: string;
  mode: number;
  type: TournamentType;
  allowed_class: TournamentAllowedClass;
  is_paid: boolean;
  price: number;
  status: TournamentStatus;
  awards: string[];
  registrations?: ITournamentRegistration[];
  teams?: ITournamentTeam[];
  matches?: ITournamentMatch[];
}

export interface ITournamentRegistration<TO = ITournament | string, OP = IOperator | string> extends Models.Row {
  tournament: TO;
  operator: OP;
  status: TournamentRegistrationStatus;
}

export interface ITournamentTeam<OP = IOperator | string> extends Models.Row {
  tournament: string;
  name: string;
  operators: OP[];
  score: number;
}

export interface ITournamentMatch<TO = ITournament | string, TE = ITournamentTeam | string | null> extends Models.Row {
  tournament: TO;
  next_match: string | null;
  round: number;
  top_side: TE;
  bottom_side: TE;
  winner: TE;
  top_score: number;
  bottom_score: number;
}

export const MILITARY_ALPHABET = [
  "Alpha",
  "Bravo",
  "Charlie",
  "Delta",
  "Echo",
  "Foxtrot",
  "Golf",
  "Hotel",
  "India",
  "Juliett",
  "Kilo",
  "Lima",
  "Mike",
  "November",
  "Oscar",
  "Papa",
  "Quebec",
  "Romeo",
  "Sierra",
  "Tango",
  "Uniform",
  "Victor",
  "Whiskey",
  "X-ray",
  "Yankee",
  "Zulu",
];

export const STATUS_LABEL: Record<TournamentStatus, string> = {
  open: 'Inscrições Abertas',
  ongoing: 'Em Andamento',
  finished: 'Finalizado',
}

/**
 * Converte números em Romanos para sufixos (ex: II, III).
 * Retorna string vazia para o número 1.
 */
const toRoman = (num: number): string => {
  if (num <= 1) return "";

  const roman: Record<string, number> = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let str = "";

  for (const [key, value] of Object.entries(roman)) {
    while (num >= value) {
      str += key;
      num -= value;
    }
  }

  return ` ${str}`; // Adiciona o espaço apenas se houver o numeral
};

export const TournamentService = {
  async list(): Promise<ITournament[]> {
    try {
      const startOfCurrentMonth = dayjs().startOf('month').toISOString();

      const response = await tables.listRows<ITournament>({
        databaseId: DATABASE_ID,
        tableId: TABLE_TOURNAMENTS,
        queries: [
          Query.greaterThanEqual("date", startOfCurrentMonth),
          Query.orderDesc("date"),
        ],
      });
      return response.rows;
    } catch (error) {
      console.error("Erro ao listar torneios:", error);
      return [];
    }
  },
  async upsert(rowId: string | undefined, data: Partial<ITournament>): Promise<ITournament> {
    const id = rowId || ID.unique();
    return await tables.upsertRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_TOURNAMENTS,
      rowId: id,
      data,
      permissions
    });
  },
  async delete(rowId: string): Promise<{}> {
    return await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_TOURNAMENTS,
      rowId,
    });
  },
  async row(rowId: string): Promise<ITournament> {
    try {
      return await tables.getRow<ITournament>({
        databaseId: DATABASE_ID,
        tableId: TABLE_TOURNAMENTS,
        rowId,
        queries: [
          Query.select([
            "*",
            "registrations.*",
            "registrations.operator.*",
            "teams.*",
            "teams.operators.*",
            "matches.*",
            "matches.top_side.*",
            "matches.bottom_side.*",
            "matches.winner.*"
          ])
        ]
      });
    } catch (error) {
      console.error("Erro ao buscar torneio:", error);
      return {} as ITournament;
    }
  },
  async update(rowId: string, data: Partial<ITournament>): Promise<ITournament> {
    return await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_TOURNAMENTS,
      rowId,
      data,
      permissions
    });
  },
  async updateMatch(rowId: string, data: Partial<ITournamentMatch>): Promise<ITournamentMatch> {
    return await tables.updateRow<ITournamentMatch>({
      databaseId: DATABASE_ID,
      tableId: TABLE_TOURNAMENT_MATCHES,
      rowId,
      data,
      permissions
    });
  },
  async advanceWinner(match: ITournamentMatch, winnerId: string) {
    // 1. Define o vencedor da partida atual
    const current = await this.updateMatch(match.$id, { winner: winnerId });

    // 2. Se não houver próxima partida, o torneio acabou
    if (!match.next_match) return { current, next: null };

    // 3. Busca a próxima partida para saber onde injetar o vencedor
    const nextMatch = await tables.getRow<ITournamentMatch>({
      databaseId: DATABASE_ID,
      tableId: TABLE_TOURNAMENT_MATCHES,
      rowId: match.next_match,
    });

    // Lógica de Slot: Se o top_side estiver vazio ou for o vencedor atual, atualiza ele.
    // Senão, joga no bottom_side.
    const isTopSlotEmpty = !nextMatch.top_side;
    const updateData = isTopSlotEmpty
      ? { top_side: winnerId }
      : { bottom_side: winnerId };

    const next = await this.updateMatch(nextMatch.$id, updateData);

    return { current, next };
  },
  async getConfirmedRegistrations(tournamentId: string): Promise<ITournamentRegistration[]> {
    try {
      const response = await tables.listRows<ITournamentRegistration>({
        databaseId: DATABASE_ID,
        tableId: TABLE_TOURNAMENT_REGISTRATIONS,
        queries: [
          Query.equal("tournament", tournamentId),
          Query.equal("status", "confirmed")
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar inscrições confirmadas:", error);
      return [];
    }
  },
  async getUserRegistration(tournamentId: string, operatorId: string): Promise<ITournamentRegistration | null> {
    try {
      const response = await tables.listRows<ITournamentRegistration>({
        databaseId: DATABASE_ID,
        tableId: TABLE_TOURNAMENT_REGISTRATIONS,
        queries: [
          Query.equal("tournament", tournamentId),
          Query.equal("operator", operatorId)
        ],
      });
      return response.rows[0] || null;
    } catch (error) {
      console.error("Erro ao buscar inscrição do operador:", error);
      return null;
    }
  },
  async registerOperator(
    tournamentId: string,
    operatorId: string,
    status: TournamentRegistrationStatus = "confirmed"
  ): Promise<ITournamentRegistration> {
    const existing = await this.getUserRegistration(tournamentId, operatorId);
    if (existing) {
      if (existing.status === status) return existing;
      return await tables.updateRow<ITournamentRegistration>({
        databaseId: DATABASE_ID,
        tableId: TABLE_TOURNAMENT_REGISTRATIONS,
        rowId: existing.$id,
        data: { status },
        permissions,
      });
    }

    return await tables.createRow<ITournamentRegistration>({
      databaseId: DATABASE_ID,
      tableId: TABLE_TOURNAMENT_REGISTRATIONS,
      rowId: ID.unique(),
      data: {
        tournament: tournamentId,
        operator: operatorId,
        status,
      },
      permissions,
    });
  },
  async listMatches(tournamentId: string): Promise<ITournamentMatch[]> {
    try {
      const response = await tables.listRows<ITournamentMatch>({
        databaseId: DATABASE_ID,
        tableId: TABLE_TOURNAMENT_MATCHES,
        queries: [
          Query.equal("tournament", tournamentId),
        ],
      });

      return response.rows;
    } catch (error) {
      console.error("Erro ao buscar partidas:", error);
      return [];
    }
  },
  async getMatch(rowId: string): Promise<ITournamentMatch> {
    return await tables.getRow<ITournamentMatch>({
      databaseId: DATABASE_ID,
      tableId: TABLE_TOURNAMENT_MATCHES,
      rowId,
      queries: [
        Query.select([
          '*',
          'top_side.*',
          'bottom_side.*',
          'winner.*'
        ])
      ]
    });
  },
  /**
   * Gera a estrutura de chaves (vazia ou com times)
   * A lógica cria da Final para as fases iniciais para garantir os IDs de next_match
   */
  async generateBracket(tournamentId: string, teams: ITournamentTeam[]): Promise<ITournamentMatch[]> {
    const totalTeams = teams.length;

    // CORREÇÃO: Math.ceil garante que o número de rounds seja um inteiro (ex: 3.8 vira 4)
    const numRounds = Math.ceil(Math.log2(totalTeams));

    // Função recursiva para criar os rounds sem usar 'let' ou loops 'for' manuais
    const createRounds = async (round: number, nextMatches: ITournamentMatch[]): Promise<ITournamentMatch[]> => {
      if (round < 1) return nextMatches;

      const matchesInRound = Math.pow(2, numRounds - round);

      const currentRoundMatches = await Promise.all(
        Array.from({ length: matchesInRound }).map(async (_, i) => {
          const next_match = nextMatches[Math.floor(i / 2)]?.$id || null;

          const data = {
            tournament: tournamentId,
            next_match,
            round: Math.floor(round), // Garante que seja inteiro para o Appwrite
            top_side: round === 1 ? (teams[i * 2]?.$id ?? null) : null,
            bottom_side: round === 1 ? (teams[i * 2 + 1]?.$id ?? null) : null,
            winner: null,
            top_score: 0,
            bottom_score: 0
          };

          return await tables.createRow<ITournamentMatch>({
            databaseId: DATABASE_ID,
            tableId: TABLE_TOURNAMENT_MATCHES,
            rowId: ID.unique(),
            data,
            permissions // Certifique-se que 'permissions' está definido no escopo
          });
        })
      );

      return await createRounds(round - 1, currentRoundMatches);
    };

    // Inicia a criação de trás para frente (da Final para a Semifinal...)
    return await createRounds(numRounds, []);
  },
  /**
   * Gera nomes militares dinâmicos (Alpha, Bravo... Alpha II, Bravo II...)
   */
  getTeamName(index: number): string {
    const name = MILITARY_ALPHABET[index % 26];
    const cycle = Math.floor(index / 26) + 1;

    return `${name}${toRoman(cycle)}`;
  },
  /**
   * Valida o torneio e define o alvo da barra de progresso.
   * Para 8 pessoas em 2x2, o retorno será 8/8 por já ser um estado válido.
   */
  canStart(totalRegistered: number, opsPerTeam: number) {
    const minTeams = 2;
    const hasLeftover = totalRegistered % opsPerTeam !== 0;
    const currentTeamsCount = Math.ceil(totalRegistered / opsPerTeam);

    // Calcula o alvo de times (Potência de 2: 2, 4, 8, 16...)
    const targetTeams = Math.pow(
      2,
      Math.ceil(Math.log2(Math.max(minTeams, currentTeamsCount)))
    );

    const requiredCount = targetTeams * opsPerTeam;
    const missingTotal = requiredCount - totalRegistered;

    // Validação estrita
    const isValid = !hasLeftover &&
      currentTeamsCount >= minTeams &&
      currentTeamsCount === targetTeams;

    // Mensagem objetiva: informa o quanto falta para o objetivo final da estrutura
    const message = isValid
      ? `${currentTeamsCount} times prontas para o sorteio.`
      : `Faltam ${missingTotal} para fechar o total de ${targetTeams} times.`;

    return {
      valid: isValid,
      current: totalRegistered,
      required: requiredCount,
      message,
    };
  },
  /**
   * Realiza o sorteio aleatório e cria as times no Appwrite.
   * O slice garante que cada operador caia em apenas um time.
   */
  async drawTeams(
    tournamentId: string,
    operators: IOperator[],
    opsPerTeam: number,
  ): Promise<ITournamentTeam[]> {
    const shuffled = fisherYatesShuffle<IOperator>(operators);

    const totalTeamsCount = Math.floor(shuffled.length / opsPerTeam);

    return await Promise.all(
      Array.from({ length: totalTeamsCount }).map(async (_, index) => {
        const start = index * opsPerTeam;
        const teamMembers = shuffled.slice(start, start + opsPerTeam);

        const teamData = {
          tournament: tournamentId,
          name: this.getTeamName(index),
          operators: teamMembers.map((op) => op.$id),
          score: 0,
        };

        return await tables.createRow<ITournamentTeam>({
          databaseId: DATABASE_ID,
          tableId: TABLE_TOURNAMENT_TEAMS,
          rowId: ID.unique(),
          data: teamData,
        });
      })
    );
  },
  /**
   * Valida se o operador atende à restrição de classe do campeonato.
   */
  checkRestriction(operator: IOperator, allowedClass: string): boolean {
    const target = allowedClass.toLowerCase();
    if (target === "all") return true;

    return operator.arsenal.some((arm: IArsenal) => {
      // Regra para pistolas (secundárias)
      if (target === "pistol") return !!arm.is_secondary;

      // Comparação direta com o label das categorias cadastradas
      const categoryLabel = CATEGORIES[arm.category as keyof typeof CATEGORIES];
      return categoryLabel?.toLowerCase() === target;
    });
  },
};
