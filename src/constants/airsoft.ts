import type { ChartOptions, ChartData, TooltipItem } from "chart.js";

export const TEAM_NAME = "Êxodo";
export const TEAM_TAG = "EXD";
export const MIN_COMPLETE_UNIFORMS = 3;
export const EXPERIENCE_PER_LEVEL = 200;

export const EVENT_TYPES = {
  1: "Jogo",
  2: "Evento",
  3: "Manutenção",
  4: "Curso",
};

export const XP_VALUES = {
  GAME: 50, // Jogo normal
  MAINTENANCE: 20, // Manutenção de campo/equipamento
  PRESENCE: 10, // Reunião ou presença rápida
  COURSE: 100, // Cursos e treinamentos oficiais
};

export const LEVELS = [
  {
    min: 1,
    max: 5,
    label: "Iniciado em Campo",
    description: "Aprendendo os fundamentos da operação.",
  },
  {
    min: 6,
    max: 10,
    label: "Operador de Linha",
    description: "Já conhece o terreno e executa ordens com precisão.",
  },
  {
    min: 11,
    max: 15,
    label: "Especialista Urbano",
    description: "Domina táticas de CQB e progressão em grupo.",
  },
  {
    min: 16,
    max: 20,
    label: "Batedor de Vanguarda",
    description: "O primeiro a entrar, o último a sair.",
  },
  {
    min: 21,
    max: 25,
    label: "Atirador Designado",
    description: "Precisão absoluta em distâncias críticas.",
  },
  {
    min: 26,
    max: 30,
    label: "Estrategista de Setor",
    description: "Capaz de coordenar pequenas esquadras em combate.",
  },
  {
    min: 31,
    max: 35,
    label: "Lobo da Floresta",
    description: "Especialista em camuflagem e operações de longa duração.",
  },
  {
    min: 36,
    max: 40,
    label: "Mestre de Armas",
    description: "Conhecimento total de mecânica e balística.",
  },
  {
    min: 41,
    max: 45,
    label: "Veterano de Elite",
    description: "Resiliência testada em inúmeras missões.",
  },
  {
    min: 46,
    max: 49,
    label: "Sombra da Unidade",
    description: "Invisível para o inimigo, letal para o objetivo.",
  },
  {
    min: 50,
    max: 50,
    label: "O Fantasma",
    description: "A lenda viva do time. Sua presença altera o rumo da missão.",
  },
];

export const calculateLevel = (xp: number) => {
  const level = Math.floor(xp / EXPERIENCE_PER_LEVEL) + 1;
  return level > 50 ? 50 : level;
};

export const WEAPON_TYPES = {
  1: "AEG",
  2: "Spring",
  3: "GBB/GBBR",
  4: "HPA",
};

export const WEAPON_TYPES_OPTIONS = Object.entries(WEAPON_TYPES).map(
  ([index, name]) => ({
    name,
    code: Number.parseInt(index),
  })
);

export const CATEGORIES = {
  1: "Assault",
  2: "DMR",
  3: "Sniper",
  4: "Support",
};

export const CATEGORIES_OPTIONS = Object.entries(CATEGORIES).map(
  ([index, name]) => ({
    name,
    code: Number.parseInt(index),
  })
);

export const UNIFORM_IDS = {
  MULTICAM: 1,
  VERDE_MILITAR: 2,
  PMC: 3,
} as const;

export const UNIFORMS = {
  [UNIFORM_IDS.MULTICAM]: "Multicam",
  [UNIFORM_IDS.VERDE_MILITAR]: "Verde Militar",
  [UNIFORM_IDS.PMC]: "PMC",
};

export const UNIFORMS_OPTIONS = Object.entries(UNIFORMS).map(
  ([index, name]) => ({
    name,
    code: Number.parseInt(index),
  })
);

export const PMC_EXCEPTIONS = ["helmet", "ski_mask", "headset"];

export const ROLES = [
  { name: "Administrador", code: "admin" },
  { name: "Recruta", code: "recruit" },
  { name: "Operador", code: "operator" },
];

export const SHIRT_SIZES = ["PP", "P", "M", "G", "GG", "XG"];
export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const EXPERIENCES = [
  { name: "Básico", code: 1 },
  { name: "Intermediário", code: 2 },
  { name: "Avançado", code: 3 },
];

export const SOURCES = [
  { name: "Membro (Indicação)", code: 1 },
  { name: "Redes Sociais", code: 2 },
  { name: "Grupo Online", code: 3 },
  { name: "Evento/Campo", code: 4 },
  { name: "Pesquisa Google", code: 5 },
  { name: "Site Oficial", code: 6 },
  { name: "Outro", code: 7 },
];

export const LOADOUT_ITEMS = [
  { key: "helmet", label: "Capacete", optional: false },
  { key: "bonnie_hat", label: "Bonnie Hat", optional: false },
  { key: "ski_mask", label: "Balaclava", optional: false },
  { key: "headset", label: "Headset", optional: false },
  { key: "combat_shirt", label: "Combat Shirt", optional: false },
  { key: "tactical_pants", label: "Calça Tática", optional: false },
  { key: "tactical_vest", label: "Colete Tático", optional: false },
  { key: "tactical_belt", label: "Cinto Tático", optional: false },
  { key: "gloves", label: "Luvas", optional: false },
  { key: "knee_pads", label: "Joelheira", optional: true },
  { key: "combat_boot", label: "Coturno", optional: false },
  { key: "holster", label: "Coldre", optional: false },
  { key: "walkie_talkie", label: "Rádio", optional: false },
];

export const ARSENAL_COLUMNS = [
  { field: "name", header: "Nome" },
  {
    field: "type",
    header: "Tipo",
    isTag: true,
    map: WEAPON_TYPES,
    severity: "contrast",
  },
  {
    field: "category",
    header: "Categoria",
    isTag: true,
    map: CATEGORIES,
    severity: "info",
  },
  { field: "joule", header: "Joule" },
  { field: "fps", header: "FPS" },
  // { field: "invoice", header: "Nota Fiscal" },
  { field: "maintained_at", header: "Última Manutenção", isDate: true },
];

export interface SkillAttribute {
  field: string;
  header: string;
  tag: string;
}

export type SkillStats = Record<string, number>;

export const SKILL_ATTRIBUTES: SkillAttribute[] = [
  { field: "honor", header: "Honra", tag: "HON" },
  { field: "aim", header: "Precisão", tag: "PRE" },
  { field: "tactics", header: "Tática", tag: "TAC" },
  { field: "communication", header: "Comunicação", tag: "COM" },
  { field: "mobility", header: "Mobilidade", tag: "MOB" },
  { field: "stealth", header: "Furtividade", tag: "FUR" },
  // { field: "teste", header: "Teste", tag: "TES" },
];

export const RADAR_OPTIONS: ChartOptions<"radar"> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      angleLines: {
        display: true,
        color: "rgba(255, 255, 255, 0.1)",
      },
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
      suggestedMin: 0,
      suggestedMax: 5,
      ticks: {
        stepSize: 1,
        backdropColor: "transparent",
        color: "#9ca3af",
        font: { size: 10 },
      },
      pointLabels: {
        font: { size: 14, weight: "bold", family: "sans-serif" },
        color: "#e5e7eb",
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(17, 24, 39, 0.95)",
      titleColor: "#22c55e",
      bodyFont: { size: 14 },
      padding: 12,
      borderColor: "rgba(34, 197, 94, 0.3)",
      borderWidth: 2,
      callbacks: {
        title: (context: TooltipItem<"radar">[]) => {
          const item = context[0];
          if (!item) return "";

          const index = item.dataIndex;

          return SKILL_ATTRIBUTES[index]?.header.toUpperCase() || "";
        },
      },
    },
  },
};

export const getRadarChartData = (stats: SkillStats): ChartData<"radar"> => {
  return {
    labels: SKILL_ATTRIBUTES.map((attr) => attr.tag),
    datasets: [
      {
        label: "Nível",
        data: SKILL_ATTRIBUTES.map((attr) => stats[attr.field] || 0),

        backgroundColor: "rgba(34, 197, 94, 0.25)",
        borderColor: "#22c55e",
        borderWidth: 2,
        pointBackgroundColor: "#22c55e",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#22c55e",
        fill: true,
      },
    ],
  };
};

export const EVENTS_COLUMNS = [
  { field: "title", header: "Titulo" },
  {
    field: "type",
    header: "Tipo",
    isTag: true,
    map: EVENT_TYPES,
    severity: "contrast",
  },
  { field: "date", header: "Data", isDate: true },
  { field: "location_name", header: "Localização" },
  { field: "description", header: "Descrição" },
];
