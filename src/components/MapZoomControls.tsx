import { IconButton, Paper, Typography } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";

interface MapZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  minZoom?: number;
  maxZoom?: number;
  matchHeight?: boolean;
}

export default function MapZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  minZoom = 1,
  maxZoom = 10,
  matchHeight = false,
}: MapZoomControlsProps) {
  return (
    <Paper
      elevation={2}
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: matchHeight ? "space-between" : undefined,
        p: 1,
        gap: matchHeight ? 1 : 0.5,
        backgroundColor: "background.paper",
        ...(matchHeight && { height: "100%", boxSizing: "border-box" }),
      }}
    >
      <IconButton
        size="small"
        onClick={onZoomIn}
        disabled={zoom >= maxZoom}
        sx={{ aspectRatio: "1/1" }}
      >
        <Add />
      </IconButton>
      <Typography
        variant="caption"
        sx={{ fontWeight: "bold", minWidth: "2ch", textAlign: "center" }}
      >
        {zoom}
      </Typography>
      <IconButton
        size="small"
        onClick={onZoomOut}
        disabled={zoom <= minZoom}
        sx={{ aspectRatio: "1/1" }}
      >
        <Remove />
      </IconButton>
    </Paper>
  );
}
