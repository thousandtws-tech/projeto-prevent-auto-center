import { isBackendApiEnabled, requestJson } from "./httpClient";
import {
  listServiceOrdersApi,
  type ServiceOrderPart,
  type ServiceOrderRecord,
  type ServiceOrderServiceItem,
} from "./serviceOrders";

export const SERVICE_ORDER_SIGNATURE_STORAGE_KEY =
  "prevent-auto-service-order-signatures-v1";
export const SERVICE_ORDER_SIGNATURES_UPDATED_EVENT =
  "prevent-auto-service-order-signatures-updated";

export type ServiceOrderEvidence = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
};

export type SharedServiceOrderPartStatus = "approved" | "declined";

export type SharedServiceOrderPart = {
  id: string;
  partCondition?: "new" | "used";
  description: string;
  quantity: number;
  unitPrice: number;
  status: SharedServiceOrderPartStatus;
};

export type SharedServiceOrderServiceStatus = "approved" | "declined";

export type SharedServiceOrderServiceItem = {
  id: string;
  description: string;
  amount: number;
  costPrice?: number;
  profitAmount?: number;
  status: SharedServiceOrderServiceStatus;
};

export type SharedServiceOrder = {
  token: string;
  createdAt: string;
  status: "pending" | "signed";
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
  parts: SharedServiceOrderPart[];
  laborServices: SharedServiceOrderServiceItem[];
  thirdPartyServices: SharedServiceOrderServiceItem[];
  discount: number;
  totals: {
    partsSubtotal: number;
    laborSubtotal: number;
    thirdPartySubtotal: number;
    grandTotal: number;
  };
  signature: {
    name: string;
    signedAt: string;
  } | null;
};

type MarkSharedServiceOrderAsSignedOptions = {
  parts?: SharedServiceOrderPart[];
  laborServices?: SharedServiceOrderServiceItem[];
  thirdPartyServices?: SharedServiceOrderServiceItem[];
  totals?: SharedServiceOrder["totals"];
};

const createToken = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

const isValidDateString = (value: string) =>
  !Number.isNaN(new Date(value).getTime());

const normalizePartStatus = (value: unknown): SharedServiceOrderPartStatus =>
  value === "declined" ? "declined" : "approved";

const normalizeServiceStatus = (
  value: unknown,
): SharedServiceOrderServiceStatus =>
  value === "declined" ? "declined" : "approved";

const normalizeOrderPart = (value: unknown): SharedServiceOrderPart | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id).trim();
  if (!id) {
    return null;
  }

  return {
    id,
    partCondition: value.partCondition === "used" ? "used" : "new",
    description: getString(value.description).trim(),
    quantity: Math.max(0, Math.round(getNumber(value.quantity))),
    unitPrice: Math.max(0, getNumber(value.unitPrice)),
    status: normalizePartStatus(value.status),
  };
};

const normalizeOrderServiceItem = (
  value: unknown,
): SharedServiceOrderServiceItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id).trim();
  if (!id) {
    return null;
  }

  return {
    id,
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

const normalizeTotals = (
  value: unknown,
  fallback?: SharedServiceOrder["totals"],
): SharedServiceOrder["totals"] => {
  const record = isRecord(value) ? value : {};

  return {
    partsSubtotal: Math.max(
      0,
      getNumber(
        record.partsSubtotal ??
          fallback?.partsSubtotal ??
          0,
      ),
    ),
    laborSubtotal: Math.max(
      0,
      getNumber(
        record.laborSubtotal ??
          fallback?.laborSubtotal ??
          0,
      ),
    ),
    thirdPartySubtotal: Math.max(
      0,
      getNumber(
        record.thirdPartySubtotal ??
          fallback?.thirdPartySubtotal ??
          0,
      ),
    ),
    grandTotal: Math.max(
      0,
      getNumber(
        record.grandTotal ??
          fallback?.grandTotal ??
          0,
      ),
    ),
  };
};

const normalizeSharedOrder = (value: unknown): SharedServiceOrder | null => {
  if (!isRecord(value)) {
    return null;
  }

  const token = getString(value.token).trim();
  if (!token) {
    return null;
  }

  const rawOrderInfo = isRecord(value.orderInfo) ? value.orderInfo : {};
  const orderNumber = getString(rawOrderInfo.orderNumber).trim();
  if (!orderNumber) {
    return null;
  }

  const rawSignature = isRecord(value.signature) ? value.signature : null;

  return {
    token,
    createdAt: isValidDateString(getString(value.createdAt))
      ? getString(value.createdAt)
      : new Date().toISOString(),
    status: value.status === "signed" ? "signed" : "pending",
    orderInfo: {
      orderNumber,
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
          .map((item) => normalizeOrderPart(item))
          .filter((item): item is SharedServiceOrderPart => Boolean(item))
      : [],
    laborServices: Array.isArray(value.laborServices)
      ? value.laborServices
          .map((item) => normalizeOrderServiceItem(item))
          .filter(
            (
              item,
            ): item is SharedServiceOrderServiceItem =>
              Boolean(item),
          )
      : [],
    thirdPartyServices: Array.isArray(value.thirdPartyServices)
      ? value.thirdPartyServices
          .map((item) => normalizeOrderServiceItem(item))
          .filter(
            (
              item,
            ): item is SharedServiceOrderServiceItem =>
              Boolean(item),
          )
      : [],
    discount: Math.max(0, getNumber(value.discount)),
    totals: normalizeTotals(value.totals),
    signature: rawSignature
      ? {
          name: getString(rawSignature.name).trim(),
          signedAt: getString(rawSignature.signedAt),
        }
      : null,
  };
};

const normalizeSharedOrders = (
  data: unknown,
): SharedServiceOrder[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => normalizeSharedOrder(item))
    .filter((item): item is SharedServiceOrder => Boolean(item))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
};

const dispatchSharedOrdersUpdate = (orders: SharedServiceOrder[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SERVICE_ORDER_SIGNATURES_UPDATED_EVENT, {
      detail: orders,
    }),
  );
};

export const readSharedServiceOrders = (): SharedServiceOrder[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(SERVICE_ORDER_SIGNATURE_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeSharedOrders(parsed);
  } catch {
    return [];
  }
};

export const writeSharedServiceOrders = (
  orders: SharedServiceOrder[],
): SharedServiceOrder[] => {
  const normalized = normalizeSharedOrders(orders);

  if (typeof window === "undefined") {
    return normalized;
  }

  window.localStorage.setItem(
    SERVICE_ORDER_SIGNATURE_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  dispatchSharedOrdersUpdate(normalized);

  return normalized;
};

const upsertSharedServiceOrderCache = (order: SharedServiceOrder) => {
  const current = readSharedServiceOrders();
  const exists = current.some((item) => item.token === order.token);
  const next = exists
    ? current.map((item) => (item.token === order.token ? order : item))
    : [order, ...current];

  writeSharedServiceOrders(next);
};

const toSharedStatus = (
  record: Pick<ServiceOrderRecord, "status" | "signature">,
): SharedServiceOrder["status"] =>
  record.signature?.status === "signed" || record.status === "signed"
    ? "signed"
    : "pending";

const toSharedServiceOrder = (
  record: ServiceOrderRecord,
): SharedServiceOrder | null => {
  if (!record.signature?.token) {
    return null;
  }

  return {
    token: record.signature.token,
    createdAt: record.createdAt,
    status: toSharedStatus(record),
    orderInfo: record.orderInfo,
    checklist: record.checklist,
    parts: record.parts,
    laborServices: record.laborServices,
    thirdPartyServices: record.thirdPartyServices,
    discount: record.discount,
    totals: record.totals,
    signature:
      record.signature.status === "signed" || record.status === "signed"
        ? {
            name: record.signature.signerName,
            signedAt: record.signature.signedAt,
          }
        : null,
  };
};

export const toSharedServiceOrdersFromRecords = (
  records: ServiceOrderRecord[],
): SharedServiceOrder[] =>
  records
    .map((record) => toSharedServiceOrder(record))
    .filter((item): item is SharedServiceOrder => Boolean(item))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

export const createSharedServiceOrder = (
  payload: Omit<
    SharedServiceOrder,
    "token" | "createdAt" | "status" | "signature"
  >,
): SharedServiceOrder => {
  const orders = readSharedServiceOrders();
  const nextOrder = normalizeSharedOrder({
    token: createToken(),
    createdAt: new Date().toISOString(),
    status: "pending",
    signature: null,
    ...payload,
  });

  if (!nextOrder) {
    throw new Error("Não foi possível criar a ordem para assinatura.");
  }

  writeSharedServiceOrders([nextOrder, ...orders]);
  return nextOrder;
};

export const listSharedServiceOrdersApi = async (): Promise<SharedServiceOrder[]> => {
  if (!isBackendApiEnabled()) {
    return readSharedServiceOrders();
  }

  const records = await listServiceOrdersApi();
  const normalized = toSharedServiceOrdersFromRecords(records);
  writeSharedServiceOrders(normalized);
  return normalized;
};

export const getSharedServiceOrderByToken = (
  token: string,
): SharedServiceOrder | null => {
  if (!token) {
    return null;
  }

  const orders = readSharedServiceOrders();
  return orders.find((item) => item.token === token) ?? null;
};

export const getSharedServiceOrderByTokenApi = async (
  token: string,
): Promise<SharedServiceOrder | null> => {
  if (!token) {
    return null;
  }

  if (!isBackendApiEnabled()) {
    return getSharedServiceOrderByToken(token);
  }

  const response = await requestJson<unknown>(
    `service-orders/shared/${encodeURIComponent(token)}`,
    {
      method: "GET",
      skipAuth: true,
      retryOnUnauthorized: false,
    },
  );

  const normalized = normalizeSharedOrder(response);
  if (normalized) {
    upsertSharedServiceOrderCache(normalized);
  }

  return normalized;
};

export const removeSharedServiceOrderByToken = (token: string): boolean => {
  if (!token) {
    return false;
  }

  const current = readSharedServiceOrders();
  const next = current.filter((item) => item.token !== token);

  if (next.length === current.length) {
    return false;
  }

  writeSharedServiceOrders(next);
  return true;
};

export const markSharedServiceOrderAsSigned = (
  token: string,
  signerName: string,
  options?: MarkSharedServiceOrderAsSignedOptions,
): SharedServiceOrder | null => {
  if (!token || !signerName.trim()) {
    return null;
  }

  const orders = readSharedServiceOrders();
  let updatedOrder: SharedServiceOrder | null = null;

  const next = orders.map((order) => {
    if (order.token !== token) {
      return order;
    }

    const nextParts = options?.parts ?? order.parts;
    const normalizedParts = nextParts
      .map((item) => normalizeOrderPart(item))
      .filter((item): item is SharedServiceOrderPart => Boolean(item));
    const nextLaborServices = options?.laborServices ?? order.laborServices;
    const normalizedLaborServices = nextLaborServices
      .map((item) => normalizeOrderServiceItem(item))
      .filter((item): item is SharedServiceOrderServiceItem => Boolean(item));
    const nextThirdPartyServices =
      options?.thirdPartyServices ?? order.thirdPartyServices;
    const normalizedThirdPartyServices = nextThirdPartyServices
      .map((item) => normalizeOrderServiceItem(item))
      .filter((item): item is SharedServiceOrderServiceItem => Boolean(item));

    updatedOrder = {
      ...order,
      status: "signed",
      parts: normalizedParts,
      laborServices: normalizedLaborServices,
      thirdPartyServices: normalizedThirdPartyServices,
      totals: normalizeTotals(options?.totals, order.totals),
      signature: {
        name: signerName.trim(),
        signedAt: new Date().toISOString(),
      },
    };

    return updatedOrder;
  });

  writeSharedServiceOrders(next);
  return updatedOrder;
};

type MarkSharedServiceOrderAsSignedApiOptions = {
  parts?: ServiceOrderPart[];
  laborServices?: ServiceOrderServiceItem[];
  thirdPartyServices?: ServiceOrderServiceItem[];
  totals?: SharedServiceOrder["totals"];
};

export const markSharedServiceOrderAsSignedApi = async (
  token: string,
  signerName: string,
  options?: MarkSharedServiceOrderAsSignedApiOptions,
): Promise<SharedServiceOrder | null> => {
  if (!token || !signerName.trim()) {
    return null;
  }

  if (!isBackendApiEnabled()) {
    return markSharedServiceOrderAsSigned(token, signerName, options);
  }

  const response = await requestJson<unknown>(
    `service-orders/shared/${encodeURIComponent(token)}/sign`,
    {
      method: "POST",
      skipAuth: true,
      retryOnUnauthorized: false,
      body: {
        signerName: signerName.trim(),
        parts: options?.parts,
        laborServices: options?.laborServices,
        thirdPartyServices: options?.thirdPartyServices,
        totals: options?.totals,
      },
    },
  );

  const normalized = normalizeSharedOrder(response);
  if (normalized) {
    upsertSharedServiceOrderCache(normalized);
  }

  return normalized;
};
