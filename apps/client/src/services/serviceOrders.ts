import { isBackendApiEnabled, requestJson } from "./httpClient";

export const SERVICE_ORDERS_STORAGE_KEY = "prevent-auto-service-orders-v1";
export const SERVICE_ORDERS_UPDATED_EVENT = "prevent-auto-service-orders-updated";
const BACKEND_PAGE_SIZE = 100;

export type ServiceOrderPartStatus = "approved" | "declined";
export type ServiceOrderServiceStatus = "approved" | "declined";
export type ServiceOrderRecordStatus = "registered" | "sent_for_signature" | "signed";
export type ServiceOrderSignatureStatus = "pending" | "signed";
export type ServiceOrderPartCondition = "new" | "used";

export type ServiceOrderPart = {
  id: string;
  catalogItemId?: string;
  partCondition?: ServiceOrderPartCondition;
  description: string;
  quantity: number;
  unitPrice: number;
  status: ServiceOrderPartStatus;
};

export type ServiceOrderServiceItem = {
  id: string;
  catalogItemId?: string;
  description: string;
  amount: number;
  costPrice?: number;
  profitAmount?: number;
  status: ServiceOrderServiceStatus;
};

export type ServiceOrderRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ServiceOrderRecordStatus;
  orderInfo: {
    orderNumber: string;
    date: string;
    customerName: string;
    phone: string;
    vehicle: string;
    year: string;
    plate: string;
    km: string;
    mechanicResponsible: string;
    paymentMethod: string;
    notes: string;
  };
  checklist: Record<string, boolean>;
  parts: ServiceOrderPart[];
  laborServices: ServiceOrderServiceItem[];
  thirdPartyServices: ServiceOrderServiceItem[];
  discount: number;
  totals: {
    partsSubtotal: number;
    laborSubtotal: number;
    thirdPartySubtotal: number;
    grandTotal: number;
  };
  signature: {
    token: string;
    link: string;
    status: ServiceOrderSignatureStatus;
    signerName: string;
    signedAt: string;
  } | null;
};

export type CreateServiceOrderPayload = {
  status?: ServiceOrderRecordStatus;
  orderInfo: ServiceOrderRecord["orderInfo"];
  checklist: ServiceOrderRecord["checklist"];
  parts: ServiceOrderRecord["parts"];
  laborServices: ServiceOrderRecord["laborServices"];
  thirdPartyServices: ServiceOrderRecord["thirdPartyServices"];
  discount: number;
  totals: ServiceOrderRecord["totals"];
  signature?: ServiceOrderRecord["signature"];
};

export type UpdateServiceOrderPayload = Partial<CreateServiceOrderPayload>;

export type ShareServiceOrderResult = {
  serviceOrderId: string;
  token: string;
  link: string;
  status: ServiceOrderSignatureStatus;
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

const normalizePartStatus = (value: unknown): ServiceOrderPartStatus =>
  value === "declined" ? "declined" : "approved";

const normalizePartCondition = (value: unknown): ServiceOrderPartCondition =>
  value === "used" ? "used" : "new";

const normalizeServiceStatus = (value: unknown): ServiceOrderServiceStatus =>
  value === "declined" ? "declined" : "approved";

const normalizeRecordStatus = (value: unknown): ServiceOrderRecordStatus => {
  if (value === "sent_for_signature" || value === "signed") {
    return value;
  }

  return "registered";
};

const normalizeSignatureStatus = (value: unknown): ServiceOrderSignatureStatus =>
  value === "signed" ? "signed" : "pending";

const normalizePart = (value: unknown): ServiceOrderPart | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);
  if (!id) {
    return null;
  }

  return {
    id,
    catalogItemId: getString(value.catalogItemId).trim() || undefined,
    partCondition: normalizePartCondition(value.partCondition),
    description: getString(value.description).trim(),
    quantity: Math.max(0, Math.round(getNumber(value.quantity))),
    unitPrice: Math.max(0, getNumber(value.unitPrice)),
    status: normalizePartStatus(value.status),
  };
};

const normalizeServiceItem = (value: unknown): ServiceOrderServiceItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);
  if (!id) {
    return null;
  }

  return {
    id,
    catalogItemId: getString(value.catalogItemId).trim() || undefined,
    description: getString(value.description).trim(),
    amount: Math.max(0, getNumber(value.amount)),
    costPrice: Math.max(0, getNumber(value.costPrice)),
    profitAmount: Math.max(0, getNumber(value.profitAmount)),
    status: normalizeServiceStatus(value.status),
  };
};

const normalizeChecklist = (value: unknown): Record<string, boolean> => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, boolean>>((acc, [key, item]) => {
    acc[key] = Boolean(item);
    return acc;
  }, {});
};

const normalizeSignature = (
  value: unknown,
): ServiceOrderRecord["signature"] => {
  if (!isRecord(value)) {
    return null;
  }

  const token = getString(value.token).trim();
  const link = getString(value.link).trim();

  if (!token || !link) {
    return null;
  }

  return {
    token,
    link,
    status: normalizeSignatureStatus(value.status),
    signerName: getString(value.signerName).trim(),
    signedAt: getString(value.signedAt),
  };
};

const normalizeServiceOrder = (value: unknown): ServiceOrderRecord | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);
  if (!id) {
    return null;
  }

  const rawOrderInfo = isRecord(value.orderInfo) ? value.orderInfo : {};
  const rawTotals = isRecord(value.totals) ? value.totals : {};

  const createdAt = getString(value.createdAt);
  const updatedAt = getString(value.updatedAt);

  return {
    id,
    createdAt: isValidDateString(createdAt) ? createdAt : new Date().toISOString(),
    updatedAt: isValidDateString(updatedAt) ? updatedAt : new Date().toISOString(),
    status: normalizeRecordStatus(value.status),
    orderInfo: {
      orderNumber: getString(rawOrderInfo.orderNumber).trim(),
      date: getString(rawOrderInfo.date).trim(),
      customerName: getString(rawOrderInfo.customerName).trim(),
      phone: getString(rawOrderInfo.phone).trim(),
      vehicle: getString(rawOrderInfo.vehicle).trim(),
      year: getString(rawOrderInfo.year).trim(),
      plate: getString(rawOrderInfo.plate).trim(),
      km: getString(rawOrderInfo.km).trim(),
      mechanicResponsible: getString(rawOrderInfo.mechanicResponsible).trim(),
      paymentMethod: getString(rawOrderInfo.paymentMethod).trim(),
      notes: getString(rawOrderInfo.notes).trim(),
    },
    checklist: normalizeChecklist(value.checklist),
    parts: Array.isArray(value.parts)
      ? value.parts
          .map((item) => normalizePart(item))
          .filter((item): item is ServiceOrderPart => Boolean(item))
      : [],
    laborServices: Array.isArray(value.laborServices)
      ? value.laborServices
          .map((item) => normalizeServiceItem(item))
          .filter((item): item is ServiceOrderServiceItem => Boolean(item))
      : [],
    thirdPartyServices: Array.isArray(value.thirdPartyServices)
      ? value.thirdPartyServices
          .map((item) => normalizeServiceItem(item))
          .filter((item): item is ServiceOrderServiceItem => Boolean(item))
      : [],
    discount: Math.max(0, getNumber(value.discount)),
    totals: {
      partsSubtotal: Math.max(0, getNumber(rawTotals.partsSubtotal)),
      laborSubtotal: Math.max(0, getNumber(rawTotals.laborSubtotal)),
      thirdPartySubtotal: Math.max(0, getNumber(rawTotals.thirdPartySubtotal)),
      grandTotal: Math.max(0, getNumber(rawTotals.grandTotal)),
    },
    signature: normalizeSignature(value.signature),
  };
};

const normalizeServiceOrders = (value: unknown): ServiceOrderRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeServiceOrder(item))
    .filter((item): item is ServiceOrderRecord => Boolean(item))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
};

const normalizeShareServiceOrderResult = (
  value: unknown,
): ShareServiceOrderResult | null => {
  if (!isRecord(value)) {
    return null;
  }

  const serviceOrderId = getString(value.serviceOrderId).trim();
  const token = getString(value.token).trim();
  const link = getString(value.link).trim();

  if (!serviceOrderId || !token || !link) {
    return null;
  }

  return {
    serviceOrderId,
    token,
    link,
    status: normalizeSignatureStatus(value.status),
  };
};

const extractArrayData = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as Record<string, unknown>).content)
  ) {
    return (value as Record<string, unknown>).content as unknown[];
  }

  if (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as Record<string, unknown>).data)
  ) {
    return (value as Record<string, unknown>).data as unknown[];
  }

  return [];
};

const extractTotalPages = (value: unknown) => {
  if (!isRecord(value)) {
    return 1;
  }

  const totalPages = getNumber(value.totalPages);
  return totalPages > 0 ? totalPages : 1;
};

const extractRecordData = (value: unknown): unknown => {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.data === "object" && record.data !== null) {
    return record.data;
  }

  return value;
};

const dispatchServiceOrdersUpdated = (orders: ServiceOrderRecord[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SERVICE_ORDERS_UPDATED_EVENT, {
      detail: orders,
    }),
  );
};

const upsertServiceOrderCache = (order: ServiceOrderRecord) => {
  const current = readServiceOrders();
  const exists = current.some((item) => item.id === order.id);
  const next = exists
    ? current.map((item) => (item.id === order.id ? order : item))
    : [order, ...current];
  writeServiceOrders(next);
};

export const readServiceOrders = (): ServiceOrderRecord[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(SERVICE_ORDERS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return normalizeServiceOrders(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const writeServiceOrders = (
  orders: ServiceOrderRecord[],
): ServiceOrderRecord[] => {
  const normalized = normalizeServiceOrders(orders);

  if (typeof window === "undefined") {
    return normalized;
  }

  window.localStorage.setItem(SERVICE_ORDERS_STORAGE_KEY, JSON.stringify(normalized));
  dispatchServiceOrdersUpdated(normalized);

  return normalized;
};

export const createServiceOrder = (
  payload: CreateServiceOrderPayload,
): ServiceOrderRecord => {
  const now = new Date().toISOString();
  const order = normalizeServiceOrder({
    id: createId(),
    createdAt: now,
    updatedAt: now,
    status: payload.status ?? "registered",
    orderInfo: payload.orderInfo,
    checklist: payload.checklist,
    parts: payload.parts,
    laborServices: payload.laborServices,
    thirdPartyServices: payload.thirdPartyServices,
    discount: payload.discount,
    totals: payload.totals,
    signature: payload.signature ?? null,
  });

  if (!order) {
    throw new Error("Não foi possível montar a ordem de serviço.");
  }

  writeServiceOrders([order, ...readServiceOrders()]);
  return order;
};

export const updateServiceOrder = (
  id: string,
  payload: UpdateServiceOrderPayload,
): ServiceOrderRecord | null => {
  if (!id) {
    return null;
  }

  const current = readServiceOrders();
  let updated: ServiceOrderRecord | null = null;

  const next = current.map((order) => {
    if (order.id !== id) {
      return order;
    }

    const normalized = normalizeServiceOrder({
      ...order,
      ...payload,
      updatedAt: new Date().toISOString(),
      status: payload.status ?? order.status,
      orderInfo: payload.orderInfo ?? order.orderInfo,
      checklist: payload.checklist ?? order.checklist,
      parts: payload.parts ?? order.parts,
      laborServices: payload.laborServices ?? order.laborServices,
      thirdPartyServices: payload.thirdPartyServices ?? order.thirdPartyServices,
      discount: payload.discount ?? order.discount,
      totals: payload.totals ?? order.totals,
      signature: payload.signature === undefined ? order.signature : payload.signature,
    });

    if (!normalized) {
      return order;
    }

    updated = normalized;
    return normalized;
  });

  writeServiceOrders(next);
  return updated;
};

export const removeServiceOrder = (id: string): boolean => {
  if (!id) {
    return false;
  }

  const current = readServiceOrders();
  const next = current.filter((order) => order.id !== id);

  if (next.length === current.length) {
    return false;
  }

  writeServiceOrders(next);
  return true;
};

export const clearServiceOrders = () => {
  writeServiceOrders([]);
};

export const isServiceOrdersBackendEnabled = () => isBackendApiEnabled();

export const listServiceOrdersApi = async (): Promise<ServiceOrderRecord[]> => {
  if (!isServiceOrdersBackendEnabled()) {
    return readServiceOrders();
  }

  const allOrders: unknown[] = [];
  let page = 0;
  let totalPages = 1;

  do {
    const searchParams = new URLSearchParams({
      page: String(page),
      size: String(BACKEND_PAGE_SIZE),
      sort: "updatedAt,desc",
    });

    const response = await requestJson<unknown>(
      `service-orders?${searchParams.toString()}`,
      {
        method: "GET",
      },
    );

    allOrders.push(...extractArrayData(response));
    totalPages = extractTotalPages(response);
    page += 1;
  } while (page < totalPages);

  const normalized = normalizeServiceOrders(allOrders);
  writeServiceOrders(normalized);
  return normalized;
};

export const getServiceOrderApi = async (
  id: string,
): Promise<ServiceOrderRecord | null> => {
  if (!id) {
    return null;
  }

  const cached = readServiceOrders().find((item) => item.id === id);

  if (!isServiceOrdersBackendEnabled()) {
    return cached ?? null;
  }

  const response = await requestJson<unknown>(
    `service-orders/${encodeURIComponent(id)}`,
    {
      method: "GET",
    },
  );
  const normalized = normalizeServiceOrder(extractRecordData(response));

  if (normalized) {
    upsertServiceOrderCache(normalized);
    return normalized;
  }

  return cached ?? null;
};

export const createServiceOrderApi = async (
  payload: CreateServiceOrderPayload,
): Promise<ServiceOrderRecord> => {
  if (!isServiceOrdersBackendEnabled()) {
    return createServiceOrder(payload);
  }

  const response = await requestJson<unknown>("service-orders", {
    method: "POST",
    body: payload,
  });
  const normalized = normalizeServiceOrder(extractRecordData(response));

  if (!normalized) {
    throw new Error("Backend retornou ordem de serviço inválida após criação.");
  }

  upsertServiceOrderCache(normalized);
  return normalized;
};

export const updateServiceOrderApi = async (
  id: string,
  payload: UpdateServiceOrderPayload,
): Promise<ServiceOrderRecord | null> => {
  if (!id) {
    return null;
  }

  if (!isServiceOrdersBackendEnabled()) {
    return updateServiceOrder(id, payload);
  }

  const response = await requestJson<unknown>(`service-orders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
  const normalized = normalizeServiceOrder(extractRecordData(response));

  if (normalized) {
    upsertServiceOrderCache(normalized);
    return normalized;
  }

  const existing = readServiceOrders().find((item) => item.id === id);
  if (!existing) {
    return null;
  }

  const fallback = normalizeServiceOrder({
    ...existing,
    ...payload,
    updatedAt: new Date().toISOString(),
  });

  if (!fallback) {
    return null;
  }

  upsertServiceOrderCache(fallback);
  return fallback;
};

export const removeServiceOrderApi = async (id: string): Promise<boolean> => {
  if (!id) {
    return false;
  }

  if (!isServiceOrdersBackendEnabled()) {
    return removeServiceOrder(id);
  }

  await requestJson<unknown>(`service-orders/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  removeServiceOrder(id);
  return true;
};

export const shareServiceOrderApi = async (
  id: string,
): Promise<ShareServiceOrderResult> => {
  if (!id) {
    throw new Error("Informe a ordem de serviço para gerar o link de assinatura.");
  }

  if (!isServiceOrdersBackendEnabled()) {
    throw new Error("Compartilhamento real requer o backend habilitado.");
  }

  const response = await requestJson<unknown>(
    `service-orders/${encodeURIComponent(id)}/share`,
    {
      method: "POST",
    },
  );

  const normalized = normalizeShareServiceOrderResult(extractRecordData(response));
  if (!normalized) {
    throw new Error("Backend retornou um link de assinatura inválido.");
  }

  const existing = readServiceOrders().find((item) => item.id === id);
  if (existing) {
    upsertServiceOrderCache({
      ...existing,
      status: "sent_for_signature",
      updatedAt: new Date().toISOString(),
      signature: {
        token: normalized.token,
        link: normalized.link,
        status: normalized.status,
        signerName: existing.signature?.signerName ?? "",
        signedAt: existing.signature?.signedAt ?? "",
      },
    });
  }

  return normalized;
};

export const clearServiceOrdersApi = async (): Promise<void> => {
  if (!isServiceOrdersBackendEnabled()) {
    clearServiceOrders();
    return;
  }

  clearServiceOrders();
};
