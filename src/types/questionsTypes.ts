export interface QuestionBase {
  id: string;
  type: "text_input" | "single_select" | "multi_select" | "rating" | "dropdown";
  label?: string; // Typography above the input
  floatingLabel?: string; // Floating label for input fields
  required?: boolean;
  conditionalLogic?: ConditionalLogicConfig;
}

export type ConditionalAction = "show" | "hide";
export type ConditionalMatchType = "all" | "any";
export type ConditionalOperator = "is" | "is_not" | "contains";

export interface ConditionalLogicCondition {
  questionId: string;
  operator: ConditionalOperator;
  value: string;
}

export interface ConditionalLogicConfig {
  enabled: boolean;
  action: ConditionalAction;
  matchType: ConditionalMatchType;
  conditions: ConditionalLogicCondition[];
}

export interface TextInputQuestion extends QuestionBase {
  type: "text_input";
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  inputType?: "text" | "email";
}

export interface SingleSelectQuestion extends QuestionBase {
  type: "single_select";
  options: string[];
}

export interface MultiSelectQuestion extends QuestionBase {
  type: "multi_select";
  options: string[];
}

export interface RatingQuestion extends QuestionBase {
  type: "rating";
  scale: number; // Maximum rating value (e.g., 5 for 1-5 scale, 10 for 1-10 scale)
  labels?: string[]; // Optional labels for rating values
}

export interface DropdownQuestion extends QuestionBase {
  type: "dropdown";
  options: string[];
}

export type FormQuestion =
  | TextInputQuestion
  | SingleSelectQuestion
  | MultiSelectQuestion
  | RatingQuestion
  | DropdownQuestion;

export interface FormQuestionProps {
  question: FormQuestion;
  value: any;
  onChange: (questionId: string, value: any) => void;
}
