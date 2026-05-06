import { useEffect, useMemo, useState } from "react";
import { useNotification } from "@refinedev/core";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
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
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import { useNavigate } from "react-router";
import { Card, RefineListView } from "../../components";
import {
  SERVICE_ORDER_CATALOG_STORAGE_KEY,
  SERVICE_ORDER_CATALOG_UPDATED_EVENT,
  createServiceOrderCatalogItemApi,
  listServiceOrderCatalogItemsApi,
  removeServiceOrderCatalogItemApi,
  updateServiceOrderCatalogItemApi,
  type ServiceOrderCatalogItem,
  type ServiceOrderPartCondition,
  type ServiceOrderCatalogStatus,
  type ServiceOrderCatalogType,
} from "../../services/serviceOrderCatalog";

type CatalogFormState = {
  code: string;
  description: string;
  defaultPrice: string;
  costPrice: string;
  profitMarginPercent: string;
  stockQuantity: string;
  estimatedDurationMinutes: string;
  partCondition: ServiceOrderPartCondition;
  status: ServiceOrderCatalogStatus;
};

const DEFAULT_FORM_STATE: CatalogFormState = {
  code: "",
  description: "",
  defaultPrice: "0",
  costPrice: "0",
  profitMarginPercent: "0",
  stockQuantity: "0",
  estimatedDurationMinutes: "60",
  partCondition: "new",
  status: "active",
};

const MODULE_COPY: Record<
  ServiceOrderCatalogType,
  {
    title: string;
    singular: string;
    plural: string;
    addLabel: string;
    emptyText: string;
    helperText: string;
  }
> = {
  part: {
    title: "Cadastro de Peças",
    singular: "peça",
    plural: "peças",
    addLabel: "Nova peça",
    emptyText: "Nenhuma peça cadastrada.",
    helperText: "As peças cadastradas podem ser adicionadas diretamente na ordem de serviço.",
  },
  labor: {
    title: "Cadastro de Serviços",
    singular: "serviço",
    plural: "serviços",
    addLabel: "Novo serviço",
    emptyText: "Nenhum serviço cadastrado.",
    helperText:
      "Os serviços cadastrados ficam disponíveis para compor os serviços na ordem de serviço.",
  },
};

const STATUS_META: Record<
  ServiceOrderCatalogStatus,
  { label: string; color: "success" | "default" }
> = {
  active: {
    label: "Ativo",
    color: "success",
  },
  inactive: {
    label: "Inativo",
    color: "default",
  },
};

const PART_CONDITION_META: Record<ServiceOrderPartCondition, string> = {
  new: "Nova",
  used: "Usada",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0)}%`;

const formatDateTime = (value: string) =>
  value ? new Date(value).toLocaleString("pt-BR") : "-";

const parseCurrencyInput = (value: string): number => {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseNumberInput = (value: string): number => {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const calculateSalePrice = (costPrice: number, profitMarginPercent: number) =>
  costPrice + costPrice * (profitMarginPercent / 100);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Erro inesperado";
};

export const ServiceOrderCatalogPage: React.FC<{
  type: ServiceOrderCatalogType;
}> = ({ type }) => {
  const copy = MODULE_COPY[type];
  const { open } = useNotification();
  const navigate = useNavigate();
  const [items, setItems] = useState<ServiceOrderCatalogItem[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ServiceOrderCatalogStatus>(
    "all",
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CatalogFormState>(DEFAULT_FORM_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isEditing = Boolean(editingItemId);

  const loadItems = async (showError = false) => {
    try {
      setIsLoading(true);
      const response = await listServiceOrderCatalogItemsApi(type);
      setItems(response);
    } catch (error) {
      if (showError) {
        open?.({
          type: "error",
          message: `Falha ao carregar ${copy.plural}`,
          description: getErrorMessage(error),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItems(true);
  }, [type]);

  useEffect(() => {
    const refresh = () => {
      void loadItems();
    };

    const handleCatalogUpdated: EventListener = () => {
      refresh();
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === SERVICE_ORDER_CATALOG_STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener(SERVICE_ORDER_CATALOG_UPDATED_EVENT, handleCatalogUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        SERVICE_ORDER_CATALOG_UPDATED_EVENT,
        handleCatalogUpdated,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [type]);

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

      return (
        item.description.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query)
      );
    });
  }, [items, searchValue, statusFilter]);

  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === "active") {
          acc.active += 1;
        } else {
          acc.inactive += 1;
        }
        return acc;
      },
      { total: 0, active: 0, inactive: 0 },
    );
  }, [items]);

  const resetForm = () => {
    setEditingItemId(null);
    setFormState(DEFAULT_FORM_STATE);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    resetForm();
  };

  const openNew = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const setField = <K extends keyof CatalogFormState>(
    field: K,
    value: CatalogFormState[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formState.description.trim()) {
      return `Informe a descrição da ${copy.singular}`;
    }

    if (parseCurrencyInput(formState.defaultPrice) < 0) {
      return "Informe um valor padrão válido";
    }

    if (type === "part" && parseCurrencyInput(formState.costPrice) < 0) {
      return "Informe um custo válido";
    }

    if (type === "part" && parseNumberInput(formState.profitMarginPercent) < 0) {
      return "Informe uma margem de lucro válida";
    }

    if (type === "part" && parseNumberInput(formState.stockQuantity) < 0) {
      return "Informe uma quantidade de estoque válida";
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      open?.({
        type: "error",
        message: "Revise o cadastro",
        description: validationError,
      });
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        type,
        code: formState.code.trim(),
        description: formState.description.trim(),
        defaultPrice: parseCurrencyInput(formState.defaultPrice),
        costPrice: type === "part" ? parseCurrencyInput(formState.costPrice) : undefined,
        profitMarginPercent:
          type === "part" ? parseNumberInput(formState.profitMarginPercent) : undefined,
        stockQuantity:
          type === "part"
            ? Math.max(0, Math.round(parseNumberInput(formState.stockQuantity)))
            : undefined,
        estimatedDurationMinutes:
          type === "labor"
            ? Math.max(1, Number(formState.estimatedDurationMinutes) || 60)
            : undefined,
        partCondition: type === "part" ? formState.partCondition : undefined,
        status: formState.status,
      } as const;

      if (editingItemId) {
        await updateServiceOrderCatalogItemApi(editingItemId, payload);
        open?.({
          type: "success",
          message: `${copy.title} atualizado`,
        });
      } else {
        await createServiceOrderCatalogItemApi(payload);
        open?.({
          type: "success",
          message: `${copy.title} cadastrado`,
        });
      }

      closeDrawer();
      await loadItems();
    } catch (error) {
      open?.({
        type: "error",
        message: `Erro ao salvar ${copy.singular}`,
        description: getErrorMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: ServiceOrderCatalogItem) => {
    setEditingItemId(item.id);
    setFormState({
      code: item.code,
      description: item.description,
      defaultPrice: String(item.defaultPrice),
      costPrice: String(item.costPrice ?? 0),
      profitMarginPercent: String(item.profitMarginPercent ?? 0),
      stockQuantity: String(item.stockQuantity ?? 0),
      estimatedDurationMinutes: String(item.estimatedDurationMinutes ?? 60),
      partCondition: item.partCondition ?? "new",
      status: item.status,
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await removeServiceOrderCatalogItemApi(id);
      if (editingItemId === id) {
        closeDrawer();
      }

      open?.({
        type: "success",
        message: `${copy.singular} removida com sucesso`,
      });
      await loadItems();
    } catch (error) {
      open?.({
        type: "error",
        message: `Erro ao remover ${copy.singular}`,
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <RefineListView
      title={copy.title}
      headerButtons={() => (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            size="small"
            variant="contained"
            startIcon={<AddBoxOutlinedIcon />}
            onClick={openNew}
          >
            {copy.addLabel}
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
              width: { xs: "100%", sm: 760, md: 860 },
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
              title={isEditing ? `Editar ${copy.singular}` : copy.addLabel}
              icon={<AddBoxOutlinedIcon />}
              sx={{ borderRadius: 3 }}
              cardHeaderProps={{
                action: (
                  <IconButton
                    size="small"
                    aria-label="Fechar"
                    onClick={closeDrawer}
                  >
                    <CloseOutlinedIcon fontSize="small" />
                  </IconButton>
                ),
              }}
              cardContentProps={{ sx: { p: 3 } }}
            >
              <Stack id="service-order-catalog-form" spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  {copy.helperText}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  label="Código"
                  placeholder="Opcional"
                  value={formState.code}
                  onChange={(event) => setField("code", event.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Descrição"
                  value={formState.description}
                  onChange={(event) => setField("description", event.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={type === "part" ? "Preço de venda" : "Valor padrão"}
                  value={formState.defaultPrice}
                  onChange={(event) => setField("defaultPrice", event.target.value)}
                />
                {type === "part" ? (
                  <Grid container columns={12} spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Custo"
                        value={formState.costPrice}
                        onChange={(event) => {
                          const nextCost = event.target.value;
                          setFormState((current) => {
                            const costPrice = parseCurrencyInput(nextCost);
                            const margin = parseNumberInput(
                              current.profitMarginPercent,
                            );
                            const nextDefaultPrice =
                              costPrice > 0
                                ? String(calculateSalePrice(costPrice, margin).toFixed(2))
                                : current.defaultPrice;

                            return {
                              ...current,
                              costPrice: nextCost,
                              defaultPrice: nextDefaultPrice,
                            };
                          });
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Margem de lucro (%)"
                        value={formState.profitMarginPercent}
                        onChange={(event) => {
                          const nextMargin = event.target.value;
                          setFormState((current) => {
                            const costPrice = parseCurrencyInput(current.costPrice);
                            const margin = parseNumberInput(nextMargin);
                            const nextDefaultPrice =
                              costPrice > 0
                                ? String(calculateSalePrice(costPrice, margin).toFixed(2))
                                : current.defaultPrice;

                            return {
                              ...current,
                              profitMarginPercent: nextMargin,
                              defaultPrice: nextDefaultPrice,
                            };
                          });
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Quantidade em estoque"
                        value={formState.stockQuantity}
                        onChange={(event) =>
                          setField("stockQuantity", event.target.value)
                        }
                      />
                    </Grid>
                  </Grid>
                ) : null}
                {type === "labor" ? (
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Duração estimada (min)"
                    value={formState.estimatedDurationMinutes}
                    onChange={(event) =>
                      setField("estimatedDurationMinutes", event.target.value)
                    }
                  />
                ) : null}
                {type === "part" ? (
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Tipo da peça"
                    value={formState.partCondition}
                    onChange={(event) =>
                      setField(
                        "partCondition",
                        event.target.value as ServiceOrderPartCondition,
                      )
                    }
                  >
                    <MenuItem value="new">Nova</MenuItem>
                    <MenuItem value="used">Usada</MenuItem>
                  </TextField>
                ) : null}
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  value={formState.status}
                  onChange={(event) =>
                    setField("status", event.target.value as ServiceOrderCatalogStatus)
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
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                startIcon={<CloseOutlinedIcon />}
                onClick={closeDrawer}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveOutlinedIcon />}
                onClick={() => {
                  void handleSave();
                }}
                disabled={isSaving}
              >
                {isEditing ? "Salvar alterações" : "Cadastrar"}
              </Button>
            </Stack>
          </Box>
        </Drawer>

        <Grid size={{ xs: 24, lg: 24 }}>
          <Card
            title={`Lista de ${copy.plural}`}
            icon={<NoteAddOutlinedIcon />}
            cardContentProps={{ sx: { p: 0 } }}
          >
            <Stack spacing={2} sx={{ p: 3, pb: 2 }}>
              <Grid container columns={12} spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Buscar"
                    placeholder={`Pesquisar ${copy.plural}`}
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
                      setStatusFilter(
                        event.target.value as "all" | ServiceOrderCatalogStatus,
                      )
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
                    sx={{ height: "100%", alignItems: "center" }}
                  >
                    <Chip label={`Total: ${summary.total}`} variant="outlined" />
                    <Chip label={`Ativos: ${summary.active}`} color="success" />
                  </Stack>
                </Grid>
              </Grid>
            </Stack>

            <Divider />

            <TableContainer sx={{ maxHeight: 560 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: type === "part" ? "9%" : "14%" }}>
                        Código
                      </TableCell>
                      <TableCell sx={{ width: type === "part" ? "24%" : "38%" }}>
                        Descrição
                      </TableCell>
                      {type === "part" ? (
                        <>
                          <TableCell sx={{ width: "9%" }}>Tipo</TableCell>
                          <TableCell sx={{ width: "10%" }}>Custo</TableCell>
                          <TableCell sx={{ width: "9%" }}>Margem</TableCell>
                          <TableCell sx={{ width: "9%" }}>Estoque</TableCell>
                        </>
                      ) : null}
                      {type === "labor" ? (
                        <TableCell sx={{ width: "12%" }}>Duração</TableCell>
                      ) : null}
                      <TableCell sx={{ width: type === "part" ? "10%" : "14%" }}>
                        {type === "part" ? "Venda" : "Valor padrão"}
                      </TableCell>
                      <TableCell sx={{ width: "12%" }}>Status</TableCell>
                      <TableCell sx={{ width: type === "part" ? "10%" : "14%" }}>
                        Atualizado
                      </TableCell>
                      <TableCell sx={{ width: type === "part" ? "8%" : "8%" }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                  {filteredItems.length ? (
                    filteredItems.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.code || "-"}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {item.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Criado em {formatDateTime(item.createdAt)}
                            </Typography>
                          </Box>
                        </TableCell>
                        {type === "part" ? (
                          <>
                            <TableCell>
                              <Chip
                                size="small"
                                label={PART_CONDITION_META[item.partCondition ?? "new"]}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{formatCurrency(item.costPrice)}</TableCell>
                            <TableCell>{formatPercent(item.profitMarginPercent)}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={`${item.stockQuantity} un.`}
                                color={item.stockQuantity > 0 ? "success" : "default"}
                                variant={item.stockQuantity > 0 ? "filled" : "outlined"}
                              />
                            </TableCell>
                          </>
                        ) : null}
                        {type === "labor" ? (
                          <TableCell>
                            {item.estimatedDurationMinutes ?? 60} min
                          </TableCell>
                        ) : null}
                        <TableCell>{formatCurrency(item.defaultPrice)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={STATUS_META[item.status].label}
                            color={STATUS_META[item.status].color}
                            variant={item.status === "active" ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
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
                              color="error"
                              variant="text"
                              startIcon={<DeleteOutlineOutlinedIcon />}
                              onClick={() => {
                                void handleDelete(item.id);
                              }}
                            >
                              Excluir
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={type === "part" ? 10 : 7}>
                        <Typography variant="body2" color="text.secondary">
                          {isLoading ? "Carregando..." : copy.emptyText}
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
