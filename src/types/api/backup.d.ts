declare namespace API {
  namespace Backup {
    /** Cron-driven world snapshot configuration shared between settings GET/PUT and runtime registration. */
    interface WorldBackupConfig {
      isEnabled: boolean;
      cronExpression: string;
      destinationRoot: string;
      compressToZip: boolean;
      retentionCount: number;
      saveWorldBeforeBackup: boolean;
    }

    /** Cron-driven SQLite hot-backup configuration. */
    interface DatabaseBackupConfig {
      isEnabled: boolean;
      cronExpression: string;
      destinationRoot: string;
      compressToZip: boolean;
      retentionCount: number;
    }

    /** Cron-driven server config XML backup configuration. */
    interface ServerConfigBackupConfig {
      isEnabled: boolean;
      cronExpression: string;
      destinationRoot: string;
      compressToZip: boolean;
      retentionCount: number;
    }

    /** Root backup feature settings persisted in the feature configuration store. */
    interface Settings {
      isEnabled: boolean;
      historyRetentionDays: number;
      timeZoneId: string | null;
      worldBackup: WorldBackupConfig;
      databaseBackup: DatabaseBackupConfig;
      serverConfigBackup: ServerConfigBackupConfig;
    }

    /** Manual backup execution payload submitted from the management UI. */
    interface RunRequest {
      reason?: string | null;
    }

    /** Bare metadata for one persisted backup output (file or folder) under a sub-feature destination root. */
    interface BackupFile {
      fileName: string;
      sizeBytes: number;
      createdAt: string;
      isDirectory: boolean;
    }

    /** Discriminator used by frontend helpers to route file actions to the matching sub-feature endpoints. */
    type SubFeatureKind = 'World' | 'Database' | 'ServerConfig';
  }
}
