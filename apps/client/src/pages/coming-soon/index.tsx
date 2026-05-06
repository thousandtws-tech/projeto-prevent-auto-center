import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { useNavigate } from "react-router";

import { RefineListView } from "../../components";

type ComingSoonPageProps = {
  title: string;
  description: string;
};

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
  title,
  description,
}) => {
  const navigate = useNavigate();

  return (
    <RefineListView
      canCreate={false}
      title={title}
      headerButtons={() => (
        <Button
          variant="outlined"
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate("/")}
        >
          Voltar
        </Button>
      )}
    >
      <Paper variant="outlined" sx={{ p: { xs: 4, md: 6 }, borderRadius: 3 }}>
        <Stack spacing={2} sx={{ maxWidth: 640 }}>
          <Typography variant="h5" fontWeight={800}>
            {title}
          </Typography>
          <Typography color="text.secondary">{description}</Typography>
          <Box>
            <Button variant="contained" onClick={() => navigate("/")}>
              Abrir dashboard
            </Button>
          </Box>
        </Stack>
      </Paper>
    </RefineListView>
  );
};
