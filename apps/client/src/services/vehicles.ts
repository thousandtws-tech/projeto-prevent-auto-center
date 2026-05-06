import { isBackendApiEnabled, requestJson } from "./httpClient";

export const VEHICLES_STORAGE_KEY = "prevent-auto-vehicles-v1";
export const VEHICLES_UPDATED_EVENT = "prevent-auto-vehicles-updated";

const BACKEND_PAGE_SIZE = 100;

export type VehicleStatus = "active" | "inactive";

export type Vehicle = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: VehicleStatus;
  vehicleModel: string;
  vehicleBrand: string;
  vehiclePlate: string;
  vehicleChassisNumber: string;
  vehicleMileage: number;
  vehicleYear: number;
  vehicleColor: string;
  notes: string;
};

export type CreateVehiclePayload = {
  vehicleModel: string;
  vehicleBrand: string;
  vehiclePlate?: string;
  vehicleChassisNumber?: string;
  vehicleMileage?: number;
  vehicleYear?: number;
  vehicleColor?: string;
  notes?: string;
  status?: VehicleStatus;
};

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;

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

const normalizeStatus = (value: unknown): VehicleStatus =>
  value === "inactive" ? "inactive" : "active";

const normalizeVehicle = (value: unknown): Vehicle | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(getRecordValue(value, "id")).trim();
  const vehicleModel = getString(
    getRecordValue(value, "vehicleModel", "model", "modelo"),
  ).trim();

  if (!id || !vehicleModel) {
    return null;
  }

  const createdAt = getString(getRecordValue(value, "createdAt")).trim();
  const updatedAt = getString(getRecordValue(value, "updatedAt")).trim();
  const vehicleMileage = Math.max(
    0,
    getNumber(getRecordValue(value, "vehicleMileage", "mileage")),
  );
  const vehicleYear = Math.max(
    0,
    getNumber(getRecordValue(value, "vehicleYear", "year")),
  );

  return {
    id,
    createdAt: isValidDateString(createdAt) ? createdAt : new Date().toISOString(),
    updatedAt: isValidDateString(updatedAt) ? updatedAt : new Date().toISOString(),
    status: normalizeStatus(getRecordValue(value, "status")),
    vehicleModel,
    vehicleBrand: getString(
      getRecordValue(value, "vehicleBrand", "brand"),
    ).trim(),
    vehiclePlate: getString(
      getRecordValue(value, "vehiclePlate", "plate"),
    ).trim().toUpperCase(),
    vehicleChassisNumber: getString(
      getRecordValue(value, "vehicleChassisNumber", "chassisNumber", "chassiNumber"),
    ).trim(),
    vehicleMileage: Number.isFinite(vehicleMileage) ? vehicleMileage : 0,
    vehicleYear: Number.isFinite(vehicleYear) ? vehicleYear : 0,
    vehicleColor: getString(
      getRecordValue(value, "vehicleColor", "color"),
    ).trim(),
    notes: getString(getRecordValue(value, "notes")).trim(),
  };
};

const normalizeVehicles = (value: unknown): Vehicle[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeVehicle(item))
    .filter((item): item is Vehicle => Boolean(item))
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

const toVehicleBackendPayload = (
  payload: UpdateVehiclePayload,
  current?: Vehicle | null,
) => {
  const vehicleModel = payload.vehicleModel?.trim() ?? current?.vehicleModel ?? "";
  const vehicleBrand = payload.vehicleBrand?.trim() ?? current?.vehicleBrand ?? "";
  const vehiclePlate =
    payload.vehiclePlate?.trim().toUpperCase() ?? current?.vehiclePlate ?? "";
  const vehicleChassisNumber =
    payload.vehicleChassisNumber?.trim() ?? current?.vehicleChassisNumber ?? "";
  const vehicleMileage =
    payload.vehicleMileage === undefined
      ? current?.vehicleMileage ?? 0
      : Math.max(0, payload.vehicleMileage || 0);
  const vehicleYear =
    payload.vehicleYear === undefined
      ? current?.vehicleYear ?? 0
      : Math.max(0, payload.vehicleYear || 0);
  const vehicleColor = payload.vehicleColor?.trim() ?? current?.vehicleColor ?? "";

  if (!vehicleModel) {
    throw new Error("Informe o modelo do veículo.");
  }

  if (!vehicleBrand) {
    throw new Error("Informe a marca do veículo.");
  }

  if (!vehiclePlate) {
    throw new Error("Informe a placa do veículo.");
  }

  if (!vehicleChassisNumber) {
    throw new Error("Informe o chassi do veículo.");
  }

  if (!vehicleMileage && vehicleMileage !== 0) {
    throw new Error("Informe a quilometragem do veículo.");
  }

  if (vehicleYear < 1900) {
    throw new Error("Informe um ano de fabricação válido.");
  }

  return {
    model: vehicleModel,
    brand: vehicleBrand,
    plate: vehiclePlate,
    chassisNumber: vehicleChassisNumber,
    mileage: vehicleMileage,
    year: vehicleYear,
    color: vehicleColor || undefined,
  };
};

const upsertVehicleCache = (vehicle: Vehicle) => {
  const current = readVehicles();
  const exists = current.some((item) => item.id === vehicle.id);
  const next = exists
    ? current.map((item) => (item.id === vehicle.id ? vehicle : item))
    : [vehicle, ...current];
  writeVehicles(next);
};

const dispatchVehiclesUpdated = (vehicles: Vehicle[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(VEHICLES_UPDATED_EVENT, {
      detail: vehicles,
    }),
  );
};

const loadVehicleFromBackend = async (id: string) => {
  const response = await requestJson<unknown>(`vehicles/${encodeURIComponent(id)}`, {
    method: "GET",
  });

  return normalizeVehicle(extractRecordData(response));
};

export const readVehicles = (): Vehicle[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(VEHICLES_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return normalizeVehicles(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const writeVehicles = (vehicles: Vehicle[]): Vehicle[] => {
  const normalized = normalizeVehicles(vehicles);

  if (typeof window === "undefined") {
    return normalized;
  }

  window.localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(normalized));
  dispatchVehiclesUpdated(normalized);

  return normalized;
};

export const createVehicle = (payload: CreateVehiclePayload): Vehicle => {
  const now = new Date().toISOString();
  const vehicle: Vehicle = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    status: payload.status === "inactive" ? "inactive" : "active",
    vehicleModel: payload.vehicleModel.trim(),
    vehicleBrand: payload.vehicleBrand.trim(),
    vehiclePlate: payload.vehiclePlate?.trim().toUpperCase() ?? "",
    vehicleChassisNumber: payload.vehicleChassisNumber?.trim() ?? "",
    vehicleMileage: Math.max(0, payload.vehicleMileage ?? 0),
    vehicleYear: Math.max(0, payload.vehicleYear ?? 0),
    vehicleColor: payload.vehicleColor?.trim() ?? "",
    notes: payload.notes?.trim() ?? "",
  };

  writeVehicles([vehicle, ...readVehicles()]);
  return vehicle;
};

export const updateVehicle = (
  id: string,
  payload: UpdateVehiclePayload,
): Vehicle | null => {
  if (!id) {
    return null;
  }

  const vehicles = readVehicles();
  let updated: Vehicle | null = null;

  const next = vehicles.map((vehicle) => {
    if (vehicle.id !== id) {
      return vehicle;
    }

    const nextMileage =
      payload.vehicleMileage === undefined
        ? vehicle.vehicleMileage
        : Math.max(0, payload.vehicleMileage || 0);
    const nextYear =
      payload.vehicleYear === undefined
        ? vehicle.vehicleYear
        : Math.max(0, payload.vehicleYear || 0);

    updated = {
      ...vehicle,
      ...payload,
      status: payload.status ? normalizeStatus(payload.status) : vehicle.status,
      vehicleModel: payload.vehicleModel?.trim() ?? vehicle.vehicleModel,
      vehicleBrand: payload.vehicleBrand?.trim() ?? vehicle.vehicleBrand,
      vehiclePlate:
        payload.vehiclePlate?.trim().toUpperCase() ?? vehicle.vehiclePlate,
      vehicleChassisNumber:
        payload.vehicleChassisNumber?.trim() ?? vehicle.vehicleChassisNumber,
      vehicleMileage: Number.isFinite(nextMileage) ? nextMileage : 0,
      vehicleYear: Number.isFinite(nextYear) ? nextYear : 0,
      vehicleColor: payload.vehicleColor?.trim() ?? vehicle.vehicleColor,
      notes: payload.notes?.trim() ?? vehicle.notes,
      updatedAt: new Date().toISOString(),
    };

    return updated;
  });

  writeVehicles(next);
  return updated;
};

export const removeVehicle = (id: string): boolean => {
  if (!id) {
    return false;
  }

  const current = readVehicles();
  const next = current.filter((vehicle) => vehicle.id !== id);

  if (next.length === current.length) {
    return false;
  }

  writeVehicles(next);
  return true;
};

export const getVehicleById = (id: string): Vehicle | null => {
  if (!id) {
    return null;
  }

  return readVehicles().find((vehicle) => vehicle.id === id) ?? null;
};

export const isVehiclesBackendEnabled = () => isBackendApiEnabled();

export const listVehiclesApi = async (): Promise<Vehicle[]> => {
  if (!isVehiclesBackendEnabled()) {
    return readVehicles();
  }

  const allVehicles: unknown[] = [];
  let page = 0;
  let totalPages = 1;

  do {
    const searchParams = new URLSearchParams({
      page: String(page),
      size: String(BACKEND_PAGE_SIZE),
      sort: "id,desc",
    });

    const response = await requestJson<unknown>(`vehicles?${searchParams.toString()}`, {
      method: "GET",
    });

    allVehicles.push(...extractArrayData(response));
    totalPages = extractTotalPages(response);
    page += 1;
  } while (page < totalPages);

  const normalized = normalizeVehicles(allVehicles);
  writeVehicles(normalized);
  return normalized;
};

export const listActiveVehiclesApi = async (): Promise<Vehicle[]> => {
  const vehicles = await listVehiclesApi();
  return vehicles.filter((vehicle) => vehicle.status === "active");
};

export const createVehicleApi = async (
  payload: CreateVehiclePayload,
): Promise<Vehicle> => {
  if (!isVehiclesBackendEnabled()) {
    return createVehicle(payload);
  }

  const response = await requestJson<unknown>("vehicles", {
    method: "POST",
    body: toVehicleBackendPayload(payload),
  });
  const normalized = normalizeVehicle(extractRecordData(response));

  if (!normalized) {
    throw new Error("Backend retornou veículo inválido após criação.");
  }

  upsertVehicleCache(normalized);
  return normalized;
};

export const updateVehicleApi = async (
  id: string,
  payload: UpdateVehiclePayload,
): Promise<Vehicle | null> => {
  if (!id) {
    return null;
  }

  if (!isVehiclesBackendEnabled()) {
    return updateVehicle(id, payload);
  }

  const current = getVehicleById(id) ?? (await loadVehicleFromBackend(id));

  if (!current) {
    return null;
  }

  const response = await requestJson<unknown>(`vehicles/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: toVehicleBackendPayload(payload, current),
  });
  const normalized = normalizeVehicle(extractRecordData(response));

  if (normalized) {
    upsertVehicleCache(normalized);
    return normalized;
  }

  const fallback = normalizeVehicle({
    ...current,
    ...payload,
    updatedAt: new Date().toISOString(),
  });

  if (!fallback) {
    return null;
  }

  upsertVehicleCache(fallback);
  return fallback;
};

export const removeVehicleApi = async (id: string): Promise<boolean> => {
  if (!id) {
    return false;
  }

  if (!isVehiclesBackendEnabled()) {
    return removeVehicle(id);
  }

  await requestJson<unknown>(`vehicles/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  removeVehicle(id);
  return true;
};
