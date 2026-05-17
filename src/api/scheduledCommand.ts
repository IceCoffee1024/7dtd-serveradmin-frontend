import http from '~/utils/http';

/**
 * Loads scheduler settings used for cron registration and history pruning.
 * @returns The scheduler settings payload.
 */
export function getSettings() {
  return http.get<API.ScheduledCommand.Settings>('ScheduledCommands/Settings').json();
}

/**
 * Persists scheduler settings.
 * @param settings - Scheduler settings payload from the management UI.
 * @returns A void promise once the update has been accepted by the backend.
 */
export function updateSettings(settings: API.ScheduledCommand.Settings) {
  return http.put('ScheduledCommands/Settings', { json: settings }).then(() => undefined);
}

/**
 * Resets scheduler settings to the backend defaults.
 * @returns The restored scheduler settings payload.
 */
export function resetSettings() {
  return http.delete<API.ScheduledCommand.Settings>('ScheduledCommands/Settings').json();
}

/**
 * Loads the built-in task type descriptors for the task editor.
 * @returns A list of task type metadata entries.
 */
export function getTaskTypes() {
  return http.get<API.ScheduledCommand.TaskTypeInfo[]>('ScheduledCommands/TaskTypes').json();
}

/**
 * Queries scheduled commands with search, filtering, sorting, and pagination.
 * @param params - Task query payload.
 * @returns A paged task list.
 */
export function getTasks(params: API.ScheduledCommand.TaskQuery = {}) {
  return http.get<API.ScheduledCommand.Paged<API.ScheduledCommand.Task>>('ScheduledCommands', { searchParams: { ...params } }).json();
}

/**
 * Returns one scheduled command by its database identifier.
 * @param id - Task identifier.
 * @returns The matching task payload.
 */
export function getTask(id: number) {
  return http.get<API.ScheduledCommand.Task>(`ScheduledCommands/${id}`).json();
}

/**
 * Creates one scheduled command.
 * @param task - Task payload from the editor dialog.
 * @returns The persisted task row.
 */
export function createTask(task: API.ScheduledCommand.TaskUpsert) {
  return http.post<API.ScheduledCommand.Task>('ScheduledCommands', { json: task }).json();
}

/**
 * Updates one scheduled command.
 * @param id - Task identifier.
 * @param task - Task payload from the editor dialog.
 * @returns The persisted task row.
 */
export function updateTask(id: number, task: API.ScheduledCommand.TaskUpsert) {
  return http.put<API.ScheduledCommand.Task>(`ScheduledCommands/${id}`, { json: task }).json();
}

/**
 * Deletes one scheduled command.
 * @param id - Task identifier.
 * @returns A void promise once the deletion has been accepted by the backend.
 */
export function deleteTask(id: number) {
  return http.delete(`ScheduledCommands/${id}`).then(() => undefined);
}

/**
 * Executes one scheduled command immediately and stores the resulting history row.
 * @param id - Task identifier.
 * @param payload - Optional manual-run metadata.
 * @returns The persisted run history row.
 */
export function runTask(id: number, payload: API.ScheduledCommand.RunRequest = {}) {
  return http.post<API.ScheduledCommand.Run>(`ScheduledCommands/${id}/Run`, { json: payload }).json();
}

/**
 * Queries scheduled command run history with search, filtering, sorting, and pagination.
 * @param params - Run query payload.
 * @returns A paged run history list.
 */
export function getRuns(params: API.ScheduledCommand.RunQuery = {}) {
  return http.get<API.ScheduledCommand.Paged<API.ScheduledCommand.Run>>('ScheduledCommands/Runs', { searchParams: { ...params } }).json();
}
