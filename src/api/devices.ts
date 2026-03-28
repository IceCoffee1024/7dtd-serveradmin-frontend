import http from '~/utils/http';

/**
 * Fetches system metrics snapshot.
 */
export function getSystemMetricsSnapshot() {
  return http.get<API.Devices.SystemMetricsSnapshot>('Devices/SystemMetricsSnapshot').json();
}

/**
 * Fetches system platform information.
 */
export function getSystemPlatformInfo() {
  return http.get<API.Devices.SystemPlatformInfo>('Devices/SystemPlatformInfo').json();
}
