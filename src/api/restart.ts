import http from '~/utils/http';

/**
 * Loads restart feature settings including cron schedule and warning configuration.
 * @returns The restart settings payload.
 */
export function getSettings() {
  return http.get<API.Restart.Settings>('Restart/Settings').json();
}

/**
 * Persists restart feature settings and refreshes the cron registration immediately.
 * @param settings - Restart settings payload from the management UI.
 * @returns A void promise once the update has been accepted by the backend.
 */
export function updateSettings(settings: API.Restart.Settings) {
  return http.put('Restart/Settings', { json: settings }).then(() => undefined);
}

/**
 * Triggers an immediate server restart from the management UI.
 * The run is persisted to history regardless of outcome.
 * @param request - Optional reason and per-run overrides for warning lead time and restart mode.
 * @returns The persisted run record.
 */
export function runRestart(request: API.Restart.RunRequest = {}) {
  return http.post<API.Restart.Run>('Restart/Run', { json: request }).json();
}

/**
 * Queries paginated run history for restart tasks.
 * Reuses the ScheduledCommand run log endpoint filtered to the restart feature.
 * @param params - Optional pagination and filter parameters.
 * @returns Paged run history.
 */
export function getRestartRuns(params: API.ScheduledCommand.RunQuery = {}) {
  return http.get<API.ScheduledCommand.Paged<API.ScheduledCommand.Run>>('ScheduledTaskRunLogs', {
    searchParams: { ...params, featureKey: 'restart' },
  }).json();
}
