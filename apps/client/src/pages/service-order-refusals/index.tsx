import { useEffect, useMemo, useState } from "react";
import { useNotification, useTranslate } from "@refinedev/core";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import {
  SERVICE_ORDER_SIGNATURES_UPDATED_EVENT,
  readSharedServiceOrders,
  toSharedServiceOrdersFromRecords,
  type SharedServiceOrder,
} from "../../services/serviceOrderSignature";
import {
  SERVICE_ORDERS_STORAGE_KEY,
  SERVICE_ORDERS_UPDATED_EVENT,
  isServiceOrdersBackendEnabled,
  listServiceOrdersApi,
  type ServiceOrderRecord,
  type ServiceOrderRecordStatus,
} from "../../services/serviceOrders";
import { Card, RefineListView } from "../../components";

type RefusalType = "part" | "labor" | "thirdParty";

type RefusalRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  vehicle: string;
  mechanicResponsible: string;
  type: RefusalType;
  description: string;
  amount: number;
  status: ServiceOrderRecordStatus;
  updatedAt: string;
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
  { label: string; color: "default" | "warning" | "success" }
> = {
  registered: {
    label: "Cadastrada",
    color: "default",
  },
  sent_for_signature: {
    label: "Pendente assinatura",
    color: "warning",
  },
  signed: {
    label: "Assinada",
    color: "success",
  },
};

const REFUSAL_TYPE_LABEL: Record<RefusalType, string> = {
  part: "Peça",
  labor: "Serviço",
  thirdParty: "Terceiro",
};

export const ServiceOrderRefusalsPage: React.FC = () => {
  const t = useTranslate();
  const { open } = useNotification();
  const serviceOrdersBackendEnabled = isServiceOrdersBackendEnabled();

  const [records, setRecords] = useState<ServiceOrderRecord[]>([]);
  const [sharedOrders, setSharedOrders] = useState<SharedServiceOrder[]>(() =>
    readSharedServiceOrders(),
  );
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ServiceOrderRecordStatus>(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<"all" | RefusalType>("all");
  const [selectedRow, setSelectedRow] = useState<RefusalRow | null>(null);

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
        message: "Falha ao carregar recusas",
        description: getErrorMessage(error),
      });
    }
  };

  useEffect(() => {
    void loadRecords(true);
  }, []);

  useEffect(() => {
    const refresh = () => {
      setSharedOrders(readSharedServiceOrders());
    };

    const handleSharedOrdersUpdate: EventListener = () => {
      refresh();
    };

    window.addEventListener(
      SERVICE_ORDER_SIGNATURES_UPDATED_EVENT,
      handleSharedOrdersUpdate,
    );

    return () => {
      window.removeEventListener(
        SERVICE_ORDER_SIGNATURES_UPDATED_EVENT,
        handleSharedOrdersUpdate,
      );
    };
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

  const rows = useMemo<RefusalRow[]>(() => {
    const sharedByToken = new Map(sharedOrders.map((order) => [order.token, order]));

    return records.flatMap((record) => {
      const linkedSharedOrder = record.signature?.token
        ? sharedByToken.get(record.signature.token)
        : undefined;

      const resolvedStatus: ServiceOrderRecordStatus =
        linkedSharedOrder?.status === "signed"
          ? "signed"
          : record.status === "signed"
            ? "signed"
            : linkedSharedOrder ||
                record.signature ||
                record.status === "sent_for_signature"
              ? "sent_for_signature"
              : "registered";

      const orderParts = linkedSharedOrder?.parts ?? record.parts;
      const orderLabor = linkedSharedOrder?.laborServices ?? record.laborServices;
      const orderThirdParty =
        linkedSharedOrder?.thirdPartyServices ?? record.thirdPartyServices;

      const base = {
        orderId: record.id,
        orderNumber: record.orderInfo.orderNumber,
        customerName: record.orderInfo.customerName,
        vehicle: record.orderInfo.vehicle,
        mechanicResponsible: record.orderInfo.mechanicResponsible,
        status: resolvedStatus,
        updatedAt: record.updatedAt,
      };

      const partRows: RefusalRow[] = orderParts
        .filter((part) => part.status === "declined")
        .map((part) => ({
          ...base,
          id: `${record.id}-part-${part.id}`,
          type: "part",
          description: part.description,
          amount: part.quantity * part.unitPrice,
        }));

      const laborRows: RefusalRow[] = orderLabor
        .filter((service) => service.status === "declined")
        .map((service) => ({
          ...base,
          id: `${record.id}-labor-${service.id}`,
          type: "labor",
          description: service.description,
          amount: service.amount,
        }));

      const thirdPartyRows: RefusalRow[] = orderThirdParty
        .filter((service) => service.status === "declined")
        .map((service) => ({
          ...base,
          id: `${record.id}-third-${service.id}`,
          type: "thirdParty",
          description: service.description,
          amount: service.amount,
        }));

      return [...partRows, ...laborRows, ...thirdPartyRows];
    });
  }, [records, sharedOrders]);

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== "all" && row.type !== typeFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        row.orderNumber.toLowerCase().includes(query) ||
        row.customerName.toLowerCase().includes(query) ||
        row.description.toLowerCase().includes(query) ||
        row.mechanicResponsible.toLowerCase().includes(query)
      );
    });
  }, [rows, searchValue, statusFilter, typeFilter]);

  const selectedRecord = useMemo(() => {
    if (!selectedRow) {
      return null;
    }

    return records.find((record) => record.id === selectedRow.orderId) ?? null;
  }, [records, selectedRow]);

  const summary = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.totalRefusals += 1;
        acc.totalRefusedValue += row.amount;

        if (row.status === "signed") {
          acc.signed += 1;
        }

        return acc;
      },
      {
        totalRefusals: 0,
        totalRefusedValue: 0,
        signed: 0,
      },
    );
  }, [filteredRows]);

  return (
    <RefineListView
      canCreate={false}
      title={t("serviceOrder.refusals", "Serviços Recusados")}
      headerButtons={() => (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip size="small" color="warning" label={`${summary.totalRefusals} recusas`} />
          <Chip size="small" color="success" label={`${summary.signed} assinadas`} />
          <Chip
            size="small"
            color="default"
            label={formatCurrency(summary.totalRefusedValue)}
          />
        </Stack>
      )}
    >
      <Stack spacing={3}>
        <Card
          title="Painel de Recusas"
          icon={<WarningAmberOutlinedIcon />}
          cardContentProps={{ sx: { p: 0 } }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ p: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="OS, cliente, item recusado, mecânico"
            />
            <TextField
              size="small"
              select
              label="Status da OS"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | ServiceOrderRecordStatus)
              }
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="registered">Cadastrada</MenuItem>
              <MenuItem value="sent_for_signature">Pendente assinatura</MenuItem>
              <MenuItem value="signed">Assinada</MenuItem>
            </TextField>
            <TextField
              size="small"
              select
              label="Tipo"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "all" | RefusalType)
              }
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="part">Peça</MenuItem>
              <MenuItem value="labor">Serviço</MenuItem>
              <MenuItem value="thirdParty">Terceiro</MenuItem>
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
                "& .MuiTableCell-root": {
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>OS</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length ? (
                  filteredRows.map((row) => {
                    const statusMeta = STATUS_META[row.status];

                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>#{row.orderNumber || "-"}</TableCell>
                        <TableCell>{row.customerName || "-"}</TableCell>
                        <TableCell>{REFUSAL_TYPE_LABEL[row.type]}</TableCell>
                        <TableCell>{formatCurrency(row.amount)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={statusMeta.color}
                            variant="outlined"
                            label={statusMeta.label}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="text"
                            color="primary"
                            onClick={() => setSelectedRow(row)}
                            startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                            sx={{
                              textTransform: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Ver detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2" color="text.secondary">
                        Nenhum item recusado encontrado com os filtros atuais.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card
          title="Resumo para atendimento"
          icon={<RuleOutlinedIcon />}
          cardContentProps={{ sx: { p: 3 } }}
        >
          <Typography variant="body2" color="text.secondary">
            Este painel facilita explicar para o cliente o que foi recusado e o impacto
            financeiro de cada item. Use os filtros por status para separar o que já foi
            assinado do que ainda está em negociação.
          </Typography>
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
            ? `Detalhes da Recusa • OS #${selectedRow.orderNumber || "-"}`
            : "Detalhes da Recusa"}
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
                  label={`Tipo: ${REFUSAL_TYPE_LABEL[selectedRow.type]}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Valor: ${formatCurrency(selectedRow.amount)}`}
                />
              </Stack>

              <Typography variant="body2">
                <b>Cliente:</b> {selectedRow.customerName || "-"}
              </Typography>
              <Typography variant="body2">
                <b>Veículo:</b> {selectedRow.vehicle || "-"}
              </Typography>
              <Typography variant="body2">
                <b>Mecânico responsável:</b> {selectedRow.mechanicResponsible || "-"}
              </Typography>
              <Typography variant="body2">
                <b>Item recusado:</b> {selectedRow.description || "-"}
              </Typography>
              <Typography variant="body2">
                <b>Atualizado em:</b> {formatDate(selectedRow.updatedAt)}
              </Typography>

              {selectedRecord ? (
                <>
                  <Divider />
                  <Typography variant="body2">
                    <b>Telefone:</b> {selectedRecord.orderInfo.phone || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <b>Data da OS:</b> {selectedRecord.orderInfo.date || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <b>Placa / Ano / KM:</b> {selectedRecord.orderInfo.plate || "-"} /{" "}
                    {selectedRecord.orderInfo.year || "-"} / {selectedRecord.orderInfo.km || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <b>Forma de pagamento:</b> {selectedRecord.orderInfo.paymentMethod || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <b>Observações:</b> {selectedRecord.orderInfo.notes || "-"}
                  </Typography>
                </>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRow(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </RefineListView>
  );
};
