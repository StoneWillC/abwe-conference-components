import {
  CounterRow,
  GridLayout,
  WidgetProps,
} from "@/interfaces/DashboardProps";
import {
  IconName,
  IconPrefix,
  findIconDefinition,
  library,
} from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Typography } from "@mui/material";
import { CHART_PALETTE } from "../../constants/chartPalette";

let isFontAwesomeLibraryInitialized = false;

const ensureFontAwesomeLibrary = () => {
  if (!isFontAwesomeLibraryInitialized) {
    library.add(fas, far, fab);
    isFontAwesomeLibraryInitialized = true;
  }
};

const resolveCounterIcon = (iconInput?: string | null) => {
  if (!iconInput || typeof iconInput !== "string") {
    return null;
  }

  const raw = iconInput.trim().toLowerCase();
  if (!raw) {
    return null;
  }

  const tokens = raw.split(/\s+/).filter(Boolean);
  let prefix: IconPrefix | null = null;
  let iconName = "";

  tokens.forEach((token) => {
    if (token === "fa-solid" || token === "fas") {
      prefix = "fas";
      return;
    }
    if (token === "fa-regular" || token === "far") {
      prefix = "far";
      return;
    }
    if (token === "fa-brands" || token === "fab") {
      prefix = "fab";
      return;
    }
    if (token.startsWith("fa-") && token.length > 3) {
      iconName = token.slice(3);
      return;
    }
    if (!iconName) {
      iconName = token;
    }
  });

  if (!iconName) {
    return null;
  }

  ensureFontAwesomeLibrary();

  const lookupPrefixes: IconPrefix[] = prefix
    ? [prefix, "fas", "far", "fab"]
    : ["fas", "far", "fab"];

  for (const lookupPrefix of lookupPrefixes) {
    try {
      const definition = findIconDefinition({
        prefix: lookupPrefix,
        iconName: iconName as IconName,
      });

      if (definition?.icon) {
        return definition;
      }
    } catch {
      // Keep trying other prefixes.
    }
  }

  return null;
};

const getBestGridLayout = (
  count: number,
  width: number,
  height: number,
): GridLayout => {
  if (count <= 1) {
    return {
      columns: 1,
      rows: 1,
      tileSize: Math.min(width, height),
    };
  }

  let best: GridLayout = { columns: 1, rows: count, tileSize: 0 };
  let bestScore = 0;

  for (let columns = 1; columns <= count; columns += 1) {
    const rows = Math.ceil(count / columns);
    const tileWidth = width / columns;
    const tileHeight = height / rows;
    const tileSize = Math.min(tileWidth, tileHeight);
    const balance = Math.min(columns / rows, rows / columns);

    // Penalty for unbalanced last row (less aggressive to prefer fewer rows)
    const itemsInLastRow = count % columns || columns;
    const lastRowBalance = itemsInLastRow / columns;
    const balancePenalty =
      lastRowBalance < 0.33 ? 0.7 : lastRowBalance < 0.5 ? 0.85 : 1;

    const score = tileSize * balance * balancePenalty;

    if (score > bestScore) {
      bestScore = score;
      best = { columns, rows, tileSize };
    }
  }

  return best;
};

export default function CounterWidget({
  question,
  labels,
  values,
  counterDisplay = [],
  width,
  height,
  questionFontSize = "18px",
  isHorizontalSpan = false,
  isQuadrant = false,
}: WidgetProps) {
  const valueColors = CHART_PALETTE;
  const rows: CounterRow[] = labels.map((label, index) => ({
    label,
    value: values[index] ?? 0,
    displayText: counterDisplay[index]?.displayText || null,
    displayIcon: counterDisplay[index]?.displayIcon || null,
  }));
  const tileGap = "clamp(0.4rem, 1.4vw, 1.4rem)";
  const tileGapPx = 8; // Pixel value for calc() expressions

  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const headerOffset = 50;
  const contentHeight = Math.max(1, safeHeight - headerOffset);
  const isLongHorizontal = isHorizontalSpan || safeWidth / contentHeight >= 1.8;
  const layout = getBestGridLayout(rows.length, safeWidth, contentHeight);
  const shouldBoostHorizontalTiles = isLongHorizontal && rows.length >= 2;
  const isCompactQuadrantLike = isQuadrant;
  const tilePadding = 1;
  const maxTileScale =
    rows.length === 1
      ? 0.75
      : rows.length <= 2
        ? 0.55
        : rows.length <= 4
          ? shouldBoostHorizontalTiles
            ? 0.95
            : 0.85
          : 0.95;
  const cappedTileSize = Math.min(
    layout.tileSize,
    Math.min(safeWidth, contentHeight) * maxTileScale,
  );
  const count = rows.length;
  const valueRatio = count <= 1 ? 0.65 : count <= 2 ? 0.55 : count <= 4 ? 0.48 : 0.42;
  const labelRatio = count <= 1 ? 0.0 : count <= 2 ? 0.16 : count <= 4 ? 0.14 : 0.12;
  const valueFontSize = isCompactQuadrantLike
    ? `clamp(1.8rem, ${cappedTileSize * 0.3}px, 5rem)`
    : count <= 1
      ? `2cqi`
      : `clamp(2rem, ${cappedTileSize * valueRatio}px, 12rem)`;
  const mainLabelFontSize = isCompactQuadrantLike
    ? `clamp(1rem, ${cappedTileSize * 0.11}px, 2rem)`
    : count <= 1
      ? `2cqi`
      : `clamp(0.6rem, ${cappedTileSize * labelRatio}px, 1.8rem)`;
  const optionIconFontSize = isCompactQuadrantLike
    ? "clamp(1.35rem, 2.2cqi, 2rem)"
    : count <= 1
      ? "3cqi"
      : `clamp(1rem, ${cappedTileSize * 0.2}px, 3rem)`;
  const tileSizeCss = `max(0px, calc(${cappedTileSize}px - ${tileGapPx}px))`;
  const columnTileWidth = Math.max(0, safeWidth / Math.max(1, layout.columns));
  const tileWidthCss = shouldBoostHorizontalTiles
    ? `max(0px, calc(${columnTileWidth}px - ${tileGapPx}px))`
    : tileSizeCss;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        maxWidth: width,
        maxHeight: height,
        boxSizing: "border-box",
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
          textShadow: "0 2px 10px rgba(0, 0, 0, 0.55)",
        }}
      >
        {question}
      </Typography>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexWrap: "wrap",
          gap: `${tileGapPx}px`,
          px: 0,
          py: 0,
          boxSizing: "border-box",
          justifyContent: "center",
          alignContent: "center",
          alignItems: "center",
        }}
      >
        {rows.map((row, index) => {
          const accentColor = valueColors[index % valueColors.length];
          const icon = resolveCounterIcon(row.displayIcon);
          const primaryLabel = row.displayText || row.label;

          return (
            <Box
              key={`${row.label}-${index}`}
              className="counter-option"
              sx={{
                borderRadius: 2,
                bgcolor: "rgba(9, 24, 42, 0.78)",
                background:
                  "linear-gradient(145deg, rgba(16, 42, 72, 0.9), rgba(7, 20, 36, 0.9))",
                border: "1px solid rgba(120, 189, 229, 0.22)",
                boxShadow: "0 10px 22px rgba(0, 0, 0, 0.35)",
                p: tilePadding,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                m: 0,
                width: tileWidthCss,
                height: tileSizeCss,
                minWidth: 0,
                minHeight: 0,
                boxSizing: "border-box",
              }}
                  >
              {icon && (
                <Box
                  className="counter-option__icon"
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: optionIconFontSize,
                    color: accentColor,
                    lineHeight: 1,
                    mb: 0.35,
                  }}
                >
                  <FontAwesomeIcon icon={icon} />
                </Box>
              )}

              <Typography
                variant="body1"
                className="counter-option__main-label"
                sx={{
                  fontWeight: 600,
                  fontSize: mainLabelFontSize,
                  color: "rgba(255, 255, 255, 0.9)",
                  textAlign: "center",
                  lineHeight: 1.15,
                  maxWidth: "94%",
                  mb: 0.35,
                }}
              >
                {primaryLabel}
              </Typography>

              <Typography
                variant="body1"
                className="counter-option__value"
                sx={{
                  fontWeight: 600,
                  color: accentColor,
                  lineHeight: 1,
                  fontSize: valueFontSize,
                  fontFamily: "inherit",
                  mb: 0,
                }}
              >
                {row.value}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
