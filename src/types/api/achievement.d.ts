declare namespace API {
  namespace Achievement {
    interface Settings {
      isEnabled: boolean;
    }

    interface DefinitionDto {
      id: number;
      createdAt: string;
      updatedAt: string;
      name: string;
      description: string | null;
      isEnabled: boolean;
      triggerType: string;
      threshold: number;
      economyReward: number;
      consoleCommands: string | null;
      playerMessage: string | null;
      broadcastMessage: string | null;
      sortOrder: number;
    }

    interface DefinitionUpsertDto {
      name: string;
      description: string | null;
      isEnabled: boolean;
      triggerType: string;
      threshold: number;
      economyReward: number;
      consoleCommands: string | null;
      playerMessage: string | null;
      broadcastMessage: string | null;
      sortOrder: number;
    }

    interface DefinitionQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      isEnabled?: boolean;
      triggerType?: string;
      order?: string;
      desc?: boolean;
    }

    interface RecordDto {
      id: number;
      createdAt: string;
      achievementId: number;
      achievementName: string;
      playerId: string;
      playerName: string;
      economyRewarded: number;
    }

    interface RecordQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      playerId?: string;
      achievementId?: number;
      startTime?: string;
      endTime?: string;
      order?: string;
      desc?: boolean;
    }

    interface PagedResult<T> {
      total: number;
      items: T[];
    }
  }
}
