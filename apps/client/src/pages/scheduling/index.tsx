import { Fragment, useEffect, useMemo, useState, type HTMLAttributes, type Key } from "react";
import { useNotification, useTranslate } from "@refinedev/core";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { useNavigate } from "react-router";
import { Card, RefineListView } from "../../components";
import {
  SCHEDULING_STORAGE_KEY,
  SCHEDULING_UPDATED_EVENT,
  cancelSchedulingAppointmentApi,
  clearSchedulingAppointmentsApi,
  createSchedulingAppointmentApi,
  isSchedulingBackendEnabled,
  listSchedulingAppointmentsApi,
  patchSchedulingAppointmentApi,
  type SchedulingAppointment,
  type SchedulingAppointmentStatus,
} from "../../services/scheduling";
import {
  CUSTOMERS_STORAGE_KEY,
  CUSTOMERS_UPDATED_EVENT,
  isCustomersBackendEnabled,
  listCustomersApi,
  type Customer,
} from "../../services/customers";
import {
  SERVICE_ORDER_CATALOG_STORAGE_KEY,
  SERVICE_ORDER_CATALOG_UPDATED_EVENT,
  listLaborCatalogItemsApi,
  type ServiceOrderCatalogItem,
} from "../../services/serviceOrderCatalog";
import {
  MECHANICS_STORAGE_KEY,
  MECHANICS_UPDATED_EVENT,
  listMechanics,
  type Mechanic,
} from "../../services/mechanics";
import type { SchedulingFormState } from "../../interfaces";

const DURATION_OPTIONS = [30, 45, 60, 90, 120];
const SERVICE_TYPE_OPTIONS = [
  "Revisão preventiva",
  "Troca de óleo e filtros",
  "Freios",
  "Suspensão",
  "Alinhamento e balanceamento",
  "Diagnóstico eletrônico",
];
const WEEKLY_SCHEDULE_START_HOUR = 8;
const WEEKLY_SCHEDULE_END_HOUR = 18;
const WEEKLY_SCHEDULE_SLOT_MINUTES = 30;

const STATUS_META: Record<
  SchedulingAppointmentStatus,
  {
    label: string;
    color: "default" | "warning" | "success" | "error";
  }
> = {
  pending: {
    label: "Pendente",
    color: "warning",
  },
  confirmed: {
    label: "Confirmado",
    color: "success",
  },
  failed: {
    label: "Falhou",
    color: "error",
  },
  canceled: {
    label: "Cancelado",
    color: "default",
  },
};

const padTime = (value: number) => String(value).padStart(2, "0");

const formatDateInput = (value: Date) =>
  `${value.getFullYear()}-${padTime(value.getMonth() + 1)}-${padTime(value.getDate())}`;

const formatTimeInput = (value: Date) =>
  `${padTime(value.getHours())}:${padTime(value.getMinutes())}`;

const getDefaultDateTime = () => {
  const nextHour = new Date();
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);

  return {
    date: formatDateInput(nextHour),
    time: formatTimeInput(nextHour),
  };
};

const getDefaultFormState = (): SchedulingFormState => {
  const nextDateTime = getDefaultDateTime();

  return {
    customerId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    vehicleModel: "",
    vehiclePlate: "",
    laborCatalogItemId: "",
    serviceType: SERVICE_TYPE_OPTIONS[0],
    mechanicResponsible: "",
    date: nextDateTime.date,
    time: nextDateTime.time,
    durationMinutes: 60,
    notes: "",
  };
};

const formatDateTime = (value: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Erro inesperado";
};

const toIsoString = (date: string, time: string): string | null => {
  if (!date || !time) {
    return null;
  }

  const iso = new Date(`${date}T${time}:00`);
  if (Number.isNaN(iso.getTime())) {
    return null;
  }

  return iso.toISOString();
};

const getDateTimeFieldsFromIso = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return getDefaultDateTime();
  }

  return {
    date: formatDateInput(parsed),
    time: formatTimeInput(parsed),
  };
};

const calculateEndAt = (startAt: string, durationMinutes: number) => {
  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return end.toISOString();
};

const getDatePickerValue = (value: string): Dayjs | null => {
  if (!value) {
    return null;
  }

  const parsed = dayjs(`${value}T00:00:00`);
  return parsed.isValid() ? parsed : null;
};

const getTimePickerValue = (value: string): Dayjs | null => {
  if (!value) {
    return null;
  }

  const parsed = dayjs(`2000-01-01T${value}:00`);
  return parsed.isValid() ? parsed : null;
};

const getStartOfWeek = (value: Date) => {
  const date = new Date(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (value: Date, days: number) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

const formatWeekdayLabel = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const buildSlotDate = (day: Date, hour: number, minutes: number) => {
  const slot = new Date(day);
  slot.setHours(hour, minutes, 0, 0);
  return slot;
};

const rangesOverlap = (
  startA: number,
  endA: number,
  startB: number,
  endB: number,
) => startA < endB && endA > startB;

export const SchedulingPage: React.FC = () => {
  const t = useTranslate();
  const { open } = useNotification();
  const navigate = useNavigate();
  const customersBackendEnabled = isCustomersBackendEnabled();
  const schedulingBackendEnabled = isSchedulingBackendEnabled();

  const [formState, setFormState] = useState<SchedulingFormState>(() =>
    getDefaultFormState(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [registeredCustomers, setRegisteredCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<SchedulingAppointment[]>([]);
  const [registeredLaborItems, setRegisteredLaborItems] = useState<
    ServiceOrderCatalogItem[]
  >([]);
  const [registeredMechanics, setRegisteredMechanics] = useState<Mechanic[]>([]);
  const [mechanicFilter, setMechanicFilter] = useState("");
  const [weekStartDate, setWeekStartDate] = useState(() =>
    getStartOfWeek(new Date()),
  );
  const [isAppointmentDrawerOpen, setIsAppointmentDrawerOpen] = useState(false);

  const isEditingAppointment = Boolean(editingAppointmentId);

  const loadCustomers = async (showError = false) => {
    try {
      const response = await listCustomersApi();
      setRegisteredCustomers(response);
    } catch (error) {
      if (showError) {
        open?.({
          type: "error",
          message: "Falha ao carregar clientes",
          description: getErrorMessage(error),
        });
      }
    }
  };

  const loadAppointments = async (showError = false) => {
    try {
      const response = await listSchedulingAppointmentsApi();
      setAppointments(response);
    } catch (error) {
      if (showError) {
        open?.({
          type: "error",
          message: "Falha ao carregar agendamentos",
          description: getErrorMessage(error),
        });
      }
    }
  };

  const loadLaborItems = async (showError = false) => {
    try {
      const response = await listLaborCatalogItemsApi();
      setRegisteredLaborItems(response);
    } catch (error) {
      if (showError) {
        open?.({
          type: "error",
          message: "Falha ao carregar serviços",
          description: getErrorMessage(error),
        });
      }
    }
  };

  const loadMechanics = async (showError = false) => {
    try {
      const response = await listMechanics({
        page: 0,
        size: 100,
        sort: "name,asc",
        status: "active",
      });
      setRegisteredMechanics(response.filter((item) => item.status === "active"));
    } catch (error) {
      if (showError) {
        open?.({
          type: "error",
          message: "Falha ao carregar mecânicos",
          description: getErrorMessage(error),
        });
      }
    }
  };

  useEffect(() => {
    void loadCustomers(true);
    void loadAppointments(true);
    void loadLaborItems(true);
    void loadMechanics(true);
  }, []);

  useEffect(() => {
    if (schedulingBackendEnabled) {
      return;
    }

    const refresh = () => {
      void loadAppointments();
    };

    const handleSchedulingUpdate: EventListener = () => {
      refresh();
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (!event.key || event.key === SCHEDULING_STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener(SCHEDULING_UPDATED_EVENT, handleSchedulingUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(
        SCHEDULING_UPDATED_EVENT,
        handleSchedulingUpdate,
      );
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [schedulingBackendEnabled]);

  useEffect(() => {
    if (customersBackendEnabled) {
      return;
    }

    const refreshCustomers = () => {
      void loadCustomers();
    };

    const handleCustomersUpdated: EventListener = () => {
      refreshCustomers();
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (!event.key || event.key === CUSTOMERS_STORAGE_KEY) {
        refreshCustomers();
      }
    };

    window.addEventListener(CUSTOMERS_UPDATED_EVENT, handleCustomersUpdated);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(CUSTOMERS_UPDATED_EVENT, handleCustomersUpdated);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [customersBackendEnabled]);

  useEffect(() => {
    const refreshCatalog = () => {
      void loadLaborItems();
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
    const refreshMechanics = () => {
      void loadMechanics();
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

  const selectedCustomer = useMemo(
    () =>
      activeCustomers.find((customer) => customer.id === formState.customerId) ??
      null,
    [activeCustomers, formState.customerId],
  );

  const activeLaborItems = useMemo(
    () => registeredLaborItems.filter((item) => item.status === "active"),
    [registeredLaborItems],
  );
  const activeMechanics = useMemo(
    () => registeredMechanics.filter((mechanic) => mechanic.status === "active"),
    [registeredMechanics],
  );

  const selectedMechanic = useMemo(() => {
    const normalized = formState.mechanicResponsible.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    return (
      activeMechanics.find(
        (mechanic) => mechanic.name.trim().toLowerCase() === normalized,
      ) ?? null
    );
  }, [activeMechanics, formState.mechanicResponsible]);

  const serviceOptions = useMemo(() => {
    if (activeLaborItems.length) {
      return activeLaborItems;
    }

    return SERVICE_TYPE_OPTIONS.map((description, index) => ({
      id: `fallback-${index}`,
      type: "labor" as const,
      code: "",
      description,
      defaultPrice: 0,
      costPrice: 0,
      profitMarginPercent: 0,
      stockQuantity: 0,
      estimatedDurationMinutes: 60,
      status: "active" as const,
      createdAt: "",
      updatedAt: "",
    }));
  }, [activeLaborItems]);

  const selectedLaborItem = useMemo(() => {
    if (formState.laborCatalogItemId) {
      return (
        serviceOptions.find((item) => item.id === formState.laborCatalogItemId) ?? null
      );
    }

    return (
      serviceOptions.find((item) => item.description === formState.serviceType) ?? null
    );
  }, [formState.laborCatalogItemId, formState.serviceType, serviceOptions]);

  const selectedDurationMinutes =
    selectedLaborItem?.estimatedDurationMinutes ?? formState.durationMinutes;

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStartDate, index)),
    [weekStartDate],
  );

  const slotLabels = useMemo(() => {
    const labels: string[] = [];

    for (
      let minutes = WEEKLY_SCHEDULE_START_HOUR * 60;
      minutes < WEEKLY_SCHEDULE_END_HOUR * 60;
      minutes += WEEKLY_SCHEDULE_SLOT_MINUTES
    ) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      labels.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }

    return labels;
  }, []);

  const appointmentConflicts = useMemo(() => {
    const normalizedMechanic = formState.mechanicResponsible.trim().toLowerCase();

    return appointments.filter((appointment) => {
      if (editingAppointmentId && appointment.id === editingAppointmentId) {
        return false;
      }

      if (!normalizedMechanic) {
        return true;
      }

      return (
        appointment.mechanicResponsible.trim().toLowerCase() === normalizedMechanic
      );
    });
  }, [appointments, editingAppointmentId, formState.mechanicResponsible]);

  const mechanicOptions = useMemo(() => {
    const fromRegistry = registeredMechanics
      .map((item) => item.name.trim())
      .filter(Boolean);
    const fromAppointments = appointments
      .map((appointment) => appointment.mechanicResponsible.trim())
      .filter(Boolean);

    return Array.from(new Set([...fromRegistry, ...fromAppointments])).sort(
      (left, right) => left.localeCompare(right, "pt-BR"),
    );
  }, [appointments, registeredMechanics]);

  const filteredAppointments = useMemo(() => {
    const normalizedFilter = mechanicFilter.trim().toLowerCase();
    if (!normalizedFilter) {
      return appointments;
    }

    return appointments.filter((appointment) =>
      appointment.mechanicResponsible.trim().toLowerCase().includes(normalizedFilter),
    );
  }, [appointments, mechanicFilter]);

  const summary = useMemo(() => {
    return appointments.reduce(
      (acc, appointment) => {
        acc.total += 1;
        acc[appointment.status] += 1;
        return acc;
      },
      {
        total: 0,
        pending: 0,
        confirmed: 0,
        failed: 0,
        canceled: 0,
      },
    );
  }, [appointments]);

  const validateForm = (): string | null => {
    if (!formState.customerName.trim()) {
      return "Informe o nome do cliente";
    }

    if (!formState.customerPhone.trim()) {
      return "Informe o telefone do cliente";
    }

    if (!formState.vehicleModel.trim()) {
      return "Informe o veículo";
    }

    if (!formState.serviceType.trim()) {
      return "Informe o tipo de serviço";
    }

    if (!formState.mechanicResponsible.trim()) {
      return "Selecione o mecânico responsável";
    }

    if (formState.customerEmail.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formState.customerEmail.trim())) {
        return "Informe um e-mail válido";
      }
    }

    const startAt = toIsoString(formState.date, formState.time);
    if (!startAt) {
      return "Data e horário inválidos";
    }

    if (new Date(startAt).getTime() <= Date.now()) {
      return "Escolha um horário futuro para o agendamento";
    }

    const endAt = new Date(
      new Date(startAt).getTime() + selectedDurationMinutes * 60_000,
    ).getTime();

    const conflicts = appointmentConflicts.some((appointment) =>
      rangesOverlap(
        new Date(startAt).getTime(),
        endAt,
        new Date(appointment.schedule.startAt).getTime(),
        new Date(appointment.schedule.endAt).getTime(),
      ),
    );

    if (conflicts) {
      return "Este horário está bloqueado para a duração do serviço selecionado";
    }

    return null;
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    setFormState((current) => ({
      ...current,
      customerId: customer?.id ?? "",
      customerName: customer?.name ?? current.customerName,
      customerPhone: customer?.phone ?? current.customerPhone,
      customerEmail: customer?.email ?? current.customerEmail,
      vehicleModel: customer?.vehicleModel ?? current.vehicleModel,
      vehiclePlate: customer?.vehiclePlate ?? current.vehiclePlate,
    }));
  };

  const resetAppointmentForm = () => {
    setEditingAppointmentId(null);
    setFormState(getDefaultFormState());
  };

  const handleOpenNewAppointment = () => {
    resetAppointmentForm();
    setIsAppointmentDrawerOpen(true);
  };

  const handleCloseAppointmentDrawer = () => {
    setIsAppointmentDrawerOpen(false);
    resetAppointmentForm();
  };

  const handleEditAppointment = (appointment: SchedulingAppointment) => {
    const startDateTime = getDateTimeFieldsFromIso(appointment.schedule.startAt);

    setEditingAppointmentId(appointment.id);
    setFormState({
      customerId: appointment.customer.id ?? "",
      customerName: appointment.customer.name,
      customerPhone: appointment.customer.phone,
      customerEmail: appointment.customer.email,
      vehicleModel: appointment.vehicle.model,
      vehiclePlate: appointment.vehicle.plate,
      laborCatalogItemId:
        activeLaborItems.find(
          (item) => item.description === appointment.schedule.serviceType,
        )?.id ?? "",
      serviceType: appointment.schedule.serviceType,
      mechanicResponsible: appointment.mechanicResponsible,
      date: startDateTime.date,
      time: startDateTime.time,
      durationMinutes: appointment.schedule.durationMinutes,
      notes: appointment.schedule.notes,
    });
    setIsAppointmentDrawerOpen(true);
  };

  const handleCreateAppointment = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      open?.({
        type: "error",
        message: validationError,
      });
      return;
    }

    const startAt = toIsoString(formState.date, formState.time);
    if (!startAt) {
      open?.({
        type: "error",
        message: "Não foi possível calcular data e horário",
      });
      return;
    }

    if (editingAppointmentId) {
      try {
        setIsSubmitting(true);

        const updated = await patchSchedulingAppointmentApi(editingAppointmentId, {
          customer: {
            id: formState.customerId || null,
            name: formState.customerName,
            phone: formState.customerPhone,
            email: formState.customerEmail,
          },
          vehicle: {
            model: formState.vehicleModel,
            plate: formState.vehiclePlate,
          },
          mechanicResponsible: formState.mechanicResponsible,
          schedule: {
            serviceType: formState.serviceType,
            notes: formState.notes,
            startAt,
            durationMinutes: selectedDurationMinutes,
            endAt: calculateEndAt(startAt, selectedDurationMinutes),
          },
        });

        if (!updated) {
          throw new Error("Não foi possível atualizar este agendamento.");
        }

        await loadAppointments();
        open?.({
          type: "success",
          message: "Agendamento atualizado com sucesso",
        });
        handleCloseAppointmentDrawer();
      } catch (error) {
        open?.({
          type: "error",
          message: "Falha ao atualizar agendamento",
          description: getErrorMessage(error),
        });
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    try {
      await createSchedulingAppointmentApi({
        customerId: formState.customerId || undefined,
        customerName: formState.customerName,
        customerPhone: formState.customerPhone,
        customerEmail: formState.customerEmail,
        vehicleModel: formState.vehicleModel,
        vehiclePlate: formState.vehiclePlate,
        serviceType: formState.serviceType,
        mechanicResponsible: formState.mechanicResponsible,
        notes: formState.notes,
        startAt,
        durationMinutes: selectedDurationMinutes,
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao salvar agendamento",
        description: getErrorMessage(error),
      });
      return;
    }

    await loadAppointments();
    open?.({
      type: "success",
      message: "Agendamento salvo com sucesso",
    });
    handleCloseAppointmentDrawer();
  };

  const handleCreateServiceOrder = (appointment: SchedulingAppointment) => {
    const params = new URLSearchParams();
    params.set("appointmentId", appointment.id);
    if (appointment.customer.id) {
      params.set("customerId", appointment.customer.id);
    }
    navigate(`/ordem-servico?${params.toString()}`);
  };

  const handleSelectLaborItem = (item: ServiceOrderCatalogItem | null) => {
    setFormState((current) => ({
      ...current,
      laborCatalogItemId: item?.id ?? "",
      serviceType: item?.description ?? "",
      durationMinutes: item?.estimatedDurationMinutes ?? current.durationMinutes,
    }));
  };

  const handleSelectWeeklySlot = (slotDate: Date) => {
    setFormState((current) => ({
      ...current,
      date: formatDateInput(slotDate),
      time: formatTimeInput(slotDate),
      durationMinutes: selectedDurationMinutes,
    }));
  };

  const handleCancelAppointment = async (appointment: SchedulingAppointment) => {
    const confirmed = window.confirm(
      `Deseja excluir o agendamento de ${appointment.customer.name || "cliente"}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await cancelSchedulingAppointmentApi(appointment.id);
      await loadAppointments();
      open?.({
        type: "success",
        message: "Agendamento excluído com sucesso",
      });

      if (editingAppointmentId === appointment.id) {
        handleCloseAppointmentDrawer();
      }
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao excluir agendamento",
        description: getErrorMessage(error),
      });
    }
  };

  const handleClearHistory = async () => {
    if (!appointments.length) {
      return;
    }

    const confirmed = window.confirm(
      "Deseja limpar todo o histórico de agendamentos? Essa ação remove todos os registros da tabela.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsClearingHistory(true);
      await clearSchedulingAppointmentsApi();
      await loadAppointments();
      handleCloseAppointmentDrawer();

      open?.({
        type: "success",
        message: "Histórico de agendamentos limpo com sucesso",
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao limpar histórico",
        description: getErrorMessage(error),
      });
    } finally {
      setIsClearingHistory(false);
    }
  };

  return (
    <RefineListView
      canCreate={false}
      title={t("scheduling.title", "Agendamentos")}
      headerButtons={() => (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Button
            size="small"
            variant="contained"
            onClick={handleOpenNewAppointment}
            startIcon={<CalendarMonthOutlinedIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            Novo agendamento
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => void handleClearHistory()}
            disabled={isClearingHistory || !appointments.length}
            startIcon={
              isClearingHistory ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <DeleteOutlineOutlinedIcon fontSize="small" />
              )
            }
            sx={{ textTransform: "none" }}
          >
            {isClearingHistory ? "Limpando..." : "Limpar histórico"}
          </Button>
          <Chip
            size="small"
            icon={<EventAvailableOutlinedIcon />}
            label={`${summary.confirmed} confirmados`}
            variant="outlined"
            color="success"
          />
          <Chip
            size="small"
            icon={<SyncOutlinedIcon />}
            label={`${summary.pending} pendentes`}
            variant="outlined"
            color="warning"
          />
        </Stack>
      )}
    >
      <Grid container columns={12} spacing={3}>
        <Drawer
          anchor="right"
          open={isAppointmentDrawerOpen}
          onClose={handleCloseAppointmentDrawer}
          sx={{
            "& .MuiBackdrop-root": {
              backgroundColor: "rgba(2, 6, 23, 0.62)",
            },
          }}
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: 760, md: 860 },
              p: 2,
              height: "100dvh",
              backgroundColor: "background.paper",
              borderLeft: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            },
          }}
        >
          <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
            <Box sx={{ width: "100%" }}>
              <Card
                title={isEditingAppointment ? "Editar agendamento" : "Novo agendamento"}
                icon={<CalendarMonthOutlinedIcon />}
                sx={{ borderRadius: 3 }}
                cardHeaderProps={{
                  action: (
                    <IconButton
                      size="small"
                      aria-label="Fechar"
                      onClick={handleCloseAppointmentDrawer}
                    >
                      <CloseOutlinedIcon fontSize="small" />
                    </IconButton>
                  ),
                }}
                cardContentProps={{ sx: { p: 2 } }}
              >
                <Stack
                  id="scheduling-appointment-form"
                  spacing={2}
                  component="form"
                  onSubmit={handleCreateAppointment}
                  sx={{ pb: 2 }}
                >
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

                <TextField
                label="Nome do cliente"
                value={formState.customerName}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    customerId:
                      selectedCustomer &&
                      event.target.value.trim() !== selectedCustomer.name
                        ? ""
                        : current.customerId,
                    customerName: event.target.value,
                  }))
                }
                size="small"
                required
              />

                <Grid container columns={12} spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Telefone"
                      value={formState.customerPhone}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          customerId:
                            selectedCustomer &&
                            event.target.value.trim() !== selectedCustomer.phone
                              ? ""
                              : current.customerId,
                          customerPhone: event.target.value,
                        }))
                      }
                      size="small"
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      type="email"
                      label="E-mail"
                      value={formState.customerEmail}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          customerId:
                            selectedCustomer &&
                            event.target.value.trim() !== selectedCustomer.email
                              ? ""
                              : current.customerId,
                          customerEmail: event.target.value,
                        }))
                      }
                      size="small"
                      fullWidth
                    />
                  </Grid>
                </Grid>

              <Grid container columns={12} spacing={1.5}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    label="Veículo"
                    value={formState.vehicleModel}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        customerId:
                          selectedCustomer &&
                          event.target.value.trim() !== selectedCustomer.vehicleModel
                            ? ""
                            : current.customerId,
                        vehicleModel: event.target.value,
                      }))
                    }
                    size="small"
                    required
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Placa"
                    value={formState.vehiclePlate}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        customerId:
                          selectedCustomer &&
                          event.target.value.trim().toUpperCase() !==
                            selectedCustomer.vehiclePlate
                            ? ""
                            : current.customerId,
                        vehiclePlate: event.target.value.toUpperCase(),
                      }))
                    }
                    size="small"
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Autocomplete
                fullWidth
                options={serviceOptions}
                value={selectedLaborItem}
                onChange={(_, item) => handleSelectLaborItem(item)}
                getOptionLabel={(item) => item.description}
                isOptionEqualToValue={(option, value) => option.id === value.id}
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
                          Duração estimada: {item.estimatedDurationMinutes ?? 60} min
                        </Typography>
                      </Stack>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Serviço"
                    placeholder="Selecione o serviço"
                    size="small"
                    fullWidth
                    required
                  />
                )}
              />

              <Stack spacing={0.75} sx={{ mb: 1 }}>
                <Autocomplete
                  fullWidth
                  options={activeMechanics}
                  value={selectedMechanic}
                  onChange={(_, mechanic) =>
                    setFormState((current) => ({
                      ...current,
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
                      label="Mecânico responsável"
                      placeholder="Selecione um mecânico"
                      size="small"
                      fullWidth
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

              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="pt-br"
              >
                <Grid container columns={12} spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DatePicker
                      label="Data"
                      value={getDatePickerValue(formState.date)}
                      onChange={(value) =>
                        setFormState((current) => ({
                          ...current,
                          date: value?.isValid() ? value.format("YYYY-MM-DD") : "",
                        }))
                      }
                      minDate={dayjs().startOf("day")}
                      slotProps={{
                        textField: {
                          size: "small",
                          required: true,
                          fullWidth: true,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TimePicker
                      label="Hora"
                      value={getTimePickerValue(formState.time)}
                      onChange={(value) =>
                        setFormState((current) => ({
                          ...current,
                          time: value?.isValid() ? value.format("HH:mm") : "",
                        }))
                      }
                      ampm={false}
                      minutesStep={15}
                      slotProps={{
                        textField: {
                          size: "small",
                          required: true,
                          fullWidth: true,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      label="Duração"
                      value={String(selectedDurationMinutes)}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          laborCatalogItemId: "",
                          durationMinutes: Number(event.target.value),
                        }))
                      }
                      size="small"
                      fullWidth
                    >
                      {DURATION_OPTIONS.map((minutes) => (
                        <MenuItem key={minutes} value={String(minutes)}>
                          {minutes} min
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </LocalizationProvider>

              <Card
                title="Agenda semanal"
                icon={<CalendarMonthOutlinedIcon />}
                cardContentProps={{ sx: { p: 2 } }}
              >
                <Stack spacing={1.5}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    spacing={1}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Horários livres para {selectedDurationMinutes} min
                      {formState.mechanicResponsible.trim()
                        ? ` com ${formState.mechanicResponsible.trim()}`
                        : ""}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ChevronLeftOutlinedIcon />}
                        onClick={() =>
                          setWeekStartDate((current) => addDays(current, -7))
                        }
                      >
                        Semana anterior
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        endIcon={<ChevronRightOutlinedIcon />}
                        onClick={() =>
                          setWeekStartDate((current) => addDays(current, 7))
                        }
                      >
                        Próxima semana
                      </Button>
                    </Stack>
                  </Stack>

                  <Grid container columns={8} spacing={1}>
                    <Grid size={1}>
                      <Typography variant="caption" color="text.secondary">
                        Hora
                      </Typography>
                    </Grid>
                    {weekDays.map((day) => (
                      <Grid key={day.toISOString()} size={1}>
                        <Typography
                          variant="caption"
                          color={
                            formState.date &&
                            isSameDay(day, new Date(`${formState.date}T00:00:00`))
                              ? "primary"
                              : "text.secondary"
                          }
                          fontWeight={600}
                        >
                          {formatWeekdayLabel(day)}
                        </Typography>
                      </Grid>
                    ))}

                    {slotLabels.map((slotLabel) => {
                      const [hour, minute] = slotLabel.split(":").map(Number);

                      return (
                        <Fragment key={slotLabel}>
                          <Grid size={1}>
                            <Typography variant="caption" color="text.secondary">
                              {slotLabel}
                            </Typography>
                          </Grid>
                          {weekDays.map((day) => {
                            const slotDate = buildSlotDate(day, hour, minute);
                            const slotStart = slotDate.getTime();
                            const slotEnd =
                              slotStart + selectedDurationMinutes * 60_000;
                            const isPast = slotStart <= Date.now();
                            const isBlocked = appointmentConflicts.some((appointment) =>
                              rangesOverlap(
                                slotStart,
                                slotEnd,
                                new Date(appointment.schedule.startAt).getTime(),
                                new Date(appointment.schedule.endAt).getTime(),
                              ),
                            );
                            const isSelected =
                              formState.date === formatDateInput(slotDate) &&
                              formState.time === formatTimeInput(slotDate);

                            return (
                              <Grid key={`${day.toISOString()}-${slotLabel}`} size={1}>
                                <Button
                                  fullWidth
                                  size="small"
                                  variant={isSelected ? "contained" : "outlined"}
                                  color={isBlocked || isPast ? "inherit" : "primary"}
                                  disabled={isBlocked || isPast}
                                  onClick={() => handleSelectWeeklySlot(slotDate)}
                                  sx={{
                                    minWidth: 0,
                                    px: 0.5,
                                    py: 0.75,
                                    textTransform: "none",
                                    opacity: isBlocked || isPast ? 0.5 : 1,
                                  }}
                                >
                                  {isBlocked ? "Bloq." : slotLabel}
                                </Button>
                              </Grid>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </Grid>
                </Stack>
              </Card>

              <TextField
                label="Observações"
                value={formState.notes}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                multiline
                minRows={3}
                size="small"
              />
                </Stack>
              </Card>
            </Box>
          </Box>
          <Box
            sx={{
              flexShrink: 0,
              pt: 1.5,
              pb: 1.5,
              backgroundColor: "background.paper",
              borderTop: "1px solid",
              borderColor: "divider",
              px: 0.5,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={1}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                startIcon={<CloseOutlinedIcon />}
                onClick={handleCloseAppointmentDrawer}
                disabled={isSubmitting}
              >
                {isEditingAppointment ? "Cancelar edição" : "Fechar"}
              </Button>
              <Button
                type="submit"
                form="scheduling-appointment-form"
                variant="contained"
                size="large"
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SaveOutlinedIcon />
                  )
                }
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Salvando..."
                  : isEditingAppointment
                    ? "Atualizar agendamento"
                    : "Salvar agendamento"}
              </Button>
            </Stack>
          </Box>
        </Drawer>

        <Grid size={{ xs: 12, md: 12 }}>
          <Box sx={{ mb: 1.5 }}>
            <Autocomplete
              options={mechanicOptions}
              value={mechanicOptions.includes(mechanicFilter) ? mechanicFilter : null}
              onChange={(_, value) => setMechanicFilter(value ?? "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Filtrar por mecânico"
                  placeholder="Todos"
                />
              )}
            />
          </Box>
          <TableContainer
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: 460,
              backgroundColor: "background.paper",
              boxShadow: "none",
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
            }}
          >
            <Table
              size="small"
              stickyHeader
              sx={{
                minWidth: 1220,
                "& .MuiTableCell-root": {
                  borderColor: "divider",
                },
              }}
            >
              <TableHead
                sx={{
                  "& .MuiTableCell-root": {
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: "text.secondary",
                    backgroundColor: "background.default",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    py: 1.25,
                  },
                }}
              >
                <TableRow>
                  <TableCell>Data/Hora</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Mecânico</TableCell>
                  <TableCell>Serviço</TableCell>
                  <TableCell>OS</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right" sx={{ width: 240 }}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAppointments.length ? (
                  filteredAppointments.map((appointment, index) => {
                    const statusMeta = STATUS_META[appointment.status];
                    return (
                      <TableRow
                        key={appointment.id}
                        hover
                        sx={{
                          backgroundColor: (theme) =>
                            index % 2 === 0
                              ? theme.palette.background.paper
                              : theme.palette.action.hover,
                          transition: "background-color 120ms ease",
                          "&:hover": {
                            backgroundColor: "action.selected",
                          },
                          "& .MuiTableCell-root": {
                            py: 1.25,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            verticalAlign: "top",
                          },
                        }}
                      >
                        <TableCell>
                          <Stack spacing={0.2}>
                            <Typography variant="body2">
                              {formatDateTime(appointment.schedule.startAt)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {appointment.schedule.durationMinutes} min
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.2}>
                            <Typography variant="body2" fontWeight={500}>
                              {appointment.customer.name || "-"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {appointment.vehicle.model || "-"}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {appointment.mechanicResponsible || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {appointment.schedule.serviceType || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {appointment.serviceOrder.id ? (
                            <Chip
                              size="small"
                              color="success"
                              variant="outlined"
                              label={`OS ${appointment.serviceOrder.orderNumber || appointment.serviceOrder.id}`}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Não gerada
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={statusMeta.color}
                            variant="outlined"
                            label={statusMeta.label}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.8}
                            justifyContent="flex-end"
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<NoteAddOutlinedIcon />}
                              onClick={() => handleCreateServiceOrder(appointment)}
                              disabled={Boolean(appointment.serviceOrder.id)}
                              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              {appointment.serviceOrder.id ? "OS vinculada" : "Gerar OS"}
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleEditAppointment(appointment)}
                              disabled={appointment.status === "canceled"}
                              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              Editar
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              color="error"
                              startIcon={<DeleteOutlineOutlinedIcon />}
                              onClick={() => void handleCancelAppointment(appointment)}
                              disabled={appointment.status === "canceled"}
                              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              Excluir
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 5 }}>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        {mechanicFilter
                          ? "Nenhum agendamento encontrado para o mecânico informado."
                          : "Nenhum agendamento cadastrado."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </RefineListView>
  );
};
