import http from '~/utils/http';

/**
 * Loads ColoredChat feature settings.
 */
export function getSettings() {
  return http.get<API.ColoredChat.Settings>('ColoredChat/Settings').json();
}

/**
 * Persists ColoredChat feature settings.
 */
export function updateSettings(settings: API.ColoredChat.Settings) {
  return http.put<unknown>('ColoredChat/Settings', { json: settings }).json();
}

/**
 * Resets ColoredChat settings to the backend defaults and returns the restored payload.
 */
export function resetSettings() {
  return http.delete<API.ColoredChat.Settings>('ColoredChat/Settings').json();
}

/**
 * Retrieves player-specific ColoredChat profiles with optional keyword search and pagination.
 */
export function getProfiles(params: API.ColoredChat.ProfileQuery = {}) {
  return http.get<API.ColoredChat.Paged<API.ColoredChat.Profile>>('ColoredChat/Profiles', { searchParams: { ...params } }).json();
}

/**
 * Creates a player-specific ColoredChat profile.
 */
export function createProfile(profile: API.ColoredChat.ProfileUpsert) {
  return http.post<API.ColoredChat.Profile>('ColoredChat/Profiles', { json: profile }).json();
}

/**
 * Updates a player-specific ColoredChat profile.
 */
export function updateProfile(profile: API.ColoredChat.ProfileUpsert) {
  return http.put<API.ColoredChat.Profile>('ColoredChat/Profiles', { json: profile }).json();
}

/**
 * Deletes player-specific ColoredChat profiles by player id.
 */
export function deleteProfiles(playerIds: string[]) {
  return http.delete<unknown>('ColoredChat/Profiles', { json: playerIds }).json();
}
