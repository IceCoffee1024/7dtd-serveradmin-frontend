declare namespace API {
  namespace AuditLog {
    interface Paged<T> {
      total: number;
      items: T[];
    }

    type Source = 'Api' | 'ChatCommand' | 'ConsoleCommand' | 'Scheduler' | 'System' | 'GameEvent';

    type ActionType =
      | 'Create'
      | 'Update'
      | 'Delete'
      | 'Enable'
      | 'Disable'
      | 'Execute'
      | 'Send'
      | 'Kick'
      | 'Ban'
      | 'Unban'
      | 'Restart'
      | 'Reload'
      | 'Import'
      | 'Export'
      | 'Grant'
      | 'Revoke'
      | 'Reset'
      | 'Other';

    type QueryOrder =
      | 'CreatedAt'
      | 'Source'
      | 'OperatorId'
      | 'OperatorName'
      | 'ActionType'
      | 'ResourceType'
      | 'ResourceId'
      | 'Succeeded';

    interface Item {
      id: number;
      createdAt: string;
      source: Source;
      operatorId: string | null;
      operatorName: string | null;
      sourceIp: string | null;
      actionType: ActionType;
      resourceType: string | null;
      resourceId: string | null;
      summary: string;
      details: string | null;
      succeeded: boolean;
      errorMessage: string | null;
    }

    interface Query {
      pageNumber?: number;
      pageSize?: number;
      keyword?: string;
      startTime?: string;
      endTime?: string;
      source?: Source;
      operatorId?: string;
      actionType?: ActionType;
      resourceType?: string;
      resourceId?: string;
      succeeded?: boolean;
      order?: QueryOrder;
      desc?: boolean;
    }
  }
}