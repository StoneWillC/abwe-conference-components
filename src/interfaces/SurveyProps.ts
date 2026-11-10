import { FormQuestion } from "@/types/questionsTypes";

export default interface SurveyProps {
  // Optional props for when Survey is used as a component (e.g., in preview)
  questions?: FormQuestion[];
  title?: string;
  isPreview?: boolean;
  onPreviewClose?: () => void;
}
