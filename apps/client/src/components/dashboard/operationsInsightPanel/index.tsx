import { useCallback, useEffect, useMemo, useState } from "react";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  DEFAULT_DASHBOARD_ANALYSIS_QUESTION,
  generateDashboardOperationsInsight,
  getDashboardOperationsSnapshot,
  isDashboardOperationsGeminiConfigured,
  type DashboardOperationsInsight,
  type DashboardOperationsSnapshot,
} from "../../../services/dashboardOperationsInsight";

type OperationsInsightPanelProps = {
  snapshot?: DashboardOperationsSnapshot | null;
  loadingSnapshot?: boolean;
  onRefreshSnapshot?: () =>
    | Promise<DashboardOperationsSnapshot | null | void>
    | DashboardOperationsSnapshot
    | null
    | void;
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

const AI_PROVIDER_LABEL: Record<DashboardOperationsInsight["provider"], string> = {
  gemini: "IA (Gemini)",
  fallback: "Resumo automático",
};

const AI_ENABLED = isDashboardOperationsGeminiConfigured();

export const OperationsInsightPanel: React.FC<OperationsInsightPanelProps> = ({
  snapshot: controlledSnapshot,
  loadingSnapshot: controlledLoadingSnapshot,
  onRefreshSnapshot,
}) => {
  const hasControlledSnapshot = typeof controlledSnapshot !== "undefined";
  const [question, setQuestion] = useState(DEFAULT_DASHBOARD_ANALYSIS_QUESTION);
  const [internalSnapshot, setInternalSnapshot] =
    useState<DashboardOperationsSnapshot | null>(null);
  const [insight, setInsight] = useState<DashboardOperationsInsight | null>(null);
  const [loadingInternalSnapshot, setLoadingInternalSnapshot] = useState(true);
  const [loadingExternalRefresh, setLoadingExternalRefresh] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const snapshot = hasControlledSnapshot ? controlledSnapshot ?? null : internalSnapshot;
  const loadingSnapshot = hasControlledSnapshot
    ? Boolean(controlledLoadingSnapshot)
    : loadingInternalSnapshot;

  const summary = snapshot?.summary ?? insight?.summary ?? null;

  const kpis = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      {
        label: "Clientes ativos",
        value: `${summary.activeCustomers}/${summary.totalCustomers}`,
      },
      {
        label: "OS",
        value: `${summary.totalServiceOrders}`,
      },
      {
        label: "Receita peças",
        value: formatCurrency(summary.totalServiceOrdersPartsValue),
      },
      {
        label: "Receita serviços",
        value: formatCurrency(summary.totalServiceOrdersServicesValue),
      },
      {
        label: "Assinaturas pendentes",
        value: `${summary.pendingSignatureServiceOrders + summary.pendingSharedOrders}`,
      },
      {
        label: "Agendamentos 7 dias",
        value: `${summary.upcomingAppointmentsNext7Days}`,
      },
      {
        label: "Notificações não lidas",
        value: `${summary.unreadNotifications}`,
      },
    ];
  }, [summary]);

  const refreshSnapshot = useCallback(async () => {
    setErrorMessage(null);

    if (onRefreshSnapshot) {
      setLoadingExternalRefresh(true);
      try {
        const nextSnapshot = await onRefreshSnapshot();
        if (nextSnapshot && !hasControlledSnapshot) {
          setInternalSnapshot(nextSnapshot);
        }

        return nextSnapshot ?? null;
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Não foi possível consolidar os dados operacionais.");
        }

        return null;
      } finally {
        setLoadingExternalRefresh(false);
      }
    }

    setLoadingInternalSnapshot(true);
    try {
      const nextSnapshot = await getDashboardOperationsSnapshot();
      setInternalSnapshot(nextSnapshot);
      return nextSnapshot;
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Não foi possível consolidar os dados operacionais.");
      }

      return null;
    } finally {
      setLoadingInternalSnapshot(false);
    }
  }, [hasControlledSnapshot, onRefreshSnapshot]);

  const handleGenerateInsight = useCallback(async () => {
    setLoadingInsight(true);
    setErrorMessage(null);

    try {
      const refreshedSnapshot = await refreshSnapshot();
      const latestSnapshot =
        refreshedSnapshot ?? snapshot ?? (await getDashboardOperationsSnapshot());

      const nextInsight = await generateDashboardOperationsInsight({
        question,
        snapshot: latestSnapshot,
      });
      setInsight(nextInsight);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Falha ao gerar a análise operacional.");
      }
    } finally {
      setLoadingInsight(false);
    }
  }, [question, refreshSnapshot, snapshot]);

  useEffect(() => {
    if (hasControlledSnapshot) {
      return;
    }

    void refreshSnapshot();
  }, [hasControlledSnapshot, refreshSnapshot]);

  const isBusy = loadingSnapshot || loadingExternalRefresh || loadingInsight;

  return (
    <Stack
      spacing={2}
      sx={{
        height: "100%",
        padding: 2,
      }}
    >
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {kpis.map((item) => (
          <Chip
            key={item.label}
            label={`${item.label}: ${item.value}`}
            size="small"
            variant="outlined"
          />
        ))}
      </Stack>

      {!AI_ENABLED ? (
        <Alert severity="info">
          IA externa não configurada. O painel exibirá análise automática baseada nos
          dados internos do sistema.
        </Alert>
      ) : null}

      {summary ? (
        <Typography variant="caption" color="text.secondary">
          Última atualização operacional: {formatDateTime(summary.lastOperationalUpdateAt)}
        </Typography>
      ) : null}

      <TextField
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        label="Pergunta para a IA"
        size="small"
        multiline
        minRows={2}
      />

      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          startIcon={<AutoAwesomeOutlinedIcon />}
          onClick={handleGenerateInsight}
          disabled={isBusy}
        >
          Gerar análise
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshOutlinedIcon />}
          onClick={() => void refreshSnapshot()}
          disabled={isBusy}
        >
          Atualizar dados
        </Button>
      </Stack>

      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

      <Box
        sx={{
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          backgroundColor: "background.default",
          flex: 1,
          minHeight: 0,
          padding: 2,
          overflowY: "auto",
        }}
      >
        {isBusy ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{ height: "100%" }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Processando dados operacionais...
            </Typography>
          </Stack>
        ) : insight ? (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Chip
                size="small"
                color={insight.provider === "gemini" ? "primary" : "default"}
                label={AI_PROVIDER_LABEL[insight.provider]}
              />
              <Typography variant="caption" color="text.secondary">
                Gerado em {formatDateTime(insight.generatedAt)}
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "pre-line",
                lineHeight: 1.6,
              }}
            >
              {insight.text}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Clique em &quot;Gerar análise&quot; para obter uma visão consolidada com IA de
            toda a operação.
          </Typography>
        )}
      </Box>
    </Stack>
  );
};
