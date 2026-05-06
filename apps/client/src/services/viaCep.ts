export type ViaCepAddress = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

const normalizeCep = (value: string) => value.replace(/\D/g, "").slice(0, 8);

export const lookupViaCep = async (value: string): Promise<ViaCepAddress> => {
  const cep = normalizeCep(value);

  if (cep.length !== 8) {
    throw new Error("Informe um CEP com 8 digitos.");
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel consultar o CEP.");
  }

  const parsed = (await response.json()) as {
    cep?: string;
    logradouro?: string;
    complemento?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
    erro?: boolean;
  };

  if (parsed.erro) {
    throw new Error("CEP nao encontrado.");
  }

  return {
    cep: parsed.cep ?? cep,
    logradouro: parsed.logradouro ?? "",
    complemento: parsed.complemento ?? "",
    bairro: parsed.bairro ?? "",
    cidade: parsed.localidade ?? "",
    uf: parsed.uf ?? "",
  };
};
