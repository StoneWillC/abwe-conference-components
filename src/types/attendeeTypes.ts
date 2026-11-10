export interface AttendeeEntranceData {
  first_name: string;
  last_name: string;
  email: string;
  event_id: number;
}

export interface AttendeeSessionResponse {
  success: boolean;
  message: string;
  attendee_id: number;
  session_token: string;
  last_login: string;
}

export interface AttendeeLastLoginResponse {
  success: boolean;
  attendee_id?: number;
  last_login: string | null;
}

export interface AttendeeError {
  code: string;
  message: string;
  data: {
    status: number;
  };
}

export interface AttendeeSurveyResponse {
  success: boolean;
  message: string;
  inserted_count: number;
  submitted_at?: string;
  already_submitted?: boolean;
}

export interface AttendeeSurveyHasSubmittedResponse {
  success: boolean;
  has_submitted: boolean;
}
