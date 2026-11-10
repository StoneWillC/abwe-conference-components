import {
  DashboardLayout,
  WidgetConfig,
  WidgetPosition,
} from "../types/Widgets";

// Layout configurations with their grid areas and positions
export const LAYOUT_CONFIG: Record<
  DashboardLayout,
  {
    positions: WidgetPosition[];
    gridTemplateAreas: string;
    gridTemplateColumns: string;
    gridTemplateRows: string;
  }
> = {
  // 1 widget
  single: {
    positions: ["full"],
    gridTemplateAreas: `"full full" "full full"`,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
  },

  // 2 widgets
  "two-column": {
    positions: ["left-span", "right-span"],
    gridTemplateAreas: `"left right" "left right"`,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
  },
  "two-row": {
    positions: ["top-span", "bottom-span"],
    gridTemplateAreas: `"top top" "bottom bottom"`,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
  },

  // 3 widgets
  "three-left": {
    positions: ["left-span", "top-right", "bottom-right"],
    gridTemplateAreas: `"left tr" "left br"`,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
  },
  "three-right": {
    positions: ["top-left", "right-span", "bottom-left"],
    gridTemplateAreas: `"tl right" "bl right"`,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
  },
  "three-top": {
    positions: ["top-span", "bottom-left", "bottom-right"],
    gridTemplateAreas: `"top top" "bl br"`,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
  },
  "three-bottom": {
    positions: ["top-left", "top-right", "bottom-span"],
    gridTemplateAreas: `"tl tr" "bottom bottom"`,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
  },

  // 4 widgets
  "four-quadrants": {
    positions: ["top-left", "top-right", "bottom-left", "bottom-right"],
    gridTemplateAreas: `"tl tr" "bl br"`,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
  },
};

// Map position to CSS grid area name
export const POSITION_TO_GRID_AREA: Record<WidgetPosition, string> = {
  "top-left": "tl",
  "top-right": "tr",
  "bottom-left": "bl",
  "bottom-right": "br",
  "top-span": "top",
  "bottom-span": "bottom",
  "left-span": "left",
  "right-span": "right",
  full: "full",
};

// Get positions for a layout
export function getPositionsForLayout(
  layout: DashboardLayout,
): WidgetPosition[] {
  return LAYOUT_CONFIG[layout].positions;
}

// Get grid styles for a layout
export function getGridStylesForLayout(layout: DashboardLayout): {
  gridTemplateAreas: string;
  gridTemplateColumns: string;
  gridTemplateRows: string;
} {
  const config = LAYOUT_CONFIG[layout];
  return {
    gridTemplateAreas: config.gridTemplateAreas,
    gridTemplateColumns: config.gridTemplateColumns,
    gridTemplateRows: config.gridTemplateRows,
  };
}

// Get grid area for a position
export function getGridAreaForPosition(position: WidgetPosition): string {
  return POSITION_TO_GRID_AREA[position];
}

// Get valid layouts for widget count
export function getValidLayoutsForCount(
  count: number,
  _hasMap: boolean = false,
): DashboardLayout[] {
  switch (count) {
    case 1:
      return ["single"];
    case 2:
      return ["two-column", "two-row"];
    case 3:
      return ["three-left", "three-right", "three-top", "three-bottom"];
    case 4:
      return ["four-quadrants"];
    default:
      return ["single"];
  }
}

// Get default layout for widget count
export function getDefaultLayoutForCount(
  count: number,
  hasMap: boolean,
): DashboardLayout {
  const validLayouts = getValidLayoutsForCount(count, hasMap);
  return validLayouts[0];
}

// Check if a position is valid for a map widget
export function isValidPositionForMap(
  _position: WidgetPosition,
  _layout: DashboardLayout,
): boolean {
  return true;
}

// Migrate old config format to include positions
export function migrateConfig(
  widgets: WidgetConfig[],
  layout: DashboardLayout,
): WidgetConfig[] {
  // If first widget already has position, assume already migrated
  if (widgets.length > 0 && widgets[0].position) {
    return widgets;
  }

  const positions = getPositionsForLayout(layout);
  return widgets.map((widget, index) => ({
    ...widget,
    position: positions[index] || positions[0],
  }));
}

// Get the next available position in a layout
export function getNextAvailablePosition(
  layout: DashboardLayout,
  occupiedPositions: WidgetPosition[],
): WidgetPosition | null {
  const allPositions = getPositionsForLayout(layout);
  const available = allPositions.find(
    (pos) => !occupiedPositions.includes(pos),
  );
  return available || null;
}

// Layout display names for UI
export const LAYOUT_DISPLAY_NAMES: Record<DashboardLayout, string> = {
  single: "Single",
  "two-column": "Two Column",
  "two-row": "Two Row",
  "three-left": "Three (Large Left)",
  "three-right": "Three (Large Right)",
  "three-top": "Three (Large Top)",
  "three-bottom": "Three (Large Bottom)",
  "four-quadrants": "Four Quadrants",
};

// Get max widgets for a layout
export function getMaxWidgetsForLayout(layout: DashboardLayout): number {
  return LAYOUT_CONFIG[layout].positions.length;
}
