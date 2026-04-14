import http from '~/utils/http';

/**
 * Fetches host CPU time counters.
 */
export function getCpuTimes() {
  return http.get<API.Devices.CpuTimes | null>('Devices/CpuTimes').json();
}

/**
 * Fetches host memory usage information.
 */
export function getMemoryInfo() {
  return http.get<API.Devices.MemoryInfo | null>('Devices/MemoryInfo').json();
}

/**
 * Fetches storage device information.
 */
export function getDiskInfos() {
  return http.get<API.Devices.DiskInfo[]>('Devices/DiskInfos').json();
}

/**
 * Fetches network interface information.
 */
export function getNetworkInfos() {
  return http.get<API.Devices.NetworkInfo[]>('Devices/NetworkInfos').json();
}

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
