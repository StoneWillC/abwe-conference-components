import { Box, Typography, Fade } from "@mui/material";
import QRCode from "react-qr-code";

type Props = {
  surveyUrl: string;
  displayUrl?: string; // URL to display (if different from actual QR code URL)
  position?: "center" | "bottom-right"; // Position of the QR code
};

export default function QRCodeCorner({
  surveyUrl,
  displayUrl,
  position = "center",
}: Props) {
  const positionStyles =
    position === "bottom-right"
      ? {
          bottom: 20,
          right: 20,
        }
      : {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };

  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          position: "fixed",
          ...positionStyles,
          backgroundColor: "white",
          padding: 2,
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        {/* QR Code */}
        <QRCode
          value={surveyUrl}
          size={150}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          viewBox={`0 0 256 256`}
        />
      </Box>
    </Fade>
  );
}
