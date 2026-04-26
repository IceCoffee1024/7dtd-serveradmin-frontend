<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { deleteBackupFile, downloadBackupFile, listBackupFiles } from '~/api/backup';
import { usePopup } from '~/composables';

defineOptions({ name: 'BackupFilesTable' });

const props = defineProps<Props>();

interface Props {
  /** Which backup sub-feature owns the listed files. */
  kind: API.Backup.SubFeatureKind;
}

const { t } = useI18n();
const { confirm, toast } = usePopup();

const tableRef = useTemplateRef<{ reload: () => void }>('tableRef');
const isDownloading = ref(false);
const isDeleting = ref(false);

const columns = computed<MyTableColumn<API.Backup.BackupFile>[]>(() => [
  { prop: 'fileName', label: t('views.backup.files.columns.fileName'), slot: 'fileName' },
  { prop: 'sizeBytes', label: t('views.backup.files.columns.size'), slot: 'size', className: 'text-right', width: 140 },
  { prop: 'createdAt', label: t('views.backup.files.columns.createdAt'), slot: 'createdAt', width: 200 },
  { prop: 'actions', label: t('components.myTable.operation'), slot: 'actions', className: 'text-center', exportable: false, width: 140 },
]);

async function fetchData(_: MyTableFetchParams): Promise<MyTableFetchResult<API.Backup.BackupFile>> {
  const items = await listBackupFiles(props.kind);
  return { list: items, total: items.length };
}

/**
 * Formats a byte count into a human-readable string with binary units.
 * @param value - File size in bytes.
 */
function formatSize(value: number): string {
  if (value < 1024)
    return `${value} B`;
  if (value < 1024 * 1024)
    return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024)
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

async function onDownload(row: API.Backup.BackupFile) {
  if (row.isDirectory) {
    toast({ type: 'info', text: t('views.backup.files.messages.directoryDownloadUnsupported') });
    return;
  }

  isDownloading.value = true;
  try {
    await downloadBackupFile(props.kind, row.fileName);
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isDownloading.value = false;
  }
}

async function onDelete(row: API.Backup.BackupFile) {
  const ok = await confirm({
    text: t('views.backup.files.messages.confirmDelete', { name: row.fileName }),
    type: 'warning',
  });
  if (ok === false) {
    return;
  }

  isDeleting.value = true;
  try {
    await deleteBackupFile(props.kind, row.fileName);
    toast({ type: 'success', text: t('views.backup.files.messages.deleteSuccess') });
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isDeleting.value = false;
  }
}

function reload() {
  tableRef.value?.reload();
}

defineExpose({ reload });
</script>

<template>
  <MyTable
    ref="tableRef"
    row-key="fileName"
    :columns="columns"
    :fetch-data="fetchData"
    :show-index="true"
    :show-add-btn="false"
    :show-edit-btn="false"
    :show-delete-btn="false"
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
    <template #actions="{ row }">
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
</template>
