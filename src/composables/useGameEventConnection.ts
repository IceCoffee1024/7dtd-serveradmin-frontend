import type { EventSourceController } from 'event-source-plus';
import type { ChatMessagePayload, LogCallbackPayload, WelcomeEventPayload } from '~/plugins/mitt';
import { createSharedComposable } from '@vueuse/core';
import { EventSourcePlus } from 'event-source-plus';
import emitter, { EVENT_TYPES } from '~/plugins/mitt';
import { useGameEventStore } from '~/stores/gameEvent';
import { useUserInfoStore } from '~/stores/userInfo';

function parseSsePayload(rawData: string): unknown {
  try {
    return JSON.parse(rawData);
  }
  catch {
    return {};
  }
}

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

/**
 * Composable facade for the shared SSE connection controller.
 *
 * The returned methods are singleton-backed and safe to call from App startup,
 * login success handlers, or logout handlers without creating duplicate sockets.
 *
 * @returns Shared start/stop/dispose actions for the realtime connection.
 */
export const useGameEventConnection = createSharedComposable(() => {
  interface SseMessage {
    event: string;
    data: string;
  }

  let eventSource: EventSourcePlus | null = null;
  let controller: EventSourceController | null = null;
  let listenersRegistered = false;
  const gameEventStore = useGameEventStore();

  const handleWelcome = (data: WelcomeEventPayload) => {
    void gameEventStore.addLog(data.message ?? '', 'Assert');
  };

  const handleLogCallback = (data: LogCallbackPayload) => {
    const payload = data ?? {};
    void gameEventStore.addLog(payload.message ?? '', payload.logType ?? 'Info');
  };

  const handleChatMessage = (data: ChatMessagePayload) => {
    const payload = data ?? {};
    void gameEventStore.addChatMessage(payload.message ?? '', payload.timestamp ?? '', payload.senderName ?? 'Unknown');
  };

  function registerListeners(): void {
    if (listenersRegistered) {
      return;
    }

    emitter.on(EVENT_TYPES.GAME.WELCOME, handleWelcome);
    emitter.on(EVENT_TYPES.GAME.LOG_CALLBACK, handleLogCallback);
    emitter.on(EVENT_TYPES.GAME.CHAT_MESSAGE, handleChatMessage);

    listenersRegistered = true;
  }

  function unregisterListeners(): void {
    if (!listenersRegistered) {
      return;
    }

    emitter.off(EVENT_TYPES.GAME.WELCOME, handleWelcome);
    emitter.off(EVENT_TYPES.GAME.LOG_CALLBACK, handleLogCallback);
    emitter.off(EVENT_TYPES.GAME.CHAT_MESSAGE, handleChatMessage);

    listenersRegistered = false;
  }

  function ensureController(): EventSourceController {
    if (!controller) {
      const userInfoStore = useUserInfoStore();

      eventSource = new EventSourcePlus('/api/sse', {
        headers: async (): Promise<Record<string, string>> => {
          const token = await userInfoStore.getAccessToken();
          return {
            Authorization: `Bearer ${token}`,
          };
        },
      });

      controller = eventSource.listen({
        onMessage(message: SseMessage) {
          const payload = parseSsePayload(message.data);
          dispatchSseEvent(message.event, payload);
        },
      });
    }

    return controller;
  }

  return {
    start: () => {
      registerListeners();
      ensureController().reconnect();
    },
    stop: () => {
      controller?.abort();
    },
    dispose: () => {
      controller?.abort();
      controller = null;
      eventSource = null;
      unregisterListeners();
      gameEventStore.reset();
    },
  };
});
