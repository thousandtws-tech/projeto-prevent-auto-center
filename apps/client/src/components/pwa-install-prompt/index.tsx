import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddToHomeScreenRoundedIcon from "@mui/icons-material/AddToHomeScreenRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const DISMISS_STORAGE_KEY = "prevent-auto-pwa-install-dismissed-at";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const wasRecentlyDismissed = () => {
  const rawValue = window.localStorage.getItem(DISMISS_STORAGE_KEY);
  const dismissedAt = rawValue ? Number(rawValue) : 0;

  return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_TTL_MS;
};

const isStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

const getDeviceContext = () => {
  const userAgent = window.navigator.userAgent;
  const isIos =
    /iphone|ipad|ipod/i.test(userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const isSafari =
    /safari/i.test(userAgent) &&
    !/chrome|android|crios|fxios|edgios/i.test(userAgent);
  const isMobile =
    window.matchMedia("(max-width: 900px)").matches ||
    window.matchMedia("(pointer: coarse)").matches;

  return {
    isIos,
    isMobile,
    isSafari,
    isStandalone: isStandaloneMode(),
  };
};

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const deviceContext = useMemo(
    () =>
      typeof window === "undefined"
        ? {
            isIos: false,
            isMobile: false,
            isSafari: false,
            isStandalone: false,
          }
        : getDeviceContext(),
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!deviceContext.isMobile || deviceContext.isStandalone || wasRecentlyDismissed()) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      window.localStorage.removeItem(DISMISS_STORAGE_KEY);
      setDeferredPrompt(null);
      setIsVisible(false);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    if (deviceContext.isIos && deviceContext.isSafari) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [deviceContext]);

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    setIsVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice.catch(() => null);

      if (result?.outcome === "accepted") {
        window.localStorage.removeItem(DISMISS_STORAGE_KEY);
        setIsVisible(false);
      } else {
        handleDismiss();
      }
    } finally {
      setDeferredPrompt(null);
      setIsInstalling(false);
    }
  };

  const shouldShowIosInstructions =
    deviceContext.isIos && deviceContext.isSafari && !deferredPrompt;
  const shouldRender =
    deviceContext.isMobile &&
    !deviceContext.isStandalone &&
    isVisible &&
    (Boolean(deferredPrompt) || shouldShowIosInstructions);

  if (!shouldRender) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        left: "50%",
        bottom: "calc(16px + env(safe-area-inset-bottom))",
        transform: "translateX(-50%)",
        width: "min(calc(100vw - 24px), 560px)",
        px: { xs: 2, sm: 2.5 },
        py: { xs: 1.75, sm: 2 },
        zIndex: (theme) => theme.zIndex.snackbar + 1,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => theme.palette.background.paper,
        boxShadow: "none",
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <Box
              sx={{
                width: 40,
                height: 40,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                flexShrink: 0,
              }}
            >
              <AddToHomeScreenRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Instale o sistema no celular
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {shouldShowIosInstructions
                  ? "No iPhone, abra no Safari e adicione este sistema na tela inicial para usar como app."
                  : "Instale o Prevent Auto Mecânica para abrir em tela cheia e acessar mais rápido no Android ou iPhone."}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={handleDismiss} aria-label="Fechar">
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        {shouldShowIosInstructions ? (
          <Stack spacing={0.75}>
            <Typography variant="body2">
              1. Toque em <strong>Compartilhar</strong>{" "}
              <IosShareRoundedIcon
                sx={{ fontSize: 16, verticalAlign: "text-bottom", mx: 0.25 }}
              />
              no Safari.
            </Typography>
            <Typography variant="body2">
              2. Escolha <strong>Adicionar à Tela de Início</strong>.
            </Typography>
            <Typography variant="body2">
              3. Confirme para abrir o sistema como app no iPhone.
            </Typography>
          </Stack>
        ) : (
          <Button
            variant="contained"
            onClick={handleInstall}
            disabled={isInstalling}
            fullWidth
          >
            {isInstalling ? "Preparando instalação..." : "Instalar aplicativo"}
          </Button>
        )}
      </Stack>
    </Paper>
  );
};
