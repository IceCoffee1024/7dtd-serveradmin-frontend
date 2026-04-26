<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { getBackupRuns } from '~/api/backup';
import RunDetailDialog from '~/views/Scheduler/History/RunDetailDialog.vue';

defineOptions({ name: 'BackupRunsTable' });

type RunRow = API.Scheduler.Run;

const { t } = useI18n();

const tableRef = useTemplateRef('tableRef');
const detailDialogRef = useTemplateRef<{ show: () => void }>('detailDialogRef');
const currentRun = ref<RunRow | null>(null);

const taskTypeOptions = computed(() => [
  { label: t('views.backup.taskTypes.world'), value: 'WorldBackup' },
  { label: t('views.backup.taskTypes.database'), value: 'DatabaseBackup' },
  { label: t('views.backup.taskTypes.serverConfig'), value: 'ServerConfigBackup' },
]);
const triggerSourceOptions = computed(() => [
  { label: t('views.scheduler.triggerSources.cron'), value: 'Cron' },
  { label: t('views.scheduler.triggerSources.manual'), value: 'Manual' },
  { label: t('views.scheduler.triggerSources.system'), value: 'System' },
]);
const succeededOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const columns = computed<MyTableColumn<RunRow>[]>(() => [
  {
    prop: 'keyword',
    label: t('components.myTable.keywordSearch'),
    show: false,
    exportable: false,
    search: { el: 'el-input', props: { clearable: true } },
  },
  {
    prop: 'taskType',
    label: t('views.scheduler.history.filters.taskType'),
    slot: 'taskType',
    search: { el: 'el-select', props: { clearable: true }, options: taskTypeOptions, order: 1, span: 8 },
  },
  {
    prop: 'triggerSource',
    label: t('views.scheduler.history.filters.triggerSource'),
    slot: 'triggerSource',
    search: { el: 'el-select', props: { clearable: true }, options: triggerSourceOptions, order: 2, span: 8 },
  },
  {
    prop: 'succeeded',
    label: t('views.scheduler.history.filters.succeeded'),
    slot: 'succeeded',
    search: { el: 'el-select', props: { clearable: true }, options: succeededOptions, order: 3, span: 8 },
  },
  { prop: 'startedAt', label: t('views.scheduler.history.columns.startedAt'), slot: 'startedAt', sortable: true },
  { prop: 'endedAt', label: t('views.scheduler.history.columns.endedAt'), slot: 'endedAt', sortable: true },
  { prop: 'durationMs', label: t('views.scheduler.history.columns.durationMs'), slot: 'durationMs', sortable: true, className: 'text-center' },
  { prop: 'summary', label: t('views.scheduler.history.columns.summary'), slot: 'summary' },
  { prop: 'errorMessage', label: t('views.scheduler.history.columns.errorMessage'), slot: 'errorMessage' },
  { prop: 'operatorName', label: t('views.scheduler.history.columns.operatorName'), sortable: true },
  { prop: 'sourceIp', label: t('views.scheduler.history.columns.sourceIp'), sortable: true },
  { prop: 'actions', label: t('components.myTable.operation'), slot: 'actions', exportable: false, className: 'text-center' },
]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<RunRow>> {
  const response = await getBackupRuns({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: toOptionalString(params.search?.keyword),
    taskType: toOptionalString(params.search?.taskType),
    triggerSource: toOptionalString(params.search?.triggerSource),
    succeeded: typeof params.search?.succeeded === 'boolean' ? params.search.succeeded : undefined,
    order: toOrder(params.sortField),
    desc: params.sortOrder === 'descending',
  });
  return { list: response.items, total: response.total };
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function toOrder(sortField: string | undefined): API.Scheduler.RunQueryOrder | undefined {
  switch (sortField) {
    case 'startedAt': return 'StartedAt';
    case 'endedAt': return 'EndedAt';
    case 'taskType': return 'TaskType';
    case 'triggerSource': return 'TriggerSource';
    case 'succeeded': return 'Succeeded';
    default: return undefined;
  }
}

function resolveTaskTypeLabel(taskType: string): string {
  return taskTypeOptions.value.find(option => option.value === taskType)?.label || taskType;
}

function resolveTriggerSourceLabel(triggerSource: string): string {
  return triggerSourceOptions.value.find(option => option.value === triggerSource)?.label || triggerSource;
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function formatDuration(value: number | null | undefined): string {
  return value == null ? '--' : `${value} ms`;
}

function onView(row: RunRow) {
  currentRun.value = row;
  detailDialogRef.value?.show();
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <MyTable
      ref="tableRef"
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :show-index="true"
      :show-add-btn="false"
      :show-edit-btn="false"
      :show-delete-btn="false"
      :auto-column-width="true"
      :search-collapsible="true"
    >
      <template #taskType="{ row }">
        <span class="text-gray-900 font-medium dark:text-gray-100">{{ resolveTaskTypeLabel(row.taskType) }}</span>
      </template>
      <template #triggerSource="{ row }">
        <el-tag type="info">
          {{ resolveTriggerSourceLabel(row.triggerSource) }}
        </el-tag>
      </template>
      <template #succeeded="{ row }">
        <el-tag :type="row.succeeded ? 'success' : 'danger'">
          {{ row.succeeded ? t('common.yes') : t('common.no') }}
        </el-tag>
      </template>
      <template #startedAt="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatTimestamp(row.startedAt) }}</span>
      </template>
      <template #endedAt="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatTimestamp(row.endedAt) }}</span>
      </template>
      <template #durationMs="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatDuration(row.durationMs) }}</span>
      </template>
      <template #summary="{ row }">
        <span class="text-sm text-gray-800 line-clamp-2 dark:text-gray-100">{{ row.summary }}</span>
      </template>
      <template #errorMessage="{ row }">
        <span class="text-sm text-red-600 line-clamp-2 dark:text-red-400">{{ row.errorMessage || '--' }}</span>
      </template>
      <template #actions="{ row }">
        <IconButton button-size="small" icon-size="18" plain :tooltip-content="t('views.scheduler.history.actions.viewDetails')" @click="onView(row)">
          <icon-mdi-eye-outline />
        </IconButton>
      </template>
    </MyTable>

    <RunDetailDialog ref="detailDialogRef" :run-data="currentRun" />
  </div>
</template>
