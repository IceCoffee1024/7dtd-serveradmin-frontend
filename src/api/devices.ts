import http from '~/utils/http';

/**
 * Fetches system metrics snapshot.
 * @returns {Promise<API.Devices.SystemMetricsSnapshot>} - A promise that resolves to the system metrics snapshot.
 */
export function getSystemMetricsSnapshot() {
  return http.get<API.Devices.SystemMetricsSnapshot>('/Devices/SystemMetricsSnapshot');
}

/**
 * Fetches system platform information.
 * @returns {Promise<API.Devices.SystemPlatformInfo>} - A promise that resolves to the system platform information.
 */
export function getSystemPlatformInfo() {
  return http.get<API.Devices.SystemPlatformInfo>('/Devices/SystemPlatformInfo');
}
