export interface Question {
  id: number;
  survey_id: number;
  survey_template_id?: number;
  question_type_id: number;
  text: string;
  options?: string | Record<string, any> | null;
  order_index: number;
  created_at?: string;
}

export interface QuestionType {
  id: number | string;
  name: string;
}

export interface QuestionOption {
  survey_question_id: number;
  question_id: number;
  question_text: string;
  question_type: string;
  survey_name?: string;
  options: any;
}
