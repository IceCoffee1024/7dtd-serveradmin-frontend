import http from '~/utils/http';

/**
 * Loads vote-restart feature settings.
 */
export function getSettings() {
  return http.get<API.VoteRestart.Settings>('VoteRestart/Settings').json();
}

/**
 * Persists vote-restart feature settings.
 */
export function updateSettings(settings: API.VoteRestart.Settings) {
  return http.put('VoteRestart/Settings', { json: settings }).then(() => undefined);
}

/**
 * Resets vote-restart feature settings to the backend defaults and returns the restored payload.
 */
export function resetSettings() {
  return http.delete<API.VoteRestart.Settings>('VoteRestart/Settings').json();
}
