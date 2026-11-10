import { ModifySurveyModalProps } from "@/interfaces/ModalProps";
import { Question } from "@/interfaces/Question";
import Survey from "@/interfaces/Survey";
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
import { Add as AddIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import apiService from "../../services/api";
import { buildWinnersKey } from "../../utils/winnersKey";
import SortableQuestionOption from "../SortableQuestionOption";
import AddExistingDialog from "./AddExistingModal";
import ConfirmationModal from "./ConfirmationModal";
import ModifyQuestionModal from "./ModifyQuestionModal";

export default function ModifySurveyModal({
  open,
  onClose,
  action,
  item,
  onSubmit,
  loading = false,
  questionTypes,
  restrictedEdit = false,
  eventTemplateId,
  sessionTemplateId,
}: ModifySurveyModalProps) {
  const [formData, setFormData] = useState<Partial<Survey>>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [questionDialogAction, setQuestionDialogAction] = useState<
    "create" | "edit" | "view"
  >("create");

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null,
  );
  const [questionLoading, setQuestionLoading] = useState(false);
  const [addExistingDialogOpen, setAddExistingDialogOpen] = useState(false);

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionsToDelete, setQuestionsToDelete] = useState<number[]>([]);
  const [questionsToCreate, setQuestionsToCreate] = useState<Question[]>([]);
  const [loadingAllQuestions, setLoadingAllQuestions] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [isQuestionRestrictedEdit, setIsQuestionRestrictedEdit] = useState(false);

  const normalizeOptionsJson = (options: Question["options"]) => {
    if (typeof options === "string") {
      return options.trim() && options !== "null" ? options : "{}";
    }

    if (options && typeof options === "object") {
      return JSON.stringify(options);
    }

    return "{}";
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Initialize form data when dialog opens or item changes
  useEffect(() => {
    if (open) {
      // Clear any pending changes when opening modal
      setQuestionsToDelete([]);
      setQuestionsToCreate([]);

      if (action === "create") {
        setFormData({
          name: "",
        });
        setQuestions([]);
      } else if (item) {
        setFormData({ ...item });
        loadQuestions();
      }
    }
  }, [open, action, item, questionTypes]);

  // Load questions for existing survey template
  const loadQuestions = async () => {
    if (!item?.id) return;

    try {
      setQuestionLoading(true);
      // Load questions linked to this survey template (pass as number)
      const result = await apiService.getQuestions(item.id);
      if (result.success && result.data) {
        setQuestions(result.data);
      }
    } catch (error) {
      console.error("Error loading questions:", error);
    } finally {
      setQuestionLoading(false);
    }
  };

  // Question management functions
  const openQuestionDialog = (
    dialogAction: "create" | "edit" | "view",
    question?: Question,
  ) => {
    setQuestionDialogAction(dialogAction);
    setSelectedQuestion(question || null);

    // Determine if this specific question should open in restrictedEdit mode
    const isRestricted =
      restrictedEdit &&
      dialogAction === "edit" &&
      !!question &&
      !(question as any).isNewQuestion &&
      !(question as any).isExisting;
    setIsQuestionRestrictedEdit(isRestricted);

    setQuestionDialogOpen(true);
  };

  const closeQuestionDialog = () => {
    setQuestionDialogOpen(false);
    setSelectedQuestion(null);
    setIsQuestionRestrictedEdit(false);
  };

  const handleQuestionSubmit = async (questionData: Partial<Question>) => {
    if (!item?.id && action !== "create") return;

    // Validate questions with options have at least 2 options
    if (questionData.question_type_id) {
      const questionType = questionTypes.find(
        (type) => type.id == questionData.question_type_id,
      );
      if (
        questionType &&
        ["single_select", "multi_select", "dropdown"].includes(
          questionType.name,
        )
      ) {
        let optionsCount = 0;
        if (questionData.options && typeof questionData.options === "string") {
          const parsedOptions = JSON.parse(questionData.options);
          if (parsedOptions.options && Array.isArray(parsedOptions.options)) {
            optionsCount = parsedOptions.options.filter(
              (opt: string) => opt && opt.trim(),
            ).length;
          }
        }

        const minOptions = questionType.name === "multi_select" ? 1 : 2;
        if (optionsCount < minOptions) {
          alert(
            `${questionType.name
              .split("_")
              .map(
                (word: string) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
              )
              .join(" ")} questions must have at least ${minOptions} option${minOptions > 1 ? "s" : ""}.`,
          );
          setQuestionLoading(false);
          return;
        }
      }
    }

    try {
      setQuestionLoading(true);
      let result;

      if (questionDialogAction === "create") {
        // For new surveys, we'll store questions temporarily and save them after survey creation
        if (action === "create") {
          const newQuestion = {
            ...questionData,
            id: Date.now(), // Temporary ID for display
            order_index: Number(questions.length + 1),
            options: normalizeOptionsJson(questionData.options),
          } as Question;
          setQuestions((prev) => [...prev, newQuestion]);
        } else if (item?.id) {
          // For existing surveys, add to local state and defer creation until save
          const newQuestion = {
            ...questionData,
            id: Date.now(), // Temporary ID for display
            order_index: Number(questions.length + 1),
            options: normalizeOptionsJson(questionData.options),
            isNewQuestion: true, // Mark as new question to handle during save
          } as any;

          setQuestions((prev) => [...prev, newQuestion]);
          // Track this question for creation on save
          setQuestionsToCreate((prev) => [...prev, newQuestion]);
        }
      } else if (questionDialogAction === "edit" && selectedQuestion) {
        if (action === "create") {
          // Update temporary question
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === selectedQuestion.id ? { ...q, ...questionData } : q,
            ),
          );
        } else if (selectedQuestion.id) {
          const questionId =
            typeof selectedQuestion.id === "string"
              ? parseInt(selectedQuestion.id, 10)
              : selectedQuestion.id;
          // Ensure we pass the complete question data including required fields
          const completeQuestionData = {
            text: questionData.text || selectedQuestion.text,
            question_type_id:
              questionData.question_type_id ||
              selectedQuestion.question_type_id,
            order_index:
              questionData.order_index || selectedQuestion.order_index,
            options:
              questionData.options !== undefined
                ? normalizeOptionsJson(questionData.options)
                : normalizeOptionsJson(selectedQuestion.options),
            survey_template_id: item?.id,
          };

          result = await apiService.updateQuestion(
            questionId,
            completeQuestionData,
          );
          if (result.success) {
            // Update the question in local state instead of reloading
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === selectedQuestion.id ? { ...q, ...questionData } : q,
              ),
            );
          }
        }
      }

      closeQuestionDialog();
    } catch (error) {
      console.error("Error managing question:", error);
    } finally {
      setQuestionLoading(false);
    }
  };

  const winnersKey = buildWinnersKey(eventTemplateId, sessionTemplateId, item?.id);

  const updateWinnersInOptions = (
    options: Question["options"],
    key: string,
    enabled: boolean,
  ): string => {
    const parsed = options
      ? typeof options === "string"
        ? JSON.parse(options)
        : options
      : {};
    const bySurvey =
      parsed.winners_enabled_by_survey &&
      typeof parsed.winners_enabled_by_survey === "object"
        ? { ...parsed.winners_enabled_by_survey }
        : {};

    if (enabled) {
      bySurvey[key] = true;
    } else {
      delete bySurvey[key];
    }

    const updated = { ...parsed };
    delete updated.winners_enabled; // remove legacy flat key
    if (Object.keys(bySurvey).length > 0) {
      updated.winners_enabled_by_survey = bySurvey;
    } else {
      delete updated.winners_enabled_by_survey;
    }
    return JSON.stringify(updated);
  };

  const handleToggleWinners = async (questionId: number, enabled: boolean) => {
    if (!winnersKey) return;

    // Update local state
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        return { ...q, options: updateWinnersInOptions(q.options, winnersKey, enabled) };
      }),
    );

    // Persist to DB for existing questions
    const question = questions.find((q) => q.id === questionId);
    if (question && !(question as any).isNewQuestion) {
      try {
        await apiService.updateQuestion(questionId, {
          text: question.text,
          question_type_id: question.question_type_id,
          order_index: question.order_index,
          options: updateWinnersInOptions(question.options, winnersKey, enabled),
          survey_template_id: item?.id,
        });
      } catch (error) {
        console.error("Error toggling winners:", error);
      }
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    setQuestionToDelete(questionId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteQuestion = () => {
    if (!questionToDelete) return;

    const actualQuestionId =
      typeof questionToDelete === "string"
        ? parseInt(questionToDelete, 10)
        : questionToDelete;

    // Always remove from local state immediately
    setQuestions((prev) => prev.filter((q) => q.id !== questionToDelete));

    // For existing surveys, track the question for deletion on save
    // (for new surveys, no database action needed since questions aren't saved yet)
    if (action === "edit") {
      const questionToDeleteObj = questions.find(
        (q) => q.id === questionToDelete,
      );
      // Only track for deletion if it's not an "isExisting" question (which was added locally)
      if (questionToDeleteObj && !(questionToDeleteObj as any).isExisting) {
        setQuestionsToDelete((prev) => [...prev, actualQuestionId]);
      }
    }

    setDeleteConfirmOpen(false);
    setQuestionToDelete(null);
  };

  const cancelDeleteQuestion = () => {
    setDeleteConfirmOpen(false);
    setQuestionToDelete(null);
  };

  // Handle drag end for question reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newQuestions = arrayMove(questions, oldIndex, newIndex);

      // Update order_index for all questions based on their new positions
      const updatedQuestions = newQuestions.map((question, index) => ({
        ...question,
        order_index: Number(index + 1),
      }));

      setQuestions(updatedQuestions);
    }
  };

  const handleInputChange = (field: keyof Survey, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // For editing existing survey templates, handle question operations
    if (action === "edit" && item?.id) {
      try {
        const operations: Promise<any>[] = [];

        // Delete removed questions
        if (questionsToDelete.length > 0) {
          const deleteOps = questionsToDelete.map((questionId) =>
            apiService.removeQuestionFromSurvey(questionId, item.id!),
          );
          operations.push(...deleteOps);
        }

        // Create new questions
        const newQuestions = questionsToCreate.filter(
          (q) => !(q as any).isExisting,
        );
        if (newQuestions.length > 0) {
          const createOps = newQuestions.map((question) =>
            apiService.createQuestion(
              {
                text: question.text,
                question_type_id: question.question_type_id,
                order_index: question.order_index,
                options: normalizeOptionsJson(question.options),
              },
              item.id!,
            ),
          );
          operations.push(...createOps);
        }

        // Add existing questions to survey template
        const existingQuestions = questions.filter(
          (q) => (q as any).isExisting,
        );
        if (existingQuestions.length > 0) {
          const addOps = existingQuestions.map((question) =>
            apiService.addExistingQuestion(question.id!, item.id!, Number(question.order_index)),
          );
          operations.push(...addOps);
        }

        // Update question orders for all existing (non-new) questions
        const updateOps = questions
          .filter((q) => !(q as any).isNewQuestion)
          .map((question) =>
            apiService.updateQuestionOrder(
              question.id!,
              item.id!,
              Number(question.order_index),
            ),
          );
        operations.push(...updateOps);

        // Execute all operations
        await Promise.all(operations);

        // Clear queues
        setQuestionsToDelete([]);
        setQuestionsToCreate([]);
      } catch (error) {
        console.error("Error updating survey questions:", error);
      }
    }

    // Submit survey data
    const submissionData = {
      ...formData,
      questions: action === "create" ? questions : undefined,
    };

    onSubmit(submissionData);
  };

  const handleClose = () => {
    setFormData({});
    setQuestionsToDelete([]); // Clear pending deletions when closing
    setQuestionsToCreate([]); // Clear pending creations when closing
    onClose();
  };

  // Add Existing Question functionality
  const openAddExistingDialog = async () => {
    setAddExistingDialogOpen(true);
    setLoadingAllQuestions(true);
    try {
      const response = await apiService.getAllQuestions();
      if (response.success && response.data) {
        // Filter out questions that are already in the current survey (using loose equality for type safety)
        const availableQuestions = response.data.filter(
          (q) => !questions.some((existingQ) => existingQ.id == q.id),
        );
        setAllQuestions(availableQuestions);
      }
    } catch (err) {
      console.error("Error loading all questions:", err);
    } finally {
      setLoadingAllQuestions(false);
    }
  };

  const handleAddExistingQuestion = async (
    questionIds: (number | string)[],
  ) => {
    try {
      setQuestionLoading(true);

      const newQuestions: any[] = [];

      questionIds.forEach((questionId) => {
        // Convert string to number if needed
        const numericId =
          typeof questionId === "string" ? parseInt(questionId) : questionId;

        // Use loose equality to handle string/number type mismatches
        const selectedQuestion = allQuestions.find((q) => q.id == numericId);

        if (selectedQuestion) {
          const newQuestion = {
            ...selectedQuestion,
            id: selectedQuestion.id, // Keep original ID for reference
            order_index: questions.length + newQuestions.length + 1,
            isExisting: true, // Mark as existing question to handle differently during save
          } as any;
          newQuestions.push(newQuestion);
        }
      });

      if (newQuestions.length > 0) {
        setQuestions((prev) => [...prev, ...newQuestions]);
        setAddExistingDialogOpen(false);
      }
    } catch (err) {
      console.error("Error adding existing questions:", err);
    } finally {
      setQuestionLoading(false);
    }
  };

  const closeAddExistingDialog = () => {
    setAddExistingDialogOpen(false);
    setAllQuestions([]);
  };

  const formatQuestionDisplay = (question: Question) => {
    const questionType = questionTypes.find(
      (qt) => qt.id === question.question_type_id,
    );
    return `${question.text} (${questionType?.name || "Unknown Type"})`;
  };

  const getTitle = () => {
    switch (action) {
      case "create":
        return "Create Survey Template";
      case "edit":
        return "Edit Survey Template";
      case "view":
        return "View Survey Template";
      default:
        return "Survey Template";
    }
  };

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
          label="Survey Template Name"
          value={formData.name || ""}
          onChange={(e) => handleInputChange("name", e.target.value)}
          disabled={action === "view" || (restrictedEdit && action === "edit")}
          margin="normal"
          required
          autoFocus
        />

        <Divider sx={{ my: 3 }} />

        {/* Questions Section */}
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h6">Questions</Typography>
              {action !== "view" && questions.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Drag questions to reorder them
                </Typography>
              )}
            </Box>
            {action !== "view" && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => openQuestionDialog("create")}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: { xs: 32, sm: 28 },
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
                <Button
                  startIcon={<AddIcon />}
                  onClick={openAddExistingDialog}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: { xs: 32, sm: 28 },
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                    px: { xs: 0.75, sm: 1.5 },
                    whiteSpace: "nowrap",
                    minWidth: { xs: "auto", sm: "64px" },
                    "& .MuiButton-startIcon": {
                      marginRight: { xs: "4px", sm: "8px" },
                    },
                  }}
                >
                  Link Existing
                </Button>
              </Box>
            )}
          </Box>

          {questionLoading ? (
            <Typography color="text.secondary">Loading questions...</Typography>
          ) : questions.length === 0 ? (
            <Typography color="text.secondary">
              No questions added yet.
            </Typography>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <List dense>
                <SortableContext
                  items={questions.map((q) => q.id!)}
                  strategy={verticalListSortingStrategy}
                >
                  {questions.map((question, index) => {
                    const isRestrictedDbQuestion =
                      restrictedEdit &&
                      action === "edit" &&
                      !(question as any).isNewQuestion &&
                      !(question as any).isExisting;

                    return (
                      <SortableQuestionOption
                        key={question.id}
                        question={question}
                        index={index}
                        questionTypes={questionTypes}
                        onEdit={(q) => openQuestionDialog("edit", q)}
                        onDelete={handleDeleteQuestion}
                        onToggleWinners={handleToggleWinners}
                        winnersKey={winnersKey ?? undefined}
                        disableEdit={false}
                        disableDelete={isRestrictedDbQuestion}
                      />
                    );
                  })}
                </SortableContext>
              </List>
            </DndContext>
          )}
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
        }}
      >
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
            disabled={loading || !formData.name}
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

      {/* Question Dialog */}
      <ModifyQuestionModal
        open={questionDialogOpen}
        onClose={closeQuestionDialog}
        action={questionDialogAction}
        item={selectedQuestion}
        onSubmit={handleQuestionSubmit}
        questionTypes={questionTypes}
        surveyTemplateId={item?.id}
        eventTemplateId={eventTemplateId}
        sessionTemplateId={sessionTemplateId}
        surveyQuestions={questions}
        loading={questionLoading}
        restrictedEdit={isQuestionRestrictedEdit}
      />

      {/* Add Existing Question Dialog */}
      <AddExistingDialog
        open={addExistingDialogOpen}
        onClose={closeAddExistingDialog}
        onAddExisting={handleAddExistingQuestion}
        title="Add Existing Question"
        items={allQuestions}
        loading={questionLoading}
        loadingItems={loadingAllQuestions}
        formatItemDisplay={formatQuestionDisplay}
        questionTypes={questionTypes}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteConfirmOpen}
        onClose={cancelDeleteQuestion}
        onConfirm={confirmDeleteQuestion}
        title="Remove Question"
        message="Are you sure you want to remove this question from the survey?"
      />
    </Dialog>
  );
}
