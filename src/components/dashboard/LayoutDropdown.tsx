import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  FormControl,
  Paper,
  Popover,
  Typography,
} from "@mui/material";
import { MouseEvent, useState } from "react";
import {
  LayoutDropdownProps,
  LayoutOption,
} from "../../interfaces/DashboardComponentProps";
import { DashboardLayout } from "../../types/Widgets";
import { getValidLayoutsForCount } from "../../utils/layoutUtils";

const LAYOUT_OPTIONS_BY_COUNT: Record<number, LayoutOption[]> = {
  1: [
    {
      layout: "single",
      description: "Full Screen",
    },
  ],
  2: [
    {
      layout: "two-column",
      description: "Side by Side",
    },
    {
      layout: "two-row",
      description: "Stacked",
    },
  ],
  3: [
    {
      layout: "three-top",
      description: "1 Top, 2 Bottom",
    },
    {
      layout: "three-bottom",
      description: "2 Top, 1 Bottom",
    },
    {
      layout: "three-left",
      description: "1 Left, 2 Right",
    },
    {
      layout: "three-right",
      description: "2 Left, 1 Right",
    },
  ],
  4: [
    {
      layout: "four-quadrants",
      description: "Quadrants",
    },
  ],
};

// Mini visual representation of each layout
function LayoutMiniGraphic({
  layout,
  size = "normal",
}: {
  layout: DashboardLayout;
  size?: "small" | "normal";
}) {
  const dimensions =
    size === "small" ? { width: 32, height: 24 } : { width: 48, height: 36 };

  const cellStyle = {
    bgcolor: "#004e7d",
    borderRadius: 0.5,
  };

  const gridBase = {
    display: "grid",
    gap: 0.5,
    ...dimensions,
    flexShrink: 0,
  };

  switch (layout) {
    case "single":
      return (
        <Box
          sx={{
            ...gridBase,
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
          }}
        >
          <Box sx={{ ...cellStyle, gridColumn: "1 / 3", gridRow: "1 / 3" }} />
        </Box>
      );

    case "two-column":
      return (
        <Box
          sx={{
            ...gridBase,
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
          }}
        >
          <Box sx={{ ...cellStyle, gridRow: "1 / 3" }} />
          <Box sx={{ ...cellStyle, gridRow: "1 / 3" }} />
        </Box>
      );

    case "two-row":
      return (
        <Box
          sx={{
            ...gridBase,
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
          }}
        >
          <Box sx={{ ...cellStyle, gridColumn: "1 / 3" }} />
          <Box sx={{ ...cellStyle, gridColumn: "1 / 3" }} />
        </Box>
      );

    case "three-left":
      return (
        <Box
          sx={{
            ...gridBase,
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
          }}
        >
          <Box sx={{ ...cellStyle, gridRow: "1 / 3" }} />
          <Box sx={cellStyle} />
          <Box sx={cellStyle} />
        </Box>
      );

    case "three-right":
      return (
        <Box
          sx={{
            ...gridBase,
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
          }}
        >
          <Box sx={cellStyle} />
          <Box sx={{ ...cellStyle, gridRow: "1 / 3" }} />
          <Box sx={cellStyle} />
        </Box>
      );

    case "three-top":
      return (
        <Box
          sx={{
            ...gridBase,
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
          }}
        >
          <Box sx={{ ...cellStyle, gridColumn: "1 / 3" }} />
          <Box sx={cellStyle} />
          <Box sx={cellStyle} />
        </Box>
      );

    case "three-bottom":
      return (
        <Box
          sx={{
            ...gridBase,
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
          }}
        >
          <Box sx={cellStyle} />
          <Box sx={cellStyle} />
          <Box sx={{ ...cellStyle, gridColumn: "1 / 3" }} />
        </Box>
      );

    case "four-quadrants":
      return (
        <Box
          sx={{
            ...gridBase,
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
          }}
        >
          <Box sx={cellStyle} />
          <Box sx={cellStyle} />
          <Box sx={cellStyle} />
          <Box sx={cellStyle} />
        </Box>
      );

    default:
      return null;
  }
}

// Get question count from layout
function getQuestionCountForLayout(layout: DashboardLayout): number {
  switch (layout) {
    case "single":
      return 1;
    case "two-column":
    case "two-row":
      return 2;
    case "three-left":
    case "three-right":
    case "three-top":
    case "three-bottom":
      return 3;
    case "four-quadrants":
      return 4;
    default:
      return 4;
  }
}

// Get display label for current selection
function getSelectionLabel(layout: DashboardLayout): {
  count: string;
  description: string;
} {
  const count = getQuestionCountForLayout(layout);
  const options = LAYOUT_OPTIONS_BY_COUNT[count] || [];
  const option = options.find((o) => o.layout === layout);
  return {
    count: `${count} Question Display`,
    description: option?.description || "",
  };
}

export default function LayoutDropdown({
  selectedLayout,
  onLayoutChange,
}: LayoutDropdownProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expandedCount, setExpandedCount] = useState<number | false>(
    getQuestionCountForLayout(selectedLayout),
  );

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    // Start with all sections collapsed to avoid accidental clicks
    setExpandedCount(false);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAccordionChange =
    (count: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedCount(isExpanded ? count : false);
    };

  const handleLayoutSelect = (
    layout: DashboardLayout,
    questionCount: number,
  ) => {
    onLayoutChange(layout, questionCount);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const selectionLabel = getSelectionLabel(selectedLayout);

  // Always show all layout counts (1-4)
  const availableCounts = [1, 2, 3, 4];

  return (
    <FormControl fullWidth size="small">
      <Typography
        variant="subtitle2"
        sx={{
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          mb: 1,
          color: "text.secondary",
        }}
      >
        Layout
      </Typography>

      {/* Trigger Button */}
      <Paper
        onClick={handleClick}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1.5,
          cursor: "pointer",
          border: "1px solid",
          borderColor: open ? "primary.main" : "divider",
          "&:hover": {
            borderColor: "primary.main",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <LayoutMiniGraphic layout={selectedLayout} />
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {selectionLabel.count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {selectionLabel.description}
            </Typography>
          </Box>
        </Box>
        <ExpandMoreIcon
          sx={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            color: "text.secondary",
          }}
        />
      </Paper>

      {/* Dropdown Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              width: anchorEl?.offsetWidth || 300,
              mt: 0.5,
              maxHeight: 400,
              overflow: "auto",
            },
          },
        }}
      >
        {availableCounts.map((count) => {
          const validLayouts = getValidLayoutsForCount(count);
          const optionsForCount = (LAYOUT_OPTIONS_BY_COUNT[count] || []).filter(
            (opt) => validLayouts.includes(opt.layout),
          );

          if (optionsForCount.length === 0) return null;

          return (
            <Accordion
              key={count}
              expanded={expandedCount === count}
              onChange={handleAccordionChange(count)}
              disableGutters
              elevation={0}
              sx={{
                "&:before": { display: "none" },
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:last-of-type": {
                  borderBottom: "none",
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  minHeight: 48,
                  "&.Mui-expanded": { minHeight: 48 },
                  "& .MuiAccordionSummary-content": {
                    my: 1,
                  },
                }}
              >
                <Typography variant="body2" fontWeight={500}>
                  {count} Question Display
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {optionsForCount.map((option) => {
                  const isSelected = option.layout === selectedLayout;
                  return (
                    <Box
                      key={option.layout}
                      onClick={() => handleLayoutSelect(option.layout, count)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 2,
                        py: 1.5,
                        cursor: "pointer",
                        bgcolor: isSelected ? "action.selected" : "transparent",
                        "&:hover": {
                          bgcolor: isSelected
                            ? "action.selected"
                            : "action.hover",
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: isSelected ? "primary.main" : "text.primary",
                          fontWeight: isSelected ? 500 : 400,
                        }}
                      >
                        {option.description}
                      </Typography>
                      <LayoutMiniGraphic layout={option.layout} size="small" />
                    </Box>
                  );
                })}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Popover>
    </FormControl>
  );
}
