import imageCompression from 'browser-image-compression';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { type FormResolverOptions } from '@primevue/forms';
import * as pdfjsLib from 'pdfjs-dist';
import { z } from "zod";

import { BUCKET_ID, storage } from '@/services/appwrite';
import { CATEGORIES_OPTIONS, MAINTENANCE_STATUS_TYPES, MAINTENANCE_TYPES } from '@/constants/airsoft';
import { useSettingsStore } from '@/stores/settings';
import router from '@/router';

dayjs.extend(customParseFormat);
pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.mjs';

export interface IFields {
  name: string;
  label: string;
  component: any;
  col?: string;
  width?: string;
  props?: any;
  isTag?: boolean;
  isRating?: boolean;
  isHtml?: boolean;
  hidden?: boolean;
  hiddenTable?: boolean;
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

export interface FormInstance {
  setFieldValue: (field: string, value: any) => void;
  reset: () => void;
  validate: () => Promise<any>;
  states: Record<string, any>;
  getValues: () => Record<string, any>;
}

export interface FieldChangePayload<T> {
  name: keyof T;
  value: any;
  form: FormInstance;
  data: T;
}

export type AppFormResolver = (e: FormResolverOptions) => Promise<Record<string, any>> | Record<string, any> | undefined;

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // Cidade
  uf: string;
  erro?: boolean;
}

export interface AdminAction {
  label?: string;
  icon: string;
  to?: string;
  command?: () => void;
}

export type StringRequired = string | null | undefined;

export function zRequired(message: string, minLength: number = 1) {
  return z.preprocess(
    (v: StringRequired) => (!v ? "" : v),
    z.string().min(minLength, message)
  );
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

export const playBeep = () => {
  const audio = new Audio("/sounds/beep.mp3");
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

export const isBirthdayTodayOrYesterday = (date: Date | string | null) => {
  if (!date) return false;

  const today = dayjs();
  const yesterday = dayjs().subtract(1, 'day');
  const birth = dayjs(date);

  const isToday = today.month() === birth.month() && today.date() === birth.date();
  const isYesterday = yesterday.month() === birth.month() && yesterday.date() === birth.date();

  return isToday || isYesterday;
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

export const goToEvent = (id: string) => router.push(`/events/${id}?t=${dayjs().unix()}`);

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

  const fileToUpload = await (async () => {
    if (file.type === 'application/pdf') {
      const fileConverted = await convertPdfToImage(file);
      return await processImage(fileConverted);
    }

    if (file.type.includes('image/')) {
      return await processImage(file);
    }

    return file;
  })();

  try {
    await storage.createFile({
      bucketId: BUCKET_ID,
      fileId,
      file: fileToUpload,
    });

    const url = storage.getFileView({ bucketId: BUCKET_ID, fileId });
    return `${url.toString()}&v=${Date.now()}`;
  } catch (error) {
    console.error("Erro no upload do arquivo:", error);
    throw new Error("Falha ao processar o arquivo para o servidor.");
  }
};

export const deleteFile = async (rowId: string, filename?: string): Promise<{}> => {
  const fileId = `${filename || 'file'}-${rowId}`;

  try {
    return await storage.deleteFile({ bucketId: BUCKET_ID, fileId });
  } catch (error) {
    console.error("Erro ao excluir da imagem:", error);
    throw new Error("Falha ao processar imagem da missão.");
  }
}

export const convertPdfToImage = async (file: File): Promise<File> => {
  const filename = file.name.replace(/\.[^/.]+$/, "");
  const type = 'image/png';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, verbosity: 0 }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });

  const canvas = document.createElement('canvas');
  const canvasContext = canvas.getContext('2d')!;
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  console.log(`Convertendo PDF para imagem...`);

  await page.render({ canvasContext, viewport, canvas }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], `${filename}.png`, { type }));
      } else {
        reject(new Error("Falha ao gerar blob do PDF"));
      }
    }, type);
  });
};

export const getSpecialtyLabel = (val?: number) => {
  return CATEGORIES_OPTIONS.find(a => a.value === val)?.label || 'Indisponível';
};

export const getAvailabilityLabel = (val?: string) => {
  const maps: any = { saturday: 'Sábados', sunday: 'Domingos', both: 'Fim de Semana', none: 'Indisponível' };
  return maps[val || 'none'];
};

export const getMaintenanceStatusLabel = (val?: string) => {
  return MAINTENANCE_STATUS_TYPES.find(a => a.value === val)?.label || 'Indisponível';
};

export const getMaintenanceTypeLabel = (val?: string) => {
  return MAINTENANCE_TYPES.find(a => a.value === val)?.label || 'Indisponível';
};

export const dateToISOString = (date: Date | string) => dayjs(date, typeof date === 'string' ? 'DD/MM/YYYY' : undefined).toISOString()
export const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

/**
 * Ordena um array de objetos por uma chave específica.
 * @param array - O array a ser ordenado.
 * @param key - A chave do objeto pela qual ordenar.
 * @param order - 'asc' para ascendente (padrão) ou 'desc' para descendente.
 */
export const sortByKey = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];

    // Trata valores nulos ou indefinidos
    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    let comparison = 0;

    if (typeof valA === 'string' && typeof valB === 'string') {
      // localeCompare é essencial para nomes com acentos (ex: Álvaro, Êxodo)
      comparison = valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' });
    } else {
      comparison = valA < valB ? -1 : 1;
    }

    return order === 'asc' ? comparison : -comparison;
  });
};

export const cleanHtml = (html: string) => {
  if (!html) return "";

  return html
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
};

export const limitWords = (text: string, limit: number) => {
  if (!text) return "";

  const cleanText = text.replace(/&quot;/g, '"').trim();
  const words = cleanText.split(/\s+/);

  if (words.length <= limit) return cleanText;

  return words.slice(0, limit)
    .join(" ")
    .replace(/[.,!?;:]+$/, "")
    .trim() + "...";
};
export const checkRegistrationPeriod = () => {
  const settings = useSettingsStore();

  if (!settings.registrationStartDate) return false;

  const now = dayjs();
  const startDate = dayjs(settings.registrationStartDate);
  const endDate = startDate.add(20, 'day');

  return now.isAfter(startDate) && now.isBefore(endDate) && settings.recruitmentIsOpen;
};

export const export2CSV = (filename: string, rows: any[], headers: string[], separator: string = ";") => {
  if (!rows || !rows.length) return;

  const csvContent = [
    headers.join(separator),
    ...rows.map(row =>
      Object.values(row)
        .map(value => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(separator)
    )
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const export2Excel = async (filename: string, data: any[], sheetName: string = 'Principal') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  const columns = Object.keys(data[0]).map(key => ({
    header: key,
    key,
  }));

  worksheet.columns = columns;
  worksheet.addRows(data);

  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell!({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 12 ? 12 : maxLength + 2;
  });

  const headerRow = worksheet.getRow(1);
  headerRow.font = { size: 12, bold: true };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  saveAs(blob, `${filename}.xlsx`);
};

export const toSentenceCase = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const toCapitalizedCase = (str: string): string => {
  if (!str) return "";
  return str.replace(/^\w/, (c) => c.toUpperCase());
};

export const toTitleCase = (str: string): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fisherYatesShuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    const temp = result[i] as T;
    result[i] = result[j] as T;
    result[j] = temp;
  }
  return result;
};