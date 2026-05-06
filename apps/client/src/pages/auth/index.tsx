import * as React from "react";
import { AuthPage as MUIAuthPage, type AuthProps } from "@refinedev/mui";
import { alpha } from "@mui/material/styles";
import { Link, useNavigate, useSearchParams } from "react-router";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { authProvider } from "../../authProvider";
import { isBackendApiEnabled } from "../../services/httpClient";
import type {
  AuthMode,
  CorporateAuthPageProps,
  HighlightItem,
  LoginFormState,
  PasswordVisibilityState,
  RegisterFormState,
} from "../../interfaces";

const BRAND = {
  base: "#050505",
  panel: "#111111",
  primary: "#f8c400",
  primarySoft: "#f5d700",
  primaryBright: "#ffec00",
  paper: "#0d0d0d",
  text: "#fff6d8",
  textMuted: "#bda85a",
  whiteSoft: "#fff9e8",
} as const;

const authWrapperProps = {
  style: {
    minHeight: "100vh",
    backgroundColor: BRAND.base,
  },
};

const renderAuthContent = (content: React.ReactNode) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 440 }}>
        <Stack spacing={1.5} alignItems="center" mb={3}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "14px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: BRAND.base,
              color: BRAND.whiteSoft,
            }}
          >
            <Box
              component="img"
              src="/logo-branco.svg"
              alt="Prevent Auto Mecânica"
              sx={{ width: 26, height: 26, objectFit: "contain" }}
            />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: BRAND.whiteSoft }}>
            Prevent Auto Mecânica
          </Typography>
        </Stack>
        {content}
      </Box>
    </Box>
  );
};


const formFieldSx = {
  "& .MuiInputLabel-root": {
    fontWeight: 600,
    color: BRAND.textMuted,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: BRAND.text,
  },
  "& .MuiInputLabel-root.MuiFormLabel-filled": {
    color: BRAND.text,
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#121212",
    color: BRAND.text,
    transition:
      "border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease",
    "& input": {
      color: BRAND.text,
      fontWeight: 500,
    },
    "& input::placeholder": {
      color: alpha(BRAND.text, 0.48),
      opacity: 1,
    },
    "& fieldset": {
      borderColor: alpha(BRAND.primarySoft, 0.3),
    },
    "&:hover fieldset": {
      borderColor: alpha(BRAND.primary, 0.9),
    },
    "&.Mui-focused": {
      backgroundColor: "#171717",
      boxShadow: `0 0 0 3px ${alpha(BRAND.primary, 0.18)}`,
      "& fieldset": {
        borderColor: BRAND.primary,
        borderWidth: "1px",
      },
    },
  },
  "& .MuiFormHelperText-root": {
    color: BRAND.textMuted,
    fontWeight: 500,
    marginLeft: 0,
  },
};

const toRecord = (value: unknown) =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const getString = (value: unknown) => (typeof value === "string" ? value : "");

const buildLoginDefaults = (defaultValues: unknown): LoginFormState => {
  const record = toRecord(defaultValues);

  return {
    workshopSlug: getString(record.workshopSlug),
    email: getString(record.email),
    password: getString(record.password),
  };
};

const buildRegisterDefaults = (defaultValues: unknown): RegisterFormState => {
  const record = toRecord(defaultValues);

  return {
    workshopName: getString(record.workshopName),
    workshopSlug: getString(record.workshopSlug),
    ownerName: getString(record.ownerName),
    email: getString(record.email),
    password: getString(record.password),
    confirmPassword: getString(record.password),
  };
};

const cardTitleByType: Record<AuthMode, string> = {
  login: "Acessar conta",
  register: "Cadastrar oficina",
};

const cardDescriptionByType = (type: AuthMode, backendEnabled: boolean) => {
  if (type === "login") {
    return backendEnabled
      ? "Entre com os dados da oficina para continuar a operação."
      : "Preencha e-mail e senha para navegar no modo de demonstração.";
  }

  return backendEnabled
    ? "Crie o primeiro usuário administrador da operação. A oficina será provisionada automaticamente."
    : "Crie um acesso local para visualizar a experiência de cadastro.";
};

const heroTitleByType: Record<AuthMode, string> = {
  login: "Gestão da oficina com entrada clara e profissional.",
  register: "Onboarding enxuto para iniciar a operação com consistência.",
};

const heroDescriptionByType: Record<AuthMode, string> = {
  login:
    "Um fluxo de acesso pensado para ambiente B2B, com foco em clareza, segurança e continuidade operacional.",
  register:
    "Crie o acesso inicial com um processo simples, objetivo e adequado para um software de gestão corporativo.",
};

const submitLabelByType: Record<AuthMode, string> = {
  login: "Entrar",
  register: "Criar conta",
};

const getHighlights = (type: AuthMode): HighlightItem[] => {
  if (type === "login") {
    return [
      {
        title: "Acesso por oficina",
        description:
          "Separe ambientes por slug e mantenha contexto por operação.",
        icon: <StorefrontOutlinedIcon sx={{ fontSize: 20 }} />,
      },
      {
        title: "Fluxo centralizado",
        description:
          "Atendimento, agenda e ordens de serviço no mesmo sistema.",
        icon: <BusinessCenterOutlinedIcon sx={{ fontSize: 20 }} />,
      },
      {
        title: "Rastreabilidade",
        description: "Histórico e sessão mantidos em um processo consistente.",
        icon: <ShieldOutlinedIcon sx={{ fontSize: 20 }} />,
      },
    ];
  }

  return [
    {
      title: "Estrutura inicial",
      description:
        "A oficina é criada automaticamente junto com o responsável inicial.",
      icon: <BusinessCenterOutlinedIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: "Administrador inicial",
      description:
        "Crie a conta principal que dará início à gestão do ambiente.",
      icon: <PersonOutlineRoundedIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: "Base pronta para operar",
      description:
        "Comece com um cadastro alinhado à rotina de um software B2B.",
      icon: <ShieldOutlinedIcon sx={{ fontSize: 20 }} />,
    },
  ];
};

const CorporateAuthPage: React.FC<CorporateAuthPageProps> = ({
  type,
  formProps,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const backendEnabled = isBackendApiEnabled();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [loginForm, setLoginForm] = React.useState<LoginFormState>(() =>
    buildLoginDefaults(formProps?.defaultValues),
  );
  const [registerForm, setRegisterForm] = React.useState<RegisterFormState>(
    () => buildRegisterDefaults(formProps?.defaultValues),
  );
  const [passwordVisibility, setPasswordVisibility] =
    React.useState<PasswordVisibilityState>({
      login: false,
      register: false,
      confirm: false,
    });
  const infoMessage = type === "login" ? searchParams.get("message")?.trim() ?? "" : "";

  React.useEffect(() => {
    if (type !== "login") {
      return;
    }

    const emailFromQuery = searchParams.get("email")?.trim() ?? "";
    const workshopSlugFromQuery = searchParams.get("workshopSlug")?.trim() ?? "";

    if (!emailFromQuery && !workshopSlugFromQuery) {
      return;
    }

    setLoginForm((current) => ({
      ...current,
      email: emailFromQuery || current.email,
      workshopSlug: workshopSlugFromQuery || current.workshopSlug,
    }));
  }, [searchParams, type]);

  const highlights = getHighlights(type);

  const handleLoginFieldChange =
    (field: keyof LoginFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setLoginForm((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const handleRegisterFieldChange =
    (field: keyof RegisterFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setRegisterForm((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const togglePasswordVisibility =
    (field: keyof PasswordVisibilityState) => () => {
      setPasswordVisibility((current) => ({
        ...current,
        [field]: !current[field],
      }));
    };

  const preventMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const buildPasswordAdornment = (field: keyof PasswordVisibilityState) => ({
    startAdornment: (
      <InputAdornment position="start">
        <LockOutlinedIcon sx={{ color: alpha(BRAND.text, 0.62) }} />
      </InputAdornment>
    ),
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          edge="end"
          aria-label={
            passwordVisibility[field] ? "Ocultar senha" : "Mostrar senha"
          }
          onClick={togglePasswordVisibility(field)}
          onMouseDown={preventMouseDown}
        >
          {passwordVisibility[field] ? (
            <VisibilityOffRoundedIcon fontSize="small" />
          ) : (
            <VisibilityRoundedIcon fontSize="small" />
          )}
        </IconButton>
      </InputAdornment>
    ),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (type === "login") {
        const response = await authProvider.login({
          workshopSlug: loginForm.workshopSlug,
          email: loginForm.email,
          password: loginForm.password,
        });

        if (!response.success) {
          setErrorMessage(response.error?.message ?? "Falha ao entrar.");
          return;
        }

        navigate(response.redirectTo ?? "/", { replace: true });
        return;
      }

      if (registerForm.password !== registerForm.confirmPassword) {
        setErrorMessage("A confirmação da senha não corresponde.");
        return;
      }

      const response = await authProvider.register?.({
        workshopName: registerForm.workshopName,
        workshopSlug: registerForm.workshopSlug,
        ownerName: registerForm.ownerName,
        email: registerForm.email,
        password: registerForm.password,
      });

      if (!response?.success) {
        setErrorMessage(response?.error?.message ?? "Falha ao criar a conta.");
        return;
      }

      navigate(response.redirectTo ?? "/", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: BRAND.base,
        px: { xs: 2, md: 4 },
        py: { xs: 2, md: 4 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: "100%",
          mx: "auto",
          minHeight: { xs: "auto", lg: "calc(100vh - 64px)" },
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1fr) minmax(430px, 500px)",
          },
          borderRadius: { xs: "20px", md: "24px" },
          overflow: "hidden",
          border: `1px solid ${alpha(BRAND.primarySoft, 0.36)}`,
          boxShadow: "none",
          backgroundColor: BRAND.base,
        }}
      >
        <Box
          sx={{
            p: { xs: 3, md: 6 },
            bgcolor: BRAND.base,
            borderRight: { lg: `1px solid ${alpha(BRAND.primarySoft, 0.18)}` },
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: { xs: 4, md: 6 },
          }}
        >
          <Stack spacing={4}>
            <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  component="img"
                  src="/logo-branco.svg"
                  alt="Prevent Auto Mecânica"
                  sx={{
                    width: 140,
                    height: 90,
                    objectFit: "contain",
                  }}
                />
            </Stack>

            <Stack spacing={1.5} maxWidth={560}>
              <Typography
                variant="overline"
                sx={{
                  color: BRAND.primary,
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                }}
              >
                {backendEnabled ? "Ambiente corporativo" : "Modo demonstração"}
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  color: BRAND.whiteSoft,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  fontSize: { xs: "1.85rem", md: "2.6rem" },
                }}
              >
                {heroTitleByType[type]}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: alpha(BRAND.whiteSoft, 0.82),
                  lineHeight: 1.8,
                  maxWidth: 560,
                }}
              >
                {heroDescriptionByType[type]}
              </Typography>
            </Stack>

            <Stack spacing={0}>
              {highlights.map((item, index) => (
                <Box
                  key={item.title}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr",
                    columnGap: 2,
                    py: 2.25,
                    borderTop:
                      index === 0
                        ? "none"
                        : `1px solid ${alpha(BRAND.primarySoft, 0.18)}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: BRAND.primarySoft,
                      color: BRAND.base,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, color: BRAND.whiteSoft }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: alpha(BRAND.whiteSoft, 0.76), lineHeight: 1.6 }}
                    >
                      {item.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Stack>

          <Box
            sx={{
              pt: 2,
              borderTop: `1px solid ${alpha(BRAND.primarySoft, 0.18)}`,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: alpha(BRAND.whiteSoft, 0.78), lineHeight: 1.8 }}
            >
              {backendEnabled
                ? "O acesso permanece segmentado por oficina, preservando contexto para equipe, clientes e execução."
                : "Sem backend ativo, o fluxo mantém a interface funcional para testes de navegação e revisão visual."}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 3, md: 6 },
            bgcolor: BRAND.paper,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: "100%" }}>
            <Stack spacing={3} component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    p: 0.5,
                    borderRadius: "14px",
                    border: `1px solid ${alpha(BRAND.primarySoft, 0.32)}`,
                    backgroundColor: alpha("#000000", 0.28),
                    width: "fit-content",
                  }}
                >
                  <Button
                    component={Link}
                    to="/login"
                    disableElevation
                    variant={type === "login" ? "contained" : "text"}
                    sx={{
                      minWidth: 118,
                      borderRadius: "10px",
                      px: 2,
                      py: 1,
                      fontWeight: 700,
                      color: type === "login" ? BRAND.base : BRAND.text,
                      backgroundColor:
                        type === "login" ? BRAND.primary : "transparent",
                      "&:hover": {
                        backgroundColor:
                          type === "login"
                            ? BRAND.primary
                            : alpha(BRAND.primary, 0.12),
                      },
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    disableElevation
                    variant={type === "register" ? "contained" : "text"}
                    sx={{
                      minWidth: 118,
                      borderRadius: "10px",
                      px: 2,
                      py: 1,
                      fontWeight: 700,
                      color: type === "register" ? BRAND.base : BRAND.text,
                      backgroundColor:
                        type === "register" ? BRAND.primary : "transparent",
                      "&:hover": {
                        backgroundColor:
                          type === "register"
                            ? BRAND.primary
                            : alpha(BRAND.primary, 0.12),
                      },
                    }}
                  >
                    Cadastro
                  </Button>
                </Stack>

                <Stack spacing={1}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: BRAND.primary,
                      letterSpacing: "0.12em",
                      fontWeight: 700,
                    }}
                  >
                    {backendEnabled ? "Acesso seguro" : "Demonstração"}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: BRAND.text }}
                  >
                    {cardTitleByType[type]}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: BRAND.textMuted, lineHeight: 1.7 }}
                  >
                    {cardDescriptionByType(type, backendEnabled)}
                  </Typography>
                </Stack>
              </Stack>

              {errorMessage ? (
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: "12px",
                    alignItems: "center",
                    backgroundColor: alpha("#2b1010", 0.95),
                    color: "#ffd7d7",
                    border: "1px solid rgba(244, 67, 54, 0.24)",
                  }}
                >
                  {errorMessage}
                </Alert>
              ) : null}

              {!errorMessage && infoMessage ? (
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: "12px",
                    alignItems: "center",
                    backgroundColor: alpha("#102538", 0.95),
                    color: "#dff4ff",
                    border: "1px solid rgba(33, 150, 243, 0.24)",
                  }}
                >
                  {infoMessage}
                </Alert>
              ) : null}

              {type === "login" ? (
                <Stack spacing={2}>
                  <TextField
                    label="E-mail"
                    type="email"
                    value={loginForm.email}
                    onChange={handleLoginFieldChange("email")}
                    fullWidth
                    required
                    autoFocus
                    autoComplete="email"
                    sx={formFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon
                            sx={{ color: alpha(BRAND.text, 0.62) }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Senha"
                    type={passwordVisibility.login ? "text" : "password"}
                    value={loginForm.password}
                    onChange={handleLoginFieldChange("password")}
                    fullWidth
                    required
                    autoComplete="current-password"
                    sx={formFieldSx}
                    InputProps={buildPasswordAdornment("login")}
                  />
                </Stack>
              ) : (
                <Stack spacing={2}>
                  {backendEnabled ? (
                    <>
                      <TextField
                        label="Nome do responsável"
                        value={registerForm.ownerName}
                        onChange={handleRegisterFieldChange("ownerName")}
                        fullWidth
                        required
                        autoFocus
                        sx={formFieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonOutlineRoundedIcon
                                sx={{ color: alpha(BRAND.text, 0.62) }}
                              />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </>
                  ) : null}
                  <TextField
                    label="E-mail"
                    type="email"
                    value={registerForm.email}
                    onChange={handleRegisterFieldChange("email")}
                    fullWidth
                    required
                    autoFocus={!backendEnabled}
                    autoComplete="email"
                    sx={formFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon
                            sx={{ color: alpha(BRAND.text, 0.62) }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Senha"
                    type={passwordVisibility.register ? "text" : "password"}
                    value={registerForm.password}
                    onChange={handleRegisterFieldChange("password")}
                    fullWidth
                    required
                    autoComplete="new-password"
                    sx={formFieldSx}
                    InputProps={buildPasswordAdornment("register")}
                  />
                  <TextField
                    label="Confirmar senha"
                    type={passwordVisibility.confirm ? "text" : "password"}
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterFieldChange("confirmPassword")}
                    fullWidth
                    required
                    autoComplete="new-password"
                    sx={formFieldSx}
                    InputProps={buildPasswordAdornment("confirm")}
                  />
                </Stack>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                fullWidth
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : undefined
                }
                sx={{
                  minHeight: 52,
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "0.98rem",
                  color: BRAND.base,
                  backgroundColor: BRAND.primary,
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: BRAND.primarySoft,
                    boxShadow: "none",
                  },
                }}
              >
                {submitLabelByType[type]}
              </Button>

              <Typography
                variant="body2"
                sx={{ color: BRAND.textMuted, lineHeight: 1.7 }}
              >
                {type === "login"
                  ? backendEnabled
                    ? "Use e-mail e senha para entrar no sistema."
                    : "No modo de demonstração, os campos servem para validar a experiência visual da interface."
                  : backendEnabled
                  ? "Ao concluir o cadastro, a oficina é provisionada, o usuário inicial recebe papel de administração e a liberação do acesso acontece por confirmação no e-mail."
                  : "O cadastro local não cria registro remoto, apenas libera a navegação para testes."}
              </Typography>

              <Typography
                variant="body2"
                sx={{ textAlign: "center", color: BRAND.textMuted }}
              >
                {type === "login"
                  ? "Ainda não possui cadastro?"
                  : "Já possui acesso?"}{" "}
                <Box
                  component={Link}
                  to={type === "login" ? "/register" : "/login"}
                  sx={{
                    color: BRAND.primary,
                    fontWeight: 700,
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  {type === "login" ? "Criar conta" : "Voltar para login"}
                </Box>
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export const AuthPage: React.FC<AuthProps> = ({ type, formProps }) => {
  if (type === "login" || type === "register") {
    return <CorporateAuthPage type={type} formProps={formProps} />;
  }

  return (
    <MUIAuthPage
      type={type}
      wrapperProps={authWrapperProps}
      renderContent={renderAuthContent}
      formProps={formProps}
    />
  );
};
