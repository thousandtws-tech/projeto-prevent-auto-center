import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

export type DashboardTrendingValueItem = {
  label: string;
  count: number;
  totalValue: number;
};

export type DashboardTrendingCountItem = {
  label: string;
  count: number;
};

type Props = {
  refusedParts: DashboardTrendingValueItem[];
  refusedServices: DashboardTrendingValueItem[];
  scheduledServices: DashboardTrendingCountItem[];
  loading?: boolean;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);

const Section: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <Stack spacing={1.25}>
    <Typography variant="body2" fontWeight={700}>
      {title}
    </Typography>
    <Box>{children}</Box>
  </Stack>
);

export const TrendingMenu: React.FC<Props> = ({
  refusedParts,
  refusedServices,
  scheduledServices,
  loading = false,
}) => {
  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
        <CircularProgress size={24} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2} sx={{ p: 2, height: "100%", overflowY: "auto" }}>
      <Section title="Peças Mais Recusadas">
        {refusedParts.length ? (
          <Stack spacing={1}>
            {refusedParts.slice(0, 4).map((item) => (
              <Stack
                key={`part-${item.label}`}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
                sx={{
                  p: 0.5,
                  borderRadius: 1.5,
                  transition: "background-color 160ms ease",
                  "&:hover": {
                    backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.45),
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ maxWidth: "70%" }} noWrap>
                  {item.label}
                </Typography>
                <Chip size="small" label={`${item.count}x`} />
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Sem peças recusadas no período.
          </Typography>
        )}
      </Section>

      <Divider />

      <Section title="Serviços Mais Recusados">
        {refusedServices.length ? (
          <Stack spacing={1}>
            {refusedServices.slice(0, 4).map((item) => (
              <Stack
                key={`service-${item.label}`}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
                sx={{
                  p: 0.5,
                  borderRadius: 1.5,
                  transition: "background-color 160ms ease",
                  "&:hover": {
                    backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.45),
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ maxWidth: "70%" }} noWrap>
                  {item.label}
                </Typography>
                <Chip size="small" label={formatCurrency(item.totalValue)} />
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Sem serviços recusados no período.
          </Typography>
        )}
      </Section>

      <Divider />

      <Section title="Serviços Mais Agendados">
        {scheduledServices.length ? (
          <Stack spacing={1}>
            {scheduledServices.slice(0, 4).map((item) => (
              <Stack
                key={`scheduled-${item.label}`}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
                sx={{
                  p: 0.5,
                  borderRadius: 1.5,
                  transition: "background-color 160ms ease",
                  "&:hover": {
                    backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.45),
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ maxWidth: "70%" }} noWrap>
                  {item.label}
                </Typography>
                <Chip size="small" label={`${item.count}`} />
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Sem agendamentos no período.
          </Typography>
        )}
      </Section>
    </Stack>
  );
};
