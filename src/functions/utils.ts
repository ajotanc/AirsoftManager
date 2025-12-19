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

export const formatDateToLocal = (date: Date) => {
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return new Date(Number(year), Number(month) - 1, Number(day));
};

const assetsMap = import.meta.glob('@/assets/*.{png,jpg,jpeg,svg,webp}', { eager: true, import: 'default' }) as Record<string, string>;

export const getAssetUrl = (filename: string) => {
  const path = `/src/assets/${filename}`

  return assetsMap[path]
}