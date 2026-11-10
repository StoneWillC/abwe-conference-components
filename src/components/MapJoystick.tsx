import { Box, IconButton, Paper } from "@mui/material";
import {
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  NorthEast,
  NorthWest,
  SouthEast,
  SouthWest,
} from "@mui/icons-material";

interface MapJoystickProps {
  onMove: (direction: string) => void;
}

export default function MapJoystick({ onMove }: MapJoystickProps) {
  const handleMove = (direction: string) => {
    onMove(direction);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        display: "inline-block",
        p: 1,
        backgroundColor: "background.paper",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0.5,
          width: "fit-content",
        }}
      >
        {/* Top Row */}
        <IconButton
          size="small"
          onClick={() => handleMove("northwest")}
          sx={{ aspectRatio: "1/1" }}
        >
          <NorthWest />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleMove("north")}
          sx={{ aspectRatio: "1/1" }}
        >
          <ArrowUpward />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleMove("northeast")}
          sx={{ aspectRatio: "1/1" }}
        >
          <NorthEast />
        </IconButton>

        {/* Middle Row */}
        <IconButton
          size="small"
          onClick={() => handleMove("west")}
          sx={{ aspectRatio: "1/1" }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Center - No button */}
        </Box>
        <IconButton
          size="small"
          onClick={() => handleMove("east")}
          sx={{ aspectRatio: "1/1" }}
        >
          <ArrowForward />
        </IconButton>

        {/* Bottom Row */}
        <IconButton
          size="small"
          onClick={() => handleMove("southwest")}
          sx={{ aspectRatio: "1/1" }}
        >
          <SouthWest />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleMove("south")}
          sx={{ aspectRatio: "1/1" }}
        >
          <ArrowDownward />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleMove("southeast")}
          sx={{ aspectRatio: "1/1" }}
        >
          <SouthEast />
        </IconButton>
      </Box>
    </Paper>
  );
}
