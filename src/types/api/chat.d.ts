declare namespace API {
  namespace Chat {
    interface Paged<T> {
      total: number;
      items: T[];
    }

    interface ChatSettings {
      globalServerName: string | null;
      whisperServerName: string | null;
      chatCommandPrefixes: string[] | null;
      allowNoPrefix: boolean;
      chatCommandSeparators: string[] | null;
      historyRetentionDays: number;
      excludeCommandsFromHistory: boolean;
      muteNotifyMessage: string | null;
    }

    interface ChatMessage {
      id: number;
      createdAt: string;
      entityId: number;
      playerId: string | null;
      chatType: string;
      senderName: string;
      message: string;
    }

    type ChatMessageQueryOrder = 'CreatedAt' | 'EntityId' | 'PlayerId' | 'ChatType' | 'SenderName';

    interface ChatMessageQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      playerId?: string;
      senderName?: string;
      chatType?: string;
      startTime?: string;
      endTime?: string;
      order?: ChatMessageQueryOrder;
      desc?: boolean;
    }

    interface MuteEntry {
      id: number;
      createdAt: string;
      playerId: string;
      playerName: string;
      mutedUntil: string | null;
      reason: string | null;
    }

    interface MuteEntryUpsert {
      playerId: string;
      playerName: string;
      mutedUntil: string | null;
      reason: string | null;
    }
  }
}
