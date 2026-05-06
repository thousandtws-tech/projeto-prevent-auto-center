import { useEffect, useState } from "react";
import { Link } from "react-router";
import Box from "@mui/material/Box";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import { useTheme } from "@mui/material/styles";
import {
  APP_SETTINGS_UPDATED_EVENT,
  type AppSettings,
  readAppSettings,
} from "../../services/appSettings";

type TitleProps = {
  collapsed: boolean;
};

const DEFAULT_SIDEBAR_LOGO_URL = "/logo-branco.svg";
const DEFAULT_SIDEBAR_LOGO_URL_LIGHT = "/logo-preto.svg";

const resolveSidebarLogoUrl = (value?: string) => {
  const normalized = value?.trim() ?? "";
  return normalized || DEFAULT_SIDEBAR_LOGO_URL;
};

export const Title: React.FC<TitleProps> = ({ collapsed }) => {
  const theme = useTheme();
  const [sidebarLogoUrl, setSidebarLogoUrl] = useState(
    () => resolveSidebarLogoUrl(readAppSettings().branding.sidebarLogoUrl),
  );

  const resolvedLogoUrl =
    theme.palette.mode === "light" && sidebarLogoUrl === DEFAULT_SIDEBAR_LOGO_URL
      ? DEFAULT_SIDEBAR_LOGO_URL_LIGHT
      : sidebarLogoUrl;

  useEffect(() => {
    const handleSettingsUpdate: EventListener = (event) => {
      const customEvent = event as CustomEvent<AppSettings>;
      const eventLogo = customEvent.detail?.branding?.sidebarLogoUrl;

      if (typeof eventLogo === "string") {
        setSidebarLogoUrl(resolveSidebarLogoUrl(eventLogo));
        return;
      }

      setSidebarLogoUrl(
        resolveSidebarLogoUrl(readAppSettings().branding.sidebarLogoUrl),
      );
    };

    window.addEventListener(APP_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);

    return () => {
      window.removeEventListener(APP_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    };
  }, []);

  const logoNode = resolvedLogoUrl ? (
    <Box
      component="img"
      src={resolvedLogoUrl}
      alt="Logo Prevent Auto Mecanica"
      sx={{
        width: collapsed ? 32 : 220,
        height: collapsed ? 32 : 54,
        objectFit: "contain",
        objectPosition: "left center",
      }}
    />
  ) : (
    <BusinessCenterOutlinedIcon sx={{ fontSize: 30 }} />
  );

  return (
    <Link to="/">
      <Box
        display="flex"
        alignItems="center"
        gap={0}
        sx={{
          color: "text.primary",
        }}
      >
        {logoNode}
      </Box>
    </Link>
  );
};
