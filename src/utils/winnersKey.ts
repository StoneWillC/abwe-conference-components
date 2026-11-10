/**
 * Builds a composite key for winners_enabled_by_survey lookups.
 * Keys by event template + session template + survey template so the same
 * shared question can have winners toggled independently per context.
 */
export function buildWinnersKey(
  eventTemplateId?: number | string,
  sessionTemplateId?: number | string,
  surveyTemplateId?: number | string,
): string | null {
  if (!eventTemplateId || !sessionTemplateId || !surveyTemplateId) return null;
  return `et:${eventTemplateId}_st:${sessionTemplateId}_sv:${surveyTemplateId}`;
}

/**
 * Reads winners_enabled for a given context key from parsed question options.
 */
export function isWinnersEnabled(
  parsedOptions: Record<string, any> | null,
  winnersKey: string | null,
): boolean {
  if (!winnersKey || !parsedOptions) return false;
  return parsedOptions.winners_enabled_by_survey?.[winnersKey] === true;
}
