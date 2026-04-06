import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a single server log entry shown in the console page.
 */
export interface ServerLogEntry {
  id: string;
  message: string;
  logType: string;
}

/**
 * Represents a single chat message shown in the game chat page.
 */
export interface ChatMessage {
  id: string;
  senderName: string;
  message: string;
  timestamp: string;
}

const MAX_RECORD_COUNT = 2000;

/**
 * Shared realtime game output state.
 *
 * The store only owns buffered UI state and mutation helpers. Connection setup,
 * teardown, and reconnection belong to the dedicated SSE composable.
 */
export const useGameEventStore = defineStore('gameEvent', () => {
  const logs = ref<ServerLogEntry[]>([]);
  const chatMessages = ref<ChatMessage[]>([]);

  /**
   * Appends a server log entry and trims the buffer to a bounded size.
   * @param message - Log message text received from the backend.
   * @param logType - Log category used by the UI color mapping.
   * @returns Promise that resolves after the buffer trimming completes.
   */
  const addLog = async (message: string, logType: string): Promise<void> => {
    logs.value.push({ id: uuidv4(), message, logType });

    if (logs.value.length > MAX_RECORD_COUNT) {
      await nextTick(() => logs.value.shift());
    }
  };

  /**
   * Appends a chat message and trims the buffer to a bounded size.
   * @param message - Chat message text.
   * @param timestamp - Server timestamp for the message.
   * @param senderName - Sender display name.
   * @returns Promise that resolves after the buffer trimming completes.
   */
  const addChatMessage = async (message: string, timestamp: string, senderName: string): Promise<void> => {
    chatMessages.value.push({
      id: uuidv4(),
      message,
      timestamp,
      senderName,
    });

    if (chatMessages.value.length > MAX_RECORD_COUNT) {
      await nextTick(() => chatMessages.value.shift());
    }
  };

  /**
   * Clears the buffered log messages.
   * @returns Nothing.
   */
  const clearLogs = () => {
    logs.value = [];
  };

  /**
   * Clears the buffered chat messages.
   * @returns Nothing.
   */
  const clearChatMessages = () => {
    chatMessages.value = [];
  };

  /**
   * Resets all shared realtime game output.
   * @returns Nothing.
   */
  const reset = () => {
    clearLogs();
    clearChatMessages();
  };

  return {
    logs,
    chatMessages,
    addLog,
    addChatMessage,
    clearLogs,
    clearChatMessages,
    reset,
  };
});