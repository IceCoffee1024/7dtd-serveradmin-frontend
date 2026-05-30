import { invalidateGeneratedQueries } from './generated';

export async function invalidateScheduledCommandQueries() {
  await invalidateGeneratedQueries('ScheduledCommands');
}

export async function invalidateScheduledCommandAndRunLogQueries() {
  await invalidateGeneratedQueries(['ScheduledCommands', 'ScheduledTaskRunLogs']);
}
