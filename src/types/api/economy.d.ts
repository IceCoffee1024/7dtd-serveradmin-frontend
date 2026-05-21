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
      zombieKillRewardEnabled: boolean;
      zombieKillRewardAmount: number;
      dailyStreakEnabled: boolean;
      dailyStreakBonusPercent: number;
      dailyStreakMaxDays: number;
      shopEnabled: boolean;
      balCommandName: string;
      balCommandAliases: string[];
      payCommandName: string;
      dailyCommandName: string;
      moneyTopCommandName: string;
      moneyTopCommandAliases: string[];
      shopCommandName: string;
      buyCommandName: string;
      redeemCommandName: string;
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
      dailyStreak: number;
      longestStreak: number;
    }

    interface AccountDetail extends Account {}

    interface Transaction {
      id: number;
      createdAt: string;
      playerId: string;
      playerName: string;
      relatedPlayerId: string | null;
      relatedPlayerName: string | null;
      type: TransactionType;
      direction: TransactionDirection;
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

    type TransactionType = 'AdminGrant' | 'AdminDeduct' | 'TransferOut' | 'TransferIn' | 'DailyReward';
    type TransactionDirection = 'Income' | 'Expense';

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
      type?: TransactionType;
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

    // ─── Shop ──────────────────────────────────────────────────────────────────

    interface ShopItem {
      id: number;
      name: string;
      description: string | null;
      itemName: string;
      itemCount: number;
      price: number;
      isEnabled: boolean;
      displayOrder: number;
      stockLimit: number;
      soldCount: number;
      createdAt: string;
      updatedAt: string;
    }

    type ShopItemQueryOrder = 'DisplayOrder' | 'Price' | 'Name' | 'CreatedAt';

    interface ShopItemQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      isEnabled?: boolean;
      order?: ShopItemQueryOrder;
      desc?: boolean;
    }

    interface UpsertShopItemRequest {
      name: string;
      description?: string | null;
      itemName: string;
      itemCount: number;
      price: number;
      isEnabled: boolean;
      displayOrder: number;
      stockLimit: number;
    }

    // ─── Redeem Codes ──────────────────────────────────────────────────────────

    interface RedeemCode {
      id: number;
      code: string;
      description: string | null;
      amount: number;
      maxUses: number;
      usedCount: number;
      expiresAt: string | null;
      isEnabled: boolean;
      createdAt: string;
      commandRewards: string[] | null;
    }

    type RedeemCodeQueryOrder = 'CreatedAt' | 'ExpiresAt' | 'Code';

    interface RedeemCodeQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      isEnabled?: boolean;
      order?: RedeemCodeQueryOrder;
      desc?: boolean;
    }

    interface CreateRedeemCodeRequest {
      code: string;
      description?: string | null;
      amount: number;
      maxUses: number;
      expiresAt?: string | null;
      commandRewards?: string[] | null;
    }

    interface CodeRedemption {
      id: number;
      redeemedAt: string;
      codeId: number;
      playerId: string;
      playerName: string;
    }

    // ─── Batch Adjust ──────────────────────────────────────────────────────────

    interface BatchAdjustRequest {
      amount: number;
      reason?: string | null;
      scope: 'AllOnline' | 'AllAccounts';
    }

    interface BatchAdjustResult {
      succeeded: number;
      failed: string[];
    }
  }
}