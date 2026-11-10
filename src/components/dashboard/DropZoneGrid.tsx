import { Box } from "@mui/material";
import { DropZoneGridProps } from "../../interfaces/DashboardComponentProps";
import { WidgetPosition } from "../../types/Widgets";
import {
  getGridStylesForLayout,
  getPositionsForLayout,
  isValidPositionForMap,
} from "../../utils/layoutUtils";
import DropZone from "./DropZone";

export default function DropZoneGrid({
  layout,
  widgets,
  questions,
  onRemove,
  onAdd,
  onWidgetTypeChange,
  isDragging,
  draggedWidgetType,
  draggedFromPosition,
  getAvailableWidgetTypes,
}: DropZoneGridProps) {
  const gridStyles = getGridStylesForLayout(layout);
  const positions = getPositionsForLayout(layout);

  // Find widget at a given position
  const getWidgetAtPosition = (position: WidgetPosition) => {
    const index = widgets.findIndex((w) => w.position === position);
    if (index === -1) return null;
    return { widget: widgets[index], index };
  };

  // Get question label for a widget
  const getQuestionLabel = (questionId: number) => {
    const question = questions.find((q) => q.id === questionId);
    return question?.question || "Unknown Question";
  };

  // Get question type for a widget
  const getQuestionType = (questionId: number) => {
    const question = questions.find((q) => q.id === questionId);
    return question?.questionType || "";
  };

  // Get widget type display name
  const getWidgetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bar: "Bar Chart",
      pie: "Pie Chart",
      map: "Global Country Map",
      wordcloud: "Word Cloud",
    };
    return labels[type] || type;
  };

  return (
    <Box
      sx={{
        display: "grid",
        ...gridStyles,
        gap: 2,
        minHeight: 200,
        p: 1,
      }}
    >
      {positions.map((position) => {
        const widgetData = getWidgetAtPosition(position);
        const isOccupied = widgetData !== null;

        // Check if this position is valid for the currently dragged widget (map constraint)
        // Also check if the target widget (if occupied) can move to the source position
        let isValidDrop = true;
        if (draggedWidgetType) {
          // Check if dragged widget (if map) can go to this position
          if (
            draggedWidgetType === "map" &&
            !isValidPositionForMap(position, layout)
          ) {
            isValidDrop = false;
          }
          // Check if target widget (if map) can go to source position
          if (
            isOccupied &&
            widgetData?.widget.widget_type === "map" &&
            draggedFromPosition
          ) {
            if (!isValidPositionForMap(draggedFromPosition, layout)) {
              isValidDrop = false;
            }
          }
        }

        const questionType = widgetData
          ? getQuestionType(widgetData.widget.survey_question_id)
          : "";

        return (
          <DropZone
            key={position}
            position={position}
            isOccupied={isOccupied}
            isValidDrop={isValidDrop}
            widgetLabel={
              widgetData
                ? getQuestionLabel(widgetData.widget.survey_question_id)
                : undefined
            }
            widgetType={
              widgetData
                ? getWidgetTypeLabel(widgetData.widget.widget_type)
                : undefined
            }
            widgetTypeRaw={widgetData?.widget.widget_type}
            availableWidgetTypes={
              widgetData ? getAvailableWidgetTypes(questionType) : undefined
            }
            onWidgetTypeChange={
              widgetData
                ? (newType) => onWidgetTypeChange(widgetData.index, newType)
                : undefined
            }
            onRemove={widgetData ? () => onRemove(widgetData.index) : undefined}
            onAdd={!isOccupied ? onAdd : undefined}
            isDragging={isDragging}
          />
        );
      })}
    </Box>
  );
}
