declare namespace API {
  namespace GameServer {
    interface LegacyListResponse<T> {
      items?: T[];
      data?: T[];
      total?: number;
      [key: string]: unknown;
    }

    type ListResponse<T> = (T[] & { items?: T[]; data?: T[]; total?: number }) | LegacyListResponse<T>;

    interface Paged<T> {
      total: number;
      items: T[];
    }

    type CommandExecutionResult = string[];

    type ServerConfig = Record<string, string>;
    type ServerSettings = Record<string, string>;
    type LocalizationDict = Record<string, string>;

    interface AppSettings {
      webUrl?: string;
      userName?: string;
      password?: string;
      accessTokenExpireTime?: number;
      refreshTokenExpireTime?: number;
      serverConfigFile?: string;
    }

    interface Stats {
      uptime: number;
      gameTime: {
        days: number;
        hours: number;
        minutes: number;
      };
      animals: number;
      maxAnimals: number;
      zombies: number;
      maxZombies: number;
      entities: number;
      onlinePlayers: number;
      maxOnlinePlayers: number;
      historyPlayers: number;
      offlinePlayers: number;
      isBloodMoon: boolean;
      fps: number;
      heap: number;
      maxHeap: number;
      chunks: number;
      chunkGameObjects: number;
      items: number;
      chunkObservedEntities: number;
      residentSetSize: number;
      serverName: string;
      region: string;
      language: string;
      serverVersion: string;
      serverIp: string;
      serverPort: number;
      gameMode: string;
      gameWorld: string;
      gameName: string;
      gameDifficulty: number;
    }

    type OnlinePlayerQueryOrder
      = 'EntityId'
        | 'PlayerName'
        | 'Ping'
        | 'PermissionLevel'
        | 'ZombieKills'
        | 'PlayerKills'
        | 'Deaths'
        | 'Level'
        | 'ExpToNextLevel'
        | 'SkillPoints'
        | 'GameStage';

    type HistoryPlayerQueryOrder
      = 'EntityId'
        | 'PlayerName'
        | 'PermissionLevel'
        | 'IsOffline'
        | 'PlayGroup'
        | 'LastLogin';

    interface OnlinePlayerQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      order?: OnlinePlayerQueryOrder;
      desc?: boolean;
    }

    interface HistoryPlayerQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      order?: HistoryPlayerQueryOrder;
      desc?: boolean;
    }

    interface ListQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      order?: string;
      desc?: boolean;
    }

    interface Position {
      x: number;
      y: number;
      z: number;
    }

    interface PlayerBasicInfo {
      entityId: number;
      playerId: string;
      platformId: string;
      playerName: string;
      position: Position;
      ip: string | null;
      ping: number | null;
    }

    interface PlayerBasicInfo extends PlayerBasicInfo {}

    interface OnlinePlayer extends PlayerBasicInfo {
      permissionLevel: number;
      isAdmin: boolean;
      isTwitchEnabled: boolean;
      isTwitchSafe: boolean;
      zombieKills: number;
      playerKills: number;
      deaths: number;
      level: number;
      expToNextLevel: number;
      skillPoints: number;
      gameStage: number;
    }

    interface Backpack {
      entityId: number;
      position: Position;
      timestamp: number;
    }

    interface QuestPositionData {
      questCode: number;
      positionDataType: string;
      blockPosition: Position;
    }

    interface HistoryPlayer extends PlayerBasicInfo {
      permissionLevel: number;
      isAdmin: boolean;
      isOffline: boolean;
      playGroup: string;
      lastLogin: string;
      acl: string[] | null;
      landClaimBlocks: Position[] | null;
      backpacks: Backpack[] | null;
      bedroll: Position | null;
      questPositions: QuestPositionData[] | null;
      ownedVendingMachinePositions: Position[] | null;
    }

    interface PlayerStats {
      health: number;
      stamina: number;
      food: number;
      water: number;
    }

    interface OwnedEntity {
      id: number;
      classId: number;
      lastKnownPosition: Position;
      hasLastKnownPosition: boolean;
    }

    interface PlayerProfile {
      isMale: boolean;
      raceName: string;
      variantNumber: number;
      eyeColor: string;
      hairName: string;
      hairColor: string;
      mustacheName: string;
      chopsName: string;
      beardName: string;
      profileArchetype: string;
      entityClassName: string;
    }

    interface PlayerDetails extends HistoryPlayer {
      lastSpawnPosition: Position;
      score: number;
      stats: PlayerStats | null;
      isLandProtectionActive: boolean;
      distanceWalked: number;
      totalItemsCrafted: number;
      longestLife: number;
      currentLife: number;
      totalTimePlayed: number;
      rentedVMPosition: Position;
      rentalEndTime: number;
      rentalEndDay: number;
      spawnPoints: Position[];
      alreadyCraftedList: string[];
      unlockedRecipeList: string[];
      favoriteRecipeList: string[];
      ownedEntities: OwnedEntity[];
      playerProfile: PlayerProfile | null;
    }

    interface InvItem {
      itemName: string;
      iconName: string;
      iconColor?: string;
      localizationName: string;
      count: number;
      maxStackAllowed: number;
      quality?: number;
      qualityColor?: string;
      useTimes: number;
      maxUseTimes: number;
      isMod: boolean;
      isBlock: boolean;
      parts?: InvItem[];
    }

    interface Inventory {
      bag: InvItem[];
      belt: InvItem[];
      equipment: (InvItem | null)[];
    }

    interface PlayerSkill {
      name?: string;
      localizationName?: string;
      localizationDesc?: string;
      localizationLongDesc?: string;
      level: number;
      minLevel: number;
      maxLevel: number;
      costForNextLevel: number;
      iconName?: string;
      type?: string;
      children: PlayerSkill[] | null;
    }

    interface AllowedCommand {
      commands: string[];
      description: string;
      help: string;
      permissionLevel: number;
    }

    interface GlobalMessage {
      message: string;
      senderName?: string | null;
    }

    interface PrivateMessage extends GlobalMessage {
      targetPlayerIdOrName: string;
    }

    interface AdminUser {
      [key: string]: unknown;
      playerId: string;
      permissionLevel: number;
      displayName: string;
    }

    interface CommandPermissionCreate {
      command: string;
      permissionLevel: number;
    }

    interface CommandPermission extends CommandPermissionCreate {
      [key: string]: unknown;
      description: string | null;
    }

    interface BanEntry {
      [key: string]: unknown;
      bannedUntil: string;
      displayName: string | null;
      playerId: string;
      reason: string | null;
    }

    interface WhitelistEntry {
      [key: string]: unknown;
      displayName: string | null;
      playerId: string;
    }

    type Language
      = 'File'
        | 'Type'
        | 'UsedInMainMenu'
        | 'NoTranslate'
        | 'English'
        | 'ContextAlternateText'
        | 'German'
        | 'Spanish'
        | 'French'
        | 'Italian'
        | 'Japanese'
        | 'Koreana'
        | 'Polish'
        | 'Brazilian'
        | 'Russian'
        | 'Turkish'
        | 'Schinese'
        | 'Tchinese';

    interface MapInfo {
      blockSize: number;
      maxZoom: number;
      chunkSize: number;
      regionSize: number;
      worldSize: number;
    }

    type EntityType = 'OfflinePlayer' | 'OnlinePlayer' | 'Zombie' | 'Animal' | 'Bandit' | 'Hostiles';

    interface EntityBasicInfo {
      entityId: number;
      entityName: string;
      position: Position;
      entityType: EntityType;
      playerId?: string;
    }

    interface ClaimOwner extends PlayerBasicInfo {
      claimActive: boolean;
      lastLogin: string;
      claimPositions: Position[];
    }

    interface LandClaims {
      claimOwners: ClaimOwner[];
      claimSize: number;
    }

    interface ModInfo {
      [key: string]: unknown;
      name?: string;
      displayName?: string;
      description?: string;
      author?: string;
      website?: string;
      version?: string;
      isLoaded: boolean;
      isUninstalled: boolean;
      folderName: string;
    }

    type RespawnType = 'NewGame' | 'LoadedGame' | 'Died' | 'Teleport' | 'EnterMultiplayer' | 'JoinMultiplayer' | 'Unknown';
  }
}
