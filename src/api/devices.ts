import http from '~/utils/http';

/**
 * Fetches system metrics snapshot.
 * @returns {Promise} - A promise that resolves to the system metrics snapshot.
 */
export function getSystemMetricsSnapshot() {
  return http.get('/Devices/SystemMetricsSnapshot');
}

/**
 * Fetches system platform information.
 * @returns {Promise} - A promise that resolves to the system platform information.
 */
export function getSystemPlatformInfo() {
  return http.get('/Devices/SystemPlatformInfo');
}
