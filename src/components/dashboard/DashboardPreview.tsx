import CloseIcon from "@mui/icons-material/Close";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { DashboardPreviewProps } from "../../interfaces/DashboardProps";
import { DashboardWidget } from "../../types/Widgets";
import DashboardDisplay from "./DashboardDisplay";

export default function DashboardPreview({
  open,
  onClose,
  config,
  questions,
  layout = "four-quadrants",
  eventName = "Event Name",
  sessionName = "Session Name",
}: DashboardPreviewProps) {
  const normalizeLabel = (label: string) => {
    const optionMatch = label.match(/^Option\s*(\d+)$/i);
    if (optionMatch) {
      return optionMatch[1];
    }
    const ratingMatch = label.match(/^Rating:\s*(\d+)$/i);
    if (ratingMatch) {
      return ratingMatch[1];
    }
    return label;
  };

  // Build preview widgets from config
  const buildPreviewWidgets = (): DashboardWidget[] => {
    return config.map((widgetConfig) => {
      const question = questions.find(
        (q) => q.survey_question_id == widgetConfig.survey_question_id,
      );

      const position = widgetConfig.position;

      if (!question) {
        return { type: "blank", position } as DashboardWidget;
      }

      // Generate sample data for preview
      switch (widgetConfig.widget_type) {
        case "wordcloud": {
          return {
            type: "wordcloud",
            question: question.question_text,
            words: [
              { text: "Sample", value: 10 },
              { text: "Preview", value: 8 },
              { text: "Data", value: 6 },
              { text: "Response", value: 5 },
              { text: "Text", value: 4 },
            ],
            position,
          } as DashboardWidget;
        }

        case "map": {
          return {
            type: "map",
            question: question.question_text,
            labels: ["United States", "Canada", "Mexico", "Brazil"],
            values: [5, 3, 2, 1],
            position,
          } as DashboardWidget;
        }

        case "bar":
        case "pie":
        case "counter": {
          // Parse options to get sample labels
          let sampleLabels = ["Option 1", "Option 2", "Option 3"];
          let sampleCounterDisplay: Array<{
            label: string;
            displayText?: string;
            displayIcon?: string;
          }> = [];
          let ratingScale = 5;
          try {
            if (question.options) {
              const parsed = JSON.parse(question.options);
              const optionDisplayTexts = Array.isArray(
                parsed.option_display_texts,
              )
                ? parsed.option_display_texts
                : [];
              const optionDisplayIcons = Array.isArray(
                parsed.option_display_icons,
              )
                ? parsed.option_display_icons
                : [];

              // Options are stored as {"options": [...]}
              if (
                parsed.options &&
                Array.isArray(parsed.options) &&
                parsed.options.length > 0
              ) {
                sampleLabels = parsed.options;
              } else if (parsed.labels && Array.isArray(parsed.labels)) {
                sampleLabels = parsed.labels;
              } else if (Array.isArray(parsed) && parsed.length > 0) {
                // Fallback if stored as plain array
                sampleLabels = parsed;
              }

              if (parsed.scale && Number.isFinite(parsed.scale)) {
                ratingScale = Math.max(1, Number(parsed.scale));
              }

              sampleCounterDisplay = sampleLabels.map(
                (label: string, index: number) => ({
                  label,
                  displayText:
                    typeof optionDisplayTexts[index] === "string"
                      ? optionDisplayTexts[index]
                      : "",
                  displayIcon:
                    typeof optionDisplayIcons[index] === "string"
                      ? optionDisplayIcons[index]
                      : "",
                }),
              );
            }
          } catch (e) {
            // Use default labels
          }

          if (question.question_type === "rating") {
            if (
              sampleLabels.length === 0 ||
              sampleLabels[0].match(/^Option/i)
            ) {
              sampleLabels = Array.from({ length: ratingScale }, (_, i) =>
                String(i + 1),
              );
            } else if (sampleLabels.length !== ratingScale) {
              sampleLabels = sampleLabels.slice(0, ratingScale);
            }
          }

          sampleLabels = sampleLabels.map((label) => normalizeLabel(label));

          return {
            type: widgetConfig.widget_type,
            question: question.question_text,
            labels: sampleLabels,
            values: sampleLabels.map(() => Math.floor(Math.random() * 10) + 1),
            counterDisplay:
              widgetConfig.widget_type === "counter"
                ? sampleCounterDisplay
                : undefined,
            position,
          } as DashboardWidget;
        }

        default:
          return { type: "blank", position } as DashboardWidget;
      }
    });
  };

  const previewWidgets = buildPreviewWidgets();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "var(--abwe-blue-dark)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          backgroundColor: "var(--abwe-blue-dark)",
        }}
      >
        <Typography variant="h5" fontWeight={600} color="#e6f1ff">
          Dashboard Preview w/ Sample Data
        </Typography>
        <IconButton onClick={onClose} edge="end" sx={{ color: "#e6f1ff" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        <DashboardDisplay
          eventName={eventName}
          sessionName={sessionName}
          participants={0}
          widgets={previewWidgets}
          layout={layout}
          containerHeight={window.innerHeight - 80}
          showFullscreenButton={false}
        />
      </DialogContent>
    </Dialog>
  );
}
