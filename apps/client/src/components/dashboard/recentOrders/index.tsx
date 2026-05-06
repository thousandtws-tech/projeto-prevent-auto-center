import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

export type DashboardRecentOrderItem = {
  id: string;
  orderNumber: string;
  customerName: string;
  vehicle: string;
  updatedAt: string;
  total: number;
  status: "registered" | "sent_for_signature" | "signed";
};

type Props = {
  items: DashboardRecentOrderItem[];
  loading?: boolean;
};

const STATUS_LABEL: Record<DashboardRecentOrderItem["status"], string> = {
  registered: "Registrada",
  sent_for_signature: "Aguardando assinatura",
  signed: "Assinada",
};

const STATUS_COLOR: Record<
  DashboardRecentOrderItem["status"],
  "default" | "warning" | "success"
> = {
  registered: "default",
  sent_for_signature: "warning",
  signed: "success",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("pt-BR");
};

export const RecentOrders: React.FC<Props> = ({ items, loading = false }) => {
  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
        <CircularProgress size={24} />
      </Stack>
    );
  }

  if (!items.length) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
        <Typography variant="body2" color="text.secondary">
          Sem ordens recentes para exibir.
        </Typography>
      </Stack>
    );
  }

  return (
      <Stack spacing={0} sx={{ height: "100%", overflowY: "auto", px: 2 }}>
        {items.map((order, index) => (
          <Box
            key={order.id}
            py={1.5}
            px={1}
            sx={{
              borderRadius: 2,
              transition: "background-color 180ms ease, transform 180ms ease",
              "&:hover": {
                backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.45),
                transform: {
                  xs: "none",
                  md: "translateX(2px)",
                },
              },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Stack spacing={0.25}>
              <Typography variant="body2" fontWeight={700}>
                OS {order.orderNumber || "-"} - {order.customerName || "Sem cliente"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {order.vehicle || "Veículo não informado"}
              </Typography>
            </Stack>
            <Chip size="small" color={STATUS_COLOR[order.status]} label={STATUS_LABEL[order.status]} />
          </Stack>

          <Stack direction="row" justifyContent="space-between" mt={0.75}>
            <Typography variant="caption" color="text.secondary">
              Atualizado em {formatDateTime(order.updatedAt)}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatCurrency(order.total)}
            </Typography>
          </Stack>

          {index < items.length - 1 ? <Divider sx={{ mt: 1.5 }} /> : null}
        </Box>
      ))}
    </Stack>
  );
};
