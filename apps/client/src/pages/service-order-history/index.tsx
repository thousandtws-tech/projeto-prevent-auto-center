import { useEffect, useMemo, useState } from "react";
import { useNotification, useTranslate } from "@refinedev/core";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  removeSharedServiceOrderByToken,
  SERVICE_ORDER_SIGNATURES_UPDATED_EVENT,
  readSharedServiceOrders,
  toSharedServiceOrdersFromRecords,
  type SharedServiceOrder,
} from "../../services/serviceOrderSignature";
import {
  removeServiceOrderApi,
  SERVICE_ORDERS_STORAGE_KEY,
  SERVICE_ORDERS_UPDATED_EVENT,
  isServiceOrdersBackendEnabled,
  listServiceOrdersApi,
  updateServiceOrderApi,
  type ServiceOrderRecord,
  type ServiceOrderRecordStatus,
} from "../../services/serviceOrders";
import {
  generateServiceOrderInsight,
  isServiceOrderGeminiConfigured,
  type ServiceOrderInsight,
} from "../../services/serviceOrderGemini";
import { Card, RefineListView } from "../../components";
import { useNavigate } from "react-router";

type HistoryRow = ServiceOrderRecord & {
  status: ServiceOrderRecordStatus;
  signatureText: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (value: string) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("pt-BR");
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Erro inesperado";
};

const STATUS_META: Record<
  ServiceOrderRecordStatus,
  {
    label: string;
    color: "default" | "warning" | "success";
  }
> = {
  registered: {
    label: "Cadastrada",
    color: "default",
  },
  sent_for_signature: {
    label: "Aguardando assinatura",
    color: "warning",
  },
  signed: {
    label: "Fechada / assinada",
    color: "success",
  },
};

const getDeclinedItemsCount = (row: HistoryRow) =>
  row.parts.filter((part) => part.status === "declined").length +
  row.laborServices.filter((service) => service.status === "declined").length +
  row.thirdPartyServices.filter((service) => service.status === "declined").length;

type HistoryRowFinancialBreakdown = {
  partsApprovedValue: number;
  laborApprovedValue: number;
  thirdPartyApprovedValue: number;
  declinedValue: number;
};

const getHistoryRowFinancialBreakdown = (
  row: HistoryRow,
): HistoryRowFinancialBreakdown => {
  const partsApprovedValue = row.parts.reduce(
    (total, part) =>
      total + (part.status === "approved" ? part.quantity * part.unitPrice : 0),
    0,
  );
  const partsDeclinedValue = row.parts.reduce(
    (total, part) =>
      total + (part.status === "declined" ? part.quantity * part.unitPrice : 0),
    0,
  );

  const laborApprovedValue = row.laborServices.reduce(
    (total, service) => total + (service.status === "approved" ? service.amount : 0),
    0,
  );
  const laborDeclinedValue = row.laborServices.reduce(
    (total, service) => total + (service.status === "declined" ? service.amount : 0),
    0,
  );

  const thirdPartyApprovedValue = row.thirdPartyServices.reduce(
    (total, service) => total + (service.status === "approved" ? service.amount : 0),
    0,
  );
  const thirdPartyDeclinedValue = row.thirdPartyServices.reduce(
    (total, service) => total + (service.status === "declined" ? service.amount : 0),
    0,
  );

  return {
    partsApprovedValue,
    laborApprovedValue,
    thirdPartyApprovedValue,
    declinedValue:
      partsDeclinedValue + laborDeclinedValue + thirdPartyDeclinedValue,
  };
};

const formatOrderDate = (value: string) => {
  if (!value) {
    return "-";
  }

  const parsed = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("pt-BR");
};

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getSearchableText = (row: HistoryRow) =>
  normalizeSearchText(
    [
      row.id,
      row.orderInfo.orderNumber,
      row.orderInfo.date,
      formatOrderDate(row.orderInfo.date),
      row.orderInfo.customerName,
      row.orderInfo.phone,
      row.orderInfo.vehicle,
      row.orderInfo.plate,
      row.orderInfo.year,
      row.orderInfo.km,
      row.orderInfo.mechanicResponsible,
      row.orderInfo.paymentMethod,
      row.orderInfo.notes,
      STATUS_META[row.status].label,
      row.status === "signed" ? "fechada fechado assinada assinado" : "",
      ...Object.entries(row.checklist)
        .filter(([, checked]) => checked)
        .map(([item]) => item),
    ].join(" "),
  );

export const ServiceOrderHistoryPage: React.FC = () => {
  const t = useTranslate();
  const { open } = useNotification();
  const navigate = useNavigate();
  const serviceOrdersBackendEnabled = isServiceOrdersBackendEnabled();

  const [records, setRecords] = useState<ServiceOrderRecord[]>([]);
  const [sharedOrders, setSharedOrders] = useState<SharedServiceOrder[]>(() =>
    readSharedServiceOrders(),
  );
  const [statusFilter, setStatusFilter] = useState<"all" | ServiceOrderRecordStatus>(
    "all",
  );
  const [searchValue, setSearchValue] = useState("");
  const [selectedRow, setSelectedRow] = useState<HistoryRow | null>(null);
  const [insightQuestion, setInsightQuestion] = useState("");
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [insight, setInsight] = useState<ServiceOrderInsight | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [reopeningOrderId, setReopeningOrderId] = useState<string | null>(null);

  const geminiConfigured = isServiceOrderGeminiConfigured();

  const loadRecords = async (showError = false) => {
    try {
      const response = await listServiceOrdersApi();
      setRecords(response);
      if (serviceOrdersBackendEnabled) {
        setSharedOrders(toSharedServiceOrdersFromRecords(response));
      }
    } catch (error) {
      if (!showError) {
        return;
      }

      open?.({
        type: "error",
        message: "Falha ao carregar histórico de OS",
        description: getErrorMessage(error),
      });
    }
  };

  useEffect(() => {
    void loadRecords(true);
  }, []);

  useEffect(() => {
    if (serviceOrdersBackendEnabled) {
      return;
    }

    const refresh = () => {
      void loadRecords();
    };

    const handleOrdersUpdate: EventListener = () => {
      refresh();
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (!event.key || event.key === SERVICE_ORDERS_STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener(SERVICE_ORDERS_UPDATED_EVENT, handleOrdersUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(SERVICE_ORDERS_UPDATED_EVENT, handleOrdersUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [serviceOrdersBackendEnabled]);

  useEffect(() => {
    const refresh = () => {
      setSharedOrders(readSharedServiceOrders());
    };

    const handleSharedUpdate: EventListener = () => {
      refresh();
    };

    const handleStorageUpdate = () => {
      refresh();
    };

    window.addEventListener(
      SERVICE_ORDER_SIGNATURES_UPDATED_EVENT,
      handleSharedUpdate,
    );
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(
        SERVICE_ORDER_SIGNATURES_UPDATED_EVENT,
        handleSharedUpdate,
      );
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  const rows = useMemo<HistoryRow[]>(() => {
    const sharedByToken = new Map(sharedOrders.map((order) => [order.token, order]));

    return records.map((record) => {
      const linkedSharedOrder = record.signature?.token
        ? sharedByToken.get(record.signature.token)
        : undefined;

      const status: ServiceOrderRecordStatus =
        linkedSharedOrder?.status === "signed"
          ? "signed"
          : record.status === "signed"
            ? "signed"
            : linkedSharedOrder ||
                record.signature ||
                record.status === "sent_for_signature"
              ? "sent_for_signature"
              : "registered";

      const signerName = linkedSharedOrder?.signature?.name || record.signature?.signerName;
      const signedAt = linkedSharedOrder?.signature?.signedAt || record.signature?.signedAt;
      const signatureText =
        signerName && signedAt ? `${signerName} • ${formatDate(signedAt)}` : "-";

      return {
        ...record,
        status,
        signatureText,
        parts: linkedSharedOrder?.parts ?? record.parts,
        laborServices: linkedSharedOrder?.laborServices ?? record.laborServices,
        thirdPartyServices:
          linkedSharedOrder?.thirdPartyServices ?? record.thirdPartyServices,
        totals: linkedSharedOrder?.totals
          ? { ...record.totals, ...linkedSharedOrder.totals }
          : record.totals,
      };
    });
  }, [records, sharedOrders]);

  const filteredRows = useMemo(() => {
    const queryTokens = normalizeSearchText(searchValue.trim())
      .split(/\s+/)
      .filter(Boolean);

    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }

      if (!queryTokens.length) {
        return true;
      }

      const searchableText = getSearchableText(row);
      return queryTokens.every((token) => searchableText.includes(token));
    });
  }, [rows, searchValue, statusFilter]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.totalOrders += 1;
        acc.totalValue += row.totals.grandTotal;

        if (row.status === "signed") {
          acc.signed += 1;
        } else if (row.status === "sent_for_signature") {
          acc.pendingSignature += 1;
        }

        acc.refusedItems += getDeclinedItemsCount(row);
        return acc;
      },
      {
        totalOrders: 0,
        signed: 0,
        pendingSignature: 0,
        refusedItems: 0,
        totalValue: 0,
      },
    );
  }, [rows]);

  const spreadsheetSummary = useMemo(() => {
    const totals = filteredRows.reduce(
      (acc, row) => {
        const breakdown = getHistoryRowFinancialBreakdown(row);

        acc.partsApprovedValue += breakdown.partsApprovedValue;
        acc.laborApprovedValue += breakdown.laborApprovedValue;
        acc.thirdPartyApprovedValue += breakdown.thirdPartyApprovedValue;
        acc.discountValue += row.discount;
        acc.declinedValue += breakdown.declinedValue;
        acc.grandTotal += row.totals.grandTotal;
        return acc;
      },
      {
        partsApprovedValue: 0,
        laborApprovedValue: 0,
        thirdPartyApprovedValue: 0,
        discountValue: 0,
        declinedValue: 0,
        grandTotal: 0,
      },
    );

    return {
      ...totals,
      totalOrders: filteredRows.length,
      averageTicket: filteredRows.length
        ? (totals.laborApprovedValue + totals.thirdPartyApprovedValue) /
          filteredRows.length
        : 0,
      servicesRevenue:
        totals.laborApprovedValue + totals.thirdPartyApprovedValue,
      partsRevenue: totals.partsApprovedValue,
    };
  }, [filteredRows]);

  const handleGenerateInsight = async () => {
    try {
      setIsGeneratingInsight(true);
      const generated = await generateServiceOrderInsight(
        rows,
        insightQuestion.trim(),
      );
      setInsight(generated);
      open?.({
        type: "success",
        message:
          generated.provider === "gemini"
            ? "Análise IA gerada com Gemini"
            : "Análise gerada com fallback local",
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao gerar análise",
        description: getErrorMessage(error),
      });
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const handleDeleteRecord = async (row: HistoryRow) => {
    const orderLabel = row.orderInfo.orderNumber || row.id.slice(0, 8);
    const confirmed = window.confirm(
      `Deseja excluir a OS #${orderLabel}? Essa ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingOrderId(row.id);

      const removed = await removeServiceOrderApi(row.id);
      if (!removed) {
        open?.({
          type: "error",
          message: "Não foi possível excluir a OS",
        });
        return;
      }

      if (!serviceOrdersBackendEnabled && row.signature?.token) {
        removeSharedServiceOrderByToken(row.signature.token);
      }

      if (selectedRow?.id === row.id) {
        setSelectedRow(null);
      }

      await loadRecords();
      if (!serviceOrdersBackendEnabled) {
        setSharedOrders(readSharedServiceOrders());
      }

      open?.({
        type: "success",
        message: `OS #${orderLabel} excluída com sucesso`,
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Erro ao excluir OS",
        description: getErrorMessage(error),
      });
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleReopenRecord = async (row: HistoryRow) => {
    const orderLabel = row.orderInfo.orderNumber || row.id.slice(0, 8);
    const confirmed = window.confirm(
      `Deseja reabrir a OS #${orderLabel}? Ela voltará para cadastrada e a assinatura será removida.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setReopeningOrderId(row.id);

      const reopened = await updateServiceOrderApi(row.id, {
        status: "registered",
        orderInfo: row.orderInfo,
        checklist: row.checklist,
        parts: row.parts,
        laborServices: row.laborServices,
        thirdPartyServices: row.thirdPartyServices,
        discount: row.discount,
        totals: row.totals,
        signature: null,
      });

      if (!reopened) {
        open?.({
          type: "error",
          message: "Não foi possível reabrir a OS",
        });
        return;
      }

      if (!serviceOrdersBackendEnabled && row.signature?.token) {
        removeSharedServiceOrderByToken(row.signature.token);
      }

      await loadRecords();
      if (!serviceOrdersBackendEnabled) {
        setSharedOrders(readSharedServiceOrders());
      }

      setSelectedRow((current) =>
        current?.id === row.id
          ? {
              ...current,
              ...reopened,
              status: "registered",
              signatureText: "-",
            }
          : current,
      );

      open?.({
        type: "success",
        message: `OS #${orderLabel} reaberta com sucesso`,
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Erro ao reabrir OS",
        description: getErrorMessage(error),
      });
    } finally {
      setReopeningOrderId(null);
    }
  };

  return (
    <RefineListView
      canCreate={false}
      title={t("serviceOrder.history", "Histórico de Ordens")}
      headerButtons={() => (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            size="small"
            color="success"
            variant="outlined"
            label={`${summary.signed} assinadas`}
          />
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            label={`${summary.pendingSignature} pendentes`}
          />
          <Chip
            size="small"
            color="default"
            variant="outlined"
            label={`${summary.refusedItems} recusas`}
          />
        </Stack>
      )}
    >
      <Stack spacing={3}>
        <Card
          title="Análise IA Gemini"
          icon={<AutoAwesomeOutlinedIcon />}
          cardContentProps={{ sx: { p: 3 } }}
        >
          <Stack spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              label="Pergunta para a IA (opcional)"
              value={insightQuestion}
              onChange={(event) => setInsightQuestion(event.target.value)}
              placeholder="Ex: Quais itens da planilha têm maior recusa e como reduzir?"
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                startIcon={<AutoAwesomeOutlinedIcon />}
                onClick={() => {
                  void handleGenerateInsight();
                }}
                disabled={isGeneratingInsight}
              >
                {isGeneratingInsight ? "Gerando análise..." : "Gerar análise"}
              </Button>
              {isGeneratingInsight ? <CircularProgress size={18} /> : null}
            </Stack>

            {insight ? (
              <Paper variant="outlined" sx={{ p: 2, whiteSpace: "pre-wrap" }}>
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary">
                    Gerado em {formatDate(insight.generatedAt)} •{" "}
                    {insight.provider === "gemini"
                      ? "Gemini"
                      : "Fallback local"}
                  </Typography>
                  <Typography variant="body2">{insight.text}</Typography>
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        </Card>

        <Grid container columns={24} spacing={2}>
          <Grid size={{ xs: 24, md: 8 }}>
            <Card
              title="Ordens"
              icon={<HistoryOutlinedIcon />}
              cardContentProps={{ sx: { p: 2.5 } }}
            >
              <Typography variant="h4" fontWeight={800}>
                {summary.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de ordens registradas.
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 24, md: 8 }}>
            <Card
              title="Valor Aprovado"
              icon={<MonetizationOnOutlinedIcon />}
              cardContentProps={{ sx: { p: 2.5 } }}
            >
              <Typography variant="h4" fontWeight={800}>
                {formatCurrency(summary.totalValue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Soma dos totais aprovados em OS.
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 24, md: 8 }}>
            <Card
              title="Itens Recusados"
              icon={<RuleOutlinedIcon />}
              cardContentProps={{ sx: { p: 2.5 } }}
            >
              <Typography variant="h4" fontWeight={800}>
                {summary.refusedItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Peças e serviços recusados por clientes.
              </Typography>
            </Card>
          </Grid>
        </Grid>

        <Card
          title="Análise da Planilha de OS"
          icon={<HistoryOutlinedIcon />}
          cardContentProps={{ sx: { p: 0 } }}
        >
          <Stack spacing={1.5} sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`${spreadsheetSummary.totalOrders} OS no filtro`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`Ticket médio serviços: ${formatCurrency(spreadsheetSummary.averageTicket)}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`Receita peças: ${formatCurrency(spreadsheetSummary.partsRevenue)}`}
              />
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={`Receita serviços: ${formatCurrency(spreadsheetSummary.servicesRevenue)}`}
              />
              <Chip
                size="small"
                color="default"
                variant="outlined"
                label={`Valor recusado: ${formatCurrency(spreadsheetSummary.declinedValue)}`}
              />
            </Stack>
          </Stack>
          <Divider />
          <TableContainer sx={{ maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>OS</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Veículo / Placa</TableCell>
                  <TableCell align="right">Peças</TableCell>
                  <TableCell align="right">Serviços</TableCell>
                  <TableCell align="right">Terceiros</TableCell>
                  <TableCell align="right">Desconto</TableCell>
                  <TableCell align="right">Recusado</TableCell>
                  <TableCell align="right">Total OS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length ? (
                  filteredRows.map((row) => {
                    const breakdown = getHistoryRowFinancialBreakdown(row);
                    return (
                      <TableRow key={`sheet-${row.id}`} hover>
                        <TableCell>#{row.orderInfo.orderNumber || "-"}</TableCell>
                        <TableCell>{formatOrderDate(row.orderInfo.date)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap title={row.orderInfo.customerName}>
                            {row.orderInfo.customerName || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            noWrap
                            title={`${row.orderInfo.vehicle || "-"} / ${row.orderInfo.plate || "-"}`}
                          >
                            {row.orderInfo.vehicle || "-"} / {row.orderInfo.plate || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(breakdown.partsApprovedValue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(breakdown.laborApprovedValue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(breakdown.thirdPartyApprovedValue)}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(row.discount)}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(breakdown.declinedValue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(row.totals.grandTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma ordem encontrada com os filtros atuais.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {filteredRows.length ? (
                  <TableRow
                    sx={{
                      backgroundColor: (theme) => theme.palette.action.hover,
                    }}
                  >
                    <TableCell colSpan={4}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Totais do filtro
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatCurrency(spreadsheetSummary.partsApprovedValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatCurrency(spreadsheetSummary.laborApprovedValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatCurrency(spreadsheetSummary.thirdPartyApprovedValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatCurrency(spreadsheetSummary.discountValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatCurrency(spreadsheetSummary.declinedValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatCurrency(spreadsheetSummary.grandTotal)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card
          title="Tabela de Histórico"
          icon={<HistoryOutlinedIcon />}
          cardContentProps={{ sx: { p: 0 } }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ p: 2 }}>
            <TextField
              size="small"
              label="Buscar"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="OS, cliente, telefone, carro, placa, mecânico, status"
              fullWidth
            />
            <TextField
              size="small"
              select
              label="Status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | ServiceOrderRecordStatus)
              }
              sx={{ minWidth: 210 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="registered">Cadastrada</MenuItem>
              <MenuItem value="sent_for_signature">Aguardando assinatura</MenuItem>
              <MenuItem value="signed">Fechadas / assinadas</MenuItem>
            </TextField>
          </Stack>
          <Divider />
          <TableContainer
            sx={{
              maxHeight: 520,
              overflowX: "hidden",
            }}
          >
            <Table
              size="small"
              stickyHeader
              sx={{
                width: "100%",
                tableLayout: "fixed",
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>OS</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Carro / Placa</TableCell>
                  <TableCell>Mecânico</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Recusas</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Atualizado em</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length ? (
                  filteredRows.map((row) => {
                    const statusMeta = STATUS_META[row.status];
                    const declinedItems = getDeclinedItemsCount(row);

                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>#{row.orderInfo.orderNumber || "-"}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap title={row.orderInfo.customerName}>
                            {row.orderInfo.customerName || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            noWrap
                            title={`${row.orderInfo.vehicle || "-"} / ${row.orderInfo.plate || "-"}`}
                          >
                            {row.orderInfo.vehicle || "-"} / {row.orderInfo.plate || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            noWrap
                            title={row.orderInfo.mechanicResponsible}
                          >
                            {row.orderInfo.mechanicResponsible || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={statusMeta.color}
                            label={statusMeta.label}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {declinedItems ? `${declinedItems} item(ns)` : "-"}
                        </TableCell>
                        <TableCell>{formatCurrency(row.totals.grandTotal)}</TableCell>
                        <TableCell>{formatDate(row.updatedAt)}</TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                            justifyContent="flex-end"
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Button
                              size="small"
                              variant="text"
                              color="primary"
                              onClick={() =>
                                navigate(
                                  `/ordem-servico?serviceOrderId=${encodeURIComponent(row.id)}`,
                                )
                              }
                              startIcon={<EditOutlinedIcon fontSize="small" />}
                              sx={{
                                textTransform: "none",
                                whiteSpace: "nowrap",
                                minHeight: 32,
                                alignItems: "center",
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              color="primary"
                              onClick={() => setSelectedRow(row)}
                              startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                              sx={{
                                textTransform: "none",
                                whiteSpace: "nowrap",
                                minHeight: 32,
                                alignItems: "center",
                              }}
                            >
                              Ver detalhes
                            </Button>
                            {row.status === "signed" ? (
                              <Button
                                size="small"
                                variant="text"
                                color="warning"
                                disabled={reopeningOrderId === row.id}
                                onClick={() => {
                                  void handleReopenRecord(row);
                                }}
                                startIcon={
                                  reopeningOrderId === row.id ? (
                                    <CircularProgress size={14} color="inherit" />
                                  ) : (
                                    <AutorenewOutlinedIcon fontSize="small" />
                                  )
                                }
                                sx={{
                                  textTransform: "none",
                                  whiteSpace: "nowrap",
                                  minHeight: 32,
                                  alignItems: "center",
                                }}
                              >
                                {reopeningOrderId === row.id
                                  ? "Reabrindo..."
                                  : "Reabrir"}
                              </Button>
                            ) : null}
                            <Button
                              size="small"
                              variant="text"
                              color="error"
                              disabled={deletingOrderId === row.id}
                              onClick={() => {
                                void handleDeleteRecord(row);
                              }}
                              startIcon={
                                deletingOrderId === row.id ? (
                                  <CircularProgress size={14} color="inherit" />
                                ) : (
                                  <DeleteOutlineOutlinedIcon fontSize="small" />
                                )
                              }
                              sx={{
                                textTransform: "none",
                                whiteSpace: "nowrap",
                                minHeight: 32,
                                alignItems: "center",
                              }}
                            >
                              {deletingOrderId === row.id ? "Excluindo..." : "Excluir"}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma ordem encontrada com os filtros atuais.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Stack>

      <Dialog
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {selectedRow
            ? `Detalhes da OS #${selectedRow.orderInfo.orderNumber || "-"}`
            : "Detalhes da OS"}
        </DialogTitle>
        <DialogContent dividers>
          {selectedRow ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  size="small"
                  color={STATUS_META[selectedRow.status].color}
                  label={STATUS_META[selectedRow.status].label}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Recusas: ${getDeclinedItemsCount(selectedRow)}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Total: ${formatCurrency(selectedRow.totals.grandTotal)}`}
                />
              </Stack>

              <Grid container columns={12} spacing={1.5}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body2">
                    {selectedRow.orderInfo.customerName || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Telefone
                  </Typography>
                  <Typography variant="body2">{selectedRow.orderInfo.phone || "-"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Mecânico responsável
                  </Typography>
                  <Typography variant="body2">
                    {selectedRow.orderInfo.mechanicResponsible || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Veículo
                  </Typography>
                  <Typography variant="body2">{selectedRow.orderInfo.vehicle || "-"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Ano / Placa / KM
                  </Typography>
                  <Typography variant="body2">
                    {selectedRow.orderInfo.year || "-"} / {selectedRow.orderInfo.plate || "-"} /{" "}
                    {selectedRow.orderInfo.km || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Atualizado em
                  </Typography>
                  <Typography variant="body2">{formatDate(selectedRow.updatedAt)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Pagamento
                  </Typography>
                  <Typography variant="body2">
                    {selectedRow.orderInfo.paymentMethod || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="caption" color="text.secondary">
                    Assinatura
                  </Typography>
                  <Typography variant="body2">{selectedRow.signatureText}</Typography>
                </Grid>
              </Grid>

              <Divider />

              <Stack spacing={0.8}>
                <Typography fontWeight={700}>Checklist</Typography>
                <Typography variant="body2">
                  {Object.entries(selectedRow.checklist)
                    .filter(([, checked]) => checked)
                    .map(([item]) => item)
                    .join(", ") || "Nenhum item marcado"}
                </Typography>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography fontWeight={700}>Peças</Typography>
                {selectedRow.parts.length ? (
                  selectedRow.parts.map((part) => (
                    <Typography key={part.id} variant="body2">
                      {part.description || "Peça sem descrição"} • {part.quantity}x{" "}
                      {formatCurrency(part.unitPrice)} •{" "}
                      {part.status === "declined" ? "Recusada" : "Aprovada"}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">Nenhuma peça cadastrada.</Typography>
                )}
              </Stack>

              <Stack spacing={1}>
                <Typography fontWeight={700}>Serviços</Typography>
                {selectedRow.laborServices.length ? (
                  selectedRow.laborServices.map((service) => (
                    <Typography key={service.id} variant="body2">
                      {service.description || "Serviço sem descrição"} •{" "}
                      {formatCurrency(service.amount)} •{" "}
                      {service.status === "declined" ? "Recusado" : "Aprovado"}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">Nenhum serviço cadastrado.</Typography>
                )}
              </Stack>

              <Stack spacing={1}>
                <Typography fontWeight={700}>Serviços de Terceiros</Typography>
                {selectedRow.thirdPartyServices.length ? (
                  selectedRow.thirdPartyServices.map((service) => (
                    <Typography key={service.id} variant="body2">
                      {service.description || "Serviço sem descrição"} •{" "}
                      {formatCurrency(service.amount)} •{" "}
                      {service.status === "declined" ? "Recusado" : "Aprovado"}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">
                    Nenhum serviço de terceiros cadastrado.
                  </Typography>
                )}
              </Stack>

              <Divider />

              <Typography variant="body2">
                <b>Observações:</b> {selectedRow.orderInfo.notes || "-"}
              </Typography>
            </Stack>
          ) : null}
      </DialogContent>
      <DialogActions>
        {selectedRow?.status === "signed" ? (
          <Button
            color="warning"
            disabled={reopeningOrderId === selectedRow.id}
            startIcon={
              reopeningOrderId === selectedRow.id ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <AutorenewOutlinedIcon fontSize="small" />
              )
            }
            onClick={() => {
              void handleReopenRecord(selectedRow);
            }}
          >
            {reopeningOrderId === selectedRow.id ? "Reabrindo..." : "Reabrir OS"}
          </Button>
        ) : null}
        <Button
          color="error"
          disabled={!selectedRow || deletingOrderId === selectedRow?.id}
          onClick={() => {
            if (!selectedRow) {
              return;
            }

            void handleDeleteRecord(selectedRow);
          }}
        >
          {selectedRow && deletingOrderId === selectedRow.id
            ? "Excluindo..."
            : "Excluir OS"}
        </Button>
        <Button onClick={() => setSelectedRow(null)}>Fechar</Button>
      </DialogActions>
    </Dialog>
    </RefineListView>
  );
};
