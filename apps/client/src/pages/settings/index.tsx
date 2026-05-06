import React, { useEffect, useMemo, useState } from "react";
import {
  useGetIdentity,
  useImport,
  useNotification,
  useTranslate,
  useUpdatePassword,
} from "@refinedev/core";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import BackupOutlinedIcon from "@mui/icons-material/BackupOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import BrandingWatermarkOutlinedIcon from "@mui/icons-material/BrandingWatermarkOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import type { IIdentity } from "../../interfaces";
import { Card, CompanyBanner, RefineListView } from "../../components";
import {
  type AppSettings,
  getAvatarFallbackText,
  mergeAppSettings,
  readAppSettings,
  writeAppSettings,
} from "../../services/appSettings";
import {
  uploadProfilePhoto,
  uploadSidebarImage,
  uploadWorkshopLogo,
} from "../../services/auth";
import { isBackendApiEnabled } from "../../services/httpClient";
import type { CreateCustomerPayload, Customer } from "../../services/customers";

const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
};

const getBackupFileName = () => {
  const now = new Date().toISOString().replaceAll(":", "-");
  return `prevent-auto-settings-backup-${now}.json`;
};

const BACKUP_WEEK_DAYS = [
  { value: 0, shortLabel: "Dom", longLabel: "Domingo" },
  { value: 1, shortLabel: "Seg", longLabel: "Segunda" },
  { value: 2, shortLabel: "Ter", longLabel: "Terça" },
  { value: 3, shortLabel: "Qua", longLabel: "Quarta" },
  { value: 4, shortLabel: "Qui", longLabel: "Quinta" },
  { value: 5, shortLabel: "Sex", longLabel: "Sexta" },
  { value: 6, shortLabel: "Sáb", longLabel: "Sábado" },
] as const;

const BACKUP_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const BACKUP_TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const totalMinutes = index * 15;
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  const value = `${String(hour24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const label = `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${suffix}`;

  return { value, label };
});

const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services-client";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

type DriveUploadTarget = "drive" | "sheets";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleFileUploadResponse = {
  id: string;
  webViewLink?: string;
};

const getBackupSpreadsheetFileName = () => {
  const now = new Date().toISOString().replaceAll(":", "-");
  return `prevent-auto-settings-backup-${now}.csv`;
};

const escapeCsvValue = (value: string): string => {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
};

const getBackupRows = (backupData: AppSettings): Array<[string, string]> => {
  const selectedDays = BACKUP_WEEK_DAYS.filter((day) =>
    backupData.backup.scheduledDays.includes(day.value),
  )
    .map((day) => day.longLabel)
    .join(", ");

  return [
    ["Gerado em", new Date().toLocaleString()],
    ["Perfil - Nome", backupData.profile.name || "-"],
    ["Perfil - E-mail", backupData.profile.email || "-"],
    ["Perfil - Telefone", backupData.profile.phone || "-"],
    ["Perfil - Cargo", backupData.profile.role || "-"],
    ["Perfil - Foto", backupData.profile.avatarUrl ? "Configurada" : "Não configurada"],
    ["Branding - Logomarca sidebar", backupData.branding.sidebarLogoUrl ? "Configurada" : "Não configurada"],
    ["Branding - Logo da oficina", backupData.branding.workshopLogoUrl ? "Configurada" : "Não configurada"],
    ["Backup automático", backupData.backup.autoBackupEnabled ? "Ativado" : "Desativado"],
    ["Dias agendados", selectedDays || "-"],
    ["Horário agendado", backupData.backup.scheduledTime || "-"],
    [
      "Último backup",
      backupData.backup.lastBackupAt
        ? new Date(backupData.backup.lastBackupAt).toLocaleString()
        : "-",
    ],
  ];
};

const buildBackupCsvContent = (backupData: AppSettings): string => {
  const header = `${escapeCsvValue("Campo")},${escapeCsvValue("Valor")}`;
  const rows = getBackupRows(backupData).map(
    ([field, value]) => `${escapeCsvValue(field)},${escapeCsvValue(value)}`,
  );

  return `\uFEFF${[header, ...rows].join("\n")}`;
};

const buildBackupSnapshot = (backupData: AppSettings): AppSettings => {
  return {
    ...backupData,
    backup: {
      ...backupData.backup,
      lastBackupAt: new Date().toISOString(),
    },
  };
};

const triggerFileDownload = (
  content: string,
  fileName: string,
  mimeType: string,
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Erro desconhecido";
};

type CustomerSpreadsheetRow = Record<string, unknown>;

const normalizeSpreadsheetHeader = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

const getSpreadsheetCellValue = (
  row: CustomerSpreadsheetRow,
  aliases: string[],
): string => {
  const normalizedAliases = aliases.map((alias) =>
    normalizeSpreadsheetHeader(alias),
  );

  for (const [key, value] of Object.entries(row)) {
    if (!normalizedAliases.includes(normalizeSpreadsheetHeader(key))) {
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
};

const normalizeImportedCustomerStatus = (
  value: string,
): CreateCustomerPayload["status"] => {
  const normalized = value.trim().toLowerCase();

  if (
    normalized === "inactive" ||
    normalized === "inativo" ||
    normalized === "inativa" ||
    normalized === "false" ||
    normalized === "0"
  ) {
    return "inactive";
  }

  return "active";
};

const mapCustomerSpreadsheetRow = (
  row: CustomerSpreadsheetRow,
): CreateCustomerPayload => {
  const rawStatus = getSpreadsheetCellValue(row, [
    "status",
    "situacao",
    "situação",
  ]);

  return {
    name: getSpreadsheetCellValue(row, ["name", "nome", "cliente"]),
    phone: getSpreadsheetCellValue(row, ["phone", "telefone", "celular"]),
    email: getSpreadsheetCellValue(row, ["email", "e-mail"]),
    document: getSpreadsheetCellValue(row, ["document", "cpf", "cnpj", "cpf_cnpj"]),
    vehicleModel: getSpreadsheetCellValue(row, [
      "vehicleModel",
      "veiculo",
      "veículo",
      "modelo",
      "carro",
      "vehicle",
    ]),
    vehiclePlate: getSpreadsheetCellValue(row, ["vehiclePlate", "placa", "plate"]),
    address: getSpreadsheetCellValue(row, ["address", "endereco", "endereço"]),
    cep: getSpreadsheetCellValue(row, ["cep"]),
    logradouro: getSpreadsheetCellValue(row, ["logradouro", "rua", "street"]),
    numero: getSpreadsheetCellValue(row, ["numero", "número", "number"]),
    complemento: getSpreadsheetCellValue(row, ["complemento", "complement"]),
    bairro: getSpreadsheetCellValue(row, ["bairro", "neighborhood"]),
    cidade: getSpreadsheetCellValue(row, ["cidade", "city", "localidade"]),
    uf: getSpreadsheetCellValue(row, ["uf", "estado", "state"]),
    notes: getSpreadsheetCellValue(row, [
      "notes",
      "observacoes",
      "observações",
      "obs",
    ]),
    status: normalizeImportedCustomerStatus(rawStatus),
  };
};

const getCustomersImportTemplateFileName = () => {
  const now = new Date().toISOString().replaceAll(":", "-");
  return `prevent-auto-clientes-import-modelo-${now}.csv`;
};

const buildCustomersImportTemplateCsvContent = () => {
  const headers = [
    "name",
    "phone",
    "email",
    "document",
    "vehicleModel",
    "vehiclePlate",
    "cep",
    "logradouro",
    "numero",
    "complemento",
    "bairro",
    "cidade",
    "uf",
    "address",
    "notes",
    "status",
  ];

  const sampleRows = [
    [
      "Maria Ferreira",
      "(62) 99999-1111",
      "maria@email.com",
      "123.456.789-00",
      "HB20 1.0",
      "ABC1D23",
      "74000-000",
      "Rua A",
      "100",
      "Casa",
      "Centro",
      "Goiania",
      "GO",
      "Rua A, 100, Centro, Goiania - GO, 74000-000",
      "Cliente recorrente",
      "active",
    ],
    [
      "Joao Silva",
      "(62) 98888-2222",
      "joao@email.com",
      "98.765.432/0001-10",
      "Onix LT",
      "XYZ9K87",
      "74110-010",
      "Av. B",
      "200",
      "Sala 3",
      "Setor Sul",
      "Goiania",
      "GO",
      "Av. B, 200, Setor Sul, Goiania - GO, 74110-010",
      "Preferencia por periodo da manha",
      "inactive",
    ],
  ];

  const headerLine = headers.map((item) => escapeCsvValue(item)).join(",");
  const bodyLines = sampleRows.map((row) =>
    row.map((item) => escapeCsvValue(item)).join(","),
  );

  return `\uFEFF${[headerLine, ...bodyLines].join("\n")}`;
};

const loadGoogleIdentityScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Janela indisponível para autenticação Google"));
      return;
    }

    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(
      GOOGLE_IDENTITY_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Falha ao carregar autenticação Google")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Falha ao carregar autenticação Google"));
    document.body.appendChild(script);
  });
};

const requestGoogleAccessToken = async (clientId: string): Promise<string> => {
  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: (tokenResponse: GoogleTokenResponse) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error));
          return;
        }

        if (!tokenResponse.access_token) {
          reject(new Error("Token de acesso não retornado"));
          return;
        }

        resolve(tokenResponse.access_token);
      },
      error_callback: () => {
        reject(new Error("Falha na autenticação com Google"));
      },
    });

    if (!tokenClient) {
      reject(new Error("Cliente OAuth do Google indisponível"));
      return;
    }

    tokenClient.requestAccessToken({ prompt: "consent" });
  });
};

const uploadCsvToGoogleDrive = async (params: {
  accessToken: string;
  fileName: string;
  csvContent: string;
  target: DriveUploadTarget;
}): Promise<GoogleFileUploadResponse> => {
  const { accessToken, fileName, csvContent, target } = params;

  const metadata = {
    name: fileName,
    mimeType:
      target === "sheets"
        ? "application/vnd.google-apps.spreadsheet"
        : "text/csv",
  };

  const boundary = `prevent-backup-boundary-${Date.now()}`;
  const requestBody = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: text/csv; charset=UTF-8",
    "",
    csvContent,
    `--${boundary}--`,
  ].join("\r\n");

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: requestBody,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Falha no upload para Google Drive");
  }

  return (await response.json()) as GoogleFileUploadResponse;
};

const getNextScheduledBackupDate = (
  scheduledDays: number[],
  scheduledTime: string,
): Date | null => {
  if (!scheduledDays.length || !BACKUP_TIME_PATTERN.test(scheduledTime)) {
    return null;
  }

  const [hours, minutes] = scheduledTime.split(":").map(Number);
  const now = new Date();

  let nextDate: Date | null = null;

  for (const day of scheduledDays) {
    const candidate = new Date(now);
    candidate.setHours(hours, minutes, 0, 0);

    const dayOffset = (day - now.getDay() + 7) % 7;
    candidate.setDate(now.getDate() + dayOffset);

    if (dayOffset === 0 && candidate <= now) {
      candidate.setDate(candidate.getDate() + 7);
    }

    if (!nextDate || candidate < nextDate) {
      nextDate = candidate;
    }
  }

  return nextDate;
};

export const SettingsPage: React.FC = () => {
  const t = useTranslate();
  const { open } = useNotification();
  const { data: identity } = useGetIdentity<IIdentity | null>();
  const { mutateAsync: updatePassword, isPending: isUpdatingPassword } =
    useUpdatePassword<Record<string, string>>();
  const backendEnabled = isBackendApiEnabled();

  const [settings, setSettings] = useState<AppSettings>(() => readAppSettings());
  const [isProfilePhotoUploading, setIsProfilePhotoUploading] = useState(false);
  const [isSidebarLogoUploading, setIsSidebarLogoUploading] = useState(false);
  const [isWorkshopLogoUploading, setIsWorkshopLogoUploading] = useState(false);
  const [isDriveUploadPending, setIsDriveUploadPending] = useState(false);
  const [isBackupOptionsOpen, setIsBackupOptionsOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [customersImportProgress, setCustomersImportProgress] = useState({
    totalAmount: 0,
    processedAmount: 0,
  });
  const [customersImportSummary, setCustomersImportSummary] = useState<{
    imported: number;
    failed: number;
  } | null>(null);

  const {
    inputProps: customersImportInputProps,
    isLoading: isImportingCustomers,
  } = useImport<CustomerSpreadsheetRow, Customer, any, CreateCustomerPayload>({
    resource: "customers",
    dataProviderName: "importCustomers",
    batchSize: 1,
    paparseOptions: {
      skipEmptyLines: true,
    },
    mapData: (item) => mapCustomerSpreadsheetRow(item),
    onProgress: ({ totalAmount, processedAmount }) => {
      setCustomersImportProgress({
        totalAmount,
        processedAmount,
      });
    },
    onFinish: ({ succeeded, errored }) => {
      const imported = succeeded.reduce(
        (total, result) => total + result.request.length,
        0,
      );
      const failed = errored.reduce(
        (total, result) => total + result.request.length,
        0,
      );

      setCustomersImportSummary({
        imported,
        failed,
      });

      if (failed > 0) {
        showError(
          t(
            "settings.importSpreadsheet.partialFailure",
            "Importação concluída com falhas",
          ),
          `${imported} importados, ${failed} com falha.`,
        );
        return;
      }

      showSuccess(
        t("settings.importSpreadsheet.success", "Planilha importada com sucesso"),
        `${imported} clientes importados.`,
      );
    },
  });

  useEffect(() => {
    if (!identity) return;

    setSettings((previous) => {
      return {
        ...previous,
        profile: {
          ...previous.profile,
          name: identity.name || previous.profile.name,
          email: identity.email || previous.profile.email,
          role: identity.role || previous.profile.role,
          avatarUrl: identity.avatar || previous.profile.avatarUrl,
        },
        branding: {
          ...previous.branding,
          sidebarLogoUrl:
            identity.workshopSidebarImageUrl || previous.branding.sidebarLogoUrl,
          workshopLogoUrl:
            identity.workshopLogoUrl || previous.branding.workshopLogoUrl,
        },
      };
    });
  }, [identity]);

  const lastBackupLabel = useMemo(() => {
    if (!settings.backup.lastBackupAt) {
      return t("settings.backup.never", "Nenhum backup gerado ainda");
    }

    return new Date(settings.backup.lastBackupAt).toLocaleString();
  }, [settings.backup.lastBackupAt, t]);

  const nextScheduledBackupLabel = useMemo(() => {
    if (!settings.backup.autoBackupEnabled) {
      return t("settings.backup.autoBackupDisabled", "Backup automático desativado");
    }

    const nextDate = getNextScheduledBackupDate(
      settings.backup.scheduledDays,
      settings.backup.scheduledTime,
    );

    if (!nextDate) {
      return t("settings.backup.scheduleNotConfigured", "Agenda não configurada");
    }

    return nextDate.toLocaleString();
  }, [
    settings.backup.autoBackupEnabled,
    settings.backup.scheduledDays,
    settings.backup.scheduledTime,
    t,
  ]);

  function showSuccess(message: string, description?: string) {
    open?.({
      type: "success",
      message,
      description,
    });
  }

  function showError(message: string, description?: string) {
    open?.({
      type: "error",
      message,
      description,
    });
  }

  const openBackupOptions = () => {
    setIsBackupOptionsOpen(true);
  };

  const closeBackupOptions = () => {
    setIsBackupOptionsOpen(false);
  };

  const handleProfileFieldChange =
    (field: keyof AppSettings["profile"]) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSettings((previous) => ({
        ...previous,
        profile: {
          ...previous.profile,
          [field]: value,
        },
      }));
    };

  const handleSaveProfile = () => {
    const current = readAppSettings();
    const next = mergeAppSettings({
      profile: {
        ...current.profile,
        phone: settings.profile.phone,
      },
    });
    setSettings(next);
    showSuccess(
      t("settings.profile.saved", "Perfil atualizado"),
      t("settings.profile.savedDescription", "As informações foram salvas."),
    );
  };

  const handleProfilePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProfilePhotoUploading(true);

      if (backendEnabled) {
        await uploadProfilePhoto(file);
        setSettings(readAppSettings());
      } else {
        const avatarUrl = await fileToDataURL(file);
        const next = mergeAppSettings({
          profile: {
            ...settings.profile,
            avatarUrl,
          },
        });
        setSettings(next);
      }

      showSuccess(
        t("settings.profile.photoUpdated", "Foto de perfil atualizada"),
      );
    } catch (error) {
      showError(
        t("settings.common.uploadError", "Falha no upload"),
        t("settings.common.uploadErrorDescription", "Não foi possível enviar o arquivo."),
      );
    } finally {
      setIsProfilePhotoUploading(false);
      event.target.value = "";
    }
  };

  const handleSidebarLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsSidebarLogoUploading(true);

      if (backendEnabled) {
        await uploadSidebarImage(file);
        setSettings(readAppSettings());
      } else {
        const sidebarLogoUrl = await fileToDataURL(file);
        const next = mergeAppSettings({
          branding: {
            ...settings.branding,
            sidebarLogoUrl,
          },
        });
        setSettings(next);
      }

      showSuccess(
        t("settings.branding.logoUpdated", "Logomarca da sidebar atualizada"),
      );
    } catch (error) {
      showError(
        t("settings.common.uploadError", "Falha no upload"),
        t("settings.common.uploadErrorDescription", "Não foi possível enviar o arquivo."),
      );
    } finally {
      setIsSidebarLogoUploading(false);
      event.target.value = "";
    }
  };

  const handleWorkshopLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsWorkshopLogoUploading(true);

      if (backendEnabled) {
        await uploadWorkshopLogo(file);
        setSettings(readAppSettings());
      } else {
        const workshopLogoUrl = await fileToDataURL(file);
        const next = mergeAppSettings({
          branding: {
            ...settings.branding,
            workshopLogoUrl,
          },
        });
        setSettings(next);
      }

      showSuccess(
        t("settings.banner.logoUpdated", "Logo da oficina atualizado"),
      );
    } catch (error) {
      showError(
        t("settings.common.uploadError", "Falha no upload"),
        t("settings.common.uploadErrorDescription", "Não foi possível enviar o arquivo."),
      );
    } finally {
      setIsWorkshopLogoUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveSidebarLogo = () => {
    if (backendEnabled) {
      showError(
        t("settings.branding.removeUnavailable", "Remoção ainda não disponível"),
        t(
          "settings.branding.removeUnavailableDescription",
          "O backend atual permite atualizar a imagem, mas ainda não expõe remoção.",
        ),
      );
      return;
    }

    const next = mergeAppSettings({
      branding: {
        ...settings.branding,
        sidebarLogoUrl: "",
      },
    });
    setSettings(next);
    showSuccess(
      t("settings.branding.logoRemoved", "Logomarca removida da sidebar"),
    );
  };

  const handleAutoBackupChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const autoBackupEnabled = event.target.checked;
    setSettings((previous) => ({
      ...previous,
      backup: {
        ...previous.backup,
        autoBackupEnabled,
      },
    }));
  };

  const handleToggleBackupDay = (day: number) => {
    setSettings((previous) => {
      const alreadySelected = previous.backup.scheduledDays.includes(day);
      const scheduledDays = alreadySelected
        ? previous.backup.scheduledDays.filter((selectedDay) => selectedDay !== day)
        : [...previous.backup.scheduledDays, day].sort((a, b) => a - b);

      return {
        ...previous,
        backup: {
          ...previous.backup,
          scheduledDays,
        },
      };
    });
  };

  const handleBackupTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const scheduledTime = event.target.value;
    setSettings((previous) => ({
      ...previous,
      backup: {
        ...previous.backup,
        scheduledTime,
      },
    }));
  };

  const handleDownloadBackup = () => {
    const backupPayload = buildBackupSnapshot(settings);

    const persisted = writeAppSettings(backupPayload);
    setSettings(persisted);

    triggerFileDownload(
      JSON.stringify(backupPayload, null, 2),
      getBackupFileName(),
      "application/json",
    );

    showSuccess(
      t("settings.backup.generated", "Backup gerado"),
      t("settings.backup.generatedDescription", "Arquivo de backup baixado com sucesso."),
    );
  };

  const handleDownloadBackupSpreadsheet = () => {
    const backupPayload = buildBackupSnapshot(settings);

    const persisted = writeAppSettings(backupPayload);
    setSettings(persisted);

    triggerFileDownload(
      buildBackupCsvContent(backupPayload),
      getBackupSpreadsheetFileName(),
      "text/csv;charset=utf-8",
    );

    showSuccess(
      t("settings.backup.spreadsheetGenerated", "Planilha de backup gerada"),
      t(
        "settings.backup.spreadsheetGeneratedDescription",
        "Arquivo CSV baixado e compatível com Excel/Google Sheets.",
      ),
    );
  };

  const handleUploadBackupToGoogle = async (target: DriveUploadTarget) => {
    if (!GOOGLE_CLIENT_ID) {
      showError(
        t("settings.backup.googleClientIdMissing", "Integração Google não configurada"),
        t(
          "settings.backup.googleClientIdMissingDescription",
          "Defina VITE_GOOGLE_CLIENT_ID no ambiente para habilitar Google Drive/Sheets.",
        ),
      );
      return;
    }

    const backupPayload = buildBackupSnapshot(settings);
    const persisted = writeAppSettings(backupPayload);
    setSettings(persisted);

    const fileName = getBackupSpreadsheetFileName();
    const csvContent = buildBackupCsvContent(backupPayload);

    try {
      setIsDriveUploadPending(true);

      const accessToken = await requestGoogleAccessToken(GOOGLE_CLIENT_ID);
      const uploadedFile = await uploadCsvToGoogleDrive({
        accessToken,
        fileName,
        csvContent,
        target,
      });

      if (uploadedFile.webViewLink) {
        window.open(uploadedFile.webViewLink, "_blank", "noopener,noreferrer");
      }

      if (target === "sheets") {
        showSuccess(
          t("settings.backup.sheetsSaved", "Backup enviado para Google Sheets"),
        );
        setIsBackupOptionsOpen(false);
        return;
      }

      showSuccess(
        t("settings.backup.driveSaved", "Backup salvo no Google Drive"),
      );
      setIsBackupOptionsOpen(false);
    } catch (error) {
      showError(
        t("settings.backup.googleUploadError", "Falha ao enviar para Google"),
        getErrorMessage(error),
      );
    } finally {
      setIsDriveUploadPending(false);
    }
  };

  const handleRestoreBackup = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<AppSettings>;
      const restored = mergeAppSettings(parsed);
      setSettings(restored);

      showSuccess(
        t("settings.backup.restored", "Backup restaurado"),
        t("settings.backup.restoredDescription", "As configurações foram restauradas."),
      );
    } catch (error) {
      showError(
        t("settings.backup.restoreError", "Falha ao restaurar backup"),
        t("settings.backup.restoreErrorDescription", "Arquivo inválido ou corrompido."),
      );
    } finally {
      event.target.value = "";
      setIsBackupOptionsOpen(false);
    }
  };

  const handleDownloadCustomersImportTemplate = () => {
    triggerFileDownload(
      buildCustomersImportTemplateCsvContent(),
      getCustomersImportTemplateFileName(),
      "text/csv;charset=utf-8",
    );

    showSuccess(
      t(
        "settings.importSpreadsheet.templateDownloaded",
        "Modelo de planilha baixado",
      ),
      t(
        "settings.importSpreadsheet.templateDownloadedDescription",
        "Preencha o CSV e importe para cadastrar clientes em lote.",
      ),
    );
  };

  const handleCustomersImportInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    customersImportInputProps.onChange(event);
    event.target.value = "";
  };

  const handleSaveBackupPreferences = () => {
    if (settings.backup.autoBackupEnabled && !settings.backup.scheduledDays.length) {
      showError(
        t(
          "settings.backup.selectDays",
          "Selecione pelo menos um dia da semana para o backup automático",
        ),
      );
      return false;
    }

    if (
      settings.backup.autoBackupEnabled &&
      !BACKUP_TIME_PATTERN.test(settings.backup.scheduledTime)
    ) {
      showError(
        t(
          "settings.backup.invalidTime",
          "Defina um horário válido para o backup automático",
        ),
      );
      return false;
    }

    const next = mergeAppSettings({
      backup: settings.backup,
    });
    setSettings(next);
    showSuccess(
      t("settings.backup.preferencesSaved", "Preferências de backup salvas"),
    );
    return true;
  };

  const handlePasswordFieldChange =
    (field: keyof typeof passwordForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPasswordForm((previous) => ({
        ...previous,
        [field]: event.target.value,
      }));
    };

  const handleChangePassword = async () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      showError(
        t("settings.password.missingFields", "Preencha todos os campos da senha"),
      );
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showError(
        t(
          "settings.password.minLength",
          "A nova senha deve ter pelo menos 6 caracteres",
        ),
      );
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError(
        t(
          "settings.password.notMatch",
          "A confirmação de senha não corresponde à nova senha",
        ),
      );
      return;
    }

    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showSuccess(
        t("settings.password.updated", "Senha atualizada"),
        t("settings.password.updatedDescription", "Sua senha foi alterada com sucesso."),
      );
    } catch (error) {
      showError(
        t("settings.password.updateError", "Não foi possível atualizar a senha"),
      );
    }
  };

  return (
    <RefineListView
      title={t("settings.title", "Configurações")}
      headerButtons={() => (
        <Chip
          color="primary"
          variant="outlined"
          label={t("settings.subtitle", "Preferências do sistema")}
        />
      )}
    >
      <Grid container columns={24} spacing={5}>
        <Grid
          size={{
            xs: 24,
            md: 12,
          }}
        >
          <Card
            title={t("settings.profile.title", "Perfil")}
            icon={<ManageAccountsOutlinedIcon />}
            cardContentProps={{ sx: { p: 3 } }}
          >
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={settings.profile.avatarUrl}
                  sx={{ width: 72, height: 72 }}
                >
                  {getAvatarFallbackText(settings.profile.name)}
                </Avatar>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<PhotoCameraOutlinedIcon />}
                  disabled={isProfilePhotoUploading}
                >
                  {isProfilePhotoUploading
                    ? t("settings.profile.uploadingPhoto", "Enviando...")
                    : t("settings.profile.uploadPhoto", "Upload de Foto")}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                  />
                </Button>
              </Stack>

              <TextField
                label={t("settings.profile.name", "Nome")}
                value={settings.profile.name}
                fullWidth
                size="small"
                InputProps={{ readOnly: backendEnabled }}
                helperText={
                  backendEnabled
                    ? t(
                        "settings.profile.nameReadonly",
                        "Nome sincronizado com o ms-auth.",
                      )
                    : undefined
                }
              />
              <TextField
                label={t("settings.profile.email", "E-mail")}
                value={settings.profile.email}
                fullWidth
                size="small"
                InputProps={{ readOnly: backendEnabled }}
              />
              <TextField
                label={t("settings.profile.phone", "Telefone")}
                value={settings.profile.phone}
                onChange={handleProfileFieldChange("phone")}
                fullWidth
                size="small"
              />
              <TextField
                label={t("settings.profile.role", "Cargo")}
                value={settings.profile.role}
                fullWidth
                size="small"
                InputProps={{ readOnly: backendEnabled }}
              />

              <Box>
                <Button
                  variant="contained"
                  startIcon={<SaveOutlinedIcon />}
                  onClick={handleSaveProfile}
                >
                  {t("settings.profile.save", "Salvar Perfil")}
                </Button>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 24,
            md: 12,
          }}
        >
          <Card
            title={t("settings.importSpreadsheet.title", "Importar planilhas")}
            icon={<UploadFileOutlinedIcon />}
            cardContentProps={{ sx: { p: 3 } }}
          >
            <Stack spacing={2.5}>
              <Typography variant="body2" color="text.secondary">
                {t(
                  "settings.importSpreadsheet.description",
                  "Importe clientes em lote via CSV (Excel/Google Sheets) usando o import do Refine.",
                )}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={
                    isImportingCustomers ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <UploadFileOutlinedIcon />
                    )
                  }
                  disabled={isImportingCustomers}
                >
                  {isImportingCustomers
                    ? t("settings.importSpreadsheet.importing", "Importando...")
                    : t("settings.importSpreadsheet.selectFile", "Selecionar CSV")}
                  <input
                    hidden
                    type={customersImportInputProps.type}
                    accept={customersImportInputProps.accept}
                    onChange={handleCustomersImportInputChange}
                  />
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<FileDownloadOutlinedIcon />}
                  onClick={handleDownloadCustomersImportTemplate}
                  disabled={isImportingCustomers}
                >
                  {t(
                    "settings.importSpreadsheet.downloadTemplate",
                    "Baixar modelo CSV",
                  )}
                </Button>
              </Stack>

              {isImportingCustomers ? (
                <Chip
                  color="warning"
                  variant="outlined"
                  label={`${customersImportProgress.processedAmount}/${customersImportProgress.totalAmount || 0} registros processados`}
                  sx={{ width: "fit-content" }}
                />
              ) : null}

              {customersImportSummary ? (
                <Chip
                  color={customersImportSummary.failed ? "warning" : "success"}
                  variant="outlined"
                  label={`${customersImportSummary.imported} importados • ${customersImportSummary.failed} falhas`}
                  sx={{ width: "fit-content" }}
                />
              ) : null}

              <Typography variant="caption" color="text.secondary">
                {t(
                  "settings.importSpreadsheet.columns",
                  "Colunas padrão: name, phone, email, document, vehicleModel, vehiclePlate, address, notes, status. Também aceita aliases como nome, telefone, placa e situação.",
                )}
              </Typography>
            </Stack>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 24,
            md: 12,
          }}
        >
          <Card
            title={t("settings.branding.title", "Branding da Oficina")}
            icon={<BrandingWatermarkOutlinedIcon />}
            cardContentProps={{ sx: { p: 3 } }}
          >
            <Stack spacing={3}>
              <Box
                sx={{
                  border: (theme) => `1px dashed ${theme.palette.divider}`,
                  borderRadius: 2,
                  p: 2,
                  minHeight: 110,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: (theme) => theme.palette.background.default,
                }}
              >
                {settings.branding.workshopLogoUrl ? (
                  <Box
                    component="img"
                    src={settings.branding.workshopLogoUrl}
                    alt={t("settings.banner.previewAlt", "Pré-visualização do logo da oficina")}
                    sx={{
                      maxWidth: "100%",
                      maxHeight: 80,
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Typography color="text.secondary">
                    {t("settings.banner.empty", "Nenhum logo principal configurado")}
                  </Typography>
                )}
              </Box>

              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileOutlinedIcon />}
                disabled={isWorkshopLogoUploading}
              >
                {isWorkshopLogoUploading
                  ? t("settings.banner.uploading", "Enviando logo...")
                  : t("settings.banner.upload", "Upload do Logo da Oficina")}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleWorkshopLogoUpload}
                />
              </Button>

              <Divider />

              <Box
                sx={{
                  border: (theme) => `1px dashed ${theme.palette.divider}`,
                  borderRadius: 2,
                  p: 2,
                  minHeight: 110,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: (theme) => theme.palette.background.default,
                }}
              >
                {settings.branding.sidebarLogoUrl ? (
                  <Box
                    component="img"
                    src={settings.branding.sidebarLogoUrl}
                    alt={t("settings.branding.previewAlt", "Pré-visualização da logomarca")}
                    sx={{
                      maxWidth: "100%",
                      maxHeight: 80,
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Typography color="text.secondary">
                    {t("settings.branding.empty", "Nenhuma logomarca configurada")}
                  </Typography>
                )}
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadFileOutlinedIcon />}
                  disabled={isSidebarLogoUploading}
                >
                  {isSidebarLogoUploading
                    ? t("settings.branding.uploading", "Enviando...")
                    : t("settings.branding.upload", "Upload da Logo da Sidebar")}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleSidebarLogoUpload}
                  />
                </Button>
                <Button
                  variant="text"
                  color="error"
                  onClick={handleRemoveSidebarLogo}
                  disabled={!settings.branding.sidebarLogoUrl || backendEnabled}
                >
                  {t("settings.branding.remove", "Remover")}
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 24,
            md: 12,
          }}
        >
          <Card
            title={t("settings.backup.title", "Sistema de Backup")}
            icon={<BackupOutlinedIcon />}
            cardContentProps={{ sx: { p: 3 } }}
          >
            <Stack spacing={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.backup.autoBackupEnabled}
                    onChange={handleAutoBackupChange}
                  />
                }
                label={t("settings.backup.autoBackup", "Ativar backup automático")}
              />

              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  {t(
                    "settings.backup.days",
                    "Dias da semana para backup automático",
                  )}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {BACKUP_WEEK_DAYS.map((day) => {
                    const isSelected = settings.backup.scheduledDays.includes(day.value);

                    return (
                      <Chip
                        key={day.value}
                        label={day.shortLabel}
                        title={day.longLabel}
                        color={isSelected ? "primary" : "default"}
                        variant={isSelected ? "filled" : "outlined"}
                        disabled={!settings.backup.autoBackupEnabled}
                        onClick={() => handleToggleBackupDay(day.value)}
                      />
                    );
                  })}
                </Stack>

                <TextField
                  label={t("settings.backup.time", "Horário do backup")}
                  select
                  size="small"
                  value={settings.backup.scheduledTime}
                  onChange={handleBackupTimeChange}
                  disabled={!settings.backup.autoBackupEnabled}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 220 }}
                >
                  {BACKUP_TIME_OPTIONS.map((timeOption) => (
                    <MenuItem key={timeOption.value} value={timeOption.value}>
                      {timeOption.label}
                    </MenuItem>
                  ))}
                </TextField>
                <Typography variant="caption" color="text.secondary">
                  {t(
                    "settings.backup.timezone",
                    "Fuso horário local do navegador",
                  )}
                  : {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </Typography>
              </Stack>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t("settings.backup.lastBackup", "Último backup")}
                </Typography>
                <Typography>{lastBackupLabel}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t("settings.backup.nextBackup", "Próximo backup agendado")}
                </Typography>
                <Typography>{nextScheduledBackupLabel}</Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<BackupOutlinedIcon />}
                onClick={openBackupOptions}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("settings.backup.options", "Opções de Backup")}
              </Button>

              <Dialog
                open={isBackupOptionsOpen}
                onClose={closeBackupOptions}
                fullWidth
                maxWidth="sm"
              >
                <DialogTitle>
                  {t("settings.backup.optionsTitle", "Ações de Backup")}
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={1.5} sx={{ pt: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<FileDownloadOutlinedIcon />}
                      onClick={() => {
                        handleDownloadBackup();
                        closeBackupOptions();
                      }}
                      disabled={isDriveUploadPending}
                    >
                      {t("settings.backup.generate", "Gerar Backup JSON")}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownloadOutlinedIcon />}
                      onClick={() => {
                        handleDownloadBackupSpreadsheet();
                        closeBackupOptions();
                      }}
                      disabled={isDriveUploadPending}
                    >
                      {t("settings.backup.exportExcel", "Exportar Excel/Sheets")}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={
                        isDriveUploadPending ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <UploadFileOutlinedIcon />
                        )
                      }
                      onClick={() => {
                        void handleUploadBackupToGoogle("drive");
                      }}
                      disabled={isDriveUploadPending}
                    >
                      {t("settings.backup.saveDrive", "Salvar no Google Drive")}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={
                        isDriveUploadPending ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <UploadFileOutlinedIcon />
                        )
                      }
                      onClick={() => {
                        void handleUploadBackupToGoogle("sheets");
                      }}
                      disabled={isDriveUploadPending}
                    >
                      {t("settings.backup.saveSheets", "Gerar Google Sheets")}
                    </Button>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<UploadFileOutlinedIcon />}
                      disabled={isDriveUploadPending}
                    >
                      {t("settings.backup.restore", "Restaurar Backup")}
                      <input
                        hidden
                        type="file"
                        accept="application/json"
                        onChange={handleRestoreBackup}
                      />
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => {
                        const saved = handleSaveBackupPreferences();
                        if (saved) {
                          closeBackupOptions();
                        }
                      }}
                      disabled={isDriveUploadPending}
                    >
                      {t("settings.backup.savePreferences", "Salvar Preferências")}
                    </Button>
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button onClick={closeBackupOptions}>
                    {t("buttons.cancel", "Cancelar")}
                  </Button>
                </DialogActions>
              </Dialog>
            </Stack>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 24,
            md: 12,
          }}
        >
          <Card
            title={t("settings.password.title", "Alteração de Senha")}
            icon={<LockResetOutlinedIcon />}
            cardContentProps={{ sx: { p: 3 } }}
          >
            <Stack spacing={2}>
              <TextField
                label={t("settings.password.current", "Senha Atual")}
                type="password"
                size="small"
                value={passwordForm.currentPassword}
                onChange={handlePasswordFieldChange("currentPassword")}
                fullWidth
              />
              <TextField
                label={t("settings.password.new", "Nova Senha")}
                type="password"
                size="small"
                value={passwordForm.newPassword}
                onChange={handlePasswordFieldChange("newPassword")}
                fullWidth
              />
              <TextField
                label={t("settings.password.confirm", "Confirmar Nova Senha")}
                type="password"
                size="small"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordFieldChange("confirmPassword")}
                fullWidth
              />

              <Box>
                <Button
                  variant="contained"
                  onClick={handleChangePassword}
                  disabled={isUpdatingPassword}
                >
                  {t("settings.password.update", "Atualizar Senha")}
                </Button>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 24,
            md: 12,
          }}
        >
          <Card
            title={t("settings.banner.title", "Banner")}
            icon={<CampaignOutlinedIcon />}
            cardContentProps={{ sx: { p: 3 } }}
          >
            <Stack spacing={1.5}>
              <CompanyBanner
                logoSrc={
                  settings.branding.workshopLogoUrl ||
                  settings.branding.sidebarLogoUrl ||
                  "/logo-branco.svg"
                }
                logoAlt={t(
                  "settings.banner.previewAlt",
                  "Banner de apresentação da oficina",
                )}
                title={identity?.workshopName}
                subtitle={t(
                  "settings.banner.subtitle",
                  "Atendimento transparente, gestão rápida e controle completo das ordens de serviço.",
                )}
              />
              <Typography variant="caption" color="text.secondary">
                {t(
                  "settings.banner.caption",
                  "Banner oficial da empresa com identidade visual aplicada.",
                )}
              </Typography>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </RefineListView>
  );
};
