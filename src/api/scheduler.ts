import http from '~/utils/http';

/**
 * Loads scheduler settings used for cron registration and run throttling.
 * @returns The scheduler settings payload.
 */
export function getSettings() {
  return http.get<API.Scheduler.Settings>('Scheduler/Settings').json();
}

/**
 * Persists scheduler settings.
 * @param settings - Scheduler settings payload from the management UI.
 * @returns A void promise once the update has been accepted by the backend.
 */
export function updateSettings(settings: API.Scheduler.Settings) {
  return http.put('Scheduler/Settings', { json: settings }).then(() => undefined);
}

/**
 * Resets scheduler settings to the backend defaults.
 * @returns The restored scheduler settings payload.
 */
export function resetSettings() {
  return http.delete<API.Scheduler.Settings>('Scheduler/Settings').json();
}

/**
 * Loads the built-in scheduler task types that the editor can create.
 * @returns A list of task type descriptors and default config payloads.
 */
export function getTaskTypes() {
  return http.get<API.Scheduler.TaskTypeInfo[]>('Scheduler/TaskTypes').json();
}

/**
 * Queries scheduler tasks with search, filtering, sorting, and pagination.
 * @param params - Task query payload.
 * @returns A paged task list.
 */
export function getTasks(params: API.Scheduler.TaskQuery = {}) {
  return http.get<API.Scheduler.Paged<API.Scheduler.Task>>('Scheduler/Tasks', { searchParams: { ...params } }).json();
}

/**
 * Returns one scheduler task by its database identifier.
 * @param id - Task identifier.
 * @returns The matching task payload.
 */
export function getTask(id: number) {
  return http.get<API.Scheduler.Task>(`Scheduler/Tasks/${id}`).json();
}

/**
 * Creates one scheduler task.
 * @param task - Task payload from the editor dialog.
 * @returns The persisted task row.
 */
export function createTask(task: API.Scheduler.TaskUpsert) {
  return http.post<API.Scheduler.Task>('Scheduler/Tasks', { json: task }).json();
}

/**
 * Updates one scheduler task.
 * @param id - Task identifier.
 * @param task - Task payload from the editor dialog.
 * @returns The persisted task row.
 */
export function updateTask(id: number, task: API.Scheduler.TaskUpsert) {
  return http.put<API.Scheduler.Task>(`Scheduler/Tasks/${id}`, { json: task }).json();
}

/**
 * Deletes one scheduler task.
 * @param id - Task identifier.
 * @returns A void promise once the deletion has been accepted by the backend.
 */
export function deleteTask(id: number) {
  return http.delete(`Scheduler/Tasks/${id}`).then(() => undefined);
}

/**
 * Executes one scheduler task immediately and stores the resulting history row.
 * @param id - Task identifier.
 * @param payload - Optional manual-run metadata.
 * @returns The persisted run history row.
 */
export function runTask(id: number, payload: API.Scheduler.RunRequest = {}) {
  return http.post<API.Scheduler.Run>(`Scheduler/Tasks/${id}/Run`, { json: payload }).json();
}

/**
 * Queries scheduler run history with search, filtering, sorting, and pagination.
 * @param params - Run query payload.
 * @returns A paged run history list.
 */
export function getRuns(params: API.Scheduler.RunQuery = {}) {
  return http.get<API.Scheduler.Paged<API.Scheduler.Run>>('Scheduler/Runs', { searchParams: { ...params } }).json();
}
