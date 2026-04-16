declare namespace API {
  namespace Economy {
    interface Paged<T> {
      total: number;
      items: T[];
    }

    interface Settings {
      isEnabled: boolean;
      currencyName: string;
      currencySymbol: string;
      defaultBalance: number;
      allowTransfer: boolean;
      minTransferAmount: number;
      transferTaxRate: number;
      dailyRewardAmount: number;
      leaderboardSize: number;
    }

    interface Account {
      id: number;
      createdAt: string;
      updatedAt: string;
      playerId: string;
      playerName: string;
      balance: number;
      isFrozen: boolean;
      lastTransactionAt: string | null;
      lastDailyClaimAt: string | null;
    }

    interface AccountDetail extends Account {}

    interface Transaction {
      id: number;
      createdAt: string;
      playerId: string;
      playerName: string;
      relatedPlayerId: string | null;
      relatedPlayerName: string | null;
      type: string;
      direction: string;
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      reason: string | null;
      source: string;
      referenceId: string | null;
      operatorType: string;
      operatorId: string | null;
      operatorName: string | null;
      occurredAt: string;
    }

    type AccountQueryOrder = 'CreatedAt' | 'PlayerId' | 'PlayerName' | 'Balance' | 'LastTransactionAt';

    interface AccountQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      playerId?: string;
      playerName?: string;
      isFrozen?: boolean;
      order?: AccountQueryOrder;
      desc?: boolean;
    }

    type TransactionQueryOrder = 'CreatedAt' | 'OccurredAt' | 'PlayerId' | 'PlayerName' | 'Amount' | 'Type';

    interface TransactionQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      playerId?: string;
      playerName?: string;
      type?: string;
      source?: string;
      startTime?: string;
      endTime?: string;
      order?: TransactionQueryOrder;
      desc?: boolean;
    }

    interface AdjustBalanceRequest {
      amount: number;
      reason?: string | null;
    }

    interface FreezeAccountRequest {
      isFrozen: boolean;
    }

    interface LeaderboardItem {
      playerId: string;
      playerName: string;
      balance: number;
      rank: number;
    }
  }
}