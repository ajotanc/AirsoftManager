import imageCompression from 'browser-image-compression';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import beepSound from "@/assets/sounds/beep.mp3";
import router from "@/router";
import { BUCKET_ID, storage } from '@/services/appwrite';
import { CATEGORIES_OPTIONS } from '@/constants/airsoft';

dayjs.extend(customParseFormat);

export interface IFields {
  name: string;
  label: string;
  component: any;
  col?: string;
  props?: any;
  isTag?: boolean;
  isRating?: boolean;
  isHtml?: boolean;
  hidden?: boolean;
  show?: boolean;
  icon?: string;
  iconColor?: string;
  button?: {
    label?: string;
    icon?: string;
    severity?: string;
    callback: (data: any) => void;
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

export const formatDate = (date: any): Date => {
  let parsed: Date;

  if (date instanceof Date) {
    parsed = date;
  }

  else if (typeof date === 'string' && date.trim().length > 0 && date.includes('/')) {
    const parts = date.split('/');

    if (parts.length === 3) {
      const day = parseInt(parts[0] ?? "1", 10);
      const month = parseInt(parts[1] ?? "1", 10) - 1;
      const year = parseInt(parts[2] ?? "1970", 10);

      parsed = new Date(year, month, day);
    } else {
      parsed = new Date(date);
    }
  }
  else {
    parsed = new Date(date);
  }

  return isNaN(parsed.getTime()) ? new Date() : parsed;
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

export const processImage = async (file: File) => {
  const options = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8
  };

  try {
    const compressedBlob = await imageCompression(file, options);

    const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    const finalFile = new File([compressedBlob], fileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    console.log(`Original: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`WebP Otimizado: ${(finalFile.size / 1024).toFixed(2)} KB`);

    return finalFile;
  } catch (error) {
    console.error("Erro na conversão para WebP:", error);
    return file;
  }
}

export const getShortName = (name: string) => {
  if (!name) return 'Operador';

  const parts = name.trim().split(/\s+/);

  if (parts.length <= 1) return parts[0];

  return `${parts[0]} ${parts[parts.length - 1]}`;
};

export const goToEvent = (id: string) => router.push(`/events/${id}?t=${Date.now()}`);

export const normalize = (str: string) =>
  str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const search = (query: string, sourceArray: string[]): string[] => {
  const queryNormalized = normalize(query);

  if (!queryNormalized) return [];

  const results = sourceArray.filter((item) => {
    const itemNormalized = normalize(item);
    return itemNormalized.includes(queryNormalized);
  });

  const hasExactMatch = results.some(item => normalize(item) === queryNormalized);

  if (query.trim() && !hasExactMatch) {
    return [query.trim(), ...results];
  }

  return results;
};

export const uploadFile = async (rowId: string, file: File, filename?: string): Promise<string> => {
  const fileId = `${filename || 'file'}-${rowId}`;
  const newFile = file.type.includes('image/') ? await processImage(file) : file;

  try {
    await storage.createFile({
      bucketId: BUCKET_ID,
      fileId,
      file: newFile,
    });

    const url = storage.getFileView({ bucketId: BUCKET_ID, fileId });
    return `${url.toString()}&v=${Date.now()}`;
  } catch (error) {
    console.error("Erro no upload da imagem:", error);
    throw new Error("Falha ao processar imagem da missão.");
  }
}

export const deleteFile = async (rowId: string, filename?: string): Promise<{}> => {
  const fileId = `${filename || 'file'}-${rowId}`;

  try {
    return await storage.deleteFile({ bucketId: BUCKET_ID, fileId });
  } catch (error) {
    console.error("Erro ao excluir da imagem:", error);
    throw new Error("Falha ao processar imagem da missão.");
  }
}

export const getSpecialtyLabel = (val?: number) => {
  return CATEGORIES_OPTIONS.find(a => a.value === val)?.label || 'Indisponível';
};

export const getAvailabilityLabel = (val?: string) => {
    const maps: any = { saturday: 'Sábados', sunday: 'Domingos', both: 'Fim de Semana', none: 'Indisponível' };
    return maps[val || 'none'];
};

export const dateToISOString = (date: Date | string) => dayjs(date, typeof date === 'string' ? 'DD/MM/YYYY' : undefined).toISOString()
export const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
