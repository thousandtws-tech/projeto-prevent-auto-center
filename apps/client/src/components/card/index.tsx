import type { PropsWithChildren } from "react";
import CardBase, { type CardProps } from "@mui/material/Card";
import CardHeader, { type CardHeaderProps } from "@mui/material/CardHeader";
import CardContent, { type CardContentProps } from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import type { Props } from "../../interfaces";

export const Card = ({
  icon,
  title,
  cardHeaderProps,
  cardContentProps,
  children,
  ...rest
}: PropsWithChildren<Props>) => {
  return (
    <CardBase
      {...rest}
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        ...rest.sx,
      }}
    >
      <CardHeader
        title={
          <Typography
            sx={{
              fontSize: {
                xs: "0.95rem",
                sm: "1rem",
              },
              fontWeight: 700,
              letterSpacing: 0,
            }}
          >
            {title}
          </Typography>
        }
        avatar={icon}
        sx={{
          minHeight: "unset",
          px: {
            xs: 2,
            sm: 2.5,
          },
          py: {
            xs: 1.75,
            sm: 2,
          },
          ".MuiCardHeader-avatar": {
            color: "primary.main",
            marginRight: "10px",
            "& .MuiSvgIcon-root": {
              fontSize: {
                xs: 20,
                sm: 22,
              },
            },
          },
          ".MuiCardHeader-action": {
            margin: 0,
          },
        }}
        {...cardHeaderProps}
      />
      <Divider />
      <CardContent
        {...cardContentProps}
        sx={{
          padding: 0,
          "&:last-child": {
            paddingBottom: 0,
          },
          ...cardContentProps?.sx,
        }}
      >
        {children}
      </CardContent>
    </CardBase>
  );
};
