import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNotification, useTranslate } from "@refinedev/core";
import type { Worksheet } from "exceljs";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import PreviewOutlinedIcon from "@mui/icons-material/PreviewOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import {
  removeSharedServiceOrderByToken,
  SERVICE_ORDER_SIGNATURES_UPDATED_EVENT,
  readSharedServiceOrders,
  toSharedServiceOrdersFromRecords,
  type SharedServiceOrder,
} from "../../services/serviceOrderSignature";
import {
  removeServiceOrderApi,
  SERVICE_ORDERS_STORAGE_KEY,
  SERVICE_ORDERS_UPDATED_EVENT,
  isServiceOrdersBackendEnabled,
  listServiceOrdersApi,
  updateServiceOrderApi,
  type ServiceOrderRecord,
  type ServiceOrderRecordStatus,
} from "../../services/serviceOrders";
import {
  generateServiceOrderInsight,
  isServiceOrderGeminiConfigured,
  type ServiceOrderInsight,
} from "../../services/serviceOrderGemini";
import { Card, RefineListView } from "../../components";
import { useNavigate } from "react-router";

type HistoryRow = ServiceOrderRecord & {
  status: ServiceOrderRecordStatus;
  signatureText: string;
};

type HistoryStatusFilter =
  | "all"
  | "registered"
  | "sent_for_signature"
  | "closed"
  | "signed";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (value: string) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("pt-BR");
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Erro inesperado";
};

const STATUS_META: Record<
  ServiceOrderRecordStatus,
  {
    label: string;
    color: "default" | "warning" | "success";
  }
> = {
  registered: {
    label: "Cadastrada",
    color: "default",
  },
  sent_for_signature: {
    label: "Aguardando assinatura",
    color: "warning",
  },
  closed: {
    label: "Encerrada",
    color: "success",
  },
  signed: {
    label: "Assinada",
    color: "success",
  },
};

const isClosedStatus = (status: ServiceOrderRecordStatus) =>
  status === "closed" || status === "signed";

const getDeclinedItemsCount = (row: HistoryRow) =>
  row.parts.filter((part) => part.status === "declined").length +
  row.laborServices.filter((service) => service.status === "declined").length +
  row.thirdPartyServices.filter((service) => service.status === "declined").length;

type HistoryRowFinancialBreakdown = {
  partsApprovedValue: number;
  laborApprovedValue: number;
  thirdPartyApprovedValue: number;
  declinedValue: number;
};

const getHistoryRowFinancialBreakdown = (
  row: HistoryRow,
): HistoryRowFinancialBreakdown => {
  const partsApprovedValue = row.parts.reduce(
    (total, part) =>
      total + (part.status === "approved" ? part.quantity * part.unitPrice : 0),
    0,
  );
  const partsDeclinedValue = row.parts.reduce(
    (total, part) =>
      total + (part.status === "declined" ? part.quantity * part.unitPrice : 0),
    0,
  );

  const laborApprovedValue = row.laborServices.reduce(
    (total, service) => total + (service.status === "approved" ? service.amount : 0),
    0,
  );
  const laborDeclinedValue = row.laborServices.reduce(
    (total, service) => total + (service.status === "declined" ? service.amount : 0),
    0,
  );

  const thirdPartyApprovedValue = row.thirdPartyServices.reduce(
    (total, service) => total + (service.status === "approved" ? service.amount : 0),
    0,
  );
  const thirdPartyDeclinedValue = row.thirdPartyServices.reduce(
    (total, service) => total + (service.status === "declined" ? service.amount : 0),
    0,
  );

  return {
    partsApprovedValue,
    laborApprovedValue,
    thirdPartyApprovedValue,
    declinedValue:
      partsDeclinedValue + laborDeclinedValue + thirdPartyDeclinedValue,
  };
};

type SpreadsheetExportRow = {
  OS: string;
  Data: string;
  Cliente: string;
  Telefone: string;
  Veiculo: string;
  Placa: string;
  Mecanico: string;
  Status: string;
  Pecas: number;
  MaoDeObra: number;
  Terceiros: number;
  Desconto: number;
  Recusado: number;
  TotalOS: number;
};

const formatOrderDate = (value: string) => {
  if (!value) {
    return "-";
  }

  const parsed = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("pt-BR");
};

const buildSpreadsheetExportRows = (rows: HistoryRow[]): SpreadsheetExportRow[] =>
  rows.map((row) => {
    const breakdown = getHistoryRowFinancialBreakdown(row);

    return {
      OS: row.orderInfo.orderNumber || "-",
      Data: formatOrderDate(row.orderInfo.date),
      Cliente: row.orderInfo.customerName || "-",
      Telefone: row.orderInfo.phone || "-",
      Veiculo: row.orderInfo.vehicle || "-",
      Placa: row.orderInfo.plate || "-",
      Mecanico: row.orderInfo.mechanicResponsible || "-",
      Status: STATUS_META[row.status].label,
      Pecas: breakdown.partsApprovedValue,
      MaoDeObra: breakdown.laborApprovedValue,
      Terceiros: breakdown.thirdPartyApprovedValue,
      Desconto: row.discount,
      Recusado: breakdown.declinedValue,
      TotalOS: row.totals.grandTotal,
    };
  });

const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const EXCEL_CURRENCY_FORMAT = '"R$" #,##0.00;[Red]-"R$" #,##0.00';

const historyActionButtonSx = {
  width: 34,
  height: 34,
  border: "1px solid",
  borderColor: "divider",
  backgroundColor: "background.paper",
  "&:hover": {
    backgroundColor: "action.hover",
  },
};

const getDatePickerValue = (value: string): Dayjs | null => {
  if (!value) {
    return null;
  }

  const parsed = dayjs(`${value}T00:00:00`);
  return parsed.isValid() ? parsed : null;
};

const getDatePickerIsoValue = (value: Dayjs | null) =>
  value?.isValid() ? value.format("YYYY-MM-DD") : "";

const applyExcelHeaderStyle = (worksheet: Worksheet) => {
  const header = worksheet.getRow(1);
  header.height = 24;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FF1F2937" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEAF2FF" },
    };
    cell.alignment = { vertical: "middle" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFD8DEE9" } },
    };
  });
};

const applyExcelCurrencyFormat = (
  worksheet: Worksheet,
  columns: Array<string | number>,
) => {
  columns.forEach((columnKey) => {
    const column = worksheet.getColumn(columnKey);
    column.numFmt = EXCEL_CURRENCY_FORMAT;
    column.alignment = { horizontal: "right" };
  });
};

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getSearchableText = (row: HistoryRow) =>
  normalizeSearchText(
    [
      row.id,
      row.orderInfo.orderNumber,
      row.orderInfo.date,
      formatOrderDate(row.orderInfo.date),
      row.orderInfo.customerName,
      row.orderInfo.phone,
      row.orderInfo.vehicle,
      row.orderInfo.plate,
      row.orderInfo.year,
      row.orderInfo.km,
      row.orderInfo.mechanicResponsible,
      row.orderInfo.paymentMethod,
      row.orderInfo.notes,
      STATUS_META[row.status].label,
      isClosedStatus(row.status) ? "fechada fechado encerrada encerrado" : "",
      row.status === "signed" ? "assinada assinado" : "",
      ...Object.entries(row.checklist)
        .filter(([, checked]) => checked)
        .map(([item]) => item),
    ].join(" "),
  );

const matchesHistoryStatus = (row: HistoryRow, filter: HistoryStatusFilter) => {
  if (filter === "all") {
    return true;
  }

  return row.status === filter;
};

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const openPrintWindow = (
  title: string,
  body: string,
  options: { autoPrint?: boolean } = {},
) => {
  const autoPrint = options.autoPrint ?? true;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    return false;
  }

  printWindow.opener = null;
  printWindow.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
          h1, h2, h3 { margin: 0 0 12px; }
          p { margin: 4px 0; }
          .preview-toolbar { display: flex; gap: 8px; justify-content: flex-end; margin-bottom: 24px; }
          .preview-toolbar button { border: 1px solid #9ca3af; border-radius: 6px; background: #fff; color: #111827; cursor: pointer; font-size: 14px; padding: 8px 12px; }
          .preview-toolbar button.primary { background: #111827; border-color: #111827; color: #fff; }
          .muted { color: #4b5563; }
          .section { margin-top: 20px; }
          .grid { display: grid; gap: 8px 20px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; }
          td.number, th.number { text-align: right; }
          .totals { margin-top: 16px; display: grid; gap: 8px; justify-content: end; }
          @media print { body { margin: 18px; } .preview-toolbar { display: none; } }
        </style>
      </head>
      <body>
        ${
          autoPrint
            ? ""
            : `<div class="preview-toolbar">
                <button type="button" onclick="window.close()">Fechar</button>
                <button type="button" class="primary" onclick="window.print()">Imprimir</button>
              </div>`
        }
        ${body}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  if (autoPrint) {
    printWindow.print();
  }
  return true;
};

export const ServiceOrderHistoryPage: React.FC = () => {
  const t = useTranslate();
  const { open } = useNotification();
  const navigate = useNavigate();
  const serviceOrdersBackendEnabled = isServiceOrdersBackendEnabled();

  const [records, setRecords] = useState<ServiceOrderRecord[]>([]);
  const [sharedOrders, setSharedOrders] = useState<SharedServiceOrder[]>(() =>
    readSharedServiceOrders(),
  );
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>("all");
  const [mechanicFilter, setMechanicFilter] = useState("all");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [selectedRow, setSelectedRow] = useState<HistoryRow | null>(null);
  const [insightQuestion, setInsightQuestion] = useState("");
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [insight, setInsight] = useState<ServiceOrderInsight | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [reopeningOrderId, setReopeningOrderId] = useState<string | null>(null);
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);
  const [isExportingSpreadsheet, setIsExportingSpreadsheet] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);

  const loadRecords = async (showError = false) => {
    try {
      const response = await listServiceOrdersApi();
      setRecords(response);
      if (serviceOrdersBackendEnabled) {
        setSharedOrders(toSharedServiceOrdersFromRecords(response));
      }
    } catch (error) {
      if (!showError) {
        return;
      }

      open?.({
        type: "error",
        message: "Falha ao carregar histórico de OS",
        description: getErrorMessage(error),
      });
    }
  };

  useEffect(() => {
    void loadRecords(true);
  }, []);

  useEffect(() => {
    if (serviceOrdersBackendEnabled) {
      return;
    }

    const refresh = () => {
      void loadRecords();
    };

    const handleOrdersUpdate: EventListener = () => {
      refresh();
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (!event.key || event.key === SERVICE_ORDERS_STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener(SERVICE_ORDERS_UPDATED_EVENT, handleOrdersUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(SERVICE_ORDERS_UPDATED_EVENT, handleOrdersUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [serviceOrdersBackendEnabled]);

  useEffect(() => {
    const refresh = () => {
      setSharedOrders(readSharedServiceOrders());
    };

    const handleSharedUpdate: EventListener = () => {
      refresh();
    };

    const handleStorageUpdate = () => {
      refresh();
    };

    window.addEventListener(
      SERVICE_ORDER_SIGNATURES_UPDATED_EVENT,
      handleSharedUpdate,
    );
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(
        SERVICE_ORDER_SIGNATURES_UPDATED_EVENT,
        handleSharedUpdate,
      );
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  const rows = useMemo<HistoryRow[]>(() => {
    const sharedByToken = new Map(sharedOrders.map((order) => [order.token, order]));

    return records.map((record) => {
      const linkedSharedOrder = record.signature?.token
        ? sharedByToken.get(record.signature.token)
        : undefined;

      const status: ServiceOrderRecordStatus =
        linkedSharedOrder?.status === "signed"
          ? "signed"
          : record.status === "signed"
            ? "signed"
            : record.status === "closed"
              ? "closed"
              : linkedSharedOrder ||
                  record.signature ||
                  record.status === "sent_for_signature"
                ? "sent_for_signature"
                : "registered";

      const signerName = linkedSharedOrder?.signature?.name || record.signature?.signerName;
      const signedAt = linkedSharedOrder?.signature?.signedAt || record.signature?.signedAt;
      const signatureText =
        signerName && signedAt ? `${signerName} • ${formatDate(signedAt)}` : "-";

      return {
        ...record,
        status,
        signatureText,
        parts: linkedSharedOrder?.parts ?? record.parts,
        laborServices: linkedSharedOrder?.laborServices ?? record.laborServices,
        thirdPartyServices:
          linkedSharedOrder?.thirdPartyServices ?? record.thirdPartyServices,
        totals: linkedSharedOrder?.totals
          ? { ...record.totals, ...linkedSharedOrder.totals }
          : record.totals,
      };
    });
  }, [records, sharedOrders]);

  const mechanicOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.orderInfo.mechanicResponsible.trim())
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right, "pt-BR")),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const queryTokens = normalizeSearchText(searchValue.trim())
      .split(/\s+/)
      .filter(Boolean);

    return rows.filter((row) => {
      if (!matchesHistoryStatus(row, statusFilter)) {
        return false;
      }

      if (
        mechanicFilter !== "all" &&
        row.orderInfo.mechanicResponsible !== mechanicFilter
      ) {
        return false;
      }

      if (periodStart && (!row.orderInfo.date || row.orderInfo.date < periodStart)) {
        return false;
      }

      if (periodEnd && (!row.orderInfo.date || row.orderInfo.date > periodEnd)) {
        return false;
      }

      if (!queryTokens.length) {
        return true;
      }

      const searchableText = getSearchableText(row);
      return queryTokens.every((token) => searchableText.includes(token));
    });
  }, [mechanicFilter, periodEnd, periodStart, rows, searchValue, statusFilter]);

  useEffect(() => {
    setHistoryPage(0);
  }, [mechanicFilter, periodEnd, periodStart, searchValue, statusFilter]);

  const visibleHistoryRows = useMemo(
    () =>
      filteredRows.slice(
        historyPage * historyRowsPerPage,
        historyPage * historyRowsPerPage + historyRowsPerPage,
      ),
    [filteredRows, historyPage, historyRowsPerPage],
  );

  useEffect(() => {
    const maxPage = Math.max(
      0,
      Math.ceil(filteredRows.length / historyRowsPerPage) - 1,
    );
    if (historyPage > maxPage) {
      setHistoryPage(maxPage);
    }
  }, [filteredRows.length, historyPage, historyRowsPerPage]);

  const hasActiveHistoryFilters =
    Boolean(searchValue.trim()) ||
    statusFilter !== "all" ||
    mechanicFilter !== "all" ||
    Boolean(periodStart) ||
    Boolean(periodEnd);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.totalOrders += 1;
        acc.totalValue += row.totals.grandTotal;

        if (isClosedStatus(row.status)) {
          acc.signed += 1;
        } else if (row.status === "sent_for_signature") {
          acc.pendingSignature += 1;
        }

        acc.refusedItems += getDeclinedItemsCount(row);
        return acc;
      },
      {
        totalOrders: 0,
        signed: 0,
        pendingSignature: 0,
        refusedItems: 0,
        totalValue: 0,
      },
    );
  }, [rows]);

  const spreadsheetSummary = useMemo(() => {
    const totals = filteredRows.reduce(
      (acc, row) => {
        const breakdown = getHistoryRowFinancialBreakdown(row);

        acc.partsApprovedValue += breakdown.partsApprovedValue;
        acc.laborApprovedValue += breakdown.laborApprovedValue;
        acc.thirdPartyApprovedValue += breakdown.thirdPartyApprovedValue;
        acc.discountValue += row.discount;
        acc.declinedValue += breakdown.declinedValue;
        acc.grandTotal += row.totals.grandTotal;
        return acc;
      },
      {
        partsApprovedValue: 0,
        laborApprovedValue: 0,
        thirdPartyApprovedValue: 0,
        discountValue: 0,
        declinedValue: 0,
        grandTotal: 0,
      },
    );

    return {
      ...totals,
      totalOrders: filteredRows.length,
      averageTicket: filteredRows.length
        ? (totals.laborApprovedValue + totals.thirdPartyApprovedValue) /
          filteredRows.length
        : 0,
      servicesRevenue:
        totals.laborApprovedValue + totals.thirdPartyApprovedValue,
      partsRevenue: totals.partsApprovedValue,
    };
  }, [filteredRows]);

  const handleExportSpreadsheet = async () => {
    if (!filteredRows.length) {
      open?.({
        type: "error",
        message: "Não há ordens no filtro para exportar",
      });
      return;
    }

    try {
      setIsExportingSpreadsheet(true);
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const exportRows = buildSpreadsheetExportRows(filteredRows);

      workbook.creator = "Prevent AutoCenter";
      workbook.created = new Date();
      workbook.modified = new Date();

      const summaryWorksheet = workbook.addWorksheet("Resumo", {
        views: [{ showGridLines: false }],
      });
      summaryWorksheet.columns = [
        { header: "Indicador", key: "indicator", width: 30 },
        { header: "Valor", key: "value", width: 20 },
      ];
      summaryWorksheet.addRows([
        { indicator: "OS no filtro", value: spreadsheetSummary.totalOrders },
        {
          indicator: "Ticket médio mão de obra",
          value: spreadsheetSummary.averageTicket,
        },
        { indicator: "Receita peças", value: spreadsheetSummary.partsRevenue },
        {
          indicator: "Receita mão de obra",
          value: spreadsheetSummary.servicesRevenue,
        },
        { indicator: "Valor recusado", value: spreadsheetSummary.declinedValue },
        { indicator: "Descontos", value: spreadsheetSummary.discountValue },
        { indicator: "Total aprovado", value: spreadsheetSummary.grandTotal },
      ]);
      applyExcelHeaderStyle(summaryWorksheet);
      ["B3", "B4", "B5", "B6", "B7", "B8"].forEach((cellAddress) => {
        summaryWorksheet.getCell(cellAddress).numFmt = EXCEL_CURRENCY_FORMAT;
        summaryWorksheet.getCell(cellAddress).alignment = { horizontal: "right" };
      });

      const ordersWorksheet = workbook.addWorksheet("Ordens", {
        views: [{ state: "frozen", ySplit: 1 }],
      });
      ordersWorksheet.columns = [
        { header: "OS", key: "OS", width: 16 },
        { header: "Data", key: "Data", width: 12 },
        { header: "Cliente", key: "Cliente", width: 30 },
        { header: "Telefone", key: "Telefone", width: 16 },
        { header: "Veículo", key: "Veiculo", width: 24 },
        { header: "Placa", key: "Placa", width: 12 },
        { header: "Mecânico", key: "Mecanico", width: 24 },
        { header: "Status", key: "Status", width: 22 },
        { header: "Peças", key: "Pecas", width: 14 },
        { header: "Mão de obra", key: "MaoDeObra", width: 14 },
        { header: "Terceiros", key: "Terceiros", width: 14 },
        { header: "Desconto", key: "Desconto", width: 14 },
        { header: "Recusado", key: "Recusado", width: 14 },
        { header: "Total OS", key: "TotalOS", width: 14 },
      ];
      ordersWorksheet.addRows(exportRows);
      ordersWorksheet.autoFilter = {
        from: "A1",
        to: "N1",
      };
      applyExcelHeaderStyle(ordersWorksheet);
      applyExcelCurrencyFormat(ordersWorksheet, [
        "Pecas",
        "MaoDeObra",
        "Terceiros",
        "Desconto",
        "Recusado",
        "TotalOS",
      ]);
      ordersWorksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          return;
        }

        row.height = 22;
        row.eachCell((cell) => {
          cell.alignment = {
            ...cell.alignment,
            vertical: "middle",
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: EXCEL_MIME_TYPE });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analise-os-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      open?.({
        type: "success",
        message: "Planilha Excel exportada",
        description: `${exportRows.length} OS incluída(s) no arquivo.`,
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao exportar planilha Excel",
        description: getErrorMessage(error),
      });
    } finally {
      setIsExportingSpreadsheet(false);
    }
  };

  const handlePrintReport = () => {
    if (!filteredRows.length) {
      open?.({
        type: "error",
        message: "Não há ordens no filtro para imprimir",
      });
      return;
    }

    const body = `
      <h1>Relatório de Ordens de Serviço</h1>
      <p class="muted">Gerado a partir dos filtros aplicados no histórico.</p>
      <div class="section grid">
        <p><strong>OS no filtro:</strong> ${escapeHtml(spreadsheetSummary.totalOrders)}</p>
        <p><strong>Total aprovado:</strong> ${escapeHtml(formatCurrency(spreadsheetSummary.grandTotal))}</p>
        <p><strong>Peças:</strong> ${escapeHtml(formatCurrency(spreadsheetSummary.partsApprovedValue))}</p>
        <p><strong>Mão de obra:</strong> ${escapeHtml(formatCurrency(spreadsheetSummary.laborApprovedValue))}</p>
        <p><strong>Terceiros:</strong> ${escapeHtml(formatCurrency(spreadsheetSummary.thirdPartyApprovedValue))}</p>
        <p><strong>Recusado:</strong> ${escapeHtml(formatCurrency(spreadsheetSummary.declinedValue))}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>OS</th>
            <th>Data</th>
            <th>Cliente</th>
            <th>Mecânico</th>
            <th class="number">Peças</th>
            <th class="number">Mão de obra</th>
            <th class="number">Terceiros</th>
            <th class="number">Total</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRows
            .map((row) => {
              const breakdown = getHistoryRowFinancialBreakdown(row);
              return `
                <tr>
                  <td>#${escapeHtml(row.orderInfo.orderNumber || "-")}</td>
                  <td>${escapeHtml(formatOrderDate(row.orderInfo.date))}</td>
                  <td>${escapeHtml(row.orderInfo.customerName || "-")}</td>
                  <td>${escapeHtml(row.orderInfo.mechanicResponsible || "-")}</td>
                  <td class="number">${escapeHtml(formatCurrency(breakdown.partsApprovedValue))}</td>
                  <td class="number">${escapeHtml(formatCurrency(breakdown.laborApprovedValue))}</td>
                  <td class="number">${escapeHtml(formatCurrency(breakdown.thirdPartyApprovedValue))}</td>
                  <td class="number">${escapeHtml(formatCurrency(row.totals.grandTotal))}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    `;

    if (!openPrintWindow("Relatório de Ordens de Serviço", body)) {
      open?.({
        type: "error",
        message: "O navegador bloqueou a janela de impressão",
      });
    }
  };

  const buildServiceOrderPrintBody = (row: HistoryRow) => {
    const breakdown = getHistoryRowFinancialBreakdown(row);
    return `
      <h1>Ordem de Serviço #${escapeHtml(row.orderInfo.orderNumber || "-")}</h1>
      <div class="section grid">
        <p><strong>Cliente:</strong> ${escapeHtml(row.orderInfo.customerName || "-")}</p>
        <p><strong>Data:</strong> ${escapeHtml(formatOrderDate(row.orderInfo.date))}</p>
        <p><strong>Telefone:</strong> ${escapeHtml(row.orderInfo.phone || "-")}</p>
        <p><strong>Mecânico:</strong> ${escapeHtml(row.orderInfo.mechanicResponsible || "-")}</p>
        <p><strong>Veículo:</strong> ${escapeHtml(row.orderInfo.vehicle || "-")}</p>
        <p><strong>Placa:</strong> ${escapeHtml(row.orderInfo.plate || "-")}</p>
      </div>
      <div class="section">
        <h2>Resumo financeiro</h2>
        <div class="grid">
          <p><strong>Peças:</strong> ${escapeHtml(formatCurrency(breakdown.partsApprovedValue))}</p>
          <p><strong>Mão de obra:</strong> ${escapeHtml(formatCurrency(breakdown.laborApprovedValue))}</p>
          <p><strong>Terceiros:</strong> ${escapeHtml(formatCurrency(breakdown.thirdPartyApprovedValue))}</p>
          <p><strong>Total OS:</strong> ${escapeHtml(formatCurrency(row.totals.grandTotal))}</p>
        </div>
      </div>
      <div class="section">
        <h2>Observações</h2>
        <p>${escapeHtml(row.orderInfo.notes || "-")}</p>
      </div>
    `;
  };

  const handlePreviewPrintServiceOrder = (row: HistoryRow) => {
    const body = buildServiceOrderPrintBody(row);

    if (
      !openPrintWindow(`Prévia da OS ${row.orderInfo.orderNumber || row.id}`, body, {
        autoPrint: false,
      })
    ) {
      open?.({
        type: "error",
        message: "O navegador bloqueou a janela de prévia",
      });
    }
  };

  const handlePrintServiceOrder = (row: HistoryRow) => {
    const body = buildServiceOrderPrintBody(row);

    if (!openPrintWindow(`OS ${row.orderInfo.orderNumber || row.id}`, body)) {
      open?.({
        type: "error",
        message: "O navegador bloqueou a janela de impressão",
      });
    }
  };

  const handlePeriodStartChange = (value: Dayjs | null) => {
    const nextStart = getDatePickerIsoValue(value);
    setPeriodStart(nextStart);
    if (nextStart && periodEnd && periodEnd < nextStart) {
      setPeriodEnd(nextStart);
    }
  };

  const handlePeriodEndChange = (value: Dayjs | null) => {
    setPeriodEnd(getDatePickerIsoValue(value));
  };

  const handleHistoryRowsPerPageChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setHistoryRowsPerPage(Number.parseInt(event.target.value, 10));
    setHistoryPage(0);
  };

  const handleClearHistoryFilters = () => {
    setSearchValue("");
    setStatusFilter("all");
    setMechanicFilter("all");
    setPeriodStart("");
    setPeriodEnd("");
  };

  const handleGenerateInsight = async () => {
    try {
      setIsGeneratingInsight(true);
      const generated = await generateServiceOrderInsight(
        rows,
        insightQuestion.trim(),
      );
      setInsight(generated);
      open?.({
        type: "success",
        message:
          generated.provider === "gemini"
            ? "Análise IA gerada com Gemini"
            : "Análise gerada com fallback local",
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Falha ao gerar análise",
        description: getErrorMessage(error),
      });
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const handleDeleteRecord = async (row: HistoryRow) => {
    if (isClosedStatus(row.status)) {
      open?.({
        type: "error",
        message: "Reabra a OS antes de excluir",
      });
      return;
    }

    const orderLabel = row.orderInfo.orderNumber || row.id.slice(0, 8);
    const confirmed = window.confirm(
      `Deseja excluir a OS #${orderLabel}? Essa ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingOrderId(row.id);

      const removed = await removeServiceOrderApi(row.id);
      if (!removed) {
        open?.({
          type: "error",
          message: "Não foi possível excluir a OS",
        });
        return;
      }

      if (!serviceOrdersBackendEnabled && row.signature?.token) {
        removeSharedServiceOrderByToken(row.signature.token);
      }

      if (selectedRow?.id === row.id) {
        setSelectedRow(null);
      }

      await loadRecords();
      if (!serviceOrdersBackendEnabled) {
        setSharedOrders(readSharedServiceOrders());
      }

      open?.({
        type: "success",
        message: `OS #${orderLabel} excluída com sucesso`,
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Erro ao excluir OS",
        description: getErrorMessage(error),
      });
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleCloseRecord = async (row: HistoryRow) => {
    if (isClosedStatus(row.status)) {
      open?.({
        type: "error",
        message: "Esta OS já está encerrada",
      });
      return;
    }

    const orderLabel = row.orderInfo.orderNumber || row.id.slice(0, 8);
    const confirmed = window.confirm(
      `Deseja encerrar a OS #${orderLabel}? Após o encerramento, edição e exclusão serão bloqueadas até a reabertura.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setClosingOrderId(row.id);

      const closed = await updateServiceOrderApi(row.id, {
        status: "closed",
        orderInfo: row.orderInfo,
        checklist: row.checklist,
        parts: row.parts,
        laborServices: row.laborServices,
        thirdPartyServices: row.thirdPartyServices,
        discount: row.discount,
        totals: row.totals,
        signature: row.signature,
      });

      if (!closed) {
        open?.({
          type: "error",
          message: "Não foi possível encerrar a OS",
        });
        return;
      }

      await loadRecords();

      setSelectedRow((current) =>
        current?.id === row.id
          ? {
              ...current,
              ...closed,
              status: "closed",
            }
          : current,
      );

      open?.({
        type: "success",
        message: `OS #${orderLabel} encerrada com sucesso`,
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Erro ao encerrar OS",
        description: getErrorMessage(error),
      });
    } finally {
      setClosingOrderId(null);
    }
  };

  const handleReopenRecord = async (row: HistoryRow) => {
    const orderLabel = row.orderInfo.orderNumber || row.id.slice(0, 8);
    const confirmed = window.confirm(
      `Deseja reabrir a OS #${orderLabel}? Ela voltará para cadastrada e a assinatura será removida.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setReopeningOrderId(row.id);

      const reopened = await updateServiceOrderApi(row.id, {
        status: "registered",
        orderInfo: row.orderInfo,
        checklist: row.checklist,
        parts: row.parts,
        laborServices: row.laborServices,
        thirdPartyServices: row.thirdPartyServices,
        discount: row.discount,
        totals: row.totals,
        signature: null,
      });

      if (!reopened) {
        open?.({
          type: "error",
          message: "Não foi possível reabrir a OS",
        });
        return;
      }

      if (!serviceOrdersBackendEnabled && row.signature?.token) {
        removeSharedServiceOrderByToken(row.signature.token);
      }

      await loadRecords();
      if (!serviceOrdersBackendEnabled) {
        setSharedOrders(readSharedServiceOrders());
      }

      setSelectedRow((current) =>
        current?.id === row.id
          ? {
              ...current,
              ...reopened,
              status: "registered",
              signatureText: "-",
            }
          : current,
      );

      open?.({
        type: "success",
        message: `OS #${orderLabel} reaberta com sucesso`,
      });
    } catch (error) {
      open?.({
        type: "error",
        message: "Erro ao reabrir OS",
        description: getErrorMessage(error),
      });
    } finally {
      setReopeningOrderId(null);
    }
  };

  const renderHistoryActions = (
    row: HistoryRow,
    options?: {
      justifyContent?: "flex-start" | "flex-end" | "center";
    },
  ) => (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      justifyContent={options?.justifyContent ?? "flex-end"}
      flexWrap="wrap"
      useFlexGap
    >
      <Tooltip title="Editar OS">
        <span>
          <IconButton
            size="small"
            color="primary"
            disabled={isClosedStatus(row.status)}
            onClick={() =>
              navigate(
                `/ordem-servico?serviceOrderId=${encodeURIComponent(row.id)}`,
              )
            }
            sx={historyActionButtonSx}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Visualizar OS">
        <span>
          <IconButton
            size="small"
            color="primary"
            onClick={() => setSelectedRow(row)}
            sx={historyActionButtonSx}
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Prévia da impressão">
        <span>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handlePreviewPrintServiceOrder(row)}
            sx={historyActionButtonSx}
          >
            <PreviewOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Imprimir OS">
        <span>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handlePrintServiceOrder(row)}
            sx={historyActionButtonSx}
          >
            <PrintOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      {!isClosedStatus(row.status) ? (
        <Tooltip
          title={closingOrderId === row.id ? "Encerrando OS" : "Encerrar OS"}
        >
          <span>
            <IconButton
              size="small"
              color="success"
              disabled={closingOrderId === row.id}
              onClick={() => {
                void handleCloseRecord(row);
              }}
              sx={historyActionButtonSx}
            >
              {closingOrderId === row.id ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CheckCircleOutlineOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      ) : null}
      {isClosedStatus(row.status) ? (
        <Tooltip
          title={reopeningOrderId === row.id ? "Reabrindo OS" : "Reabrir OS"}
        >
          <span>
            <IconButton
              size="small"
              color="warning"
              disabled={reopeningOrderId === row.id}
              onClick={() => {
                void handleReopenRecord(row);
              }}
              sx={historyActionButtonSx}
            >
              {reopeningOrderId === row.id ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <AutorenewOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      ) : null}
      <Tooltip title={deletingOrderId === row.id ? "Excluindo OS" : "Excluir OS"}>
        <span>
          <IconButton
            size="small"
            color="error"
            disabled={isClosedStatus(row.status) || deletingOrderId === row.id}
            onClick={() => {
              void handleDeleteRecord(row);
            }}
            sx={historyActionButtonSx}
          >
            {deletingOrderId === row.id ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <DeleteOutlineOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );

  return (
    <RefineListView
      canCreate={false}
      title={t("serviceOrder.history", "Histórico de Ordens")}
      headerButtons={() => (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            size="small"
            color="success"
            variant="outlined"
            label={`${summary.signed} fechadas`}
          />
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            label={`${summary.pendingSignature} pendentes`}
          />
          <Chip
            size="small"
            color="default"
            variant="outlined"
            label={`${summary.refusedItems} recusas`}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<PrintOutlinedIcon fontSize="small" />}
            onClick={handlePrintReport}
          >
            Imprimir relatório
          </Button>
        </Stack>
      )}
    >
      <Stack spacing={3}>
        <Card
          title="Análise IA Gemini"
          icon={<AutoAwesomeOutlinedIcon />}
          cardContentProps={{ sx: { p: 3 } }}
        >
          <Stack spacing={1.5} padding={3}>
            <TextField
              fullWidth
              size="small"
              label="Pergunta para a IA"
              value={insightQuestion}
              onChange={(event) => setInsightQuestion(event.target.value)}
              placeholder="Ex: Quais itens da planilha têm maior recusa e como reduzir?"
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                startIcon={<AutoAwesomeOutlinedIcon />}
                onClick={() => {
                  void handleGenerateInsight();
                }}
                disabled={isGeneratingInsight}
              >
                {isGeneratingInsight ? "Gerando análise..." : "Gerar análise"}
              </Button>
              {isGeneratingInsight ? <CircularProgress size={18} /> : null}
            </Stack>

            {insight ? (
              <Paper variant="outlined" sx={{ p: 2, whiteSpace: "pre-wrap" }}>
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary">
                    Gerado em {formatDate(insight.generatedAt)} •{" "}
                    {insight.provider === "gemini"
                      ? "Gemini"
                      : "Fallback local"}
                  </Typography>
                  <Typography variant="body2">{insight.text}</Typography>
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        </Card>

        <Grid container columns={24} spacing={2} padding={1}>
          <Grid size={{ xs: 24, md: 8 }}>
            <Card
              title="Ordens"
              icon={<HistoryOutlinedIcon />}
              cardContentProps={{ sx: { p: 2.5 } }}
            >
              <Typography variant="h4" fontWeight={800}>
                {summary.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de ordens registradas.
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 24, md: 8 }}>
            <Card
              title="Valor Aprovado"
              icon={<MonetizationOnOutlinedIcon />}
              cardContentProps={{ sx: { p: 2.5 } }}
            >
              <Typography variant="h4" fontWeight={800}>
                {formatCurrency(summary.totalValue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Soma dos totais aprovados em OS.
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 24, md: 8 }}>
            <Card
              title="Itens Recusados"
              icon={<RuleOutlinedIcon />}
              cardContentProps={{ sx: { p: 2.5 } }}
            >
              <Typography variant="h4" fontWeight={800}>
                {summary.refusedItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Peças e serviços recusados por clientes.
              </Typography>
            </Card>
          </Grid>
        </Grid>

        <Card
          title="Planilha gerencial de OS"
          icon={<HistoryOutlinedIcon />}
          cardHeaderProps={{
            action: (
              <Button
                size="small"
                variant="contained"
                startIcon={
                  isExportingSpreadsheet ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <FileDownloadOutlinedIcon fontSize="small" />
                  )
                }
                onClick={() => {
                  void handleExportSpreadsheet();
                }}
                disabled={!filteredRows.length || isExportingSpreadsheet}
              >
                {isExportingSpreadsheet ? "Exportando..." : "Exportar Excel"}
              </Button>
            ),
          }}
          cardContentProps={{ sx: { p: 0 } }}
        >
          <Stack spacing={1.5} sx={{ p: 2 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
            >
              <Typography variant="body2" color="text.secondary">
                Recorte financeiro das OS do histórico conforme os filtros aplicados.
              </Typography>
              <Chip
                size="small"
                color="default"
                variant="outlined"
                label="Arquivo .xlsx com resumo e ordens"
              />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                size="small"
                color="primary"
                variant="filled"
                label={`${spreadsheetSummary.totalOrders} OS no filtro`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`Ticket médio: ${formatCurrency(spreadsheetSummary.averageTicket)}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`Receita peças: ${formatCurrency(spreadsheetSummary.partsRevenue)}`}
              />
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={`Receita mão de obra: ${formatCurrency(spreadsheetSummary.servicesRevenue)}`}
              />
              <Chip
                size="small"
                color="default"
                variant="outlined"
                label={`Valor recusado: ${formatCurrency(spreadsheetSummary.declinedValue)}`}
              />
            </Stack>
          </Stack>
          <Divider />
          <TableContainer
            sx={{
              maxHeight: 420,
              scrollbarWidth: "thin",
              scrollbarColor: (theme) =>
                `${alpha(theme.palette.text.primary, 0.28)} transparent`,
              "&::-webkit-scrollbar": {
                width: 6,
                height: 6,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.24),
                borderRadius: 999,
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.38),
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "transparent",
              },
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      backgroundColor: "background.paper",
                      fontWeight: 700,
                    },
                  }}
                >
                  <TableCell>OS</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Veículo / Placa</TableCell>
                  <TableCell align="right">Peças</TableCell>
                  <TableCell align="right">Mão de obra</TableCell>
                  <TableCell align="right">Terceiros</TableCell>
                  <TableCell align="right">Desconto</TableCell>
                  <TableCell align="right">Recusado</TableCell>
                  <TableCell align="right">Total OS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length ? (
                  filteredRows.map((row) => {
                    const breakdown = getHistoryRowFinancialBreakdown(row);
                    return (
                      <TableRow key={`sheet-${row.id}`} hover>
                        <TableCell>#{row.orderInfo.orderNumber || "-"}</TableCell>
                        <TableCell>{formatOrderDate(row.orderInfo.date)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap title={row.orderInfo.customerName}>
                            {row.orderInfo.customerName || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            noWrap
                            title={`${row.orderInfo.vehicle || "-"} / ${row.orderInfo.plate || "-"}`}
                          >
                            {row.orderInfo.vehicle || "-"} / {row.orderInfo.plate || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(breakdown.partsApprovedValue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(breakdown.laborApprovedValue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(breakdown.thirdPartyApprovedValue)}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(row.discount)}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(breakdown.declinedValue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(row.totals.grandTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma ordem encontrada com os filtros atuais.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {filteredRows.length ? (
                  <TableRow
                    sx={{
                      backgroundColor: (theme) => theme.palette.action.hover,
                      "& .MuiTableCell-root": {
                        borderTop: "1px solid",
                        borderColor: "divider",
                      },
                    }}
                  >
                    <TableCell colSpan={4}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Totais do filtro
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatCurrency(spreadsheetSummary.partsApprovedValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatCurrency(spreadsheetSummary.laborApprovedValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatCurrency(spreadsheetSummary.thirdPartyApprovedValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatCurrency(spreadsheetSummary.discountValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatCurrency(spreadsheetSummary.declinedValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatCurrency(spreadsheetSummary.grandTotal)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card
          title="Tabela de Histórico"
          icon={<HistoryOutlinedIcon />}
          cardContentProps={{ sx: { p: 0 } }}
          
        >
          <Box
            sx={{
              px: 0,
              py: 1.25,
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.025),
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="pt-br"
            >
              <Grid container columns={24} spacing={1.25} alignItems="center">
                <Grid size={{ xs: 24, lg: 7 }}>
                  <TextField
                    size="small"
                    label="Buscar"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="OS, cliente, telefone, carro, placa ou mecânico"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlinedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 24, sm: 12, lg: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Status"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as HistoryStatusFilter)
                    }
                  >
                    <MenuItem value="all">Todas as OS</MenuItem>
                    <MenuItem value="registered">Cadastrada</MenuItem>
                    <MenuItem value="sent_for_signature">
                      Aguardando assinatura
                    </MenuItem>
                    <MenuItem value="closed">Encerrada</MenuItem>
                    <MenuItem value="signed">Assinada</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 24, sm: 12, lg: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Mecânico"
                    value={mechanicFilter}
                    onChange={(event) => setMechanicFilter(event.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {mechanicOptions.map((mechanic) => (
                      <MenuItem key={mechanic} value={mechanic}>
                        {mechanic}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 24, sm: 12, lg: 3 }}>
                  <DatePicker
                    label="Período inicial"
                    format="DD/MM/YYYY"
                    value={getDatePickerValue(periodStart)}
                    onChange={handlePeriodStartChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 24, sm: 12, lg: 3 }}>
                  <DatePicker
                    label="Período final"
                    format="DD/MM/YYYY"
                    value={getDatePickerValue(periodEnd)}
                    onChange={handlePeriodEndChange}
                    minDate={getDatePickerValue(periodStart) ?? undefined}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 24, lg: 3 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<RestartAltOutlinedIcon fontSize="small" />}
                    onClick={handleClearHistoryFilters}
                    disabled={!hasActiveHistoryFilters}
                    sx={{
                      minHeight: 40,
                      textTransform: "none",
                    }}
                  >
                    Limpar filtros
                  </Button>
                </Grid>
              </Grid>
            </LocalizationProvider>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 1 }}
            >
              <Chip
                size="small"
                color="primary"
                label={`${filteredRows.length} OS no histórico`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`${mechanicOptions.length} mecânico(s) no filtro`}
              />
              {periodStart || periodEnd ? (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${periodStart ? formatOrderDate(periodStart) : "Início"} até ${
                    periodEnd ? formatOrderDate(periodEnd) : "Fim"
                  }`}
                />
              ) : null}
            </Stack>
          </Box>
          <Stack
            spacing={1}
            sx={{
              display: { xs: "flex", md: "none" },
              p: 1,
              backgroundColor: "background.default",
            }}
          >
            {visibleHistoryRows.length ? (
              visibleHistoryRows.map((row) => {
                const statusMeta = STATUS_META[row.status];
                const declinedItems = getDeclinedItemsCount(row);

                return (
                  <Paper
                    key={`mobile-${row.id}`}
                    variant="outlined"
                    sx={{
                      p: 1.25,
                      borderRadius: 1,
                      backgroundColor: "background.paper",
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                        justifyContent="space-between"
                      >
                        <Stack spacing={0.25} minWidth={0}>
                          <Typography variant="subtitle2" fontWeight={800} noWrap>
                            #{row.orderInfo.orderNumber || "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatOrderDate(row.orderInfo.date)}
                          </Typography>
                        </Stack>
                        <Chip
                          size="small"
                          color={statusMeta.color}
                          label={statusMeta.label}
                          variant="outlined"
                          sx={{
                            maxWidth: 150,
                            "& .MuiChip-label": {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          }}
                        />
                      </Stack>

                      <Box
                        sx={{
                          display: "grid",
                          gap: 0.75,
                          gridTemplateColumns: "1fr",
                        }}
                      >
                        <Box minWidth={0}>
                          <Typography variant="caption" color="text.secondary">
                            Cliente
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            noWrap
                            title={row.orderInfo.customerName}
                          >
                            {row.orderInfo.customerName || "-"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            title={row.orderInfo.phone}
                            sx={{ display: "block" }}
                          >
                            {row.orderInfo.phone || "-"}
                          </Typography>
                        </Box>

                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Box minWidth={0}>
                            <Typography variant="caption" color="text.secondary">
                              Veículo
                            </Typography>
                            <Typography
                              variant="body2"
                              noWrap
                              title={row.orderInfo.vehicle}
                            >
                              {row.orderInfo.vehicle || "-"}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={row.orderInfo.plate || "Sem placa"}
                            sx={{
                              height: 22,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          />
                        </Stack>

                        <Box minWidth={0}>
                          <Typography variant="caption" color="text.secondary">
                            Mecânico
                          </Typography>
                          <Typography
                            variant="body2"
                            noWrap
                            title={row.orderInfo.mechanicResponsible}
                          >
                            {row.orderInfo.mechanicResponsible || "-"}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider />

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Stack spacing={0.25}>
                          <Typography variant="caption" color="text.secondary">
                            Total OS
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {formatCurrency(row.totals.grandTotal)}
                          </Typography>
                        </Stack>
                        <Chip
                          size="small"
                          color={declinedItems ? "warning" : "default"}
                          variant={declinedItems ? "filled" : "outlined"}
                          label={declinedItems ? `${declinedItems} item(ns)` : "Sem recusa"}
                        />
                      </Stack>

                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                      >
                        <Typography variant="caption" color="text.secondary">
                          Atualizado em {formatDate(row.updatedAt)}
                        </Typography>
                        {renderHistoryActions(row, { justifyContent: "flex-start" })}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })
            ) : (
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 1,
                  textAlign: "center",
                }}
              >
                <Stack spacing={1} alignItems="center">
                  <HistoryOutlinedIcon
                    sx={{ fontSize: 34, color: "text.disabled" }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma OS encontrada com os filtros atuais.
                  </Typography>
                </Stack>
              </Paper>
            )}
          </Stack>
          <TableContainer
            sx={{
              display: { xs: "none", md: "block" },
              overflow: "visible",
              "& .MuiTableCell-root": {
                borderColor: "divider",
              },
            }}
          >
            <Table
              size="small"
              sx={{
                width: "100%",
                tableLayout: "fixed",
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      backgroundColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.08),
                      color: "text.primary",
                      fontWeight: 800,
                      lineHeight: 1.2,
                      whiteSpace: "normal",
                    },
                  }}
                >
                  <TableCell sx={{ width: "8%" }}>OS</TableCell>
                  <TableCell sx={{ width: "16%" }}>Cliente</TableCell>
                  <TableCell sx={{ width: "14%" }}>Veículo</TableCell>
                  <TableCell sx={{ width: "11%" }}>Mecânico</TableCell>
                  <TableCell sx={{ width: "10%" }}>Status</TableCell>
                  <TableCell sx={{ width: "9%" }}>Recusas</TableCell>
                  <TableCell align="right" sx={{ width: "10%" }}>
                    Total
                  </TableCell>
                  <TableCell sx={{ width: "12%" }}>Atualizado em</TableCell>
                  <TableCell align="right" sx={{ width: "10%" }}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleHistoryRows.length ? (
                  visibleHistoryRows.map((row) => {
                    const statusMeta = STATUS_META[row.status];
                    const declinedItems = getDeclinedItemsCount(row);

                    return (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{
                          "&:nth-of-type(even)": {
                            backgroundColor: (theme) =>
                              alpha(theme.palette.action.hover, 0.45),
                          },
                        }}
                      >
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="body2" fontWeight={800} noWrap>
                              #{row.orderInfo.orderNumber || "-"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                            >
                              {formatOrderDate(row.orderInfo.date)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              noWrap
                              title={row.orderInfo.customerName}
                            >
                              {row.orderInfo.customerName || "-"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              title={row.orderInfo.phone}
                            >
                              {row.orderInfo.phone || "-"}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5} alignItems="flex-start">
                            <Typography
                              variant="body2"
                              noWrap
                              title={row.orderInfo.vehicle}
                              sx={{ maxWidth: "100%" }}
                            >
                              {row.orderInfo.vehicle || "-"}
                            </Typography>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={row.orderInfo.plate || "Sem placa"}
                              sx={{
                                height: 22,
                                fontSize: "0.72rem",
                                fontWeight: 700,
                              }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            noWrap
                            title={row.orderInfo.mechanicResponsible}
                          >
                            {row.orderInfo.mechanicResponsible || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={statusMeta.color}
                            label={statusMeta.label}
                            variant="outlined"
                            sx={{
                              maxWidth: "100%",
                              "& .MuiChip-label": {
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={declinedItems ? "warning" : "default"}
                            variant={declinedItems ? "filled" : "outlined"}
                            label={declinedItems ? `${declinedItems} item(ns)` : "Sem recusa"}
                            sx={{
                              maxWidth: "100%",
                              "& .MuiChip-label": {
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={800}>
                            {formatCurrency(row.totals.grandTotal)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            {formatDate(row.updatedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {renderHistoryActions(row)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Stack
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                        sx={{ py: 5 }}
                      >
                        <HistoryOutlinedIcon
                          sx={{ fontSize: 34, color: "text.disabled" }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          textAlign="center"
                        >
                          Nenhuma OS encontrada com os filtros atuais.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredRows.length}
            page={historyPage}
            onPageChange={(_, page) => setHistoryPage(page)}
            rowsPerPage={historyRowsPerPage}
            onRowsPerPageChange={handleHistoryRowsPerPageChange}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Linhas por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
            sx={{
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          />
        </Card>
      </Stack>

      <Dialog
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {selectedRow
            ? `Detalhes da OS #${selectedRow.orderInfo.orderNumber || "-"}`
            : "Detalhes da OS"}
        </DialogTitle>
        <DialogContent dividers>
          {selectedRow ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  size="small"
                  color={STATUS_META[selectedRow.status].color}
                  label={STATUS_META[selectedRow.status].label}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Recusas: ${getDeclinedItemsCount(selectedRow)}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Total: ${formatCurrency(selectedRow.totals.grandTotal)}`}
                />
              </Stack>

              <Grid container columns={12} spacing={1.5}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body2">
                    {selectedRow.orderInfo.customerName || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Telefone
                  </Typography>
                  <Typography variant="body2">{selectedRow.orderInfo.phone || "-"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Mecânico responsável
                  </Typography>
                  <Typography variant="body2">
                    {selectedRow.orderInfo.mechanicResponsible || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Veículo
                  </Typography>
                  <Typography variant="body2">{selectedRow.orderInfo.vehicle || "-"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Ano / Placa / KM
                  </Typography>
                  <Typography variant="body2">
                    {selectedRow.orderInfo.year || "-"} / {selectedRow.orderInfo.plate || "-"} /{" "}
                    {selectedRow.orderInfo.km || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Atualizado em
                  </Typography>
                  <Typography variant="body2">{formatDate(selectedRow.updatedAt)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Pagamento
                  </Typography>
                  <Typography variant="body2">
                    {selectedRow.orderInfo.paymentMethod || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="caption" color="text.secondary">
                    Assinatura
                  </Typography>
                  <Typography variant="body2">{selectedRow.signatureText}</Typography>
                </Grid>
              </Grid>

              <Divider />

              <Stack spacing={0.8}>
                <Typography fontWeight={700}>Checklist</Typography>
                <Typography variant="body2">
                  {Object.entries(selectedRow.checklist)
                    .filter(([, checked]) => checked)
                    .map(([item]) => item)
                    .join(", ") || "Nenhum item marcado"}
                </Typography>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography fontWeight={700}>Peças</Typography>
                {selectedRow.parts.length ? (
                  selectedRow.parts.map((part) => (
                    <Typography key={part.id} variant="body2">
                      {part.description || "Peça sem descrição"} • {part.quantity}x{" "}
                      {formatCurrency(part.unitPrice)} •{" "}
                      {part.status === "declined" ? "Recusada" : "Aprovada"}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">Nenhuma peça cadastrada.</Typography>
                )}
              </Stack>

              <Stack spacing={1}>
                <Typography fontWeight={700}>Serviços</Typography>
                {selectedRow.laborServices.length ? (
                  selectedRow.laborServices.map((service) => (
                    <Typography key={service.id} variant="body2">
                      {service.description || "Serviço sem descrição"} •{" "}
                      {formatCurrency(service.amount)} •{" "}
                      {service.status === "declined" ? "Recusado" : "Aprovado"}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">Nenhum serviço cadastrado.</Typography>
                )}
              </Stack>

              <Stack spacing={1}>
                <Typography fontWeight={700}>Serviços de Terceiros</Typography>
                {selectedRow.thirdPartyServices.length ? (
                  selectedRow.thirdPartyServices.map((service) => (
                    <Typography key={service.id} variant="body2">
                      {service.description || "Serviço sem descrição"} •{" "}
                      {formatCurrency(service.amount)} •{" "}
                      {service.status === "declined" ? "Recusado" : "Aprovado"}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">
                    Nenhum serviço de terceiros cadastrado.
                  </Typography>
                )}
              </Stack>

              <Divider />

              <Typography variant="body2">
                <b>Observações:</b> {selectedRow.orderInfo.notes || "-"}
              </Typography>
            </Stack>
          ) : null}
      </DialogContent>
      <DialogActions>
        {selectedRow ? (
          <Button
            startIcon={<PreviewOutlinedIcon fontSize="small" />}
            onClick={() => handlePreviewPrintServiceOrder(selectedRow)}
          >
            Prévia impressão
          </Button>
        ) : null}
        {selectedRow ? (
          <Button
            startIcon={<PrintOutlinedIcon fontSize="small" />}
            onClick={() => handlePrintServiceOrder(selectedRow)}
          >
            Imprimir OS
          </Button>
        ) : null}
        {selectedRow && !isClosedStatus(selectedRow.status) ? (
          <Button
            color="success"
            disabled={closingOrderId === selectedRow.id}
            startIcon={
              closingOrderId === selectedRow.id ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <CheckCircleOutlineOutlinedIcon fontSize="small" />
              )
            }
            onClick={() => {
              void handleCloseRecord(selectedRow);
            }}
          >
            {closingOrderId === selectedRow.id ? "Encerrando..." : "Encerrar OS"}
          </Button>
        ) : null}
        {selectedRow && isClosedStatus(selectedRow.status) ? (
          <Button
            color="warning"
            disabled={reopeningOrderId === selectedRow.id}
            startIcon={
              reopeningOrderId === selectedRow.id ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <AutorenewOutlinedIcon fontSize="small" />
              )
            }
            onClick={() => {
              void handleReopenRecord(selectedRow);
            }}
          >
            {reopeningOrderId === selectedRow.id ? "Reabrindo..." : "Reabrir OS"}
          </Button>
        ) : null}
        <Button
          color="error"
          disabled={
            !selectedRow ||
            isClosedStatus(selectedRow.status) ||
            deletingOrderId === selectedRow?.id
          }
          onClick={() => {
            if (!selectedRow) {
              return;
            }

            void handleDeleteRecord(selectedRow);
          }}
        >
          {selectedRow && deletingOrderId === selectedRow.id
            ? "Excluindo..."
            : "Excluir OS"}
        </Button>
        <Button onClick={() => setSelectedRow(null)}>Fechar</Button>
      </DialogActions>
    </Dialog>
    </RefineListView>
  );
};
