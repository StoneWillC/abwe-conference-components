// Widget type definitions for Dashboard

// Widget position within the grid (defined first as it's used by widget types)
export type WidgetPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-span" // Spans top-left + top-right
  | "bottom-span" // Spans bottom-left + bottom-right
  | "left-span" // Spans top-left + bottom-left
  | "right-span" // Spans top-right + bottom-right
  | "full"; // Full screen (single layout)

// Widget position within the grid (defined first as it's used by widget types)
export type BarWidget = {
  type: "bar";
  question: string;
  labels: string[];
  values: number[];
  tickerMessages?: string[];
  position?: WidgetPosition;
  survey_question_id?: number;
};

export type CounterWidget = {
  type: "counter";
  question: string;
  labels: string[];
  values: number[];
  counterDisplay?: Array<{
    label: string;
    displayText?: string | null;
    displayIcon?: string | null;
  }>;
  tickerMessages?: string[];
  position?: WidgetPosition;
  survey_question_id?: number;
};

export type MapWidget = {
  type: "map";
  question: string;
  labels: string[];
  values: number[];
  tickerMessages?: string[];
  position?: WidgetPosition;
  survey_question_id?: number;
};

export type WordCloudWidget = {
  type: "wordcloud";
  words: { text: string; value: number }[];
  tickerMessages?: string[];
  position?: WidgetPosition;
  survey_question_id?: number;
};

export type PieWidget = {
  type: "pie";
  question: string;
  labels: string[];
  values: number[];
  tickerMessages?: string[];
  position?: WidgetPosition;
  survey_question_id?: number;
};

export type BlankWidget = {
  type: "blank";
  question?: string;
  tickerMessages?: string[];
  position?: WidgetPosition;
  survey_question_id?: number;
};

export type DashboardWidget =
  | BarWidget
  | CounterWidget
  | MapWidget
  | WordCloudWidget
  | PieWidget
  | BlankWidget;

// Dashboard layout types
export type DashboardLayout =
  // 1 widget
  | "single"
  // 2 widgets
  | "two-column"
  | "two-row"
  // 3 widgets
  | "three-left"
  | "three-right"
  | "three-top"
  | "three-bottom"
  // 4 widgets
  | "four-quadrants";

export type DashboardData = {
  layout?: DashboardLayout;
  widgets: DashboardWidget[];
  participants: number;
  eventName: string;
  sessionName: string;
};

// WIDGET SIZING CONFIGURATION
// Adjust these padding values to control spacing around widgets
// Lower numbers = larger widgets, Higher numbers = more padding
export const WIDGET_SIZING = {
  bar: {
    widthPadding: 20,
    heightPadding: 30,
  },
  counter: {
    widthPadding: 10,
    heightPadding: 20,
  },
  pie: {
    widthPadding: 20,
    heightPadding: 30,
  },
  map: {
    widthPadding: 20,
    heightPadding: 30,
  },
  wordcloud: {
    widthPadding: 20,
    heightPadding: 30,
  },
  blank: {
    widthPadding: 20,
    heightPadding: 30,
  },
};

export interface WidgetConfig {
  survey_question_id: number;
  widget_type: "bar" | "pie" | "map" | "wordcloud" | "counter";
  map_country_question_id?: number;
  position?: WidgetPosition; // Grid position (optional for backward compatibility)
}

export const WIDGET_TYPES: {
  value: WidgetConfig["widget_type"];
  label: string;
}[] = [
  { value: "bar", label: "Bar Chart" },
  { value: "counter", label: "Counter" },
  { value: "pie", label: "Pie Chart" },
  { value: "map", label: "World Map" },
  // { value: "wordcloud", label: "Word Cloud" }, // Temporarily disabled
];
