import { Box, Typography, Fade } from "@mui/material";
import QRCode from "react-qr-code";

type Props = {
  surveyUrl: string;
  displayUrl?: string; // URL to display (if different from actual QR code URL)
};

export default function QRCodeIntro({ surveyUrl, displayUrl }: Props) {
  return (
    <Fade in timeout={1000}>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#001d44",
          background: "linear-gradient(135deg, #001d44 0%, #004e7d 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          zIndex: 9999,
        }}
      >
        {/* Main Content */}
        <Box
          sx={{
            textAlign: "center",
            maxWidth: "90%",
          }}
        >
          {/* Title */}
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: "2.5rem", md: "4.5rem" },
              textShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            Join the Conversation
          </Typography>

          <Typography
            variant="h5"
            sx={{
              mb: 5,
              fontWeight: 400,
              opacity: 0.95,
              fontSize: { xs: "1.25rem", md: "2rem" },
            }}
          >
            Scan the QR code to participate in our live survey
          </Typography>

          {/* QR Code */}
          <Box
            sx={{
              backgroundColor: "white",
              padding: 5,
              borderRadius: 3,
              display: "inline-block",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              mb: 4,
            }}
          >
            <QRCode
              value={surveyUrl}
              size={380}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox={`0 0 256 256`}
            />
          </Box>

          {/* URL */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 500,
              mb: 4,
              letterSpacing: 1,
              opacity: 0.9,
              fontSize: { xs: "1.25rem", md: "2rem" },
            }}
          >
            {displayUrl || surveyUrl}
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
}
