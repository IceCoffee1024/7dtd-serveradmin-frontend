import http from '~/utils/http';

/**
 * Queries audit log records with filters, sorting, and pagination.
 */
export function getAuditLogs(params: API.AuditLog.Query) {
  return http.get<API.AuditLog.Paged<API.AuditLog.Item>>('AuditLogs', { searchParams: { ...params } }).json();
}