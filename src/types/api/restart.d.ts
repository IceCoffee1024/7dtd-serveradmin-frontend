declare namespace API {
  namespace Restart {
    /** A single countdown stage that broadcasts a warning at a specific lead time before restart. */
    interface WarningStage {
      leadSeconds: number;
      message: string;
    }

    /** Restart feature settings exposed to the management UI. */
    interface Settings {
      isEnabled: boolean;
      cronExpression: string;
      timeZoneId: string | null;
      warningLeadSeconds: number;
      warningMessage: string;
      warningStages: WarningStage[] | null;
      saveWorldBeforeRestart: boolean;
      restartMode: string;
      restartCommand: string | null;
      deferScheduledRestartDuringBloodMoonWindow: boolean;
      bloodMoonPreDuskProtectionHours: number;
      bloodMoonDeferMinutes: number;
      historyRetentionDays: number;
      /** UTC timestamp of the next scheduled restart run; null when scheduling is disabled. */
      nextRunAt: string | null;
    }

    /** Response from the cancel-pending-restart endpoint. */
    interface CancelRestartResponse {
      succeeded: boolean;
      message: string;
    }

    /** Request model for manually triggering an immediate restart. */
    interface RunRequest {
      reason?: string | null;
      warningLeadSecondsOverride?: number | null;
      restartModeOverride?: string | null;
    }

    /** One restart run result row returned by the manual run endpoint. */
    interface Run {
      id: number;
      createdAt: string;
      featureKey: string;
      taskId: number | null;
      taskName: string;
      taskType: string;
      triggerSource: string;
      operatorId: string | null;
      operatorName: string | null;
      sourceIp: string | null;
      startedAt: string;
      endedAt: string | null;
      succeeded: boolean;
      summary: string;
      errorMessage: string | null;
      detailsJson: string | null;
      durationMs: number | null;
    }
  }
}
