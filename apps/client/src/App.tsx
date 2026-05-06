import { Refine } from "@refinedev/core";
import { RefineSnackbarProvider } from "@refinedev/mui";
import CssBaseline from "@mui/material/CssBaseline";
import routerProvider, {
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { BrowserRouter } from "react-router";
import { authProvider } from "./authProvider";
import { ColorModeContextProvider } from "./contexts";
import { useAutoLoginForDemo } from "./hooks";
import { useAppNotificationProvider } from "./providers/notificationProvider";
import { appDataProviders } from "./app/dataProviders";
import { useAppBootstrap } from "./app/bootstrap";
import { AppRoutes } from "./app/routes";
import { NotificationModalHost, PwaInstallPrompt } from "./components";

const REFINE_OPTIONS = {
  syncWithLocation: true,
  warnWhenUnsavedChanges: true,
  breadcrumb: true,
} as const;

const App: React.FC = () => {
  const { loading } = useAutoLoginForDemo();
  const { i18nProvider, resources, documentTitleHandler } = useAppBootstrap();

  if (loading) {
    return null;
  }

  return (
    <BrowserRouter>
      <ColorModeContextProvider>
        <CssBaseline />
        <RefineSnackbarProvider>
          <Refine
            routerProvider={routerProvider}
            dataProvider={appDataProviders}
            authProvider={authProvider}
            i18nProvider={i18nProvider}
            options={REFINE_OPTIONS}
            notificationProvider={useAppNotificationProvider}
            resources={resources}
          >
            <AppRoutes />
            <NotificationModalHost />
            <PwaInstallPrompt />
            <UnsavedChangesNotifier />
            <DocumentTitleHandler handler={documentTitleHandler} />
          </Refine>
        </RefineSnackbarProvider>
      </ColorModeContextProvider>
    </BrowserRouter>
  );
};

export default App;
