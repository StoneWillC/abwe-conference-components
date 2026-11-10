import { DashboardConfigModalProps } from "@/interfaces/DashboardProps";
import { QuestionOption } from "@/interfaces/Question";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import apiService from "../../services/api";
import {
  DashboardLayout,
  WIDGET_TYPES,
  WidgetConfig,
  WidgetPosition,
} from "../../types/Widgets";
import {
  getDefaultLayoutForCount,
  getMaxWidgetsForLayout,
  getPositionsForLayout,
  isValidPositionForMap,
  migrateConfig,
} from "../../utils/layoutUtils";
import DashboardPreview from "../dashboard/DashboardPreview";
import DropZoneGrid from "../dashboard/DropZoneGrid";
import LayoutDropdown from "../dashboard/LayoutDropdown";
import AddExistingModal from "./AddExistingModal";

export default function DashboardConfigModal({
  open,
  onClose,
  surveyCode,
  surveyTemplateId,
  eventName,
  sessionName,
  mode = "survey",
  reportingQuestions = [],
  reportingInitialConfig = [],
  reportingInitialLayout,
  onApplyReportingConfig,
}: DashboardConfigModalProps) {
  const isTemplateMode = !!surveyTemplateId;
  const [questions, setQuestions] = useState<QuestionOption[]>([]);
  const [config, setConfig] = useState<WidgetConfig[]>([]);
  const [layout, setLayout] = useState<DashboardLayout>("single");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addQuestionDialogOpen, setAddQuestionDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWidgetType, setDraggedWidgetType] = useState<
    string | undefined
  >();
  const [draggedFromPosition, setDraggedFromPosition] = useState<
    WidgetPosition | undefined
  >();
  const [activeWidget, setActiveWidget] = useState<{
    position: WidgetPosition;
    questionLabel: string;
    widgetType: string;
  } | null>(null);
  const [manuallyRemovedIds, setManuallyRemovedIds] = useState<Set<number>>(
    new Set(),
  );
  const [templateDisplayMode, setTemplateDisplayMode] = useState<
    "qr-full" | "qr-corner-main" | "qr-corner-map" | "main"
  >("qr-corner-main");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isReportingMode = mode === "reporting";

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Reset hasLoaded and manuallyRemovedIds when modal closes or survey code changes
  useEffect(() => {
    if (!open) {
      setHasLoaded(false);
      setManuallyRemovedIds(new Set());
      setTemplateDisplayMode("qr-corner-main");
    }
  }, [open]);

  useEffect(() => {
    setHasLoaded(false);
  }, [surveyCode, surveyTemplateId]);

  useEffect(() => {
    if (
      open &&
      !hasLoaded &&
      ((isReportingMode && reportingQuestions.length > 0) ||
        (!isReportingMode && (surveyCode || surveyTemplateId)))
    ) {
      loadConfiguration();
    }
  }, [
    open,
    surveyCode,
    surveyTemplateId,
    hasLoaded,
    isReportingMode,
    reportingQuestions,
    reportingInitialConfig,
    reportingInitialLayout,
  ]);

  // Check if all positions are filled (no blank spots)
  const maxPositions = getMaxWidgetsForLayout(layout);
  const hasBlankSpots = config.length < maxPositions;

  const loadConfiguration = async () => {
    if (isReportingMode) {
      setLoading(true);
      setError(null);

      const loadedQuestions = reportingQuestions;
      setQuestions(loadedQuestions);

      const fallbackLayout = getDefaultLayoutForCount(
        Math.max(reportingInitialConfig.length || 1, 1),
        false,
      );
      const loadedLayout = reportingInitialLayout || fallbackLayout;
      const migratedConfig = migrateConfig(
        reportingInitialConfig,
        loadedLayout,
      );

      setConfig(migratedConfig);
      setLayout(loadedLayout);
      setHasLoaded(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const response = isTemplateMode
      ? await apiService.getTemplateDashboardConfig(surveyTemplateId!)
      : await apiService.getDashboardConfig(surveyCode!);

    if (response.success) {
      const loadedQuestions = response.questions || [];
      setQuestions(loadedQuestions);

      // Set display mode for template mode
      if (isTemplateMode && response.display_mode) {
        setTemplateDisplayMode(response.display_mode);
      }

      let loadedLayout =
        response.layout ||
        getDefaultLayoutForCount((response.config || []).length || 1, false);
      // Migrate old config format to include positions
      const migratedConfig = migrateConfig(response.config || [], loadedLayout);

      // If no instance config exists, try using template default
      let configToUse = migratedConfig;
      if (!isTemplateMode && migratedConfig.length === 0 && response.template_default) {
        const tmplDefault = response.template_default;
        configToUse = migrateConfig(tmplDefault.config || [], tmplDefault.layout);
        loadedLayout = tmplDefault.layout;
      }

      // Auto-fill with available questions if no existing config
      if (configToUse.length === 0 && loadedQuestions.length > 0) {
        // Filter to questions that can be displayed (not text_input)
        const displayableQuestions = loadedQuestions.filter(
          (q: QuestionOption) => q.question_type !== "text_input",
        );

        // Determine layout based on question count
        const questionCount = Math.min(displayableQuestions.length, 4);
        const hasMap = displayableQuestions.some(
          (q: QuestionOption) => q.question_type === "map",
        );
        loadedLayout = getDefaultLayoutForCount(questionCount, hasMap);

        // Get positions for the layout (ordered left-to-right, top-to-bottom)
        const positions = getPositionsForLayout(loadedLayout);

        // Build config from questions in order, but be smart about map placement
        const autoConfig: WidgetConfig[] = [];
        const usedWidgetTypes: string[] = [];
        const usedPositions: WidgetPosition[] = [];

        // Separate map and non-map questions
        const mapQuestions = displayableQuestions.filter(
          (q: QuestionOption) => q.question_type === "map",
        );
        const nonMapQuestions = displayableQuestions.filter(
          (q: QuestionOption) => q.question_type !== "map",
        );

        // Process non-map questions first (they can go anywhere)
        const questionsToProcess = [...nonMapQuestions, ...mapQuestions].slice(
          0,
          positions.length,
        );

        questionsToProcess.forEach((question: QuestionOption) => {
          // Determine widget type based on question type
          const availableTypes = WIDGET_TYPES.filter((wt) =>
            canUseWidgetType(question.question_type, wt.value),
          );

          // Pick first unused type, or first available
          const unusedType = availableTypes.find(
            (wt) => !usedWidgetTypes.includes(wt.value),
          );
          const widgetType = (unusedType?.value ||
            availableTypes[0]?.value ||
            "bar") as "bar" | "pie" | "map" | "wordcloud";
          usedWidgetTypes.push(widgetType);

          // Find next available position that's valid for this widget type
          let position: WidgetPosition | undefined;
          for (const pos of positions) {
            if (usedPositions.includes(pos)) continue;
            // Check if this position is valid for map widgets
            if (
              widgetType === "map" &&
              !isValidPositionForMap(pos, loadedLayout)
            )
              continue;
            position = pos;
            break;
          }

          if (!position) return; // No valid position found

          usedPositions.push(position);

          const questionId =
            typeof question.survey_question_id === "string"
              ? parseInt(question.survey_question_id)
              : question.survey_question_id;

          autoConfig.push({
            survey_question_id: questionId,
            widget_type: widgetType,
            position: position,
          });
        });

        setConfig(autoConfig);
        setLayout(loadedLayout);
      } else {
        // Check if layout makes sense for question count
        const displayableQuestions = loadedQuestions.filter(
          (q: QuestionOption) => q.question_type !== "text_input",
        );
        const maxForLayout = getMaxWidgetsForLayout(loadedLayout);

        // If saved layout has more positions than displayable questions
        // and no config exists, auto-select appropriate layout
        if (
          configToUse.length === 0 &&
          displayableQuestions.length < maxForLayout
        ) {
          const questionCount = Math.min(displayableQuestions.length, 4);
          const hasMap = displayableQuestions.some(
            (q: QuestionOption) => q.question_type === "map",
          );
          loadedLayout = getDefaultLayoutForCount(questionCount || 1, hasMap);
        }

        setConfig(configToUse);
        setLayout(loadedLayout);
      }
      setHasLoaded(true);
    } else {
      setError(response.error || "Failed to load configuration");
    }

    setLoading(false);
  };

  const handleAddQuestions = (questionIds: (number | string)[]) => {
    const newConfigs: WidgetConfig[] = [];
    const currentUsedWidgetTypes = new Set<string>(
      config.map((c) => c.widget_type),
    );

    // Limit to max widgets based on layout
    const maxWidgets = getMaxWidgetsForLayout(layout);
    const maxToAdd = Math.min(questionIds.length, maxWidgets - config.length);
    const idsToAdd = questionIds.slice(0, maxToAdd);

    idsToAdd.forEach((id) => {
      const questionId = typeof id === "string" ? parseInt(id) : id;

      const question = questions.find((q) => {
        const qId =
          typeof q.survey_question_id === "string"
            ? parseInt(q.survey_question_id)
            : q.survey_question_id;
        return qId === questionId;
      });

      if (!question) {
        return;
      }

      // Get available widget types for this question
      const availableWidgetTypes = WIDGET_TYPES.filter((wt) =>
        canUseWidgetType(question.question_type, wt.value),
      );

      if (availableWidgetTypes.length === 0) return;

      // Find the first available widget type that hasn't been used
      const unusedWidget = availableWidgetTypes.find(
        (wt) => !currentUsedWidgetTypes.has(wt.value),
      );
      const defaultWidget = (unusedWidget?.value ||
        availableWidgetTypes[0]?.value ||
        "bar") as "bar" | "pie" | "map" | "wordcloud" | "counter";

      // Track this widget type as used for the next question
      currentUsedWidgetTypes.add(defaultWidget);

      // Get next available position that's valid for this widget type
      const occupiedPositions = [...config, ...newConfigs]
        .map((c) => c.position)
        .filter((p): p is WidgetPosition => p !== undefined);

      // Find a valid position (respecting map constraints)
      const allPositions = getPositionsForLayout(layout);
      let nextPosition: WidgetPosition | undefined;
      for (const pos of allPositions) {
        if (occupiedPositions.includes(pos)) continue;
        if (defaultWidget === "map" && !isValidPositionForMap(pos, layout))
          continue;
        nextPosition = pos;
        break;
      }

      if (!nextPosition) return; // No valid position available

      newConfigs.push({
        survey_question_id: questionId,
        widget_type: defaultWidget,
        position: nextPosition,
      });
    });

    const updatedConfig = [...config, ...newConfigs];

    // Only change layout if the current layout can't accommodate all widgets
    // (i.e., we have more widgets than positions in the current layout)
    const newCount = updatedConfig.length;
    const maxPositions = getMaxWidgetsForLayout(layout);
    if (newCount > maxPositions) {
      // Need to upgrade to a larger layout
      const hasMap = updatedConfig.some((w) => w.widget_type === "map");
      const newLayout = getDefaultLayoutForCount(newCount, hasMap);
      setLayout(newLayout);
      // Reassign positions for new layout
      const positions = getPositionsForLayout(newLayout);
      updatedConfig.forEach((w, i) => {
        w.position = positions[i];
      });
    }
    setConfig(updatedConfig);
    setAddQuestionDialogOpen(false);
  };

  const handleRemoveQuestion = (index: number) => {
    // Track manually removed questions so they don't auto-populate
    const removedWidget = config[index];
    setManuallyRemovedIds(
      (prev) => new Set([...prev, removedWidget.survey_question_id]),
    );
    // Remove the widget, leaving a blank spot in the layout
    const newConfig = [...config];
    newConfig.splice(index, 1);
    setConfig(newConfig);
  };

  // Helper to get question label
  const getQuestionLabel = (questionId: number) => {
    const question = questions.find((q) => {
      const qId =
        typeof q.survey_question_id === "string"
          ? parseInt(q.survey_question_id)
          : q.survey_question_id;
      return qId === questionId;
    });
    return question?.question_text || "Unknown Question";
  };

  // Helper to get widget type display name
  const getWidgetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bar: "Bar Chart",
      pie: "Pie Chart",
      map: "World Map",
      wordcloud: "Word Cloud",
    };
    return labels[type] || type;
  };

  // Helper to get available widget types for a question type
  const getAvailableWidgetTypes = (questionType: string) => {
    return WIDGET_TYPES.filter((wt) =>
      canUseWidgetType(questionType, wt.value),
    );
  };

  // Helper to get display types description for a question
  const getDisplayTypesDescription = (questionType: string) => {
    const available = getAvailableWidgetTypes(questionType);
    if (available.length === 0) return "No display types available";
    return available.map((wt) => wt.label).join(", ");
  };

  // Handle widget type change
  const handleWidgetTypeChange = (index: number, newType: string) => {
    const newConfig = [...config];
    newConfig[index] = {
      ...newConfig[index],
      widget_type: newType as "bar" | "pie" | "map" | "wordcloud",
    };
    setConfig(newConfig);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    // Find the widget being dragged - draggable IDs are now "drag-{position}"
    const activeId = String(event.active.id);
    const position = activeId.replace("drag-", "") as WidgetPosition;
    const widget = config.find((w) => w.position === position);
    setDraggedWidgetType(widget?.widget_type);
    setDraggedFromPosition(position);

    // Set active widget for drag overlay
    if (widget) {
      setActiveWidget({
        position,
        questionLabel: getQuestionLabel(widget.survey_question_id),
        widgetType: getWidgetTypeLabel(widget.widget_type),
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    setDraggedWidgetType(undefined);
    setDraggedFromPosition(undefined);
    setActiveWidget(null);

    const { active, over } = event;
    if (!over) return;

    // Get the target position from the drop zone (droppable IDs are "zone-{position}")
    const targetPosition = over.data.current?.position as
      | WidgetPosition
      | undefined;
    if (!targetPosition) return;

    // Get the source position from the dragged widget (draggable IDs are "drag-{position}")
    const sourcePosition = active.data.current?.position as
      | WidgetPosition
      | undefined;
    if (!sourcePosition || sourcePosition === targetPosition) return;

    // Find widgets at source and target positions
    const sourceIndex = config.findIndex((w) => w.position === sourcePosition);
    const targetIndex = config.findIndex((w) => w.position === targetPosition);

    if (sourceIndex === -1) return;

    const newConfig = [...config];

    // Check if this is a valid move for map widgets
    const sourceWidget = newConfig[sourceIndex];
    if (
      sourceWidget.widget_type === "map" &&
      !isValidPositionForMap(targetPosition, layout)
    ) {
      return; // Invalid move for map
    }

    if (targetIndex === -1) {
      // Moving to empty position - just update position
      newConfig[sourceIndex].position = targetPosition;
    } else {
      // Swapping positions with another widget
      const targetWidget = newConfig[targetIndex];

      // Check if target widget can go to source position (map constraint)
      if (
        targetWidget.widget_type === "map" &&
        !isValidPositionForMap(sourcePosition, layout)
      ) {
        return; // Invalid swap for map
      }

      newConfig[sourceIndex].position = targetPosition;
      newConfig[targetIndex].position = sourcePosition;
    }

    setConfig(newConfig);
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  const handleSave = async () => {
    if (isReportingMode) {
      onApplyReportingConfig?.({ layout, config });
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    const response = isTemplateMode
      ? await apiService.updateTemplateDashboardConfig(
          surveyTemplateId!,
          config,
          layout,
          templateDisplayMode,
        )
      : await apiService.updateDashboardConfig(surveyCode!, config, layout);

    if (response.success) {
      onClose();
    } else {
      setError(response.error || "Failed to save configuration");
    }

    setSaving(false);
  };

  const getAvailableQuestions = () => {
    const usedQuestionIds = config.map((c) => c.survey_question_id);
    return questions.filter((q) => {
      const qId =
        typeof q.survey_question_id === "string"
          ? parseInt(q.survey_question_id)
          : q.survey_question_id;
      const isUsed = usedQuestionIds.some((usedId) => {
        const uId = typeof usedId === "string" ? parseInt(usedId) : usedId;
        return uId === qId;
      });
      const isTextInput = q.question_type === "text_input";
      return !isUsed && !isTextInput;
    });
  };

  const canUseWidgetType = (
    questionType: string,
    widgetType: string,
  ): boolean => {
    switch (widgetType) {
      case "wordcloud":
        return questionType === "text_input";
      case "map":
        return questionType === "map";
      case "bar":
      case "pie":
        return (
          questionType === "single_select" ||
          questionType === "multi_select" ||
          questionType === "dropdown" ||
          questionType === "rating"
        );
      case "counter":
        return (
          questionType === "single_select" || questionType === "multi_select"
        );
      default:
        return false;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        {isTemplateMode
          ? "Configure Default Dashboard"
          : isReportingMode
            ? "Configure Reporting Dashboard"
            : "Configure Dashboard Display"}
      </DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 3 }}
      >
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <>
            {/* Layout Selection */}
            <LayoutDropdown
              selectedLayout={layout}
              onLayoutChange={(newLayout: DashboardLayout) => {
                setLayout(newLayout);
                const positions = getPositionsForLayout(newLayout);

                // Reassign positions to current widgets (keeping only as many as fit)
                // Maps can't go in vertical spans, so we need to be smart about reassignment
                const newConfig: WidgetConfig[] = [];
                const usedPositions: WidgetPosition[] = [];

                // First pass: place non-map widgets
                config
                  .filter((w) => w.widget_type !== "map")
                  .forEach((widget) => {
                    const availablePos = positions.find(
                      (p) => !usedPositions.includes(p),
                    );
                    if (availablePos) {
                      usedPositions.push(availablePos);
                      newConfig.push({ ...widget, position: availablePos });
                    }
                  });

                // Second pass: place map widgets in valid positions only
                config
                  .filter((w) => w.widget_type === "map")
                  .forEach((widget) => {
                    const availablePos = positions.find(
                      (p) =>
                        !usedPositions.includes(p) &&
                        isValidPositionForMap(p, newLayout),
                    );
                    if (availablePos) {
                      usedPositions.push(availablePos);
                      newConfig.push({ ...widget, position: availablePos });
                    }
                  });

                // Third pass: auto-fill empty positions with available questions
                // (excluding manually removed ones)
                const emptyPositionCount =
                  positions.length - usedPositions.length;
                if (emptyPositionCount > 0) {
                  const usedWidgetTypes = new Set<string>(
                    newConfig.map((w) => w.widget_type),
                  );
                  const availableForAutoFill = questions.filter((q) => {
                    const qId =
                      typeof q.survey_question_id === "string"
                        ? parseInt(q.survey_question_id)
                        : q.survey_question_id;
                    return (
                      !newConfig.some((w) => w.survey_question_id === qId) &&
                      !manuallyRemovedIds.has(qId) &&
                      q.question_type !== "text_input"
                    );
                  });

                  for (const question of availableForAutoFill) {
                    if (usedPositions.length >= positions.length) break;

                    const qId =
                      typeof question.survey_question_id === "string"
                        ? parseInt(question.survey_question_id)
                        : question.survey_question_id;

                    // Determine widget type
                    const availableTypes = WIDGET_TYPES.filter((wt) =>
                      canUseWidgetType(question.question_type, wt.value),
                    );
                    const unusedType = availableTypes.find(
                      (wt) => !usedWidgetTypes.has(wt.value),
                    );
                    const widgetType = (unusedType?.value ||
                      availableTypes[0]?.value ||
                      "bar") as "bar" | "pie" | "map" | "wordcloud";
                    usedWidgetTypes.add(widgetType);
                    // Find valid position
                    let nextPosition: WidgetPosition | undefined;
                    for (const pos of positions) {
                      if (usedPositions.includes(pos)) continue;
                      if (
                        widgetType === "map" &&
                        !isValidPositionForMap(pos, newLayout)
                      )
                        continue;
                      nextPosition = pos;
                      break;
                    }

                    if (!nextPosition) continue;

                    usedPositions.push(nextPosition);
                    newConfig.push({
                      survey_question_id: qId,
                      widget_type: widgetType,
                      position: nextPosition,
                    });
                  }
                }

                setConfig(newConfig);
              }}
            />

            {/* Display Mode Selector - Template Mode Only */}
            {isTemplateMode && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    mb: 1,
                  }}
                >
                  Default Display Mode
                </Typography>
                <ToggleButtonGroup
                  value={templateDisplayMode}
                  exclusive
                  onChange={(_, v) => v && setTemplateDisplayMode(v)}
                  size="small"
                >
                  <ToggleButton value="qr-full">QR Full</ToggleButton>
                  <ToggleButton value="qr-corner-main">QR + Main</ToggleButton>
                  <ToggleButton value="qr-corner-map">QR + Map</ToggleButton>
                  <ToggleButton value="main">Main Only</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

            {/* Dashboard Configuration */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Dashboard Widgets ({config.length}/
                  {getMaxWidgetsForLayout(layout)})
                </Typography>
                {config.length < getMaxWidgetsForLayout(layout) &&
                  getAvailableQuestions().length > 0 && (
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => setAddQuestionDialogOpen(true)}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: { xs: 26, sm: 28 },
                        color: "#004e7d",
                        borderColor: "#004e7d",
                        "&:hover": { borderColor: "#001d44", color: "#001d44" },
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: { xs: "0.65rem", sm: "0.75rem" },
                        px: { xs: 0.75, sm: 1.5 },
                        minWidth: { xs: "auto", sm: "64px" },
                        "& .MuiButton-startIcon": {
                          marginRight: { xs: "4px", sm: "8px" },
                        },
                      }}
                    >
                      Add Question
                    </Button>
                  )}
              </Box>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <DropZoneGrid
                  layout={layout}
                  widgets={config}
                  questions={questions.map((q) => ({
                    id:
                      typeof q.survey_question_id === "string"
                        ? parseInt(q.survey_question_id)
                        : q.survey_question_id,
                    question: q.question_text,
                    questionType: q.question_type,
                  }))}
                  onRemove={handleRemoveQuestion}
                  onAdd={() => setAddQuestionDialogOpen(true)}
                  onWidgetTypeChange={handleWidgetTypeChange}
                  isDragging={isDragging}
                  draggedWidgetType={draggedWidgetType}
                  draggedFromPosition={draggedFromPosition}
                  getAvailableWidgetTypes={getAvailableWidgetTypes}
                />
                <DragOverlay dropAnimation={null}>
                  {activeWidget ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 2,
                        bgcolor: "background.paper",
                        border: "2px solid",
                        borderColor: "primary.main",
                        borderRadius: 1,
                        boxShadow: 3,
                        minWidth: 200,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {activeWidget.questionLabel}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activeWidget.widgetType}
                        </Typography>
                      </Box>
                    </Box>
                  ) : null}
                </DragOverlay>
              </DndContext>

              {hasBlankSpots && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  {config.length === 0
                    ? 'No questions configured. Click on a zone or use "Add Question" to get started.'
                    : `Fill all ${maxPositions} positions to save. ${maxPositions - config.length} blank spot${maxPositions - config.length > 1 ? "s" : ""} remaining.`}
                </Typography>
              )}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            color: "#001d44",
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handlePreview}
          startIcon={<VisibilityIcon />}
          disabled={config.length === 0}
          sx={{
            color: "#004e7d",
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          Preview Dashboard
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || saving || hasBlankSpots}
          sx={{
            bgcolor: "#e79727",
            "&:hover": { bgcolor: "#cb5f1a" },
            fontFamily: "Montserrat, sans-serif",
            "&.Mui-disabled": {
              bgcolor: "#e79727",
              color: "#ffffff",
              opacity: 0.6,
            },
          }}
        >
          {isReportingMode
            ? "Apply Configuration"
            : saving
              ? "Saving..."
              : "Save Configuration"}
        </Button>
      </DialogActions>

      {/* Add Question Dialog */}
      <AddExistingModal
        open={addQuestionDialogOpen}
        onClose={() => setAddQuestionDialogOpen(false)}
        items={getAvailableQuestions().map((q) => ({
          id: q.survey_question_id,
          name: q.question_text,
          description: getDisplayTypesDescription(q.question_type),
          question_type: q.question_type,
          survey_name: q.survey_name,
        }))}
        onAddExisting={handleAddQuestions}
        title="Add Question to Dashboard"
        loading={false}
        loadingItems={false}
        formatItemDisplay={(item) => item.name || ""}
        questionColumnMode="description"
        questionShowSurveyColumn={isReportingMode}
        selectionLimit={getMaxWidgetsForLayout(layout) - config.length}
      />

      {/* Dashboard Preview */}
      <DashboardPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        config={config}
        questions={questions}
        layout={layout}
        eventName={eventName}
        sessionName={sessionName}
      />
    </Dialog>
  );
}
