import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { CompanyBannerProps } from "../../interfaces";


const DEFAULT_LOGO = "/logo-branco.svg";
const BRAND_COLORS = {
  primaryGold: "#f8c400",
  lightText: "#f8f8f9",
  deepBlack: "#070707",
} as const;

export const CompanyBanner: React.FC<CompanyBannerProps> = ({
  logoSrc = DEFAULT_LOGO,
  logoAlt = "Logo Prevent Auto Mecanica",
  title,
  subtitle = "Atendimento transparente, gestão rápida e controle completo das ordens de serviço.",
}) => {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        minHeight: { xs: 170, md: 210 },
        borderRadius: 2,
        overflow: "hidden",
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: BRAND_COLORS.deepBlack,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: BRAND_COLORS.primaryGold,
        }}
      />

      <Stack
        spacing={1.1}
        justifyContent="center"
        alignItems="flex-start"
        sx={{
          position: "relative",
          zIndex: 1,
          px: { xs: 2.2, md: 4 },
          py: { xs: 2.6, md: 3.3 },
          minHeight: { xs: 170, md: 210 },
        }}
      >
        <Box
          component="img"
          src={logoSrc}
          alt={logoAlt}
          sx={{
            width: { xs: 190, md: 280 },
            maxWidth: "100%",
            height: "auto",
            display: "block",
            objectFit: "contain",
            filter: "drop-shadow(0px 3px 10px rgba(0,0,0,0.35))",
          }}
        />

        {title ? (
          <Typography
            variant="h6"
            sx={{
              color: BRAND_COLORS.lightText,
              fontWeight: 700,
              lineHeight: 1.2,
              textShadow: "0 1px 3px rgba(0,0,0,0.45)",
            }}
          >
            {title}
          </Typography>
        ) : null}

        <Typography
          variant="body2"
          sx={{
            color: "rgba(248,248,249,0.88)",
            maxWidth: 560,
          }}
        >
          {subtitle}
        </Typography>
      </Stack>
    </Box>
  );
};
