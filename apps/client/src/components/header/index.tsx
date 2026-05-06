import { useContext, useEffect, useMemo, useState } from "react";
import {
  useList,
  useTranslate,
  useGetIdentity,
  useGetLocale,
  useSetLocale,
  useLogout,
  useWarnAboutChange,
} from "@refinedev/core";
import {
  type RefineThemedLayoutHeaderProps,
  HamburgerMenu,
} from "@refinedev/mui";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import BrightnessHighIcon from "@mui/icons-material/BrightnessHigh";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import type {
  ICategory,
  ICourier,
  IIdentity,
  IOrder,
  IProduct,
  IStore,
  IUser,
} from "../../interfaces";
import { ColorModeContext } from "../../contexts";
import {
  APP_SETTINGS_UPDATED_EVENT,
  readAppSettings,
} from "../../services/appSettings";
import {
  NOTIFICATION_CENTER_STORAGE_KEY,
  NOTIFICATION_CENTER_UPDATED_EVENT,
  clearNotificationCenterItems,
  getUnreadNotificationCenterCount,
  markAllNotificationCenterItemsAsRead,
  markNotificationCenterItemAsRead,
  readNotificationCenterItems,
  type NotificationCenterItem,
} from "../../services/notificationCenter";
import { useLocation, useNavigate } from "react-router";

type SearchOption = {
  id: string;
  label: string;
  description?: string;
  category: string;
  avatar?: string;
};

const MIN_SEARCH_LENGTH = 2;
const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  de: "German",
  "pt-BR": "Português (Brasil)",
};
const AVAILABLE_LANGUAGES = ["en", "de", "pt-BR"] as const;
const MAX_HEADER_NOTIFICATIONS = 8;

const formatNotificationDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR");

const getNotificationTypeIcon = (type: NotificationCenterItem["type"]) => {
  if (type === "error") {
    return <ErrorOutlineOutlinedIcon color="error" fontSize="small" />;
  }

  if (type === "progress") {
    return <AutorenewOutlinedIcon color="warning" fontSize="small" />;
  }

  return <CheckCircleOutlineOutlinedIcon color="success" fontSize="small" />;
};

export const Header: React.FC<RefineThemedLayoutHeaderProps> = () => {
  const { mode, setMode } = useContext(ColorModeContext);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [notificationMenuAnchor, setNotificationMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [notificationItems, setNotificationItems] = useState<NotificationCenterItem[]>(
    () => readNotificationCenterItems(),
  );
  const [profileSettings, setProfileSettings] = useState(
    () => readAppSettings().profile,
  );

  const navigate = useNavigate();
  const location = useLocation();
  const changeLanguage = useSetLocale();
  const locale = useGetLocale();
  const currentLocale = locale();
  const { data: user } = useGetIdentity<IIdentity | null>();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const { mutate: mutateLogout } = useLogout();

  const t = useTranslate();
  const trimmedSearchValue = searchValue.trim();
  const shouldSearch = debouncedSearchValue.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    setNotificationMenuAnchor(null);
    setProfileMenuAnchor(null);
    setSearchValue("");
    setDebouncedSearchValue("");
  }, [location.pathname, location.search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchValue(trimmedSearchValue);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [trimmedSearchValue]);

  useEffect(() => {
    const syncProfile = () => {
      setProfileSettings(readAppSettings().profile);
    };

    const handleSettingsUpdate: EventListener = () => {
      syncProfile();
    };

    window.addEventListener(APP_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);

    return () => {
      window.removeEventListener(APP_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    const syncNotifications = () => {
      setNotificationItems(readNotificationCenterItems());
    };

    const handleNotificationCenterUpdated: EventListener = () => {
      syncNotifications();
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (!event.key || event.key === NOTIFICATION_CENTER_STORAGE_KEY) {
        syncNotifications();
      }
    };

    window.addEventListener(
      NOTIFICATION_CENTER_UPDATED_EVENT,
      handleNotificationCenterUpdated,
    );
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(
        NOTIFICATION_CENTER_UPDATED_EVENT,
        handleNotificationCenterUpdated,
      );
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  const searchFilters = useMemo(
    () => [{ field: "q", operator: "contains" as const, value: debouncedSearchValue }],
    [debouncedSearchValue],
  );

  const {
    result: ordersData,
    query: { isFetching: isOrdersFetching },
  } = useList<IOrder>({
    resource: "orders",
    pagination: { pageSize: 5 },
    filters: searchFilters,
    queryOptions: { enabled: shouldSearch },
  });

  const {
    result: customersData,
    query: { isFetching: isCustomersFetching },
  } = useList<IUser>({
    resource: "users",
    pagination: { pageSize: 5 },
    filters: searchFilters,
    queryOptions: { enabled: shouldSearch },
  });

  const {
    result: productsData,
    query: { isFetching: isProductsFetching },
  } = useList<IProduct>({
    resource: "products",
    pagination: { pageSize: 5 },
    filters: searchFilters,
    queryOptions: { enabled: shouldSearch },
  });

  const {
    result: categoriesData,
    query: { isFetching: isCategoriesFetching },
  } = useList<ICategory>({
    resource: "categories",
    pagination: { pageSize: 5 },
    filters: searchFilters,
    queryOptions: { enabled: shouldSearch },
  });

  const {
    result: storesData,
    query: { isFetching: isStoresFetching },
  } = useList<IStore>({
    resource: "stores",
    pagination: { pageSize: 5 },
    filters: searchFilters,
    queryOptions: { enabled: shouldSearch },
  });

  const {
    result: couriersData,
    query: { isFetching: isCouriersFetching },
  } = useList<ICourier>({
    resource: "couriers",
    pagination: { pageSize: 5 },
    filters: searchFilters,
    queryOptions: { enabled: shouldSearch },
  });

  const options = useMemo<SearchOption[]>(() => {
    if (!shouldSearch) return [];

    const orderOptions = (ordersData?.data ?? []).map((order) => ({
      id: `order-${order.id}`,
      label: `#${order.orderNumber} - ${order.user.fullName}`,
      description: order.store?.title,
      category: "Orders",
      avatar: order.products?.[0]?.images?.[0]?.url,
    }));

    const customerOptions = (customersData?.data ?? []).map((customer) => ({
      id: `customer-${customer.id}`,
      label: customer.fullName,
      description: customer.gsm,
      category: "Customers",
      avatar: customer.avatar?.[0]?.url,
    }));

    const productOptions = (productsData?.data ?? []).map((product) => ({
      id: `product-${product.id}`,
      label: product.name,
      description: product.category?.title,
      category: "Products",
      avatar: product.images?.[0]?.url,
    }));

    const categoryOptions = (categoriesData?.data ?? []).map((category) => ({
      id: `category-${category.id}`,
      label: category.title,
      category: "Categories",
    }));

    const storeOptions = (storesData?.data ?? []).map((store) => ({
      id: `store-${store.id}`,
      label: store.title,
      description: store.email,
      category: "Stores",
    }));

    const courierOptions = (couriersData?.data ?? []).map((courier) => ({
      id: `courier-${courier.id}`,
      label: `${courier.name} ${courier.surname}`,
      description: courier.email,
      category: "Couriers",
      avatar: courier.avatar?.[0]?.url,
    }));

    return [
      ...orderOptions,
      ...customerOptions,
      ...productOptions,
      ...categoryOptions,
      ...storeOptions,
      ...courierOptions,
    ];
  }, [
    shouldSearch,
    ordersData?.data,
    customersData?.data,
    productsData?.data,
    categoriesData?.data,
    storesData?.data,
    couriersData?.data,
  ]);

  const isSearchLoading =
    shouldSearch &&
    (isOrdersFetching ||
      isCustomersFetching ||
      isProductsFetching ||
      isCategoriesFetching ||
      isStoresFetching ||
      isCouriersFetching);
  const unreadNotificationsCount = useMemo(
    () => getUnreadNotificationCenterCount(notificationItems),
    [notificationItems],
  );
  const recentNotificationItems = useMemo(
    () => notificationItems.slice(0, MAX_HEADER_NOTIFICATIONS),
    [notificationItems],
  );
  const isNotificationMenuOpen = Boolean(notificationMenuAnchor);
  const isProfileMenuOpen = Boolean(profileMenuAnchor);
  const displayUserName = profileSettings.name || user?.name || "";
  const displayUserAvatar = profileSettings.avatarUrl || user?.avatar || "";

  const handleOpenNotificationMenu = (
    event: React.MouseEvent<HTMLElement>,
  ) => {
    setNotificationMenuAnchor(event.currentTarget);
  };

  const handleCloseNotificationMenu = () => {
    setNotificationMenuAnchor(null);
  };

  const handleOpenProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleCloseProfileMenu = () => {
    setProfileMenuAnchor(null);
  };

  const handleOpenProfile = () => {
    handleCloseProfileMenu();
    navigate("/settings");
  };

  const handleLogout = () => {
    handleCloseProfileMenu();

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

      return;
    }

    mutateLogout();
  };

  const handleReadNotification = (notificationId: string) => {
    markNotificationCenterItemAsRead(notificationId);
    setNotificationItems(readNotificationCenterItems());
  };

  const handleMarkAllNotificationsAsRead = () => {
    markAllNotificationCenterItemsAsRead();
    setNotificationItems(readNotificationCenterItems());
  };

  const handleClearNotifications = () => {
    clearNotificationCenterItems();
    setNotificationItems(readNotificationCenterItems());
  };

  return (
    <AppBar
      color="default"
      position="sticky"
      elevation={0}
      sx={{
        pt: "env(safe-area-inset-top)",
        pl: "env(safe-area-inset-left)",
        pr: "env(safe-area-inset-right)",
        "& .MuiToolbar-root": {
          minHeight: "64px",
        },
        minHeight: "calc(64px + env(safe-area-inset-top))",
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => theme.palette.background.paper,
      }}
    >
      <Toolbar
        sx={{
          paddingLeft: {
            xs: "0",
            sm: "16px",
            md: "24px",
          },
        }}
      >
        <Box
          minWidth="40px"
          minHeight="40px"
          marginRight={{
            xs: "0",
            sm: "16px",
          }}
          sx={{
            "& .MuiButtonBase-root": {
              marginLeft: 0,
              marginRight: 0,
            },
          }}
        >
          <HamburgerMenu />
        </Box>

        <Stack
          direction="row"
          width="100%"
          justifyContent="space-between"
          alignItems="center"
          gap={{
            xs: "8px",
            sm: "24px",
          }}
        >
          <Stack direction="row" flex={1}>
            <Box
              sx={{
                maxWidth: 550,
                width: "100%",
                display: {
                  xs: "none",
                  sm: "block",
                },
              }}
            >
              <Autocomplete
                id="global-search"
                options={options}
                loading={isSearchLoading}
                filterOptions={(x) => x}
                groupBy={(option) => option.category}
                getOptionLabel={(option) => option.label}
                inputValue={searchValue}
                onInputChange={(_event, value) => {
                  setSearchValue(value);
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText={
                  trimmedSearchValue.length < MIN_SEARCH_LENGTH
                    ? `Digite pelo menos ${MIN_SEARCH_LENGTH} caracteres`
                    : "Nenhum resultado encontrado"
                }
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    key={option.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      py: "8px",
                    }}
                  >
                    <Avatar
                      src={option.avatar}
                      sx={{ width: 32, height: 32, fontSize: 12 }}
                    >
                      {option.label[0]}
                    </Avatar>
                    <Stack spacing={0}>
                      <Typography fontSize={14}>{option.label}</Typography>
                      {option.description ? (
                        <Typography color="text.secondary" fontSize={12}>
                          {option.description}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    label={t("search.placeholder")}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isSearchLoading ? (
                            <CircularProgress color="inherit" size={16} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            spacing={{
              xs: "8px",
              sm: "24px",
            }}
          >
            <Select
              size="small"
              value={currentLocale || "en"}
              onChange={(event) => {
                const lang = event.target.value;
                changeLanguage(lang);
              }}
              slotProps={{
                input: {
                  "aria-label": "Without label",
                },
              }}
              variant="outlined"
              sx={{
                width: {
                  xs: "120px",
                  sm: "160px",
                },
              }}
            >
              {AVAILABLE_LANGUAGES.map((lang) => (
                <MenuItem
                  key={lang}
                  value={lang}
                >
                  <Typography color="text.secondary">
                    {LANGUAGE_LABELS[lang] ?? lang}
                  </Typography>
                </MenuItem>
              ))}
            </Select>

            <IconButton
              onClick={() => {
                setMode();
              }}
              sx={{
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "transparent" : "#00000014",
              }}
            >
              {mode === "dark" ? (
                <BrightnessHighIcon />
              ) : (
                <Brightness4Icon
                  sx={{
                    fill: "#000000DE",
                  }}
                />
              )}
            </IconButton>

            <IconButton
              aria-label="Abrir notificações"
              onClick={handleOpenNotificationMenu}
              sx={{
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "transparent" : "#00000014",
              }}
            >
              <Badge
                badgeContent={unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                color="error"
              >
                <NotificationsNoneOutlinedIcon />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={notificationMenuAnchor}
              open={isNotificationMenuOpen}
              onClose={handleCloseNotificationMenu}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              PaperProps={{
                sx: {
                  width: 380,
                  maxWidth: "calc(100vw - 20px)",
                },
              }}
            >
              <Stack spacing={0}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  px={1.5}
                  py={1}
                >
                  <Typography variant="subtitle2">Notificações</Typography>
                  <Stack direction="row" spacing={0.6}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={handleMarkAllNotificationsAsRead}
                      disabled={!unreadNotificationsCount}
                    >
                      Marcar lidas
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      color="error"
                      onClick={handleClearNotifications}
                      disabled={!notificationItems.length}
                    >
                      Limpar
                    </Button>
                  </Stack>
                </Stack>
                <Divider />
                {recentNotificationItems.length ? (
                  <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
                    {recentNotificationItems.map((notification) => (
                      <Box
                        key={notification.id}
                        onClick={() => handleReadNotification(notification.id)}
                        sx={{
                          p: 1.4,
                          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                          cursor: "pointer",
                          backgroundColor: notification.readAt
                            ? "transparent"
                            : "action.hover",
                          "&:hover": {
                            backgroundColor: "action.selected",
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1.2} alignItems="flex-start">
                          {getNotificationTypeIcon(notification.type)}
                          <Stack spacing={0.2}>
                            <Typography variant="body2" fontWeight={notification.readAt ? 500 : 700}>
                              {notification.message}
                            </Typography>
                            {notification.description ? (
                              <Typography variant="caption" color="text.secondary">
                                {notification.description}
                              </Typography>
                            ) : null}
                            <Typography variant="caption" color="text.disabled">
                              {formatNotificationDate(notification.createdAt)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box px={1.5} py={2}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma notificação registrada.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Menu>

            <ButtonBase
              onClick={handleOpenProfileMenu}
              sx={{
                borderRadius: "12px",
                px: {
                  xs: 0.5,
                  sm: 1,
                },
                py: 0.5,
              }}
            >
              <Stack
                direction="row"
                gap={{
                  xs: "8px",
                  sm: "16px",
                }}
                alignItems="center"
                justifyContent="center"
              >
                <Typography
                  fontSize={{
                    xs: "12px",
                    sm: "14px",
                  }}
                  variant="subtitle2"
                >
                  {displayUserName}
                </Typography>
                <Avatar src={displayUserAvatar} alt={displayUserName} />
              </Stack>
            </ButtonBase>
            <Menu
              anchorEl={profileMenuAnchor}
              open={isProfileMenuOpen}
              onClose={handleCloseProfileMenu}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem onClick={handleOpenProfile}>
                {t("header.viewProfile", "Ver perfil")}
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                {t("buttons.logout", "Sair")}
              </MenuItem>
            </Menu>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
