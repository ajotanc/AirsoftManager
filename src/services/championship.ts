import { tables, DATABASE_ID } from "@/services/appwrite";
import { ID } from "appwrite";
import type { IOperator } from "./operator";
import type { IArsenal } from "./arsenal";
import { CATEGORIES } from "@/constants/airsoft";

export const TABLE_CHAMPIONSHIPS = "championships";
export const TABLE_CHAMPIONSHIP_TEAMS = "championship_teams";

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

export const ChampionshipService = {
  /**
   * Gera nomes militares dinâmicos (Alpha, Bravo... Alpha II, Bravo II...)
   */
  getTeamName(index: number): string {
    const name = MILITARY_ALPHABET[index % 26];
    const cycle = Math.floor(index / 26) + 1;

    return `${name}${toRoman(cycle)}`;
  },

  /**
   * Verifica se a quantidade de inscritos permite criar chaves pares (2, 4, 8...)
   * Garante que não haja WO e que todos os times estejam completos.
   */
  canStart(totalRegistered: number, opsPerTeam: number) {
    if (totalRegistered === 0) {
      return { valid: false, message: "Nenhum inscrito." };
    }

    const totalTeams = totalRegistered / opsPerTeam;

    // 1. Verifica se todos os operadores conseguem formar times completos
    if (totalRegistered % opsPerTeam !== 0) {
      return {
        valid: false,
        message: `Existem operadores sem time (Sobra: ${totalRegistered % opsPerTeam}).`,
      };
    }

    // 2. Verifica se o número de equipes é par para o chaveamento lateral
    if (totalTeams % 2 !== 0) {
      return {
        valid: false,
        message: `Número de equipes ímpar (${totalTeams}). É necessário um número par de equipes para as chaves.`,
      };
    }

    return {
      valid: true,
      message: `${totalTeams} equipes prontas para o sorteio.`,
      count: totalTeams,
    };
  },

  /**
   * Realiza o sorteio aleatório e cria as equipes no Appwrite.
   * O slice garante que cada operador caia em apenas um time.
   */
  async drawTeams(
    championshipId: string,
    operators: any[],
    opsPerTeam: number,
  ) {
    // 1. Aleatoriedade total: embaralha a lista de inscritos
    const shuffled = [...operators].sort(() => Math.random() - 0.5);

    const teams = [];
    let currentTeamIndex = 0;

    // 2. Distribui os operadores em times sequenciais
    for (let i = 0; i < shuffled.length; i += opsPerTeam) {
      const teamMembers = shuffled.slice(i, i + opsPerTeam);

      // Só cria o time se ele estiver completo de acordo com o modo (1x1, 2x2, etc)
      if (teamMembers.length === opsPerTeam) {
        const teamData = {
          name: this.getTeamName(currentTeamIndex),
          operators: teamMembers.map((op) => op.$id),
          championship_id: championshipId,
          points: 0,
        };

        const doc = await tables.createRow({
          databaseId: DATABASE_ID,
          tableId: TABLE_CHAMPIONSHIP_TEAMS,
          rowId: ID.unique(),
          data: teamData,
        });

        teams.push(doc);
        currentTeamIndex++;
      }
    }
    return teams;
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
