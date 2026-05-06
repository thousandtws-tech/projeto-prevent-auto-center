import { useResourceParams } from "@refinedev/core";
import { Breadcrumb, List, type ListProps } from "@refinedev/mui";

type Props = {} & ListProps;

export const RefineListView = ({ children, ...props }: Props) => {
  const { resource } = useResourceParams();
  const resolvedBreadcrumb =
    typeof props.breadcrumb === "undefined" ? (
      <Breadcrumb
        showHome={false}
        breadcrumbProps={{
          sx: {
            px: 2,
            pt: 1.5,
            pb: 0.5,
            "& a": {
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              textDecoration: "none",
              color: "text.secondary",
              fontSize: {
                xs: "12px",
                sm: "13px",
              },
              lineHeight: 1.2,
            },
            "& a:visited": {
              color: "text.secondary",
            },
            "& a:hover": {
              color: "primary.main",
              textDecoration: "none",
            },
            "& .MuiTypography-root": {
              color: "text.primary",
              fontSize: {
                xs: "12px",
                sm: "13px",
              },
              lineHeight: 1.2,
            },
            "& .MuiSvgIcon-root": {
              fontSize: "16px",
              color: "text.secondary",
            },
            "& .MuiBreadcrumbs-separator": {
              color: "text.disabled",
              mx: 0.75,
            },
          },
        }}
      />
    ) : (
      props.breadcrumb
    );
  const resolvedTitle =
    props.title ??
    (typeof resource?.meta?.label === "string" ? resource.meta.label : undefined);

  return (
    <List
      {...props}
      title={resolvedTitle}
      breadcrumb={resolvedBreadcrumb}
      headerProps={{
        sx: {
          display: "flex",
          flexWrap: "wrap",
          alignItems: {
            xs: "stretch",
            md: "center",
          },
          gap: 1.5,
          px: {
            xs: 0,
            sm: 0.5,
          },
          py: {
            xs: 0.5,
            sm: 0.75,
          },
          ".MuiCardHeader-action": {
            margin: 0,
            alignSelf: {
              xs: "stretch",
              md: "center",
            },
            width: {
              xs: "100%",
              md: "auto",
            },
          },
          ".MuiCardHeader-content": {
            minWidth: 0,
          },
          ".MuiCardHeader-action > *": {
            width: {
              xs: "100%",
              md: "auto",
            },
          },
          minHeight: "unset",
          height: "auto",
        },
      }}
      headerButtonProps={{
        alignItems: "center",
        ...props.headerButtonProps,
        sx: {
          "& .MuiButton-root": {
            borderRadius: "var(--app-radius-pill)",
          },
          ...props.headerButtonProps?.sx,
        },
      }}
      wrapperProps={{
        sx: {
          backgroundColor: "transparent",
          backgroundImage: "none",
          boxShadow: "none",
          padding: 0,
          ...props.wrapperProps?.sx,
        },
      }}
    >
      {children}
    </List>
  );
};
