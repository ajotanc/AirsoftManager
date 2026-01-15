import beepSound from "@/assets/sounds/beep.mp3"; // O '@' aponta para a pasta src

export interface IFields {
  name: string;
  label: string;
  component: any;
  col?: string;
  props?: any;
  isTag?: boolean;
  isRating?: boolean;
  hidden?: boolean;
  callback?: (value: any) => string;
  button?: {
    icon: string;
    severity?: string;
    callback: (rowData: any) => void;
  };
  [key: string]: any;
}

export const isValidIdentity = (cpf: string): boolean => {
  if (typeof cpf !== "string") return false;

  cpf = cpf.replace(/[\s.-]*/gim, "");

  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

  const cpfDigits: number[] = cpf.split("").map((el) => +el);

  const rest = (count: number): number => {
    return (
      ((cpfDigits
        .slice(0, count - 1)
        .reduce((soma, el, index) => soma + el * (count - index), 0) *
        10) %
        11) %
      10
    );
  };

  return rest(10) === cpfDigits[9] && rest(11) === cpfDigits[10];
};

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // Cidade
  uf: string;
  erro?: boolean;
}

export async function addressByCep(
  cep: string
): Promise<ViaCepResponse | null> {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();

    if (data.erro) {
      return null;
    }

    return data as ViaCepResponse;
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    throw new Error("Falha na conexão com serviço de CEP");
  }
}

export const formatDateToLocal = (date: Date | string | null): Date | null => {
  if (!date) return null;

  if (typeof date === "string") {
    const formattedDate = date.split("/").reverse().join("-");
    date = new Date(formattedDate);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return new Date(Number(year), Number(month) - 1, Number(day));
};

export const formatDate = (
  date: Date | string | null,
  returnString = false
): Date | string | null => {
  if (!date) return null;

  return returnString
    ? new Date(date).toLocaleDateString("pt-BR")
    : new Date(date);
};

const assetsMap = import.meta.glob("@/assets/*.{png,jpg,jpeg,svg,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export const getAssetUrl = (filename: string) => {
  const path = `/src/assets/${filename}`;

  return assetsMap[path];
};

export const extractCoordsFromUrl = (url: string) => {
  // Regex para capturar lat e long de links do Google Maps
  const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match = url.match(regex);
  if (match) {
    return { lat: match[1], lng: match[2] };
  }
  return null;
};

export const playBeep = () => {
  const audio = new Audio(beepSound);
  audio.volume = 0.5;
  audio.play().catch((e) => console.error("Erro ao reproduzir som:", e));
};

export const isBirthdayToday = (date: Date | string | null) => {
  if (!date) return false;

  const today = new Date();
  const birthDate = new Date(date);

  return (
    today.getMonth() === birthDate.getMonth() &&
    today.getDate() === birthDate.getDate()
  );
};

export const severityEvent = (type: number | string): string => {
  switch (Number(type)) {
    case 1:
      return 'success';
    case 2:
      return 'warn';
    case 3:
      return 'danger';
    case 4:
      return 'info';
    case 5:
      return 'helper';
    case 6:
      return 'primary';
    default:
      return 'secondary';
  }
};

export const getShortName = (name: string) => name && name.split(' ').slice(0, 2).join(' ') || 'Operador';
