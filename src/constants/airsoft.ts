import type { ChartOptions, ChartData, TooltipItem } from "chart.js";

export const TEAM_NAME = "Éxodo";
export const TEAM_TAG = "EXD";
export const MIN_COMPLETE_UNIFORMS = 3;

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
  key: string;
  label: string;
  tag: string;
}

export type SkillStats = Record<string, number>;

export const SKILL_ATTRIBUTES: SkillAttribute[] = [
  { key: "honor", label: "Honra", tag: "HON" },
  { key: "aim", label: "Precisão", tag: "PRE" },
  { key: "tactics", label: "Tática", tag: "TAC" },
  { key: "communication", label: "Comunicação", tag: "COM" },
  { key: "mobility", label: "Mobilidade", tag: "MOB" },
  { key: "stealth", label: "Furtividade", tag: "FUR" },
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

          return SKILL_ATTRIBUTES[index]?.label.toUpperCase() || "";
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
        data: SKILL_ATTRIBUTES.map((attr) => stats[attr.key] || 0),

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
