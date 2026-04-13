import http from '~/utils/http';

/**
 * Loads shared chat settings used by command parsing and server-authored messages.
 */
export function getCommonChatSettings() {
  return http.get<API.Chat.CommonChatSettings>('Chat/CommonSettings').json();
}

/**
 * Persists shared chat settings.
 */
export function updateCommonChatSettings(settings: API.Chat.CommonChatSettings) {
  return http.put<unknown>('Chat/CommonSettings', { json: settings }).json();
}

/**
 * Loads ColoredChat feature settings.
 */
export function getColoredChatSettings() {
  return http.get<API.Chat.ColoredChatSettings>('Chat/ColoredSettings').json();
}

/**
 * Persists ColoredChat feature settings.
 */
export function updateColoredChatSettings(settings: API.Chat.ColoredChatSettings) {
  return http.put<unknown>('Chat/ColoredSettings', { json: settings }).json();
}

/**
 * Retrieves all player-specific ColoredChat profiles.
 */
export function getColoredChatProfiles() {
  return http.get<API.Chat.ColoredChatProfile[]>('Chat/ColoredProfiles').json();
}

/**
 * Creates a player-specific ColoredChat profile.
 */
export function createColoredChatProfile(profile: API.Chat.ColoredChatProfileUpsert) {
  return http.post<API.Chat.ColoredChatProfile>('Chat/ColoredProfiles', { json: profile }).json();
}

/**
 * Updates a player-specific ColoredChat profile.
 */
export function updateColoredChatProfile(profile: API.Chat.ColoredChatProfileUpsert) {
  return http.put<API.Chat.ColoredChatProfile>('Chat/ColoredProfiles', { json: profile }).json();
}

/**
 * Deletes player-specific ColoredChat profiles by player id.
 */
export function deleteColoredChatProfiles(playerIds: string[]) {
  return http.delete<unknown>('Chat/ColoredProfiles', { json: playerIds }).json();
}
