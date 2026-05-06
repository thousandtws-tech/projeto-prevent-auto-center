import { isBackendApiEnabled, requestJson } from "./httpClient";

export const SCHEDULING_STORAGE_KEY = "prevent-auto-scheduling-v1";
export const SCHEDULING_UPDATED_EVENT = "prevent-auto-scheduling-updated";

const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60;
const N8N_TIMEOUT_MS = 15000;

export type SchedulingAppointmentStatus =
  | "pending"
  | "confirmed"
  | "failed"
  | "canceled";

export type SchedulingAppointment = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: SchedulingAppointmentStatus;
  mechanicResponsible: string;
  customer: {
    id: string | null;
    name: string;
    phone: string;
    email: string;
  };
  vehicle: {
    model: string;
    plate: string;
  };
  schedule: {
    serviceType: string;
    notes: string;
    startAt: string;
    endAt: string;
    durationMinutes: number;
    timezone: string;
  };
  integration: {
    provider: "n8n-google-calendar";
    lastAttemptAt: string | null;
    lastError: string | null;
    eventId: string | null;
    eventLink: string | null;
    responseMessage: string | null;
  };
  serviceOrder: {
    id: string | null;
    orderNumber: string | null;
  };
};

export type CreateSchedulingAppointmentPayload = {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleModel: string;
  vehiclePlate?: string;
  serviceType: string;
  mechanicResponsible?: string;
  notes?: string;
  startAt: string;
  durationMinutes: number;
  timezone?: string;
};

export type SchedulingAppointmentPatch = {
  status?: SchedulingAppointmentStatus;
  mechanicResponsible?: string;
  customer?: Partial<SchedulingAppointment["customer"]>;
  vehicle?: Partial<SchedulingAppointment["vehicle"]>;
  schedule?: Partial<SchedulingAppointment["schedule"]>;
  integration?: Partial<SchedulingAppointment["integration"]>;
  serviceOrder?: Partial<SchedulingAppointment["serviceOrder"]>;
};

type SchedulingWebhookResponse = {
  eventId: string | null;
  eventLink: string | null;
  message: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const getOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const getDurationMinutes = (
  value: unknown,
  fallback = DEFAULT_APPOINTMENT_DURATION_MINUTES,
) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.round(parsed);
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isValidDateString = (value: string) =>
  !Number.isNaN(new Date(value).getTime());

const calculateEndAt = (startAt: string, durationMinutes: number) => {
  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return end.toISOString();
};

const normalizeStatus = (value: unknown): SchedulingAppointmentStatus => {
  if (
    value === "pending" ||
    value === "confirmed" ||
    value === "failed" ||
    value === "canceled"
  ) {
    return value;
  }

  return "pending";
};

const normalizeAppointment = (
  value: unknown,
): SchedulingAppointment | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);
  if (!id) {
    return null;
  }

  const rawCustomer = isRecord(value.customer) ? value.customer : {};
  const rawVehicle = isRecord(value.vehicle) ? value.vehicle : {};
  const rawSchedule = isRecord(value.schedule) ? value.schedule : {};
  const rawIntegration = isRecord(value.integration) ? value.integration : {};
  const rawServiceOrder = isRecord(value.serviceOrder) ? value.serviceOrder : {};

  const startAt = getString(rawSchedule.startAt);
  if (!startAt || !isValidDateString(startAt)) {
    return null;
  }

  const durationMinutes = getDurationMinutes(rawSchedule.durationMinutes);
  const endAtCandidate = getString(rawSchedule.endAt);
  const endAt =
    endAtCandidate && isValidDateString(endAtCandidate)
      ? endAtCandidate
      : calculateEndAt(startAt, durationMinutes);

  return {
    id,
    createdAt:
      getString(value.createdAt) && isValidDateString(getString(value.createdAt))
        ? getString(value.createdAt)
        : new Date().toISOString(),
    updatedAt:
      getString(value.updatedAt) && isValidDateString(getString(value.updatedAt))
        ? getString(value.updatedAt)
        : new Date().toISOString(),
    status: normalizeStatus(value.status),
    mechanicResponsible: getString(value.mechanicResponsible),
    customer: {
      id: getOptionalString(rawCustomer.id),
      name: getString(rawCustomer.name),
      phone: getString(rawCustomer.phone),
      email: getString(rawCustomer.email),
    },
    vehicle: {
      model: getString(rawVehicle.model),
      plate: getString(rawVehicle.plate),
    },
    schedule: {
      serviceType: getString(rawSchedule.serviceType),
      notes: getString(rawSchedule.notes),
      startAt,
      endAt,
      durationMinutes,
      timezone:
        getString(rawSchedule.timezone) ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC",
    },
    integration: {
      provider: "n8n-google-calendar",
      lastAttemptAt:
        getString(rawIntegration.lastAttemptAt) &&
        isValidDateString(getString(rawIntegration.lastAttemptAt))
          ? getString(rawIntegration.lastAttemptAt)
          : null,
      lastError: getOptionalString(rawIntegration.lastError),
      eventId: getOptionalString(rawIntegration.eventId),
      eventLink: getOptionalString(rawIntegration.eventLink),
      responseMessage: getOptionalString(rawIntegration.responseMessage),
    },
    serviceOrder: {
      id: getOptionalString(rawServiceOrder.id),
      orderNumber: getOptionalString(rawServiceOrder.orderNumber),
    },
  };
};

const normalizeAppointments = (value: unknown): SchedulingAppointment[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeAppointment(item))
    .filter((item): item is SchedulingAppointment => Boolean(item))
    .sort(
      (a, b) =>
        new Date(a.schedule.startAt).getTime() -
        new Date(b.schedule.startAt).getTime(),
    );
};

const extractArrayData = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as Record<string, unknown>).data)
  ) {
    return (value as Record<string, unknown>).data as unknown[];
  }

  if (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as Record<string, unknown>).content)
  ) {
    return (value as Record<string, unknown>).content as unknown[];
  }

  return [];
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

const upsertAppointmentCache = (appointment: SchedulingAppointment) => {
  const current = readSchedulingAppointments();
  const exists = current.some((item) => item.id === appointment.id);
  const next = exists
    ? current.map((item) => (item.id === appointment.id ? appointment : item))
    : [appointment, ...current];
  writeSchedulingAppointments(next);
};

const dispatchAppointmentsUpdate = (appointments: SchedulingAppointment[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SCHEDULING_UPDATED_EVENT, { detail: appointments }),
  );
};

export const readSchedulingAppointments = (): SchedulingAppointment[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(SCHEDULING_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return normalizeAppointments(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const writeSchedulingAppointments = (
  appointments: SchedulingAppointment[],
): SchedulingAppointment[] => {
  const normalized = normalizeAppointments(appointments);

  if (typeof window === "undefined") {
    return normalized;
  }

  window.localStorage.setItem(
    SCHEDULING_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  dispatchAppointmentsUpdate(normalized);

  return normalized;
};

export const createSchedulingAppointment = (
  payload: CreateSchedulingAppointmentPayload,
): SchedulingAppointment => {
  const durationMinutes = getDurationMinutes(payload.durationMinutes);
  const startAt = payload.startAt;
  const timezone =
    payload.timezone?.trim() ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";
  const now = new Date().toISOString();

  const appointment: SchedulingAppointment = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    status: "pending",
    mechanicResponsible: payload.mechanicResponsible?.trim() ?? "",
    customer: {
      id: payload.customerId?.trim() || null,
      name: payload.customerName.trim(),
      phone: payload.customerPhone.trim(),
      email: payload.customerEmail?.trim() ?? "",
    },
    vehicle: {
      model: payload.vehicleModel.trim(),
      plate: payload.vehiclePlate?.trim() ?? "",
    },
    schedule: {
      serviceType: payload.serviceType.trim(),
      notes: payload.notes?.trim() ?? "",
      startAt,
      endAt: calculateEndAt(startAt, durationMinutes),
      durationMinutes,
      timezone,
    },
    integration: {
      provider: "n8n-google-calendar",
      lastAttemptAt: null,
      lastError: null,
      eventId: null,
      eventLink: null,
      responseMessage: null,
    },
    serviceOrder: {
      id: null,
      orderNumber: null,
    },
  };

  const current = readSchedulingAppointments();
  writeSchedulingAppointments([appointment, ...current]);

  return appointment;
};

export const patchSchedulingAppointment = (
  id: string,
  patch: SchedulingAppointmentPatch,
): SchedulingAppointment | null => {
  if (!id) {
    return null;
  }

  const appointments = readSchedulingAppointments();
  let updated: SchedulingAppointment | null = null;

  const next = appointments.map((appointment) => {
    if (appointment.id !== id) {
      return appointment;
    }

    updated = {
      ...appointment,
      status: patch.status ?? appointment.status,
      mechanicResponsible:
        patch.mechanicResponsible ?? appointment.mechanicResponsible,
      customer: {
        ...appointment.customer,
        ...(patch.customer ?? {}),
      },
      vehicle: {
        ...appointment.vehicle,
        ...(patch.vehicle ?? {}),
      },
      schedule: {
        ...appointment.schedule,
        ...(patch.schedule ?? {}),
      },
      integration: {
        ...appointment.integration,
        ...(patch.integration ?? {}),
      },
      serviceOrder: {
        ...appointment.serviceOrder,
        ...(patch.serviceOrder ?? {}),
      },
      updatedAt: new Date().toISOString(),
    };

    return updated;
  });

  writeSchedulingAppointments(next);
  return updated;
};

export const removeSchedulingAppointment = (id: string): boolean => {
  if (!id) {
    return false;
  }

  const appointments = readSchedulingAppointments();
  const next = appointments.filter((appointment) => appointment.id !== id);

  if (next.length === appointments.length) {
    return false;
  }

  writeSchedulingAppointments(next);
  return true;
};

export const isSchedulingBackendEnabled = () => isBackendApiEnabled();

export const listSchedulingAppointmentsApi = async (): Promise<
  SchedulingAppointment[]
> => {
  if (!isSchedulingBackendEnabled()) {
    return readSchedulingAppointments();
  }

  const searchParams = new URLSearchParams({
    page: "0",
    size: "100",
    sort: "startAt,asc",
  });

  const response = await requestJson<unknown>(`scheduling/appointments?${searchParams.toString()}`, {
    method: "GET",
  });
  const normalized = normalizeAppointments(extractArrayData(response));
  writeSchedulingAppointments(normalized);
  return normalized;
};

export const getSchedulingAppointmentByIdApi = async (
  id: string,
): Promise<SchedulingAppointment | null> => {
  if (!id) {
    return null;
  }

  if (!isSchedulingBackendEnabled()) {
    return (
      readSchedulingAppointments().find((appointment) => appointment.id === id) ??
      null
    );
  }

  const response = await requestJson<unknown>(
    `scheduling/appointments/${encodeURIComponent(id)}`,
    {
      method: "GET",
    },
  );
  const normalized = normalizeAppointment(extractRecordData(response));

  if (normalized) {
    upsertAppointmentCache(normalized);
  }

  return normalized;
};

export const createSchedulingAppointmentApi = async (
  payload: CreateSchedulingAppointmentPayload,
): Promise<SchedulingAppointment> => {
  if (!isSchedulingBackendEnabled()) {
    return createSchedulingAppointment(payload);
  }

  const response = await requestJson<unknown>("scheduling/appointments", {
    method: "POST",
    body: payload,
  });
  const normalized = normalizeAppointment(extractRecordData(response));

  if (!normalized) {
    throw new Error("Backend retornou agendamento inválido após criação.");
  }

  upsertAppointmentCache(normalized);
  return normalized;
};

export const patchSchedulingAppointmentApi = async (
  id: string,
  patch: SchedulingAppointmentPatch,
): Promise<SchedulingAppointment | null> => {
  if (!id) {
    return null;
  }

  if (!isSchedulingBackendEnabled()) {
    return patchSchedulingAppointment(id, patch);
  }

  const response = await requestJson<unknown>(
    `scheduling/appointments/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: patch,
    },
  );
  const normalized = normalizeAppointment(extractRecordData(response));

  if (normalized) {
    upsertAppointmentCache(normalized);
    return normalized;
  }

  const existing = readSchedulingAppointments().find((item) => item.id === id);
  if (!existing) {
    return null;
  }

  const fallback = normalizeAppointment({
    ...existing,
    ...patch,
    customer: {
      ...existing.customer,
      ...(patch.customer ?? {}),
    },
    vehicle: {
      ...existing.vehicle,
      ...(patch.vehicle ?? {}),
    },
    schedule: {
      ...existing.schedule,
      ...(patch.schedule ?? {}),
    },
    integration: {
      ...existing.integration,
      ...(patch.integration ?? {}),
    },
    updatedAt: new Date().toISOString(),
  });

  if (!fallback) {
    return null;
  }

  upsertAppointmentCache(fallback);
  return fallback;
};

export const cancelSchedulingAppointmentApi = async (
  id: string,
): Promise<SchedulingAppointment | null> => {
  return patchSchedulingAppointmentApi(id, {
    status: "canceled",
    integration: {
      responseMessage: "Agendamento cancelado manualmente no painel",
      lastError: null,
    },
  });
};

export const removeSchedulingAppointmentApi = async (
  id: string,
): Promise<boolean> => {
  if (!id) {
    return false;
  }

  if (!isSchedulingBackendEnabled()) {
    return removeSchedulingAppointment(id);
  }

  await requestJson<unknown>(`scheduling/appointments/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  return removeSchedulingAppointment(id);
};

export const clearSchedulingAppointmentsApi = async (): Promise<void> => {
  if (!isSchedulingBackendEnabled()) {
    writeSchedulingAppointments([]);
    return;
  }

  await requestJson<unknown>("scheduling/appointments", {
    method: "DELETE",
  });
  writeSchedulingAppointments([]);
};

const parseWebhookResponse = (rawValue: unknown): SchedulingWebhookResponse => {
  const unwrap = (): Record<string, unknown> => {
    if (Array.isArray(rawValue)) {
      const first = rawValue[0];
      if (isRecord(first)) {
        return first;
      }
    }

    if (isRecord(rawValue)) {
      return rawValue;
    }

    return {};
  };

  const data = unwrap();
  const eventId =
    getOptionalString(data.eventId) ??
    getOptionalString(data.calendarEventId) ??
    getOptionalString(data.id);
  const eventLink =
    getOptionalString(data.eventLink) ??
    getOptionalString(data.calendarEventLink) ??
    getOptionalString(data.htmlLink) ??
    getOptionalString(data.webViewLink);
  const message =
    getOptionalString(data.message) ??
    getOptionalString(data.status) ??
    getOptionalString(rawValue);

  return {
    eventId,
    eventLink,
    message,
  };
};

export const isSchedulingWebhookConfigured = () =>
  Boolean(import.meta.env.VITE_N8N_SCHEDULING_WEBHOOK_URL?.trim());

export const sendSchedulingAppointmentToN8n = async (
  appointment: SchedulingAppointment,
): Promise<SchedulingWebhookResponse> => {
  const webhookUrl = import.meta.env.VITE_N8N_SCHEDULING_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    throw new Error(
      "Defina VITE_N8N_SCHEDULING_WEBHOOK_URL para enviar agendamentos.",
    );
  }

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);
  const token = import.meta.env.VITE_N8N_WEBHOOK_TOKEN?.trim();

  try {
    const payload = {
      source: "prevent-auto-mecanica-client",
      sentAt: new Date().toISOString(),
      appointment: {
        id: appointment.id,
        status: appointment.status,
      serviceType: appointment.schedule.serviceType,
      mechanicResponsible: appointment.mechanicResponsible,
      notes: appointment.schedule.notes,
        startAt: appointment.schedule.startAt,
        endAt: appointment.schedule.endAt,
        durationMinutes: appointment.schedule.durationMinutes,
        timezone: appointment.schedule.timezone,
      },
      customer: appointment.customer,
      vehicle: appointment.vehicle,
      serviceOrder: appointment.serviceOrder,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const rawText = await response.text();
    let parsedBody: unknown = rawText;

    if (rawText) {
      try {
        parsedBody = JSON.parse(rawText) as unknown;
      } catch {
        parsedBody = rawText;
      }
    }

    if (!response.ok) {
      const errorMessage =
        parseWebhookResponse(parsedBody).message ??
        `Webhook respondeu com status ${response.status}`;
      throw new Error(errorMessage);
    }

    return parseWebhookResponse(parsedBody);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Timeout ao enviar para n8n. Tente novamente.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Falha inesperada ao enviar agendamento para n8n.");
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
};
