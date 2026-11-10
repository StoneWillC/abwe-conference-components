import ApiMethods from "../interfaces/ApiMethods";
import GenericItem from "../interfaces/GenericItem";
import apiService from "./api";

// API method wrappers for GenericDropdown
export const templateApiMethods: ApiMethods<GenericItem> = {
  load: async () => await apiService.getEventTemplates(),
  create: async (data) => await apiService.createEventTemplate(data as any),
  update: async (id, data) =>
    await apiService.updateEventTemplate(id, data as any),
  delete: async (id) => await apiService.deleteEventTemplate(id),
};

export const createSessionApiMethods = (
  selectedTemplate: number | ""
): ApiMethods<GenericItem> => ({
  load: async (parentId) => {
    // Load sessions filtered by event template ID
    if (parentId) {
      return await apiService.getSessionTemplatesByEvent(parentId as number);
    }
    return { success: true, data: [] }; // Return empty if no event selected
  },
  create: async (data) => {
    // When creating, automatically link to the selected event template
    const result = await apiService.createSessionTemplate(data as any);
    if (result.success && result.data && selectedTemplate) {
      // Link the new session template to the event template
      await apiService.addExistingSessionTemplate(
        result.data.id,
        selectedTemplate as number
      );
    }
    return result;
  },
  update: async (id, data) =>
    await apiService.updateSessionTemplate(id, data as any),
  delete: async (id) => {
    // If we're viewing sessions under an event template, just remove the link
    if (selectedTemplate) {
      return await apiService.removeSessionTemplateFromEvent(
        id as number,
        selectedTemplate as number
      );
    }
    // Otherwise, delete the session template entirely
    return await apiService.deleteSessionTemplate(id);
  },
  loadAll: async () => await apiService.getAllSessionTemplates(),
  addExisting: async (sessionTemplateId, eventTemplateId) =>
    await apiService.addExistingSessionTemplate(
      sessionTemplateId,
      eventTemplateId!
    ),
});

export const createSurveyApiMethods = (
  selectedSession: number | ""
): ApiMethods<GenericItem> => ({
  load: async (parentId) => {
    // Load surveys filtered by session template ID
    if (parentId) {
      return await apiService.getSurveyTemplatesBySession(parentId as number);
    }
    return { success: true, data: [] }; // Return empty if no session selected
  },
  create: async (data: any) => {
    // Create the survey template first
    const surveyResult = await apiService.createSurveyTemplate(data);

    // Link to the selected session template
    if (
      surveyResult.success &&
      surveyResult.data &&
      surveyResult.data.id !== undefined &&
      selectedSession !== undefined
    ) {
      await apiService.addExistingSurveyTemplate(
        surveyResult.data.id,
        selectedSession as number
      );
    }

    return surveyResult;
  },
  update: async (id, data) =>
    await apiService.updateSurveyTemplate(id, data as any),
  delete: async (id) => {
    // If we're viewing surveys under a session template, just remove the link
    if (selectedSession) {
      return await apiService.removeSurveyTemplateFromSession(
        id as number,
        selectedSession as number
      );
    }
    // Otherwise, delete the survey template entirely
    return await apiService.deleteSurveyTemplate(id);
  },
  loadAll: async () => await apiService.getAllSurveyTemplates(),
  addExisting: async (surveyTemplateId, sessionTemplateId) =>
    await apiService.addExistingSurveyTemplate(
      surveyTemplateId,
      sessionTemplateId!
    ),
});
