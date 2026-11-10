import { WidgetProps } from "@/interfaces/DashboardProps";
import { Box, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts";
import { CHART_PALETTE } from "../../constants/chartPalette";

export function PieGraph({
  question,
  labels,
  values,
  width,
  height,
  questionFontSize = "18px",
}: WidgetProps) {
  // Check if data is empty or all values are 0
  const hasData =
    labels &&
    values &&
    labels.length > 0 &&
    values.length > 0 &&
    values.some((v) => v > 0);

  // Always ensure we have valid data for the chart to render
  const data = hasData
    ? labels.map((label, i) => ({
        id: i,
        value: values[i] || 0,
        label: label || "",
      }))
    : [{ id: 0, value: 1, label: "No Data" }]; // Show empty ring with legend when no data

  // Ensure valid dimensions
  const validWidth = Math.max(100, width || 100);
  const validHeight = Math.max(100, height || 100);

  // Reserve space for bottom legend
  const legendHeight = 60;
  const pieHeight = validHeight - legendHeight * 2;
  const radius = Math.min(validWidth, pieHeight) / 2.2;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        maxWidth: validWidth,
        maxHeight: validHeight,
      }}
    >
      <Typography
        variant="subtitle1"
        textAlign="center"
        sx={{
          mb: 0.5,
          fontWeight: 600,
          flexShrink: 0,
          color: "#ffffff",
          fontSize: questionFontSize,
        }}
      >
        {question}
      </Typography>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        <PieChart
          colors={hasData ? CHART_PALETTE : ["rgba(255, 255, 255, 0.15)"]}
          series={[
            {
              data,
              innerRadius: radius * 0.4,
              outerRadius: radius,
              paddingAngle: hasData ? 2 : 0,
              arcLabel: hasData ? (item) => `${item.value}` : undefined,
              arcLabelMinAngle: 20,
            },
          ]}
          width={validWidth}
          height={pieHeight}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          slotProps={{
            legend: hasData
              ? {
                  direction: "horizontal",
                  position: {
                    vertical: "bottom",
                    horizontal: "center",
                  },
                }
              : undefined,
          }}
          sx={{
            "& .MuiChartsLegend-root": {
              display: hasData ? "flex" : "none",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              rowGap: "6px",
              columnGap: "14px",
              width: "100%",
            },
            "& .MuiChartsLegend-label": {
              fill: "#ffffff",
              fontSize: "1rem !important",
              fontWeight: 700,
            },
            "& .MuiChartsLegend-root text": {
              fill: "#ffffff",
              fontSize: "1rem !important",
              fontWeight: 700,
            },
            "& .MuiChartsArcLabel-root": {
              fill: "#0b1624",
              fontWeight: 700,
              fontSize: "22px !important",
            },
            "& .MuiChartsArc-root text": {
              fill: "#0b1624",
              fontWeight: 700,
            },
          }}
        />
      </Box>
    </Box>
  );
}
