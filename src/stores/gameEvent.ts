import type { ChatMessagePayload, LogCallbackPayload, WelcomeEventPayload } from '~/plugins/mitt';
import { computedAsync } from '@vueuse/core';
import { EventSourcePlus } from 'event-source-plus';
import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import emitter, { EVENT_TYPES } from '~/plugins/mitt';
import { useUserInfoStore } from '~/stores/userInfo';

/**
 * Represents a single server log entry.
 */
export interface ServerLogEntry {
  id: string;
  message: string;
  logType: string;
}

/**
 * Represents a single chat message received from the game server.
 */
export interface ChatMessage {
  id: string;
  senderName: string;
  message: string;
  timestamp: string;
}

interface SseMessage {
  event: string;
  data: string;
}

const MAX_RECORD_COUNT = 2000;

/**
 * Safely parses raw SSE JSON payload.
 * @param rawData - String payload from SSE message.
 * @returns Parsed payload object or empty object when parsing fails.
 */
function parseSsePayload(rawData: string): unknown {
  try {
    return JSON.parse(rawData);
  }
  catch {
    return {};
  }
}

/**
 * Dispatches a typed game event from SSE event name and parsed payload.
 * @param event - Event name from SSE message.
 * @param payload - Parsed payload object.
 */
function dispatchSseEvent(event: string, payload: unknown): void {
  switch (event) {
    case 'Welcome':
      emitter.emit(EVENT_TYPES.GAME.WELCOME, (payload as WelcomeEventPayload) ?? {});
      break;
    case 'LogCallback':
      emitter.emit(EVENT_TYPES.GAME.LOG_CALLBACK, (payload as LogCallbackPayload) ?? {});
      break;
    case 'ChatMessage':
      emitter.emit(EVENT_TYPES.GAME.CHAT_MESSAGE, (payload as ChatMessagePayload) ?? {});
      break;
    default:
      break;
  }
}

export const useGameEventStore = defineStore('gameEvent', () => {
  const logs = ref<ServerLogEntry[]>([]);
  const chatMessages = ref<ChatMessage[]>([]);
  const userInfoStore = useUserInfoStore();

  /**
   * Adds a server log and keeps the list size within MAX_RECORD_COUNT.
   * @param message - The log message text.
   * @param logType - The log category from backend.
   * @returns Promise that resolves when optional trimming completes.
   */
  const addLog = async (message: string, logType: string): Promise<void> => {
    logs.value.push({ id: uuidv4(), message, logType });

    if (logs.value.length > MAX_RECORD_COUNT) {
      await nextTick(() => logs.value.shift());
    }
  };

  /**
   * Adds a chat message and keeps the list size within MAX_RECORD_COUNT.
   * @param message - Chat message text.
   * @param timestamp - Server event timestamp.
   * @param senderName - Sender display name.
   * @returns Promise that resolves when optional trimming completes.
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

  const eventSource = new EventSourcePlus('/api/sse', {
    headers: async (): Promise<Record<string, string>> => {
      const token = await userInfoStore.getAccessToken();
      return {
        Authorization: `Bearer ${token}`,
      };
    },
  });

  /**
   * Handles welcome event by writing it to log stream.
   * @param data - Welcome payload from SSE bridge event.
   * @returns Promise that resolves after log append.
   */
  const onWelcomeMessage = async (data: WelcomeEventPayload): Promise<void> => {
    await addLog(data.message ?? '', 'Assert');
  };

  const controller = eventSource.listen({
    onMessage(message: SseMessage) {
      const payload = parseSsePayload(message.data);
      dispatchSseEvent(message.event, payload);
    },
  });

  emitter.on(EVENT_TYPES.GAME.WELCOME, (data) => {
    void onWelcomeMessage(data ?? {});
  });

  emitter.on(EVENT_TYPES.GAME.LOG_CALLBACK, (data) => {
    const payload = data ?? {};
    void addLog(payload.message ?? '', payload.logType ?? 'Info');
  });

  emitter.on(EVENT_TYPES.GAME.CHAT_MESSAGE, (data) => {
    const payload = data ?? {};
    void addChatMessage(payload.message ?? '', payload.timestamp ?? '', payload.senderName ?? 'Unknown');
  });

  const isLoggedIn = computedAsync(async () => await userInfoStore.isLoggedIn(), false);

  watch(isLoggedIn, (val) => {
    if (val) {
      controller.reconnect();
    }
    else {
      controller.abort();
    }
  }, { immediate: true });

  return {
    logs,
    chatMessages,
    addLog,
    addChatMessage,
  };
});
