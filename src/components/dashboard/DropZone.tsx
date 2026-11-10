import { useDraggable, useDroppable } from "@dnd-kit/core";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
  Box,
  IconButton,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { DropZoneProps } from "../../interfaces/DashboardComponentProps";
import { getGridAreaForPosition } from "../../utils/layoutUtils";

export default function DropZone({
  position,
  isOccupied,
  isValidDrop,
  widgetLabel,
  widgetType,
  widgetTypeRaw,
  availableWidgetTypes,
  onWidgetTypeChange,
  onRemove,
  onAdd,
  isDragging = false,
}: DropZoneProps) {
  // Droppable setup - every zone is a drop target
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `zone-${position}`,
    data: { position },
  });

  // Draggable setup - only occupied zones are draggable
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging: isThisDragging,
  } = useDraggable({
    id: `drag-${position}`,
    data: { position, widgetType: widgetTypeRaw },
    disabled: !isOccupied,
  });

  const gridArea = getGridAreaForPosition(position);

  // Combine refs for occupied zones (both draggable and droppable)
  const setRefs = (node: HTMLElement | null) => {
    setDropRef(node);
    setDragRef(node);
  };

  // Determine visual state
  const getZoneStyles = () => {
    const baseStyles = {
      gridArea,
      minHeight: 80,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 1,
      transition: "all 0.2s ease",
      position: "relative" as const,
    };

    // If this zone is being dragged
    if (isThisDragging) {
      return {
        ...baseStyles,
        border: "2px dashed",
        borderColor: "primary.main",
        bgcolor: "primary.50",
        opacity: 0.5,
      };
    }

    if (isOccupied) {
      // When another item is being dragged over this occupied zone
      if (isOver && isDragging) {
        return {
          ...baseStyles,
          border: "2px solid",
          borderColor: isValidDrop ? "#2e7d32" : "#c62828",
          bgcolor: isValidDrop
            ? "rgba(46, 125, 50, 0.08)"
            : "rgba(198, 40, 40, 0.08)",
          opacity: 0.9,
        };
      }
      return {
        ...baseStyles,
        border: "2px solid",
        borderColor: "#004e7d",
        bgcolor: "#ffffff",
      };
    }

    if (isOver && isValidDrop) {
      return {
        ...baseStyles,
        border: "2px dashed",
        borderColor: "success.main",
        bgcolor: "success.light",
        opacity: 0.8,
      };
    }

    if (isOver && !isValidDrop) {
      return {
        ...baseStyles,
        border: "2px dashed",
        borderColor: "error.main",
        bgcolor: "error.light",
        opacity: 0.8,
      };
    }

    if (isDragging) {
      return {
        ...baseStyles,
        border: "2px dashed",
        borderColor: "grey.400",
        bgcolor: "grey.100",
      };
    }

    return {
      ...baseStyles,
      border: "2px dashed",
      borderColor: "grey.300",
      bgcolor: "grey.50",
      "&:hover": {
        borderColor: "primary.light",
        bgcolor: "primary.50",
      },
    };
  };

  const handleWidgetTypeChange = (event: SelectChangeEvent<string>) => {
    event.stopPropagation();
    if (onWidgetTypeChange) {
      onWidgetTypeChange(event.target.value);
    }
  };

  if (isOccupied) {
    return (
      <Paper ref={setRefs} sx={getZoneStyles()} elevation={1}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            px: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                cursor: "grab",
                "&:active": { cursor: "grabbing" },
                display: "flex",
                alignItems: "center",
              }}
              {...attributes}
              {...listeners}
            >
              <DragIndicatorIcon sx={{ color: "#004e7d" }} />
            </Box>
            <Box>
              <Typography
                variant="body2"
                fontWeight="medium"
                sx={{ color: "#001d44" }}
              >
                {widgetLabel}
              </Typography>
              {availableWidgetTypes && availableWidgetTypes.length > 1 ? (
                <Select
                  value={widgetTypeRaw || ""}
                  onChange={handleWidgetTypeChange}
                  size="small"
                  variant="standard"
                  sx={{
                    fontSize: "0.75rem",
                    color: "#004e7d",
                    "& .MuiSelect-select": {
                      py: 0,
                      pr: 2,
                    },
                    "&:before": { display: "none" },
                    "&:after": { display: "none" },
                    "& .MuiSelect-icon": {
                      color: "#004e7d",
                    },
                  }}
                >
                  {availableWidgetTypes.map((wt) => (
                    <MenuItem key={wt.value} value={wt.value}>
                      {wt.label}
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <Typography variant="caption" sx={{ color: "#004e7d" }}>
                  {widgetType}
                </Typography>
              )}
            </Box>
          </Box>
          {onRemove && (
            <IconButton
              size="small"
              onClick={onRemove}
              sx={{ color: "#c62828" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Box
      ref={setDropRef}
      sx={getZoneStyles()}
      onClick={onAdd}
      style={{ cursor: onAdd ? "pointer" : "default" }}
    >
      <Box sx={{ textAlign: "center" }}>
        <AddIcon sx={{ color: "grey.400", fontSize: 32 }} />
        <Typography variant="caption" color="text.secondary" display="block">
          Drop widget here
        </Typography>
      </Box>
    </Box>
  );
}
