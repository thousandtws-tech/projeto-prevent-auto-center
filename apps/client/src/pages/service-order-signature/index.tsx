import { useEffect, useMemo, useState } from "react";
import { useNotification } from "@refinedev/core";
import { useParams } from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid2";
import CircularProgress from "@mui/material/CircularProgress";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import {
  getSharedServiceOrderByToken,
  getSharedServiceOrderByTokenApi,
  type SharedServiceOrderPartStatus,
  type SharedServiceOrderServiceStatus,
  markSharedServiceOrderAsSignedApi,
} from "../../services/serviceOrderSignature";
import { LightThemeWithResponsiveFontSizes } from "../../theme";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (value: string) => {
  if (!value) return "-";

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
};

const formatDateTime = (value: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

export const ServiceOrderSignaturePage: React.FC = () => {
  const { token } = useParams();
  const { open } = useNotification();
  const initialOrder = getSharedServiceOrderByToken(token || "");
  const [signatureName, setSignatureName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [order, setOrder] = useState(() => initialOrder);
  const [partStatusById, setPartStatusById] = useState<
    Record<string, SharedServiceOrderPartStatus>
  >(() =>
    (initialOrder?.parts ?? []).reduce<Record<string, SharedServiceOrderPartStatus>>(
      (acc, part) => {
        acc[part.id] = part.status;
        return acc;
      },
      {},
    ),
  );
  const [laborServiceStatusById, setLaborServiceStatusById] = useState<
    Record<string, SharedServiceOrderServiceStatus>
  >(() =>
    (initialOrder?.laborServices ?? []).reduce<
      Record<string, SharedServiceOrderServiceStatus>
    >((acc, service) => {
      acc[service.id] = service.status;
      return acc;
    }, {}),
  );
  const [thirdPartyServiceStatusById, setThirdPartyServiceStatusById] = useState<
    Record<string, SharedServiceOrderServiceStatus>
  >(() =>
    (initialOrder?.thirdPartyServices ?? []).reduce<
      Record<string, SharedServiceOrderServiceStatus>
    >((acc, service) => {
      acc[service.id] = service.status;
      return acc;
    }, {}),
  );

  const isSigned = order?.status === "signed";

  useEffect(() => {
    if (!order) {
      return;
    }

    setPartStatusById(
      (order.parts ?? []).reduce<Record<string, SharedServiceOrderPartStatus>>(
        (acc, part) => {
          acc[part.id] = part.status;
          return acc;
        },
        {},
      ),
    );
    setLaborServiceStatusById(
      (order.laborServices ?? []).reduce<
        Record<string, SharedServiceOrderServiceStatus>
      >((acc, service) => {
        acc[service.id] = service.status;
        return acc;
      }, {}),
    );
    setThirdPartyServiceStatusById(
      (order.thirdPartyServices ?? []).reduce<
        Record<string, SharedServiceOrderServiceStatus>
      >((acc, service) => {
        acc[service.id] = service.status;
        return acc;
      }, {}),
    );
  }, [order]);

  useEffect(() => {
    if (!token) {
      setOrder(null);
      return;
    }

    let isMounted = true;

    const loadOrder = async () => {
      try {
        setIsLoadingOrder(true);
        const response = await getSharedServiceOrderByTokenApi(token);
        if (!isMounted) {
          return;
        }

        setOrder(response);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setOrder(null);
        open?.({
          type: "error",
          message: "Falha ao carregar link de assinatura",
          description:
            error instanceof Error && error.message
              ? error.message
              : "Erro inesperado",
        });
      } finally {
        if (isMounted) {
          setIsLoadingOrder(false);
        }
      }
    };

    void loadOrder();

    return () => {
      isMounted = false;
    };
  }, [open, token]);

  const partsWithDecision = useMemo(() => {
    if (!order) {
      return [];
    }

    return order.parts.map((part) => ({
      ...part,
      status: partStatusById[part.id] ?? part.status,
    }));
  }, [order, partStatusById]);

  const partsSubtotal = useMemo(
    () =>
      partsWithDecision.reduce(
        (total, part) =>
          part.status === "declined"
            ? total
            : total + part.quantity * part.unitPrice,
        0,
      ),
    [partsWithDecision],
  );

  const laborServicesWithDecision = useMemo(() => {
    if (!order) {
      return [];
    }

    return order.laborServices.map((service) => ({
      ...service,
      status: laborServiceStatusById[service.id] ?? service.status,
    }));
  }, [order, laborServiceStatusById]);

  const laborSubtotal = useMemo(
    () =>
      laborServicesWithDecision.reduce(
        (total, service) =>
          service.status === "declined"
            ? total
            : total + service.amount,
        0,
      ),
    [laborServicesWithDecision],
  );

  const thirdPartyServicesWithDecision = useMemo(() => {
    if (!order) {
      return [];
    }

    return order.thirdPartyServices.map((service) => ({
      ...service,
      status: thirdPartyServiceStatusById[service.id] ?? service.status,
    }));
  }, [order, thirdPartyServiceStatusById]);

  const thirdPartySubtotal = useMemo(
    () =>
      thirdPartyServicesWithDecision.reduce(
        (total, service) =>
          service.status === "declined"
            ? total
            : total + service.amount,
        0,
      ),
    [thirdPartyServicesWithDecision],
  );

  const declinedPartsCount = useMemo(
    () => partsWithDecision.filter((part) => part.status === "declined").length,
    [partsWithDecision],
  );
  const declinedLaborServicesCount = useMemo(
    () =>
      laborServicesWithDecision.filter((service) => service.status === "declined")
        .length,
    [laborServicesWithDecision],
  );
  const declinedThirdPartyServicesCount = useMemo(
    () =>
      thirdPartyServicesWithDecision.filter(
        (service) => service.status === "declined",
      ).length,
    [thirdPartyServicesWithDecision],
  );

  const grandTotal = useMemo(() => {
    if (!order) {
      return 0;
    }

    return (
      partsSubtotal +
      laborSubtotal +
      thirdPartySubtotal -
      order.discount
    );
  }, [order, laborSubtotal, partsSubtotal, thirdPartySubtotal]);

  const handlePartStatusChange = (
    partId: string,
    status: SharedServiceOrderPartStatus,
  ) => {
    setPartStatusById((current) => ({
      ...current,
      [partId]: status,
    }));
  };

  const handleServiceStatusChange = (
    serviceType: "labor" | "thirdParty",
    serviceId: string,
    status: SharedServiceOrderServiceStatus,
  ) => {
    if (serviceType === "labor") {
      setLaborServiceStatusById((current) => ({
        ...current,
        [serviceId]: status,
      }));
      return;
    }

    setThirdPartyServiceStatusById((current) => ({
      ...current,
      [serviceId]: status,
    }));
  };

  const handleSign = async () => {
    if (!order || isSigned) {
      return;
    }

    if (!signatureName.trim()) {
      open?.({
        type: "error",
        message: "Informe o nome para assinatura",
      });
      return;
    }

    if (!accepted) {
      open?.({
        type: "error",
        message: "Confirme a concordância para assinar",
      });
      return;
    }

    try {
      setIsSigning(true);

      const updated = await markSharedServiceOrderAsSignedApi(
        order.token,
        signatureName,
        {
          parts: partsWithDecision,
          laborServices: laborServicesWithDecision,
          thirdPartyServices: thirdPartyServicesWithDecision,
          totals: {
            ...order.totals,
            partsSubtotal,
            laborSubtotal,
            thirdPartySubtotal,
            grandTotal,
          },
        },
      );

      if (!updated) {
        open?.({
          type: "error",
          message: "Falha ao concluir assinatura",
        });
        return;
      }

      setOrder(updated);
      setPartStatusById(
        (updated.parts ?? []).reduce<Record<string, SharedServiceOrderPartStatus>>(
          (acc, part) => {
            acc[part.id] = part.status;
            return acc;
          },
          {},
        ),
      );
      setLaborServiceStatusById(
        (updated.laborServices ?? []).reduce<
          Record<string, SharedServiceOrderServiceStatus>
        >((acc, service) => {
          acc[service.id] = service.status;
          return acc;
        }, {}),
      );
      setThirdPartyServiceStatusById(
        (updated.thirdPartyServices ?? []).reduce<
          Record<string, SharedServiceOrderServiceStatus>
        >((acc, service) => {
          acc[service.id] = service.status;
          return acc;
        }, {}),
      );
      open?.({
        type: "success",
        message: "Ordem assinada com sucesso",
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao concluir assinatura",
        description:
          error instanceof Error && error.message
            ? error.message
            : "Erro inesperado",
      });
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoadingOrder && !order) {
    return (
      <ThemeProvider theme={LightThemeWithResponsiveFontSizes}>
        <Box
          sx={{
            minHeight: "100vh",
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f4f6f8",
          }}
        >
          <Paper sx={{ p: 4, maxWidth: 520, width: "100%" }}>
            <Stack spacing={2} alignItems="center">
              <CircularProgress size={32} />
              <Typography variant="h6">Carregando ordem de serviço</Typography>
            </Stack>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  if (!order) {
    return (
      <ThemeProvider theme={LightThemeWithResponsiveFontSizes}>
        <Box
          sx={{
            minHeight: "100vh",
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f4f6f8",
          }}
        >
          <Paper sx={{ p: 4, maxWidth: 520, width: "100%" }}>
            <Stack spacing={2} alignItems="center">
              <BuildCircleOutlinedIcon color="warning" sx={{ fontSize: 42 }} />
              <Typography variant="h6">Link de assinatura inválido</Typography>
              <Typography color="text.secondary" textAlign="center">
                O link informado não foi encontrado ou expirou. Solicite um novo link
                para a oficina.
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={LightThemeWithResponsiveFontSizes}>
      <Box
        sx={{
          minHeight: "100vh",
          p: {
            xs: 1.5,
            sm: 3,
          },
          backgroundColor: "background.default",
        }}
      >
      <Box sx={{ maxWidth: 960, mx: "auto" }}>
        <Paper
          variant="outlined"
          sx={{
            p: {
              xs: 2,
              sm: 3,
            },
            borderRadius: 3,
            backgroundColor: "#fff",
            color: "#111827",
            borderColor: "rgba(17, 24, 39, 0.18)",
            "& .MuiTypography-root": {
              color: "#111827",
            },
          }}
        >
          <Stack spacing={2.2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography fontWeight={800} fontSize={22}>
                  ORDEM DE SERVIÇO
                </Typography>
                <Typography variant="body2">
                  OS #{order.orderInfo.orderNumber} • {formatDate(order.orderInfo.date)}
                </Typography>
              </Box>
              <Chip
                color={isSigned ? "success" : "warning"}
                variant="outlined"
                label={isSigned ? "Assinada" : "Aguardando Assinatura"}
              />
            </Stack>

            <Divider />

            <Grid container columns={12} spacing={1.4}>
              <Grid size={12}>
                <Typography variant="body2">
                  <b>Cliente:</b> {order.orderInfo.customerName || "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <b>Telefone:</b> {order.orderInfo.phone || "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <b>Veículo:</b> {order.orderInfo.vehicle || "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2">
                  <b>Placa:</b> {order.orderInfo.plate || "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2">
                  <b>Ano:</b> {order.orderInfo.year || "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2">
                  <b>KM:</b> {order.orderInfo.km || "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <b>Mecânico responsável:</b>{" "}
                  {order.orderInfo.mechanicResponsible || "-"}
                </Typography>
              </Grid>
            </Grid>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={700}>
                Peças e aprovação do cliente
              </Typography>
              {partsWithDecision.length ? (
                <Stack spacing={1}>
                  {partsWithDecision.map((part) => {
                    const isDeclined = part.status === "declined";

                    return (
                      <Paper
                        key={part.id}
                        variant="outlined"
                        sx={{
                          p: 1.2,
                          borderColor: isDeclined ? "warning.light" : "divider",
                          backgroundColor: isDeclined
                            ? "rgba(251,146,60,0.08)"
                            : "transparent",
                        }}
                      >
                        <Stack spacing={0.8}>
                          <Stack direction="row" justifyContent="space-between" gap={1}>
                            <Typography
                              variant="body2"
                              sx={
                                isDeclined
                                  ? {
                                      textDecoration: "line-through",
                                      color: "text.secondary",
                                    }
                                  : undefined
                              }
                            >
                              {part.description || "Peça sem descrição"}
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={
                                isDeclined
                                  ? {
                                      textDecoration: "line-through",
                                      color: "text.secondary",
                                    }
                                  : undefined
                              }
                            >
                              {part.quantity} x {formatCurrency(part.unitPrice)} ={" "}
                              {formatCurrency(part.quantity * part.unitPrice)}
                            </Typography>
                          </Stack>

                          {isSigned ? (
                            <Chip
                              size="small"
                              label={
                                isDeclined
                                  ? "Peça recusada pelo cliente"
                                  : "Peça aprovada"
                              }
                              color={isDeclined ? "warning" : "success"}
                              variant="outlined"
                            />
                          ) : (
                            <FormControlLabel
                              sx={{ m: 0 }}
                              control={
                                <Checkbox
                                  checked={isDeclined}
                                  onChange={(_, checked) =>
                                    handlePartStatusChange(
                                      part.id,
                                      checked ? "declined" : "approved",
                                    )
                                  }
                                />
                              }
                              label="Não aprovar esta peça"
                            />
                          )}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma peça cadastrada nesta ordem.
                </Typography>
              )}
              {declinedPartsCount ? (
                <Typography variant="caption" color="warning.main">
                  {declinedPartsCount} peça(s) recusada(s) não entram no total.
                </Typography>
              ) : null}
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={700}>
                Serviços
              </Typography>
              {laborServicesWithDecision.length ? (
                <Stack spacing={1}>
                  {laborServicesWithDecision.map((service) => {
                    const isDeclined = service.status === "declined";

                    return (
                      <Paper
                        key={service.id}
                        variant="outlined"
                        sx={{
                          p: 1.2,
                          borderColor: isDeclined ? "warning.light" : "divider",
                          backgroundColor: isDeclined
                            ? "rgba(251,146,60,0.08)"
                            : "transparent",
                        }}
                      >
                        <Stack spacing={0.8}>
                          <Stack direction="row" justifyContent="space-between" gap={1}>
                            <Typography
                              variant="body2"
                              sx={
                                isDeclined
                                  ? {
                                      textDecoration: "line-through",
                                      color: "text.secondary",
                                    }
                                  : undefined
                              }
                            >
                              {service.description || "Serviço"}
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={
                                isDeclined
                                  ? {
                                      textDecoration: "line-through",
                                      color: "text.secondary",
                                    }
                                  : undefined
                              }
                            >
                              {formatCurrency(service.amount)}
                            </Typography>
                          </Stack>

                          {isSigned ? (
                            <Chip
                              size="small"
                              label={
                                isDeclined
                                  ? "Serviço recusado pelo cliente"
                                  : "Serviço aprovado"
                              }
                              color={isDeclined ? "warning" : "success"}
                              variant="outlined"
                            />
                          ) : (
                            <FormControlLabel
                              sx={{ m: 0 }}
                              control={
                                <Checkbox
                                  checked={isDeclined}
                                  onChange={(_, checked) =>
                                    handleServiceStatusChange(
                                      "labor",
                                      service.id,
                                      checked ? "declined" : "approved",
                                    )
                                  }
                                />
                              }
                              label="Não aprovar este serviço"
                            />
                          )}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum serviço cadastrado.
                </Typography>
              )}
              {declinedLaborServicesCount ? (
                <Typography variant="caption" color="warning.main">
                  {declinedLaborServicesCount} serviço(s) recusado(s).
                </Typography>
              ) : null}
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={700}>
                Serviços de Terceiros
              </Typography>
              {thirdPartyServicesWithDecision.length ? (
                <Stack spacing={1}>
                  {thirdPartyServicesWithDecision.map((service) => {
                    const isDeclined = service.status === "declined";

                    return (
                      <Paper
                        key={service.id}
                        variant="outlined"
                        sx={{
                          p: 1.2,
                          borderColor: isDeclined ? "warning.light" : "divider",
                          backgroundColor: isDeclined
                            ? "rgba(251,146,60,0.08)"
                            : "transparent",
                        }}
                      >
                        <Stack spacing={0.8}>
                          <Stack direction="row" justifyContent="space-between" gap={1}>
                            <Typography
                              variant="body2"
                              sx={
                                isDeclined
                                  ? {
                                      textDecoration: "line-through",
                                      color: "text.secondary",
                                    }
                                  : undefined
                              }
                            >
                              {service.description || "Serviço"}
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={
                                isDeclined
                                  ? {
                                      textDecoration: "line-through",
                                      color: "text.secondary",
                                    }
                                  : undefined
                              }
                            >
                              {formatCurrency(service.amount)}
                            </Typography>
                          </Stack>

                          {isSigned ? (
                            <Chip
                              size="small"
                              label={
                                isDeclined
                                  ? "Serviço recusado pelo cliente"
                                  : "Serviço aprovado"
                              }
                              color={isDeclined ? "warning" : "success"}
                              variant="outlined"
                            />
                          ) : (
                            <FormControlLabel
                              sx={{ m: 0 }}
                              control={
                                <Checkbox
                                  checked={isDeclined}
                                  onChange={(_, checked) =>
                                    handleServiceStatusChange(
                                      "thirdParty",
                                      service.id,
                                      checked ? "declined" : "approved",
                                    )
                                  }
                                />
                              }
                              label="Não aprovar este serviço"
                            />
                          )}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum serviço de terceiros cadastrado.
                </Typography>
              )}
              {declinedThirdPartyServicesCount ? (
                <Typography variant="caption" color="warning.main">
                  {declinedThirdPartyServicesCount} serviço(s) de terceiros recusado(s).
                </Typography>
              ) : null}
            </Stack>

            <Divider />

            <Stack spacing={0.8}>
              <Typography variant="subtitle2" fontWeight={700}>
                Totais
              </Typography>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Subtotal Peças</Typography>
                <Typography variant="body2">{formatCurrency(partsSubtotal)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Subtotal Serviços</Typography>
                <Typography variant="body2">{formatCurrency(laborSubtotal)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Subtotal Terceiros</Typography>
                <Typography variant="body2">{formatCurrency(thirdPartySubtotal)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Desconto</Typography>
                <Typography variant="body2">
                  - {formatCurrency(order.discount)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={700}>TOTAL GERAL</Typography>
                <Typography fontWeight={700}>{formatCurrency(grandTotal)}</Typography>
              </Stack>
            </Stack>

            <Divider />

            <Typography variant="body2">
              <b>Forma de pagamento:</b> {order.orderInfo.paymentMethod || "-"}
            </Typography>
            <Typography variant="body2">
              <b>Observações:</b> {order.orderInfo.notes || "Sem observações"}
            </Typography>

            <Divider />

            {isSigned ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderColor: "success.light",
                  backgroundColor: "rgba(34,197,94,0.08)",
                }}
              >
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <CheckCircleOutlineOutlinedIcon color="success" />
                  <Box>
                    <Typography fontWeight={700}>
                      Ordem assinada por {order.signature?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(order.signature?.signedAt || "")}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ) : (
              <Stack spacing={1.5}>
                <Typography fontWeight={700}>
                  Assinatura do cliente
                </Typography>
                <TextField
                  label="Nome completo para assinatura"
                  size="small"
                  value={signatureName}
                  onChange={(event) => setSignatureName(event.target.value)}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={accepted}
                      onChange={(event) => setAccepted(event.target.checked)}
                    />
                  }
                  label="Confirmo que revisei e autorizo a execução desta ordem."
                />
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<BorderColorOutlinedIcon />}
                  onClick={() => {
                    void handleSign();
                  }}
                  disabled={isSigning}
                >
                  {isSigning ? "Assinando..." : "Assinar Ordem de Serviço"}
                </Button>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Box>
    </Box>
    </ThemeProvider>
  );
};
