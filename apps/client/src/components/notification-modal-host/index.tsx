import { useMemo, useSyncExternalStore } from "react";
import type { OpenNotificationParams } from "@refinedev/core";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import {
  closeModalNotification,
  getCurrentModalNotification,
  subscribeToModalNotifications,
} from "../../providers/notificationModalStore";

type NotificationKind = NonNullable<OpenNotificationParams["type"]>;

const resolveMeta = (kind: NotificationKind | undefined) => {
  switch (kind) {
    case "success":
      return {
        color: "success.main",
        Icon: CheckCircleOutlineOutlinedIcon,
        title: "Sucesso",
        showSpinner: false,
      } as const;
    case "error":
      return {
        color: "error.main",
        Icon: ErrorOutlineOutlinedIcon,
        title: "Erro",
        showSpinner: false,
      } as const;
    case "progress":
      return {
        color: "info.main",
        Icon: InfoOutlinedIcon,
        title: "Processando",
        showSpinner: true,
      } as const;
    default:
      return {
        color: "info.main",
        Icon: WarningAmberOutlinedIcon,
        title: "Aviso",
        showSpinner: false,
      } as const;
  }
};

export const NotificationModalHost: React.FC = () => {
  const notification = useSyncExternalStore(
    subscribeToModalNotifications,
    getCurrentModalNotification,
    getCurrentModalNotification,
  );

  const meta = useMemo(
    () => resolveMeta(notification?.type),
    [notification?.type],
  );

  const message = notification?.message ? String(notification.message) : "";
  const description = notification?.description
    ? String(notification.description)
    : "";

  return (
    <Dialog
      open={Boolean(notification)}
      onClose={() => closeModalNotification(notification?.key)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ pb: 1.25 }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box sx={{ color: meta.color, display: "inline-flex" }}>
            <meta.Icon />
          </Box>
          <Stack spacing={0.2} sx={{ flex: 1 }}>
            <Typography fontWeight={800}>{meta.title}</Typography>
            {message ? (
              <Typography variant="body2" color="text.secondary">
                {message}
              </Typography>
            ) : null}
          </Stack>
          {meta.showSpinner ? <CircularProgress size={18} /> : null}
        </Stack>
      </DialogTitle>
      {description ? (
        <DialogContent dividers sx={{ py: 2.25 }}>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
            {description}
          </Typography>
        </DialogContent>
      ) : null}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={() => closeModalNotification(notification?.key)}
        >
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
};
