import http from '~/utils/http';

/**
 * Loads vote-kick feature settings.
 */
export function getSettings() {
  return http.get<API.VoteKick.Settings>('VoteKick/Settings').json();
}

/**
 * Persists vote-kick feature settings.
 */
export function updateSettings(settings: API.VoteKick.Settings) {
  return http.put('VoteKick/Settings', { json: settings }).then(() => undefined);
}

/**
 * Resets vote-kick feature settings to the backend defaults and returns the restored payload.
 */
export function resetSettings() {
  return http.delete<API.VoteKick.Settings>('VoteKick/Settings').json();
}
