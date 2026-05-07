import React, { type CSSProperties, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import ListOutlined from "@mui/icons-material/ListOutlined";
import Logout from "@mui/icons-material/Logout";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import {
  type TreeMenuItem,
  useIsExistAuthentication,
  useLogout,
  useTranslate,
  useLink,
  useMenu,
  useActiveAuthProvider,
  useWarnAboutChange,
} from "@refinedev/core";
import {
  ThemedTitle,
  useThemedLayoutContext,
  type RefineThemedLayoutSiderProps,
} from "@refinedev/mui";
import { useLocation } from "react-router";

const COLLAPSED_WIDTH = 56;
const EXPANDED_WIDTH = 232;
const HIDDEN_SCROLLBAR_SX = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  "&::-webkit-scrollbar": {
    width: 0,
    height: 0,
    display: "none",
  },
} as const;

const findSelectedAncestorKeys = (
  items: TreeMenuItem[],
  selected?: string,
): string[] => {
  if (!selected) {
    return [];
  }

  for (const item of items) {
    const key = item.key || "";

    if (key === selected) {
      return [];
    }

    const childAncestorKeys = findSelectedAncestorKeys(item.children, selected);
    const hasSelectedChild = item.children.some((child) => child.key === selected);

    if (childAncestorKeys.length > 0 || hasSelectedChild) {
      return [key, ...childAncestorKeys];
    }
  }

  return [];
};

const normalizeRoutePath = (route?: string) => {
  if (!route) {
    return "";
  }

  const [path] = route.split(/[?#]/);
  const normalizedPath =
    path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;

  return normalizedPath || "/";
};

const findRouteAncestorKeys = (
  items: TreeMenuItem[],
  pathname: string,
  ancestors: string[] = [],
): string[] => {
  let activeAncestorKeys: string[] = [];
  const normalizedPathname = normalizeRoutePath(pathname);

  for (const item of items) {
    const key = item.key || "";
    const nextAncestors = key ? [...ancestors, key] : ancestors;

    if (normalizeRoutePath(item.route) === normalizedPathname) {
      activeAncestorKeys = ancestors;
    }

    const childAncestorKeys = findRouteAncestorKeys(
      item.children,
      normalizedPathname,
      nextAncestors,
    );

    if (childAncestorKeys.length > 0) {
      activeAncestorKeys = childAncestorKeys;
    }
  }

  return activeAncestorKeys;
};

export const WideSider: React.FC<RefineThemedLayoutSiderProps> = ({
  Title: TitleFromProps,
  render,
  meta,
  activeItemDisabled = false,
  siderItemsAreCollapsed = true,
}) => {
  const {
    siderCollapsed,
    setSiderCollapsed,
    mobileSiderOpen,
    setMobileSiderOpen,
  } = useThemedLayoutContext();

  const drawerWidth = () => {
    if (siderCollapsed) return COLLAPSED_WIDTH;
    return EXPANDED_WIDTH;
  };

  const t = useTranslate();
  const Link = useLink();
  const location = useLocation();

  const { menuItems, selectedKey, defaultOpenKeys } = useMenu({ meta });
  const menuKeySignature = menuItems.map((item) => item.key).join("|");
  const isExistAuthentication = useIsExistAuthentication();
  const authProvider = useActiveAuthProvider();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const { mutate: mutateLogout } = useLogout();

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const defaultOpenKeySignature = defaultOpenKeys.join("|");

  React.useEffect(() => {
    const routeAncestorKeys = findRouteAncestorKeys(menuItems, location.pathname);
    const selectedAncestorKeys = findSelectedAncestorKeys(menuItems, selectedKey);
    let selectedOpenKeys = defaultOpenKeys;

    if (selectedAncestorKeys.length > 0) {
      selectedOpenKeys = selectedAncestorKeys;
    }

    if (routeAncestorKeys.length > 0) {
      selectedOpenKeys = routeAncestorKeys;
    }

    const routeOpen = siderItemsAreCollapsed
      ? Object.fromEntries(selectedOpenKeys.map((key) => [key, true]))
      : Object.fromEntries(
          menuKeySignature
            .split("|")
            .filter(Boolean)
            .map((key) => [key, true]),
        );

    setOpen((previous) => {
      const previousSignature = Object.entries(previous)
        .filter(([, value]) => value)
        .map(([key]) => key)
        .sort()
        .join("|");
      const nextSignature = Object.entries(routeOpen)
        .filter(([, value]) => value)
        .map(([key]) => key)
        .sort()
        .join("|");

      return previousSignature === nextSignature ? previous : routeOpen;
    });
    setMobileSiderOpen(false);
  }, [
    defaultOpenKeySignature,
    location.pathname,
    menuKeySignature,
    selectedKey,
    siderItemsAreCollapsed,
    setMobileSiderOpen,
  ]);

  const RenderToTitle = TitleFromProps ?? ThemedTitle;

  const handleClick = (key: string) => {
    setOpen((current) => {
      const nextOpen = !current[key];
      return nextOpen ? { [key]: true } : {};
    });
  };

  const renderTreeView = (tree: TreeMenuItem[], selected?: string) => {
    return tree.map((item) => {
      const { icon, label, route, name, children, meta: itemMeta } = item;
      const isOpen = open[item.key || ""] || false;
      const isSelected = item.key === selected;
      const isNested = !(itemMeta?.parent === undefined);

      if (children.length > 0) {
        return (
          <React.Fragment key={item.key}>
            <div key={item.key}>
              <Tooltip
                title={label ?? name}
                placement="right"
                disableHoverListener={!siderCollapsed}
                arrow
              >
                <ListItemButton
                  onClick={() => {
                    if (siderCollapsed) {
                      setSiderCollapsed(false);
                      if (!isOpen) {
                        handleClick(item.key || "");
                      }
                    } else {
                      handleClick(item.key || "");
                    }
                  }}
                  sx={{
                    minHeight: 42,
                    mx: 1,
                    mb: 0.5,
                    px: siderCollapsed ? 1 : 1.25,
                    pl: siderCollapsed ? 1 : isNested ? 3 : 1.25,
                    justifyContent: siderCollapsed ? "center" : "flex-start",
                    color: "text.primary",
                    borderTop: isNested ? 0 : "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      justifyContent: "center",
                      minWidth: siderCollapsed ? "24px" : "26px",
                      transition: "margin-right 0.3s",
                      marginRight: siderCollapsed ? "0px" : "8px",
                      color: "currentColor",
                      "& .MuiSvgIcon-root": {
                        fontSize: 18,
                      },
                    }}
                  >
                    {icon ?? <ListOutlined />}
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      noWrap: true,
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  />
                  {!siderCollapsed &&
                    (isOpen ? (
                      <ExpandLess sx={{ color: "text.icon" }} />
                    ) : (
                      <ExpandMore sx={{ color: "text.icon" }} />
                    ))}
                </ListItemButton>
              </Tooltip>
              {!siderCollapsed && (
                <Collapse in={open[item.key || ""]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {renderTreeView(children, selected)}
                  </List>
                </Collapse>
              )}
            </div>
          </React.Fragment>
        );
      }

      const linkStyle: CSSProperties =
        activeItemDisabled && isSelected ? { pointerEvents: "none" } : {};

      return (
        <React.Fragment key={item.key}>
          <Tooltip
            title={label ?? name}
            placement="right"
            disableHoverListener={!siderCollapsed}
            arrow
          >
            <ListItemButton
              component={Link as any}
              to={route}
              selected={isSelected}
              style={linkStyle}
              onClick={() => {
                setMobileSiderOpen(false);
              }}
              sx={{
                minHeight: isNested ? 38 : 40,
                mx: 1,
                mb: 0.35,
                px: siderCollapsed ? 1 : 1.25,
                pl: siderCollapsed ? 1 : isNested ? 3 : 1.25,
                py: 0.75,
                justifyContent: siderCollapsed ? "center" : "flex-start",
                color: isSelected ? "primary.main" : "text.primary",
                borderRadius: 2,
                "&.Mui-selected": {
                  backgroundColor: "rgba(248, 196, 0, 0.18)",
                  color: "primary.main",
                },
                "&.Mui-selected:hover": {
                  backgroundColor: "rgba(248, 196, 0, 0.22)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  justifyContent: "center",
                  transition: "margin-right 0.3s",
                  marginRight: siderCollapsed ? "0px" : "8px",
                  minWidth: "24px",
                  color: "currentColor",
                  "& .MuiSvgIcon-root": {
                    fontSize: 18,
                  },
                }}
              >
                {icon ?? <ListOutlined />}
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  noWrap: true,
                  fontSize: "12px",
                  fontWeight: isSelected ? 700 : 600,
                }}
              />
            </ListItemButton>
          </Tooltip>
        </React.Fragment>
      );
    });
  };

  const handleLogout = () => {
    if (warnWhen) {
      const confirm = window.confirm(
        t(
          "warnWhenUnsavedChanges",
          "Are you sure you want to leave? You have unsaved changes.",
        ),
      );

      if (confirm) {
        setWarnWhen(false);
        mutateLogout();
      }
    } else {
      mutateLogout();
    }
  };

  const logout = isExistAuthentication && authProvider ? (
    <Tooltip
      title={t("buttons.logout", "Logout")}
      placement="right"
      disableHoverListener={!siderCollapsed}
      arrow
    >
      <ListItemButton
        key="logout"
        onClick={handleLogout}
        sx={{ justifyContent: "center" }}
      >
        <ListItemIcon
          sx={{
            justifyContent: "center",
            minWidth: "24px",
            transition: "margin-right 0.3s",
            marginRight: siderCollapsed ? "0px" : "12px",
            color: "currentColor",
          }}
        >
          <Logout />
        </ListItemIcon>
        <ListItemText
          primary={t("buttons.logout", "Logout")}
          primaryTypographyProps={{
            noWrap: true,
            fontSize: "14px",
          }}
        />
      </ListItemButton>
    </Tooltip>
  ) : null;

  const items = renderTreeView(menuItems, selectedKey);

  const renderSider = () => {
    if (render) {
      return render({
        logout,
        items,
        collapsed: siderCollapsed,
      });
    }
    return (
      <>
        {items}
        {logout}
      </>
    );
  };

  const drawer = (
    <List disablePadding sx={{ flexGrow: 1, paddingTop: "16px" }}>
      {renderSider()}
    </List>
  );

  return (
    <>
      <Box
        sx={{
          width: { xs: drawerWidth() },
          display: { xs: "none", md: "block" },
          transition: "width 0.3s ease",
        }}
      />
      <Box
        component="nav"
        sx={{
          position: "fixed",
          zIndex: 1101,
          width: { sm: drawerWidth() },
          display: "flex",
        }}
      >
        <Drawer
          variant="temporary"
          elevation={2}
          open={mobileSiderOpen}
          onClose={() => setMobileSiderOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { sm: "block", md: "none" } }}
        >
          <Box
            sx={{
              width: EXPANDED_WIDTH,
              height: "100dvh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                height: 64,
                display: "flex",
                alignItems: "center",
                paddingLeft: "16px",
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              <RenderToTitle collapsed={false} />
            </Box>
            <Box
              sx={{
                flexGrow: 1,
                minHeight: 0,
                overflowX: "hidden",
                overflowY: "auto",
                ...HIDDEN_SCROLLBAR_SX,
              }}
            >
              {drawer}
            </Box>
          </Box>
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth(),
              overflow: "hidden",
              transition: "width 200ms cubic-bezier(0.4, 0, 0.6, 1) 0ms",
            },
          }}
          open
        >
          <Paper
            elevation={0}
            sx={{
              fontSize: "14px",
              width: "100%",
              height: 64,
              display: "flex",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: siderCollapsed ? "center" : "space-between",
              paddingLeft: siderCollapsed ? 0 : "16px",
              paddingRight: siderCollapsed ? 0 : "8px",
              variant: "outlined",
              borderRadius: 0,
              borderBottom: (theme) =>
                `1px solid ${theme.palette.action.focus}`,
            }}
          >
            <RenderToTitle collapsed={siderCollapsed} />
            {!siderCollapsed && (
              <IconButton size="small" onClick={() => setSiderCollapsed(true)}>
                <ChevronLeft />
              </IconButton>
            )}
          </Paper>
          <Box
            sx={{
              flexGrow: 1,
              minHeight: 0,
              overflowX: "hidden",
              overflowY: "auto",
              ...HIDDEN_SCROLLBAR_SX,
            }}
          >
            {drawer}
          </Box>
        </Drawer>
      </Box>
    </>
  );
};
