import { ModifyQuestionModalProps } from "@/interfaces/ModalProps";
import { Question } from "@/interfaces/Question";
import { buildWinnersKey, isWinnersEnabled } from "../../utils/winnersKey";
import {
  ConditionalAction,
  ConditionalLogicConfig,
  ConditionalMatchType,
  ConditionalOperator,
} from "@/types/questionsTypes";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Add as AddIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { COUNTRY_LIST } from "../../constants/countries";
import SortableQuestion, {
  SortableQuestionOptionData,
} from "../SortableQuestion";

interface ConditionalConditionRow {
  id: string;
  questionId: string;
  operator: ConditionalOperator;
  value: string;
}

const createEmptyOption = (): SortableQuestionOptionData => ({
  id: `option-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  value: "",
  displayText: "",
  displayIcon: "",
});

const createEmptyCondition = (): ConditionalConditionRow => ({
  id: `condition-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  questionId: "",
  operator: "is",
  value: "",
});

const parseOptionsObject = (
  options: Question["options"],
): Record<string, any> => {
  if (!options) {
    return {};
  }

  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  return options && typeof options === "object" ? { ...options } : {};
};

const getNormalizedConditionalLogic = (
  rawLogic: any,
): ConditionalLogicConfig | null => {
  if (!rawLogic || typeof rawLogic !== "object") {
    return null;
  }

  const rawConditions = Array.isArray(rawLogic.conditions)
    ? rawLogic.conditions
    : [];

  const normalizedConditions = rawConditions
    .map((condition: any) => {
      if (!condition || typeof condition !== "object") {
        return null;
      }

      const questionId = String(condition.questionId ?? "").trim();
      const value = String(condition.value ?? "").trim();
      const rawOperator = condition.operator;
      const operator: ConditionalOperator =
        rawOperator === "is_not" || rawOperator === "contains"
          ? rawOperator
          : "is";

      if (!questionId || !value) {
        return null;
      }

      return {
        questionId,
        operator,
        value,
      };
    })
    .filter(
      (condition): condition is ConditionalLogicConfig["conditions"][0] => {
        return condition !== null;
      },
    );

  if (normalizedConditions.length === 0) {
    return null;
  }

  return {
    enabled: rawLogic.enabled !== false,
    action: rawLogic.action === "hide" ? "hide" : "show",
    matchType: rawLogic.matchType === "any" ? "any" : "all",
    conditions: normalizedConditions,
  };
};

export default function ModifyQuestionModal({
  open,
  onClose,
  action,
  item,
  onSubmit,
  questionTypes,
  surveyTemplateId,
  eventTemplateId,
  sessionTemplateId,
  surveyQuestions = [],
  loading = false,
  restrictedEdit = false,
}: ModifyQuestionModalProps) {
  const [formData, setFormData] = useState<Partial<Question>>({});
  const [optionsMetadata, setOptionsMetadata] = useState<Record<string, any>>(
    {},
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getTypeNameById = (typeId?: number | string) => {
    if (typeId === undefined || typeId === null) return null;
    const parsedId = parseInt(typeId.toString());
    return (
      questionTypes.find((qt) => parseInt(qt.id.toString()) === parsedId)
        ?.name || null
    );
  };

  // Question configuration states
  const [questionOptions, setQuestionOptions] = useState<
    SortableQuestionOptionData[]
  >([createEmptyOption()]);

  // Winner selection state
  const [winnersEnabled, setWinnersEnabled] = useState(false);

  // Conditional logic states
  const [conditionalEnabled, setConditionalEnabled] = useState(false);
  const [conditionalAction, setConditionalAction] =
    useState<ConditionalAction>("show");
  const [conditionalMatchType, setConditionalMatchType] =
    useState<ConditionalMatchType>("all");
  const [conditionalConditions, setConditionalConditions] = useState<
    ConditionalConditionRow[]
  >([createEmptyCondition()]);

  // Restricted edit state — tracks how many options are locked
  const [lockedOptionCount, setLockedOptionCount] = useState(0);

  const selectedQuestionTypeName = useMemo(() => {
    return getTypeNameById(formData.question_type_id);
  }, [formData.question_type_id, questionTypes]);

  const isSelectType = useMemo(() => {
    return (
      selectedQuestionTypeName === "single_select" ||
      selectedQuestionTypeName === "multi_select" ||
      selectedQuestionTypeName === "dropdown" ||
      selectedQuestionTypeName === "map"
    );
  }, [selectedQuestionTypeName]);

  const isMapType = useMemo(() => {
    return selectedQuestionTypeName === "map";
  }, [selectedQuestionTypeName]);

  const currentOrderIndex = useMemo(() => {
    if (action === "create") {
      return Number.MAX_SAFE_INTEGER;
    }

    const orderIndex = Number(formData.order_index ?? item?.order_index);
    return Number.isFinite(orderIndex) ? orderIndex : Number.MAX_SAFE_INTEGER;
  }, [action, formData.order_index, item?.order_index]);

  const availableConditionQuestions = useMemo(() => {
    return [...surveyQuestions]
      .filter((question) => Number(question.id) !== Number(item?.id))
      .filter((question) => Number(question.order_index) < currentOrderIndex)
      .sort((a, b) => Number(a.order_index) - Number(b.order_index));
  }, [surveyQuestions, item?.id, currentOrderIndex]);

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open) {
      // Reset all configuration states
      setQuestionOptions([createEmptyOption()]);
      setWinnersEnabled(false);
      setConditionalEnabled(false);
      setConditionalAction("show");
      setConditionalMatchType("all");
      setConditionalConditions([createEmptyCondition()]);
      setOptionsMetadata({});
      setLockedOptionCount(0);

      if (action === "create") {
        setFormData({
          text: "",
          question_type_id: undefined,
        });
      } else if (item) {
        setFormData({ ...item });

        // Parse existing options if editing/viewing
        if (item.options && (action === "edit" || action === "view")) {
          const parsedOptions = parseOptionsObject(item.options);
          setOptionsMetadata(parsedOptions);
          const wKey = buildWinnersKey(eventTemplateId, sessionTemplateId, surveyTemplateId);
          setWinnersEnabled(isWinnersEnabled(parsedOptions, wKey));

          if (Array.isArray(parsedOptions.options)) {
            const itemTypeName = getTypeNameById(item.question_type_id);
            if (itemTypeName !== "map") {
              const displayTexts = Array.isArray(
                parsedOptions.option_display_texts,
              )
                ? parsedOptions.option_display_texts
                : [];
              const displayIcons = Array.isArray(
                parsedOptions.option_display_icons,
              )
                ? parsedOptions.option_display_icons
                : [];

              const optionsWithIds = parsedOptions.options.map(
                (option: string, index: number) => ({
                  id: `option-${Date.now()}-${index}`,
                  value: option,
                  displayText:
                    typeof displayTexts[index] === "string"
                      ? displayTexts[index]
                      : "",
                  displayIcon:
                    typeof displayIcons[index] === "string"
                      ? displayIcons[index]
                      : "",
                }),
              );

              if (optionsWithIds.length > 0) {
                setQuestionOptions(optionsWithIds);
                // In restricted edit mode, lock all existing options
                if (restrictedEdit) {
                  setLockedOptionCount(optionsWithIds.length);
                }
              }
            }
          }

          const surveySpecificLogic =
            surveyTemplateId && parsedOptions.conditional_logic_by_survey
              ? parsedOptions.conditional_logic_by_survey[
                  String(surveyTemplateId)
                ]
              : null;

          const rawLogic =
            surveySpecificLogic ||
            parsedOptions.conditional_logic_draft ||
            parsedOptions.conditional_logic;

          const normalizedLogic = getNormalizedConditionalLogic(rawLogic);
          if (normalizedLogic) {
            setConditionalEnabled(normalizedLogic.enabled);
            setConditionalAction(normalizedLogic.action);
            setConditionalMatchType(normalizedLogic.matchType);
            setConditionalConditions(
              normalizedLogic.conditions.map((condition) => ({
                id: createEmptyCondition().id,
                questionId: condition.questionId,
                operator: condition.operator,
                value: condition.value,
              })),
            );
          }
        }
      }
    }
  }, [open, action, item, questionTypes, surveyTemplateId, restrictedEdit]);

  const handleInputChange = (field: keyof Question, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getQuestionById = (questionId: string) => {
    return availableConditionQuestions.find(
      (question) => String(question.id) === questionId,
    );
  };

  const getConditionQuestionType = (questionId: string) => {
    const question = getQuestionById(questionId);
    if (!question) {
      return null;
    }

    return getTypeNameById(question.question_type_id);
  };

  const isLockedOption = (index: number): boolean => {
    return restrictedEdit && action === "edit" && index < lockedOptionCount;
  };

  const getConditionOperators = (questionId: string): ConditionalOperator[] => {
    const questionType = getConditionQuestionType(questionId);

    if (questionType === "text_input") {
      return ["is", "is_not", "contains"];
    }

    return ["is", "is_not"];
  };

  const getConditionValues = (questionId: string) => {
    const sourceQuestion = getQuestionById(questionId);
    if (!sourceQuestion) {
      return [];
    }

    const questionType = getTypeNameById(sourceQuestion.question_type_id);
    const parsedSourceOptions = parseOptionsObject(sourceQuestion.options);

    if (questionType === "rating") {
      const parsedScale = Number(parsedSourceOptions.scale);
      const scale =
        Number.isFinite(parsedScale) && parsedScale > 0 ? parsedScale : 5;
      return Array.from({ length: scale }, (_, index) => String(index + 1));
    }

    if (Array.isArray(parsedSourceOptions.options)) {
      return parsedSourceOptions.options.map((option: unknown) =>
        String(option),
      );
    }

    return [];
  };

  const updateCondition = (
    conditionId: string,
    field: keyof Omit<ConditionalConditionRow, "id">,
    value: string,
  ) => {
    setConditionalConditions((prev) =>
      prev.map((condition) => {
        if (condition.id !== conditionId) {
          return condition;
        }

        const nextCondition = {
          ...condition,
          [field]: value,
        };

        if (field === "questionId") {
          const allowedOperators = getConditionOperators(value);
          if (!allowedOperators.includes(nextCondition.operator)) {
            nextCondition.operator = allowedOperators[0];
          }

          const sourceType = getConditionQuestionType(value);
          if (sourceType !== "text_input") {
            const availableValues = getConditionValues(value);
            if (!availableValues.includes(nextCondition.value)) {
              nextCondition.value = "";
            }
          }
        }

        return nextCondition;
      }),
    );
  };

  const addCondition = () => {
    setConditionalConditions((prev) => [...prev, createEmptyCondition()]);
  };

  const removeCondition = (conditionId: string) => {
    if (conditionalConditions.length <= 1) {
      return;
    }

    setConditionalConditions((prev) =>
      prev.filter((condition) => condition.id !== conditionId),
    );
  };

  // Options management
  const updateOption = (
    index: number,
    field: "value" | "displayText" | "displayIcon",
    value: string,
  ) => {
    const newOptions = [...questionOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setQuestionOptions(newOptions);
  };

  const addOption = () => {
    setQuestionOptions([...questionOptions, createEmptyOption()]);
  };

  const removeOption = (index: number) => {
    const newOptions = questionOptions.filter((_, i) => i !== index);
    setQuestionOptions(
      newOptions.length > 0 ? newOptions : [createEmptyOption()],
    );
  };

  // Drag and drop functionality
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeIndex = questionOptions.findIndex(
        (option) => option.id === active.id,
      );
      const overIndex = questionOptions.findIndex(
        (option) => option.id === over.id,
      );

      // In restricted edit, do not allow reordering locked options
      if (restrictedEdit && action === "edit") {
        if (activeIndex < lockedOptionCount || overIndex < lockedOptionCount) {
          return; // prevent drag involving locked options
        }
      }

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        const newOptions = arrayMove(questionOptions, activeIndex, overIndex);
        setQuestionOptions(newOptions);
      }
    }
  };

  const handleQuestionTypeChange = (newTypeId: string) => {
    const previousTypeId = formData.question_type_id;
    const newTypeIdNum = parseInt(newTypeId);

    // Get previous and new types BEFORE updating state
    const previousType = previousTypeId
      ? questionTypes.find((qt) => qt.id == previousTypeId) // Loose equality to allow string/number comparison
      : null;
    const newType = questionTypes.find((qt) => qt.id == newTypeIdNum);

    const previousTypeWasSelect =
      previousType &&
      (previousType.name === "single_select" ||
        previousType.name === "multi_select" ||
        previousType.name === "dropdown" ||
        previousType.name === "map");

    const newTypeIsSelect =
      newType &&
      (newType.name === "single_select" ||
        newType.name === "multi_select" ||
        newType.name === "dropdown" ||
        newType.name === "map");

    // Update the question type ID
    handleInputChange("question_type_id", newTypeIdNum);

    // If switching to map type, do not display countries in the list
    if (newType && newType.name === "map") {
      setQuestionOptions([createEmptyOption()]);
      return;
    }

    // Preserve options when switching between select types (single/multi/dropdown)
    if (previousTypeWasSelect && newTypeIsSelect) {
      return;
    }

    // For all other type changes, reset to single empty option
    setQuestionOptions([createEmptyOption()]);
  };

  const getValidConditionalConditions = () => {
    return conditionalConditions
      .map((condition) => {
        const questionId = condition.questionId.trim();
        const value = condition.value.trim();
        const allowedOperators = getConditionOperators(questionId);
        const operator = allowedOperators.includes(condition.operator)
          ? condition.operator
          : allowedOperators[0];

        return {
          questionId,
          operator,
          value,
        };
      })
      .filter((condition) => condition.questionId && condition.value);
  };

  const generateOptionsJson = () => {
    const optionsPayload: Record<string, any> = { ...optionsMetadata };
    delete optionsPayload.winners_enabled; // remove legacy flat key if present

    // Store winners_enabled keyed by event/session/survey composite key
    const wKey = buildWinnersKey(eventTemplateId, sessionTemplateId, surveyTemplateId);
    if (wKey) {
      const existingBySurvey =
        optionsPayload.winners_enabled_by_survey &&
        typeof optionsPayload.winners_enabled_by_survey === "object"
          ? { ...optionsPayload.winners_enabled_by_survey }
          : {};

      if (winnersEnabled) {
        existingBySurvey[wKey] = true;
      } else {
        delete existingBySurvey[wKey];
      }

      if (Object.keys(existingBySurvey).length > 0) {
        optionsPayload.winners_enabled_by_survey = existingBySurvey;
      } else {
        delete optionsPayload.winners_enabled_by_survey;
      }
    }

    if (isMapType) {
      optionsPayload.options = COUNTRY_LIST;
      delete optionsPayload.option_display_texts;
      delete optionsPayload.option_display_icons;
    } else if (isSelectType) {
      const cleanOptionObjects = questionOptions
        .map((option) => ({
          value: option.value.trim(),
          displayText: (option.displayText || "").trim(),
          displayIcon: (option.displayIcon || "").trim(),
        }))
        .filter((option) => option.value !== "");

      const cleanOptions = cleanOptionObjects.map((option) => option.value);
      optionsPayload.options = cleanOptions;

      const displayTexts = cleanOptionObjects.map(
        (option) => option.displayText,
      );
      const displayIcons = cleanOptionObjects.map(
        (option) => option.displayIcon,
      );
      const hasDisplayTexts = displayTexts.some((value) => value !== "");
      const hasDisplayIcons = displayIcons.some((value) => value !== "");

      if (hasDisplayTexts) {
        optionsPayload.option_display_texts = displayTexts;
      } else {
        delete optionsPayload.option_display_texts;
      }

      if (hasDisplayIcons) {
        optionsPayload.option_display_icons = displayIcons;
      } else {
        delete optionsPayload.option_display_icons;
      }
    } else {
      delete optionsPayload.options;
      delete optionsPayload.option_display_texts;
      delete optionsPayload.option_display_icons;
    }

    const validConditions = getValidConditionalConditions();
    const logicPayload: ConditionalLogicConfig | null =
      conditionalEnabled && validConditions.length > 0
        ? {
            enabled: true,
            action: conditionalAction,
            matchType: conditionalMatchType,
            conditions: validConditions,
          }
        : null;

    const existingBySurvey =
      optionsPayload.conditional_logic_by_survey &&
      typeof optionsPayload.conditional_logic_by_survey === "object"
        ? { ...optionsPayload.conditional_logic_by_survey }
        : {};

    if (surveyTemplateId) {
      if (logicPayload) {
        existingBySurvey[String(surveyTemplateId)] = logicPayload;
      } else {
        delete existingBySurvey[String(surveyTemplateId)];
      }

      if (Object.keys(existingBySurvey).length > 0) {
        optionsPayload.conditional_logic_by_survey = existingBySurvey;
      } else {
        delete optionsPayload.conditional_logic_by_survey;
      }

      delete optionsPayload.conditional_logic_draft;
    } else {
      if (logicPayload) {
        optionsPayload.conditional_logic_draft = logicPayload;
      } else {
        delete optionsPayload.conditional_logic_draft;
      }
    }

    return JSON.stringify(optionsPayload);
  };

  const handleSubmit = () => {
    const optionsJson = generateOptionsJson();
    const submitData = {
      ...formData,
      options: optionsJson,
    };
    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({});
    setQuestionOptions([createEmptyOption()]);
    setOptionsMetadata({});
    setWinnersEnabled(false);
    setConditionalEnabled(false);
    setConditionalAction("show");
    setConditionalMatchType("all");
    setConditionalConditions([createEmptyCondition()]);
    onClose();
  };

  const getTitle = () => {
    switch (action) {
      case "create":
        return "Create Question";
      case "edit":
        return "Edit Question";
      case "view":
        return "View Question";
      default:
        return "Question";
    }
  };

  const isFormValid = () => {
    const validConditionalConditions = getValidConditionalConditions();
    const conditionalStateIsValid =
      !conditionalEnabled || validConditionalConditions.length > 0;

    return (
      formData.text &&
      formData.question_type_id !== undefined &&
      formData.question_type_id !== null &&
      conditionalStateIsValid
    );
  };

  const canEnableConditionalLogic =
    availableConditionQuestions.length > 0 || conditionalEnabled;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Question Text"
          value={formData.text || ""}
          onChange={(e) => handleInputChange("text", e.target.value)}
          disabled={action === "view"}
          margin="normal"
          required
          autoFocus
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Question Type</InputLabel>
          <Select
            value={formData.question_type_id || ""}
            onChange={(e) =>
              handleQuestionTypeChange(e.target.value.toString())
            }
            disabled={action === "view" || (restrictedEdit && action === "edit")}
            required
            label="Question Type"
          >
            {questionTypes.map((qt) => (
              <MenuItem key={qt.id} value={qt.id}>
                {qt.name === "map"
                  ? "Global Country Map"
                  : qt.name
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Dynamic options based on question type */}
        {isSelectType && !isMapType && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 3 }} />
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
            >
              Answer Options
            </Typography>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questionOptions.map((option) => option.id)}
                strategy={verticalListSortingStrategy}
              >
                {questionOptions.map((option, index) => (
                  <SortableQuestion
                    key={option.id}
                    id={option.id}
                    option={option}
                    index={index}
                    onUpdate={updateOption}
                    onRemove={removeOption}
                    disabled={isMapType || action === "view" || isLockedOption(index)}
                    disableValue={isLockedOption(index)}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {action !== "view" && !isMapType && (
              <Button
                startIcon={<AddIcon />}
                onClick={addOption}
                variant="outlined"
                size="small"
                sx={{
                  mt: 1,
                  height: { xs: 26, sm: 28 },
                  fontSize: { xs: "0.65rem", sm: "0.75rem" },
                  px: { xs: 0.75, sm: 1.5 },
                  minWidth: { xs: "auto", sm: "64px" },
                  "& .MuiButton-startIcon": {
                    marginRight: { xs: "4px", sm: "8px" },
                  },
                }}
              >
                Add Option
              </Button>
            )}
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
          <Divider sx={{ my: 3 }} />
          <FormControlLabel
            control={
              <Switch
                checked={winnersEnabled}
                onChange={(e) => setWinnersEnabled(e.target.checked)}
                disabled={action === "view"}
              />
            }
            label="Enable Winner Selection"
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Divider sx={{ my: 3 }} />
          <FormControlLabel
            control={
              <Switch
                checked={conditionalEnabled}
                onChange={(e) => setConditionalEnabled(e.target.checked)}
                disabled={action === "view" || !canEnableConditionalLogic}
              />
            }
            label="Enable Conditional Logic"
          />

          {!canEnableConditionalLogic && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Add at least one earlier question before enabling conditional
              logic.
            </Typography>
          )}

          {conditionalEnabled && (
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <ToggleButtonGroup
                  size="small"
                  value={conditionalAction}
                  exclusive
                  onChange={(_, value: ConditionalAction | null) => {
                    if (value) setConditionalAction(value);
                  }}
                  disabled={action === "view"}
                >
                  <ToggleButton value="show">Show</ToggleButton>
                  <ToggleButton value="hide">Hide</ToggleButton>
                </ToggleButtonGroup>

                <Typography variant="body2">this field if</Typography>

                <ToggleButtonGroup
                  size="small"
                  value={conditionalMatchType}
                  exclusive
                  onChange={(_, value: ConditionalMatchType | null) => {
                    if (value) setConditionalMatchType(value);
                  }}
                  disabled={action === "view"}
                >
                  <ToggleButton value="all">All</ToggleButton>
                  <ToggleButton value="any">Any</ToggleButton>
                </ToggleButtonGroup>

                <Typography variant="body2">of the following match:</Typography>
              </Box>

              {conditionalConditions.map((condition, index) => {
                const sourceType = getConditionQuestionType(
                  condition.questionId,
                );
                const sourceValues = getConditionValues(condition.questionId);
                const availableOperators = getConditionOperators(
                  condition.questionId,
                );

                return (
                  <Box
                    key={condition.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1.2fr 0.8fr 1fr auto",
                      },
                      gap: 1,
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <FormControl fullWidth size="small">
                      <InputLabel>Question</InputLabel>
                      <Select
                        label="Question"
                        value={condition.questionId}
                        onChange={(e) =>
                          updateCondition(
                            condition.id,
                            "questionId",
                            e.target.value.toString(),
                          )
                        }
                        disabled={action === "view"}
                      >
                        {availableConditionQuestions.map((question) => (
                          <MenuItem
                            key={question.id}
                            value={String(question.id)}
                          >
                            {question.text}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel>Operator</InputLabel>
                      <Select
                        label="Operator"
                        value={condition.operator}
                        onChange={(e) =>
                          updateCondition(
                            condition.id,
                            "operator",
                            e.target.value.toString(),
                          )
                        }
                        disabled={action === "view" || !condition.questionId}
                      >
                        {availableOperators.map((operator) => (
                          <MenuItem key={operator} value={operator}>
                            {operator === "is"
                              ? "is"
                              : operator === "is_not"
                                ? "is not"
                                : "contains"}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {sourceType === "text_input" ? (
                      <TextField
                        fullWidth
                        size="small"
                        label="Condition"
                        value={condition.value}
                        onChange={(e) =>
                          updateCondition(
                            condition.id,
                            "value",
                            e.target.value.toString(),
                          )
                        }
                        disabled={action === "view" || !condition.questionId}
                      />
                    ) : (
                      <FormControl fullWidth size="small">
                        <InputLabel>Condition</InputLabel>
                        <Select
                          label="Condition"
                          value={condition.value}
                          onChange={(e) =>
                            updateCondition(
                              condition.id,
                              "value",
                              e.target.value.toString(),
                            )
                          }
                          disabled={
                            action === "view" ||
                            !condition.questionId ||
                            sourceValues.length === 0
                          }
                        >
                          {sourceValues.length === 0 ? (
                            <MenuItem value="" disabled>
                              No options available
                            </MenuItem>
                          ) : (
                            sourceValues.map((value) => (
                              <MenuItem key={value} value={value}>
                                {value}
                              </MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>
                    )}

                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <IconButton
                        onClick={addCondition}
                        disabled={action === "view"}
                        size="small"
                        aria-label="Add condition"
                      >
                        <AddCircleOutlineIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => removeCondition(condition.id)}
                        disabled={
                          action === "view" || conditionalConditions.length <= 1
                        }
                        size="small"
                        aria-label="Remove condition"
                      >
                        <RemoveCircleOutlineIcon />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          sx={{
            color: "#001d44",
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          Cancel
        </Button>
        {action !== "view" && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !isFormValid()}
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
            {action === "create" ? "Create" : "Save Changes"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
