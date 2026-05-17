declare namespace API {
  namespace GameEventLog {
    /** A single game event record persisted by the server-side event pipeline. */
    interface Log {
      id: number;
      createdAt: string;
      eventType: string;
      playerId: string | null;
      playerName: string | null;
      targetPlayerId: string | null;
      targetPlayerName: string | null;
      entityType: string | null;
      details: string | null;
    }

    /** Query parameters for the paginated game event log endpoint. */
    interface Query {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      eventType?: string;
      startTime?: string;
      endTime?: string;
      order?: 'CreatedAt' | 'EventType' | 'PlayerName';
      desc?: boolean;
    }

    /** Generic paged result wrapper used by the game event log API. */
    interface Paged<T> {
      total: number;
      items: T[];
    }
  }
}
