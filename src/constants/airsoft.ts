export const TEAM_NAME = "Éxodo";
export const TEAM_TAG = "EXD";
export const MIN_COMPLETE_UNIFORMS = 1;

export const WEAPON_TYPES = {
  1: "AEG",
  2: "Spring",
  3: "GBB/GBBR",
  4: "HPA",
};

export const WEAPON_CATEGORIES = {
  1: "Assault",
  2: "DMR",
  3: "Sniper",
  4: "Support",
};

export const UNIFORMS = {
  1: "Multicam",
  2: "Verde Militar",
};

export const ROLES = [
  { name: "Administrador", code: "admin" },
  { name: "Recruta", code: "recruit" },
  { name: "Operador", code: "operator" },
];

export const LOADOUT_ITEMS = [
  { key: "combat_shirt", label: "Combat Shirt" },
  { key: "tactical_pants", label: "Calça Tática" },
  { key: "combat_boot", label: "Coturno" },
  { key: "gloves", label: "Luvas" },
  { key: "bonnie_hat", label: "Bonnie Hat" },
  { key: "ski_mask", label: "Balaclava" },
  { key: "tactical_vest", label: "Colete Tático" },
  { key: "tactical_belt", label: "Cinto Tático" },
  { key: "helmet", label: "Capacete" },
  { key: "headset", label: "Headset" },
  { key: "knee_pads", label: "Joelheira" },
  { key: "holster", label: "Coldre" },
  { key: "walkie_talkie", label: "Rádio" },
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
    map: WEAPON_CATEGORIES,
    severity: "info",
  },
  { field: "joule", header: "Joule" },
  { field: "fps", header: "FPS" },
  { field: "serial_number", header: "Serial" },
  { field: "maintained_at", header: "Última Manutenção", isDate: true },
];
