declare namespace API {
  namespace GameServer {
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

    interface PlayerBasicInfoDto {
      entityId: number;
      playerId: string;
      platformId: string;
      playerName: string;
      position: {
        x: number;
        y: number;
        z: number;
      };
      ip?: string;
      ping?: number;
    }

    type RespawnType = 'NewGame' | 'LoadedGame' | 'Died' | 'Teleport' | 'EnterMultiplayer' | 'JoinMultiplayer' | 'Unknown';
  }
}
