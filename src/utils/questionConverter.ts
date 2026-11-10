import { Question, QuestionType } from "@/interfaces/Question";
import apiService from "../services/api";
import {
  ConditionalLogicCondition,
  ConditionalLogicConfig,
  FormQuestion,
} from "../types/questionsTypes";

type ParsedQuestionOptions = Record<string, any> | null;

const parseQuestionOptions = (
  options: Question["options"],
): ParsedQuestionOptions => {
  if (!options) {
    return null;
  }

  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      console.error("Failed to parse question options:", e);
      return null;
    }
  }

  return options && typeof options === "object" ? options : null;
};

const normalizeConditionalLogic = (
  rawLogic: any,
): ConditionalLogicConfig | undefined => {
  if (!rawLogic || typeof rawLogic !== "object") {
    return undefined;
  }

  const rawConditions = Array.isArray(rawLogic.conditions)
    ? rawLogic.conditions
    : [];

  const conditions: ConditionalLogicCondition[] = rawConditions
    .map((condition: any) => {
      if (!condition || typeof condition !== "object") {
        return null;
      }

      const questionId = String(condition.questionId ?? "").trim();
      const value = String(condition.value ?? "").trim();
      const rawOperator = condition.operator;

      const operator =
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
    .filter((condition): condition is ConditionalLogicCondition => {
      return condition !== null;
    });

  if (conditions.length === 0) {
    return undefined;
  }

  return {
    enabled: rawLogic.enabled !== false,
    action: rawLogic.action === "hide" ? "hide" : "show",
    matchType: rawLogic.matchType === "any" ? "any" : "all",
    conditions,
  };
};

const resolveConditionalLogic = (
  parsedOptions: ParsedQuestionOptions,
  surveyTemplateId?: number,
): ConditionalLogicConfig | undefined => {
  if (!parsedOptions) {
    return undefined;
  }

  if (surveyTemplateId) {
    const bySurvey = parsedOptions.conditional_logic_by_survey;
    if (bySurvey && typeof bySurvey === "object") {
      const surveySpecificLogic = bySurvey[String(surveyTemplateId)];
      const normalizedSurveyLogic = normalizeConditionalLogic(surveySpecificLogic);
      if (normalizedSurveyLogic) {
        return normalizedSurveyLogic;
      }
    }
  }

  const draftLogic = normalizeConditionalLogic(
    parsedOptions.conditional_logic_draft,
  );
  if (draftLogic) {
    return draftLogic;
  }

  return normalizeConditionalLogic(parsedOptions.conditional_logic);
};

/**
 * Loads survey questions from the database and converts them to FormQuestion format
 * @param surveyCode - The code of the survey to load (e.g., "SRV001")
 * @returns Object containing questions, error message, or null if successful
 */
export async function loadAndConvertSurveyQuestions(
  surveyCode: string,
): Promise<{
  success: boolean;
  questions?: FormQuestion[];
  surveyName?: string;
  error?: string;
}> {
  try {
    // Fetch question types first
    const typesResult = await apiService.getQuestionTypes();
    if (!typesResult.success || !typesResult.data) {
      return {
        success: false,
        error: "Failed to load question types",
      };
    }

    // Fetch survey questions
    const result = await apiService.getSurveyQuestionsByCode(surveyCode);

    if (!result.success) {
      // Check for specific error messages from backend
      if (result.error?.includes("not currently active")) {
        return {
          success: false,
          error:
            "This survey is not currently active. Please check with the event organizer.",
        };
      }
      return {
        success: false,
        error: result.error || "Failed to load survey",
      };
    }

    // result.data contains the backend response: {success: true, data: Question[]}
    const backendResponse = result.data as any;

    if (!backendResponse || !backendResponse.success) {
      return {
        success: false,
        error: "Survey not found. Please check the code and try again.",
      };
    }

    const questions = backendResponse.data;
    const parsedTemplateId = Number(backendResponse.template_id);
    const surveyTemplateId =
      Number.isFinite(parsedTemplateId) && parsedTemplateId > 0
        ? parsedTemplateId
        : undefined;

    if (!questions || questions.length === 0) {
      return {
        success: false,
        error: "This survey has no questions.",
      };
    }

    // Convert database questions to form questions
    const formQuestions = convertDBQuestionsToFormQuestions(
      questions as Question[],
      typesResult.data,
      surveyTemplateId,
    );

    return {
      success: true,
      questions: formQuestions,
      surveyName: backendResponse.survey_name || backendResponse.surveyName,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "An error occurred while loading the survey",
    };
  }
}

/**
 * Converts a database Question object to a FormQuestion format for rendering
 * @param question - The question from the database
 * @param questionTypes - Array of available question types
 * @returns FormQuestion object ready for rendering
 */
export function convertDBQuestionToFormQuestion(
  question: Question,
  questionTypes: QuestionType[],
  surveyTemplateId?: number,
): FormQuestion {
  const questionType = questionTypes.find(
    (qt) => Number(qt.id) === Number(question.question_type_id),
  );
  const typeName = questionType?.name || "text_input";

  const parsedOptions = parseQuestionOptions(question.options);

  // Base question structure
  const baseQuestion = {
    id: question.id?.toString() || `question-${question.order_index}`,
    label: question.text,
    required: false,
    conditionalLogic: resolveConditionalLogic(parsedOptions, surveyTemplateId),
  };

  // Convert based on type
  switch (typeName) {
    case "text_input":
      return {
        ...baseQuestion,
        type: "text_input" as const,
        placeholder: parsedOptions?.placeholder,
        multiline: parsedOptions?.multiline,
        rows: parsedOptions?.rows,
        inputType: parsedOptions?.inputType,
      };
    case "single_select":
      const singleSelectOptions = parsedOptions?.options || [];
      return {
        ...baseQuestion,
        type: "single_select" as const,
        options: Array.isArray(singleSelectOptions) ? singleSelectOptions : [],
      };
    case "multi_select":
      const multiSelectOptions = parsedOptions?.options || [];
      return {
        ...baseQuestion,
        type: "multi_select" as const,
        options: Array.isArray(multiSelectOptions) ? multiSelectOptions : [],
      };
    case "dropdown":
      const dropdownOptions = parsedOptions?.options || [];
      return {
        ...baseQuestion,
        type: "dropdown" as const,
        options: Array.isArray(dropdownOptions) ? dropdownOptions : [],
      };
    case "map":
      // Map questions render as dropdown in the survey
      const mapOptions = parsedOptions?.options || [];
      return {
        ...baseQuestion,
        type: "dropdown" as const,
        options: Array.isArray(mapOptions) ? mapOptions : [],
      };
    case "rating":
      const parsedScale = Number(parsedOptions?.scale);
      return {
        ...baseQuestion,
        type: "rating" as const,
        scale:
          Number.isFinite(parsedScale) && parsedScale > 0 ? parsedScale : 5,
      };
    default:
      return {
        ...baseQuestion,
        type: "text_input" as const,
      };
  }
}

/**
 * Converts an array of database questions to FormQuestion array
 * @param questions - Array of questions from the database
 * @param questionTypes - Array of available question types
 * @returns Array of FormQuestion objects ready for rendering
 */
export function convertDBQuestionsToFormQuestions(
  questions: Question[],
  questionTypes: QuestionType[],
  surveyTemplateId?: number,
): FormQuestion[] {
  return questions.map((q) =>
    convertDBQuestionToFormQuestion(q, questionTypes, surveyTemplateId),
  );
}
