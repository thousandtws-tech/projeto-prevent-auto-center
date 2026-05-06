import { useEffect, useMemo, useState } from "react";
import { useNotification } from "@refinedev/core";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { Card, RefineListView } from "../../components";
import {
  createFinancialTransactionApi,
  getFinancialSummaryApi,
  listFinancialTransactionsApi,
  removeFinancialTransactionApi,
  updateFinancialTransactionApi,
  type FinancialSummary,
  type FinancialTransaction,
  type FinancialTransactionPayload,
  type FinancialTransactionStatus,
  type FinancialTransactionType,
} from "../../services/financial";
import { listSuppliersApi, type Supplier } from "../../services/suppliers";

const EMPTY_FORM: FinancialTransactionPayload = {
  type: "expense",
  status: "pending",
  description: "",
  category: "",
  paymentMethod: "",
  amount: 0,
  dueDate: "",
  paidAt: null,
  supplierId: null,
  serviceOrderId: null,
  notes: "",
};

const EMPTY_SUMMARY: FinancialSummary = {
  serviceOrderRevenue: 0,
  manualIncome: 0,
  pendingIncome: 0,
  paidExpenses: 0,
  pendingExpenses: 0,
  balance: 0,
  projectedBalance: 0,
  serviceOrders: 0,
  paidTransactions: 0,
  pendingTransactions: 0,
  categoryTotals: [],
};

const typeLabel: Record<FinancialTransactionType, string> = {
  income: "Receita",
  expense: "Despesa",
};

const statusLabel: Record<FinancialTransactionStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  canceled: "Cancelado",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const formatDate = (value?: string | null) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "-";

const getErrorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "Erro inesperado";

export const FinancialPage: React.FC = () => {
  const { open } = useNotification();
  const [summary, setSummary] = useState<FinancialSummary>(EMPTY_SUMMARY);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filter, setFilter] = useState<"all" | FinancialTransactionType>("all");
  const [form, setForm] = useState<FinancialTransactionPayload>(EMPTY_FORM);
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const [summaryResponse, transactionsResponse, suppliersResponse] =
        await Promise.all([
          getFinancialSummaryApi(),
          listFinancialTransactionsApi(),
          listSuppliersApi(),
        ]);
      setSummary(summaryResponse);
      setTransactions(transactionsResponse);
      setSuppliers(suppliersResponse);
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao carregar financeiro",
        description: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visibleTransactions = useMemo(
    () =>
      transactions.filter((transaction) =>
        filter === "all" ? true : transaction.type === filter,
      ),
    [transactions, filter],
  );

  const supplierNameById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])),
    [suppliers],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openEdit = (item: FinancialTransaction) => {
    setEditing(item);
    setForm({
      type: item.type,
      status: item.status,
      description: item.description,
      category: item.category,
      paymentMethod: item.paymentMethod,
      amount: item.amount,
      dueDate: item.dueDate ?? "",
      paidAt: item.paidAt,
      supplierId: item.supplierId,
      serviceOrderId: item.serviceOrderId,
      notes: item.notes,
    });
    setIsDialogOpen(true);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const body = {
        ...form,
        amount: Number(form.amount) || 0,
        dueDate: form.dueDate || null,
        paidAt:
          form.status === "paid"
            ? form.paidAt ?? new Date().toISOString()
            : null,
        supplierId: form.supplierId || null,
        serviceOrderId: form.serviceOrderId || null,
      };
      if (editing) {
        await updateFinancialTransactionApi(editing.id, body);
      } else {
        await createFinancialTransactionApi(body);
      }
      setIsDialogOpen(false);
      await load();
      open?.({ type: "success", message: "Lançamento salvo" });
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao salvar lançamento",
        description: getErrorMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (item: FinancialTransaction) => {
    if (!window.confirm(`Remover lançamento "${item.description}"?`)) {
      return;
    }
    try {
      await removeFinancialTransactionApi(item.id);
      await load();
      open?.({ type: "success", message: "Lançamento removido" });
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao remover lançamento",
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <RefineListView
      canCreate={false}
      title="Financeiro"
      headerButtons={() => (
        <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
          Novo lançamento
        </Button>
      )}
    >
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Card title="Saldo Atual" icon={<AccountBalanceOutlinedIcon />}>
            <Stack spacing={0.5} sx={{ p: 2.5 }}>
              <Typography variant="h4" fontWeight={800}>
                {formatCurrency(summary.balance)}
              </Typography>
              <Typography color="text.secondary">receitas pagas menos despesas pagas</Typography>
            </Stack>
          </Card>
          <Card title="Receita de OS" icon={<TrendingUpOutlinedIcon />}>
            <Stack spacing={0.5} sx={{ p: 2.5 }}>
              <Typography variant="h4" fontWeight={800}>
                {formatCurrency(summary.serviceOrderRevenue)}
              </Typography>
              <Typography color="text.secondary">{summary.serviceOrders} ordens no cálculo</Typography>
            </Stack>
          </Card>
          <Card title="Projeção" icon={<PaidOutlinedIcon />}>
            <Stack spacing={0.5} sx={{ p: 2.5 }}>
              <Typography variant="h4" fontWeight={800}>
                {formatCurrency(summary.projectedBalance)}
              </Typography>
              <Typography color="text.secondary">inclui pendências a receber e pagar</Typography>
            </Stack>
          </Card>
        </Stack>

        <Card title="Lançamentos Financeiros" icon={<AccountBalanceOutlinedIcon />}>
          <Stack spacing={2} sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField
                select
                size="small"
                label="Tipo"
                value={filter}
                onChange={(event) => setFilter(event.target.value as "all" | FinancialTransactionType)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="income">Receitas</MenuItem>
                <MenuItem value="expense">Despesas</MenuItem>
              </TextField>
              <Chip label={`A receber: ${formatCurrency(summary.pendingIncome)}`} variant="outlined" />
              <Chip label={`A pagar: ${formatCurrency(summary.pendingExpenses)}`} variant="outlined" />
            </Stack>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Fornecedor</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleTransactions.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography fontWeight={700}>{item.description}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[item.category, item.paymentMethod].filter(Boolean).join(" • ") || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>{typeLabel[item.type]}</TableCell>
                      <TableCell>{item.supplierId ? supplierNameById.get(item.supplierId) ?? "-" : "-"}</TableCell>
                      <TableCell>{formatDate(item.dueDate)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={item.status === "paid" ? "success" : item.status === "canceled" ? "default" : "warning"}
                          label={statusLabel[item.status]}
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => openEdit(item)}>
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteOutlineOutlinedIcon />}
                          onClick={() => remove(item)}
                        >
                          Remover
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!visibleTransactions.length && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography color="text.secondary">
                          {isLoading ? "Carregando financeiro..." : "Nenhum lançamento encontrado."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Card>
      </Stack>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                select
                label="Tipo"
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as FinancialTransactionType }))}
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="income">Receita</MenuItem>
                <MenuItem value="expense">Despesa</MenuItem>
              </TextField>
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as FinancialTransactionStatus }))}
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="paid">Pago</MenuItem>
                <MenuItem value="canceled">Cancelado</MenuItem>
              </TextField>
              <TextField
                fullWidth
                required
                label="Descrição"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Categoria"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              />
              <TextField
                fullWidth
                label="Forma de pagamento"
                value={form.paymentMethod}
                onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
              />
              <TextField
                required
                type="number"
                label="Valor"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))}
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                type="date"
                label="Vencimento"
                value={form.dueDate ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label="Fornecedor"
                value={form.supplierId ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    supplierId: event.target.value ? Number(event.target.value) : null,
                  }))
                }
                sx={{ minWidth: 260 }}
              >
                <MenuItem value="">Sem fornecedor</MenuItem>
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              label="Observações"
              multiline
              minRows={3}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={save} disabled={isSaving}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </RefineListView>
  );
};
