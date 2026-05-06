import type { DataProvider } from "@refinedev/core";
import dataProvider from "@refinedev/simple-rest";
import {
  createCustomerApi,
  type CreateCustomerPayload,
} from "../services/customers";

const API_URL = "https://api.finefoods.refine.dev";
const DEFAULT_DATA_PROVIDER = dataProvider(API_URL);

const getImportString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeImportCustomerStatus = (
  value: unknown,
): CreateCustomerPayload["status"] => {
  const normalized = getImportString(value).toLowerCase();

  if (
    normalized === "inactive" ||
    normalized === "inativo" ||
    normalized === "inativa" ||
    normalized === "false" ||
    normalized === "0"
  ) {
    return "inactive";
  }

  return "active";
};

const toImportCustomerPayload = (variables: unknown): CreateCustomerPayload => {
  const record =
    typeof variables === "object" && variables !== null
      ? (variables as Record<string, unknown>)
      : {};

  const payload: CreateCustomerPayload = {
    name: getImportString(record.name),
    phone: getImportString(record.phone),
    email: getImportString(record.email),
    document: getImportString(record.document),
    vehicleModel: getImportString(record.vehicleModel),
    vehiclePlate: getImportString(record.vehiclePlate),
    address: getImportString(record.address),
    cep: getImportString(record.cep),
    logradouro: getImportString(record.logradouro),
    numero: getImportString(record.numero),
    complemento: getImportString(record.complemento),
    bairro: getImportString(record.bairro),
    cidade: getImportString(record.cidade),
    uf: getImportString(record.uf),
    notes: getImportString(record.notes),
    status: normalizeImportCustomerStatus(record.status),
  };

  if (!payload.name) {
    throw new Error("Campo obrigatório ausente na planilha: name.");
  }

  if (!payload.phone) {
    throw new Error("Campo obrigatório ausente na planilha: phone.");
  }

  return payload;
};

const createImportCustomersDataProvider = (
  baseProvider: DataProvider,
): DataProvider => ({
  ...baseProvider,
  create: async (params) => {
    if (params.resource !== "customers") {
      return baseProvider.create(params);
    }

    const createdCustomer = await createCustomerApi(
      toImportCustomerPayload(params.variables),
    );

    return {
      data: createdCustomer,
    } as any;
  },
});

const importCustomersDataProvider = createImportCustomersDataProvider(
  DEFAULT_DATA_PROVIDER,
);

export const appDataProviders = {
  default: DEFAULT_DATA_PROVIDER,
  importCustomers: importCustomersDataProvider,
};
