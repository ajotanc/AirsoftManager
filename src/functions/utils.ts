import imageCompression from 'browser-image-compression';

import beepSound from "@/assets/sounds/beep.mp3";
import router from "@/router";

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

export const handleAddItem = (event: KeyboardEvent, field: any) => {
  const triggers = [',', ';', 'Enter'];

  if (triggers.includes(event.key) || event.code === 'Enter') {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLInputElement;
    const rawValue = target.value || '';
    const cleanValue = rawValue.trim().replace(/[吸引,;]$/, '');

    if (cleanValue) {
      const current = Array.isArray(field.value) ? [...field.value] : [];

      if (!current.includes(cleanValue)) {
        const newValue = [...current, cleanValue];

        field.onInput({
          value: newValue,
          originalEvent: event,
          target: { value: newValue }
        });
      }

      target.value = '';

      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
};

export const getShortName = (name: string) => {
  if (!name) return 'Operador';

  const parts = name.trim().split(/\s+/);

  if (parts.length <= 1) return parts[0];

  return `${parts[0]} ${parts[parts.length - 1]}`;
};

export const goToEvent = (id: string) => router.push(`/events/${id}?t=${Date.now()}`);