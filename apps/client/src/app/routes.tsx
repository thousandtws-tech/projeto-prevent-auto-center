import { Authenticated } from "@refinedev/core";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { ErrorComponent } from "@refinedev/mui";
import {
  CatchAllNavigate,
  NavigateToResource,
} from "@refinedev/react-router";
import { lazy, Suspense } from "react";
import { Outlet, Route, Routes } from "react-router";
import { AppThemedLayout } from "./layout";

const AuthPage = lazy(() =>
  import("../pages/auth").then((module) => ({ default: module.AuthPage })),
);
const CustomersPage = lazy(() =>
  import("../pages/customers/index").then((module) => ({
    default: module.CustomersPage,
  })),
);
const DashboardPage = lazy(() =>
  import("../pages/dashboard/index").then((module) => ({
    default: module.DashboardPage,
  })),
);
const FinancialPage = lazy(() =>
  import("../pages/financial").then((module) => ({
    default: module.FinancialPage,
  })),
);
const SchedulingPage = lazy(() =>
  import("../pages/scheduling/index").then((module) => ({
    default: module.SchedulingPage,
  })),
);
const SuppliersPage = lazy(() =>
  import("../pages/suppliers").then((module) => ({
    default: module.SuppliersPage,
  })),
);
const ServiceOrderHistoryPage = lazy(() =>
  import("../pages/service-order-history").then((module) => ({
    default: module.ServiceOrderHistoryPage,
  })),
);
const ServiceOrderLaborPage = lazy(() =>
  import("../pages/service-order-labor").then((module) => ({
    default: module.ServiceOrderLaborPage,
  })),
);
const ServiceOrderChecklistsPage = lazy(() =>
  import("../pages/service-order-checklists/page").then((module) => ({
    default: module.ServiceOrderChecklistsPage,
  })),
);
const ServiceOrderMechanicsPage = lazy(() =>
  import("../pages/service-order-mechanics/index").then((module) => ({
    default: module.ServiceOrderMechanicsPage,
  })),
);
const ServiceOrderPartsPage = lazy(() =>
  import("../pages/service-order-parts").then((module) => ({
    default: module.ServiceOrderPartsPage,
  })),
);
const ServiceOrderPage = lazy(() =>
  import("../pages/service-order/index").then((module) => ({
    default: module.ServiceOrderPage,
  })),
);
const ServiceOrderRefusalsPage = lazy(() =>
  import("../pages/service-order-refusals").then((module) => ({
    default: module.ServiceOrderRefusalsPage,
  })),
);
const ServiceOrderSignaturePage = lazy(() =>
  import("../pages/service-order-signature").then((module) => ({
    default: module.ServiceOrderSignaturePage,
  })),
);
const ServiceOrderSignaturesPage = lazy(() =>
  import("../pages/service-order-signatures").then((module) => ({
    default: module.ServiceOrderSignaturesPage,
  })),
);
const SettingsPage = lazy(() =>
  import("../pages/settings/index").then((module) => ({
    default: module.SettingsPage,
  })),
);

const LOGIN_DEFAULTS = {
  workshopSlug: "",
  email: "",
  password: "",
} as const;

const REGISTER_DEFAULTS = {
  workshopName: "",
  workshopSlug: "",
  ownerName: "",
  email: "",
  password: "",
} as const;

const FORGOT_PASSWORD_DEFAULTS = {
  email: "",
} as const;

const AuthenticatedMainRoute: React.FC = () => (
  <Authenticated
    key="authenticated-routes"
    fallback={<CatchAllNavigate to="/login" />}
  >
    <AppThemedLayout constrainContent />
  </Authenticated>
);

const AuthenticatedCatchAllRoute: React.FC = () => (
  <Authenticated key="catch-all">
    <AppThemedLayout />
  </Authenticated>
);

const AuthRedirectRoute: React.FC = () => (
  <Authenticated key="auth-pages" fallback={<Outlet />}>
    <NavigateToResource resource="dashboard" />
  </Authenticated>
);

const RouteLoader: React.FC = () => (
  <Box
    sx={{
      minHeight: "40vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <CircularProgress size={28} />
  </Box>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/assinatura-os/:token" element={<ServiceOrderSignaturePage />} />

        <Route element={<AuthenticatedMainRoute />}>
          <Route index element={<DashboardPage />} />
          <Route path="clientes" element={<CustomersPage />} />
          <Route path="ordem-servico" element={<ServiceOrderPage />} />
          <Route path="ordem-servico/pecas" element={<ServiceOrderPartsPage />} />
          <Route
            path="ordem-servico/mao-de-obra"
            element={<ServiceOrderLaborPage />}
          />
          <Route
            path="ordem-servico/checklists"
            element={<ServiceOrderChecklistsPage />}
          />
          <Route
            path="ordem-servico/mecanicos"
            element={<ServiceOrderMechanicsPage />}
          />
          <Route
            path="ordem-servico/historico"
            element={<ServiceOrderHistoryPage />}
          />
          <Route
            path="ordem-servico/assinaturas"
            element={<ServiceOrderSignaturesPage />}
          />
          <Route path="ordem-servico/recusas" element={<ServiceOrderRefusalsPage />} />
          <Route path="agendamentos" element={<SchedulingPage />} />
          <Route path="fornecedores" element={<SuppliersPage />} />
          <Route path="financeiro" element={<FinancialPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route element={<AuthRedirectRoute />}>
          <Route
            path="/login"
            element={
              <AuthPage
                type="login"
                formProps={{ defaultValues: LOGIN_DEFAULTS }}
              />
            }
          />
          <Route
            path="/register"
            element={
              <AuthPage
                type="register"
                formProps={{ defaultValues: REGISTER_DEFAULTS }}
              />
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthPage
                type="forgotPassword"
                formProps={{ defaultValues: FORGOT_PASSWORD_DEFAULTS }}
              />
            }
          />
          <Route path="/update-password" element={<AuthPage type="updatePassword" />} />
        </Route>

        <Route element={<AuthenticatedCatchAllRoute />}>
          <Route path="*" element={<ErrorComponent />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
