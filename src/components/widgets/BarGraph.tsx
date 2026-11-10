import { WidgetProps } from "@/interfaces/DashboardProps";
import { Box, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts";
import { CHART_PALETTE } from "../../constants/chartPalette";

export default function BarGraph({
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

  // Always show labels/values so x-axis labels are visible even at zero
  const displayLabels = labels && labels.length > 0 ? labels : [];
  const displayValues = values && values.length > 0 ? values : [];

  // Ensure valid dimensions
  const validWidth = Math.max(100, width || 100);
  const validHeight = Math.max(100, height || 100);

  const palette = CHART_PALETTE;
  const labelGroups = displayLabels.map((label) =>
    label.trim().split(/\s+/).filter(Boolean),
  );
  const maxLabelGroups = Math.max(
    1,
    ...labelGroups.map((parts) => parts.length),
  );
  const tickFontSize = 14;
  const tickLineHeight = 1.2;
  const axisLabelHeight = Math.ceil(
    maxLabelGroups * tickFontSize * tickLineHeight + 6,
  );
  const yMaxData = hasData ? Math.max(...displayValues, 1) : 1;
  const yMax = Math.max(1, Math.ceil(yMaxData * 10) / 10);
  const yTickNumber = yMax <= 2 ? 20 : yMax <= 5 ? 10 : 8;
  const categoryColors = displayLabels.map(
    (_, index) => palette[index % palette.length],
  );
  const chartMargins = { top: 20, right: 10, bottom: 45, left: 48 };
  const yAxisWidth = chartMargins.left - 14;

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
          mb: 1,
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
          position: "relative",
        }}
      >
        <BarChart
          xAxis={[
            {
              scaleType: "band" as const,
              data: displayLabels,
              colorMap: {
                type: "ordinal",
                values: displayLabels,
                colors: categoryColors,
              },
              tickSize: 8,
              height: axisLabelHeight,
              categoryGapRatio: 0.3,
              tickLabelInterval: () => true,
              groups: Array.from({ length: maxLabelGroups }, (_, index) => ({
                getValue: (value: string) =>
                  labelGroups[displayLabels.indexOf(value)]?.[index] ?? "",
              })),
              tickLabelStyle: {
                fill: "#ffffff",
                fontWeight: 700,
                fontSize: tickFontSize,
                lineHeight: tickLineHeight,
              },
            },
          ]}
          yAxis={[
            {
              min: 0,
              max: yMax,
              tickNumber: yTickNumber,
              width: yAxisWidth,
              tickLabelInterval: hasData ? undefined : () => false,
              tickLabelStyle: {
                fill: "#ffffff",
                fontWeight: 700,
                fontSize: 14,
              },
            },
          ]}
          series={[
            {
              data: displayValues,
              valueFormatter: hasData ? (value) => `${value}` : () => "",
            },
          ]}
          width={validWidth}
          height={validHeight - 10}
          margin={chartMargins}
          slots={{
            noDataOverlay: () => null,
          }}
          slotProps={{
            bar: {
              style: { strokeWidth: 1, stroke: "rgba(255, 255, 255, 0.55)" },
            },
            barLabel: hasData
              ? {
                  style: {
                    fill: "#ffffff",
                    fontSize: 16,
                    fontWeight: 600,
                    paintOrder: "stroke",
                    stroke: "rgba(255, 255, 255, 0.9)",
                    strokeWidth: 0.4,
                  },
                }
              : undefined,
          }}
          sx={{
            "& .MuiChartsAxis-line": {
              stroke: "#ffffff !important",
              strokeWidth: "1.75px !important",
              strokeLinecap: "square",
              shapeRendering: "crispEdges",
            },
            "& .MuiChartsAxis-tick": {
              stroke: "#ffffff",
            },
            "& .MuiChartsAxis-tickLine": {
              stroke: "#ffffff",
            },
            "& .MuiChartsAxis-tickMarks": {
              stroke: "#ffffff",
            },
            "& .MuiChartsAxis-root line": {
              stroke: "#ffffff !important",
            },
            "& .MuiChartsAxis-root path": {
              stroke: "#ffffff !important",
            },
            "& .MuiChartsAxis-directionY .MuiChartsAxis-line": {
              stroke: "#ffffff !important",
              strokeWidth: "1.75px !important",
              strokeLinecap: "square",
              shapeRendering: "crispEdges",
            },
            "& .MuiChartsAxis-directionX .MuiChartsAxis-line": {
              stroke: "#ffffff !important",
              strokeWidth: "1.75px !important",
              strokeLinecap: "square",
              shapeRendering: "crispEdges",
            },
            "& .MuiChartsAxis-root text": {
              fill: "#ffffff !important",
              fontSize: "1rem !important",
              fontWeight: "700 !important",
            },
            "& .MuiChartsGrid-line": {
              stroke: "rgba(255, 255, 255, 0.08)",
            },
            "& text.MuiChartsOverlay-root, & .MuiChartsOverlay-root text, & .MuiBar-root > text":
              {
                display: "none",
              },
          }}
          barLabel={hasData ? "value" : undefined}
        />
      </Box>
    </Box>
  );
}
