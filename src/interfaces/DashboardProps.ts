import { GeoJsonFeature, GeoJsonProperties } from "topojson-client";
import {
  DashboardLayout,
  DashboardWidget,
  WidgetConfig,
} from "../types/Widgets";
import { QuestionOption } from "./Question";

export interface DashboardDisplayProps {
  eventName: string;
  sessionName: string;
  participants: number;
  widgets: DashboardWidget[];
  layout?: DashboardLayout;
  containerHeight?: number;
  showFullscreenButton?: boolean;
  reportingMode?: boolean;
  winnerMessages?: string[];
  tickerVisible?: boolean;
}

export interface DashboardPreviewProps {
  open: boolean;
  onClose: () => void;
  config: WidgetConfig[];
  questions: QuestionOption[];
  layout?: DashboardLayout;
  eventName?: string;
  sessionName?: string;
}

export interface DashboardConfigModalProps {
  open: boolean;
  onClose: () => void;
  surveyCode?: string;
  surveyTemplateId?: number;
  eventName?: string;
  sessionName?: string;
  mode?: "survey" | "reporting";
  reportingQuestions?: QuestionOption[];
  reportingInitialConfig?: WidgetConfig[];
  reportingInitialLayout?: DashboardLayout;
  onApplyReportingConfig?: (payload: {
    layout: DashboardLayout;
    config: WidgetConfig[];
  }) => void;
}

export type WidgetProps = {
  question: string;
  labels: string[];
  values: number[];
  counterDisplay?: Array<{
    label: string;
    displayText?: string | null;
    displayIcon?: string | null;
  }>;
  width: number;
  height: number;
  questionFontSize?: number | string;
  isHorizontalSpan?: boolean;
  isQuadrant?: boolean;
};

export type CounterRow = {
  label: string;
  value: number;
  displayText?: string | null;
  displayIcon?: string | null;
};

export type GridLayout = {
  columns: number;
  rows: number;
  tileSize: number;
};

export type MapWidgetProps = {
  question: string;
  labels: string[];
  values: number[];
  width: number;
  height: number;
  enableZoom?: boolean;
  flagScale?: number;
  center?: { lat: number; lng: number };
  zoom?: number;
  theme?: "classic" | "dark";
  titleFontSize?: number | string;
  persistKey?: string;
};

export type CountryData = {
  [countryCode: string]: {
    name: string;
    value: number;
  };
};

export interface CountryFeature extends GeoJsonFeature {
  id?: string | number;
  properties: GeoJsonProperties;
}

export default interface DisplayIconOption {
  label: string;
  value: string;
  keywords: string[];
}
