import {
  Alert,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import Survey from "../../pages/Survey";
import apiService from "../../services/api";
import { FormQuestion } from "../../types/questionsTypes";
import { convertDBQuestionsToFormQuestions } from "../../utils/questionConverter";

interface SurveyPreviewProps {
  open: boolean;
  onClose: () => void;
  surveyId: string;
  surveyName: string;
}

export default function SurveyPreview({
  open,
  onClose,
  surveyId,
  surveyName,
}: SurveyPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedQuestions, setConvertedQuestions] = useState<FormQuestion[]>(
    [],
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (!open || !surveyId) return;

    const fetchSurveyData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch question types
        const typesResponse = await apiService.getQuestionTypes();
        if (!typesResponse.success || !typesResponse.data) {
          throw new Error("Failed to fetch question types");
        }

        // Fetch survey questions using the template_id endpoint
        const questionsResponse =
          await apiService.getSurveyQuestionsByTemplateId(
            parseInt(surveyId, 10),
          );
        if (!questionsResponse.success || !questionsResponse.data) {
          throw new Error(
            questionsResponse.error || "Failed to fetch survey questions",
          );
        }

        // The API response is nested: questionsResponse.data.data contains the questions array
        const questionsArray = questionsResponse.data.questions || [];

        // Convert questions using shared utility
        const converted = convertDBQuestionsToFormQuestions(
          questionsArray,
          typesResponse.data,
          parseInt(surveyId, 10),
        );
        setConvertedQuestions(converted);
      } catch (err) {
        console.error("Error fetching survey data:", err);
        setError(err instanceof Error ? err.message : "Failed to load survey");
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyData();
  }, [open, surveyId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={isMobile}
      PaperProps={{
        sx: isMobile
          ? {}
          : {
              width: "428px",
              maxWidth: "428px",
              height: "926px",
              maxHeight: "926px",
            },
      }}
    >
      <DialogTitle>Survey Preview</DialogTitle>
      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <CircularProgress />
          </div>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Survey
            questions={convertedQuestions}
            title={surveyName || "Survey Form"}
            isPreview={true}
            onPreviewClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
