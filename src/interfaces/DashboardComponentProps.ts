import {
  DashboardLayout,
  WidgetConfig,
  WidgetPosition,
} from "../types/Widgets";

export interface WidgetTypeOption {
  value: string;
  label: string;
}

export interface DashboardQuestionOption {
  id: number;
  question: string;
  questionType: string;
}

export interface DropZoneProps {
  position: WidgetPosition;
  isOccupied: boolean;
  isValidDrop: boolean;
  widgetLabel?: string;
  widgetType?: string;
  widgetTypeRaw?: string;
  availableWidgetTypes?: WidgetTypeOption[];
  onWidgetTypeChange?: (newType: string) => void;
  onRemove?: () => void;
  onAdd?: () => void;
  isDragging?: boolean;
}

export interface DropZoneGridProps {
  layout: DashboardLayout;
  widgets: WidgetConfig[];
  questions: DashboardQuestionOption[];
  onRemove: (index: number) => void;
  onAdd: () => void;
  onWidgetTypeChange: (index: number, newType: string) => void;
  isDragging: boolean;
  draggedWidgetType?: string;
  draggedFromPosition?: WidgetPosition;
  getAvailableWidgetTypes: (questionType: string) => WidgetTypeOption[];
}

export interface LayoutDropdownProps {
  selectedLayout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout, questionCount: number) => void;
}

export interface LayoutOption {
  layout: DashboardLayout;
  description: string;
}

export interface LayoutSelectorProps {
  widgetCount: number;
  hasMap: boolean;
  selectedLayout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
}
