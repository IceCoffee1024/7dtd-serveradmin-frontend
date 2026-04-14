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
  return http.put<unknown>('Chat/Settings', { json: settings }).json();
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
