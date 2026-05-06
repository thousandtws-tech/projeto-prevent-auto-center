export const SERVICE_ORDER_CHECKLISTS_STORAGE_KEY =
  "prevent-auto-service-order-checklists-v1";
export const SERVICE_ORDER_CHECKLISTS_UPDATED_EVENT =
  "prevent-auto-service-order-checklists-updated";

export type ServiceOrderChecklistStatus = "active" | "inactive";

export type ServiceOrderChecklistItem = {
  id: string;
  label: string;
  status: ServiceOrderChecklistStatus;
  system: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type UpsertServiceOrderChecklistPayload = {
  label: string;
  status?: ServiceOrderChecklistStatus;
};

type DefaultChecklistSeed = {
  id: string;
  label: string;
  status: ServiceOrderChecklistStatus;
  system: boolean;
  sortOrder: number;
};

const DEFAULT_CHECKLISTS: ServiceOrderChecklistItem[] = (
  [
    {
      id: "oil",
      label: "Nível do óleo",
      status: "active",
      system: true,
      sortOrder: 10,
    },
    { id: "belts", label: "Correias", status: "active", system: true, sortOrder: 20 },
    {
      id: "cooling",
      label: "Arrefecimento",
      status: "active",
      system: true,
      sortOrder: 30,
    },
    { id: "brakes", label: "Freios", status: "active", system: true, sortOrder: 40 },
    {
      id: "leaks",
      label: "Vazamentos",
      status: "active",
      system: true,
      sortOrder: 50,
    },
    { id: "lights", label: "Luzes", status: "active", system: true, sortOrder: 60 },
    {
      id: "tires",
      label: "Pneus / calibragem",
      status: "active",
      system: true,
      sortOrder: 70,
    },
    {
      id: "suspension",
      label: "Suspensão",
      status: "active",
      system: true,
      sortOrder: 80,
    },
    { id: "others", label: "Outros", status: "active", system: true, sortOrder: 90 },
  ] as DefaultChecklistSeed[]
).map((item) => ({
  ...item,
  createdAt: "2026-03-17T00:00:00.000Z",
  updatedAt: "2026-03-17T00:00:00.000Z",
}));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getString = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
};

const isValidDateString = (value: string) =>
  !Number.isNaN(new Date(value).getTime());

const normalizeStatus = (value: unknown): ServiceOrderChecklistStatus =>
  value === "inactive" ? "inactive" : "active";

const normalizeChecklistItem = (
  value: unknown,
): ServiceOrderChecklistItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id).trim();
  const label = getString(value.label).trim();
  if (!id || !label) {
    return null;
  }

  const createdAt = getString(value.createdAt);
  const updatedAt = getString(value.updatedAt);
  const parsedSortOrder = Number(value.sortOrder);

  return {
    id,
    label,
    status: normalizeStatus(value.status),
    system: value.system === true,
    sortOrder: Number.isFinite(parsedSortOrder) ? parsedSortOrder : 0,
    createdAt: isValidDateString(createdAt) ? createdAt : new Date().toISOString(),
    updatedAt: isValidDateString(updatedAt) ? updatedAt : new Date().toISOString(),
  };
};

const sortChecklistItems = (items: ServiceOrderChecklistItem[]) =>
  [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.label.localeCompare(b.label, "pt-BR");
  });

const mergeWithDefaults = (
  items: ServiceOrderChecklistItem[],
): ServiceOrderChecklistItem[] => {
  const map = new Map(items.map((item) => [item.id, item]));

  DEFAULT_CHECKLISTS.forEach((defaultItem) => {
    const current = map.get(defaultItem.id);
    map.set(defaultItem.id, current ? { ...current, system: true } : defaultItem);
  });

  return sortChecklistItems(Array.from(map.values()));
};

const normalizeChecklistItems = (value: unknown): ServiceOrderChecklistItem[] => {
  const parsed = Array.isArray(value)
    ? value
        .map((item) => normalizeChecklistItem(item))
        .filter((item): item is ServiceOrderChecklistItem => Boolean(item))
    : [];

  const unique = new Map<string, ServiceOrderChecklistItem>();
  parsed.forEach((item) => {
    unique.set(item.id, item);
  });

  return mergeWithDefaults(Array.from(unique.values()));
};

const dispatchChecklistsUpdated = (items: ServiceOrderChecklistItem[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SERVICE_ORDER_CHECKLISTS_UPDATED_EVENT, {
      detail: items,
    }),
  );
};

export const readServiceOrderChecklists = (): ServiceOrderChecklistItem[] => {
  if (typeof window === "undefined") {
    return DEFAULT_CHECKLISTS;
  }

  const raw = window.localStorage.getItem(SERVICE_ORDER_CHECKLISTS_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_CHECKLISTS;
  }

  try {
    return normalizeChecklistItems(JSON.parse(raw));
  } catch {
    return DEFAULT_CHECKLISTS;
  }
};

export const writeServiceOrderChecklists = (
  items: ServiceOrderChecklistItem[],
): ServiceOrderChecklistItem[] => {
  const normalized = normalizeChecklistItems(items);

  if (typeof window === "undefined") {
    return normalized;
  }

  window.localStorage.setItem(
    SERVICE_ORDER_CHECKLISTS_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  dispatchChecklistsUpdated(normalized);

  return normalized;
};

export const listServiceOrderChecklists = (): ServiceOrderChecklistItem[] =>
  readServiceOrderChecklists();

export const createServiceOrderChecklist = (
  payload: UpsertServiceOrderChecklistPayload,
): ServiceOrderChecklistItem => {
  const current = readServiceOrderChecklists();
  const now = new Date().toISOString();
  const nextSortOrder =
    current.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 10;

  const item: ServiceOrderChecklistItem = {
    id: createId(),
    label: payload.label.trim(),
    status: payload.status ?? "active",
    system: false,
    sortOrder: nextSortOrder,
    createdAt: now,
    updatedAt: now,
  };

  writeServiceOrderChecklists([...current, item]);
  return item;
};

export const updateServiceOrderChecklist = (
  id: string,
  payload: UpsertServiceOrderChecklistPayload,
): ServiceOrderChecklistItem => {
  const current = readServiceOrderChecklists();
  const existing = current.find((item) => item.id === id);

  if (!existing) {
    throw new Error("Checklist não encontrado");
  }

  const updated: ServiceOrderChecklistItem = {
    ...existing,
    label: payload.label.trim(),
    status: payload.status ?? existing.status,
    updatedAt: new Date().toISOString(),
  };

  writeServiceOrderChecklists(
    current.map((item) => (item.id === id ? updated : item)),
  );

  return updated;
};

export const removeServiceOrderChecklist = (id: string) => {
  const current = readServiceOrderChecklists();
  const existing = current.find((item) => item.id === id);

  if (!existing) {
    throw new Error("Checklist não encontrado");
  }

  if (existing.system) {
    throw new Error("Itens padrão não podem ser removidos");
  }

  writeServiceOrderChecklists(current.filter((item) => item.id !== id));
};
