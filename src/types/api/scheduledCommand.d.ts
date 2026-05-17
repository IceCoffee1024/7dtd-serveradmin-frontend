declare namespace API {
  namespace ScheduledCommand {
    /** Paged response wrapper used by scheduled command list endpoints. */
    interface Paged<T> {
      total: number;
      items: T[];
    }

    /** Global scheduled command settings loaded from the feature configuration store. */
    interface Settings {
      isEnabled: boolean;
      defaultTimeZoneId: string | null;
      defaultAllowConcurrentExecution: boolean;
      historyRetentionDays: number;
    }

    /** Built-in task type metadata returned to the task editor. */
    interface TaskTypeInfo {
      taskType: string;
      title: string;
      description: string;
    }

    /** Sortable columns exposed by the scheduled command query endpoint. */
    type TaskQueryOrder = 'CreatedAt' | 'UpdatedAt' | 'Name' | 'IsEnabled' | 'CronExpression' | 'LastRunAt';

    /** Search and pagination payload for scheduled commands. */
    interface TaskQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      isEnabled?: boolean;
      order?: TaskQueryOrder;
      desc?: boolean;
    }

    /** One persisted scheduled command row. */
    interface Task {
      id: number;
      createdAt: string;
      updatedAt: string;
      name: string;
      isEnabled: boolean;
      cronExpression: string;
      timeZoneId: string | null;
      commands: string[];
      executeOnMainThread: boolean;
      requireGameStartDone: boolean;
      captureOutput: boolean;
      allowConcurrentExecution: boolean;
      description: string | null;
      lastRunAt: string | null;
      nextRunAt: string | null;
      lastStatus: string | null;
      lastMessage: string | null;
      lastDurationMs: number | null;
    }

    /** Create/update payload for scheduled commands. */
    interface TaskUpsert {
      name: string;
      isEnabled: boolean;
      cronExpression: string;
      timeZoneId?: string | null;
      commands: string[];
      executeOnMainThread: boolean;
      requireGameStartDone: boolean;
      captureOutput: boolean;
      allowConcurrentExecution: boolean;
      description?: string | null;
    }

    /** Sortable columns exposed by the run history endpoint. */
    type RunQueryOrder = 'CreatedAt' | 'FeatureKey' | 'TaskName' | 'TaskType' | 'TriggerSource' | 'StartedAt' | 'EndedAt' | 'Succeeded';

    /** Search and pagination payload for run history. */
    interface RunQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      taskId?: number;
      taskType?: string;
      triggerSource?: string;
      succeeded?: boolean;
      startTime?: string;
      endTime?: string;
      order?: RunQueryOrder;
      desc?: boolean;
    }

    /** One persisted execution history row. */
    interface Run {
      id: number;
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

    /** Manual execution payload submitted by the management UI. */
    interface RunRequest {
      reason?: string | null;
    }

    /** Shared result labels used by the task history and status badges. */
    type RunStatus = 'Success' | 'Failed' | 'Skipped' | 'Running';

    /** Logical trigger source recorded with each run. */
    type TriggerSource = 'Cron' | 'Manual' | 'System';
  }
}
