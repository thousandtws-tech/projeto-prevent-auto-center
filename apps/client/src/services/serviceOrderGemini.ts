import type { ServiceOrderRecord } from "./serviceOrders";

const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";
const DEFAULT_ANALYSIS_QUESTION =
  "Gere um resumo executivo objetivo do histórico de ordens de serviço, destacando riscos, recusas frequentes e oportunidades de melhoria operacional.";

export type ServiceOrderInsight = {
  generatedAt: string;
  provider: "gemini" | "fallback";
  text: string;
  summary: {
    totalOrders: number;
    signedOrders: number;
    closedOrders: number;
    pendingSignatureOrders: number;
    totalApprovedValue: number;
    totalPartsApprovedValue: number;
    totalLaborApprovedValue: number;
    totalThirdPartyApprovedValue: number;
    totalDiscountValue: number;
    averageTicket: number;
    totalRefusedItems: number;
    totalRefusedValue: number;
  };
};

type RefusedItemAggregate = {
  key: string;
  count: number;
  totalValue: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);

const getGeminiApiKey = () => import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? "";
const getGeminiModel = () => import.meta.env.VITE_GEMINI_MODEL?.trim() ?? DEFAULT_GEMINI_MODEL;
const getGeminiProxyUrl = () => import.meta.env.VITE_GEMINI_PROXY_URL?.trim() ?? "";

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

const computeInsightSummary = (orders: ServiceOrderRecord[]) => {
  const refusedParts = new Map<string, RefusedItemAggregate>();
  const refusedServices = new Map<string, RefusedItemAggregate>();

  const totals = orders.reduce(
    (acc, order) => {
      const approvedPartsValue = order.parts.reduce(
        (sum, part) =>
          sum + (part.status === "approved" ? part.quantity * part.unitPrice : 0),
        0,
      );
      const approvedLaborValue = order.laborServices.reduce(
        (sum, service) => sum + (service.status === "approved" ? service.amount : 0),
        0,
      );
      const approvedThirdPartyValue = order.thirdPartyServices.reduce(
        (sum, service) => sum + (service.status === "approved" ? service.amount : 0),
        0,
      );

      acc.totalOrders += 1;

      if (order.status === "signed") {
        acc.signedOrders += 1;
      } else if (order.status === "closed") {
        acc.closedOrders += 1;
      }

      if (
        (order.signature || order.status === "sent_for_signature") &&
        order.status !== "closed" &&
        order.status !== "signed"
      ) {
        acc.pendingSignatureOrders += 1;
      }

      acc.totalApprovedValue += order.totals.grandTotal;
      acc.totalPartsApprovedValue += approvedPartsValue;
      acc.totalLaborApprovedValue += approvedLaborValue;
      acc.totalThirdPartyApprovedValue += approvedThirdPartyValue;
      acc.totalDiscountValue += order.discount;

      order.parts.forEach((part) => {
        if (part.status !== "declined") {
          return;
        }

        const key = part.description.trim().toUpperCase() || "PEÇA SEM DESCRIÇÃO";
        const totalValue = part.quantity * part.unitPrice;
        const current = refusedParts.get(key) ?? {
          key,
          count: 0,
          totalValue: 0,
        };

        current.count += 1;
        current.totalValue += totalValue;

        refusedParts.set(key, current);
        acc.totalRefusedItems += 1;
        acc.totalRefusedValue += totalValue;
      });

      [...order.laborServices, ...order.thirdPartyServices].forEach((service) => {
        if (service.status !== "declined") {
          return;
        }

        const key = service.description.trim().toUpperCase() || "SERVIÇO SEM DESCRIÇÃO";
        const current = refusedServices.get(key) ?? {
          key,
          count: 0,
          totalValue: 0,
        };

        current.count += 1;
        current.totalValue += service.amount;

        refusedServices.set(key, current);
        acc.totalRefusedItems += 1;
        acc.totalRefusedValue += service.amount;
      });

      return acc;
    },
    {
      totalOrders: 0,
      signedOrders: 0,
      closedOrders: 0,
      pendingSignatureOrders: 0,
      totalApprovedValue: 0,
      totalPartsApprovedValue: 0,
      totalLaborApprovedValue: 0,
      totalThirdPartyApprovedValue: 0,
      totalDiscountValue: 0,
      totalRefusedItems: 0,
      totalRefusedValue: 0,
    },
  );

  const topRefusedParts = [...refusedParts.values()]
    .sort((a, b) => b.count - a.count || b.totalValue - a.totalValue)
    .slice(0, 5);

  const topRefusedServices = [...refusedServices.values()]
    .sort((a, b) => b.count - a.count || b.totalValue - a.totalValue)
    .slice(0, 5);

  return {
    ...totals,
    averageTicket: totals.totalOrders
      ? (totals.totalLaborApprovedValue + totals.totalThirdPartyApprovedValue) /
        totals.totalOrders
      : 0,
    topRefusedParts,
    topRefusedServices,
  };
};

const buildFallbackText = (
  summary: ReturnType<typeof computeInsightSummary>,
  latestOrders: ServiceOrderRecord[],
) => {
  if (!latestOrders.length) {
    return "Ainda não há ordens de serviço no histórico para análise.";
  }

  const lastUpdated = latestOrders[0]?.updatedAt
    ? new Date(latestOrders[0].updatedAt).toLocaleString("pt-BR")
    : "-";

  const topPartText = summary.topRefusedParts.length
    ? summary.topRefusedParts
        .map((item) => `${item.key} (${item.count}x, ${formatCurrency(item.totalValue)})`)
        .join("; ")
    : "Nenhuma peça recusada registrada.";

  const topServiceText = summary.topRefusedServices.length
    ? summary.topRefusedServices
        .map((item) => `${item.key} (${item.count}x, ${formatCurrency(item.totalValue)})`)
        .join("; ")
    : "Nenhum serviço recusado registrado.";

  return [
    `Resumo operacional da planilha até ${lastUpdated}.`,
    `Foram registradas ${summary.totalOrders} OS, sendo ${summary.closedOrders} encerradas, ${summary.signedOrders} assinadas e ${summary.pendingSignatureOrders} aguardando assinatura.`,
    `Total aprovado no período: ${formatCurrency(summary.totalApprovedValue)}.`,
    `Receita apurada: peças ${formatCurrency(summary.totalPartsApprovedValue)} e serviços ${formatCurrency(summary.totalLaborApprovedValue + summary.totalThirdPartyApprovedValue)} (ticket médio de serviços ${formatCurrency(summary.averageTicket)}).`,
    `Total de descontos aplicados: ${formatCurrency(summary.totalDiscountValue)}.`,
    `Total de itens recusados: ${summary.totalRefusedItems} (${formatCurrency(summary.totalRefusedValue)}).`,
    `Peças mais recusadas: ${topPartText}`,
    `Serviços mais recusados: ${topServiceText}`,
    "Recomendação: revisar itens mais recusados, validar precificação e reforçar explicação técnica antes da aprovação final.",
  ].join("\n");
};

const buildPrompt = (
  summary: ReturnType<typeof computeInsightSummary>,
  orders: ServiceOrderRecord[],
  question: string,
) => {
  const compactOrders = orders.slice(0, 25).map((order) => ({
    os: order.orderInfo.orderNumber,
    customer: order.orderInfo.customerName,
    vehicle: order.orderInfo.vehicle,
    mechanic: order.orderInfo.mechanicResponsible,
    status: order.status,
    totals: order.totals,
    refusedParts: order.parts
      .filter((part) => part.status === "declined")
      .map((part) => ({
        description: part.description,
        quantity: part.quantity,
        unitPrice: part.unitPrice,
      })),
    refusedServices: [...order.laborServices, ...order.thirdPartyServices]
      .filter((service) => service.status === "declined")
      .map((service) => ({
        description: service.description,
        amount: service.amount,
      })),
    updatedAt: order.updatedAt,
  }));

  return [
    "Você é um analista de oficina mecânica e deve gerar um resumo claro para gestor e cliente.",
    "Responda em português brasileiro, usando linguagem simples e profissional.",
    "Apresente leitura no formato de planilha operacional de ordens de serviço.",
    "Inclua:",
    "1. Situação atual (assinaturas, volume, ticket médio e faturamento aprovado).",
    "2. Composição financeira (peças, serviços, terceiros e descontos).",
    "3. Principais recusas (peças e serviços) e impacto financeiro.",
    "4. Riscos operacionais e comerciais.",
    "5. Ações práticas recomendadas.",
    "",
    `Pergunta principal: ${question || DEFAULT_ANALYSIS_QUESTION}`,
    "",
    "Métricas consolidadas:",
    JSON.stringify(summary),
    "",
    "Amostra das OS recentes:",
    JSON.stringify(compactOrders),
  ].join("\n");
};

export const isServiceOrderGeminiConfigured = () =>
  Boolean(getGeminiProxyUrl() || getGeminiApiKey());

export const generateServiceOrderInsight = async (
  orders: ServiceOrderRecord[],
  question = DEFAULT_ANALYSIS_QUESTION,
): Promise<ServiceOrderInsight> => {
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const summary = computeInsightSummary(sortedOrders);
  const generatedAt = new Date().toISOString();
  const prompt = buildPrompt(summary, sortedOrders, question);
  const proxyUrl = getGeminiProxyUrl();

  if (!proxyUrl && !getGeminiApiKey()) {
    return {
      generatedAt,
      provider: "fallback",
      text: buildFallbackText(summary, sortedOrders),
      summary,
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
          summary,
          orders: sortedOrders.slice(0, 25),
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
      summary,
    };
  } catch {
    return {
      generatedAt,
      provider: "fallback",
      text: buildFallbackText(summary, sortedOrders),
      summary,
    };
  }
};
