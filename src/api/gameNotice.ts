import http from '~/utils/http';

export function getSettings() {
  return http.get<API.GameNotice.Settings>('GameNotice/Settings').json();
}

export function updateSettings(settings: API.GameNotice.Settings) {
  return http.put('GameNotice/Settings', { json: settings }).then(() => undefined);
}

export function resetSettings() {
  return http.delete<API.GameNotice.Settings>('GameNotice/Settings').json();
}
