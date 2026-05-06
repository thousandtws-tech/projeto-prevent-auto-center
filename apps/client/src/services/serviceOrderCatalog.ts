import { isBackendApiEnabled, requestJson } from "./httpClient";

export const SERVICE_ORDER_CATALOG_STORAGE_KEY =
  "prevent-auto-service-order-catalog-v1";
export const SERVICE_ORDER_CATALOG_UPDATED_EVENT =
  "prevent-auto-service-order-catalog-updated";

export type ServiceOrderCatalogType = "part" | "labor";
export type ServiceOrderCatalogStatus = "active" | "inactive";
export type ServiceOrderPartCondition = "new" | "used";

export type ServiceOrderCatalogItem = {
  id: string;
  type: ServiceOrderCatalogType;
  code: string;
  description: string;
  defaultPrice: number;
  costPrice: number;
  profitMarginPercent: number;
  stockQuantity: number;
  estimatedDurationMinutes?: number;
  partCondition?: ServiceOrderPartCondition;
  status: ServiceOrderCatalogStatus;
  createdAt: string;
  updatedAt: string;
};

export type UpsertServiceOrderCatalogItemPayload = {
  type: ServiceOrderCatalogType;
  code?: string;
  description: string;
  defaultPrice: number;
  costPrice?: number;
  profitMarginPercent?: number;
  stockQuantity?: number;
  estimatedDurationMinutes?: number;
  partCondition?: ServiceOrderPartCondition;
  status?: ServiceOrderCatalogStatus;
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

const getNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isValidDateString = (value: string) =>
  !Number.isNaN(new Date(value).getTime());

const normalizeType = (value: unknown): ServiceOrderCatalogType =>
  value === "labor" ? "labor" : "part";

const normalizeStatus = (value: unknown): ServiceOrderCatalogStatus =>
  value === "inactive" ? "inactive" : "active";

const normalizePartCondition = (
  value: unknown,
  type: ServiceOrderCatalogType,
): ServiceOrderPartCondition | undefined => {
  if (type !== "part") {
    return undefined;
  }

  return value === "used" ? "used" : "new";
};

const normalizeEstimatedDurationMinutes = (
  value: unknown,
  type: ServiceOrderCatalogType,
) => {
  if (type !== "labor") {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 60;
  }

  return Math.round(parsed);
};

const normalizeCatalogItem = (value: unknown): ServiceOrderCatalogItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id).trim();
  if (!id) {
    return null;
  }

  const createdAt = getString(value.createdAt);
  const updatedAt = getString(value.updatedAt);

  return {
    id,
    type: normalizeType(value.type),
    code: getString(value.code).trim(),
    description: getString(value.description).trim(),
    defaultPrice: Math.max(0, getNumber(value.defaultPrice)),
    costPrice:
      normalizeType(value.type) === "part" ? Math.max(0, getNumber(value.costPrice)) : 0,
    profitMarginPercent:
      normalizeType(value.type) === "part"
        ? Math.max(0, getNumber(value.profitMarginPercent))
        : 0,
    stockQuantity:
      normalizeType(value.type) === "part"
        ? Math.max(0, Math.round(getNumber(value.stockQuantity)))
        : 0,
    estimatedDurationMinutes: normalizeEstimatedDurationMinutes(
      value.estimatedDurationMinutes,
      normalizeType(value.type),
    ),
    partCondition: normalizePartCondition(value.partCondition, normalizeType(value.type)),
    status: normalizeStatus(value.status),
    createdAt: isValidDateString(createdAt) ? createdAt : new Date().toISOString(),
    updatedAt: isValidDateString(updatedAt) ? updatedAt : new Date().toISOString(),
  };
};

const normalizeCatalogItems = (value: unknown): ServiceOrderCatalogItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeCatalogItem(item))
    .filter((item): item is ServiceOrderCatalogItem => Boolean(item))
    .sort((a, b) => a.description.localeCompare(b.description, "pt-BR"));
};

const dispatchCatalogUpdated = (items: ServiceOrderCatalogItem[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SERVICE_ORDER_CATALOG_UPDATED_EVENT, {
      detail: items,
    }),
  );
};

export const readServiceOrderCatalogItems = (): ServiceOrderCatalogItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(SERVICE_ORDER_CATALOG_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return normalizeCatalogItems(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const writeServiceOrderCatalogItems = (
  items: ServiceOrderCatalogItem[],
): ServiceOrderCatalogItem[] => {
  const normalized = normalizeCatalogItems(items);

  if (typeof window === "undefined") {
    return normalized;
  }

  window.localStorage.setItem(
    SERVICE_ORDER_CATALOG_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  dispatchCatalogUpdated(normalized);

  return normalized;
};

const upsertCatalogItemCache = (item: ServiceOrderCatalogItem) => {
  const current = readServiceOrderCatalogItems();
  const exists = current.some((currentItem) => currentItem.id === item.id);
  const next = exists
    ? current.map((currentItem) => (currentItem.id === item.id ? item : currentItem))
    : [...current, item];
  writeServiceOrderCatalogItems(next);
};

const applyClientLaborFields = (
  item: ServiceOrderCatalogItem,
  payload?: Pick<UpsertServiceOrderCatalogItemPayload, "estimatedDurationMinutes"> | null,
  cached?: ServiceOrderCatalogItem | null,
): ServiceOrderCatalogItem => ({
  ...item,
  estimatedDurationMinutes:
    item.type === "labor"
      ? payload?.estimatedDurationMinutes ??
        cached?.estimatedDurationMinutes ??
        item.estimatedDurationMinutes ??
        60
      : undefined,
});

const applyClientPartFields = (
  item: ServiceOrderCatalogItem,
  payload?:
    | Pick<
        UpsertServiceOrderCatalogItemPayload,
        "costPrice" | "profitMarginPercent" | "stockQuantity"
      >
    | null,
  cached?: ServiceOrderCatalogItem | null,
): ServiceOrderCatalogItem => {
  if (item.type !== "part") {
    return {
      ...item,
      costPrice: 0,
      profitMarginPercent: 0,
      stockQuantity: 0,
    };
  }

  return {
    ...item,
    costPrice: payload?.costPrice ?? cached?.costPrice ?? item.costPrice ?? 0,
    profitMarginPercent:
      payload?.profitMarginPercent ??
      cached?.profitMarginPercent ??
      item.profitMarginPercent ??
      0,
    stockQuantity:
      payload?.stockQuantity ?? cached?.stockQuantity ?? item.stockQuantity ?? 0,
  };
};

const applyClientCatalogFields = (
  item: ServiceOrderCatalogItem,
  payload?: UpsertServiceOrderCatalogItemPayload | null,
  cached?: ServiceOrderCatalogItem | null,
) => applyClientPartFields(applyClientLaborFields(item, payload, cached), payload, cached);

const extractArrayData = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (isRecord(value) && Array.isArray(value.content)) {
    return value.content;
  }

  if (isRecord(value) && Array.isArray(value.data)) {
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

export const listServiceOrderCatalogItemsApi = async (
  type: ServiceOrderCatalogType,
): Promise<ServiceOrderCatalogItem[]> => {
  if (!isBackendApiEnabled()) {
    return readServiceOrderCatalogItems().filter((item) => item.type === type);
  }

  const cachedItems = readServiceOrderCatalogItems();
  const cachedById = new Map(cachedItems.map((item) => [item.id, item]));
  const searchParams = new URLSearchParams({ type });
  const response = await requestJson<unknown>(
    `service-order-catalog-items?${searchParams.toString()}`,
    {
      method: "GET",
    },
  );
  const normalized = normalizeCatalogItems(extractArrayData(response)).map((item) =>
    applyClientCatalogFields(item, null, cachedById.get(item.id) ?? null),
  );
  const others = readServiceOrderCatalogItems().filter((item) => item.type !== type);
  writeServiceOrderCatalogItems([...others, ...normalized]);
  return normalized;
};

export const createServiceOrderCatalogItemApi = async (
  payload: UpsertServiceOrderCatalogItemPayload,
): Promise<ServiceOrderCatalogItem> => {
  if (!isBackendApiEnabled()) {
    const now = new Date().toISOString();
    const item = normalizeCatalogItem({
      id: createId(),
      type: payload.type,
      code: payload.code ?? "",
      description: payload.description,
      defaultPrice: payload.defaultPrice,
      costPrice: payload.type === "part" ? payload.costPrice ?? 0 : 0,
      profitMarginPercent:
        payload.type === "part" ? payload.profitMarginPercent ?? 0 : 0,
      stockQuantity: payload.type === "part" ? payload.stockQuantity ?? 0 : 0,
      estimatedDurationMinutes: payload.estimatedDurationMinutes,
      partCondition:
        payload.type === "part"
          ? normalizePartCondition(payload.partCondition, payload.type)
          : undefined,
      status: payload.status ?? "active",
      createdAt: now,
      updatedAt: now,
    });

    if (!item) {
      throw new Error("Não foi possível montar o item de catálogo.");
    }

    const enriched = applyClientCatalogFields(item, payload, null);
    writeServiceOrderCatalogItems([...readServiceOrderCatalogItems(), enriched]);
    return enriched;
  }

  const response = await requestJson<unknown>("service-order-catalog-items", {
    method: "POST",
    body: payload,
  });
  const normalized = normalizeCatalogItem(extractRecordData(response));

  if (!normalized) {
    throw new Error("Backend retornou item de catálogo inválido após criação.");
  }

  const enriched = applyClientCatalogFields(normalized, payload, null);
  upsertCatalogItemCache(enriched);
  return enriched;
};

export const updateServiceOrderCatalogItemApi = async (
  id: string,
  payload: UpsertServiceOrderCatalogItemPayload,
): Promise<ServiceOrderCatalogItem | null> => {
  if (!id) {
    return null;
  }

  if (!isBackendApiEnabled()) {
    const current = readServiceOrderCatalogItems();
    let updated: ServiceOrderCatalogItem | null = null;

    const next = current.map((item) => {
      if (item.id !== id) {
        return item;
      }

      const normalized = normalizeCatalogItem({
        ...item,
        ...payload,
        updatedAt: new Date().toISOString(),
      });

      if (!normalized) {
        return item;
      }

      updated = normalized;
      return normalized;
    });

    writeServiceOrderCatalogItems(next);
    return updated;
  }

  const response = await requestJson<unknown>(
    `service-order-catalog-items/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
  const normalized = normalizeCatalogItem(extractRecordData(response));

  if (!normalized) {
    throw new Error("Backend retornou item de catálogo inválido após atualização.");
  }

  const current = readServiceOrderCatalogItems().find((item) => item.id === id) ?? null;
  const enriched = applyClientCatalogFields(normalized, payload, current);
  upsertCatalogItemCache(enriched);
  return enriched;
};

export const removeServiceOrderCatalogItemApi = async (
  id: string,
): Promise<boolean> => {
  if (!id) {
    return false;
  }

  if (!isBackendApiEnabled()) {
    const current = readServiceOrderCatalogItems();
    const next = current.filter((item) => item.id !== id);
    if (next.length === current.length) {
      return false;
    }

    writeServiceOrderCatalogItems(next);
    return true;
  }

  await requestJson<unknown>(`service-order-catalog-items/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  writeServiceOrderCatalogItems(
    readServiceOrderCatalogItems().filter((item) => item.id !== id),
  );
  return true;
};

export const listPartCatalogItemsApi = () => listServiceOrderCatalogItemsApi("part");

export const listLaborCatalogItemsApi = () => listServiceOrderCatalogItemsApi("labor");
