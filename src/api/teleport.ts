import http from '~/utils/http';

export function getSettings() {
  return http.get<API.Teleport.FeatureSettings>('Teleport/Settings').json();
}

export function updateSettings(settings: API.Teleport.FeatureSettings) {
  return http.put('Teleport/Settings', { json: settings }).then(() => undefined);
}

export function resetSettings() {
  return http.delete<API.Teleport.FeatureSettings>('Teleport/Settings').json();
}

export function getCities() {
  return http.get<API.Teleport.CityLocation[]>('Teleport/Cities').json();
}

export function createCity(data: API.Teleport.SaveCityLocation) {
  return http.post<API.Teleport.CityLocation>('Teleport/Cities', { json: data }).json();
}

export function updateCity(id: number, data: API.Teleport.SaveCityLocation) {
  return http.put(`Teleport/Cities/${id}`, { json: data }).then(() => undefined);
}

export function deleteCity(id: number) {
  return http.delete(`Teleport/Cities/${id}`).then(() => undefined);
}

export function getHomes(playerId: string) {
  return http.get<API.Teleport.HomeLocation[]>('Teleport/Homes', {
    searchParams: { playerId },
  }).json();
}

export function deleteHome(playerId: string, homeName: string) {
  return http.delete(
    `Teleport/Homes/${encodeURIComponent(playerId)}/${encodeURIComponent(homeName)}`,
  ).then(() => undefined);
}

/**
 * Queries paginated teleport audit logs with optional player and date-range filters.
 * @param params - Filtering and pagination criteria.
 * @returns Paged collection of teleport log records.
 */
export function getLogs(params: API.Teleport.TeleportLogQuery = {}) {
  return http.get<API.Teleport.Paged<API.Teleport.TeleportLog>>('Teleport/Logs', {
    searchParams: { ...params },
  }).json();
}
