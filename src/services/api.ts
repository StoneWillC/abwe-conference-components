// API service for ABWE Conference Engagement System
// Centralized CRUD operations for all entities

import { Event } from "@/interfaces/Event";
import { EventTemplate } from "@/interfaces/EventTemplate";
import { AddUserData, EditUserData } from "@/interfaces/ModalProps";
import { Question, QuestionType } from "@/interfaces/Question";
import Session from "@/interfaces/Session";
import Survey from "@/interfaces/Survey";
import {
  AttendeeEntranceData,
  AttendeeLastLoginResponse,
  AttendeeSessionResponse,
  AttendeeSurveyHasSubmittedResponse,
  AttendeeSurveyResponse,
} from "@/types/attendeeTypes";
import { getSessionToken } from "../utils/sessionUtils";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private baseUrl = "/wp-json/wc/abwe-step/v1";

  // Admin/creator/presenter request helper - uses abwe_step_session cookie
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error ${response.status}:`, errorText);

        // Handle 401 Unauthorized - redirect to login for admin routes
        if (response.status === 401 && !endpoint.includes("/attendee/")) {
          window.location.href = "/login";
          return { success: false };
        }

        // Try to parse the error response as JSON (WordPress REST API format)
        try {
          const errorData = JSON.parse(errorText);
          // WordPress REST API returns errors with a 'message' field
          const errorMessage =
            errorData.message ||
            errorData.error ||
            `Request failed with status ${response.status}`;
          return {
            success: false,
            error: errorMessage,
          };
        } catch {
          // If not JSON, use the raw text or a generic message
          return {
            success: false,
            error: errorText || `Request failed with status ${response.status}`,
          };
        }
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return {
          success: true,
          data,
        };
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Response text:", text);
        return {
          success: false,
          error: "Invalid JSON response from server",
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Attendee request helper - uses abweces_attendee_session cookie
  // Sends cookies automatically via browser, no manual session token passing needed
  private async attendeeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Try to parse the error response as JSON (WordPress REST API format)
        try {
          const errorData = JSON.parse(errorText);
          // WordPress REST API returns errors with a 'message' field
          const errorMessage =
            errorData.message ||
            errorData.error ||
            `Request failed with status ${response.status}`;
          return {
            success: false,
            error: errorMessage,
          };
        } catch {
          // If not JSON, use the raw text or a generic message
          return {
            success: false,
            error: errorText || `Request failed with status ${response.status}`,
          };
        }
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Event Templates
  async getEventTemplates() {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<EventTemplate[]>(
      `/event-templates?session_token=${sessionToken}`,
    );
  }

  async createEventTemplate(data: Partial<EventTemplate>) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<EventTemplate>("/event-template/create", {
      method: "POST",
      body: JSON.stringify({ ...data, session_token: sessionToken }),
    });
  }

  async updateEventTemplate(id: number, data: Partial<EventTemplate>) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<EventTemplate>("/event-template/edit", {
      method: "POST",
      body: JSON.stringify({ id, ...data, session_token: sessionToken }),
    });
  }

  async deleteEventTemplate(id: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<void>(
      `/event-template/delete?id=${id}&session_token=${sessionToken}`,
      {
        method: "GET",
      },
    );
  }

  async cloneEventTemplate(id: number, name?: string) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<EventTemplate>("/event-template/clone", {
      method: "POST",
      body: JSON.stringify({ id, name, session_token: sessionToken }),
    });
  }

  async createEvent(
    data: Partial<Event>,
    eventTemplateId: number,
    sessionIds?: number[],
    surveyIds?: number[],
    sessionTimes?: Record<number, { start_time: string; end_time: string }>,
  ) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Event>("/event/create", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        event_template_id: eventTemplateId,
        session_ids: sessionIds,
        survey_ids: surveyIds,
        session_times: sessionTimes,
        session_token: sessionToken,
      }),
    });
  }

  async updateEvent(
    id: number,
    data: Partial<Event>,
    sessionIds?: number[],
    surveyIds?: number[],
    sessionTimes?: Record<number, { start_time: string; end_time: string }>,
  ) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Event>("/event/edit", {
      method: "POST",
      body: JSON.stringify({
        id,
        ...data,
        session_ids: sessionIds,
        survey_ids: surveyIds,
        session_times: sessionTimes,
        session_token: sessionToken,
      }),
    });
  }

  async deleteEvent(id: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<void>(
      `/event/delete?id=${id}&session_token=${sessionToken}`,
      {
        method: "GET",
      },
    );
  }

  // Concrete Events (non-template)
  async getEvents() {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Event[]>(`/events?session_token=${sessionToken}`);
  }

  // Session Templates
  async getSessionTemplates() {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Session[]>(
      `/session-templates?session_token=${sessionToken}`,
    );
  }

  async getSessionTemplatesByEvent(eventTemplateId: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Session[]>(
      `/session-templates/by-event?event_template_id=${eventTemplateId}&session_token=${sessionToken}`,
    );
  }

  // Concrete Sessions (non-template)
  async getSessions(sessionTemplateId?: number, eventId?: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    const params = new URLSearchParams();
    if (eventId) {
      params.append("event_id", eventId.toString());
    }
    params.append("session_token", sessionToken);
    const query = params.toString();
    return this.request<Session[]>(`/sessions${query ? `?${query}` : ""}`);
  }

  // Survey Templates and Concrete Surveys
  async getSurveys(sessionId?: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    const params = new URLSearchParams();
    if (sessionId) {
      params.append("session_id", sessionId.toString());
    }
    params.append("session_token", sessionToken);
    const query = params.toString();
    return this.request<Survey[]>(`/surveys${query ? `?${query}` : ""}`);
  }

  async createSessionTemplate(data: Partial<Session>) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Session>("/session-template/create", {
      method: "POST",
      body: JSON.stringify({ ...data, session_token: sessionToken }),
    });
  }

  async updateSessionTemplate(id: number, data: Partial<Session>) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Session>("/session-template/edit", {
      method: "POST",
      body: JSON.stringify({ id, ...data, session_token: sessionToken }),
    });
  }

  async deleteSessionTemplate(id: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<void>(
      `/session-template/delete?id=${id}&session_token=${sessionToken}`,
      {
        method: "GET",
      },
    );
  }

  async cloneSessionTemplate(
    id: number,
    eventTemplateId?: number,
    sourceEventTemplateId?: number,
    name?: string,
  ) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Session>("/session-template/clone", {
      method: "POST",
      body: JSON.stringify({
        id,
        event_template_id: eventTemplateId,
        source_event_template_id: sourceEventTemplateId ?? eventTemplateId,
        name,
        session_token: sessionToken,
      }),
    });
  }

  async getAllSessionTemplates() {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Session[]>(
      `/session-templates/all?session_token=${sessionToken}`,
    );
  }

  async addExistingSessionTemplate(
    sessionTemplateId: number,
    eventTemplateId: number,
  ) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Session>("/session-template/add-existing", {
      method: "POST",
      body: JSON.stringify({
        session_template_id: sessionTemplateId,
        event_template_id: eventTemplateId,
        session_token: sessionToken,
      }),
    });
  }

  async removeSessionTemplateFromEvent(
    sessionTemplateId: number,
    eventTemplateId: number,
  ) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<void>("/session-template/remove-from-event", {
      method: "POST",
      body: JSON.stringify({
        session_template_id: sessionTemplateId,
        event_template_id: eventTemplateId,
        session_token: sessionToken,
      }),
    });
  }

  // Survey Templates
  async getSurveyTemplates() {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Survey[]>(
      `/survey-templates?session_token=${sessionToken}`,
    );
  }

  async getSurveyTemplatesBySession(sessionTemplateId: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Survey[]>(
      `/survey-templates/by-session?session_template_id=${sessionTemplateId}&session_token=${sessionToken}`,
    );
  }

  async createSurveyTemplate(data: Partial<Survey>) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Survey>("/survey-template/create", {
      method: "POST",
      body: JSON.stringify({ ...data, session_token: sessionToken }),
    });
  }

  async updateSurveyTemplate(id: number, data: Partial<Survey>) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Survey>("/survey-template/edit", {
      method: "POST",
      body: JSON.stringify({ id, ...data, session_token: sessionToken }),
    });
  }

  async deleteSurveyTemplate(id: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<void>(
      `/survey-template/delete?id=${id}&session_token=${sessionToken}`,
      {
        method: "GET",
      },
    );
  }

  async cloneSurveyTemplate(
    id: number,
    sessionTemplateId?: number,
    eventTemplateId?: number,
    sourceSessionTemplateId?: number,
    sourceEventTemplateId?: number,
    name?: string,
  ) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Survey>("/survey-template/clone", {
      method: "POST",
      body: JSON.stringify({
        id,
        session_template_id: sessionTemplateId,
        event_template_id: eventTemplateId,
        source_session_template_id:
          sourceSessionTemplateId ?? sessionTemplateId,
        source_event_template_id: sourceEventTemplateId ?? eventTemplateId,
        name,
        session_token: sessionToken,
      }),
    });
  }

  async getAllSurveyTemplates() {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Survey[]>(
      `/survey-templates/all?session_token=${sessionToken}`,
    );
  }

  async addExistingSurveyTemplate(
    surveyTemplateId: number,
    sessionTemplateId: number,
  ) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Survey>("/survey-template/add-existing", {
      method: "POST",
      body: JSON.stringify({
        survey_template_id: surveyTemplateId,
        session_template_id: sessionTemplateId,
        session_token: sessionToken,
      }),
    });
  }

  async removeSurveyTemplateFromSession(
    surveyTemplateId: number,
    sessionTemplateId: number,
  ) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<void>("/survey-template/remove-from-session", {
      method: "POST",
      body: JSON.stringify({
        survey_template_id: surveyTemplateId,
        session_template_id: sessionTemplateId,
        session_token: sessionToken,
      }),
    });
  }

  // Questions
  async getQuestions(surveyTemplateId?: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    const params = new URLSearchParams();
    if (surveyTemplateId) {
      params.append("survey_template_id", surveyTemplateId.toString());
    }
    params.append("order_by", "order_index");
    params.append("order", "ASC");
    params.append("session_token", sessionToken);

    const url = `/questions?${params.toString()}`;
    return this.request<Question[]>(url);
  }

  async createQuestion(data: Partial<Question>, surveyTemplateId: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Question>("/question/create", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        survey_template_id: surveyTemplateId,
        session_token: sessionToken,
      }),
    });
  }

  async updateQuestion(id: number, data: Partial<Question>) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Question>("/question/edit", {
      method: "POST",
      body: JSON.stringify({ id, ...data, session_token: sessionToken }),
    });
  }

  async deleteQuestion(id: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<void>(
      `/question/delete?id=${id}&session_token=${sessionToken}`,
      {
        method: "GET",
      },
    );
  }

  async removeQuestionFromSurvey(questionId: number, surveyTemplateId: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<void>(
      `/question/remove-from-survey?question_id=${questionId}&survey_template_id=${surveyTemplateId}&session_token=${sessionToken}`,
      {
        method: "GET",
      },
    );
  }

  async updateQuestionOrder(questionId: number, surveyTemplateId: number, orderIndex: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<{ success: boolean }>("/question/update-order", {
      method: "POST",
      body: JSON.stringify({
        question_id: questionId,
        survey_template_id: surveyTemplateId,
        order_index: orderIndex,
        session_token: sessionToken,
      }),
    });
  }

  async getAllQuestions() {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    const params = new URLSearchParams();
    params.append("order_by", "created_at");
    params.append("order", "DESC");
    params.append("session_token", sessionToken);

    const url = `/questions/all?${params.toString()}`;
    return this.request<Question[]>(url);
  }

  async addExistingQuestion(questionId: number, surveyTemplateId: number, orderIndex: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<Question>("/question/add-existing", {
      method: "POST",
      body: JSON.stringify({
        question_id: questionId,
        survey_template_id: surveyTemplateId,
        order_index: orderIndex,
        session_token: sessionToken,
      }),
    });
  }

  // Question Types
  async getQuestionTypes() {
    return this.request<QuestionType[]>("/question-types");
  }

  // Admin - User Management
  async getAllUsers() {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<any>(`/admin/users?session_token=${sessionToken}`);
  }

  async createUser(userData: AddUserData) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<any>("/admin/users/create", {
      method: "POST",
      body: JSON.stringify({ ...userData, session_token: sessionToken }),
    });
  }

  async editUser(userData: EditUserData) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<any>("/admin/users/edit", {
      method: "POST",
      body: JSON.stringify({ ...userData, session_token: sessionToken }),
    });
  }

  async deleteUser(id: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<any>("/admin/users/delete", {
      method: "DELETE",
      body: JSON.stringify({ id, session_token: sessionToken }),
    });
  }

  async getAllRoles() {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<any>(`/admin/roles?session_token=${sessionToken}`);
  }
  // Attendees - uses attendeeRequest with abweces_attendee_session cookie
  async createAttendeeSession(data: AttendeeEntranceData) {
    return this.attendeeRequest<AttendeeSessionResponse>("/attendee/session", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getAttendeeLastLogin(sessionToken: string) {
    return this.attendeeRequest<AttendeeLastLoginResponse>(
      `/attendee/last-login?session_token=${sessionToken}`,
    );
  }

  async checkSurveySubmission(surveyCode: string, sessionToken: string) {
    return this.attendeeRequest<AttendeeSurveyHasSubmittedResponse>(
      `/survey/${surveyCode}/check-submission?session_token=${sessionToken}`,
      {
        method: "GET",
      },
    );
  }

  async submitSurveyResponses(
    surveyCode: string,
    responses: Array<{ question_id: number; answer: any }>,
    sessionToken: string,
  ) {
    return this.attendeeRequest<AttendeeSurveyResponse>(
      `/survey/${surveyCode}/submit`,
      {
        method: "POST",
        body: JSON.stringify({
          responses: responses,
          session_token: sessionToken,
        }),
      },
    );
  }

  // Dashboard
  async getDashboardByCode(code: string) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    try {
      const response = await fetch(
        `/wp-json/wc/abwe-step/v1/dashboard/${code}?session_token=${sessionToken}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch dashboard data: ${response.status}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  async getDashboardDelta(code: string, surveyQuestionIds?: number[]) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }

    const params = new URLSearchParams();
    params.append("session_token", sessionToken);
    if (surveyQuestionIds && surveyQuestionIds.length > 0) {
      params.append("survey_question_ids", surveyQuestionIds.join(","));
    }

    return this.request<any>(`/dashboard/${code}/delta?${params.toString()}`);
  }

  getDashboardEventStreamUrl(code: string, sinceId?: number): string | null {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return null;
    }

    const params = new URLSearchParams();
    params.append("session_token", sessionToken);
    if (sinceId && sinceId > 0) {
      params.append("since_id", sinceId.toString());
    }

    return `/wp-json/wc/abwe-step/v1/dashboard/${code}/stream?${params.toString()}`;
  }

  async sendDashboardCommand(
    code: string,
    command: "setMode" | "panTo" | "setZoom" | "setRemoteControl",
    payload?: Record<string, unknown>,
  ) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }

    return this.request<any>(`/dashboard/${code}/command`, {
      method: "POST",
      body: JSON.stringify({
        command,
        payload: payload || {},
        session_token: sessionToken,
      }),
    });
  }

  async getDashboardConfig(code: string) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    try {
      const response = await fetch(
        `/wp-json/wc/abwe-step/v1/dashboard/config/${code}?session_token=${sessionToken}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch dashboard configuration: ${response.status}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  async updateDashboardConfig(code: string, display: any[], layout?: string) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    try {
      const response = await fetch(
        `/wp-json/wc/abwe-step/v1/dashboard/config/${code}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            display,
            layout,
            session_token: sessionToken,
          }),
        },
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to update dashboard configuration: ${response.status}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  async getTemplateDashboardConfig(templateId: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    try {
      const response = await fetch(
        `/wp-json/wc/abwe-step/v1/dashboard/template-config/${templateId}?session_token=${sessionToken}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch template dashboard configuration: ${response.status}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  async updateTemplateDashboardConfig(
    templateId: number,
    display: any[],
    layout?: string,
    displayMode?: string,
  ) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    try {
      const response = await fetch(
        `/wp-json/wc/abwe-step/v1/dashboard/template-config/${templateId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            display,
            layout,
            display_mode: displayMode,
            session_token: sessionToken,
          }),
        },
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to update template dashboard configuration: ${response.status}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  // Auth
  async loginUser(email: string, password: string) {
    return this.request<{
      success: boolean;
      user?: any;
      requires_password_change?: boolean;
      session_token?: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async logoutUser(sessionToken: string) {
    return this.request<{ success: boolean }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ session_token: sessionToken }),
    });
  }

  async getCurrentUser(sessionToken: string) {
    try {
      const response = await fetch(
        `/wp-json/wc/abwe-step/v1/auth/me?session_token=${sessionToken}`,
        {
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.message || `Request failed with status ${response.status}`,
        };
      }

      return {
        success: data.success || false,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    return this.request<{ success: boolean; message: string }>(
      "/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      },
    );
  }

  async requestPasswordReset(email: string) {
    return this.request<{ success: boolean; message: string }>(
      "/auth/request-reset",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
    );
  }

  async adminChangeUserPassword(userId: number, newPassword: string) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found. Please log in.",
      };
    }
    return this.request<{ success: boolean; message: string }>(
      "/admin/users/change-password",
      {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          new_password: newPassword,
          session_token: sessionToken,
        }),
      },
    );
  }

  // Survey Questions (Public endpoint)
  async getSurveyQuestionsById(code: string) {
    try {
      const response = await fetch(`${this.baseUrl}/survey/${code}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error:
            errorData.message ||
            `Request failed with status ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Get survey questions by template_id (for preview)
  async getSurveyQuestionsByTemplateId(templateId: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<{ success: boolean; questions: any[] }>(
      `/survey-template/${templateId}/questions?session_token=${sessionToken}`,
    );
  }

  // Check if event template is used by any event
  // Check if event template is used by any event
  async isEventTemplateUsed(eventTemplateId: number): Promise<boolean> {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return false;
    }
    try {
      const response = await fetch(
        `${this.baseUrl}/event-template/is-used?event_template_id=${eventTemplateId}&session_token=${sessionToken}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) return false;
      const data = await response.json();
      return !!data.used;
    } catch {
      return false;
    }
  }

  // Check if session template is used by any session
  async isSessionTemplateUsed(sessionTemplateId: number): Promise<boolean> {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return false;
    }
    try {
      const response = await fetch(
        `${this.baseUrl}/session-template/is-used?session_template_id=${sessionTemplateId}&session_token=${sessionToken}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) return false;
      const data = await response.json();
      return !!data.used;
    } catch {
      return false;
    }
  }

  // Check if survey template is used by any survey
  async isSurveyTemplateUsed(surveyTemplateId: number): Promise<boolean> {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return false;
    }
    try {
      const response = await fetch(
        `${this.baseUrl}/survey-template/is-used?survey_template_id=${surveyTemplateId}&session_token=${sessionToken}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) return false;
      const data = await response.json();
      return !!data.used;
    } catch {
      return false;
    }
  }
  // Presenter Console - Survey Control
  async getSurveyByCode(code: string) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<any>(
      `/survey/${code}/info?session_token=${sessionToken}`,
    );
  }

  async toggleSurveyStatus(code: string, isActive: boolean) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<any>("/survey/toggle-status", {
      method: "POST",
      body: JSON.stringify({
        code,
        is_active: isActive,
        session_token: sessionToken,
      }),
    });
  }

  async getSurveyQuestionsByCode(code: string) {
    const sessionToken = getSessionToken();
    if (sessionToken) {
      // Include session token for presenter access (allows viewing closed surveys)
      return this.request<Question[]>(
        `/survey/${code}?session_token=${sessionToken}`,
      );
    } else {
      return this.request<Question[]>(`/survey/${code}`);
    }
  }

  async selectWinner(code: string, questionId: number, optionIndex?: number) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    const body: {
      code: string;
      question_id: number;
      session_token: string;
      option_index?: number;
    } = {
      code,
      question_id: questionId,
      session_token: sessionToken,
    };
    if (optionIndex !== undefined) {
      body.option_index = optionIndex;
    }
    return this.request<any>("/survey/select-winner", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getSurveyWinners(code: string) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<any>(
      `/survey/${code}/winners?session_token=${sessionToken}`,
    );
  }

  async deleteWinner(
    code: string,
    questionId: number,
    attendeeId: number,
    optionIndex?: number | null,
  ) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    const body: {
      code: string;
      question_id: number;
      attendee_id: number;
      session_token: string;
      option_index?: number;
    } = {
      code,
      question_id: questionId,
      attendee_id: attendeeId,
      session_token: sessionToken,
    };
    if (optionIndex !== undefined && optionIndex !== null) {
      body.option_index = optionIndex;
    }
    return this.request<any>("/survey/delete-winner", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getResponseStats(code: string) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<any>(
      `/survey/${code}/response-stats?session_token=${sessionToken}`,
    );
  }

  // Optimize Winners — commented out
  // async optimizeWinners(
  //   code: string,
  //   slots: Array<{
  //     question_id: number;
  //     option_index: number | null;
  //     count: number;
  //   }>,
  //   commit: boolean,
  // ) {
  //   return this.request<any>("/survey/optimize-winners", {
  //     method: "POST",
  //     body: JSON.stringify({ code, slots, commit }),
  //   });
  // }
  //
  // async validateWinnerConfig(
  //   code: string,
  //   slots: Array<{
  //     question_id: number;
  //     option_index: number | null;
  //     count: number;
  //   }>,
  // ) {
  //   return this.request<any>("/survey/validate-winner-config", {
  //     method: "POST",
  //     body: JSON.stringify({ code, slots }),
  //   });
  // }

  // Dashboard Display Mode Control
  async setDashboardMode(
    code: string,
    mode: "qr-full" | "qr-corner-main" | "qr-corner-map" | "main",
    mapCenterLat?: number,
    mapCenterLng?: number,
    mapZoom?: number,
  ) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<any>(`/dashboard/${code}/control`, {
      method: "POST",
      body: JSON.stringify({
        mode,
        mapCenterLat,
        mapCenterLng,
        mapZoom,
        session_token: sessionToken,
      }),
    });
  }

  async getDashboardMode(code: string) {
    return this.request<any>(`/dashboard/${code}/mode`);
  }

  // Reporting
  async getEventsByTemplateAndDateRange(
    templateId: number,
    startDate: string,
    endDate: string,
  ) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return { success: false, error: "No session token found" };
    }
    const response = await this.request<
      { success: boolean; data?: Event[]; error?: string } | Event[]
    >("/reporting/events", {
      method: "POST",
      body: JSON.stringify({
        template_id: templateId,
        start_date: startDate,
        end_date: endDate,
        session_token: sessionToken,
      }),
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || "Failed to load events",
      };
    }

    const payload = response.data as any;
    if (Array.isArray(payload)) {
      return { success: true, data: payload };
    }

    if (payload.success === false) {
      return {
        success: false,
        error: payload.error || "Failed to load events",
      };
    }

    return {
      success: true,
      data: Array.isArray(payload.data) ? payload.data : [],
    };
  }

  async getReportingQuestionOptions(eventIds: number[]) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return { success: false, error: "No session token found" };
    }
    const response = await this.request<
      | {
          success: boolean;
          data?: {
            questions: Array<{
              id: number;
              text: string;
              question_type: string;
              survey_name?: string;
              survey_title?: string;
              survey?: string;
            }>;
            default_question_ids: number[];
            layout: string | null;
          };
          error?: string;
        }
      | {
          questions: Array<{
            id: number;
            text: string;
            question_type: string;
            survey_name?: string;
            survey_title?: string;
            survey?: string;
          }>;
          default_question_ids: number[];
          layout: string | null;
        }
    >("/reporting/question-options", {
      method: "POST",
      body: JSON.stringify({
        event_ids: eventIds,
        session_token: sessionToken,
      }),
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || "Failed to load reporting question options",
      };
    }

    const payload = response.data as any;
    if (payload.success === false) {
      return {
        success: false,
        error: payload.error || "Failed to load reporting question options",
      };
    }

    const normalized = payload.data ? payload.data : payload;
    return {
      success: true,
      data: {
        questions: Array.isArray(normalized.questions)
          ? normalized.questions.map((question: any) => ({
              ...question,
              survey_name:
                question?.survey_name ||
                question?.survey_title ||
                question?.survey ||
                "",
            }))
          : [],
        default_question_ids: Array.isArray(normalized.default_question_ids)
          ? normalized.default_question_ids
          : [],
        layout: normalized.layout ?? null,
      },
    };
  }

  async getReportingDataset(params: {
    eventIds: number[];
    dashboardQuestionIds?: number[];
    layout?: string;
    widgetOverrides?: Array<{
      questionId: number;
      widgetType: string;
      position?: string;
    }>;
  }) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return { success: false, error: "No session token found" };
    }
    const response = await this.request<
      | {
          success: boolean;
          data?: {
            layout: string;
            widgets: any[];
            participants: number;
            eventName: string;
            sessionName: string;
          };
          error?: string;
        }
      | {
          layout: string;
          widgets: any[];
          participants: number;
          eventName: string;
          sessionName: string;
        }
    >("/reporting/dataset", {
      method: "POST",
      body: JSON.stringify({
        event_ids: params.eventIds,
        question_ids: params.dashboardQuestionIds ?? [],
        layout: params.layout,
        widget_overrides: params.widgetOverrides ?? [],
        session_token: sessionToken,
      }),
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || "Failed to generate reporting dataset",
      };
    }

    const payload = response.data as any;
    if (payload.success === false) {
      return {
        success: false,
        error: payload.error || "Failed to generate reporting dataset",
      };
    }

    return {
      success: true,
      data: payload.data ? payload.data : payload,
    };
  }

  async exportEventsCsv(params: {
    eventIds: number[];
    includeWinners?: boolean;
  }) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return { success: false, error: "No session token found" };
    }
    const response = await this.request<
      | { success: boolean; data?: { surveys: any[] }; error?: string }
      | { surveys: any[] }
    >("/reporting/export-csv", {
      method: "POST",
      body: JSON.stringify({
        event_ids: params.eventIds,
        include_winners: params.includeWinners,
        session_token: sessionToken,
      }),
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || "Failed to export CSV",
      };
    }

    const payload = response.data as any;
    if (payload.success === false) {
      return { success: false, error: payload.error || "Failed to export CSV" };
    }

    const normalized = payload.data ? payload.data : payload;
    return {
      success: true,
      data: {
        surveys: Array.isArray(normalized.surveys)
          ? normalized.surveys
          : Array.isArray(normalized.events)
            ? normalized.events
            : [],
      },
    };
  }

  // Export Survey Report
  async exportSurveyReport(code: string) {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      return {
        success: false,
        error: "No session token found",
      };
    }
    return this.request<{
      event_title: string;
      event_location: string;
      event_start_date: string;
      event_end_date: string;
      session_title: string;
      survey_title: string;
      questions: Array<{
        question_id: number;
        question_text: string;
        question_type: string;
        survey_question_id: number;
        options: string[];
      }>;
      attendees: Record<
        string,
        { first_name: string; last_name: string; email: string }
      >;
      responses: Record<string, Record<string, string>>;
      winners: Array<{
        question_id: number;
        question_text: string;
        option_index: number | null;
        option_text: string | null;
        name: string;
        email: string;
      }>;
    }>(`/survey/${code}/export-csv?session_token=${sessionToken}`);
  }

  // Report Email Config
  async getTemplateReportEmailConfig(templateId: number) {
    const sessionToken = getSessionToken();
    return this.request<any>(
      `/event-template/${templateId}/report-email-config?session_token=${sessionToken}`,
    );
  }

  async saveTemplateReportEmailConfig(
    templateId: number,
    data: { recipients: string[]; is_enabled: boolean },
  ) {
    const sessionToken = getSessionToken();
    return this.request<any>(
      `/event-template/${templateId}/report-email-config`,
      {
        method: "POST",
        body: JSON.stringify({ ...data, session_token: sessionToken }),
      },
    );
  }

  async getEventReportEmailConfig(eventId: number) {
    const sessionToken = getSessionToken();
    return this.request<any>(
      `/event/${eventId}/report-email-config?session_token=${sessionToken}`,
    );
  }

  async saveEventReportEmailConfig(
    eventId: number,
    data: { recipients: string[]; is_enabled: boolean },
  ) {
    const sessionToken = getSessionToken();
    return this.request<any>(`/event/${eventId}/report-email-config`, {
      method: "POST",
      body: JSON.stringify({ ...data, session_token: sessionToken }),
    });
  }

  async sendReportEmail(eventId: number) {
    const sessionToken = getSessionToken();
    return this.request<any>(`/event/${eventId}/send-report-email`, {
      method: "POST",
      body: JSON.stringify({ session_token: sessionToken }),
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
