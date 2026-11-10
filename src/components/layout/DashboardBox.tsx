import { Box } from "@mui/material";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function DashboardBox({ children }: Props) {
  return (
    <Box
      sx={{
        border: "2px solid rgba(255, 255, 255, 0.4)",
        borderRadius: 2.5,
        p: 0,
        bgcolor: "transparent",
        backgroundImage:
          "radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.035) 40%, rgba(255, 255, 255, 0.02) 70%, rgba(255, 255, 255, 0.01) 85%, rgba(255, 255, 255, 0) 100%), radial-gradient(circle at 24% 28%, rgba(255, 255, 255, 0.03), transparent 72%), radial-gradient(circle at 76% 30%, rgba(255, 255, 255, 0.028), transparent 74%), radial-gradient(circle at 38% 78%, rgba(255, 255, 255, 0.025), transparent 76%), radial-gradient(circle at 86% 76%, rgba(255, 255, 255, 0.025), transparent 78%)",
        boxShadow:
          "inset 0 0 0 1px rgba(255, 255, 255, 0.18), inset 0 0 18px rgba(255, 255, 255, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.5), 0 14px 30px rgba(0, 0, 0, 0.55)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {children}
    </Box>
  );
}
