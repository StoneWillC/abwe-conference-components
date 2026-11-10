import SurveyProps from "@/interfaces/SurveyProps";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import { QuestionRenderer } from "../components/survey/QuestionRenderer";
import apiService from "../services/api";
import {
  ConditionalLogicCondition,
  FormQuestion,
} from "../types/questionsTypes";
import SurveyEntrance from "../components/survey/SurveyEntrance";
import { getAttendeeSessionToken, isSessionValid } from "../utils/sessionUtils";
import { loadAndConvertSurveyQuestions } from "../utils/questionConverter";

const isAnswerEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
};

const normalizeComparableValue = (value: unknown): string => {
  return String(value ?? "").trim().toLowerCase();
};

const evaluateCondition = (
  condition: ConditionalLogicCondition,
  formData: Record<string, any>,
): boolean => {
  const sourceAnswer = formData[condition.questionId];

  if (isAnswerEmpty(sourceAnswer)) {
    return false;
  }

  const expectedValue = normalizeComparableValue(condition.value);

  if (Array.isArray(sourceAnswer)) {
    const normalizedValues = sourceAnswer.map((value) =>
      normalizeComparableValue(value),
    );

    if (condition.operator === "contains") {
      return normalizedValues.some((value) => value.includes(expectedValue));
    }

    if (condition.operator === "is_not") {
      return !normalizedValues.includes(expectedValue);
    }

    return normalizedValues.includes(expectedValue);
  }

  const normalizedAnswer = normalizeComparableValue(sourceAnswer);

  if (condition.operator === "contains") {
    return normalizedAnswer.includes(expectedValue);
  }

  if (condition.operator === "is_not") {
    return normalizedAnswer !== expectedValue;
  }

  return normalizedAnswer === expectedValue;
};

const isQuestionVisible = (
  question: FormQuestion,
  formData: Record<string, any>,
): boolean => {
  const logic = question.conditionalLogic;

  if (!logic?.enabled || !logic.conditions?.length) {
    return true;
  }

  const conditionResults = logic.conditions.map((condition) =>
    evaluateCondition(condition, formData),
  );

  const isMatch =
    logic.matchType === "any"
      ? conditionResults.some(Boolean)
      : conditionResults.every(Boolean);

  return logic.action === "hide" ? !isMatch : isMatch;
};

export default function Survey({
  questions: propQuestions,
  title,
  isPreview = false,
  onPreviewClose,
}: SurveyProps = {}) {
  useEffect(() => {
    document.title = "ABWE STEP Survey";
  }, []);

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isEntranceRequired, setIsEntranceRequired] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checkingSubmission, setCheckingSubmission] = useState<boolean>(false);
  const [surveyTitle, setSurveyTitle] = useState<string>(title || "Survey");

  // Get survey code from URL params (normalize to uppercase)
  const { code } = useParams<{ code: string }>();
  const surveyCode = code?.toUpperCase();
  const navigate = useNavigate();
  const location = useLocation();

  // For database-driven surveys
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  // Check if questions were passed via navigation state
  const preloadedQuestions = location.state?.questions as
    | FormQuestion[]
    | undefined;
  const preloadedSurveyName = location.state?.surveyName as string | undefined;
  // TEST PURPOSES ONLY - Manual survey ID input
  const [showTestInput, setShowTestInput] = useState<boolean>(false);

  const visibleQuestionIdSet = useMemo(() => {
    const visibleIds = questions
      .filter((question) => isQuestionVisible(question, formData))
      .map((question) => question.id);

    return new Set(visibleIds);
  }, [questions, formData]);

  const visibleQuestions = useMemo(() => {
    return questions.filter((question) => visibleQuestionIdSet.has(question.id));
  }, [questions, visibleQuestionIdSet]);

  useEffect(() => {
    if (title) {
      setSurveyTitle(title);
      return;
    }

    if (preloadedSurveyName) {
      setSurveyTitle(preloadedSurveyName);
    }
  }, [title, preloadedSurveyName]);

  useEffect(() => {
    setFormData((previousFormData) => {
      let hasChanges = false;
      const nextFormData = { ...previousFormData };

      Object.keys(previousFormData).forEach((questionId) => {
        if (!visibleQuestionIdSet.has(questionId)) {
          delete nextFormData[questionId];
          hasChanges = true;
        }
      });

      return hasChanges ? nextFormData : previousFormData;
    });
  }, [visibleQuestionIdSet]);

  useEffect(() => {
    // Skip session check in preview mode
    if (isPreview) {
      setIsCheckingSession(false);
      setIsEntranceRequired(false);
      return;
    }

    const checkSession = async () => {
      const sessionToken = getAttendeeSessionToken();

      if (!sessionToken) {
        // No session token found - show entrance
        setIsEntranceRequired(true);
        setIsCheckingSession(false);
        return;
      }

      try {
        // Check last login time from API
        const response = await apiService.getAttendeeLastLogin(sessionToken);

        // Default to requiring entrance (fail-safe)
        let entranceRequired = true;

        if (response.success && response.data) {
          // Only allow survey access if response is successful AND session is within 24 hours
          entranceRequired = !(
            response.data.success && isSessionValid(response.data.last_login)
          );
        }

        setIsEntranceRequired(entranceRequired);
      } catch (error) {
        // Network error - assume entrance required for safety
        setIsEntranceRequired(true);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [isPreview]);

  const handleEntranceComplete = () => {
    // Entrance completed successfully - allow access to survey
    setIsEntranceRequired(false);

    // Now check if already submitted since we have a valid session
    if (surveyCode && !isPreview) {
      checkIfAlreadySubmitted(surveyCode);
    }
  };

  const checkIfAlreadySubmitted = useCallback(async (code: string) => {
    setCheckingSubmission(true);
    try {
      const sessionToken = getAttendeeSessionToken();
      if (!sessionToken) {
        // No session token - skip check
        setCheckingSubmission(false);
        return;
      }

      // Check if already submitted using dedicated endpoint
      const response = await apiService.checkSurveySubmission(
        code,
        sessionToken,
      );

      if (response.success && response.data?.has_submitted) {
        // Already submitted - show thank you message
        setSubmitted(true);
      }
    } catch (err) {
      // Ignore errors during check
      console.log("Error checking submission status:", err);
    } finally {
      setCheckingSubmission(false);
    }
  }, []);

  const loadSurveyQuestions = useCallback(
    async (code: string) => {
      setLoading(true);
      setError(null);

      const result = await loadAndConvertSurveyQuestions(code);

      if (!result.success) {
        // Navigate back to SurveyCode page with error message
        navigate("/survey", {
          state: { error: result.error || "Failed to load survey" },
        });
        setLoading(false);
        return;
      }

      setQuestions(result.questions || []);
      if (result.surveyName) {
        setSurveyTitle(result.surveyName);
      }
      setLoading(false);

      // Only check if already submitted if NOT in preview and user has valid session
      if (
        code &&
        !isPreview &&
        !isEntranceRequired &&
        getAttendeeSessionToken()
      ) {
        checkIfAlreadySubmitted(code);
      }
    },
    [navigate, checkIfAlreadySubmitted, isPreview, isEntranceRequired],
  );

  useEffect(() => {
    // If questions are provided as props (preview mode), use them
    if (propQuestions && propQuestions.length > 0) {
      setQuestions(propQuestions);
      return;
    }

    // If questions were passed from SurveyCode, use them
    if (preloadedQuestions && preloadedQuestions.length > 0) {
      setQuestions(preloadedQuestions);
      return;
    }

    // Load survey from URL code only if we don't have preloaded questions
    if (surveyCode) {
      loadSurveyQuestions(surveyCode);
    } else {
      // No code provided - redirect to SurveyCode page
      navigate("/survey");
    }
  }, [
    surveyCode,
    preloadedQuestions,
    preloadedSurveyName,
    loadSurveyQuestions,
    navigate,
  ]);

  const handleQuestionChange = (questionId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate session exists
    const sessionToken = getAttendeeSessionToken();
    if (!sessionToken) {
      setSubmitError("Session expired. Please refresh the page and try again.");
      return;
    }

    if (!surveyCode) {
      setSubmitError("Invalid survey. Please try accessing the survey again.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Transform formData from {[stringId]: value} to [{question_id: number, answer: value}]
      const responses = Object.entries(formData)
        .filter(([questionId]) => visibleQuestionIdSet.has(questionId))
        .map(([questionId, answer]) => ({
          question_id: parseInt(questionId, 10),
          answer: answer,
        }));

      // Filter out any invalid question IDs
      const validResponses = responses.filter((r) => !isNaN(r.question_id));

      if (validResponses.length === 0) {
        setSubmitError(
          "No responses to submit. Please answer at least one question.",
        );
        setSubmitting(false);
        return;
      }

      // Submit to backend (attendee_id extracted from session cookie on backend)
      const response = await apiService.submitSurveyResponses(
        surveyCode,
        validResponses,
        sessionToken,
      );

      if (response.success && response.data?.success) {
        setSubmitted(true);
      } else {
        setSubmitError(
          response.data?.message ||
            response.error ||
            "Failed to submit survey. Please try again.",
        );
      }
    } catch (err) {
      console.error("Survey submission error:", err);
      setSubmitError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while checking session or submission status
  if (isCheckingSession || checkingSubmission) {
    return (
      <div className="abwe-page">
        {!isPreview && <Header publicMode />}
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress className="abwe-spinner" />
        </Box>
      </div>
    );
  }

  // Show entrance form if required
  if (isEntranceRequired) {
    return <SurveyEntrance onEntranceComplete={handleEntranceComplete} />;
  }

  if (submitted) {
    return (
      <div className="abwe-page">
        {!isPreview && <Header publicMode />}
        <div className="abwe-container-medium">
          <div className="abwe-card" style={{ textAlign: "center" }}>
            <Typography
              variant="h4"
              className="abwe-heading"
              sx={{ color: "#E79727", mb: 2 }}
            >
              Thank you for your feedback!
            </Typography>
            <Typography variant="body1" className="abwe-text">
              Your response has been successfully submitted.
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="abwe-page">
        {!isPreview && <Header publicMode />}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <CircularProgress className="abwe-spinner" />
        </Box>
      </div>
    );
  }

  if (error) {
    return (
      <div className="abwe-page">
        {!isPreview && <Header publicMode />}
        <div className="abwe-container-medium">
          <Alert severity="error" className="abwe-alert" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </div>
      </div>
    );
  }

  if (questions.length === 0 && !loading) {
    return (
      <div className="abwe-page">
        {!isPreview && <Header publicMode />}
        <div className="abwe-container-medium">
          <Alert severity="warning">
            No questions available for this survey.
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="abwe-page">
      {/* ABWE Header */}
      {!isPreview && <Header publicMode />}

      {/* Survey Form */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        className="abwe-container-medium"
      >
        <div className="abwe-card">
          <Typography
            variant="h4"
            sx={{ mb: 3, fontSize: "1.9rem" }}
            className="abwe-heading"
          >
            {surveyTitle}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {visibleQuestions.map((question, index) => (
              <Box
                key={question.id}
                sx={{
                  pb: 3,
                  borderBottom: index < questions.length - 1
                    ? "1px solid rgba(0, 29, 68, 0.08)"
                    : "none",
                }}
              >
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  value={formData[question.id]}
                  onChange={handleQuestionChange}
                />
              </Box>
            ))}
          </Box>

          {submitError && (
            <Alert
              severity="error"
              className="abwe-alert"
              sx={{ mt: 2 }}
              onClose={() => setSubmitError(null)}
            >
              {submitError}
            </Alert>
          )}

          <Box
            sx={{
              mt: 4,
              display: "flex",
              justifyContent: "flex-start",
              gap: 2,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              disabled={isPreview || submitting}
              startIcon={
                submitting ? <CircularProgress size={20} /> : undefined
              }
              className="abwe-btn-primary"
              sx={{
                bgcolor: "#e79727 !important",
                color: "#ffffff",
                "&:hover": { bgcolor: "#cb5f1a !important" },
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                "&.Mui-disabled": {
                  bgcolor: "#e79727 !important",
                  color: "#ffffff",
                  opacity: 0.6,
                },
              }}
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
            {isPreview && onPreviewClose && (
              <Button
                variant="outlined"
                onClick={onPreviewClose}
                className="abwe-btn-secondary"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Close Preview
              </Button>
            )}
          </Box>
        </div>
      </Box>
    </div>
  );
}
