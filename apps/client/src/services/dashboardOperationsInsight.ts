import {
  getUnreadNotificationCenterCount,
  readNotificationCenterItems,
  type NotificationCenterItem,
} from "./notificationCenter";
import { listCustomersApi, readCustomers, type Customer } from "./customers";
import {
  listServiceOrdersApi,
  readServiceOrders,
  type ServiceOrderRecord,
} from "./serviceOrders";
import {
  listSchedulingAppointmentsApi,
  readSchedulingAppointments,
  type SchedulingAppointment,
} from "./scheduling";
import {
  listSharedServiceOrdersApi,
  readSharedServiceOrders,
  type SharedServiceOrder,
} from "./serviceOrderSignature";
import { readAppSettings, type AppSettings } from "./appSettings";

const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";
export const DEFAULT_DASHBOARD_ANALYSIS_QUESTION =
  "Gere uma análise executiva da operação completa da oficina considerando clientes, ordens de serviço, assinaturas, recusas, agendamentos, notificações e backup.";

type RankedValueItem = {
  label: string;
  count: number;
  totalValue: number;
};

type RankedCountItem = {
  label: string;
  count: number;
};

type DashboardOperationsDataset = {
  customers: Customer[];
  serviceOrders: ServiceOrderRecord[];
  sharedOrders: SharedServiceOrder[];
  appointments: SchedulingAppointment[];
  notifications: NotificationCenterItem[];
  settings: AppSettings;
};

export type DashboardOperationsSummary = {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalServiceOrders: number;
  signedServiceOrders: number;
  closedServiceOrders: number;
  sentForSignatureServiceOrders: number;
  pendingSignatureServiceOrders: number;
  registeredServiceOrders: number;
  totalServiceOrdersApprovedValue: number;
  totalServiceOrdersPartsValue: number;
  totalServiceOrdersServicesValue: number;
  averageServiceOrderTicket: number;
  totalRefusedItems: number;
  totalRefusedValue: number;
  totalSharedOrders: number;
  signedSharedOrders: number;
  pendingSharedOrders: number;
  totalSharedOrdersValue: number;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  failedAppointments: number;
  canceledAppointments: number;
  upcomingAppointmentsNext7Days: number;
  missedPendingAppointments: number;
  totalNotifications: number;
  unreadNotifications: number;
  errorNotifications: number;
  autoBackupEnabled: boolean;
  lastBackupAt: string | null;
  backupOutdatedDays: number | null;
  lastOperationalUpdateAt: string | null;
  topRefusedParts: RankedValueItem[];
  topRefusedServices: RankedValueItem[];
  topScheduledServices: RankedCountItem[];
};

export type DashboardOperationsSnapshot = {
  generatedAt: string;
  summary: DashboardOperationsSummary;
  dataset: DashboardOperationsDataset;
};

export type DashboardOperationsInsight = {
  generatedAt: string;
  provider: "gemini" | "fallback";
  text: string;
  summary: DashboardOperationsSummary;
};

type GenerateDashboardOperationsInsightOptions = {
  question?: string;
  snapshot?: DashboardOperationsSnapshot;
};

const getGeminiApiKey = () => import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? "";
const getGeminiModel = () =>
  import.meta.env.VITE_GEMINI_MODEL?.trim() ?? DEFAULT_GEMINI_MODEL;
const getGeminiProxyUrl = () =>
  import.meta.env.VITE_DASHBOARD_AI_PROXY_URL?.trim() ??
  import.meta.env.VITE_GEMINI_PROXY_URL?.trim() ??
  "";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractGeminiText = (value: unknown): string | null => {
  if (!isRecord(value)) {
    return null;
  }

  const candidates = Array.isArray(value.candidates) ? value.candidates : [];
  for (const candidate of candidates) {
    if (!isRecord(candidate)) {
      continue;
    }

    const content = candidate.content;
    if (!isRecord(content)) {
      continue;
    }

    const parts = Array.isArray(content.parts) ? content.parts : [];
    const text = parts
      .map((part) =>
        isRecord(part) && typeof part.text === "string" ? part.text.trim() : "",
      )
      .filter(Boolean)
      .join("\n")
      .trim();

    if (text) {
      return text;
    }
  }

  if (typeof value.text === "string" && value.text.trim()) {
    return value.text.trim();
  }

  if (typeof value.message === "string" && value.message.trim()) {
    return value.message.trim();
  }

  return null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("pt-BR");
};

const getDaysSince = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const now = Date.now();
  const diff = now - parsed.getTime();
  if (diff < 0) {
    return 0;
  }

  return Math.floor(diff / 86_400_000);
};

const toTopValueRanking = (
  entries: Map<string, { count: number; totalValue: number }>,
  limit = 5,
) =>
  [...entries.entries()]
    .map(([label, value]) => ({
      label,
      count: value.count,
      totalValue: value.totalValue,
    }))
    .sort((a, b) => b.count - a.count || b.totalValue - a.totalValue)
    .slice(0, limit);

const toTopCountRanking = (entries: Map<string, number>, limit = 5) =>
  [...entries.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

const addAggregateValue = (
  map: Map<string, { count: number; totalValue: number }>,
  rawLabel: string,
  value: number,
) => {
  const label = rawLabel.trim().toUpperCase() || "SEM DESCRIÇÃO";
  const current = map.get(label) ?? { count: 0, totalValue: 0 };
  current.count += 1;
  current.totalValue += Math.max(0, value);
  map.set(label, current);
};

const getLatestDate = (dates: Array<string | null | undefined>) => {
  let latest: number | null = null;

  dates.forEach((value) => {
    if (!value) {
      return;
    }

    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) {
      return;
    }

    latest = latest === null ? timestamp : Math.max(latest, timestamp);
  });

  return latest === null ? null : new Date(latest).toISOString();
};

const withFallback = async <T>(query: () => Promise<T>, fallback: () => T) => {
  try {
    return await query();
  } catch {
    return fallback();
  }
};

const collectDashboardOperationsDataset =
  async (): Promise<DashboardOperationsDataset> => {
    const [customers, serviceOrders, sharedOrders, appointments] = await Promise.all([
      withFallback(listCustomersApi, readCustomers),
      withFallback(listServiceOrdersApi, readServiceOrders),
      withFallback(listSharedServiceOrdersApi, readSharedServiceOrders),
      withFallback(listSchedulingAppointmentsApi, readSchedulingAppointments),
    ]);

    return {
      customers,
      serviceOrders,
      sharedOrders,
      appointments,
      notifications: readNotificationCenterItems(),
      settings: readAppSettings(),
    };
  };

const computeDashboardOperationsSummary = (
  dataset: DashboardOperationsDataset,
): DashboardOperationsSummary => {
  const refusedParts = new Map<string, { count: number; totalValue: number }>();
  const refusedServices = new Map<string, { count: number; totalValue: number }>();
  const scheduledServices = new Map<string, number>();

  let signedServiceOrders = 0;
  let closedServiceOrders = 0;
  let sentForSignatureServiceOrders = 0;
  let pendingSignatureServiceOrders = 0;
  let registeredServiceOrders = 0;
  let totalServiceOrdersApprovedValue = 0;
  let totalServiceOrdersPartsValue = 0;
  let totalServiceOrdersServicesValue = 0;
  let totalRefusedItems = 0;
  let totalRefusedValue = 0;

  dataset.serviceOrders.forEach((order) => {
    totalServiceOrdersApprovedValue += Math.max(0, order.totals.grandTotal);
    totalServiceOrdersPartsValue += Math.max(0, order.totals.partsSubtotal);
    totalServiceOrdersServicesValue +=
      Math.max(0, order.totals.laborSubtotal) +
      Math.max(0, order.totals.thirdPartySubtotal);

    if (order.status === "signed") {
      signedServiceOrders += 1;
    } else if (order.status === "closed") {
      closedServiceOrders += 1;
    } else if (order.status === "sent_for_signature") {
      sentForSignatureServiceOrders += 1;
    } else {
      registeredServiceOrders += 1;
    }

    if (
      (order.signature || order.status === "sent_for_signature") &&
      order.status !== "closed" &&
      order.status !== "signed"
    ) {
      pendingSignatureServiceOrders += 1;
    }

    order.parts.forEach((part) => {
      if (part.status !== "declined") {
        return;
      }

      const total = part.quantity * part.unitPrice;
      totalRefusedItems += 1;
      totalRefusedValue += total;
      addAggregateValue(refusedParts, part.description, total);
    });

    [...order.laborServices, ...order.thirdPartyServices].forEach((service) => {
      if (service.status !== "declined") {
        return;
      }

      const total = service.amount;
      totalRefusedItems += 1;
      totalRefusedValue += total;
      addAggregateValue(refusedServices, service.description, total);
    });
  });

  let signedSharedOrders = 0;
  let pendingSharedOrders = 0;
  let totalSharedOrdersValue = 0;

  dataset.sharedOrders.forEach((order) => {
    totalSharedOrdersValue += Math.max(0, order.totals.grandTotal);
    if (order.status === "signed") {
      signedSharedOrders += 1;
    } else {
      pendingSharedOrders += 1;
    }
  });

  const now = Date.now();
  const next7DaysLimit = now + 7 * 86_400_000;
  let pendingAppointments = 0;
  let confirmedAppointments = 0;
  let failedAppointments = 0;
  let canceledAppointments = 0;
  let upcomingAppointmentsNext7Days = 0;
  let missedPendingAppointments = 0;

  dataset.appointments.forEach((appointment) => {
    const serviceType =
      appointment.schedule.serviceType.trim().toUpperCase() || "SEM TIPO";
    scheduledServices.set(serviceType, (scheduledServices.get(serviceType) ?? 0) + 1);

    const startsAt = new Date(appointment.schedule.startAt).getTime();
    if (
      !Number.isNaN(startsAt) &&
      startsAt >= now &&
      startsAt <= next7DaysLimit &&
      (appointment.status === "pending" || appointment.status === "confirmed")
    ) {
      upcomingAppointmentsNext7Days += 1;
    }

    if (
      !Number.isNaN(startsAt) &&
      startsAt < now &&
      appointment.status === "pending"
    ) {
      missedPendingAppointments += 1;
    }

    if (appointment.status === "confirmed") {
      confirmedAppointments += 1;
      return;
    }

    if (appointment.status === "failed") {
      failedAppointments += 1;
      return;
    }

    if (appointment.status === "canceled") {
      canceledAppointments += 1;
      return;
    }

    pendingAppointments += 1;
  });

  const unreadNotifications = getUnreadNotificationCenterCount(dataset.notifications);
  const errorNotifications = dataset.notifications.reduce(
    (total, item) => (item.type === "error" ? total + 1 : total),
    0,
  );

  const backupLastDate = dataset.settings.backup.lastBackupAt || null;
  const lastOperationalUpdateAt = getLatestDate([
    ...dataset.customers.map((item) => item.updatedAt),
    ...dataset.serviceOrders.map((item) => item.updatedAt),
    ...dataset.sharedOrders.map((item) => item.createdAt),
    ...dataset.appointments.map((item) => item.updatedAt),
    ...dataset.notifications.map((item) => item.createdAt),
    backupLastDate,
  ]);

  const totalServiceOrders = dataset.serviceOrders.length;
  const totalCustomers = dataset.customers.length;
  const activeCustomers = dataset.customers.filter(
    (customer) => customer.status === "active",
  ).length;

  return {
    totalCustomers,
    activeCustomers,
    inactiveCustomers: totalCustomers - activeCustomers,
    totalServiceOrders,
    signedServiceOrders,
    closedServiceOrders,
    sentForSignatureServiceOrders,
    pendingSignatureServiceOrders,
    registeredServiceOrders,
    totalServiceOrdersApprovedValue,
    totalServiceOrdersPartsValue,
    totalServiceOrdersServicesValue,
    averageServiceOrderTicket: totalServiceOrders
      ? totalServiceOrdersServicesValue / totalServiceOrders
      : 0,
    totalRefusedItems,
    totalRefusedValue,
    totalSharedOrders: dataset.sharedOrders.length,
    signedSharedOrders,
    pendingSharedOrders,
    totalSharedOrdersValue,
    totalAppointments: dataset.appointments.length,
    pendingAppointments,
    confirmedAppointments,
    failedAppointments,
    canceledAppointments,
    upcomingAppointmentsNext7Days,
    missedPendingAppointments,
    totalNotifications: dataset.notifications.length,
    unreadNotifications,
    errorNotifications,
    autoBackupEnabled: dataset.settings.backup.autoBackupEnabled,
    lastBackupAt: backupLastDate,
    backupOutdatedDays: getDaysSince(backupLastDate),
    lastOperationalUpdateAt,
    topRefusedParts: toTopValueRanking(refusedParts),
    topRefusedServices: toTopValueRanking(refusedServices),
    topScheduledServices: toTopCountRanking(scheduledServices),
  };
};

const buildFallbackText = (summary: DashboardOperationsSummary) => {
  const topRefusedParts = summary.topRefusedParts.length
    ? summary.topRefusedParts
        .map((item) => `${item.label} (${item.count}x, ${formatCurrency(item.totalValue)})`)
        .join("; ")
    : "Sem peças recusadas registradas.";

  const topRefusedServices = summary.topRefusedServices.length
    ? summary.topRefusedServices
        .map((item) => `${item.label} (${item.count}x, ${formatCurrency(item.totalValue)})`)
        .join("; ")
    : "Sem serviços recusados registrados.";

  const topScheduledServices = summary.topScheduledServices.length
    ? summary.topScheduledServices
        .map((item) => `${item.label} (${item.count})`)
        .join("; ")
    : "Sem dados de tipo de serviço nos agendamentos.";

  const backupStatus = summary.autoBackupEnabled
    ? `Backup automático ativo. Último backup: ${formatDateTime(summary.lastBackupAt)}.`
    : "Backup automático desativado.";

  return [
    `Painel consolidado atualizado em ${formatDateTime(summary.lastOperationalUpdateAt)}.`,
    `Clientes: ${summary.totalCustomers} (${summary.activeCustomers} ativos, ${summary.inactiveCustomers} inativos).`,
    `Ordens de serviço: ${summary.totalServiceOrders} (encerradas ${summary.closedServiceOrders}, assinadas ${summary.signedServiceOrders}, enviadas para assinatura ${summary.sentForSignatureServiceOrders}, registradas ${summary.registeredServiceOrders}).`,
    `Receita apurada em OS: peças ${formatCurrency(summary.totalServiceOrdersPartsValue)} e serviços ${formatCurrency(summary.totalServiceOrdersServicesValue)}. Ticket médio de serviços: ${formatCurrency(summary.averageServiceOrderTicket)}.`,
    `Recusas registradas: ${summary.totalRefusedItems} itens (${formatCurrency(summary.totalRefusedValue)}).`,
    `Assinaturas compartilhadas: ${summary.totalSharedOrders} (assinadas ${summary.signedSharedOrders}, pendentes ${summary.pendingSharedOrders}), valor ${formatCurrency(summary.totalSharedOrdersValue)}.`,
    `Agendamentos: ${summary.totalAppointments} (confirmados ${summary.confirmedAppointments}, pendentes ${summary.pendingAppointments}, falhos ${summary.failedAppointments}, cancelados ${summary.canceledAppointments}).`,
    `Próximos 7 dias: ${summary.upcomingAppointmentsNext7Days} agendamentos; pendentes atrasados: ${summary.missedPendingAppointments}.`,
    `Notificações: ${summary.totalNotifications} totais, ${summary.unreadNotifications} não lidas, ${summary.errorNotifications} de erro.`,
    backupStatus,
    `Peças mais recusadas: ${topRefusedParts}`,
    `Serviços mais recusados: ${topRefusedServices}`,
    `Tipos de serviço mais agendados: ${topScheduledServices}`,
    "Ação recomendada: priorizar itens mais recusados com revisão de orçamento/técnica, tratar pendências de assinatura e reduzir agendamentos pendentes atrasados com confirmação ativa.",
  ].join("\n");
};

const buildPrompt = (
  summary: DashboardOperationsSummary,
  dataset: DashboardOperationsDataset,
  question: string,
) => {
  const compactServiceOrders = dataset.serviceOrders.slice(0, 20).map((order) => ({
    os: order.orderInfo.orderNumber,
    customer: order.orderInfo.customerName,
    vehicle: order.orderInfo.vehicle,
    status: order.status,
    approvedTotal: order.totals.grandTotal,
    partsRevenue: order.totals.partsSubtotal,
    servicesRevenue: order.totals.laborSubtotal + order.totals.thirdPartySubtotal,
    updatedAt: order.updatedAt,
    refusedParts: order.parts
      .filter((item) => item.status === "declined")
      .map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    refusedServices: [...order.laborServices, ...order.thirdPartyServices]
      .filter((item) => item.status === "declined")
      .map((item) => ({
        description: item.description,
        amount: item.amount,
      })),
  }));

  const compactAppointments = dataset.appointments.slice(0, 20).map((appointment) => ({
    status: appointment.status,
    customer: appointment.customer.name,
    serviceType: appointment.schedule.serviceType,
    startAt: appointment.schedule.startAt,
    timezone: appointment.schedule.timezone,
    integrationError: appointment.integration.lastError,
  }));

  return [
    "Você é um analista operacional de oficina mecânica.",
    "Responda em português brasileiro com linguagem clara para gestão.",
    "Analise a operação completa da empresa e entregue recomendações acionáveis.",
    "Estruture a resposta em:",
    "1. Panorama executivo consolidado;",
    "2. Gargalos e riscos por área (clientes, OS, assinaturas, recusas, agendamentos, notificações e backup);",
    "3. Oportunidades de ganho de eficiência e faturamento;",
    "4. Plano de ação priorizado (curto prazo e médio prazo).",
    "",
    `Pergunta principal: ${question || DEFAULT_DASHBOARD_ANALYSIS_QUESTION}`,
    "",
    "Resumo consolidado:",
    JSON.stringify(summary),
    "",
    "Amostra de ordens de serviço:",
    JSON.stringify(compactServiceOrders),
    "",
    "Amostra de agendamentos:",
    JSON.stringify(compactAppointments),
  ].join("\n");
};

export const isDashboardOperationsGeminiConfigured = () =>
  Boolean(getGeminiProxyUrl() || getGeminiApiKey());

export const getDashboardOperationsSnapshot =
  async (): Promise<DashboardOperationsSnapshot> => {
    const dataset = await collectDashboardOperationsDataset();
    return {
      generatedAt: new Date().toISOString(),
      summary: computeDashboardOperationsSummary(dataset),
      dataset,
    };
  };

export const generateDashboardOperationsInsight = async (
  options: GenerateDashboardOperationsInsightOptions = {},
): Promise<DashboardOperationsInsight> => {
  const snapshot = options.snapshot ?? (await getDashboardOperationsSnapshot());
  const generatedAt = new Date().toISOString();
  const question =
    options.question?.trim() || DEFAULT_DASHBOARD_ANALYSIS_QUESTION;
  const prompt = buildPrompt(snapshot.summary, snapshot.dataset, question);

  const proxyUrl = getGeminiProxyUrl();
  if (!proxyUrl && !getGeminiApiKey()) {
    return {
      generatedAt,
      provider: "fallback",
      text: buildFallbackText(snapshot.summary),
      summary: snapshot.summary,
    };
  }

  try {
    let response: Response;

    if (proxyUrl) {
      response = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          question,
          summary: snapshot.summary,
          serviceOrders: snapshot.dataset.serviceOrders.slice(0, 20),
          appointments: snapshot.dataset.appointments.slice(0, 20),
          customers: snapshot.dataset.customers.slice(0, 20),
        }),
      });
    } else {
      const model = getGeminiModel();
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model,
        )}:generateContent?key=${encodeURIComponent(getGeminiApiKey())}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
          }),
        },
      );
    }

    if (!response.ok) {
      throw new Error(`Falha na IA (${response.status} ${response.statusText})`);
    }

    const parsed = (await response.json()) as unknown;
    const text = extractGeminiText(parsed);
    if (!text) {
      throw new Error("Resposta da IA não retornou texto.");
    }

    return {
      generatedAt,
      provider: "gemini",
      text,
      summary: snapshot.summary,
    };
  } catch {
    return {
      generatedAt,
      provider: "fallback",
      text: buildFallbackText(snapshot.summary),
      summary: snapshot.summary,
    };
  }
};
