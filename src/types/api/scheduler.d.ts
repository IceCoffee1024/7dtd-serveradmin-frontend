declare namespace API {
  namespace Scheduler {
    /** Paged response wrapper used by scheduler list endpoints. */
    interface Paged<T> {
      total: number;
      items: T[];
    }

    /** Global scheduler settings loaded from the feature configuration store. */
    interface Settings {
      isEnabled: boolean;
      defaultTimeZoneId: string | null;
      defaultAllowConcurrentExecution: boolean;
      maxParallelJobs: number;
      historyRetentionDays: number;
      notifyOnFailure: boolean;
    }

    /** Built-in scheduler task metadata returned to the task editor. */
    interface TaskTypeInfo {
      taskType: string;
      title: string;
      description: string;
      defaultConfigJson: string;
    }

    /** Sortable columns exposed by the scheduler task query endpoint. */
    type TaskQueryOrder = 'CreatedAt' | 'UpdatedAt' | 'Name' | 'TaskType' | 'IsEnabled' | 'CronExpression' | 'LastRunAt' | 'NextRunAt';

    /** Search and pagination payload for scheduler tasks. */
    interface TaskQuery {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      taskType?: string;
      isEnabled?: boolean;
      order?: TaskQueryOrder;
      desc?: boolean;
    }

    /** One persisted scheduler task row. */
    interface Task {
      id: number;
      createdAt: string;
      updatedAt: string;
      name: string;
      taskType: string;
      isEnabled: boolean;
      cronExpression: string;
      timeZoneId: string | null;
      allowConcurrentExecution: boolean;
      description: string | null;
      configJson: string;
      lastRunAt: string | null;
      nextRunAt: string | null;
      lastStatus: string | null;
      lastMessage: string | null;
      lastDurationMs: number | null;
    }

    /** Create/update payload for scheduler tasks. */
    interface TaskUpsert {
      name: string;
      taskType: string;
      isEnabled: boolean;
      cronExpression: string;
      timeZoneId?: string | null;
      allowConcurrentExecution: boolean;
      description?: string | null;
      configJson: string;
    }

    /** Sortable columns exposed by the scheduler run history endpoint. */
    type RunQueryOrder = 'CreatedAt' | 'TaskId' | 'TaskName' | 'TaskType' | 'TriggerSource' | 'StartedAt' | 'EndedAt' | 'Succeeded';

    /** Search and pagination payload for scheduler run history. */
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

    /** One persisted scheduler execution history row. */
    interface Run {
      id: number;
      taskId: number;
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

    /** Restart mode used by restart task configurations. */
    type RestartMode = 'Graceful' | 'Force';

    /** Reward action type used by reward task configurations. */
    type RewardActionType = 'ConsoleCommand' | 'BroadcastMessage';
  }
}
