import http from '~/utils/http';

/**
 * Queries the paginated game event log with optional keyword, event type, and date-range filters.
 * @param params - Filtering, sorting, and pagination criteria.
 * @returns Paged collection of game event records.
 */
export function getGameEventLogs(params: API.GameEventLog.Query = {}) {
  return http.get<API.GameEventLog.Paged<API.GameEventLog.Log>>('GameEventLogs', {
    searchParams: { ...params },
  }).json();
}
