import { useEffect, useMemo, useState } from "react";
import { useNotification } from "@refinedev/core";
import { useNavigate } from "react-router";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import { Card, RefineListView } from "../../components";
import {
  createMechanicAuto,
  updateMechanicAuto,
  removeMechanicAuto,
  MECHANICS_STORAGE_KEY,
  MECHANICS_UPDATED_EVENT,
  listMechanics,
  type Mechanic,
  type MechanicStatus,
} from "../../services/mechanics";

type MechanicFormState = {
  name: string;
  phone: string;
  email: string;
  status: MechanicStatus;
};

const DEFAULT_FORM_STATE: MechanicFormState = {
  name: "",
  phone: "",
  email: "",
  status: "active",
};

const formatDateTime = (value: string) =>
  value ? new Date(value).toLocaleString("pt-BR") : "-";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Erro inesperado";
};

const TABLE_SCROLL_SX = {
  maxHeight: 600,
  overflowY: "auto",
  scrollbarWidth: "thin",
  scrollbarColor: "var(--mui-palette-primary-main) rgba(255, 255, 255, 0.08)",
  "&::-webkit-scrollbar": {
    width: 6,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "primary.main",
    borderRadius: 999,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 999,
  },
} as const;

export const ServiceOrderMechanicsPage: React.FC = () => {
  const { open } = useNotification();
  const navigate = useNavigate();

  const [items, setItems] = useState<Mechanic[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MechanicStatus>("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<MechanicFormState>(DEFAULT_FORM_STATE);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(editingId);

  const loadItems = async () => {
    try {
      const data = await listMechanics({
        page: 0,
        size: 100,
        sort: "name,asc",
      });
      setItems(data);
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao carregar mecânicos",
        description: getErrorMessage(error),
      });
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  useEffect(() => {
    const refresh = () => {
      void loadItems();
    };

    const handleUpdated: EventListener = () => {
      refresh();
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === MECHANICS_STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener(MECHANICS_UPDATED_EVENT, handleUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(MECHANICS_UPDATED_EVENT, handleUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return items.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = `${item.name} ${item.phone} ${item.email}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [items, searchValue, statusFilter]);

  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === "active") {
          acc.active += 1;
        }
        return acc;
      },
      { total: 0, active: 0 },
    );
  }, [items]);

  const resetForm = () => {
    setEditingId(null);
    setFormState(DEFAULT_FORM_STATE);
  };

  const openNew = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    resetForm();
  };

  const setField = <K extends keyof MechanicFormState>(
    field: K,
    value: MechanicFormState[K],
  ) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleEdit = (item: Mechanic) => {
    setEditingId(item.id);
    setFormState({
      name: item.name,
      phone: item.phone,
      email: item.email,
      status: item.status,
    });
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    const name = formState.name.trim();
    if (!name) {
      open?.({
        type: "error",
        message: "Revise o cadastro",
        description: "Informe o nome do mecânico responsável",
      });
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        name,
        phone: formState.phone.trim(),
        email: formState.email.trim(),
        status: formState.status,
      };

      if (editingId) {
        await updateMechanicAuto(editingId, payload);
        open?.({ type: "success", message: "Mecânico atualizado com sucesso" });
      } else {
        await createMechanicAuto(payload);
        open?.({ type: "success", message: "Mecânico cadastrado com sucesso" });
      }

      await loadItems();
      closeDrawer();
    } catch (error) {
      open?.({
        type: "error",
        message: "Erro ao salvar mecânico",
        description: getErrorMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: Mechanic) => {
    try {
      await removeMechanicAuto(item.id);

      open?.({ type: "success", message: "Mecânico removido com sucesso" });
      await loadItems();
    } catch (error) {
      open?.({
        type: "error",
        message: "Erro ao remover mecânico",
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <RefineListView
      title="Cadastro de Mecânicos"
      headerButtons={() => (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            size="small"
            variant="contained"
            startIcon={<AddBoxOutlinedIcon />}
            onClick={openNew}
          >
            Novo mecânico
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<NoteAddOutlinedIcon />}
            onClick={() => navigate("/ordem-servico")}
          >
            Abrir OS
          </Button>
        </Stack>
      )}
    >
      <Grid container columns={24} spacing={3}>
        <Drawer
          anchor="right"
          open={isDrawerOpen}
          onClose={closeDrawer}
          sx={{
            "& .MuiBackdrop-root": {
              backgroundColor: "rgba(2, 6, 23, 0.62)",
            },
          }}
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: 720, md: 820 },
              p: 2,
              height: "100dvh",
              backgroundColor: "background.paper",
              borderLeft: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            },
          }}
        >
          <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
            <Card
              title={isEditing ? "Editar mecânico" : "Novo mecânico"}
              icon={<BadgeOutlinedIcon />}
              sx={{ borderRadius: 3 }}
              cardHeaderProps={{
                action: (
                  <IconButton size="small" aria-label="Fechar" onClick={closeDrawer}>
                    <CloseOutlinedIcon fontSize="small" />
                  </IconButton>
                ),
              }}
              cardContentProps={{ sx: { p: 3 } }}
            >
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Cadastre os mecânicos responsáveis para facilitar a seleção nos
                  agendamentos e ordens de serviço.
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  label="Nome"
                  value={formState.name}
                  onChange={(event) => setField("name", event.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Telefone"
                  placeholder="Opcional"
                  value={formState.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="E-mail"
                  placeholder="Opcional"
                  value={formState.email}
                  onChange={(event) => setField("email", event.target.value)}
                />
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  value={formState.status}
                  onChange={(event) =>
                    setField("status", event.target.value as MechanicStatus)
                  }
                >
                  <MenuItem value="active">Ativo</MenuItem>
                  <MenuItem value="inactive">Inativo</MenuItem>
                </TextField>
              </Stack>
            </Card>
          </Box>

          <Box
            sx={{
              flexShrink: 0,
              pt: 1.5,
              pb: 1.5,
              backgroundColor: "background.paper",
              borderTop: "1px solid",
              borderColor: "divider",
              px: 0.5,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={1}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button variant="outlined" startIcon={<CloseOutlinedIcon />} onClick={closeDrawer}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveOutlinedIcon />}
                disabled={isSaving}
                onClick={() => void handleSave()}
              >
                {isEditing ? "Salvar alterações" : "Cadastrar"}
              </Button>
            </Stack>
          </Box>
        </Drawer>

        <Grid size={{ xs: 24 }}>
          <Card
            title="Mecânicos cadastrados"
            icon={<BadgeOutlinedIcon />}
            cardContentProps={{ sx: { p: 0 } }}
          >
            <Stack spacing={2} sx={{ p: 3, pb: 2 }}>
              <Grid container columns={12} spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Buscar"
                    placeholder="Pesquisar por nome, telefone ou e-mail"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Status"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "all" | MechanicStatus)
                    }
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="active">Ativos</MenuItem>
                    <MenuItem value="inactive">Inativos</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent={{ xs: "flex-start", md: "flex-end" }}
                    sx={{ height: "100%", alignItems: "center", flexWrap: "wrap" }}
                  >
                    <Chip label={`Total: ${summary.total}`} variant="outlined" />
                    <Chip label={`Ativos: ${summary.active}`} color="success" />
                  </Stack>
                </Grid>
              </Grid>
            </Stack>

            <Divider />

            <TableContainer sx={TABLE_SCROLL_SX}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>NOME</TableCell>
                    <TableCell>CONTATO</TableCell>
                    <TableCell>STATUS</TableCell>
                    <TableCell>ATUALIZADO EM</TableCell>
                    <TableCell align="right">AÇÕES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length ? (
                    filteredItems.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="body2" fontWeight={700}>
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {item.id}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.2}>
                            <Typography variant="body2">
                              {item.phone || "-"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.email || "-"}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={item.status === "active" ? "Ativo" : "Inativo"}
                            color={item.status === "active" ? "success" : "default"}
                            variant={item.status === "active" ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<EditOutlinedIcon />}
                              onClick={() => handleEdit(item)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              color="error"
                              startIcon={<DeleteOutlineOutlinedIcon />}
                              onClick={() => void handleDelete(item)}
                            >
                              Remover
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          Nenhum mecânico encontrado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </RefineListView>
  );
};
