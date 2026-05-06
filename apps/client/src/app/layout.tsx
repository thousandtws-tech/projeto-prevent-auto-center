import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import {
  ThemedLayout,
  type RefineThemedLayoutSiderProps,
} from "@refinedev/mui";
import { Outlet } from "react-router";
import { Header, Title, WideSider } from "../components";

const CONTENT_SX = {
  width: "100%",
  maxWidth: "min(var(--app-shell-max-width), 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: "max(var(--app-page-gutter), env(safe-area-inset-left))",
  paddingRight: "max(var(--app-page-gutter), env(safe-area-inset-right))",
  paddingTop: {
    xs: 1.5,
    sm: 2.5,
  },
  paddingBottom: {
    xs: "calc(24px + env(safe-area-inset-bottom))",
    sm: "calc(32px + env(safe-area-inset-bottom))",
  },
} as const;

const renderSiderContent = ({
  items,
  logout,
}: {
  items: ReactNode;
  logout: ReactNode;
}) => (
  <>
    {items}
    {logout}
  </>
);

const AppSider: React.FC<RefineThemedLayoutSiderProps> = (props) => (
  <WideSider {...props} render={renderSiderContent} />
);

type AppLayoutProps = {
  constrainContent?: boolean;
};

export const AppThemedLayout: React.FC<AppLayoutProps> = ({
  constrainContent = false,
}) => {
  return (
    <ThemedLayout
      Header={Header}
      Title={Title}
      Sider={AppSider}
      childrenBoxProps={{
        sx: {
          p: 1,
        },
      }}
    >
      {constrainContent ? (
        <Box sx={CONTENT_SX}>
          <Outlet />
        </Box>
      ) : (
        <Outlet />
      )}
    </ThemedLayout>
  );
};
