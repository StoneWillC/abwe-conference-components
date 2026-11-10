import PersonIcon from "@mui/icons-material/Person";
import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import abweLogoWhite from "../../assets/ABWE-Icon-WHITE.png";
import { DashboardDisplayProps } from "../../interfaces/DashboardProps";
import {
  DashboardWidget,
  WIDGET_SIZING,
  WidgetPosition,
} from "../../types/Widgets";
import {
  getGridAreaForPosition,
  getGridStylesForLayout,
  getPositionsForLayout,
} from "../../utils/layoutUtils";
import DashboardBox from "../layout/DashboardBox";
import BarGraph from "../widgets/BarGraph";
import CounterWidget from "../widgets/CounterWidget";
import { PieGraph } from "../widgets/PieGraph";
import TickerTape from "../widgets/TickerTape";
import WordCloudGraph from "../widgets/WordCloudGraph";
import WorldMapGraph from "../widgets/WorldMapGraph";

export default function DashboardDisplay({
  eventName,
  sessionName,
  participants,
  widgets,
  layout = "four-quadrants",
  containerHeight,
  reportingMode = false,
  winnerMessages = [],
  tickerVisible = true,
}: DashboardDisplayProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: containerHeight || window.innerHeight,
  });

  // Measure header height
  useEffect(() => {
    if (!headerRef.current) return;

    const ro = new ResizeObserver(() => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    });

    ro.observe(headerRef.current);
    setHeaderHeight(headerRef.current.offsetHeight);

    return () => ro.disconnect();
  }, []);

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: containerHeight || window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [containerHeight]);

  // Update dimensions when containerHeight changes
  useEffect(() => {
    if (containerHeight !== undefined) {
      setDimensions({
        width: window.innerWidth,
        height: containerHeight,
      });
    }
  }, [containerHeight]);

  // Get positions for layout and build widget map
  const positions = getPositionsForLayout(layout);
  const gridStyles = getGridStylesForLayout(layout);

  // Build map of position -> widget for efficient lookup
  const widgetByPosition = new Map<WidgetPosition, DashboardWidget>();
  widgets.forEach((widget) => {
    if (widget.position) {
      widgetByPosition.set(widget.position, widget);
    }
  });

  // If widgets don't have positions (legacy), assign by array order
  if (widgetByPosition.size === 0 && widgets.length > 0) {
    widgets.slice(0, positions.length).forEach((widget, i) => {
      widgetByPosition.set(positions[i], widget);
    });
  }

  // Create normalized widgets array with blanks for empty positions
  const normalizedWidgets: Array<{
    widget: DashboardWidget;
    position: WidgetPosition;
  }> = positions.map((position) => ({
    widget: widgetByPosition.get(position) || { type: "blank" },
    position,
  }));

  // Calculate dimensions based on layout and position
  const safeHeaderHeight = Math.max(0, headerHeight);
  const availableHeight = Math.max(
    1,
    dimensions.height - safeHeaderHeight - 30,
  );
  const baseWidth = Math.max(1, dimensions.width - 100);
  const baseHeight = Math.max(1, availableHeight - 20);

  const getWidgetDimensions = (position: WidgetPosition) => {
    // For spanning positions, adjust dimensions accordingly
    const isHorizontalSpan =
      position === "top-span" || position === "bottom-span";
    const isVerticalSpan =
      position === "left-span" || position === "right-span";
    const isFull = position === "full";

    // Base cell dimensions (half of available space)
    const cellWidth = baseWidth / 2;
    const cellHeight = baseHeight / 2;

    if (isFull || layout === "single") {
      return {
        width: Math.max(0, baseWidth),
        height: Math.max(0, baseHeight),
      };
    }

    if (layout === "two-row") {
      return {
        width: Math.max(0, baseWidth),
        height: Math.max(0, cellHeight),
      };
    }

    if (layout === "two-column") {
      return {
        width: Math.max(0, cellWidth),
        height: Math.max(0, baseHeight),
      };
    }

    if (isHorizontalSpan) {
      return {
        width: Math.max(0, baseWidth),
        height: Math.max(0, cellHeight),
      };
    }

    if (isVerticalSpan) {
      return {
        width: Math.max(0, cellWidth),
        height: Math.max(0, baseHeight),
      };
    }

    // Standard quadrant
    return {
      width: Math.max(0, cellWidth),
      height: Math.max(0, cellHeight),
    };
  };

  const renderWidget = (widget: DashboardWidget, position: WidgetPosition) => {
    const { width, height } = getWidgetDimensions(position);
    const questionFontSize = layout === "single" ? "26px" : "18px";
    const widgetProps = {
      width: width - (WIDGET_SIZING[widget.type]?.widthPadding || 60),
      height: height - (WIDGET_SIZING[widget.type]?.heightPadding || 80),
      questionFontSize,
    };

    switch (widget.type) {
      case "bar":
        return (
          <BarGraph
            question={widget.question || ""}
            labels={widget.labels || []}
            values={widget.values || []}
            {...widgetProps}
          />
        );
      case "counter":
        const isQuadrant =
          position === "top-left" ||
          position === "top-right" ||
          position === "bottom-left" ||
          position === "bottom-right";
        return (
          <CounterWidget
            question={widget.question || ""}
            labels={widget.labels || []}
            values={widget.values || []}
            counterDisplay={widget.counterDisplay || []}
            isQuadrant={isQuadrant}
            isHorizontalSpan={
              position === "top-span" || position === "bottom-span"
            }
            {...widgetProps}
          />
        );
      case "pie":
        return (
          <PieGraph
            question={widget.question || ""}
            labels={widget.labels || []}
            values={widget.values || []}
            {...widgetProps}
          />
        );
      case "map":
        return (
          <WorldMapGraph
            question={widget.question || ""}
            labels={widget.labels || []}
            values={widget.values || []}
            width={widgetProps.width}
            height={widgetProps.height}
            titleFontSize={widgetProps.questionFontSize}
            theme="dark"
          />
        );
      case "wordcloud":
        return (
          <WordCloudGraph
            words={widget.words || []}
            width={widgetProps.width}
            height={widgetProps.height}
            question={
              ("question" in widget ? widget.question : "Keywords") as string
            }
            questionFontSize={widgetProps.questionFontSize}
          />
        );
      default:
        return (
          <Typography variant="body1" textAlign="center">
            {widget.type === "blank" && widget.question
              ? widget.question
              : "Reserved / Blank"}
          </Typography>
        );
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "var(--abwe-blue-dark)",
        color: "#e6f1ff",
      }}
    >
      {/* Header */}
      <Box
        ref={headerRef}
        sx={{
          px: 3,
          flexShrink: 0,
          pt: 2,
          pb: 1,
          color: "#e6f1ff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
            <Typography variant={reportingMode ? "h6" : "h4"} sx={{ color: "#ffffff" }}>
              {eventName}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {reportingMode ? (
              <Typography variant="h3" sx={{ color: "#ffffff", fontWeight: 600 }}>
                {sessionName}
              </Typography>
            ) : (
              <Box
                component="img"
                src={abweLogoWhite}
                alt="ABWE"
                sx={{ height: 44, opacity: 0.98 }}
              />
            )}
          </Box>
          <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon sx={{ color: "#ffffff" }} />
              <Typography variant={reportingMode ? "h6" : "h4"} sx={{ color: "#ffffff" }}>
                {reportingMode
                  ? `${participants} Submissions`
                  : `Total Submissions: ${participants}`}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Winners Ticker - Always mounted, visibility controlled by height */}
      <Box
        sx={{
          flexShrink: 0,
          position: "relative",
          height: tickerVisible && winnerMessages.length > 0 ? "60px" : 0,
          overflow: "hidden",
          width: "100%",
          transition: "height 0.2s",
        }}
      >
        <TickerTape
          messages={winnerMessages}
          speed={50}
          showToggle={false}
          defaultVisible={true}
        />
      </Box>

      {/* Dashboard Grid - Layout Dependent */}
      <Box
        sx={{
          flex: 1,
          display: "grid",
          ...gridStyles,
          gap: 2,
          px: 3,
          pb: 2,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {normalizedWidgets.map(({ widget, position }) => (
          <Box
            key={position}
            sx={{ gridArea: getGridAreaForPosition(position) }}
          >
            <DashboardBox>
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 0,
                }}
              >
                {renderWidget(widget, position)}
              </Box>
            </DashboardBox>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
