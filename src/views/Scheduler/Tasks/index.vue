<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { deleteTask, getSettings, getTasks, getTaskTypes, runTask } from '~/api/scheduler';
import { usePopup } from '~/composables';
import TaskEditorDialog from './TaskEditorDialog.vue';

defineOptions({ name: 'SchedulerTasksPage' });

type TaskRow = API.Scheduler.Task;

const { t } = useI18n();
const { confirm, toast } = usePopup();

const tableRef = useTemplateRef('tableRef');
const taskDialogRef = useTemplateRef('taskDialogRef');
const currentTask = ref<TaskRow | null>(null);
const taskTypes = ref<API.Scheduler.TaskTypeInfo[]>([]);
const schedulerSettings = ref<API.Scheduler.Settings | null>(null);

const taskTypeOptions = computed(() => taskTypes.value.map(item => ({ label: item.title, value: item.taskType })));
const enabledOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const columns = computed<MyTableColumn<TaskRow>[]>(() => [
  {
    prop: 'keyword',
    label: t('components.myTable.keywordSearch'),
    show: false,
    exportable: false,
    search: {
      el: 'el-input',
      props: { clearable: true },
    },
  },
  {
    prop: 'taskType',
    label: t('views.scheduler.tasks.filters.taskType'),
    slot: 'taskType',
    search: {
      el: 'el-select',
      props: { clearable: true },
      options: taskTypeOptions,
      order: 1,
      span: 8,
    },
  },
  {
    prop: 'isEnabled',
    label: t('views.scheduler.tasks.filters.isEnabled'),
    slot: 'isEnabled',
    search: {
      el: 'el-select',
      props: { clearable: true },
      options: enabledOptions,
      order: 2,
      span: 8,
    },
  },
  { prop: 'name', label: t('views.scheduler.tasks.columns.name'), sortable: true },
  { prop: 'cronExpression', label: t('views.scheduler.tasks.columns.cronExpression'), slot: 'cronExpression', sortable: true },
  { prop: 'timeZoneId', label: t('views.scheduler.tasks.columns.timeZoneId'), slot: 'timeZoneId' },
  { prop: 'allowConcurrentExecution', label: t('views.scheduler.tasks.columns.allowConcurrentExecution'), slot: 'allowConcurrentExecution', className: 'text-center' },
  { prop: 'lastRunAt', label: t('views.scheduler.tasks.columns.lastRunAt'), slot: 'lastRunAt', sortable: true },
  { prop: 'nextRunAt', label: t('views.scheduler.tasks.columns.nextRunAt'), slot: 'nextRunAt', sortable: true },
  { prop: 'lastStatus', label: t('views.scheduler.tasks.columns.lastStatus'), slot: 'lastStatus' },
  { prop: 'updatedAt', label: t('views.scheduler.tasks.columns.updatedAt'), slot: 'updatedAt', sortable: true },
  { prop: 'actions', label: t('components.myTable.operation'), slot: 'actions', exportable: false, className: 'text-center' },
]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<TaskRow>> {
  const response = await getTasks({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: toOptionalString(params.search?.keyword),
    taskType: toOptionalString(params.search?.taskType),
    isEnabled: typeof params.search?.isEnabled === 'boolean' ? params.search.isEnabled : undefined,
    order: toOrder(params.sortField),
    desc: params.sortOrder === 'descending',
  });

  return {
    list: response.items,
    total: response.total,
  };
}

async function loadMeta() {
  try {
    const [types, settings] = await Promise.all([getTaskTypes(), getSettings()]);
    taskTypes.value = types;
    schedulerSettings.value = settings;
  }
  catch (error) {
    console.error(error);
    taskTypes.value = [];
    schedulerSettings.value = null;
  }
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

function toOrder(sortField: string | undefined): API.Scheduler.TaskQueryOrder | undefined {
  switch (sortField) {
    case 'name':
      return 'Name';
    case 'taskType':
      return 'TaskType';
    case 'isEnabled':
      return 'IsEnabled';
    case 'cronExpression':
      return 'CronExpression';
    case 'lastRunAt':
      return 'LastRunAt';
    case 'nextRunAt':
      return 'NextRunAt';
    case 'updatedAt':
      return 'UpdatedAt';
    default:
      return undefined;
  }
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function formatDuration(value: number | null | undefined): string {
  return value == null ? '--' : `${value} ms`;
}

function resolveTaskTypeLabel(taskType: string): string {
  return taskTypes.value.find(item => item.taskType === taskType)?.title || taskType;
}

function resolveStatusType(status: string | null | undefined): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'Success':
      return 'success';
    case 'Failed':
      return 'danger';
    case 'Skipped':
      return 'info';
    case 'Running':
      return 'warning';
    default:
      return 'info';
  }
}

function onAdd() {
  currentTask.value = null;
  taskDialogRef.value?.show();
}

function onEdit(row: TaskRow) {
  currentTask.value = row;
  taskDialogRef.value?.show();
}

async function onRun(row: TaskRow) {
  const confirmed = await confirm({
    text: t('views.scheduler.tasks.messages.runConfirm', { name: row.name }),
    type: 'warning',
  });

  if (!confirmed) {
    return;
  }

  try {
    const run = await runTask(row.id);
    toast({
      type: 'success',
      title: t('views.scheduler.tasks.actions.run'),
      text: run.summary,
    });
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
  }
}

async function onDelete(row: TaskRow) {
  const confirmed = await confirm({
    text: t('common.confirmDelete'),
    type: 'warning',
  });

  if (!confirmed) {
    return;
  }

  try {
    await deleteTask(row.id);
    toast({
      type: 'success',
      title: t('views.scheduler.tasks.actions.delete'),
      text: t('views.scheduler.tasks.messages.deleteSuccess'),
    });
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
  }
}

function onSaved() {
  tableRef.value?.reload();
  currentTask.value = null;
}

onMounted(() => {
  loadMeta();
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <el-alert
      :title="t('views.scheduler.tasks.hints.defaultSettings', { timeZone: schedulerSettings?.defaultTimeZoneId || 'UTC', parallel: schedulerSettings?.maxParallelJobs ?? 1 })"
      type="info"
      show-icon
      :closable="false"
    />

    <MyTable
      ref="tableRef"
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :show-index="true"
      :auto-column-width="true"
      :search-collapsible="true"
      :show-edit-btn="false"
      :show-delete-btn="false"
      @add="onAdd"
    >
      <template #taskType="{ row }">
        <span class="text-gray-900 font-medium dark:text-gray-100">{{ resolveTaskTypeLabel(row.taskType) }}</span>
      </template>

      <template #isEnabled="{ row }">
        <el-tag :type="row.isEnabled ? 'success' : 'info'">
          {{ row.isEnabled ? t('common.yes') : t('common.no') }}
        </el-tag>
      </template>

      <template #cronExpression="{ row }">
        <span class="text-sm text-gray-700 font-mono dark:text-gray-200">{{ row.cronExpression }}</span>
      </template>

      <template #timeZoneId="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-200">{{ row.timeZoneId || 'UTC' }}</span>
      </template>

      <template #allowConcurrentExecution="{ row }">
        <el-tag :type="row.allowConcurrentExecution ? 'warning' : 'info'">
          {{ row.allowConcurrentExecution ? t('common.yes') : t('common.no') }}
        </el-tag>
      </template>

      <template #lastRunAt="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatTimestamp(row.lastRunAt) }}</span>
      </template>

      <template #nextRunAt="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatTimestamp(row.nextRunAt) }}</span>
      </template>

      <template #lastStatus="{ row }">
        <el-tag :type="resolveStatusType(row.lastStatus)">
          {{ row.lastStatus || t('common.unknown') }}
        </el-tag>
      </template>

      <template #updatedAt="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatTimestamp(row.updatedAt) }}</span>
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1.5 justify-center">
          <IconButton button-size="small" icon-size="18" plain :tooltip-content="t('views.scheduler.tasks.actions.run')" @click="onRun(row)">
            <icon-mdi-play-circle-outline />
          </IconButton>
          <IconButton button-size="small" icon-size="18" plain :tooltip-content="t('components.myTable.edit')" @click="onEdit(row)">
            <icon-mdi-pencil />
          </IconButton>
          <IconButton button-size="small" icon-size="18" plain :tooltip-content="t('views.scheduler.tasks.actions.delete')" @click="onDelete(row)">
            <icon-mdi-delete-outline />
          </IconButton>
        </div>
      </template>
    </MyTable>

    <TaskEditorDialog
      ref="taskDialogRef"
      :edit-data="currentTask"
      :task-types="taskTypes"
      :default-time-zone-id="schedulerSettings?.defaultTimeZoneId"
      :default-allow-concurrent-execution="schedulerSettings?.defaultAllowConcurrentExecution ?? false"
      @saved="onSaved"
    />
  </div>
</template>
