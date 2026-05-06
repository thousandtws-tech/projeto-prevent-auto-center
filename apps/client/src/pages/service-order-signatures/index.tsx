import { useEffect, useMemo, useState } from "react";
import { useNotification, useTranslate } from "@refinedev/core";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
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
  type ServiceOrderRecord,
} from "../../services/serviceOrders";
import { Card, RefineListView } from "../../components";

type SignatureRow = {
  order: SharedServiceOrder;
  linkedRecord: ServiceOrderRecord | undefined;
  refusedCount: number;
  link: string;
};

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Erro inesperado";
};

export const ServiceOrderSignaturesPage: React.FC = () => {
  const t = useTranslate();
  const { open } = useNotification();
  const serviceOrdersBackendEnabled = isServiceOrdersBackendEnabled();

  const [sharedOrders, setSharedOrders] = useState<SharedServiceOrder[]>(() =>
    readSharedServiceOrders(),
  );
  const [records, setRecords] = useState<ServiceOrderRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "signed">(
    "all",
  );
  const [searchValue, setSearchValue] = useState("");
  const [selectedRow, setSelectedRow] = useState<SignatureRow | null>(null);
  const [deletingToken, setDeletingToken] = useState<string | null>(null);

  const loadServiceOrders = async (showError = false) => {
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
        message: "Falha ao carregar ordens de serviço",
        description: getErrorMessage(error),
      });
    }
  };

  useEffect(() => {
    void loadServiceOrders(true);
  }, []);

  useEffect(() => {
    const refresh = () => {
      setSharedOrders(readSharedServiceOrders());
    };

    const handleSharedOrdersUpdate: EventListener = () => {
      refresh();
    };

    const handleStorageUpdate = () => {
      refresh();
    };

    window.addEventListener(
      SERVICE_ORDER_SIGNATURES_UPDATED_EVENT,
      handleSharedOrdersUpdate,
    );
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(
        SERVICE_ORDER_SIGNATURES_UPDATED_EVENT,
        handleSharedOrdersUpdate,
      );
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  useEffect(() => {
    if (serviceOrdersBackendEnabled) {
      return;
    }

    const refresh = () => {
      void loadServiceOrders();
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

  const rows = useMemo<SignatureRow[]>(() => {
    const recordByToken = new Map<string, ServiceOrderRecord>();

    records.forEach((record) => {
      if (record.signature?.token) {
        recordByToken.set(record.signature.token, record);
      }
    });

    return sharedOrders.map((order) => {
      const linkedRecord = recordByToken.get(order.token);

      const refusedCount =
        order.parts.filter((part) => part.status === "declined").length +
        order.laborServices.filter((service) => service.status === "declined").length +
        order.thirdPartyServices.filter((service) => service.status === "declined")
          .length;

      return {
        order,
        linkedRecord,
        refusedCount,
        link: `${window.location.origin}/assinatura-os/${order.token}`,
      };
    });
  }, [records, sharedOrders]);

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return rows.filter(({ order, linkedRecord }) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        order.orderInfo.orderNumber.toLowerCase().includes(query) ||
        order.orderInfo.customerName.toLowerCase().includes(query) ||
        (linkedRecord?.orderInfo.mechanicResponsible ?? "").toLowerCase().includes(query)
      );
    });
  }, [rows, searchValue, statusFilter]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += 1;

        if (row.order.status === "signed") {
          acc.signed += 1;
        } else {
          acc.pending += 1;
        }

        acc.refused += row.refusedCount;

        return acc;
      },
      {
        total: 0,
        signed: 0,
        pending: 0,
        refused: 0,
      },
    );
  }, [rows]);

  const handleDeleteRow = async (row: SignatureRow) => {
    const orderLabel = row.order.orderInfo.orderNumber || row.order.token.slice(0, 8);
    const confirmed = window.confirm(
      `Deseja excluir a assinatura da OS #${orderLabel}? Essa ação remove o registro de assinatura e a OS vinculada (quando existir).`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingToken(row.order.token);

      if (!serviceOrdersBackendEnabled) {
        const removedShared = removeSharedServiceOrderByToken(row.order.token);
        if (!removedShared) {
          open?.({
            type: "error",
            message: "Não foi possível excluir a assinatura",
          });
          return;
        }
      }

      if (row.linkedRecord?.id) {
        const removedOrder = await removeServiceOrderApi(row.linkedRecord.id);
        if (!removedOrder) {
          open?.({
            type: "error",
            message: "Assinatura removida, mas a OS vinculada não foi excluída",
          });
        }
      }

      if (selectedRow?.order.token === row.order.token) {
        setSelectedRow(null);
      }

      await loadServiceOrders();
      if (!serviceOrdersBackendEnabled) {
        setSharedOrders(readSharedServiceOrders());
      }

      open?.({
        type: "success",
        message: `Assinatura da OS #${orderLabel} excluída com sucesso`,
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Erro ao excluir assinatura",
        description: getErrorMessage(error),
      });
    } finally {
      setDeletingToken(null);
    }
  };

  return (
    <RefineListView
      canCreate={false}
      title={t("serviceOrder.signatures", "Assinaturas Recebidas")}
      headerButtons={() => (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip size="small" color="success" label={`${summary.signed} assinadas`} />
          <Chip size="small" color="warning" label={`${summary.pending} pendentes`} />
          <Chip size="small" color="default" label={`${summary.refused} recusas`} />
        </Stack>
      )}
    >
      <Stack spacing={3}>
        <Card
          title="Controle de Assinaturas"
          icon={<VerifiedOutlinedIcon />}
          cardContentProps={{ sx: { p: 0 } }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ p: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="OS, cliente, mecânico"
            />
            <TextField
              size="small"
              select
              label="Status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | "pending" | "signed")
              }
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pending">Pendente</MenuItem>
              <MenuItem value="signed">Assinada</MenuItem>
            </TextField>
          </Stack>
          <Divider />
          <TableContainer
            sx={{
              maxHeight: 560,
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
                  <TableCell>Status</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Link</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length ? (
                  filteredRows.map((row) => {
                    const { order } = row;
                    return (
                      <TableRow key={order.token} hover>
                        <TableCell>#{order.orderInfo.orderNumber || "-"}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap title={order.orderInfo.customerName}>
                            {order.orderInfo.customerName || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={order.status === "signed" ? "Assinada" : "Pendente"}
                            color={order.status === "signed" ? "success" : "warning"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(order.totals.grandTotal)}</TableCell>
                        <TableCell>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={0.2}>
                            <IconButton
                              size="small"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(row.link);
                                  open?.({
                                    type: "success",
                                    message: "Link copiado",
                                  });
                                } catch {
                                  open?.({
                                    type: "error",
                                    message: "Falha ao copiar link",
                                  });
                                }
                              }}
                            >
                              <ContentCopyOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                window.open(row.link, "_blank", "noopener,noreferrer");
                              }}
                            >
                              <OpenInNewOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
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
                            <Button
                              size="small"
                              variant="text"
                              color="error"
                              disabled={deletingToken === row.order.token}
                              onClick={() => {
                                void handleDeleteRow(row);
                              }}
                              startIcon={
                                deletingToken === row.order.token ? (
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
                              {deletingToken === row.order.token ? "Excluindo..." : "Excluir"}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma assinatura encontrada com os filtros atuais.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card
          title="Ações Rápidas"
          icon={<LinkOutlinedIcon />}
          cardContentProps={{ sx: { p: 3 } }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<OpenInNewOutlinedIcon />}
              disabled={!filteredRows.length}
              onClick={() => {
                const first = filteredRows[0];
                if (!first) {
                  return;
                }
                const link = `${window.location.origin}/assinatura-os/${first.order.token}`;
                window.open(link, "_blank", "noopener,noreferrer");
              }}
            >
              Abrir primeira assinatura filtrada
            </Button>
          </Stack>
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
            ? `Detalhes da Assinatura • OS #${selectedRow.order.orderInfo.orderNumber || "-"}`
            : "Detalhes da Assinatura"}
        </DialogTitle>
        <DialogContent dividers>
          {selectedRow ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  size="small"
                  color={selectedRow.order.status === "signed" ? "success" : "warning"}
                  label={selectedRow.order.status === "signed" ? "Assinada" : "Pendente"}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Recusas: ${selectedRow.refusedCount}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Total: ${formatCurrency(selectedRow.order.totals.grandTotal)}`}
                />
              </Stack>

              <Stack spacing={0.8}>
                <Typography variant="caption" color="text.secondary">
                  Cliente / Contato
                </Typography>
                <Typography variant="body2">
                  {selectedRow.order.orderInfo.customerName || "-"} •{" "}
                  {selectedRow.order.orderInfo.phone || "-"}
                </Typography>
              </Stack>

              <Stack spacing={0.8}>
                <Typography variant="caption" color="text.secondary">
                  Veículo
                </Typography>
                <Typography variant="body2">
                  {selectedRow.order.orderInfo.vehicle || "-"} •{" "}
                  {selectedRow.order.orderInfo.year || "-"} •{" "}
                  {selectedRow.order.orderInfo.plate || "-"} • KM{" "}
                  {selectedRow.order.orderInfo.km || "-"}
                </Typography>
              </Stack>

              <Stack spacing={0.8}>
                <Typography variant="caption" color="text.secondary">
                  Mecânico responsável
                </Typography>
                <Typography variant="body2">
                  {selectedRow.linkedRecord?.orderInfo.mechanicResponsible ||
                    selectedRow.order.orderInfo.mechanicResponsible ||
                    "-"}
                </Typography>
              </Stack>

              <Divider />

              <Stack spacing={0.8}>
                <Typography variant="caption" color="text.secondary">
                  Assinatura
                </Typography>
                <Typography variant="body2">
                  {selectedRow.order.signature
                    ? `${selectedRow.order.signature.name} • ${formatDate(selectedRow.order.signature.signedAt)}`
                    : "Não assinada"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Link: {selectedRow.link}
                </Typography>
              </Stack>

              <Divider />

              <Stack spacing={0.8}>
                <Typography variant="caption" color="text.secondary">
                  Totais
                </Typography>
                <Typography variant="body2">
                  Peças: {formatCurrency(selectedRow.order.totals.partsSubtotal)}
                </Typography>
                <Typography variant="body2">
                  Serviços: {formatCurrency(selectedRow.order.totals.laborSubtotal)}
                </Typography>
                <Typography variant="body2">
                  Terceiros: {formatCurrency(selectedRow.order.totals.thirdPartySubtotal)}
                </Typography>
                <Typography variant="body2">
                  Desconto: {formatCurrency(selectedRow.order.discount)}
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  Total geral: {formatCurrency(selectedRow.order.totals.grandTotal)}
                </Typography>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography fontWeight={700}>Peças</Typography>
                {selectedRow.order.parts.length ? (
                  selectedRow.order.parts.map((part) => (
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
                {selectedRow.order.laborServices.length ? (
                  selectedRow.order.laborServices.map((service) => (
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
                <Typography fontWeight={700}>Terceiros</Typography>
                {selectedRow.order.thirdPartyServices.length ? (
                  selectedRow.order.thirdPartyServices.map((service) => (
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
                <b>Observações:</b> {selectedRow.order.orderInfo.notes || "-"}
              </Typography>
            </Stack>
          ) : null}
      </DialogContent>
      <DialogActions>
        <Button
          color="error"
          disabled={!selectedRow || deletingToken === selectedRow?.order.token}
          onClick={() => {
            if (!selectedRow) {
              return;
            }

            void handleDeleteRow(selectedRow);
          }}
        >
          {selectedRow && deletingToken === selectedRow.order.token
            ? "Excluindo..."
            : "Excluir assinatura"}
        </Button>
        <Button onClick={() => setSelectedRow(null)}>Fechar</Button>
      </DialogActions>
    </Dialog>
    </RefineListView>
  );
};
