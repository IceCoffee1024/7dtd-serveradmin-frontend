import http from '~/utils/http';

/**
 * Loads online-reward feature settings.
 */
export function getSettings() {
  return http.get<API.OnlineReward.Settings>('OnlineReward/Settings').json();
}

/**
 * Persists online-reward feature settings.
 * @param settings - Updated settings payload.
 */
export function updateSettings(settings: API.OnlineReward.Settings) {
  return http.put('OnlineReward/Settings', { json: settings }).then(() => undefined);
}

/**
 * Resets online-reward feature settings to defaults and returns the restored payload.
 */
export function resetSettings() {
  return http.delete<API.OnlineReward.Settings>('OnlineReward/Settings').json();
}
