import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

export type DashboardTimelineItem = {
  id: string;
  title: string;
  description: string;
  at: string;
  kind: "service-order" | "appointment" | "notification" | "customer";
};

type Props = {
  items: DashboardTimelineItem[];
  loading?: boolean;
};

const ITEM_KIND_LABEL: Record<DashboardTimelineItem["kind"], string> = {
  "service-order": "OS",
  appointment: "Agendamento",
  notification: "Notificação",
  customer: "Cliente",
};

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("pt-BR");
};

export const OrderTimeline: React.FC<Props> = ({ items, loading = false }) => {
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
          Sem movimentações recentes para exibir.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={1} sx={{ height: "100%", overflowY: "auto", p: 2 }}>
      {items.map((item) => (
        <Box
          key={item.id}
          sx={{
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 1.5,
            backgroundColor: "background.default",
            transition: "transform 180ms ease, border-color 180ms ease",
            "&:hover": {
              transform: {
                xs: "none",
                md: "translateX(2px)",
              },
              borderColor: (theme) => alpha(theme.palette.warning.main, 0.5),
            },
          }}
        >
          <Stack direction="row" justifyContent="space-between" spacing={1} mb={0.5}>
            <Chip
              size="small"
              label={ITEM_KIND_LABEL[item.kind]}
              variant="outlined"
              sx={{ width: "fit-content" }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatDateTime(item.at)}
            </Typography>
          </Stack>
          <Typography variant="body2" fontWeight={600}>
            {item.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.description}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
};
