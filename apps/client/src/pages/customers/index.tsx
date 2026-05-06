import { useEffect, useMemo, useState } from "react";
import { useNotification, useTranslate } from "@refinedev/core";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import DirectionsCarFilledOutlinedIcon from "@mui/icons-material/DirectionsCarFilledOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import { useNavigate } from "react-router";
import { Card, RefineListView } from "../../components";
import {
  CUSTOMERS_STORAGE_KEY,
  CUSTOMERS_UPDATED_EVENT,
  createCustomerApi,
  formatCep,
  formatCustomerAddress,
  formatCustomerDocument,
  formatCustomerPhone,
  isCustomersBackendEnabled,
  listCustomersApi,
  removeCustomerApi,
  updateCustomerApi,
  type Customer,
  type CustomerStatus,
} from "../../services/customers";
import {
  createVehicleApi,
  listVehiclesApi,
  updateVehicleApi,
  VEHICLES_STORAGE_KEY,
  VEHICLES_UPDATED_EVENT,
  type Vehicle,
} from "../../services/vehicles";
import { lookupViaCep } from "../../services/viaCep";
import type { CustomerFormState } from "../../interfaces";


const DEFAULT_FORM_STATE: CustomerFormState = {
  name: "",
  phone: "",
  email: "",
  document: "",
  birthDate: "",
  vehicleModel: "",
  vehicleBrand: "",
  vehiclePlate: "",
  vehicleChassisNumber: "",
  vehicleMileage: 0,
  vehicleYear: 0,
  vehicleColor: "",
  address: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  notes: "",
  status: "active",
};

type CustomerVehicleFormState = {
  id?: string;
  vehicleModel: string;
  vehicleBrand: string;
  vehiclePlate: string;
  vehicleChassisNumber: string;
  vehicleMileage: number;
  vehicleYear: number;
  vehicleColor: string;
};

const DEFAULT_VEHICLE_FORM_STATE: CustomerVehicleFormState = {
  vehicleModel: "",
  vehicleBrand: "",
  vehiclePlate: "",
  vehicleChassisNumber: "",
  vehicleMileage: 0,
  vehicleYear: 0,
  vehicleColor: "",
};

const MAX_CUSTOMER_VEHICLES = 2;

const STATUS_META: Record<
  CustomerStatus,
  { label: string; color: "success" | "default" }
> = {
  active: {
    label: "Ativo",
    color: "success",
  },
  inactive: {
    label: "Inativo",
    color: "default",
  },
};

const formatDateTime = (value: string) =>
  value ? new Date(value).toLocaleString("pt-BR") : "-";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Erro inesperado";
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const getBirthdayInfo = (birthDate: string) => {
  if (!birthDate) {
    return null;
  }

  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let nextBirthday = new Date(today.getFullYear(), month - 1, day);
  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
  }

  const daysUntil = Math.round(
    (nextBirthday.getTime() - today.getTime()) / 86_400_000,
  );

  if (daysUntil > 7) {
    return null;
  }

  return {
    daysUntil,
    label:
      daysUntil === 0
        ? "Aniversário hoje"
        : `Aniversário em ${daysUntil} dia(s)`,
  };
};

const hasVehicleData = (formState: CustomerVehicleFormState) =>
  Boolean(
    formState.vehicleModel.trim() ||
      formState.vehicleBrand.trim() ||
      formState.vehiclePlate.trim() ||
      formState.vehicleChassisNumber.trim() ||
      formState.vehicleYear ||
      formState.vehicleMileage ||
      formState.vehicleColor.trim(),
  );

const findLinkedVehicle = (
  customer: Pick<Customer, "id" | "vehicleModel" | "vehiclePlate">,
  vehicles: Vehicle[],
) => {
  const matchedByCustomer = vehicles.find(
    (vehicle) => vehicle.customerId && vehicle.customerId === customer.id,
  );

  if (matchedByCustomer) {
    return matchedByCustomer;
  }

  const normalizedPlate = customer.vehiclePlate.trim().toUpperCase();
  if (normalizedPlate) {
    const matchedByPlate = vehicles.find(
      (vehicle) => vehicle.vehiclePlate.trim().toUpperCase() === normalizedPlate,
    );

    if (matchedByPlate) {
      return matchedByPlate;
    }
  }

  const normalizedModel = customer.vehicleModel.trim().toLowerCase();
  if (!normalizedModel) {
    return null;
  }

  return (
    vehicles.find(
      (vehicle) => vehicle.vehicleModel.trim().toLowerCase() === normalizedModel,
    ) ?? null
  );
};

const getCustomerVehicles = (customer: Customer, vehicles: Vehicle[]) => {
  const linkedByCustomer = vehicles.filter(
    (vehicle) => vehicle.customerId && vehicle.customerId === customer.id,
  );

  if (linkedByCustomer.length) {
    return linkedByCustomer.slice(0, MAX_CUSTOMER_VEHICLES);
  }

  const legacyVehicle = findLinkedVehicle(customer, vehicles);
  return legacyVehicle ? [legacyVehicle] : [];
};

export const CustomersPage: React.FC = () => {
  const t = useTranslate();
  const { open } = useNotification();
  const navigate = useNavigate();
  const customersBackendEnabled = isCustomersBackendEnabled();
  const supportsCustomerStatus = !customersBackendEnabled;
  const supportsCustomerNotes = !customersBackendEnabled;

  const [searchValue, setSearchValue] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null,
  );
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [formState, setFormState] =
    useState<CustomerFormState>(DEFAULT_FORM_STATE);
  const [vehicleForms, setVehicleForms] = useState<CustomerVehicleFormState[]>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [isVehicleSectionOpen, setIsVehicleSectionOpen] = useState(false);

  const isEditing = Boolean(editingCustomerId);
  const addressPreview = useMemo(
    () => formatCustomerAddress(formState),
    [formState],
  );

  const loadCustomers = async (showError = false) => {
    try {
      const response = await listCustomersApi();
      setCustomers(response);
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

  const loadVehicles = async (showError = false) => {
    try {
      const response = await listVehiclesApi();
      setVehicles(response);
    } catch (error) {
      if (showError) {
        open?.({
          type: "error",
          message: "Falha ao carregar veículos",
          description: getErrorMessage(error),
        });
      }
    }
  };

  useEffect(() => {
    void loadCustomers(true);
    void loadVehicles(true);
  }, []);

  useEffect(() => {
    if (customersBackendEnabled) {
      return;
    }

    const refresh = () => {
      void loadCustomers();
    };

    const handleCustomersUpdated: EventListener = () => {
      refresh();
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === CUSTOMERS_STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener(CUSTOMERS_UPDATED_EVENT, handleCustomersUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        CUSTOMERS_UPDATED_EVENT,
        handleCustomersUpdated,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [customersBackendEnabled]);

  useEffect(() => {
    const refresh = () => {
      void loadVehicles();
    };

    const handleVehiclesUpdated: EventListener = () => {
      refresh();
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === VEHICLES_STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener(VEHICLES_UPDATED_EVENT, handleVehiclesUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(VEHICLES_UPDATED_EVENT, handleVehiclesUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      const linkedVehiclesText = getCustomerVehicles(customer, vehicles)
        .map((vehicle) =>
          [
            vehicle.vehicleModel,
            vehicle.vehicleBrand,
            vehicle.vehiclePlate,
            vehicle.vehicleChassisNumber,
            vehicle.vehicleColor,
          ].join(" "),
        )
        .join(" ")
        .toLowerCase();

      return (
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.document.toLowerCase().includes(query) ||
        customer.birthDate.toLowerCase().includes(query) ||
        customer.vehicleModel.toLowerCase().includes(query) ||
        customer.vehiclePlate.toLowerCase().includes(query) ||
        linkedVehiclesText.includes(query) ||
        customer.address.toLowerCase().includes(query) ||
        customer.cep.toLowerCase().includes(query) ||
        customer.logradouro.toLowerCase().includes(query) ||
        customer.bairro.toLowerCase().includes(query) ||
        customer.cidade.toLowerCase().includes(query) ||
        customer.uf.toLowerCase().includes(query)
      );
    });
  }, [customers, searchValue, vehicles]);

  const summary = useMemo(() => {
    return customers.reduce(
      (acc, customer) => {
        acc.total += 1;
        if (customer.status === "active") {
          acc.active += 1;
        } else {
          acc.inactive += 1;
        }

        return acc;
      },
      { total: 0, active: 0, inactive: 0 },
    );
  }, [customers]);

  const setField = <K extends keyof CustomerFormState>(
    field: K,
    value: CustomerFormState[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const setVehicleField = <K extends keyof CustomerVehicleFormState>(
    index: number,
    field: K,
    value: CustomerVehicleFormState[K],
  ) => {
    setVehicleForms((current) =>
      current.map((vehicle, currentIndex) =>
        currentIndex === index
          ? {
              ...vehicle,
              [field]: value,
            }
          : vehicle,
      ),
    );
  };

  const addVehicleForm = () => {
    setIsVehicleSectionOpen(true);
    setVehicleForms((current) =>
      current.length >= MAX_CUSTOMER_VEHICLES
        ? current
        : [...current, { ...DEFAULT_VEHICLE_FORM_STATE }],
    );
  };

  const removeVehicleForm = (index: number) => {
    setVehicleForms((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index);
      if (!next.length) {
        setIsVehicleSectionOpen(false);
      }
      return next;
    });
  };

  const resetForm = () => {
    setEditingCustomerId(null);
    setEditingVehicleId(null);
    setIsVehicleSectionOpen(false);
    setVehicleForms([]);
    setFormState(DEFAULT_FORM_STATE);
  };

  const validateForm = (): string | null => {
    if (!formState.name.trim()) {
      return "Informe o nome do cliente";
    }

    if (formState.name.trim().length < 5) {
      return "Nome do cliente deve ter pelo menos 5 caracteres";
    }

    if (!formState.phone.trim()) {
      return "Informe o telefone do cliente";
    }

    if (customersBackendEnabled) {
      const phoneDigits = onlyDigits(formState.phone);
      if (phoneDigits.length < 10 || phoneDigits.length > 13) {
        return "Informe um telefone válido (DDD + número)";
      }
    }

    if (customersBackendEnabled && !formState.document.trim()) {
      return "Informe o CPF/CNPJ do cliente";
    }

    if (customersBackendEnabled && formState.document.trim()) {
      const documentDigits = onlyDigits(formState.document);
      if (documentDigits.length !== 11 && documentDigits.length !== 14) {
        return "Informe um CPF/CNPJ válido";
      }
    }

    if (formState.email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formState.email.trim())) {
        return "Informe um e-mail válido";
      }
      if (formState.email.trim().length > 120) {
        return "E-mail deve ter no máximo 120 caracteres";
      }
    } else if (customersBackendEnabled) {
      return "Informe o e-mail do cliente";
    }

    const hasStructuredAddress = [
      formState.cep,
      formState.logradouro,
      formState.numero,
      formState.complemento,
      formState.bairro,
      formState.cidade,
      formState.uf,
    ].some((value) => value.trim());

    if (hasStructuredAddress) {
      if (!formState.cep.trim()) {
        return "Informe o CEP do cliente";
      }

      if (!formState.logradouro.trim()) {
        return "Informe o logradouro do cliente";
      }

      if (!formState.numero.trim()) {
        return "Informe o número do endereço";
      }

      if (!formState.bairro.trim()) {
        return "Informe o bairro do cliente";
      }

      if (!formState.cidade.trim()) {
        return "Informe a cidade do cliente";
      }

      if (!formState.uf.trim()) {
        return "Informe a UF do cliente";
      }
    } else if (customersBackendEnabled && formState.address.trim().length < 5) {
      return "Endereço deve ter pelo menos 5 caracteres";
    } else if (!formState.address.trim()) {
      return "Informe o endereço completo do cliente";
    }

    for (const [index, vehicleForm] of vehicleForms.entries()) {
      if (!hasVehicleData(vehicleForm)) {
        continue;
      }

      const vehicleLabel = vehicleForms.length > 1 ? ` ${index + 1}` : "";

      if (!vehicleForm.vehicleModel.trim()) {
        return `Informe o modelo do veículo${vehicleLabel}`;
      }

      if (!vehicleForm.vehicleBrand.trim()) {
        return `Informe a marca do veículo${vehicleLabel}`;
      }

      if (!vehicleForm.vehiclePlate.trim()) {
        return `Informe a placa do veículo${vehicleLabel}`;
      }

      if (!vehicleForm.vehicleChassisNumber.trim()) {
        return `Informe o chassi do veículo${vehicleLabel}`;
      }

      if (customersBackendEnabled && vehicleForm.vehicleChassisNumber.trim().length !== 17) {
        return `Chassi do veículo${vehicleLabel} deve ter 17 caracteres`;
      }

      if ((Number(vehicleForm.vehicleYear) || 0) < 1900) {
        return `Informe um ano de fabricação válido para o veículo${vehicleLabel}`;
      }
    }

    const filledVehicleForms = vehicleForms.filter(hasVehicleData);
    const plates = filledVehicleForms
      .map((vehicleForm) => vehicleForm.vehiclePlate.trim().toUpperCase())
      .filter(Boolean);
    if (new Set(plates).size !== plates.length) {
      return "Informe placas diferentes para os veículos do cliente";
    }

    const chassisNumbers = filledVehicleForms
      .map((vehicleForm) => vehicleForm.vehicleChassisNumber.trim().toUpperCase())
      .filter(Boolean);
    if (new Set(chassisNumbers).size !== chassisNumbers.length) {
      return "Informe chassis diferentes para os veículos do cliente";
    }

    return null;
  };

  const handleLookupCep = async () => {
    try {
      setIsLookingUpCep(true);

      const address = await lookupViaCep(formState.cep);
      setFormState((current) => ({
        ...current,
        cep: formatCep(address.cep),
        logradouro: current.logradouro.trim() || address.logradouro,
        complemento: current.complemento.trim() || address.complemento,
        bairro: current.bairro.trim() || address.bairro,
        cidade: current.cidade.trim() || address.cidade,
        uf: current.uf.trim() || address.uf,
      }));
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao buscar CEP",
        description: getErrorMessage(error),
      });
    } finally {
      setIsLookingUpCep(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      open?.({
        type: "error",
        message: validationError,
      });
      return;
    }

    try {
      setIsSaving(true);
      const filledVehicleForms = vehicleForms.filter(hasVehicleData);
      const primaryVehicle = filledVehicleForms[0] ?? DEFAULT_VEHICLE_FORM_STATE;
      const payload = {
        ...formState,
        vehicleModel: primaryVehicle.vehicleModel,
        vehicleBrand: primaryVehicle.vehicleBrand,
        vehiclePlate: primaryVehicle.vehiclePlate,
        vehicleChassisNumber: primaryVehicle.vehicleChassisNumber,
        vehicleMileage: primaryVehicle.vehicleMileage,
        vehicleYear: primaryVehicle.vehicleYear,
        vehicleColor: primaryVehicle.vehicleColor,
        address: addressPreview || formState.address.trim(),
      };

      let savedCustomer: Customer | null = null;

      if (editingCustomerId) {
        const updated = await updateCustomerApi(editingCustomerId, payload);
        if (!updated) {
          open?.({
            type: "error",
            message: "Não foi possível atualizar o cliente",
          });
          return;
        }

        savedCustomer = updated;
      } else {
        savedCustomer = await createCustomerApi(payload);
      }

      if (!savedCustomer) {
        throw new Error("Não foi possível persistir o cliente.");
      }

      for (const vehicleForm of filledVehicleForms) {
        const vehiclePayload = {
          customerId: savedCustomer.id,
          vehicleModel: vehicleForm.vehicleModel,
          vehicleBrand: vehicleForm.vehicleBrand,
          vehiclePlate: vehicleForm.vehiclePlate,
          vehicleChassisNumber: vehicleForm.vehicleChassisNumber,
          vehicleMileage: vehicleForm.vehicleMileage,
          vehicleYear: vehicleForm.vehicleYear,
          vehicleColor: vehicleForm.vehicleColor,
        };

        const savedVehicle = vehicleForm.id
          ? await updateVehicleApi(vehicleForm.id, vehiclePayload)
          : await createVehicleApi(vehiclePayload);

        if (!savedVehicle) {
          throw new Error("Não foi possível persistir o veículo.");
        }
      }

      await loadCustomers();
      await loadVehicles();
      open?.({
        type: "success",
        message:
          editingCustomerId || editingVehicleId
            ? "Cliente e veículo salvos com sucesso"
            : filledVehicleForms.length > 1
              ? "Cliente e veículos cadastrados com sucesso"
              : "Cliente e veículo cadastrado com sucesso",
      });
      resetForm();
    } catch (error) {
      open?.({
        type: "error",
        message: editingCustomerId
          ? "Erro ao atualizar cliente"
          : "Erro ao cadastrar cliente",
        description: getErrorMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    const linkedVehicles = getCustomerVehicles(customer, vehicles);
    const linkedVehicle = linkedVehicles[0] ?? null;
    setEditingVehicleId(linkedVehicle?.id ?? null);
    setVehicleForms(
      linkedVehicles.length
        ? linkedVehicles.map((vehicle) => ({
            id: vehicle.id,
            vehicleModel: vehicle.vehicleModel,
            vehicleBrand: vehicle.vehicleBrand,
            vehiclePlate: vehicle.vehiclePlate,
            vehicleChassisNumber: vehicle.vehicleChassisNumber,
            vehicleMileage: vehicle.vehicleMileage,
            vehicleYear: vehicle.vehicleYear,
            vehicleColor: vehicle.vehicleColor,
          }))
        : customer.vehicleModel.trim() || customer.vehiclePlate.trim()
          ? [
              {
                ...DEFAULT_VEHICLE_FORM_STATE,
                vehicleModel: customer.vehicleModel,
                vehiclePlate: customer.vehiclePlate,
              },
            ]
          : [],
    );
    setIsVehicleSectionOpen(
      Boolean(
        customer.vehicleModel.trim() ||
          customer.vehiclePlate.trim() ||
          linkedVehicles.length,
      ),
    );
    setFormState({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      document: customer.document,
      birthDate: customer.birthDate,
      vehicleModel: customer.vehicleModel,
      vehicleBrand: linkedVehicle?.vehicleBrand ?? "",
      vehiclePlate: customer.vehiclePlate,
      vehicleChassisNumber: linkedVehicle?.vehicleChassisNumber ?? "",
      vehicleMileage: linkedVehicle?.vehicleMileage ?? 0,
      vehicleYear: linkedVehicle?.vehicleYear ?? 0,
      vehicleColor: linkedVehicle?.vehicleColor ?? "",
      address: customer.address,
      cep: formatCep(customer.cep),
      logradouro: customer.logradouro,
      numero: customer.numero,
      complemento: customer.complemento,
      bairro: customer.bairro,
      cidade: customer.cidade,
      uf: customer.uf,
      notes: customer.notes,
      status: customer.status,
    });
  };

  const handleOpenVehicleSection = () => {
    addVehicleForm();
  };

  const handleDelete = async (customer: Customer) => {
    const confirmed = window.confirm(
      `Deseja excluir o cadastro de ${customer.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const removed = await removeCustomerApi(customer.id);
      if (!removed) {
        open?.({
          type: "error",
          message: "Não foi possível excluir o cliente",
        });
        return;
      }

      if (editingCustomerId === customer.id) {
        resetForm();
      }

      await loadCustomers();
      open?.({
        type: "success",
        message: "Cliente excluído com sucesso",
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Erro ao excluir cliente",
        description: getErrorMessage(error),
      });
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    if (!supportsCustomerStatus) {
      open?.({
        type: "error",
        message: "O backend atual de clientes não possui controle de status.",
      });
      return;
    }

    const nextStatus: CustomerStatus =
      customer.status === "active" ? "inactive" : "active";

    try {
      const updated = await updateCustomerApi(customer.id, {
        status: nextStatus,
      });
      if (!updated) {
        open?.({
          type: "error",
          message: "Não foi possível atualizar o status",
        });
        return;
      }

      await loadCustomers();
      open?.({
        type: "success",
        message: `Cliente ${
          nextStatus === "active" ? "ativado" : "inativado"
        } com sucesso`,
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Erro ao atualizar status",
        description: getErrorMessage(error),
      });
    }
  };

  const handleCreateServiceOrder = (customer: Customer) => {
    navigate(`/ordem-servico?customerId=${encodeURIComponent(customer.id)}`);
  };

  return (
    <RefineListView
      canCreate={false}
      title={t("customers.title", "Clientes")}
      headerButtons={() => (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <TextField
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={
              customersBackendEnabled
                ? "Buscar por nome, telefone, e-mail, documento ou CEP"
                : "Buscar por nome, telefone, e-mail, placa ou endereço"
            }
            size="small"
            sx={{ minWidth: 280 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Chip
            size="small"
            label={`${summary.total} clientes`}
            variant="outlined"
          />
          {supportsCustomerStatus ? (
            <>
              <Chip
                size="small"
                label={`${summary.active} ativos`}
                variant="outlined"
                color="success"
              />
              <Chip
                size="small"
                label={`${summary.inactive} inativos`}
                variant="outlined"
              />
            </>
          ) : null}
        </Stack>
      )}
    >
      <Grid container columns={12} spacing={3}>
        <Grid size={{ xs: 12, md: 12 }}>
          <Box sx={{ width: "100%" }}>
            <Card
              title={isEditing ? "Editar cliente" : "Novo cliente"}
              icon={<PersonAddAlt1OutlinedIcon />}
              sx={{ borderRadius: 3 }}
              cardContentProps={{ sx: { p: 2 } }}
            >
              <Stack spacing={2} component="form" onSubmit={handleSubmit}>
                <TextField
                  label="Nome completo"
                  value={formState.name}
                  onChange={(event) => setField("name", event.target.value)}
                  size="small"
                  required
                />

                <Grid container columns={12} spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Telefone"
                      value={formState.phone}
                      onChange={(event) =>
                        setField("phone", formatCustomerPhone(event.target.value))
                      }
                      size="small"
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="CPF/CNPJ"
                      value={formState.document}
                      onChange={(event) =>
                        setField("document", formatCustomerDocument(event.target.value))
                      }
                      size="small"
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="E-mail"
                  type="email"
                  value={formState.email}
                  onChange={(event) => setField("email", event.target.value)}
                  size="small"
                  required={customersBackendEnabled}
                />

                <TextField
                  label="Data de nascimento"
                  type="date"
                  value={formState.birthDate}
                  onChange={(event) => setField("birthDate", event.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />

                <Divider />

                {isVehicleSectionOpen && vehicleForms.length ? (
                  <Stack spacing={2}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                      flexWrap="wrap"
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <DirectionsCarFilledOutlinedIcon fontSize="small" />
                        <Typography variant="subtitle2">
                          Veículos do cliente
                        </Typography>
                      </Stack>
                      {vehicleForms.length < MAX_CUSTOMER_VEHICLES ? (
                        <Button
                          type="button"
                          variant="outlined"
                          size="small"
                          startIcon={<DirectionsCarFilledOutlinedIcon />}
                          onClick={addVehicleForm}
                          sx={{ textTransform: "none" }}
                        >
                          Adicionar outro veículo
                        </Button>
                      ) : null}
                    </Stack>

                    {vehicleForms.map((vehicleForm, index) => (
                      <Stack
                        key={vehicleForm.id ?? `new-vehicle-${index}`}
                        spacing={1.5}
                        sx={{
                          p: 1.5,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Typography variant="caption" fontWeight={700}>
                            Veículo {index + 1}
                          </Typography>
                          <Button
                            type="button"
                            variant="text"
                            color="inherit"
                            size="small"
                            startIcon={<CloseOutlinedIcon />}
                            onClick={() => removeVehicleForm(index)}
                            sx={{ textTransform: "none" }}
                          >
                            Remover
                          </Button>
                        </Stack>
                        <Grid container columns={12} spacing={1.5}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label="Modelo"
                              value={vehicleForm.vehicleModel}
                              onChange={(event) =>
                                setVehicleField(index, "vehicleModel", event.target.value)
                              }
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label="Marca"
                              value={vehicleForm.vehicleBrand}
                              onChange={(event) =>
                                setVehicleField(index, "vehicleBrand", event.target.value)
                              }
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Placa"
                              value={vehicleForm.vehiclePlate}
                              onChange={(event) =>
                                setVehicleField(
                                  index,
                                  "vehiclePlate",
                                  event.target.value.toUpperCase(),
                                )
                              }
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Chassi"
                              value={vehicleForm.vehicleChassisNumber}
                              onChange={(event) =>
                                setVehicleField(index, "vehicleChassisNumber", event.target.value)
                              }
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Cor"
                              value={vehicleForm.vehicleColor}
                              onChange={(event) =>
                                setVehicleField(index, "vehicleColor", event.target.value)
                              }
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label="Ano"
                              type="number"
                              value={vehicleForm.vehicleYear || ""}
                              onChange={(event) =>
                                setVehicleField(
                                  index,
                                  "vehicleYear",
                                  Math.max(0, Number(event.target.value) || 0),
                                )
                              }
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label="Quilometragem"
                              type="number"
                              value={vehicleForm.vehicleMileage || ""}
                              onChange={(event) =>
                                setVehicleField(
                                  index,
                                  "vehicleMileage",
                                  Math.max(0, Number(event.target.value) || 0),
                                )
                              }
                              size="small"
                              fullWidth
                            />
                          </Grid>
                        </Grid>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<DirectionsCarFilledOutlinedIcon />}
                    onClick={handleOpenVehicleSection}
                    sx={{ alignSelf: "flex-start", textTransform: "none" }}
                  >
                    Adicionar veículo
                  </Button>
                )}

                <Grid container columns={12} spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="CEP"
                      value={formState.cep}
                      onChange={(event) =>
                        setField("cep", formatCep(event.target.value))
                      }
                      size="small"
                      fullWidth
                      placeholder="00000-000"
                      slotProps={{
                        input: {
                          endAdornment: isLookingUpCep ? (
                            <InputAdornment position="end">
                              <Typography variant="caption" color="text.secondary">
                                Buscando...
                              </Typography>
                            </InputAdornment>
                          ) : undefined,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      fullWidth
                      disabled={isLookingUpCep}
                      onClick={() => {
                        void handleLookupCep();
                      }}
                      sx={{ height: "100%" }}
                    >
                      {isLookingUpCep ? "Consultando CEP..." : "Buscar CEP"}
                    </Button>
                  </Grid>
                </Grid>

                <Grid container columns={12} spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      label="Logradouro"
                      value={formState.logradouro}
                      onChange={(event) =>
                        setField("logradouro", event.target.value)
                      }
                      size="small"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Número"
                      value={formState.numero}
                      onChange={(event) =>
                        setField("numero", event.target.value)
                      }
                      size="small"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Complemento"
                      value={formState.complemento}
                      onChange={(event) =>
                        setField("complemento", event.target.value)
                      }
                      size="small"
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Grid container columns={12} spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      label="Bairro"
                      value={formState.bairro}
                      onChange={(event) =>
                        setField("bairro", event.target.value)
                      }
                      size="small"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      label="Cidade"
                      value={formState.cidade}
                      onChange={(event) =>
                        setField("cidade", event.target.value)
                      }
                      size="small"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      label="UF"
                      value={formState.uf}
                      onChange={(event) =>
                        setField("uf", event.target.value.toUpperCase().slice(0, 2))
                      }
                      size="small"
                      fullWidth
                    />
                  </Grid>
                </Grid>

                {supportsCustomerNotes ? (
                  <TextField
                    label="Observações"
                    value={formState.notes}
                    onChange={(event) => setField("notes", event.target.value)}
                    size="small"
                    minRows={3}
                    multiline
                  />
                ) : null}

                {supportsCustomerStatus ? (
                  <TextField
                    label="Status"
                    value={formState.status}
                    onChange={(event) =>
                      setField("status", event.target.value as CustomerStatus)
                    }
                    size="small"
                    select
                  >
                    <MenuItem value="active">Ativo</MenuItem>
                    <MenuItem value="inactive">Inativo</MenuItem>
                  </TextField>
                ) : null}

                <Divider />

                <Stack direction="row" spacing={1.6} >
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    disabled={isSaving}
                  >
                    {isSaving
                      ? "Salvando..."
                      : isEditing
                      ? "Salvar alterações"
                      : "Cadastrar cliente"}
                  </Button>
                  {isEditing ? (
                    <Button
                      type="button"
                      variant="outlined"
                      color="inherit"
                      startIcon={<CloseOutlinedIcon />}
                      onClick={resetForm}
                    >
                      Cancelar edição
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            </Card>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 12 }}>
          <TableContainer
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: 500,
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
                minWidth: 980,
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
                  <TableCell>Cliente</TableCell>
                  <TableCell>Contato</TableCell>
                  <TableCell>
                    {customersBackendEnabled ? "Endereço" : "Veículo"}
                  </TableCell>
                  {supportsCustomerStatus ? (
                    <TableCell>Status</TableCell>
                  ) : null}
                  <TableCell>Atualizado em</TableCell>
                  <TableCell
                    align="right"
                    sx={{ width: customersBackendEnabled ? 320 : 420 }}
                  >
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.length ? (
                  filteredCustomers.map((customer, index) => {
                    const statusMeta = STATUS_META[customer.status];
                    const canActivate = customer.status === "inactive";
                    const birthdayInfo = getBirthdayInfo(customer.birthDate);
                    const customerVehicles = getCustomerVehicles(customer, vehicles);
                    const primaryVehicle = customerVehicles[0] ?? null;
                    const vehicleSummary = primaryVehicle
                      ? [
                          primaryVehicle.vehicleModel,
                          primaryVehicle.vehiclePlate,
                        ].filter(Boolean).join(" • ")
                      : [customer.vehicleModel, customer.vehiclePlate]
                          .filter(Boolean)
                          .join(" • ");

                    return (
                      <TableRow
                        key={customer.id}
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
                          },
                        }}
                      >
                        <TableCell>
                          <Stack spacing={0.2}>
                            <Typography variant="body2" fontWeight={600}>
                              {customer.name}
                            </Typography>
                            {customer.document ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                CPF/CNPJ: {customer.document}
                              </Typography>
                            ) : null}
                            {birthdayInfo ? (
                              <Chip
                                size="small"
                                color={birthdayInfo.daysUntil === 0 ? "warning" : "info"}
                                variant="outlined"
                                icon={<CakeOutlinedIcon fontSize="small" />}
                                label={birthdayInfo.label}
                                sx={{ alignSelf: "flex-start", mt: 0.5 }}
                              />
                            ) : null}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.2}>
                            <Typography variant="body2">
                              {customer.phone || "-"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {customer.email || "-"}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.2}>
                            <Typography variant="body2">
                              {customersBackendEnabled
                                ? formatCustomerAddress(customer) || "-"
                                : vehicleSummary || "-"}
                            </Typography>
                            {customersBackendEnabled ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {customerVehicles.length
                                  ? `${customerVehicles.length} veículo(s): ${customerVehicles
                                      .map((vehicle) => vehicle.vehiclePlate || vehicle.vehicleModel)
                                      .filter(Boolean)
                                      .join(", ")}`
                                  : [customer.bairro, customer.cidade, customer.uf]
                                      .filter(Boolean)
                                      .join(" • ") || formatCep(customer.cep) || "-"}
                              </Typography>
                            ) : (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {customer.vehiclePlate || "-"}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        {supportsCustomerStatus ? (
                          <TableCell>
                            <Chip
                              size="small"
                              label={statusMeta.label}
                              color={statusMeta.color}
                              variant="outlined"
                            />
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(customer.updatedAt)}
                          </Typography>
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
                              variant="text"
                              color="primary"
                              onClick={() => handleEdit(customer)}
                              startIcon={<EditOutlinedIcon fontSize="small" />}
                              sx={{
                                textTransform: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
                              disabled={
                                supportsCustomerStatus &&
                                customer.status !== "active"
                              }
                              onClick={() => handleCreateServiceOrder(customer)}
                              startIcon={
                                <AssignmentOutlinedIcon fontSize="small" />
                              }
                              sx={{
                                textTransform: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Criar OS
                            </Button>
                            {supportsCustomerStatus ? (
                              <Button
                                size="small"
                                variant="outlined"
                                color={canActivate ? "success" : "warning"}
                                onClick={() => handleToggleStatus(customer)}
                                startIcon={
                                  canActivate ? (
                                    <CheckCircleOutlineOutlinedIcon fontSize="small" />
                                  ) : (
                                    <BlockOutlinedIcon fontSize="small" />
                                  )
                                }
                                sx={{
                                  textTransform: "none",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Atualizar
                              </Button>
                            ) : null}
                            <Button
                              size="small"
                              variant="text"
                              color="error"
                              onClick={() => handleDelete(customer)}
                              startIcon={
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                              }
                              sx={{
                                textTransform: "none",
                                whiteSpace: "nowrap",
                              }}
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
                    <TableCell
                      colSpan={supportsCustomerStatus ? 6 : 5}
                      sx={{ py: 5 }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                      >
                        Nenhum cliente encontrado.
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
