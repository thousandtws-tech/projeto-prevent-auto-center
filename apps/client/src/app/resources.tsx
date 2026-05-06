import { useMemo, type ReactNode } from "react";
import type { IResourceItem } from "@refinedev/core";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import HandymanOutlinedIcon from "@mui/icons-material/HandymanOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";

type Translate = (key: string, defaultValue: string) => string;

const OPERATIONS_PARENT = "operations-management";
const ADMINISTRATION_PARENT = "administration-management";
const SERVICE_ORDER_PARENT = "service-order-management";

type ResourceLeafConfig = {
  name: string;
  list: string;
  label: string;
  icon: ReactNode;
  parent?: string;
};

type ResourceGroupConfig = {
  name: string;
  label: string;
  icon: ReactNode;
};

const createLeafResource = (config: ResourceLeafConfig): IResourceItem => {
  const { name, list, label, icon, parent } = config;
  return {
    name,
    list,
    meta: {
      label,
      icon,
      ...(parent ? { parent } : {}),
    },
  };
};

const createGroupResource = (config: ResourceGroupConfig): IResourceItem => {
  const { name, label, icon } = config;
  return {
    name,
    meta: {
      label,
      icon,
    },
  };
};

export const useAppResources = (t: Translate) =>
  useMemo(
    () => [
      createGroupResource({
        name: ADMINISTRATION_PARENT,
        label: "Administração",
        icon: <AdministrationIcon />,
      }),
      createLeafResource({
        name: "parts-stock",
        list: "/ordem-servico/pecas?modo=estoque",
        label: "Estoque de Peças",
        parent: ADMINISTRATION_PARENT,
        icon: <Inventory2OutlinedIcon />,
      }),
      createLeafResource({
        name: "suppliers",
        list: "/fornecedores",
        label: "Fornecedores",
        parent: ADMINISTRATION_PARENT,
        icon: <LocalShippingOutlinedIcon />,
      }),
      createLeafResource({
        name: "customers",
        list: "/clientes",
        label: t("customers.title", "Clientes"),
        parent: ADMINISTRATION_PARENT,
        icon: <SupervisorAccountOutlinedIcon />,
      }),
      createLeafResource({
        name: "financial",
        list: "/financeiro",
        label: "Financeiro",
        parent: ADMINISTRATION_PARENT,
        icon: <AccountBalanceOutlinedIcon />,
      }),
      createLeafResource({
        name: "reports",
        list: "/ordem-servico/historico",
        label: "Relatórios",
        parent: ADMINISTRATION_PARENT,
        icon: <ShowChartOutlinedIcon />,
      }),
      createLeafResource({
        name: "service-order-parts",
        list: "/ordem-servico/pecas",
        label: "Cadastro de Peças",
        parent: ADMINISTRATION_PARENT,
        icon: <Inventory2OutlinedIcon />,
      }),
      createLeafResource({
        name: "service-order-labor",
        list: "/ordem-servico/mao-de-obra",
        label: "Cadastro de Serviços",
        parent: ADMINISTRATION_PARENT,
        icon: <HandymanOutlinedIcon />,
      }),
      createLeafResource({
        name: "service-order-mechanics",
        list: "/ordem-servico/mecanicos",
        label: "Cadastro de Mecânicos",
        parent: ADMINISTRATION_PARENT,
        icon: <BadgeOutlinedIcon />,
      }),
      createLeafResource({
        name: "scheduling",
        list: "/agendamentos",
        label: t("scheduling.title", "Agendamentos"),
        parent: ADMINISTRATION_PARENT,
        icon: <EventNoteOutlinedIcon />,
      }),
      createLeafResource({
        name: "service-order-checklists",
        list: "/ordem-servico/checklists",
        label: "Checklist Personalizado",
        parent: ADMINISTRATION_PARENT,
        icon: <ChecklistOutlinedIcon />,
      }),
      createLeafResource({
        name: "settings",
        list: "/settings",
        label: t("settings.title", "Configurações"),
        parent: ADMINISTRATION_PARENT,
        icon: <SettingsOutlinedIcon />,
      }),

      createGroupResource({
        name: SERVICE_ORDER_PARENT,
        label: "Gestão de Ordem de Serviço",
        icon: <GroupOutlinedIcon />,
      }),
      createLeafResource({
        name: "service-order",
        list: "/ordem-servico",
        label: "Nova Ordem de Serviço",
        parent: SERVICE_ORDER_PARENT,
        icon: <NoteAddOutlinedIcon />,
      }),
      createLeafResource({
        name: "service-order-history",
        list: "/ordem-servico/historico",
        label: t("serviceOrder.history", "Histórico de Ordens"),
        parent: SERVICE_ORDER_PARENT,
        icon: <TrendingUpOutlinedIcon />,
      }),
      createLeafResource({
        name: "service-order-signatures",
        list: "/ordem-servico/assinaturas",
        label: "Assinaturas Recebidas",
        parent: SERVICE_ORDER_PARENT,
        icon: <DrawOutlinedIcon />,
      }),
      createLeafResource({
        name: "service-order-refusals",
        list: "/ordem-servico/recusas",
        label: "Serviços Recusados",
        parent: SERVICE_ORDER_PARENT,
        icon: <RuleOutlinedIcon />,
      }),

      createGroupResource({
        name: OPERATIONS_PARENT,
        label: "Operação",
        icon: <BusinessCenterOutlinedIcon />,
      }),
      createLeafResource({
        name: "dashboard",
        list: "/",
        label: t("dashboard.title", "Dashboard"),
        parent: OPERATIONS_PARENT,
        icon: <DashboardOutlinedIcon />,
      }),
    ],
    [t],
  );

const AdministrationIcon = ReceiptLongOutlinedIcon;
