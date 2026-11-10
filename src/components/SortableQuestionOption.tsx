import { Question, QuestionType } from "@/interfaces/Question";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Edit as EditIcon,
  EmojiEvents as TrophyIcon,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Tooltip,
} from "@mui/material";

interface SortableQuestionOptionProps {
  question: Question;
  index: number;
  questionTypes: QuestionType[];
  onEdit: (question: Question) => void;
  onDelete: (questionId: number) => void;
  onToggleWinners?: (questionId: number, enabled: boolean) => void;
  winnersKey?: string;
  disableEdit?: boolean;
  disableDelete?: boolean;
}

export default function SortableQuestionOption({
  question,
  index,
  questionTypes,
  onEdit,
  onDelete,
  onToggleWinners,
  winnersKey,
  disableEdit = false,
  disableDelete = false,
}: SortableQuestionOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const questionType = questionTypes.find(
    (type) => type.id == question.question_type_id
  );

  const parsedOptions = question.options
    ? typeof question.options === "string"
      ? JSON.parse(question.options)
      : question.options
    : null;
  const winnersEnabled = winnersKey
    ? parsedOptions?.winners_enabled_by_survey?.[winnersKey] === true
    : false;

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      divider
      sx={{
        cursor: isDragging ? "grabbing" : "default",
        backgroundColor: isDragging ? "action.hover" : "transparent",
      }}
    >
      <ListItemIcon
        {...attributes}
        {...listeners}
        sx={{
          cursor: "grab",
          "&:active": { cursor: "grabbing" },
          minWidth: 40,
        }}
      >
        <DragIcon color="action" />
      </ListItemIcon>

      <ListItemText
        primary={`${index + 1}. ${question.text}`}
        secondary={`Type: ${(() => {
          if (questionType?.name) {
            // Convert snake_case to Title Case
            return questionType.name
              .split("_")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ");
          }
          return "Unknown";
        })()}`}
      />
      {(!disableEdit || !disableDelete) && (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {!disableEdit && (
            <Tooltip title={winnersEnabled ? "Winner selection on" : "Winner selection off"}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TrophyIcon
                  fontSize="small"
                  sx={{ color: winnersEnabled ? "var(--abwe-gold)" : "action.disabled", mr: -0.5 }}
                />
                <Switch
                  size="small"
                  checked={winnersEnabled}
                  onChange={(e) => onToggleWinners?.(question.id!, e.target.checked)}
                />
              </Box>
            </Tooltip>
          )}
          {!disableEdit && (
            <IconButton
              size="small"
              onClick={() => onEdit(question)}
              title="Edit question"
              sx={{ border: 1, borderColor: "divider" }}
            >
              <EditIcon />
            </IconButton>
          )}
          {!disableDelete && (
            <IconButton
              size="small"
              onClick={() => onDelete(question.id!)}
              color="error"
              title="Delete question"
              sx={{ border: 1, borderColor: "divider" }}
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      )}
    </ListItem>
  );
}
