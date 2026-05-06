import { alpha, createTheme } from "@mui/material/styles";
import type { PaletteMode, Shadows, ThemeOptions } from "@mui/material";

const FONT_BODY = '"Manrope", "Segoe UI", sans-serif';
const FONT_DISPLAY = '"Space Grotesk", "Manrope", sans-serif';
export const APP_SPACING_BASE = 4;
export const APP_SPACING_SCALE = {
  xxs: APP_SPACING_BASE,
  xs: APP_SPACING_BASE * 2,
  sm: APP_SPACING_BASE * 3,
  md: APP_SPACING_BASE * 4,
  lg: APP_SPACING_BASE * 6,
  xl: APP_SPACING_BASE * 8,
  xxl: APP_SPACING_BASE * 12,
  section: APP_SPACING_BASE * 20,
} as const;
export const APP_RADIUS_SCALE = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  pill: 999,
  full: "9999px",
} as const;
export const APP_SURFACES = {
  canvasDark: "#0b0e11",
  cardDark: "#1e2329",
  elevatedDark: "#2b3139",
  canvasLight: "#ffffff",
  softLight: "#f5f5f0",
  hairlineDark: "rgba(255, 255, 255, 0.1)",
  hairlineLight: "rgba(35, 26, 15, 0.12)",
  infoRing: "#3da6ff",
} as const;
export const APP_BREAKPOINTS = {
  mobile: 375,
  smallPhone: 600,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
  wide: 1440,
} as const;
const APP_FLAT_SHADOWS = Array(25).fill("none") as Shadows;
const BRAND = {
  primary: "#f8c400",
  primarySoft: "#f5d700",
  primaryBright: "#ffec00",
  white: "#f8f8f9",
  dark: "#050505",
  darkSoft: "#111111",
  text: "#231a0f",
  textMuted: "#6f6458",
} as const;

const createAppTheme = (mode: PaletteMode) => {
  const isDark = mode === "dark";

  const palette = {
    mode,
    primary: {
      main: BRAND.primary,
      light: BRAND.primaryBright,
      dark: BRAND.primarySoft,
      contrastText: "#1d1608",
    },
    secondary: {
      main: BRAND.primarySoft,
      light: BRAND.primaryBright,
      dark: BRAND.primary,
      contrastText: "#1d1608",
    },
    success: {
      main: isDark ? "#6fcf97" : "#1e8e5a",
    },
    warning: {
      main: BRAND.primaryBright,
    },
    error: {
      main: isDark ? "#ff7e72" : "#c94538",
    },
    info: {
      main: APP_SURFACES.infoRing,
    },
    background: {
      default: isDark ? APP_SURFACES.canvasDark : APP_SURFACES.softLight,
      paper: isDark ? APP_SURFACES.cardDark : APP_SURFACES.canvasLight,
    },
    text: {
      primary: isDark ? "#f6eddc" : BRAND.text,
      secondary: isDark ? "#cabca8" : BRAND.textMuted,
    },
    divider: isDark
      ? alpha(BRAND.white, 0.12)
      : alpha(BRAND.textMuted, 0.16),
  } satisfies ThemeOptions["palette"];

  const theme = createTheme({
    palette,
    breakpoints: {
      values: {
        xs: 0,
        sm: APP_BREAKPOINTS.smallPhone,
        md: APP_BREAKPOINTS.tablet,
        lg: APP_BREAKPOINTS.laptop,
        xl: APP_BREAKPOINTS.desktop,
      },
    },
    shape: {
      borderRadius: APP_RADIUS_SCALE.sm,
    },
    shadows: APP_FLAT_SHADOWS,
    spacing: APP_SPACING_BASE,
    typography: {
      fontFamily: FONT_BODY,
      h1: {
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        fontSize: "clamp(36px, 5vw, 64px)",
        lineHeight: 1.05,
        letterSpacing: 0,
      },
      h2: {
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        fontSize: "clamp(30px, 3.8vw, 52px)",
        lineHeight: 1.08,
        letterSpacing: 0,
      },
      h3: {
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        fontSize: "clamp(26px, 3vw, 42px)",
        lineHeight: 1.12,
        letterSpacing: 0,
      },
      h4: {
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        fontSize: "clamp(22px, 2.4vw, 34px)",
        lineHeight: 1.16,
        letterSpacing: 0,
      },
      h5: {
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        letterSpacing: 0,
      },
      h6: {
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        letterSpacing: 0,
      },
      subtitle1: {
        fontWeight: 700,
      },
      subtitle2: {
        fontWeight: 700,
      },
      body1: {
        lineHeight: 1.7,
      },
      body2: {
        lineHeight: 1.65,
      },
      button: {
        fontFamily: FONT_BODY,
        fontWeight: 700,
        textTransform: "none",
        letterSpacing: 0,
      },
      overline: {
        fontFamily: FONT_BODY,
        fontWeight: 700,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ":root": {
            "--app-shell-max-width": `${APP_BREAKPOINTS.wide}px`,
            "--app-content-max-width": `${APP_BREAKPOINTS.wide}px`,
            "--app-readable-max-width": "1280px",
            "--app-page-gutter": "clamp(16px, 3vw, 48px)",
            "--app-breakpoint-mobile": `${APP_BREAKPOINTS.mobile}px`,
            "--app-breakpoint-small-phone": `${APP_BREAKPOINTS.smallPhone}px`,
            "--app-breakpoint-tablet": `${APP_BREAKPOINTS.tablet}px`,
            "--app-breakpoint-laptop": `${APP_BREAKPOINTS.laptop}px`,
            "--app-breakpoint-desktop": `${APP_BREAKPOINTS.desktop}px`,
            "--app-breakpoint-wide": `${APP_BREAKPOINTS.wide}px`,
            "--app-space-xxs": `${APP_SPACING_SCALE.xxs}px`,
            "--app-space-xs": `${APP_SPACING_SCALE.xs}px`,
            "--app-space-sm": `${APP_SPACING_SCALE.sm}px`,
            "--app-space-md": `${APP_SPACING_SCALE.md}px`,
            "--app-space-lg": `${APP_SPACING_SCALE.lg}px`,
            "--app-space-xl": `${APP_SPACING_SCALE.xl}px`,
            "--app-space-xxl": `${APP_SPACING_SCALE.xxl}px`,
            "--app-section-rhythm": `${APP_SPACING_SCALE.section}px`,
            "--app-radius-xs": `${APP_RADIUS_SCALE.xs}px`,
            "--app-radius-sm": `${APP_RADIUS_SCALE.sm}px`,
            "--app-radius-md": `${APP_RADIUS_SCALE.md}px`,
            "--app-radius-lg": `${APP_RADIUS_SCALE.lg}px`,
            "--app-radius-xl": `${APP_RADIUS_SCALE.xl}px`,
            "--app-radius-pill": `${APP_RADIUS_SCALE.pill}px`,
            "--app-radius-full": APP_RADIUS_SCALE.full,
            "--app-canvas-dark": APP_SURFACES.canvasDark,
            "--app-surface-card-dark": APP_SURFACES.cardDark,
            "--app-surface-elevated-dark": APP_SURFACES.elevatedDark,
            "--app-canvas-light": APP_SURFACES.canvasLight,
            "--app-surface-soft-light": APP_SURFACES.softLight,
            "--app-hairline": isDark
              ? APP_SURFACES.hairlineDark
              : APP_SURFACES.hairlineLight,
            "--app-info-ring": APP_SURFACES.infoRing,
            "--app-safe-top": "env(safe-area-inset-top, 0px)",
            "--app-safe-right": "env(safe-area-inset-right, 0px)",
            "--app-safe-bottom": "env(safe-area-inset-bottom, 0px)",
            "--app-safe-left": "env(safe-area-inset-left, 0px)",
          },
          html: {
            fontSize: "clamp(14px, 0.2vw + 13px, 18px)",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            WebkitTextSizeAdjust: "100%",
            textSizeAdjust: "100%",
            scrollBehavior: "smooth",
            overflowX: "hidden",
          },
          body: {
            minWidth: 320,
            minHeight: "100vh",
            overflowX: "hidden",
            backgroundColor: palette.background?.default,
            backgroundImage: "none",
            color: palette.text?.primary,
            overscrollBehaviorX: "none",
          },
          "#root": {
            minHeight: "100vh",
            isolation: "isolate",
          },
          "main.MuiBox-root": {
            backgroundColor: "transparent",
          },
          "*, *::before, *::after": {
            boxSizing: "border-box",
          },
          "img, svg, video, canvas": {
            display: "block",
            maxWidth: "100%",
          },
          "input, textarea, select, button": {
            font: "inherit",
          },
          ".MuiTableContainer-root": {
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          },
          ".MuiDataGrid-root, .MuiTable-root": {
            boxShadow: "none",
          },
          "@media (max-width:600px)": {
            "input, textarea, select, .MuiInputBase-input, .MuiSelect-select": {
              fontSize: "16px !important",
            },
          },
          "@media (max-width:767px)": {
            ".MuiTable-root": {
              minWidth: 680,
            },
            ".MuiCardHeader-root": {
              alignItems: "stretch",
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backdropFilter: "none",
            boxShadow: "none",
            borderBottom: `1px solid ${
              isDark ? APP_SURFACES.hairlineDark : APP_SURFACES.hairlineLight
            }`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            boxShadow: "none",
          },
          rounded: {
            borderRadius: APP_RADIUS_SCALE.xl,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: APP_RADIUS_SCALE.lg,
            border: `1px solid ${
              isDark ? APP_SURFACES.hairlineDark : APP_SURFACES.hairlineLight
            }`,
            backgroundColor: isDark
              ? APP_SURFACES.cardDark
              : APP_SURFACES.canvasLight,
            boxShadow: "none",
            overflow: "hidden",
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            minWidth: 40,
            minHeight: 40,
            borderRadius: APP_RADIUS_SCALE.md,
            paddingInline: 16,
            boxShadow: "none",
            "&.Mui-focusVisible": {
              boxShadow: `0 0 0 2px ${alpha(APP_SURFACES.infoRing, 0.5)}`,
            },
          },
          sizeSmall: {
            minWidth: 28,
            minHeight: 28,
            borderRadius: APP_RADIUS_SCALE.md,
            paddingInline: 8,
          },
          contained: {
            boxShadow: "none",
            "&.Mui-focusVisible": {
              boxShadow: `0 0 0 2px ${alpha(APP_SURFACES.infoRing, 0.5)}`,
            },
          },
          outlined: {
            borderWidth: 1,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: 40,
            minHeight: 40,
            borderRadius: APP_RADIUS_SCALE.md,
            boxShadow: "none",
            "&.Mui-focusVisible": {
              boxShadow: `0 0 0 2px ${alpha(APP_SURFACES.infoRing, 0.5)}`,
            },
            "&.MuiIconButton-sizeSmall": {
              minWidth: 28,
              minHeight: 28,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: APP_RADIUS_SCALE.pill,
            fontWeight: 700,
          },
          labelSmall: {
            lineHeight: "18px",
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: APP_RADIUS_SCALE.lg,
            backgroundColor: alpha(
              isDark ? APP_SURFACES.elevatedDark : APP_SURFACES.canvasLight,
              isDark ? 0.05 : 0.84,
            ),
            transition:
              "border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(
                isDark ? BRAND.white : BRAND.textMuted,
                isDark ? 0.16 : 0.2,
              ),
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(palette.primary?.main ?? BRAND.primary, 0.6),
            },
            "&.Mui-focused": {
              backgroundColor: alpha(
                isDark ? APP_SURFACES.elevatedDark : APP_SURFACES.canvasLight,
                isDark ? 0.96 : 0.96,
              ),
              boxShadow: `0 0 0 2px ${alpha(APP_SURFACES.infoRing, 0.5)}`,
            },
          },
          input: {
            paddingTop: 14,
            paddingBottom: 14,
          },
          inputSizeSmall: {
            paddingTop: 12,
            paddingBottom: 12,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            marginLeft: 2,
            marginTop: 6,
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          regular: {
            minHeight: "auto",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
            backgroundColor: palette.background?.paper,
            boxShadow: "none",
            borderRight: `1px solid ${
              isDark ? APP_SURFACES.hairlineDark : APP_SURFACES.hairlineLight
            }`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            minHeight: 48,
            borderRadius: APP_RADIUS_SCALE.lg,
            "&.Mui-focusVisible": {
              boxShadow: `0 0 0 2px ${alpha(APP_SURFACES.infoRing, 0.5)}`,
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: 28,
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: APP_RADIUS_SCALE.lg,
            boxShadow: "none",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontFamily: FONT_DISPLAY,
            fontSize: "0.82rem",
            fontWeight: 700,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: palette.text?.secondary,
            backgroundColor: alpha(
              isDark ? APP_SURFACES.elevatedDark : BRAND.textMuted,
              isDark ? 0.7 : 0.05,
            ),
          },
          root: {
            borderBottomColor: alpha(
              isDark ? BRAND.white : BRAND.textMuted,
              isDark ? 0.08 : 0.08,
            ),
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            width: "min(calc(100% - 24px), 1080px)",
            borderRadius: APP_RADIUS_SCALE.xl,
            boxShadow: "none",
            border: `1px solid ${
              isDark ? APP_SURFACES.hairlineDark : APP_SURFACES.hairlineLight
            }`,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: APP_RADIUS_SCALE.xl,
            border: `1px solid ${
              isDark ? APP_SURFACES.hairlineDark : APP_SURFACES.hairlineLight
            }`,
            boxShadow: "none",
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            minHeight: "unset",
            display: "flex",
            alignItems: "center",
          },
        },
      },
      MuiTypography: {
        defaultProps: {
          variant: "body2",
        },
      },
    },
  });

  return theme;
};

const LightThemeWithResponsiveFontSizes = createAppTheme("light");
const DarkThemeWithResponsiveFontSizes = createAppTheme("dark");

export { LightThemeWithResponsiveFontSizes, DarkThemeWithResponsiveFontSizes };
