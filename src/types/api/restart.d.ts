declare namespace API {
  namespace Restart {
    /** Restart feature settings exposed to the management UI. */
    interface Settings {
      isEnabled: boolean;
      cronExpression: string;
      timeZoneId: string | null;
      warningLeadSeconds: number;
      warningMessage: string;
      saveWorldBeforeRestart: boolean;
      restartMode: string;
      restartCommand: string | null;
      historyRetentionDays: number;
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
      durationMs: number | null;
    }
  }
}
