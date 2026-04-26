import http from '~/utils/http';

/**
 * Loads the current backup feature settings. The database connection string is masked by the backend
 * to keep the secret out of management-UI traffic.
 * @returns The backup settings payload.
 */
export function getSettings() {
  return http.get<API.Backup.Settings>('Backup/Settings').json();
}

/**
 * Persists backup feature settings.
 * @param settings - Backup settings payload from the management UI.
 */
export function updateSettings(settings: API.Backup.Settings) {
  return http.put('Backup/Settings', { json: settings }).then(() => undefined);
}

/**
 * Resets backup settings to backend defaults.
 * @returns The restored backup settings payload.
 */
export function resetSettings() {
  return http.delete<API.Backup.Settings>('Backup/Settings').json();
}

/**
 * Triggers an immediate world backup outside the cron schedule.
 * @param request - Optional reason and overrides from the management UI.
 * @returns The persisted backup run record.
 */
export function runWorldBackup(request: API.Backup.RunRequest = {}) {
  return http.post<API.Scheduler.Run>('Backup/World/Run', { json: request }).json();
}

/**
 * Triggers an immediate database backup outside the cron schedule.
 */
export function runDatabaseBackup(request: API.Backup.RunRequest = {}) {
  return http.post<API.Scheduler.Run>('Backup/Database/Run', { json: request }).json();
}

/**
 * Triggers an immediate server config backup outside the cron schedule.
 */
export function runServerConfigBackup(request: API.Backup.RunRequest = {}) {
  return http.post<API.Scheduler.Run>('Backup/ServerConfig/Run', { json: request }).json();
}

const KIND_TO_SEGMENT: Record<API.Backup.SubFeatureKind, string> = {
  World: 'World',
  Database: 'Database',
  ServerConfig: 'ServerConfig',
};

/**
 * Lists persisted backup outputs (files or folders) for one sub-feature destination root.
 * @param kind - Which backup sub-feature to list.
 */
export function listBackupFiles(kind: API.Backup.SubFeatureKind) {
  return http.get<API.Backup.BackupFile[]>(`Backup/${KIND_TO_SEGMENT[kind]}/Files`).json();
}

/**
 * Deletes one persisted backup output by its bare file name.
 * @param kind - Which backup sub-feature owns the file.
 * @param fileName - The bare file name (no path separators).
 */
export function deleteBackupFile(kind: API.Backup.SubFeatureKind, fileName: string) {
  return http.delete(`Backup/${KIND_TO_SEGMENT[kind]}/Files/${encodeURIComponent(fileName)}`).then(() => undefined);
}

/**
 * Downloads one backup file as a Blob and triggers a browser save-as via a temporary anchor element.
 * Uses the authenticated http client so the bearer token is attached automatically.
 * @param kind - Which backup sub-feature owns the file.
 * @param fileName - The bare file name (no path separators).
 */
export async function downloadBackupFile(kind: API.Backup.SubFeatureKind, fileName: string) {
  const blob = await http.get(`Backup/${KIND_TO_SEGMENT[kind]}/Files/${encodeURIComponent(fileName)}/Download`).blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Loads paged backup run history, scoped to the backup feature via ScheduledTaskRunLogs.
 * @param params - Filtering and paging payload.
 */
export function getBackupRuns(params: API.Scheduler.RunQuery = {}) {
  return http.get<API.Scheduler.Paged<API.Scheduler.Run>>('ScheduledTaskRunLogs', { searchParams: { ...params, featureKey: 'backup' } }).json();
}
