import { Role } from "@/types/role";
import { User } from "@/types/user";
import { Event } from "./Event";
import { EventTemplate } from "./EventTemplate";
import { Question, QuestionType } from "./Question";
import Session from "./Session";
import Survey from "./Survey";

export interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

// User submit data types
export type AddUserData = {
  name: string;
  email: string;
  role: string;
};

export type EditUserData = {
  id: number;
  name: string;
  email: string;
  role: string;
};

// Unified modal for both adding and editing users
export interface UserModalProps {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  user?: User | null;
  roles: Role[];
  rolesLoading: boolean;
  rolesError: string | null;
  // Overloaded signatures for add vs edit modes
  onSubmit: ((data: AddUserData) => Promise<void>) &
    ((data: EditUserData) => Promise<void>);
}
export interface ModifyQuestionModalProps {
  open: boolean;
  onClose: () => void;
  action: "create" | "edit" | "view";
  item?: Question | null;
  onSubmit: (data: Partial<Question>) => void;
  questionTypes: QuestionType[];
  surveyTemplateId?: number;
  eventTemplateId?: number;
  sessionTemplateId?: number;
  surveyQuestions?: Question[];
  loading?: boolean;
  restrictedEdit?: boolean;
}

export interface ModifySessionModalProps {
  open: boolean;
  onClose: () => void;
  action: "create" | "edit" | "view";
  item?: Session | null;
  onSubmit: (data: Partial<Session>) => void;
  loading?: boolean;
  hideTimeFields?: boolean; // Hide time fields when creating template sessions
}

export interface ModifySurveyModalProps {
  open: boolean;
  onClose: () => void;
  action: "create" | "edit" | "view";
  item?: Survey | null;
  onSubmit: (data: Partial<Survey>) => void;
  loading?: boolean;
  questionTypes: QuestionType[];
  restrictedEdit?: boolean;
  eventTemplateId?: number;
  sessionTemplateId?: number;
}

export interface ModifyTemplateModalProps {
  open: boolean;
  onClose: () => void;
  action: "create" | "edit" | "view";
  item?: EventTemplate | null;
  onSubmit: (data: Partial<EventTemplate>) => Promise<number | void> | void;
  loading?: boolean;
}

export interface AddExistingModalProps<T> {
  open: boolean;
  onClose: () => void;
  onAddExisting: (itemIds: (number | string)[]) => void;
  title: string;
  items: T[];
  loading: boolean;
  loadingItems: boolean;
  formatItemDisplay: (item: T) => string;
  selectionLimit?: number;
  questionTypes?: QuestionType[];
  questionColumnMode?: "type" | "description";
  questionShowSurveyColumn?: boolean;
}

export interface ModifyEventModalProps {
  open: boolean;
  onClose: () => void;
  action: "create" | "edit" | "view";
  item?: Event;
  onSubmit: (data: Partial<Event>) => void;
  loading?: boolean;
}
