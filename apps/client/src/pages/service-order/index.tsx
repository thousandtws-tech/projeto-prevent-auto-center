import { useEffect, useMemo, useState, type HTMLAttributes, type Key } from "react";
import { useNotification, useTranslate } from "@refinedev/core";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import HandymanOutlinedIcon from "@mui/icons-material/HandymanOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { Card, RefineListView } from "../../components";
import {
  APP_SETTINGS_UPDATED_EVENT,
  type AppSettings,
  readAppSettings,
} from "../../services/appSettings";
import {
  getSchedulingAppointmentByIdApi,
  patchSchedulingAppointmentApi,
  type SchedulingAppointment,
} from "../../services/scheduling";
import {
  createSharedServiceOrder,
  type ServiceOrderEvidence,
  type SharedServiceOrderPart,
} from "../../services/serviceOrderSignature";
import {
  CUSTOMERS_STORAGE_KEY,
  CUSTOMERS_UPDATED_EVENT,
  isCustomersBackendEnabled,
  listCustomersApi,
  type Customer,
} from "../../services/customers";
import {
  VEHICLES_STORAGE_KEY,
  VEHICLES_UPDATED_EVENT,
  isVehiclesBackendEnabled,
  listVehiclesApi,
  type Vehicle,
} from "../../services/vehicles";
import {
  createServiceOrderApi,
  getServiceOrderApi,
  isServiceOrdersBackendEnabled,
  shareServiceOrderApi,
  updateServiceOrderApi,
  type CreateServiceOrderPayload,
  type ServiceOrderPartStatus,
  type ServiceOrderRecord,
} from "../../services/serviceOrders";
import {
  SERVICE_ORDER_CATALOG_STORAGE_KEY,
  SERVICE_ORDER_CATALOG_UPDATED_EVENT,
  listLaborCatalogItemsApi,
  listPartCatalogItemsApi,
  type ServiceOrderCatalogItem,
} from "../../services/serviceOrderCatalog";
import {
  SERVICE_ORDER_CHECKLISTS_STORAGE_KEY,
  SERVICE_ORDER_CHECKLISTS_UPDATED_EVENT,
  listServiceOrderChecklists,
  type ServiceOrderChecklistItem,
} from "../../services/serviceOrderChecklists";
import {
  MECHANICS_STORAGE_KEY,
  MECHANICS_UPDATED_EVENT,
  listMechanics,
  type Mechanic,
} from "../../services/mechanics";
import { useNavigate, useSearchParams } from "react-router";
import type { ChecklistState, OrderInfo, PartItem, ServiceItem } from "../../interfaces";

type ServiceOrderEditorSection =
  | "checklist"
  | "parts"
  | "labor"
  | "third-party"
  | "evidence"
  | null;

const EMPTY_ORDER_INFO: OrderInfo = {
  orderNumber: "",
  date: "",
  customerName: "",
  phone: "",
  vehicle: "",
  year: "",
  plate: "",
  km: "",
  mechanicResponsible: "",
  paymentMethod: "",
  notes: "",
};

const EMPTY_CHECKLIST: ChecklistState = {};
const SERVICE_ORDER_DRAFT_STORAGE_KEY = "prevent-auto-service-order-draft-v1";

type ServiceOrderDraft = {
  orderInfo: OrderInfo;
  checklist: ChecklistState;
  parts: PartItem[];
  laborServices: ServiceItem[];
  thirdPartyServices: ServiceItem[];
  discount: number;
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readServiceOrderDraft = (): ServiceOrderDraft | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SERVICE_ORDER_DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ServiceOrderDraft>;
    return {
      orderInfo: { ...EMPTY_ORDER_INFO, ...(parsed.orderInfo ?? {}) },
      checklist: parsed.checklist ?? EMPTY_CHECKLIST,
      parts: Array.isArray(parsed.parts) ? parsed.parts : [],
      laborServices: Array.isArray(parsed.laborServices)
        ? parsed.laborServices
        : [],
      thirdPartyServices: Array.isArray(parsed.thirdPartyServices)
        ? parsed.thirdPartyServices
        : [],
      discount:
        typeof parsed.discount === "number" && Number.isFinite(parsed.discount)
          ? parsed.discount
          : 0,
    };
  } catch {
    return null;
  }
};

const writeServiceOrderDraft = (draft: ServiceOrderDraft) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SERVICE_ORDER_DRAFT_STORAGE_KEY,
    JSON.stringify(draft),
  );
};

const clearServiceOrderDraft = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SERVICE_ORDER_DRAFT_STORAGE_KEY);
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);

const formatDateForPrint = (value: string) => {
  if (!value) return "";

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
};

const formatDateInputFromIso = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDateInput = () => formatDateInputFromIso(new Date().toISOString());

const generateServiceOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `OS-${year}${month}${day}-${hour}${minute}`;
};

const formatChecklistLabel = (key: string) =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());

const buildChecklistState = (
  definitions: ServiceOrderChecklistItem[],
  current: ChecklistState,
): ChecklistState => {
  const next: ChecklistState = {};

  definitions.forEach((item) => {
    if (item.status === "active") {
      next[item.id] = Boolean(current[item.id]);
    }
  });

  Object.entries(current).forEach(([key, value]) => {
    if (!(key in next)) {
      next[key] = Boolean(value);
    }
  });

  return next;
};

const buildChecklistEntries = (
  definitions: ServiceOrderChecklistItem[],
  checklist: ChecklistState,
) => {
  const definitionsById = new Map(definitions.map((item) => [item.id, item]));
  const entries = definitions
    .filter((item) => item.status === "active")
    .map((item) => ({
      key: item.id,
      label: item.label,
      checked: Boolean(checklist[item.id]),
    }));

  const legacyEntries = Object.keys(checklist)
    .filter((key) => !definitionsById.has(key))
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((key) => ({
      key,
      label: formatChecklistLabel(key),
      checked: Boolean(checklist[key]),
    }));

  return [...entries, ...legacyEntries];
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Erro inesperado";
};

const getOrderDatePickerValue = (value: string): Dayjs | null => {
  if (!value) {
    return null;
  }

  const parsed = dayjs(`${value}T00:00:00`);
  return parsed.isValid() ? parsed : null;
};

const parseCurrencyInput = (value: string): number => {
  if (!value.trim()) return 0;

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Falha ao ler arquivo de prova"));
    reader.readAsDataURL(file);
  });
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const SCROLLABLE_TABLE_CONTAINER_SX = {
  overflowX: "hidden",
  overflowY: "auto",
  backgroundColor: "background.paper",
  "&::-webkit-scrollbar": {
    width: 10,
    height: 10,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(100, 116, 139, 0.45)",
    borderRadius: 99,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "rgba(15, 23, 42, 0.08)",
  },
} as const;

const formatVehicleNumericField = (value: number) =>
  value > 0 ? String(value) : "";

const findRegisteredVehicle = (
  vehicles: Vehicle[],
  vehicleModel: string,
  vehiclePlate: string,
) => {
  const normalizedPlate = vehiclePlate.trim().toUpperCase();
  if (normalizedPlate) {
    const matchedByPlate = vehicles.find(
      (vehicle) => vehicle.vehiclePlate.trim().toUpperCase() === normalizedPlate,
    );

    if (matchedByPlate) {
      return matchedByPlate;
    }
  }

  const normalizedModel = vehicleModel.trim().toLowerCase();
  if (!normalizedModel) {
    return null;
  }

  return (
    vehicles.find(
      (vehicle) => vehicle.vehicleModel.trim().toLowerCase() === normalizedModel,
    ) ?? null
  );
};

const toVehicleOrderInfo = (vehicle: Vehicle) => ({
  vehicle: vehicle.vehicleModel,
  year: formatVehicleNumericField(vehicle.vehicleYear),
  plate: vehicle.vehiclePlate,
  km: formatVehicleNumericField(vehicle.vehicleMileage),
});

const EMPTY_CUSTOMER_ORDER_INFO = {
  customerName: "",
  phone: "",
  vehicle: "",
  year: "",
  plate: "",
  km: "",
} satisfies Pick<
  OrderInfo,
  "customerName" | "phone" | "vehicle" | "year" | "plate" | "km"
>;

const EMPTY_VEHICLE_ORDER_INFO = {
  vehicle: "",
  year: "",
  plate: "",
  km: "",
} satisfies Pick<OrderInfo, "vehicle" | "year" | "plate" | "km">;

const getCustomerSelectionData = (
  customer: Customer,
  vehicles: Vehicle[],
) => {
  const matchedVehicle = findRegisteredVehicle(
    vehicles,
    customer.vehicleModel,
    customer.vehiclePlate,
  );

  return {
    matchedVehicle,
    orderInfo: {
      customerName: customer.name,
      phone: customer.phone,
      vehicle: matchedVehicle?.vehicleModel || customer.vehicleModel,
      year: matchedVehicle ? formatVehicleNumericField(matchedVehicle.vehicleYear) : "",
      plate: matchedVehicle?.vehiclePlate || customer.vehiclePlate,
      km: matchedVehicle
        ? formatVehicleNumericField(matchedVehicle.vehicleMileage)
        : "",
    },
  };
};

export const ServiceOrderPage: React.FC = () => {
  const t = useTranslate();
  const { open } = useNotification();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const customersBackendEnabled = isCustomersBackendEnabled();
  const vehiclesBackendEnabled = isVehiclesBackendEnabled();
  const serviceOrdersBackendEnabled = isServiceOrdersBackendEnabled();
  const [searchParams, setSearchParams] = useSearchParams();
  const customerIdFromQuery = searchParams.get("customerId")?.trim() ?? "";
  const appointmentIdFromQuery = searchParams.get("appointmentId")?.trim() ?? "";
  const serviceOrderIdFromQuery = searchParams.get("serviceOrderId")?.trim() ?? "";
  const isEditingServiceOrder = Boolean(serviceOrderIdFromQuery);
  const [initialDraft] = useState(() => readServiceOrderDraft());
  const [sidebarLogoUrl, setSidebarLogoUrl] = useState(
    () => readAppSettings().branding.sidebarLogoUrl,
  );

  const [orderInfo, setOrderInfo] = useState<OrderInfo>(
    () => initialDraft?.orderInfo ?? EMPTY_ORDER_INFO,
  );

  const [checklist, setChecklist] = useState<ChecklistState>(
    () => initialDraft?.checklist ?? EMPTY_CHECKLIST,
  );

  const [parts, setParts] = useState<PartItem[]>(() => initialDraft?.parts ?? []);

  const [laborServices, setLaborServices] = useState<ServiceItem[]>(
    () => initialDraft?.laborServices ?? [],
  );

  const [thirdPartyServices, setThirdPartyServices] = useState<ServiceItem[]>(
    () => initialDraft?.thirdPartyServices ?? [],
  );

  const [discount, setDiscount] = useState(() => initialDraft?.discount ?? 0);
  const [evidenceFiles, setEvidenceFiles] = useState<ServiceOrderEvidence[]>([]);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [activeEditorSection, setActiveEditorSection] =
    useState<ServiceOrderEditorSection>(null);
  const [isGeneratingSignatureLink, setIsGeneratingSignatureLink] = useState(false);
  const [generatedSignatureLink, setGeneratedSignatureLink] = useState("");
  const [generatedSignatureToken, setGeneratedSignatureToken] = useState("");
  const [isSavingServiceOrder, setIsSavingServiceOrder] = useState(false);
  const [editingServiceOrder, setEditingServiceOrder] =
    useState<ServiceOrderRecord | null>(null);
  const [isLoadingServiceOrderForEdit, setIsLoadingServiceOrderForEdit] =
    useState(false);
  const [linkedAppointment, setLinkedAppointment] =
    useState<SchedulingAppointment | null>(null);
  const [isLoadingLinkedAppointment, setIsLoadingLinkedAppointment] =
    useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [registeredCustomers, setRegisteredCustomers] = useState<Customer[]>([]);
  const [registeredVehicles, setRegisteredVehicles] = useState<Vehicle[]>([]);
  const [registeredPartCatalogItems, setRegisteredPartCatalogItems] = useState<
    ServiceOrderCatalogItem[]
  >([]);
  const [registeredLaborCatalogItems, setRegisteredLaborCatalogItems] = useState<
    ServiceOrderCatalogItem[]
  >([]);
  const [selectedPartCatalogItem, setSelectedPartCatalogItem] =
    useState<ServiceOrderCatalogItem | null>(null);
  const [selectedLaborCatalogItem, setSelectedLaborCatalogItem] =
    useState<ServiceOrderCatalogItem | null>(null);
  const [registeredChecklists, setRegisteredChecklists] = useState<
    ServiceOrderChecklistItem[]
  >([]);
  const [registeredMechanics, setRegisteredMechanics] = useState<Mechanic[]>([]);

  useEffect(() => {
    setOrderInfo((previous) => ({
      ...previous,
      orderNumber: previous.orderNumber.trim()
        ? previous.orderNumber
        : generateServiceOrderNumber(),
      date: previous.date.trim() ? previous.date : getTodayDateInput(),
    }));
  }, []);

  useEffect(() => {
    if (isEditingServiceOrder) {
      return;
    }

    writeServiceOrderDraft({
      orderInfo,
      checklist,
      parts,
      laborServices,
      thirdPartyServices,
      discount,
    });
  }, [
    checklist,
    discount,
    laborServices,
    orderInfo,
    parts,
    thirdPartyServices,
    isEditingServiceOrder,
  ]);

  useEffect(() => {
    const handleSettingsUpdate: EventListener = (event) => {
      const customEvent = event as CustomEvent<AppSettings>;
      const eventLogo = customEvent.detail?.branding?.sidebarLogoUrl;

      if (typeof eventLogo === "string") {
        setSidebarLogoUrl(eventLogo);
      }
    };

    window.addEventListener(APP_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);

    return () => {
      window.removeEventListener(APP_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    };
  }, []);

  const reviewLogoSrc = useMemo(() => {
    const normalized = sidebarLogoUrl?.trim() ?? "";

    if (!normalized) {
      return "/logo-preto.svg";
    }

    if (normalized === "/logo-branco.svg") {
      return "/logo-preto.svg";
    }

    return normalized;
  }, [sidebarLogoUrl]);

  const loadRegisteredCustomers = async (showError = false) => {
    try {
      const response = await listCustomersApi();
      setRegisteredCustomers(response);
    } catch (error) {
      if (!showError) {
        return;
      }

      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro inesperado";
      open?.({
        type: "error",
        message: "Falha ao carregar clientes",
        description: message,
      });
    }
  };

  const loadRegisteredVehicles = async (showError = false) => {
    try {
      const response = await listVehiclesApi();
      setRegisteredVehicles(response);
    } catch (error) {
      if (!showError) {
        return;
      }

      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro inesperado";
      open?.({
        type: "error",
        message: "Falha ao carregar veículos",
        description: message,
      });
    }
  };

  const loadRegisteredPartCatalogItems = async (showError = false) => {
    try {
      const response = await listPartCatalogItemsApi();
      setRegisteredPartCatalogItems(response);
    } catch (error) {
      if (!showError) {
        return;
      }

      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro inesperado";
      open?.({
        type: "error",
        message: "Falha ao carregar peças cadastradas",
        description: message,
      });
    }
  };

  const loadRegisteredLaborCatalogItems = async (showError = false) => {
    try {
      const response = await listLaborCatalogItemsApi();
      setRegisteredLaborCatalogItems(response);
    } catch (error) {
      if (!showError) {
        return;
      }

      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro inesperado";
      open?.({
        type: "error",
        message: "Falha ao carregar serviços cadastrados",
        description: message,
      });
    }
  };

  const loadRegisteredChecklists = () => {
    setRegisteredChecklists(listServiceOrderChecklists());
  };

  const loadRegisteredMechanics = async (showError = false) => {
    try {
      const response = await listMechanics({
        page: 0,
        size: 100,
        sort: "name,asc",
        status: "active",
      });
      setRegisteredMechanics(response.filter((item) => item.status === "active"));
    } catch (error) {
      if (!showError) {
        return;
      }

      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro inesperado";
      open?.({
        type: "error",
        message: "Falha ao carregar mecânicos",
        description: message,
      });
    }
  };

  useEffect(() => {
    void loadRegisteredCustomers(true);
  }, []);

  useEffect(() => {
    void loadRegisteredVehicles(true);
  }, []);

  useEffect(() => {
    void loadRegisteredPartCatalogItems(true);
    void loadRegisteredLaborCatalogItems(true);
  }, []);

  useEffect(() => {
    loadRegisteredChecklists();
  }, []);

  useEffect(() => {
    void loadRegisteredMechanics(true);
  }, []);

  useEffect(() => {
    if (customersBackendEnabled) {
      return;
    }

    const refreshCustomers = () => {
      void loadRegisteredCustomers();
    };

    const handleCustomersUpdate: EventListener = () => {
      refreshCustomers();
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (!event.key || event.key === CUSTOMERS_STORAGE_KEY) {
        refreshCustomers();
      }
    };

    window.addEventListener(CUSTOMERS_UPDATED_EVENT, handleCustomersUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(CUSTOMERS_UPDATED_EVENT, handleCustomersUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [customersBackendEnabled]);

  useEffect(() => {
    if (vehiclesBackendEnabled) {
      return;
    }

    const refreshVehicles = () => {
      void loadRegisteredVehicles();
    };

    const handleVehiclesUpdate: EventListener = () => {
      refreshVehicles();
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (!event.key || event.key === VEHICLES_STORAGE_KEY) {
        refreshVehicles();
      }
    };

    window.addEventListener(VEHICLES_UPDATED_EVENT, handleVehiclesUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(VEHICLES_UPDATED_EVENT, handleVehiclesUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [vehiclesBackendEnabled]);

  useEffect(() => {
    const refreshCatalog = () => {
      void loadRegisteredPartCatalogItems();
      void loadRegisteredLaborCatalogItems();
    };

    const handleCatalogUpdated: EventListener = () => {
      refreshCatalog();
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (!event.key || event.key === SERVICE_ORDER_CATALOG_STORAGE_KEY) {
        refreshCatalog();
      }
    };

    window.addEventListener(SERVICE_ORDER_CATALOG_UPDATED_EVENT, handleCatalogUpdated);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(
        SERVICE_ORDER_CATALOG_UPDATED_EVENT,
        handleCatalogUpdated,
      );
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  useEffect(() => {
    const refreshChecklists = () => {
      loadRegisteredChecklists();
    };

    const handleChecklistUpdated: EventListener = () => {
      refreshChecklists();
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (!event.key || event.key === SERVICE_ORDER_CHECKLISTS_STORAGE_KEY) {
        refreshChecklists();
      }
    };

    window.addEventListener(
      SERVICE_ORDER_CHECKLISTS_UPDATED_EVENT,
      handleChecklistUpdated,
    );
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(
        SERVICE_ORDER_CHECKLISTS_UPDATED_EVENT,
        handleChecklistUpdated,
      );
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  useEffect(() => {
    const refreshMechanics = () => {
      void loadRegisteredMechanics();
    };

    const handleMechanicsUpdated: EventListener = () => {
      refreshMechanics();
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (!event.key || event.key === MECHANICS_STORAGE_KEY) {
        refreshMechanics();
      }
    };

    window.addEventListener(MECHANICS_UPDATED_EVENT, handleMechanicsUpdated);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(MECHANICS_UPDATED_EVENT, handleMechanicsUpdated);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  const activeCustomers = useMemo(
    () => registeredCustomers.filter((customer) => customer.status === "active"),
    [registeredCustomers],
  );

  const activeVehicles = useMemo(
    () => registeredVehicles.filter((vehicle) => vehicle.status === "active"),
    [registeredVehicles],
  );

  const selectedCustomer = useMemo(
    () =>
      activeCustomers.find((customer) => customer.id === selectedCustomerId) ??
      null,
    [activeCustomers, selectedCustomerId],
  );

  const selectedVehicle = useMemo(
    () =>
      activeVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [activeVehicles, selectedVehicleId],
  );
  const activePartCatalogItems = useMemo(
    () =>
      registeredPartCatalogItems.filter((item) => item.status === "active"),
    [registeredPartCatalogItems],
  );
  const partCatalogById = useMemo(
    () => new Map(registeredPartCatalogItems.map((item) => [item.id, item])),
    [registeredPartCatalogItems],
  );
  const activeLaborCatalogItems = useMemo(
    () =>
      registeredLaborCatalogItems.filter((item) => item.status === "active"),
    [registeredLaborCatalogItems],
  );
  const activeMechanics = useMemo(
    () => registeredMechanics.filter((mechanic) => mechanic.status === "active"),
    [registeredMechanics],
  );

  const selectedMechanic = useMemo(() => {
    const normalized = orderInfo.mechanicResponsible.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    return (
      activeMechanics.find(
        (mechanic) => mechanic.name.trim().toLowerCase() === normalized,
      ) ?? null
    );
  }, [activeMechanics, orderInfo.mechanicResponsible]);
  const checklistEntries = useMemo(
    () => buildChecklistEntries(registeredChecklists, checklist),
    [registeredChecklists, checklist],
  );

  useEffect(() => {
    setChecklist((previous) => buildChecklistState(registeredChecklists, previous));
  }, [registeredChecklists]);

  useEffect(() => {
    if (!serviceOrderIdFromQuery) {
      setEditingServiceOrder(null);
      return;
    }

    if (editingServiceOrder?.id === serviceOrderIdFromQuery) {
      return;
    }

    let isCancelled = false;

    const hydrateServiceOrderForEdit = async () => {
      try {
        setIsLoadingServiceOrderForEdit(true);

        const serviceOrder = await getServiceOrderApi(serviceOrderIdFromQuery);
        if (!serviceOrder || isCancelled) {
          if (!isCancelled) {
            open?.({
              type: "error",
              message: "Ordem de serviço não encontrada",
            });
          }
          return;
        }

        setEditingServiceOrder(serviceOrder);
        setOrderInfo(serviceOrder.orderInfo);
        setChecklist(serviceOrder.checklist);
        setParts(serviceOrder.parts);
        setLaborServices(serviceOrder.laborServices);
        setThirdPartyServices(serviceOrder.thirdPartyServices);
        setDiscount(serviceOrder.discount);
        setGeneratedSignatureToken(serviceOrder.signature?.token ?? "");
        setGeneratedSignatureLink(serviceOrder.signature?.link ?? "");
        setSelectedCustomerId(null);
        setSelectedVehicleId(null);
        clearServiceOrderDraft();
      } catch (error) {
        if (isCancelled) {
          return;
        }

        open?.({
          type: "error",
          message: "Falha ao carregar OS para edição",
          description: getErrorMessage(error),
        });
      } finally {
        if (!isCancelled) {
          setIsLoadingServiceOrderForEdit(false);
        }
      }
    };

    void hydrateServiceOrderForEdit();

    return () => {
      isCancelled = true;
    };
  }, [editingServiceOrder?.id, open, serviceOrderIdFromQuery]);

  useEffect(() => {
    if (!customerIdFromQuery) {
      return;
    }

    const customer = activeCustomers.find(
      (item) => item.id === customerIdFromQuery,
    );

    if (!customer) {
      return;
    }

    const customerSelection = getCustomerSelectionData(customer, activeVehicles);
    setSelectedCustomerId(customer.id);
    setSelectedVehicleId(customerSelection.matchedVehicle?.id ?? null);
    setOrderInfo((previous) => ({
      ...previous,
      ...customerSelection.orderInfo,
    }));

    const next = new URLSearchParams(searchParams);
    next.delete("customerId");
    setSearchParams(next, { replace: true });
  }, [
    activeCustomers,
    activeVehicles,
    customerIdFromQuery,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (!appointmentIdFromQuery) {
      setLinkedAppointment(null);
      return;
    }

    if (linkedAppointment?.id === appointmentIdFromQuery) {
      return;
    }

    let isCancelled = false;

    const hydrateFromAppointment = async () => {
      try {
        setIsLoadingLinkedAppointment(true);

        const appointment = await getSchedulingAppointmentByIdApi(appointmentIdFromQuery);
        if (!appointment || isCancelled) {
          return;
        }

        setLinkedAppointment(appointment);

        const matchedCustomer = appointment.customer.id
          ? activeCustomers.find((customer) => customer.id === appointment.customer.id) ??
            null
          : null;

        const matchedVehicle = appointment.vehicle.plate
          ? activeVehicles.find(
              (vehicle) =>
                vehicle.vehiclePlate.trim().toUpperCase() ===
                appointment.vehicle.plate.trim().toUpperCase(),
            ) ?? null
          : null;

        setSelectedCustomerId(matchedCustomer?.id ?? null);
        setSelectedVehicleId(matchedVehicle?.id ?? null);
        setOrderInfo((previous) => ({
          ...previous,
          date:
            previous.date || formatDateInputFromIso(appointment.schedule.startAt),
          customerName: appointment.customer.name || previous.customerName,
          phone: appointment.customer.phone || previous.phone,
          vehicle: appointment.vehicle.model || previous.vehicle,
          year:
            previous.year ||
            (matchedVehicle ? formatVehicleNumericField(matchedVehicle.vehicleYear) : ""),
          plate: appointment.vehicle.plate || previous.plate,
          km:
            previous.km ||
            (matchedVehicle ? formatVehicleNumericField(matchedVehicle.vehicleMileage) : ""),
          mechanicResponsible:
            appointment.mechanicResponsible || previous.mechanicResponsible,
          notes: previous.notes || appointment.schedule.notes || "",
        }));
      } catch (error) {
        if (isCancelled) {
          return;
        }

        open?.({
          type: "error",
          message: "Falha ao carregar agendamento vinculado",
          description: getErrorMessage(error),
        });
      } finally {
        if (!isCancelled) {
          setIsLoadingLinkedAppointment(false);
        }
      }
    };

    void hydrateFromAppointment();

    return () => {
      isCancelled = true;
    };
  }, [
    activeCustomers,
    activeVehicles,
    appointmentIdFromQuery,
    linkedAppointment?.id,
    open,
  ]);

  const declinedPartsCount = useMemo(
    () => parts.filter((part) => part.status === "declined").length,
    [parts],
  );
  const declinedLaborServicesCount = useMemo(
    () => laborServices.filter((service) => service.status === "declined").length,
    [laborServices],
  );
  const declinedThirdPartyServicesCount = useMemo(
    () =>
      thirdPartyServices.filter((service) => service.status === "declined").length,
    [thirdPartyServices],
  );
  const checkedChecklistCount = useMemo(
    () => checklistEntries.filter((entry) => entry.checked).length,
    [checklistEntries],
  );
  const checklistPreview = useMemo(() => checklistEntries.slice(0, 4), [checklistEntries]);
  const evidencePreview = useMemo(() => evidenceFiles.slice(0, 3), [evidenceFiles]);
  const partsPreview = useMemo(() => parts.slice(0, 3), [parts]);
  const laborPreview = useMemo(() => laborServices.slice(0, 3), [laborServices]);
  const thirdPartyPreview = useMemo(
    () => thirdPartyServices.slice(0, 3),
    [thirdPartyServices],
  );
  const evidenceSummary = useMemo(
    () =>
      evidenceFiles.reduce(
        (acc, file) => {
          if (file.type.startsWith("image/")) {
            acc.images += 1;
          } else if (file.type.startsWith("video/")) {
            acc.videos += 1;
          }
          return acc;
        },
        { images: 0, videos: 0 },
      ),
    [evidenceFiles],
  );

  const partsSubtotal = useMemo(
    () =>
      parts.reduce(
        (total, item) =>
          item.status === "declined"
            ? total
            : total + item.quantity * item.unitPrice,
        0,
      ),
    [parts],
  );

  const laborSubtotal = useMemo(
    () =>
      laborServices.reduce(
        (total, item) => (item.status === "declined" ? total : total + item.amount),
        0,
      ),
    [laborServices],
  );

  const thirdPartySubtotal = useMemo(
    () =>
      thirdPartyServices.reduce(
        (total, item) => (item.status === "declined" ? total : total + item.amount),
        0,
      ),
    [thirdPartyServices],
  );
  const thirdPartyCostTotal = useMemo(
    () =>
      thirdPartyServices.reduce(
        (total, item) =>
          item.status === "declined" ? total : total + (item.costPrice ?? 0),
        0,
      ),
    [thirdPartyServices],
  );
  const thirdPartyProfitTotal = useMemo(
    () =>
      thirdPartyServices.reduce(
        (total, item) =>
          item.status === "declined"
            ? total
            : total + (item.profitAmount ?? Math.max(0, item.amount - (item.costPrice ?? 0))),
        0,
      ),
    [thirdPartyServices],
  );

  const grandTotal = useMemo(
    () => partsSubtotal + laborSubtotal + thirdPartySubtotal - discount,
    [discount, laborSubtotal, partsSubtotal, thirdPartySubtotal],
  );

  const handleOrderInfoChange =
    (field: keyof OrderInfo) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (
        selectedCustomerId &&
        (field === "customerName" ||
          field === "phone" ||
          field === "vehicle" ||
          field === "plate")
      ) {
        setSelectedCustomerId(null);
      }

      if (
        selectedVehicleId &&
        (field === "vehicle" ||
          field === "year" ||
          field === "plate" ||
          field === "km")
      ) {
        setSelectedVehicleId(null);
      }

      setOrderInfo((previous) => ({
        ...previous,
        [field]: value,
      }));
    };

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomerId(customer?.id ?? null);
    if (!customer) {
      setSelectedVehicleId(null);
      setOrderInfo((previous) => ({
        ...previous,
        ...EMPTY_CUSTOMER_ORDER_INFO,
      }));
      return;
    }

    const customerSelection = getCustomerSelectionData(customer, activeVehicles);
    setSelectedVehicleId(customerSelection.matchedVehicle?.id ?? null);
    setOrderInfo((previous) => ({
      ...previous,
      ...customerSelection.orderInfo,
    }));
  };

  const handleVehicleSelect = (vehicle: Vehicle | null) => {
    setSelectedVehicleId(vehicle?.id ?? null);
    if (!vehicle) {
      setOrderInfo((previous) => ({
        ...previous,
        ...EMPTY_VEHICLE_ORDER_INFO,
      }));
      return;
    }

    setOrderInfo((previous) => ({
      ...previous,
      ...toVehicleOrderInfo(vehicle),
    }));
  };

  const handleChecklistChange =
    (field: string) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      setChecklist((previous) => ({
        ...previous,
        [field]: checked,
      }));
    };

  const updatePart = (
    id: string,
    field: "description" | "quantity" | "unitPrice",
    rawValue: string,
  ) => {
    setParts((previous) =>
      previous.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (field === "description") {
          return { ...item, description: rawValue };
        }

        if (field === "quantity") {
          return { ...item, quantity: Math.max(0, Number(rawValue) || 0) };
        }

        return { ...item, unitPrice: Math.max(0, parseCurrencyInput(rawValue)) };
      }),
    );
  };

  const setPartStatus = (id: string, status: ServiceOrderPartStatus) => {
    setParts((previous) =>
      previous.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          status,
        };
      }),
    );
  };

  const updateService = (
    setState: React.Dispatch<React.SetStateAction<ServiceItem[]>>,
    id: string,
    field: "description" | "amount" | "costPrice" | "profitAmount",
    rawValue: string,
  ) => {
    setState((previous) =>
      previous.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (field === "description") {
          return { ...item, description: rawValue };
        }

        const nextValue = Math.max(0, parseCurrencyInput(rawValue));
        if (field === "costPrice") {
          const profitAmount = item.profitAmount ?? Math.max(0, item.amount - nextValue);
          return {
            ...item,
            costPrice: nextValue,
            profitAmount,
            amount: nextValue + profitAmount,
          };
        }

        if (field === "profitAmount") {
          const costPrice = item.costPrice ?? 0;
          return {
            ...item,
            costPrice,
            profitAmount: nextValue,
            amount: costPrice + nextValue,
          };
        }

        return { ...item, amount: nextValue };
      }),
    );
  };

  const setServiceStatus = (
    setState: React.Dispatch<React.SetStateAction<ServiceItem[]>>,
    id: string,
    status: ServiceOrderPartStatus,
  ) => {
    setState((previous) =>
      previous.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          status,
        };
      }),
    );
  };

  const addPart = () => {
    setParts((previous) => [
      ...previous,
      {
        id: createId(),
        catalogItemId: undefined,
        description: "",
        quantity: 1,
        unitPrice: 0,
        status: "approved",
      },
    ]);
  };

  const addService = (setState: React.Dispatch<React.SetStateAction<ServiceItem[]>>) => {
    setState((previous) => [
      ...previous,
      {
        id: createId(),
        catalogItemId: undefined,
        description: "",
        amount: 0,
        costPrice: 0,
        profitAmount: 0,
        status: "approved",
      },
    ]);
  };

  const addPartFromCatalog = (catalogItem: ServiceOrderCatalogItem | null) => {
    if (!catalogItem) {
      return;
    }

    if (catalogItem.stockQuantity <= 0) {
      open?.({
        type: "error",
        message: "Peça sem estoque",
        description: "Atualize a quantidade no cadastro antes de inserir na OS.",
      });
      return;
    }

    setParts((previous) => [
      ...previous,
      {
        id: createId(),
        catalogItemId: catalogItem.id,
        description: catalogItem.description,
        quantity: 1,
        unitPrice: catalogItem.defaultPrice,
        status: "approved",
      },
    ]);
    setSelectedPartCatalogItem(null);
  };

  const addServiceFromCatalog = (
    catalogItem: ServiceOrderCatalogItem | null,
    setState: React.Dispatch<React.SetStateAction<ServiceItem[]>>,
    clearSelection: () => void,
  ) => {
    if (!catalogItem) {
      return;
    }

    setState((previous) => [
      ...previous,
      {
        id: createId(),
        catalogItemId: catalogItem.id,
        description: catalogItem.description,
        amount: catalogItem.defaultPrice,
        costPrice: 0,
        profitAmount: catalogItem.defaultPrice,
        status: "approved",
      },
    ]);
    clearSelection();
  };

  const removePart = (id: string) => {
    setParts((previous) => previous.filter((item) => item.id !== id));
  };

  const removeService = (
    setState: React.Dispatch<React.SetStateAction<ServiceItem[]>>,
    id: string,
  ) => {
    setState((previous) => previous.filter((item) => item.id !== id));
  };

  const handleEvidenceUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/") || file.type.startsWith("video/"),
    );

    if (!files.length) {
      event.target.value = "";
      return;
    }

    try {
      setIsUploadingEvidence(true);

      const uploaded = await Promise.all(
        files.map(async (file) => {
          const url = await fileToDataURL(file);
          return {
            id: createId(),
            name: file.name,
            type: file.type,
            size: file.size,
            url,
          } satisfies ServiceOrderEvidence;
        }),
      );

      setEvidenceFiles((previous) => [...previous, ...uploaded]);
      open?.({
        type: "success",
        message: "Provas anexadas",
        description: `${uploaded.length} arquivo(s) enviado(s).`,
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha no upload",
        description: "Não foi possível anexar as provas.",
      });
    } finally {
      setIsUploadingEvidence(false);
      event.target.value = "";
    }
  };

  const removeEvidence = (id: string) => {
    setEvidenceFiles((previous) => previous.filter((file) => file.id !== id));
  };

  const openReview = () => {
    setGeneratedSignatureLink("");
    setGeneratedSignatureToken("");
    setIsReviewOpen(true);
  };

  const openEditorSection = (section: Exclude<ServiceOrderEditorSection, null>) => {
    setActiveEditorSection(section);
  };

  const closeEditorSection = () => {
    setActiveEditorSection(null);
  };

  const closeReview = () => {
    setIsReviewOpen(false);
  };

  const handleConfirmServiceOrder = async () => {
    if (!orderInfo.orderNumber.trim()) {
      open?.({ type: "error", message: "Informe o Nº da OS" });
      return;
    }

    if (!orderInfo.date.trim()) {
      open?.({ type: "error", message: "Informe a data da OS" });
      return;
    }

    if (!orderInfo.customerName.trim()) {
      open?.({ type: "error", message: "Informe o nome do cliente" });
      return;
    }

    if (!orderInfo.mechanicResponsible.trim()) {
      open?.({ type: "error", message: "Selecione o mecânico responsável" });
      return;
    }

    try {
      setIsSavingServiceOrder(true);

      const wantsSignatureLink = Boolean(generatedSignatureToken);

      const serviceOrderPayload: CreateServiceOrderPayload = {
        status:
          wantsSignatureLink && !serviceOrdersBackendEnabled
            ? "sent_for_signature"
            : editingServiceOrder?.status ?? "registered",
        orderInfo,
        checklist,
        parts,
        laborServices,
        thirdPartyServices,
        discount,
        totals: {
          partsSubtotal,
          laborSubtotal,
          thirdPartySubtotal,
          grandTotal,
        },
        signature:
          wantsSignatureLink && !serviceOrdersBackendEnabled
          ? {
              token: generatedSignatureToken,
              link: generatedSignatureLink,
              status: "pending",
              signerName: "",
              signedAt: "",
            }
          : null,
      };

      const savedOrder = isEditingServiceOrder
        ? await updateServiceOrderApi(serviceOrderIdFromQuery, serviceOrderPayload)
        : await createServiceOrderApi(serviceOrderPayload);

      if (!savedOrder) {
        throw new Error("Não foi possível salvar a ordem de serviço.");
      }

      let finalSignatureLink = generatedSignatureLink;
      let finalSignatureToken = generatedSignatureToken;

      if (serviceOrdersBackendEnabled && wantsSignatureLink) {
        const sharedOrder = await shareServiceOrderApi(savedOrder.id);
        finalSignatureLink = sharedOrder.link;
        finalSignatureToken = sharedOrder.token;
        setGeneratedSignatureLink(sharedOrder.link);
        setGeneratedSignatureToken(sharedOrder.token);

        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(sharedOrder.link);
        }
      }

      if (!isEditingServiceOrder && appointmentIdFromQuery) {
        try {
          const updatedAppointment = await patchSchedulingAppointmentApi(
            appointmentIdFromQuery,
            {
              mechanicResponsible: orderInfo.mechanicResponsible,
              serviceOrder: {
                id: savedOrder.id,
                orderNumber: orderInfo.orderNumber,
              },
            },
          );

          if (updatedAppointment) {
            setLinkedAppointment(updatedAppointment);
          }

          const next = new URLSearchParams(searchParams);
          next.delete("appointmentId");
          setSearchParams(next, { replace: true });
        } catch (linkError) {
          open?.({
            type: "progress",
            message: "OS criada, mas o vínculo com o agendamento falhou",
            description: getErrorMessage(linkError),
          });
        }
      }

      open?.({
        type: "success",
        message: isEditingServiceOrder
          ? "Ordem de serviço atualizada"
          : "Ordem de serviço cadastrada",
        description:
          serviceOrdersBackendEnabled && finalSignatureToken && finalSignatureLink
            ? `OS ${orderInfo.orderNumber || "-"} salva e link de assinatura copiado.`
            : `OS ${orderInfo.orderNumber || "-"} salva com sucesso.`,
      });
      clearServiceOrderDraft();
      closeReview();
      if (isEditingServiceOrder) {
        navigate("/ordem-servico/historico");
      }
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? Number((error as { status?: unknown }).status)
          : undefined;

      if (status === 401) {
        open?.({
          type: "error",
          message: "Sessão expirada",
          description: "Faça login novamente para cadastrar a ordem de serviço.",
        });
        navigate("/login");
        return;
      }

      open?.({
        type: "error",
        message: isEditingServiceOrder
          ? "Erro ao atualizar ordem de serviço"
          : "Erro ao cadastrar ordem de serviço",
        description: getErrorMessage(error),
      });
    } finally {
      setIsSavingServiceOrder(false);
    }
  };

  const handleGenerateSignatureLink = async () => {
    try {
      setIsGeneratingSignatureLink(true);

      if (serviceOrdersBackendEnabled) {
        setGeneratedSignatureToken(
          generatedSignatureToken ||
            (typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
        );
        setGeneratedSignatureLink("");

        open?.({
          type: "success",
          message: "Geração de link preparada",
          description:
            "O link real será criado e copiado automaticamente após salvar a ordem de serviço.",
        });
        return;
      }

      const partsForSignature: SharedServiceOrderPart[] = parts.map((part) => ({
        id: part.id,
        description: part.description,
        quantity: part.quantity,
        unitPrice: part.unitPrice,
        status: part.status,
      }));

      const sharedOrder = createSharedServiceOrder({
        orderInfo,
        checklist,
        parts: partsForSignature,
        laborServices,
        thirdPartyServices,
        discount,
        totals: {
          partsSubtotal,
          laborSubtotal,
          thirdPartySubtotal,
          grandTotal,
        },
      });

      const link = `${window.location.origin}/assinatura-os/${sharedOrder.token}`;
      setGeneratedSignatureLink(link);
      setGeneratedSignatureToken(sharedOrder.token);

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      }

      open?.({
        type: "success",
        message: "Link de assinatura gerado",
        description:
          "O link foi criado e copiado. Envie ao cliente para assinatura.",
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Erro ao gerar link",
        description: "Não foi possível criar o link de assinatura.",
      });
    } finally {
      setIsGeneratingSignatureLink(false);
    }
  };

  const handleCopySignatureLink = async () => {
    if (!generatedSignatureLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedSignatureLink);
      open?.({
        type: "success",
        message: "Link copiado",
      });
    } catch {
      open?.({
        type: "error",
        message: "Falha ao copiar link",
      });
    }
  };

  return (
    <RefineListView
      title={
        isEditingServiceOrder
          ? `Editar Ordem de Serviço${editingServiceOrder?.orderInfo.orderNumber ? ` #${editingServiceOrder.orderInfo.orderNumber}` : ""}`
          : t("serviceOrder.title", "Ordem de Serviço")
      }
      headerButtons={() => (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate("/ordem-servico/pecas")}
          >
            Cad. Peças
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate("/ordem-servico/mao-de-obra")}
          >
            Cad. Serviços
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate("/ordem-servico/historico")}
          >
            Encerramento de OS
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate("/ordem-servico/assinaturas")}
          >
            Assinaturas
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate("/ordem-servico/recusas")}
          >
            Serviços Recusados
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            onClick={openReview}
            disabled={isLoadingServiceOrderForEdit}
          >
            {isEditingServiceOrder
              ? "Salvar edição"
              : t("serviceOrder.register", "Cadastrar OS")}
          </Button>
        </Stack>
      )}
    >
      <Grid container columns={24} spacing={3}>
        <Grid
          size={{
            xs: 24,
            lg: 24,
          }}
        >
          <Stack spacing={3}>
            {appointmentIdFromQuery ? (
              <Alert severity={linkedAppointment ? "info" : "warning"}>
                {isLoadingLinkedAppointment
                  ? "Carregando dados do agendamento para montar a ordem de serviço."
                  : linkedAppointment
                    ? `OS vinculada ao agendamento de ${linkedAppointment.customer.name || "cliente"} em ${new Date(linkedAppointment.schedule.startAt).toLocaleString("pt-BR")}.`
                    : "Agendamento informado na URL não foi encontrado."}
              </Alert>
            ) : null}
            {isEditingServiceOrder ? (
              <Alert severity={isLoadingServiceOrderForEdit ? "info" : "success"}>
                {isLoadingServiceOrderForEdit
                  ? "Carregando a ordem de serviço para edição."
                  : "Modo edição ativo. As alterações serão gravadas na OS existente."}
              </Alert>
            ) : null}
            <Card
              title={t("serviceOrder.orderData", "Dados da Ordem")}
              icon={<BuildCircleOutlinedIcon />}
              cardContentProps={{ sx: { p: { xs: 3, md: 4 } } }}
            >
              <Grid container columns={12} spacing={{ xs: 2, md: 2.5 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nº OS"
                    value={orderInfo.orderNumber}
                    onChange={handleOrderInfoChange("orderNumber")}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                    adapterLocale="pt-br"
                  >
                    <DatePicker
                      label="Data"
                      value={getOrderDatePickerValue(orderInfo.date)}
                      onChange={(value) =>
                        setOrderInfo((current) => ({
                          ...current,
                          date: value?.isValid() ? value.format("YYYY-MM-DD") : "",
                        }))
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          required: true,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="KM"
                    value={orderInfo.km}
                    onChange={handleOrderInfoChange("km")}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    options={activeCustomers}
                    value={selectedCustomer}
                    onChange={(_, customer) => handleCustomerSelect(customer)}
                    getOptionLabel={(customer) =>
                      `${customer.name} • ${customer.phone || "Sem telefone"}`
                    }
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    noOptionsText="Nenhum cliente ativo cadastrado"
                    renderOption={(optionProps, customer) => {
                      const { key, ...liProps } = optionProps as HTMLAttributes<HTMLLIElement> & {
                        key: Key;
                      };

                      return (
                        <Box component="li" key={key} {...liProps}>
                          <Stack spacing={0.2}>
                            <Typography variant="body2" fontWeight={600}>
                              {customer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {customer.phone || "-"} • {customer.vehicleModel || "-"} •{" "}
                              {customer.vehiclePlate || "-"}
                            </Typography>
                          </Stack>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label="Cliente cadastrado"
                        placeholder="Selecione para preencher automático"
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Cliente"
                    value={orderInfo.customerName}
                    onChange={handleOrderInfoChange("customerName")}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Telefone"
                    value={orderInfo.phone}
                    onChange={handleOrderInfoChange("phone")}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    options={activeVehicles}
                    value={selectedVehicle}
                    onChange={(_, vehicle) => handleVehicleSelect(vehicle)}
                    getOptionLabel={(vehicle) =>
                      `${vehicle.vehicleModel} • ${vehicle.vehiclePlate || "Sem placa"}`
                    }
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    noOptionsText="Nenhum veículo ativo cadastrado"
                    renderOption={(optionProps, vehicle) => {
                      const { key, ...liProps } = optionProps as HTMLAttributes<HTMLLIElement> & {
                        key: Key;
                      };

                      return (
                        <Box component="li" key={key} {...liProps}>
                          <Stack spacing={0.2}>
                            <Typography variant="body2" fontWeight={600}>
                              {vehicle.vehicleModel}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {vehicle.vehicleBrand || "-"} •{" "}
                              {formatVehicleNumericField(vehicle.vehicleYear) || "-"} •{" "}
                              {vehicle.vehiclePlate || "-"} •{" "}
                              {formatVehicleNumericField(vehicle.vehicleMileage)
                                ? `${formatVehicleNumericField(vehicle.vehicleMileage)} km`
                                : "KM não informado"}
                            </Typography>
                          </Stack>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label="Veículo cadastrado"
                        placeholder="Selecione para preencher automático"
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Veículo"
                    value={orderInfo.vehicle}
                    onChange={handleOrderInfoChange("vehicle")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Ano"
                    value={orderInfo.year}
                    onChange={handleOrderInfoChange("year")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Placa"
                    value={orderInfo.plate}
                    onChange={handleOrderInfoChange("plate")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={0.75}>
                    <Autocomplete
                      fullWidth
                      options={activeMechanics}
                      value={selectedMechanic}
                      onChange={(_, mechanic) =>
                        setOrderInfo((previous) => ({
                          ...previous,
                          mechanicResponsible: mechanic?.name ?? "",
                        }))
                      }
                      getOptionLabel={(mechanic) => mechanic.name}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      noOptionsText="Cadastre um mecânico para selecionar"
                      renderOption={(optionProps, mechanic) => {
                        const { key, ...liProps } = optionProps as HTMLAttributes<HTMLLIElement> & {
                          key: Key;
                        };

                        return (
                          <Box component="li" key={key} {...liProps}>
                            <Stack spacing={0.2}>
                              <Typography variant="body2" fontWeight={700}>
                                {mechanic.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {mechanic.phone || "-"} • {mechanic.email || "-"}
                              </Typography>
                            </Stack>
                          </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          size="small"
                          label="Mecânico responsável"
                          placeholder="Selecione um mecânico"
                          required
                        />
                      )}
                    />
                    {!activeMechanics.length ? (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => navigate("/ordem-servico/mecanicos")}
                      >
                        Cadastrar mecânico responsável
                      </Button>
                    ) : null}
                  </Stack>
                </Grid>
              </Grid>
            </Card>

            <Card
              title={t("serviceOrder.inspection", "Checklist de Inspeção")}
              icon={<ChecklistOutlinedIcon />}
              cardHeaderProps={{
                action: (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => openEditorSection("checklist")}
                  >
                    Abrir
                  </Button>
                ),
              }}
              cardContentProps={{ sx: { p: 3 } }}
            >
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`${checkedChecklistCount} marcados`} color="success" />
                  <Chip
                    label={`${Math.max(checklistEntries.length - checkedChecklistCount, 0)} pendentes`}
                    variant="outlined"
                  />
                </Stack>
                <TableContainer
                  sx={{
                    maxHeight: 220,
                    ...SCROLLABLE_TABLE_CONTAINER_SX,
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell sx={{ width: 140 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {checklistPreview.length ? (
                        checklistPreview.map((option) => (
                          <TableRow key={option.key} hover>
                            <TableCell>{option.label}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={option.checked ? "Marcado" : "Pendente"}
                                color={option.checked ? "success" : "default"}
                                variant={option.checked ? "filled" : "outlined"}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2}>
                            <Typography variant="body2" color="text.secondary">
                              Nenhum item disponível no checklist.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </Card>

            <Grid container columns={12} spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  title={t("serviceOrder.parts", "Peças")}
                  icon={<Inventory2OutlinedIcon />}
                  cardHeaderProps={{
                    action: (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => openEditorSection("parts")}
                      >
                        Abrir
                      </Button>
                    ),
                  }}
                  cardContentProps={{ sx: { p: 3 } }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip label={`${parts.length} item(ns)`} variant="outlined" />
                      <Chip label={`Subtotal: ${formatCurrency(partsSubtotal)}`} color="success" />
                      {declinedPartsCount ? (
                        <Chip label={`${declinedPartsCount} recusada(s)`} color="warning" />
                      ) : null}
                    </Stack>
                    <TableContainer sx={{ ...SCROLLABLE_TABLE_CONTAINER_SX, maxHeight: 180 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Peça</TableCell>
                            <TableCell sx={{ width: 90 }}>Qtd</TableCell>
                            <TableCell sx={{ width: 140 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {partsPreview.length ? (
                            partsPreview.map((part) => (
                              <TableRow key={part.id} hover>
                                <TableCell>{part.description || "Peça sem descrição"}</TableCell>
                                <TableCell>{part.quantity}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={
                                      part.status === "declined" ? "Recusada" : "Aprovada"
                                    }
                                    color={
                                      part.status === "declined" ? "warning" : "success"
                                    }
                                    variant={
                                      part.status === "declined" ? "outlined" : "filled"
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Nenhuma peça lançada.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  title={t("serviceOrder.labor", "Serviços")}
                  icon={<HandymanOutlinedIcon />}
                  cardHeaderProps={{
                    action: (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => openEditorSection("labor")}
                      >
                        Abrir
                      </Button>
                    ),
                  }}
                  cardContentProps={{ sx: { p: 3 } }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip label={`${laborServices.length} serviço(s)`} variant="outlined" />
                      <Chip label={`Subtotal: ${formatCurrency(laborSubtotal)}`} color="success" />
                      {declinedLaborServicesCount ? (
                        <Chip label={`${declinedLaborServicesCount} recusado(s)`} color="warning" />
                      ) : null}
                    </Stack>
                    <TableContainer sx={{ ...SCROLLABLE_TABLE_CONTAINER_SX, maxHeight: 180 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Serviço</TableCell>
                            <TableCell sx={{ width: 120 }}>Valor</TableCell>
                            <TableCell sx={{ width: 140 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {laborPreview.length ? (
                            laborPreview.map((service) => (
                              <TableRow key={service.id} hover>
                                <TableCell>{service.description || "Serviço sem descrição"}</TableCell>
                                <TableCell>{formatCurrency(service.amount)}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={
                                      service.status === "declined" ? "Recusado" : "Aprovado"
                                    }
                                    color={
                                      service.status === "declined" ? "warning" : "success"
                                    }
                                    variant={
                                      service.status === "declined" ? "outlined" : "filled"
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Nenhum serviço lançado.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                </Card>
              </Grid>
            </Grid>

            <Grid container columns={12} spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  title={t("serviceOrder.thirdParty", "Serviços de Terceiros")}
                  icon={<PrecisionManufacturingOutlinedIcon />}
                  cardHeaderProps={{
                    action: (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => openEditorSection("third-party")}
                      >
                        Abrir
                      </Button>
                    ),
                  }}
                  cardContentProps={{ sx: { p: 3 } }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip label={`${thirdPartyServices.length} serviço(s)`} variant="outlined" />
                      <Chip
                        label={`Subtotal: ${formatCurrency(thirdPartySubtotal)}`}
                        color="success"
                      />
                      <Chip
                        label={`Lucro: ${formatCurrency(thirdPartyProfitTotal)}`}
                        variant="outlined"
                      />
                      {declinedThirdPartyServicesCount ? (
                        <Chip
                          label={`${declinedThirdPartyServicesCount} recusado(s)`}
                          color="warning"
                        />
                      ) : null}
                    </Stack>
                    <TableContainer sx={{ ...SCROLLABLE_TABLE_CONTAINER_SX, maxHeight: 180 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Serviço</TableCell>
                            <TableCell sx={{ width: 120 }}>Valor</TableCell>
                            <TableCell sx={{ width: 140 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {thirdPartyPreview.length ? (
                            thirdPartyPreview.map((service) => (
                              <TableRow key={service.id} hover>
                                <TableCell>{service.description || "Serviço sem descrição"}</TableCell>
                                <TableCell>{formatCurrency(service.amount)}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={
                                      service.status === "declined" ? "Recusado" : "Aprovado"
                                    }
                                    color={
                                      service.status === "declined" ? "warning" : "success"
                                    }
                                    variant={
                                      service.status === "declined" ? "outlined" : "filled"
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Nenhum serviço de terceiros lançado.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  title={t("serviceOrder.evidence", "Provas (Fotos e Vídeos)")}
                  icon={<UploadFileOutlinedIcon />}
                  cardHeaderProps={{
                    action: (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => openEditorSection("evidence")}
                      >
                        Abrir
                      </Button>
                    ),
                  }}
                  cardContentProps={{ sx: { p: 3 } }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip label={`${evidenceFiles.length} arquivo(s)`} variant="outlined" />
                      <Chip label={`${evidenceSummary.images} foto(s)`} color="success" />
                      <Chip label={`${evidenceSummary.videos} vídeo(s)`} variant="outlined" />
                      {isUploadingEvidence ? (
                        <Chip label="Enviando..." color="warning" />
                      ) : null}
                    </Stack>
                    <TableContainer sx={{ ...SCROLLABLE_TABLE_CONTAINER_SX, maxHeight: 180 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Arquivo</TableCell>
                            <TableCell sx={{ width: 110 }}>Tipo</TableCell>
                            <TableCell sx={{ width: 110 }}>Tamanho</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {evidencePreview.length ? (
                            evidencePreview.map((file) => (
                              <TableRow key={file.id} hover>
                                <TableCell>{file.name}</TableCell>
                                <TableCell>
                                  {file.type.startsWith("image/") ? "Foto" : "Vídeo"}
                                </TableCell>
                                <TableCell>{formatFileSize(file.size)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Nenhuma prova anexada até o momento.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                </Card>
              </Grid>
            </Grid>

            <Card
              title={t("serviceOrder.totals", "Totais e Observações")}
              icon={<ReceiptLongOutlinedIcon />}
              cardContentProps={{ sx: { p: 3 } }}
            >
              <Grid container columns={12} spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Desconto (R$)"
                    type="number"
                    value={discount}
                    onChange={(event) =>
                      setDiscount(Math.max(0, parseCurrencyInput(event.target.value)))
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Forma de pagamento"
                    value={orderInfo.paymentMethod}
                    onChange={handleOrderInfoChange("paymentMethod")}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={3}
                    label="Observações"
                    value={orderInfo.notes}
                    onChange={handleOrderInfoChange("notes")}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: "background.paper",
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Peças</Typography>
                        <Typography>{formatCurrency(partsSubtotal)}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Serviços</Typography>
                        <Typography>{formatCurrency(laborSubtotal)}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Terceiros</Typography>
                        <Typography>{formatCurrency(thirdPartySubtotal)}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Desconto</Typography>
                        <Typography>- {formatCurrency(discount)}</Typography>
                      </Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography fontWeight={700}>TOTAL GERAL</Typography>
                        <Typography fontWeight={700}>
                          {formatCurrency(grandTotal)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Card>

          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={activeEditorSection === "checklist"}
        onClose={closeEditorSection}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Checklist de Inspeção</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`${checkedChecklistCount} marcados`} color="success" />
                <Chip label={`${checklistEntries.length} itens`} variant="outlined" />
              </Stack>
              <Button size="small" onClick={() => navigate("/ordem-servico/checklists")}>
                Gerenciar cadastro
              </Button>
            </Stack>
            <Grid container columns={12} spacing={1}>
              {checklistEntries.map((option) => (
                <Grid key={option.key} size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={option.checked}
                        onChange={handleChecklistChange(option.key)}
                      />
                    }
                    label={option.label}
                  />
                </Grid>
              ))}
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditorSection}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={activeEditorSection === "parts"}
        onClose={closeEditorSection}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Peças</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Grid container columns={12} spacing={1.5}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Autocomplete
                  options={activePartCatalogItems}
                  value={selectedPartCatalogItem}
                  onChange={(_, item) => setSelectedPartCatalogItem(item)}
                  getOptionLabel={(item) =>
                    `${item.description} • ${formatCurrency(item.defaultPrice)} • Estoque: ${item.stockQuantity}`
                  }
                  getOptionDisabled={(item) => item.stockQuantity <= 0}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  noOptionsText="Nenhuma peça ativa cadastrada"
                  renderOption={(optionProps, item) => {
                    const { key, ...liProps } = optionProps as HTMLAttributes<HTMLLIElement> & {
                      key: Key;
                    };

                    return (
                      <Box component="li" key={key} {...liProps}>
                        <Stack spacing={0.2}>
                          <Typography variant="body2" fontWeight={600}>
                            {item.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.code || "Sem código"} • {formatCurrency(item.defaultPrice)} •{" "}
                            Estoque: {item.stockQuantity} •{" "}
                            {item.partCondition === "used" ? "Usada" : "Nova"}
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Adicionar peça do cadastro"
                      placeholder="Selecione uma peça cadastrada"
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddOutlinedIcon />}
                  disabled={
                    !selectedPartCatalogItem ||
                    selectedPartCatalogItem.stockQuantity <= 0
                  }
                  onClick={() => addPartFromCatalog(selectedPartCatalogItem)}
                >
                  Inserir peça
                </Button>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => navigate("/ordem-servico/pecas")}
                >
                  Gerenciar
                </Button>
              </Grid>
            </Grid>
            <Typography variant="caption" color="text.secondary">
              O vínculo com o cadastro é salvo junto com a ordem de serviço.
            </Typography>

            <TableContainer
              sx={{
                maxHeight: 420,
                ...SCROLLABLE_TABLE_CONTAINER_SX,
              }}
            >
              <Table
                size="small"
                stickyHeader
                sx={{
                  width: "100%",
                  tableLayout: "fixed",
                  "& .MuiTableCell-root": {
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  },
                  "& .MuiTableCell-stickyHeader": {
                    backgroundColor: "background.paper",
                    backgroundImage: "none",
                    zIndex: 2,
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "28%" }}>Peça</TableCell>
                    <TableCell sx={{ width: "10%" }}>Qtd</TableCell>
                    <TableCell sx={{ width: "16%" }}>Valor Unit.</TableCell>
                    <TableCell sx={{ width: "14%" }}>Total</TableCell>
                    <TableCell sx={{ width: "24%" }}>Aprovação do Cliente</TableCell>
                    <TableCell sx={{ width: "8%" }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parts.length ? parts.map((part) => {
                    const lineTotal = part.quantity * part.unitPrice;
                    const isDeclined = part.status === "declined";
                    return (
                      <TableRow
                        key={part.id}
                        sx={
                          isDeclined
                            ? {
                                backgroundColor: "rgba(251,146,60,0.08)",
                              }
                            : undefined
                        }
                      >
                        <TableCell>
                          <Stack spacing={0.5}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Descrição da peça"
                              value={part.description}
                              onChange={(event) =>
                                updatePart(part.id, "description", event.target.value)
                              }
                              sx={
                                isDeclined
                                  ? {
                                      "& .MuiInputBase-input": {
                                        textDecoration: "line-through",
                                      },
                                    }
                                  : undefined
                              }
                            />
                            {part.catalogItemId ? (
                              (() => {
                                const catalogItem = partCatalogById.get(part.catalogItemId);
                                return (
                                  <Typography variant="caption" color="text.secondary">
                                    Vinculada ao cadastro
                                    {catalogItem
                                      ? ` • Estoque: ${catalogItem.stockQuantity} • ${catalogItem.partCondition === "used" ? "Usada" : "Nova"}`
                                      : ""}
                                  </Typography>
                                );
                              })()
                            ) : null}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={part.quantity}
                            onChange={(event) =>
                              updatePart(part.id, "quantity", event.target.value)
                            }
                            sx={
                              isDeclined
                                ? {
                                    "& .MuiInputBase-input": {
                                      textDecoration: "line-through",
                                    },
                                  }
                                : undefined
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={part.unitPrice}
                            onChange={(event) =>
                              updatePart(part.id, "unitPrice", event.target.value)
                            }
                            sx={
                              isDeclined
                                ? {
                                    "& .MuiInputBase-input": {
                                      textDecoration: "line-through",
                                    },
                                  }
                                : undefined
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={
                              isDeclined
                                ? {
                                    textDecoration: "line-through",
                                    color: "text.secondary",
                                  }
                                : undefined
                            }
                          >
                            {formatCurrency(lineTotal)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            sx={{ m: 0 }}
                            control={
                              <Checkbox
                                size="small"
                                checked={isDeclined}
                                onChange={(_, checked) =>
                                  setPartStatus(
                                    part.id,
                                    checked ? "declined" : "approved",
                                  )
                                }
                              />
                            }
                            label={isMobile ? "Recusou" : "Cliente recusou"}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => removePart(part.id)}>
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary">
                          Nenhuma peça adicionada.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<AddOutlinedIcon />} onClick={addPart}>
            Adicionar peça
          </Button>
          <Box sx={{ flex: 1 }} />
          <Typography fontWeight={700}>
            Subtotal Peças: {formatCurrency(partsSubtotal)}
          </Typography>
          <Button onClick={closeEditorSection}>Concluir</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={activeEditorSection === "labor"}
        onClose={closeEditorSection}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Serviços</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Grid container columns={12} spacing={1.5}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Autocomplete
                  options={activeLaborCatalogItems}
                  value={selectedLaborCatalogItem}
                  onChange={(_, item) => setSelectedLaborCatalogItem(item)}
                  getOptionLabel={(item) =>
                    `${item.description} • ${formatCurrency(item.defaultPrice)}`
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  noOptionsText="Nenhum serviço ativo cadastrado"
                  renderOption={(optionProps, item) => {
                    const { key, ...liProps } = optionProps as HTMLAttributes<HTMLLIElement> & {
                      key: Key;
                    };

                    return (
                      <Box component="li" key={key} {...liProps}>
                        <Stack spacing={0.2}>
                          <Typography variant="body2" fontWeight={600}>
                            {item.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.code || "Sem código"} • {formatCurrency(item.defaultPrice)}
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Adicionar serviço do cadastro"
                      placeholder="Selecione um serviço cadastrado"
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddOutlinedIcon />}
                  disabled={!selectedLaborCatalogItem}
                  onClick={() =>
                    addServiceFromCatalog(
                      selectedLaborCatalogItem,
                      setLaborServices,
                      () => setSelectedLaborCatalogItem(null),
                    )
                  }
                >
                  Inserir serviço
                </Button>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => navigate("/ordem-servico/mao-de-obra")}
                >
                  Gerenciar
                </Button>
              </Grid>
            </Grid>

            <TableContainer
              sx={{
                maxHeight: 360,
                ...SCROLLABLE_TABLE_CONTAINER_SX,
              }}
            >
              <Table
                size="small"
                stickyHeader
                sx={{
                  width: "100%",
                  tableLayout: "fixed",
                  "& .MuiTableCell-root": {
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  },
                  "& .MuiTableCell-stickyHeader": {
                    backgroundColor: "background.paper",
                    backgroundImage: "none",
                    zIndex: 2,
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "46%" }}>Descrição</TableCell>
                    <TableCell sx={{ width: "22%" }}>Valor</TableCell>
                    <TableCell sx={{ width: "24%" }}>Aprovação do Cliente</TableCell>
                    <TableCell sx={{ width: "8%" }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {laborServices.length ? laborServices.map((service) => {
                    const isDeclined = service.status === "declined";

                    return (
                      <TableRow
                        key={service.id}
                        sx={
                          isDeclined
                            ? { backgroundColor: "rgba(251,146,60,0.08)" }
                            : undefined
                        }
                      >
                        <TableCell>
                          <Stack spacing={0.5}>
                            <TextField
                              fullWidth
                              size="small"
                              value={service.description}
                              onChange={(event) =>
                                updateService(
                                  setLaborServices,
                                  service.id,
                                  "description",
                                  event.target.value,
                                )
                              }
                              sx={
                                isDeclined
                                  ? {
                                      "& .MuiInputBase-input": {
                                        textDecoration: "line-through",
                                      },
                                    }
                                  : undefined
                              }
                            />
                            {service.catalogItemId ? (
                              <Typography variant="caption" color="text.secondary">
                                Vinculada ao cadastro
                              </Typography>
                            ) : null}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={service.amount}
                            onChange={(event) =>
                              updateService(
                                setLaborServices,
                                service.id,
                                "amount",
                                event.target.value,
                              )
                            }
                            sx={
                              isDeclined
                                ? {
                                    "& .MuiInputBase-input": {
                                      textDecoration: "line-through",
                                    },
                                  }
                                : undefined
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            sx={{ m: 0 }}
                            control={
                              <Checkbox
                                size="small"
                                checked={isDeclined}
                                onChange={(_, checked) =>
                                  setServiceStatus(
                                    setLaborServices,
                                    service.id,
                                    checked ? "declined" : "approved",
                                  )
                                }
                              />
                            }
                            label={isMobile ? "Recusou" : "Cliente recusou"}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => removeService(setLaborServices, service.id)}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="body2" color="text.secondary">
                          Nenhum serviço adicionado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<AddOutlinedIcon />} onClick={() => addService(setLaborServices)}>
            Adicionar
          </Button>
          <Box sx={{ flex: 1 }} />
          <Typography fontWeight={700}>
            Subtotal: {formatCurrency(laborSubtotal)}
          </Typography>
          <Button onClick={closeEditorSection}>Concluir</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={activeEditorSection === "third-party"}
        onClose={closeEditorSection}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Serviços de Terceiros</DialogTitle>
        <DialogContent dividers>
          <TableContainer
            sx={{
              maxHeight: 420,
              ...SCROLLABLE_TABLE_CONTAINER_SX,
            }}
          >
            <Table
              size="small"
              stickyHeader
              sx={{
                width: "100%",
                tableLayout: "fixed",
                "& .MuiTableCell-root": {
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                },
                "& .MuiTableCell-stickyHeader": {
                  backgroundColor: "background.paper",
                  backgroundImage: "none",
                  zIndex: 2,
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "32%" }}>Descrição</TableCell>
                  <TableCell sx={{ width: "16%" }}>Custo</TableCell>
                  <TableCell sx={{ width: "16%" }}>Lucro</TableCell>
                  <TableCell sx={{ width: "16%" }}>Valor</TableCell>
                  <TableCell sx={{ width: "12%" }}>Aprovação</TableCell>
                  <TableCell sx={{ width: "8%" }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {thirdPartyServices.length ? thirdPartyServices.map((service) => {
                  const isDeclined = service.status === "declined";

                  return (
                    <TableRow
                      key={service.id}
                      sx={
                        isDeclined
                          ? { backgroundColor: "rgba(251,146,60,0.08)" }
                          : undefined
                      }
                    >
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={service.description}
                          onChange={(event) =>
                            updateService(
                              setThirdPartyServices,
                              service.id,
                              "description",
                              event.target.value,
                            )
                          }
                          sx={
                            isDeclined
                              ? {
                                  "& .MuiInputBase-input": {
                                    textDecoration: "line-through",
                                  },
                                }
                              : undefined
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={service.costPrice ?? 0}
                          onChange={(event) =>
                            updateService(
                              setThirdPartyServices,
                              service.id,
                              "costPrice",
                              event.target.value,
                            )
                          }
                          sx={
                            isDeclined
                              ? {
                                  "& .MuiInputBase-input": {
                                    textDecoration: "line-through",
                                  },
                                }
                              : undefined
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={
                            service.profitAmount ??
                            Math.max(0, service.amount - (service.costPrice ?? 0))
                          }
                          onChange={(event) =>
                            updateService(
                              setThirdPartyServices,
                              service.id,
                              "profitAmount",
                              event.target.value,
                            )
                          }
                          sx={
                            isDeclined
                              ? {
                                  "& .MuiInputBase-input": {
                                    textDecoration: "line-through",
                                  },
                                }
                              : undefined
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={service.amount}
                          onChange={(event) =>
                            updateService(
                              setThirdPartyServices,
                              service.id,
                              "amount",
                              event.target.value,
                            )
                          }
                          sx={
                            isDeclined
                              ? {
                                  "& .MuiInputBase-input": {
                                    textDecoration: "line-through",
                                  },
                                }
                              : undefined
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          sx={{ m: 0 }}
                          control={
                            <Checkbox
                              size="small"
                              checked={isDeclined}
                              onChange={(_, checked) =>
                                setServiceStatus(
                                  setThirdPartyServices,
                                  service.id,
                                  checked ? "declined" : "approved",
                                )
                              }
                            />
                          }
                          label={isMobile ? "Recusou" : "Cliente recusou"}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() =>
                            removeService(setThirdPartyServices, service.id)
                          }
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2" color="text.secondary">
                        Nenhum serviço de terceiros adicionado.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<AddOutlinedIcon />} onClick={() => addService(setThirdPartyServices)}>
            Adicionar
          </Button>
          <Box sx={{ flex: 1 }} />
          <Typography fontWeight={700}>
            Custo: {formatCurrency(thirdPartyCostTotal)} • Lucro:{" "}
            {formatCurrency(thirdPartyProfitTotal)} • Subtotal:{" "}
            {formatCurrency(thirdPartySubtotal)}
          </Typography>
          <Button onClick={closeEditorSection}>Concluir</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={activeEditorSection === "evidence"}
        onClose={closeEditorSection}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Provas (Fotos e Vídeos)</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileOutlinedIcon />}
                disabled={isUploadingEvidence}
              >
                {isUploadingEvidence
                  ? t("serviceOrder.uploading", "Enviando...")
                  : t("serviceOrder.uploadEvidence", "Anexar Provas")}
                <input
                  hidden
                  multiple
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleEvidenceUpload}
                />
              </Button>
              <Typography variant="body2" color="text.secondary">
                {evidenceFiles.length} arquivo(s) anexado(s)
              </Typography>
            </Stack>

            {evidenceFiles.length ? (
              <Grid container columns={12} spacing={2}>
                {evidenceFiles.map((file) => (
                  <Grid key={file.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        height: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          borderRadius: 1,
                          overflow: "hidden",
                          backgroundColor: "rgba(255,255,255,0.04)",
                          aspectRatio: "16 / 9",
                        }}
                      >
                        {file.type.startsWith("video/") ? (
                          <Box
                            component="video"
                            src={file.url}
                            controls
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <Box
                            component="img"
                            src={file.url}
                            alt={file.name}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </Box>

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mt: 1 }}
                        spacing={1}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" noWrap title={file.name}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(file.size)}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => removeEvidence(file.id)}>
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nenhuma prova anexada.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditorSection}>Concluir</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isReviewOpen}
        onClose={closeReview}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>{t("serviceOrder.review", "Revisar Ordem de Serviço")}</DialogTitle>
        <DialogContent dividers>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2.5,
              backgroundColor: "#fff",
              color: "#0b0b0f",
              borderColor: alpha(theme.palette.primary.main, 0.28),
              "& .MuiPaper-root": {
                backgroundColor: "#fff",
                backgroundImage: "none",
              },
              "& .MuiTypography-root": {
                color: "#0b0b0f",
              },
              "& .MuiTypography-colorTextSecondary": {
                color: alpha("#0b0b0f", 0.62),
              },
              "& .MuiDivider-root": {
                borderColor: alpha(theme.palette.primary.main, 0.22),
              },
              "& .MuiChip-root": {
                color: "#0b0b0f",
                borderColor: alpha(theme.palette.primary.main, 0.26),
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <Stack spacing={2.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 68,
                      height: 68,
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: alpha(theme.palette.primary.main, 0.24),
                      overflow: "hidden",
                      backgroundColor: alpha(theme.palette.primary.main, 0.06),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      component="img"
                      src={reviewLogoSrc}
                      alt="Logo Prevent Auto Mecânica"
                      sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1 }}
                    />
                  </Box>
                  <Box>
                    <Typography fontWeight={700}>ORDEM DE SERVIÇO</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Nº OS: {orderInfo.orderNumber || "-"}
                    </Typography>
                  </Box>
                </Stack>
                <Chip label={`Data: ${formatDateForPrint(orderInfo.date)}`} />
              </Stack>

              <Grid container columns={12} spacing={1.5}>
                <Grid size={12}>
                  <Typography variant="body2">
                    <b>Cliente:</b> {orderInfo.customerName || "-"}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2">
                    <b>Telefone:</b> {orderInfo.phone || "-"}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2">
                    <b>KM:</b> {orderInfo.km || "-"}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2">
                    <b>Veículo:</b> {orderInfo.vehicle || "-"}
                  </Typography>
                </Grid>
                <Grid size={3}>
                  <Typography variant="body2">
                    <b>Ano:</b> {orderInfo.year || "-"}
                  </Typography>
                </Grid>
                <Grid size={3}>
                  <Typography variant="body2">
                    <b>Placa:</b> {orderInfo.plate || "-"}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2">
                    <b>Mecânico:</b> {orderInfo.mechanicResponsible || "-"}
                  </Typography>
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography fontWeight={700} gutterBottom>
                  CHECKLIST DE INSPEÇÃO
                </Typography>
                <Grid container columns={12} spacing={0.8}>
                  {checklistEntries.map((option) => (
                    <Grid key={option.key} size={6}>
                      <Typography variant="body2">
                        {option.checked ? "☑" : "☐"} {option.label}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Typography fontWeight={700} gutterBottom>
                  PEÇAS
                </Typography>
                <Stack spacing={0.8}>
                  {parts.map((part) => {
                    const isDeclined = part.status === "declined";
                    return (
                      <Stack
                        key={part.id}
                        direction="row"
                        justifyContent="space-between"
                        gap={1}
                      >
                        <Stack direction="row" spacing={0.8} sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={
                              isDeclined
                                ? {
                                    textDecoration: "line-through",
                                    color: "text.secondary",
                                  }
                                : undefined
                            }
                          >
                            {part.description || "Peça sem descrição"}
                          </Typography>
                          {isDeclined ? (
                            <Chip size="small" label="Recusada" color="warning" />
                          ) : null}
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={
                            isDeclined
                              ? {
                                  textDecoration: "line-through",
                                  color: "text.secondary",
                                }
                              : undefined
                          }
                        >
                          {part.quantity} x {formatCurrency(part.unitPrice)}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={
                            isDeclined
                              ? {
                                  textDecoration: "line-through",
                                  color: "text.secondary",
                                }
                              : undefined
                          }
                        >
                          {formatCurrency(part.quantity * part.unitPrice)}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>

              <Divider />

              <Grid container columns={12} spacing={2}>
                <Grid size={6}>
                  <Typography fontWeight={700} gutterBottom>
                    SERVIÇOS
                  </Typography>
                  <Stack spacing={0.6}>
                    {laborServices.map((service) => {
                      const isDeclined = service.status === "declined";
                      return (
                        <Stack key={service.id} direction="row" justifyContent="space-between">
                          <Stack direction="row" spacing={0.8}>
                            <Typography
                              variant="body2"
                              sx={
                                isDeclined
                                  ? {
                                      textDecoration: "line-through",
                                      color: "text.secondary",
                                    }
                                  : undefined
                              }
                            >
                              {service.description || "Serviço"}
                            </Typography>
                            {isDeclined ? (
                              <Chip size="small" label="Recusado" color="warning" />
                            ) : null}
                          </Stack>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={
                              isDeclined
                                ? {
                                    textDecoration: "line-through",
                                    color: "text.secondary",
                                  }
                                : undefined
                            }
                          >
                            {formatCurrency(service.amount)}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Grid>

                <Grid size={6}>
                  <Typography fontWeight={700} gutterBottom>
                    SERVIÇOS DE TERCEIROS
                  </Typography>
                  <Stack spacing={0.6}>
                    {thirdPartyServices.map((service) => {
                      const isDeclined = service.status === "declined";
                      return (
                        <Stack key={service.id} direction="row" justifyContent="space-between">
                          <Stack direction="row" spacing={0.8}>
                            <Typography
                              variant="body2"
                              sx={
                                isDeclined
                                  ? {
                                      textDecoration: "line-through",
                                      color: "text.secondary",
                                    }
                                  : undefined
                              }
                            >
                              {service.description || "Serviço"}
                            </Typography>
                            {isDeclined ? (
                              <Chip size="small" label="Recusado" color="warning" />
                            ) : null}
                          </Stack>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={
                              isDeclined
                                ? {
                                    textDecoration: "line-through",
                                    color: "text.secondary",
                                  }
                                : undefined
                            }
                          >
                            {formatCurrency(service.amount)}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Grid>
              </Grid>

              <Divider />

              <Stack spacing={0.8}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Subtotal Peças</Typography>
                  <Typography variant="body2">{formatCurrency(partsSubtotal)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Subtotal Serviços</Typography>
                  <Typography variant="body2">{formatCurrency(laborSubtotal)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Subtotal Terceiros</Typography>
                  <Typography variant="body2">
                    {formatCurrency(thirdPartySubtotal)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Desconto</Typography>
                  <Typography variant="body2">- {formatCurrency(discount)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight={700}>TOTAL GERAL</Typography>
                  <Typography fontWeight={700}>{formatCurrency(grandTotal)}</Typography>
                </Stack>
                <Typography variant="body2">
                  <b>Forma de Pgto:</b> {orderInfo.paymentMethod || "-"}
                </Typography>
              </Stack>

              <Divider />

              <Box>
                <Typography fontWeight={700}>OBSERVAÇÕES</Typography>
                <Typography variant="body2" sx={{ minHeight: 40, whiteSpace: "pre-wrap" }}>
                  {orderInfo.notes || "Sem observações"}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography fontWeight={700} gutterBottom>
                  PROVAS ANEXADAS
                </Typography>
                {evidenceFiles.length ? (
                  <Grid container columns={12} spacing={1}>
                    {evidenceFiles.map((file) => (
                      <Grid key={file.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            backgroundColor: "#fff",
                            borderColor: alpha(theme.palette.primary.main, 0.18),
                          }}
                        >
                          <Typography variant="body2" noWrap title={file.name}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(file.size)}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma prova anexada.
                  </Typography>
                )}
              </Box>

              {generatedSignatureLink ? (
                <>
                  <Divider />
                  <Stack spacing={1}>
                    <Typography fontWeight={700}>LINK DE ASSINATURA</Typography>
                    <TextField
                      size="small"
                      value={generatedSignatureLink}
                      slotProps={{
                        input: {
                          readOnly: true,
                        },
                      }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ContentCopyOutlinedIcon />}
                        onClick={handleCopySignatureLink}
                      >
                        Copiar Link
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<LinkOutlinedIcon />}
                        onClick={() => {
                          window.open(generatedSignatureLink, "_blank", "noopener,noreferrer");
                        }}
                      >
                        Abrir Link
                      </Button>
                    </Stack>
                  </Stack>
                </>
              ) : null}
            </Stack>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReview}>{t("buttons.cancel", "Cancelar")}</Button>
          <Button
            variant="outlined"
            startIcon={<LinkOutlinedIcon />}
            onClick={() => {
              void handleGenerateSignatureLink();
            }}
            disabled={isGeneratingSignatureLink}
          >
            {isGeneratingSignatureLink
              ? "Gerando link..."
              : "Gerar Link para Assinatura"}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              void handleConfirmServiceOrder();
            }}
            disabled={isSavingServiceOrder}
          >
            {isEditingServiceOrder
              ? "Confirmar edição"
              : t("serviceOrder.confirm", "Confirmar Cadastro")}
          </Button>
        </DialogActions>
      </Dialog>
    </RefineListView>
  );
};
