import type { useQueryCache } from '@pinia/colada';
import type { BackupFileDto } from '~/generated/api/types.gen';
import {
  backupGetDatabaseBackupFilesQuery,
  backupGetServerConfigBackupFilesQuery,
  backupGetWorldBackupFilesQuery,
} from '~/generated/api/@pinia/colada.gen';
import {
  backupDownloadDatabaseBackupFile,
  backupDownloadServerConfigBackupFile,
  backupDownloadWorldBackupFile,
} from '~/generated/api/sdk.gen';
import { invalidateGeneratedQueries } from './generated';

type QueryCache = ReturnType<typeof useQueryCache>;

export type BackupSubFeatureKind = 'World' | 'Database' | 'ServerConfig';

export async function invalidateBackupQueries() {
  await invalidateGeneratedQueries('Backup');
}

export async function fetchBackupFiles(queryCache: QueryCache, kind: BackupSubFeatureKind): Promise<BackupFileDto[]> {
  const queryOptions = kind === 'World'
    ? backupGetWorldBackupFilesQuery()
    : kind === 'Database'
      ? backupGetDatabaseBackupFilesQuery()
      : backupGetServerConfigBackupFilesQuery();

  const entry = queryCache.ensure(queryOptions);
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  return state.data ?? [];
}

export async function downloadBackupFile(kind: BackupSubFeatureKind, fileName: string): Promise<void> {
  const result = kind === 'World'
    ? await backupDownloadWorldBackupFile({ path: { fileName }, parseAs: 'blob', throwOnError: true })
    : kind === 'Database'
      ? await backupDownloadDatabaseBackupFile({ path: { fileName }, parseAs: 'blob', throwOnError: true })
      : await backupDownloadServerConfigBackupFile({ path: { fileName }, parseAs: 'blob', throwOnError: true });

  saveBlob(result.data, fileName);
}

function saveBlob(data: unknown, fileName: string): void {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart]);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
