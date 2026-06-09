<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { BackupFileDto } from '~/generated/api/types.gen';
import type { BackupSubFeatureKind } from '~/queries/backup';
import { useMutation, useQueryCache } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';
import {
  backupDeleteDatabaseBackupFileMutation,
  backupDeleteServerConfigBackupFileMutation,
  backupDeleteWorldBackupFileMutation,
} from '~/generated/api/@pinia/colada.gen';
import {
  downloadBackupFile,
  fetchBackupFiles,
  invalidateBackupQueries,
} from '~/queries/backup';

defineOptions({ name: 'BackupFilesTable' });

const props = defineProps<Props>();

interface Props {
  /** Which backup sub-feature owns the listed files. */
  kind: BackupSubFeatureKind;
}

const { t } = useI18n();
const { confirm, toast } = usePopup();
const queryCache = useQueryCache();

const tableRef = useTemplateRef<{ reload: () => void }>('tableRef');
const isDownloading = ref(false);
const deleteWorldFileMutation = useMutation({
  ...backupDeleteWorldBackupFileMutation(),
  async onSettled() {
    await invalidateBackupQueries();
  },
});
const deleteDatabaseFileMutation = useMutation({
  ...backupDeleteDatabaseBackupFileMutation(),
  async onSettled() {
    await invalidateBackupQueries();
  },
});
const deleteServerConfigFileMutation = useMutation({
  ...backupDeleteServerConfigBackupFileMutation(),
  async onSettled() {
    await invalidateBackupQueries();
  },
});
const isDeleting = computed(() =>
  deleteWorldFileMutation.isLoading.value
  || deleteDatabaseFileMutation.isLoading.value
  || deleteServerConfigFileMutation.isLoading.value,
);

const columns = computed<MyTableColumn<BackupFileDto>[]>(() => [
  { prop: 'fileName', label: t('views.backup.files.columns.fileName'), slot: 'fileName' },
  { prop: 'sizeBytes', label: t('views.backup.files.columns.size'), slot: 'size', className: 'text-right' },
  { prop: 'createdAt', label: t('views.backup.files.columns.createdAt'), slot: 'createdAt' },
]);

async function fetchData(_: MyTableFetchParams): Promise<MyTableFetchResult<BackupFileDto>> {
  const items = await fetchBackupFiles(queryCache, props.kind);
  return { list: items, total: items.length };
}

/**
 * Formats a byte count into a human-readable string with binary units.
 * @param value - File size in bytes.
 */
function formatSize(value: number | null | undefined): string {
  if (value == null)
    return '--';
  if (value < 1024)
    return `${value} B`;
  if (value < 1024 * 1024)
    return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024)
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatTime(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

async function onDownload(row: BackupFileDto) {
  if (row.isDirectory) {
    toast({ type: 'info', text: t('views.backup.files.messages.directoryDownloadUnsupported') });
    return;
  }

  const fileName = row.fileName;
  if (!fileName) {
    return;
  }

  isDownloading.value = true;
  try {
    await downloadBackupFile(props.kind, fileName);
  }
  catch (error) {
    console.error(error);
    toast({ type: 'error', text: t('views.backup.files.messages.downloadError') });
  }
  finally {
    isDownloading.value = false;
  }
}

async function onDelete(row: BackupFileDto) {
  const fileName = row.fileName;
  if (!fileName) {
    return;
  }

  const ok = await confirm({
    text: t('views.backup.files.messages.confirmDelete', { name: fileName }),
    type: 'warning',
  });
  if (ok === false) {
    return;
  }

  try {
    await deleteBackupFile(props.kind, fileName);
    toast({ type: 'success', text: t('views.backup.files.messages.deleteSuccess') });
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
    toast({ type: 'error', text: t('views.backup.files.messages.deleteError') });
  }
}

async function deleteBackupFile(kind: BackupSubFeatureKind, fileName: string): Promise<void> {
  switch (kind) {
    case 'World':
      await deleteWorldFileMutation.mutateAsync({ path: { fileName } });
      break;
    case 'Database':
      await deleteDatabaseFileMutation.mutateAsync({ path: { fileName } });
      break;
    case 'ServerConfig':
      await deleteServerConfigFileMutation.mutateAsync({ path: { fileName } });
      break;
  }
}

function reload() {
  tableRef.value?.reload();
}

defineExpose({ reload });
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex flex-1 min-h-0">
      <MyTable
        ref="tableRef"
        row-key="fileName"
        :columns="columns"
        :fetch-data="fetchData"
        :show-index="true"
        :show-add-btn="false"
        :operation-column-width="140"
      >
        <template #fileName="{ row }">
          <span class="text-sm font-mono inline-flex gap-1 items-center">
            <el-icon v-if="row.isDirectory"><icon-mdi-folder-outline /></el-icon>
            <el-icon v-else><icon-mdi-file-outline /></el-icon>
            {{ row.fileName }}
          </span>
        </template>
        <template #size="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatSize(row.sizeBytes) }}</span>
        </template>
        <template #createdAt="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatTime(row.createdAt) }}</span>
        </template>
        <template #operation="{ row }">
          <IconButton
            button-size="small"
            icon-size="18"
            plain
            :disabled="row.isDirectory"
            :loading="isDownloading"
            :tooltip-content="t('views.backup.actions.download')"
            @click="onDownload(row)"
          >
            <icon-mdi-download />
          </IconButton>
          <IconButton
            button-size="small"
            icon-size="18"
            plain
            type="danger"
            :loading="isDeleting"
            :tooltip-content="t('views.backup.actions.delete')"
            @click="onDelete(row)"
          >
            <icon-mdi-delete-outline />
          </IconButton>
        </template>
      </MyTable>
    </div>
  </div>
</template>
