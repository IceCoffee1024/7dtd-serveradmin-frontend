declare namespace API {
  namespace Chat {
    interface Paged<T> {
      total: number;
      items: T[];
    }

    interface ChatSettings {
      globalServerName: string | null;
      whisperServerName: string | null;
      chatCommandPrefixes: string[];
      allowNoPrefix: boolean;
      chatCommandSeparators: string[];
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
  }
}
