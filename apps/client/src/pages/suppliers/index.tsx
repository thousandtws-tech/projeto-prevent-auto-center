import { useEffect, useMemo, useState } from "react";
import { useNotification } from "@refinedev/core";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
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
  createSupplierApi,
  listSuppliersApi,
  removeSupplierApi,
  updateSupplierApi,
  type Supplier,
  type SupplierPayload,
  type SupplierStatus,
} from "../../services/suppliers";

const EMPTY_FORM: SupplierPayload = {
  name: "",
  document: "",
  contactName: "",
  phone: "",
  email: "",
  category: "",
  address: "",
  notes: "",
  status: "active",
};

const statusLabel: Record<SupplierStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "Erro inesperado";

export const SuppliersPage: React.FC = () => {
  const { open } = useNotification();
  const [items, setItems] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | SupplierStatus>("all");
  const [form, setForm] = useState<SupplierPayload>(EMPTY_FORM);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      setItems(await listSuppliersApi());
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao carregar fornecedores",
        description: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [
        item.name,
        item.document,
        item.contactName,
        item.phone,
        item.email,
        item.category,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [items, search, status]);

  const summary = useMemo(
    () => ({
      total: items.length,
      active: items.filter((item) => item.status === "active").length,
      categories: new Set(items.map((item) => item.category).filter(Boolean)).size,
    }),
    [items],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openEdit = (item: Supplier) => {
    setEditing(item);
    setForm({
      name: item.name,
      document: item.document,
      contactName: item.contactName,
      phone: item.phone,
      email: item.email,
      category: item.category,
      address: item.address,
      notes: item.notes,
      status: item.status,
    });
    setIsDialogOpen(true);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      if (editing) {
        await updateSupplierApi(editing.id, form);
      } else {
        await createSupplierApi(form);
      }
      setIsDialogOpen(false);
      await load();
      open?.({ type: "success", message: "Fornecedor salvo" });
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao salvar fornecedor",
        description: getErrorMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (item: Supplier) => {
    if (!window.confirm(`Remover fornecedor "${item.name}"?`)) {
      return;
    }
    try {
      await removeSupplierApi(item.id);
      await load();
      open?.({ type: "success", message: "Fornecedor removido" });
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao remover fornecedor",
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <RefineListView
      canCreate={false}
      title="Fornecedores"
      headerButtons={() => (
        <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
          Novo fornecedor
        </Button>
      )}
    >
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Card title="Fornecedores" icon={<LocalShippingOutlinedIcon />}>
            <Stack spacing={0.5} sx={{ p: 2.5 }}>
              <Typography variant="h4" fontWeight={800}>
                {summary.total}
              </Typography>
              <Typography color="text.secondary">cadastros no backend</Typography>
            </Stack>
          </Card>
          <Card title="Ativos" icon={<LocalShippingOutlinedIcon />}>
            <Stack spacing={0.5} sx={{ p: 2.5 }}>
              <Typography variant="h4" fontWeight={800}>
                {summary.active}
              </Typography>
              <Typography color="text.secondary">liberados para compras</Typography>
            </Stack>
          </Card>
          <Card title="Categorias" icon={<LocalShippingOutlinedIcon />}>
            <Stack spacing={0.5} sx={{ p: 2.5 }}>
              <Typography variant="h4" fontWeight={800}>
                {summary.categories}
              </Typography>
              <Typography color="text.secondary">tipos de fornecimento</Typography>
            </Stack>
          </Card>
        </Stack>

        <Card title="Cadastro de Fornecedores" icon={<LocalShippingOutlinedIcon />}>
          <Stack spacing={2} sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Buscar"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                size="small"
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value as "all" | SupplierStatus)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Ativos</MenuItem>
                <MenuItem value="inactive">Inativos</MenuItem>
              </TextField>
            </Stack>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fornecedor</TableCell>
                    <TableCell>Contato</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography fontWeight={700}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.document || "Sem documento"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.contactName || "-"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[item.phone, item.email].filter(Boolean).join(" • ") || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.category || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={item.status === "active" ? "success" : "default"}
                          label={statusLabel[item.status]}
                        />
                      </TableCell>
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
                  {!filteredItems.length && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography color="text.secondary">
                          {isLoading ? "Carregando fornecedores..." : "Nenhum fornecedor encontrado."}
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
        <DialogTitle>{editing ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                required
                label="Nome"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <TextField
                label="CPF/CNPJ"
                value={form.document}
                onChange={(event) => setForm((current) => ({ ...current, document: event.target.value }))}
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Contato"
                value={form.contactName}
                onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))}
              />
              <TextField
                fullWidth
                label="Telefone"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
              <TextField
                fullWidth
                label="E-mail"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
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
                select
                label="Status"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as SupplierStatus }))}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="active">Ativo</MenuItem>
                <MenuItem value="inactive">Inativo</MenuItem>
              </TextField>
            </Stack>
            <TextField
              label="Endereço"
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            />
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
      <Box />
    </RefineListView>
  );
};
