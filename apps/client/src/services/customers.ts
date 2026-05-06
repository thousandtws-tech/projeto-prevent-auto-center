import { isBackendApiEnabled, requestJson } from "./httpClient";

export const CUSTOMERS_STORAGE_KEY = "prevent-auto-customers-v1";
export const CUSTOMERS_UPDATED_EVENT = "prevent-auto-customers-updated";

const BACKEND_PAGE_SIZE = 100;

export type CustomerStatus = "active" | "inactive";

export type Customer = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: CustomerStatus;
  name: string;
  phone: string;
  email: string;
  document: string;
  birthDate: string;
  vehicleModel: string;
  vehiclePlate: string;
  address: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  notes: string;
};

export type CreateCustomerPayload = {
  name: string;
  phone: string;
  email?: string;
  document?: string;
  birthDate?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  address?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  notes?: string;
  status?: CustomerStatus;
};

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
};

const getNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const normalizeCep = (value: string) => value.replace(/\D/g, "").slice(0, 8);

const normalizeState = (value: string) => value.trim().toUpperCase().slice(0, 2);

export const formatCustomerPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const formatCustomerDocument = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);

  if (digits.length <= 11) {
    if (digits.length <= 3) {
      return digits;
    }
    if (digits.length <= 6) {
      return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }
    if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const normalizeBirthDate = (value: unknown) => {
  const raw = getString(value).trim();
  if (!raw) {
    return "";
  }

  const parsed = raw.includes("T") ? new Date(raw) : new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatCep = (value: string) => {
  const digits = normalizeCep(value);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const buildFormattedAddress = (value: {
  address?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}) => {
  const cep = normalizeCep(value.cep ?? "");
  const logradouro = (value.logradouro ?? "").trim();
  const numero = (value.numero ?? "").trim();
  const complemento = (value.complemento ?? "").trim();
  const bairro = (value.bairro ?? "").trim();
  const cidade = (value.cidade ?? "").trim();
  const uf = normalizeState(value.uf ?? "");

  const parts = [
    [logradouro, numero].filter(Boolean).join(", "),
    complemento,
    bairro,
    [cidade, uf].filter(Boolean).join(" - "),
    cep ? formatCep(cep) : "",
  ].filter(Boolean);

  if (parts.length) {
    return parts.join(", ");
  }

  return (value.address ?? "").trim();
};

export const formatCustomerAddress = (customer: {
  address?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}) => buildFormattedAddress(customer);

const getRecordValue = (
  record: Record<string, unknown>,
  ...keys: string[]
) => {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isValidDateString = (value: string) =>
  !Number.isNaN(new Date(value).getTime());

const normalizeStatus = (value: unknown): CustomerStatus =>
  value === "inactive" ? "inactive" : "active";

const normalizeCustomer = (value: unknown): Customer | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(getRecordValue(value, "id")).trim();
  const name = getString(getRecordValue(value, "name", "nomeCompleto")).trim();

  if (!id || !name) {
    return null;
  }

  const createdAt = getString(getRecordValue(value, "createdAt")).trim();
  const updatedAt = getString(getRecordValue(value, "updatedAt")).trim();
  const cep = normalizeCep(getString(getRecordValue(value, "cep")).trim());
  const logradouro = getString(getRecordValue(value, "logradouro", "street")).trim();
  const numero = getString(getRecordValue(value, "numero", "number")).trim();
  const complemento = getString(getRecordValue(value, "complemento", "complement")).trim();
  const bairro = getString(getRecordValue(value, "bairro", "neighborhood")).trim();
  const cidade = getString(getRecordValue(value, "cidade", "city")).trim();
  const uf = normalizeState(getString(getRecordValue(value, "uf", "state")).trim());
  const address = buildFormattedAddress({
    address: getString(getRecordValue(value, "address", "endereco")).trim(),
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf,
  });

  return {
    id,
    createdAt: isValidDateString(createdAt) ? createdAt : new Date().toISOString(),
    updatedAt: isValidDateString(updatedAt) ? updatedAt : new Date().toISOString(),
    status: normalizeStatus(getRecordValue(value, "status")),
    name,
    phone: formatCustomerPhone(getString(getRecordValue(value, "phone", "telefone")).trim()),
    email: getString(getRecordValue(value, "email")).trim(),
    document: formatCustomerDocument(getString(getRecordValue(value, "document", "cpfCnpj")).trim()),
    birthDate: normalizeBirthDate(getRecordValue(value, "birthDate", "dataNascimento")),
    vehicleModel: getString(getRecordValue(value, "vehicleModel")).trim(),
    vehiclePlate: getString(getRecordValue(value, "vehiclePlate")).trim().toUpperCase(),
    address,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf,
    notes: getString(getRecordValue(value, "notes")).trim(),
  };
};

const applyClientVehicleFields = (
  customer: Customer,
  payload?: Pick<CreateCustomerPayload, "vehicleModel" | "vehiclePlate"> | null,
  cached?: Customer | null,
): Customer => ({
  ...customer,
  vehicleModel:
    payload?.vehicleModel?.trim() ||
    cached?.vehicleModel ||
    customer.vehicleModel,
  vehiclePlate:
    payload?.vehiclePlate?.trim().toUpperCase() ||
    cached?.vehiclePlate ||
    customer.vehiclePlate,
});

const normalizeCustomers = (value: unknown): Customer[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeCustomer(item))
    .filter((item): item is Customer => Boolean(item))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
};

const extractArrayData = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.content)) {
    return value.content;
  }

  if (Array.isArray(value.data)) {
    return value.data;
  }

  return [];
};

const extractRecordData = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value;
  }

  if (isRecord(value.data)) {
    return value.data;
  }

  return value;
};

const extractTotalPages = (value: unknown) => {
  if (!isRecord(value)) {
    return 1;
  }

  const totalPages = getNumber(value.totalPages);
  return totalPages > 0 ? totalPages : 1;
};

const toCustomerBackendPayload = (
  payload: UpdateCustomerPayload,
  current?: Customer | null,
) => {
  const name = payload.name?.trim() ?? current?.name ?? "";
  const phone = formatCustomerPhone(payload.phone?.trim() ?? current?.phone ?? "");
  const email = payload.email?.trim() ?? current?.email ?? "";
  const document = formatCustomerDocument(payload.document?.trim() ?? current?.document ?? "");
  const birthDate = normalizeBirthDate(payload.birthDate ?? current?.birthDate ?? "");
  const cep = normalizeCep(payload.cep ?? current?.cep ?? "");
  const logradouro = payload.logradouro?.trim() ?? current?.logradouro ?? "";
  const numero = payload.numero?.trim() ?? current?.numero ?? "";
  const complemento = payload.complemento?.trim() ?? current?.complemento ?? "";
  const bairro = payload.bairro?.trim() ?? current?.bairro ?? "";
  const cidade = payload.cidade?.trim() ?? current?.cidade ?? "";
  const uf = normalizeState(payload.uf ?? current?.uf ?? "");
  const address = buildFormattedAddress({
    address: payload.address?.trim() ?? current?.address ?? "",
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf,
  });

  if (!name) {
    throw new Error("Informe o nome completo do cliente.");
  }

  if (!phone) {
    throw new Error("Informe o telefone do cliente.");
  }

  if (!document) {
    throw new Error("Informe o CPF/CNPJ do cliente.");
  }

  if (!email) {
    throw new Error("Informe o e-mail do cliente.");
  }

  if (!address) {
    throw new Error("Informe o endereço do cliente.");
  }

  return {
    nomeCompleto: name,
    telefone: phone,
    cpfCnpj: document,
    dataNascimento: birthDate || null,
    email,
    endereco: address,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf,
  };
};

const upsertCustomerCache = (customer: Customer) => {
  const current = readCustomers();
  const exists = current.some((item) => item.id === customer.id);
  const next = exists
    ? current.map((item) => (item.id === customer.id ? customer : item))
    : [customer, ...current];
  writeCustomers(next);
};

const dispatchCustomersUpdated = (customers: Customer[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CUSTOMERS_UPDATED_EVENT, {
      detail: customers,
    }),
  );
};

const loadCustomerFromBackend = async (id: string) => {
  const response = await requestJson<unknown>(`customers/${encodeURIComponent(id)}`, {
    method: "GET",
  });

  return normalizeCustomer(extractRecordData(response));
};

export const readCustomers = (): Customer[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(CUSTOMERS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return normalizeCustomers(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const writeCustomers = (customers: Customer[]): Customer[] => {
  const normalized = normalizeCustomers(customers);

  if (typeof window === "undefined") {
    return normalized;
  }

  window.localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(normalized));
  dispatchCustomersUpdated(normalized);

  return normalized;
};

export const createCustomer = (payload: CreateCustomerPayload): Customer => {
  const now = new Date().toISOString();
  const cep = normalizeCep(payload.cep ?? "");
  const logradouro = payload.logradouro?.trim() ?? "";
  const numero = payload.numero?.trim() ?? "";
  const complemento = payload.complemento?.trim() ?? "";
  const bairro = payload.bairro?.trim() ?? "";
  const cidade = payload.cidade?.trim() ?? "";
  const uf = normalizeState(payload.uf ?? "");
  const customer: Customer = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    status: payload.status === "inactive" ? "inactive" : "active",
    name: payload.name.trim(),
    phone: formatCustomerPhone(payload.phone.trim()),
    email: payload.email?.trim() ?? "",
    document: formatCustomerDocument(payload.document?.trim() ?? ""),
    birthDate: normalizeBirthDate(payload.birthDate ?? ""),
    vehicleModel: payload.vehicleModel?.trim() ?? "",
    vehiclePlate: payload.vehiclePlate?.trim().toUpperCase() ?? "",
    address: buildFormattedAddress({
      address: payload.address?.trim() ?? "",
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
    }),
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf,
    notes: payload.notes?.trim() ?? "",
  };

  writeCustomers([customer, ...readCustomers()]);
  return customer;
};

export const updateCustomer = (
  id: string,
  payload: UpdateCustomerPayload,
): Customer | null => {
  if (!id) {
    return null;
  }

  const customers = readCustomers();
  let updated: Customer | null = null;

  const next = customers.map((customer) => {
    if (customer.id !== id) {
      return customer;
    }

    updated = {
      ...customer,
      ...payload,
      status: payload.status ? normalizeStatus(payload.status) : customer.status,
      name: payload.name?.trim() ?? customer.name,
      phone: formatCustomerPhone(payload.phone?.trim() ?? customer.phone),
      email: payload.email?.trim() ?? customer.email,
      document: formatCustomerDocument(payload.document?.trim() ?? customer.document),
      birthDate: normalizeBirthDate(payload.birthDate ?? customer.birthDate),
      vehicleModel: payload.vehicleModel?.trim() ?? customer.vehicleModel,
      vehiclePlate: payload.vehiclePlate?.trim().toUpperCase() ?? customer.vehiclePlate,
      address: buildFormattedAddress({
        address: payload.address?.trim() ?? customer.address,
        cep: payload.cep ?? customer.cep,
        logradouro: payload.logradouro ?? customer.logradouro,
        numero: payload.numero ?? customer.numero,
        complemento: payload.complemento ?? customer.complemento,
        bairro: payload.bairro ?? customer.bairro,
        cidade: payload.cidade ?? customer.cidade,
        uf: payload.uf ?? customer.uf,
      }),
      cep: normalizeCep(payload.cep ?? customer.cep),
      logradouro: payload.logradouro?.trim() ?? customer.logradouro,
      numero: payload.numero?.trim() ?? customer.numero,
      complemento: payload.complemento?.trim() ?? customer.complemento,
      bairro: payload.bairro?.trim() ?? customer.bairro,
      cidade: payload.cidade?.trim() ?? customer.cidade,
      uf: normalizeState(payload.uf ?? customer.uf),
      notes: payload.notes?.trim() ?? customer.notes,
      updatedAt: new Date().toISOString(),
    };

    return updated;
  });

  writeCustomers(next);
  return updated;
};

export const removeCustomer = (id: string): boolean => {
  if (!id) {
    return false;
  }

  const current = readCustomers();
  const next = current.filter((customer) => customer.id !== id);

  if (next.length === current.length) {
    return false;
  }

  writeCustomers(next);
  return true;
};

export const getCustomerById = (id: string): Customer | null => {
  if (!id) {
    return null;
  }

  return readCustomers().find((customer) => customer.id === id) ?? null;
};

export const isCustomersBackendEnabled = () => isBackendApiEnabled();

export const listCustomersApi = async (): Promise<Customer[]> => {
  if (!isCustomersBackendEnabled()) {
    return readCustomers();
  }

  const cachedCustomers = readCustomers();
  const cachedById = new Map(cachedCustomers.map((customer) => [customer.id, customer]));
  const allCustomers: unknown[] = [];
  let page = 0;
  let totalPages = 1;

  do {
    const searchParams = new URLSearchParams({
      page: String(page),
      size: String(BACKEND_PAGE_SIZE),
      sort: "createdAt,desc",
    });

    const response = await requestJson<unknown>(`customers?${searchParams.toString()}`, {
      method: "GET",
    });

    allCustomers.push(...extractArrayData(response));
    totalPages = extractTotalPages(response);
    page += 1;
  } while (page < totalPages);

  const normalized = normalizeCustomers(allCustomers).map((customer) =>
    applyClientVehicleFields(customer, null, cachedById.get(customer.id) ?? null),
  );
  writeCustomers(normalized);
  return normalized;
};

export const listActiveCustomersApi = async (): Promise<Customer[]> => {
  const customers = await listCustomersApi();
  return customers.filter((customer) => customer.status === "active");
};

export const createCustomerApi = async (
  payload: CreateCustomerPayload,
): Promise<Customer> => {
  if (!isCustomersBackendEnabled()) {
    return createCustomer(payload);
  }

  const response = await requestJson<unknown>("customers", {
    method: "POST",
    body: toCustomerBackendPayload(payload),
  });
  const normalized = normalizeCustomer(extractRecordData(response));

  if (!normalized) {
    throw new Error("Backend retornou cliente inválido após criação.");
  }

  const enriched = applyClientVehicleFields(normalized, payload, null);
  upsertCustomerCache(enriched);
  return enriched;
};

export const updateCustomerApi = async (
  id: string,
  payload: UpdateCustomerPayload,
): Promise<Customer | null> => {
  if (!id) {
    return null;
  }

  if (!isCustomersBackendEnabled()) {
    return updateCustomer(id, payload);
  }

  const current = getCustomerById(id) ?? (await loadCustomerFromBackend(id));

  if (!current) {
    return null;
  }

  const response = await requestJson<unknown>(`customers/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: toCustomerBackendPayload(payload, current),
  });
  const normalized = normalizeCustomer(extractRecordData(response));

  if (normalized) {
    const enriched = applyClientVehicleFields(normalized, payload, current);
    upsertCustomerCache(enriched);
    return enriched;
  }

  const fallback = normalizeCustomer({
    ...current,
    ...payload,
    updatedAt: new Date().toISOString(),
  });

  if (!fallback) {
    return null;
  }

  const enrichedFallback = applyClientVehicleFields(fallback, payload, current);
  upsertCustomerCache(enrichedFallback);
  return enrichedFallback;
};

export const removeCustomerApi = async (id: string): Promise<boolean> => {
  if (!id) {
    return false;
  }

  if (!isCustomersBackendEnabled()) {
    return removeCustomer(id);
  }

  await requestJson<unknown>(`customers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  removeCustomer(id);
  return true;
};
