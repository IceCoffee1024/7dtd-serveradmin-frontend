import http from '~/utils/http';

/**
 * Loads shared chat settings used by command parsing and server-authored messages.
 */
export function getChatSettings() {
  return http.get<API.Chat.ChatSettings>('Chat/Settings').json();
}

/**
 * Persists shared chat settings.
 */
export function updateChatSettings(settings: API.Chat.ChatSettings) {
  return http.put('Chat/Settings', { json: settings }).then(() => undefined);
}

/**
 * Resets shared chat settings to the backend defaults and returns the restored payload.
 */
export function resetChatSettings() {
  return http.delete<API.Chat.ChatSettings>('Chat/Settings').json();
}

/**
 * Queries persisted chat history with filters, sorting, and pagination.
 */
export function getChatMessages(params: API.Chat.ChatMessageQuery) {
  return http.get<API.Chat.Paged<API.Chat.ChatMessage>>('ChatMessages', { searchParams: { ...params } }).json();
}

/**
 * Returns all mute records (including expired temporary ones) for the management UI.
 */
export function getMutes() {
  return http.get<API.Chat.MuteEntry[]>('Chat/Mutes').json();
}

/**
 * Creates or replaces the mute entry for the given player.
 * Pass a `null` mutedUntil to create a permanent mute.
 */
export function addMute(payload: API.Chat.MuteEntryUpsert) {
  return http.post('Chat/Mutes', { json: payload }).then(() => undefined);
}

/**
 * Removes mute records for the specified player IDs, effectively un-muting them.
 */
export function removeMutes(playerIds: string[]) {
  return http.delete('Chat/Mutes', { json: playerIds }).then(() => undefined);
}
