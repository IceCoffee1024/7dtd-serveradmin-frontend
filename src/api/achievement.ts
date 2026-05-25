import http from '~/utils/http';

/**
 * Loads achievement feature settings.
 */
export function getSettings() {
  return http.get<API.Achievement.Settings>('Achievement/Settings').json();
}

/**
 * Persists achievement feature settings.
 */
export function updateSettings(settings: API.Achievement.Settings) {
  return http.put('Achievement/Settings', { json: settings }).then(() => undefined);
}

/**
 * Resets achievement feature settings to defaults and returns the restored payload.
 */
export function resetSettings() {
  return http.delete<API.Achievement.Settings>('Achievement/Settings').json();
}

/**
 * Returns a paged list of achievement definitions.
 * @param query - Filtering, sorting and pagination criteria.
 */
export function getDefinitions(query?: API.Achievement.DefinitionQuery) {
  return http.get<API.Achievement.PagedResult<API.Achievement.DefinitionDto>>('Achievement/Definitions', { searchParams: query as Record<string, string | number | boolean> }).json();
}

/**
 * Returns one achievement definition by id.
 * @param id - Definition identifier.
 */
export function getDefinition(id: number) {
  return http.get<API.Achievement.DefinitionDto>(`Achievement/Definitions/${id}`).json();
}

/**
 * Creates a new achievement definition.
 * @param payload - Definition payload.
 */
export function createDefinition(payload: API.Achievement.DefinitionUpsertDto) {
  return http.post<API.Achievement.DefinitionDto>('Achievement/Definitions', { json: payload }).json();
}

/**
 * Updates an existing achievement definition.
 * @param id - Definition identifier.
 * @param payload - Updated definition payload.
 */
export function updateDefinition(id: number, payload: API.Achievement.DefinitionUpsertDto) {
  return http.put<API.Achievement.DefinitionDto>(`Achievement/Definitions/${id}`, { json: payload }).json();
}

/**
 * Deletes an achievement definition and all associated earn records.
 * @param id - Definition identifier.
 */
export function deleteDefinition(id: number) {
  return http.delete(`Achievement/Definitions/${id}`).then(() => undefined);
}

/**
 * Returns a paged list of achievement earn records.
 * @param query - Filtering, sorting and pagination criteria.
 */
export function getRecords(query?: API.Achievement.RecordQuery) {
  return http.get<API.Achievement.PagedResult<API.Achievement.RecordDto>>('Achievement/Records', { searchParams: query as Record<string, string | number | boolean> }).json();
}

/**
 * Deletes one earn record, allowing the achievement to be re-granted on the next player save.
 * @param id - Record identifier.
 */
export function deleteRecord(id: number) {
  return http.delete(`Achievement/Records/${id}`).then(() => undefined);
}
