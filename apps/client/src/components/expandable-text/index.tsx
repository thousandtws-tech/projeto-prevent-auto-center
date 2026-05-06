import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";

type ExpandableTextProps = {
  text?: string | null;
  maxChars?: number;
  title?: string;
  emptyText?: string;
};

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxChars = 30,
  title = "Texto completo",
  emptyText = "-",
}) => {
  const [open, setOpen] = useState(false);

  const normalized = useMemo(() => {
    const value = typeof text === "string" ? text.trim() : "";
    return value || emptyText;
  }, [emptyText, text]);

  const shouldExpand = normalized.length > maxChars;
  const preview = shouldExpand
    ? `${normalized.slice(0, Math.max(1, maxChars - 1)).trimEnd()}...`
    : normalized;

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
        <Typography variant="body2" noWrap title={normalized} sx={{ minWidth: 0, flex: 1 }}>
          {preview}
        </Typography>
        {shouldExpand ? (
          <Button
            size="small"
            onClick={() => setOpen(true)}
            sx={{
              minWidth: "auto",
              px: 0.5,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Ver mais
          </Button>
        ) : null}
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {normalized}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
