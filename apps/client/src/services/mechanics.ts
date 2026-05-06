import { isBackendApiEnabled, requestJson } from "./httpClient";

export const MECHANICS_STORAGE_KEY = "prevent-auto-mechanics-v1";
export const MECHANICS_UPDATED_EVENT = "prevent-auto-mechanics-updated";

const BACKEND_PAGE_SIZE = 100;
let mechanicsBackendSupported: boolean | null = null;
let mechanicsBackendSupportCheckedAt: number | null = null;
const BACKEND_SUPPORT_RECHECK_MS = 60_000;

export type MechanicStatus = "active" | "inactive";

export type Mechanic = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: MechanicStatus;
  name: string;
  phone: string;
  email: string;
};

export type UpsertMechanicPayload = {
  name: string;
  phone?: string;
  email?: string;
  status?: MechanicStatus;
};

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

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isValidDateString = (value: string) =>
  !Number.isNaN(new Date(value).getTime());

const normalizeStatus = (value: unknown): MechanicStatus =>
  value === "inactive" ? "inactive" : "active";

const normalizeMechanic = (value: unknown): Mechanic | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id).trim();
  const name = getString(value.name).trim();
  if (!id || !name) {
    return null;
  }

  const createdAt = getString(value.createdAt).trim();
  const updatedAt = getString(value.updatedAt).trim();

  return {
    id,
    createdAt: isValidDateString(createdAt) ? createdAt : new Date().toISOString(),
    updatedAt: isValidDateString(updatedAt) ? updatedAt : new Date().toISOString(),
    status: normalizeStatus(value.status),
    name,
    phone: getString(value.phone).trim(),
    email: getString(value.email).trim(),
  };
};

const readLocalMechanics = (): Mechanic[] => {
  try {
    const raw = localStorage.getItem(MECHANICS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeMechanic).filter(Boolean) as Mechanic[];
  } catch {
    return [];
  }
};

const persistLocalMechanics = (items: Mechanic[]) => {
  localStorage.setItem(MECHANICS_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(MECHANICS_UPDATED_EVENT));
};

export const readMechanics = () => readLocalMechanics();

export const createMechanic = (payload: UpsertMechanicPayload): Mechanic => {
  const now = new Date().toISOString();
  const mechanic: Mechanic = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    status: payload.status ?? "active",
    name: payload.name.trim(),
    phone: (payload.phone ?? "").trim(),
    email: (payload.email ?? "").trim(),
  };

  const items = readLocalMechanics();
  persistLocalMechanics([mechanic, ...items]);
  return mechanic;
};

export const updateMechanic = (id: string, payload: UpsertMechanicPayload) => {
  const items = readLocalMechanics();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new Error("Mecânico não encontrado");
  }

  const current = items[index];
  const next: Mechanic = {
    ...current,
    updatedAt: new Date().toISOString(),
    status: payload.status ?? current.status,
    name: payload.name.trim(),
    phone: (payload.phone ?? "").trim(),
    email: (payload.email ?? "").trim(),
  };

  const nextItems = [...items];
  nextItems[index] = next;
  persistLocalMechanics(nextItems);
  return next;
};

export const removeMechanic = (id: string) => {
  const items = readLocalMechanics();
  persistLocalMechanics(items.filter((item) => item.id !== id));
};

export const isMechanicsBackendEnabled = () => isBackendApiEnabled();

const isNotFoundError = (error: unknown) => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const record = error as Record<string, unknown>;
  return record.status === 404;
};

const shouldAttemptBackend = () => {
  if (!isBackendApiEnabled()) {
    return false;
  }

  if (mechanicsBackendSupported === false) {
    const now = Date.now();
    if (mechanicsBackendSupportCheckedAt && now - mechanicsBackendSupportCheckedAt < BACKEND_SUPPORT_RECHECK_MS) {
      return false;
    }
  }

  return true;
};

type BackendPageResponse = {
  content?: unknown;
};

const readBackendPageContent = (payload: unknown): Mechanic[] => {
  if (!isRecord(payload)) {
    return [];
  }

  const response = payload as BackendPageResponse;
  if (!Array.isArray(response.content)) {
    return [];
  }

  return response.content.map(normalizeMechanic).filter(Boolean) as Mechanic[];
};

export const listMechanicsApi = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
  status?: MechanicStatus | "all";
  name?: string;
  phone?: string;
}) => {
  const page = params?.page ?? 0;
  const size = params?.size ?? BACKEND_PAGE_SIZE;
  const sort = params?.sort ?? "createdAt,desc";

  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });

  if (params?.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params?.name) {
    searchParams.set("name", params.name);
  }
  if (params?.phone) {
    searchParams.set("phone", params.phone);
  }

  const response = await requestJson(`/mechanics?${searchParams.toString()}`, {
    method: "GET",
  });

  return readBackendPageContent(response);
};

export const listMechanics = async (params?: {
  page?: number;
  size?: number;
  sort?: string;
  status?: MechanicStatus | "all";
  name?: string;
  phone?: string;
}) => {
  if (!shouldAttemptBackend()) {
    return readMechanics();
  }

  try {
    const data = await listMechanicsApi(params);
    mechanicsBackendSupported = true;
    mechanicsBackendSupportCheckedAt = Date.now();
    return data;
  } catch (error) {
    if (isNotFoundError(error)) {
      mechanicsBackendSupported = false;
      mechanicsBackendSupportCheckedAt = Date.now();
      return readMechanics();
    }

    throw error;
  }
};

export const createMechanicApi = async (payload: UpsertMechanicPayload) => {
  const response = await requestJson("/mechanics", {
    method: "POST",
    body: {
      name: payload.name.trim(),
      phone: (payload.phone ?? "").trim() || null,
      email: (payload.email ?? "").trim() || null,
      status: payload.status ?? "active",
    },
  });

  const mechanic = normalizeMechanic(response);
  if (!mechanic) {
    throw new Error("Resposta inválida ao cadastrar mecânico");
  }
  return mechanic;
};

export const createMechanicAuto = async (payload: UpsertMechanicPayload) => {
  if (!shouldAttemptBackend()) {
    return createMechanic(payload);
  }

  try {
    const mechanic = await createMechanicApi(payload);
    mechanicsBackendSupported = true;
    mechanicsBackendSupportCheckedAt = Date.now();
    return mechanic;
  } catch (error) {
    if (isNotFoundError(error)) {
      mechanicsBackendSupported = false;
      mechanicsBackendSupportCheckedAt = Date.now();
      return createMechanic(payload);
    }

    throw error;
  }
};

export const updateMechanicApi = async (id: string, payload: UpsertMechanicPayload) => {
  const response = await requestJson(`/mechanics/${id}`, {
    method: "PATCH",
    body: {
      name: payload.name.trim(),
      phone: (payload.phone ?? "").trim() || null,
      email: (payload.email ?? "").trim() || null,
      status: payload.status ?? "active",
    },
  });

  const mechanic = normalizeMechanic(response);
  if (!mechanic) {
    throw new Error("Resposta inválida ao atualizar mecânico");
  }
  return mechanic;
};

export const updateMechanicAuto = async (id: string, payload: UpsertMechanicPayload) => {
  if (!shouldAttemptBackend()) {
    return updateMechanic(id, payload);
  }

  try {
    const mechanic = await updateMechanicApi(id, payload);
    mechanicsBackendSupported = true;
    mechanicsBackendSupportCheckedAt = Date.now();
    return mechanic;
  } catch (error) {
    if (isNotFoundError(error)) {
      mechanicsBackendSupported = false;
      mechanicsBackendSupportCheckedAt = Date.now();
      return updateMechanic(id, payload);
    }

    throw error;
  }
};

export const removeMechanicApi = async (id: string) => {
  await requestJson(`/mechanics/${id}`, {
    method: "DELETE",
  });
};

export const removeMechanicAuto = async (id: string) => {
  if (!shouldAttemptBackend()) {
    removeMechanic(id);
    return;
  }

  try {
    await removeMechanicApi(id);
    mechanicsBackendSupported = true;
    mechanicsBackendSupportCheckedAt = Date.now();
  } catch (error) {
    if (isNotFoundError(error)) {
      mechanicsBackendSupported = false;
      mechanicsBackendSupportCheckedAt = Date.now();
      removeMechanic(id);
      return;
    }

    throw error;
  }
};
