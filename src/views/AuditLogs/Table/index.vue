<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { getAuditLogs } from '~/api/auditLog';
import DetailDialog from './DetailDialog.vue';

defineOptions({ name: 'AuditLogTable' });

type AuditLogRow = API.AuditLog.Item;

const { t } = useI18n();
const detailDialogRef = useTemplateRef('detailDialogRef');
const currentDetailLog = ref<AuditLogRow | null>(null);

const sourceOptions = computed(() => [
  { label: t('views.auditLogs.sources.api'), value: 'Api' },
  { label: t('views.auditLogs.sources.chatCommand'), value: 'ChatCommand' },
  { label: t('views.auditLogs.sources.consoleCommand'), value: 'ConsoleCommand' },
  { label: t('views.auditLogs.sources.scheduler'), value: 'Scheduler' },
  { label: t('views.auditLogs.sources.system'), value: 'System' },
  { label: t('views.auditLogs.sources.gameEvent'), value: 'GameEvent' },
]);

const actionTypeOptions = computed(() => [
  { label: t('views.auditLogs.actionTypes.create'), value: 'Create' },
  { label: t('views.auditLogs.actionTypes.update'), value: 'Update' },
  { label: t('views.auditLogs.actionTypes.delete'), value: 'Delete' },
  { label: t('views.auditLogs.actionTypes.enable'), value: 'Enable' },
  { label: t('views.auditLogs.actionTypes.disable'), value: 'Disable' },
  { label: t('views.auditLogs.actionTypes.execute'), value: 'Execute' },
  { label: t('views.auditLogs.actionTypes.send'), value: 'Send' },
  { label: t('views.auditLogs.actionTypes.kick'), value: 'Kick' },
  { label: t('views.auditLogs.actionTypes.ban'), value: 'Ban' },
  { label: t('views.auditLogs.actionTypes.unban'), value: 'Unban' },
  { label: t('views.auditLogs.actionTypes.restart'), value: 'Restart' },
  { label: t('views.auditLogs.actionTypes.reload'), value: 'Reload' },
  { label: t('views.auditLogs.actionTypes.grant'), value: 'Grant' },
  { label: t('views.auditLogs.actionTypes.revoke'), value: 'Revoke' },
  { label: t('views.auditLogs.actionTypes.import'), value: 'Import' },
  { label: t('views.auditLogs.actionTypes.export'), value: 'Export' },
  { label: t('views.auditLogs.actionTypes.reset'), value: 'Reset' },
  { label: t('views.auditLogs.actionTypes.other'), value: 'Other' },
]);

const succeededOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const columns = computed<MyTableColumn<AuditLogRow>[]>(() => [
  {
    prop: 'keyword',
    label: t('components.myTable.keywordSearch'),
    isShow: false,
    exportable: false,
    search: {
      el: 'input',
      props: { clearable: true },
      order: 0,
    },
  },
  {
    prop: 'timeRange',
    label: t('views.auditLogs.filters.timeRange'),
    isShow: false,
    exportable: false,
    search: {
      el: 'date-picker',
      props: {
        clearable: true,
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
        startPlaceholder: t('views.auditLogs.placeholders.timeRange'),
        endPlaceholder: t('views.auditLogs.placeholders.timeRange'),
      },
      order: 1,
      span: 12,
      transform: (value: string[] | undefined) => ({
        startTime: value?.[0],
        endTime: value?.[1],
      }),
    },
  },
  {
    prop: 'source',
    label: t('views.auditLogs.filters.source'),
    sortable: true,
    enum: sourceOptions,
    search: {
      el: 'select',
      props: {
        clearable: true,
        placeholder: t('views.auditLogs.placeholders.allSources'),
      },
      order: 2,
    },
  },
  {
    prop: 'operatorId',
    label: t('views.auditLogs.filters.operatorId'),
    sortable: true,
    search: {
      el: 'input',
      props: { clearable: true },
      order: 3,
    },
  },
  {
    prop: 'actionType',
    label: t('views.auditLogs.filters.actionType'),
    sortable: true,
    enum: actionTypeOptions,
    search: {
      el: 'select',
      props: {
        clearable: true,
        placeholder: t('views.auditLogs.placeholders.allActionTypes'),
      },
      order: 4,
    },
  },
  {
    prop: 'resourceType',
    label: t('views.auditLogs.filters.resourceType'),
    sortable: true,
    search: {
      el: 'input',
      props: { clearable: true },
      order: 5,
    },
  },
  {
    prop: 'resourceId',
    label: t('views.auditLogs.filters.resourceId'),
    sortable: true,
    search: {
      el: 'input',
      props: { clearable: true },
      order: 6,
    },
  },
  {
    prop: 'succeeded',
    label: t('views.auditLogs.filters.succeeded'),
    sortable: true,
    enum: succeededOptions,
    search: {
      el: 'select',
      props: {
        clearable: true,
        placeholder: t('views.auditLogs.placeholders.allResults'),
      },
      order: 7,
    },
  },
  {
    prop: 'createdAt',
    label: t('views.auditLogs.columns.createdAt'),
    slot: 'createdAt',
    sortable: true,
    width: 180,
  },
  {
    prop: 'source',
    label: t('views.auditLogs.columns.source'),
    slot: 'source',
    sortable: true,
    width: 130,
  },
  {
    prop: 'operatorId',
    label: t('views.auditLogs.columns.operatorId'),
    slot: 'operatorId',
    sortable: true,
    minWidth: 180,
  },
  {
    prop: 'operatorName',
    label: t('views.auditLogs.columns.operatorName'),
    sortable: true,
    minWidth: 160,
  },
  {
    prop: 'actionType',
    label: t('views.auditLogs.columns.actionType'),
    slot: 'actionType',
    sortable: true,
    width: 130,
  },
  {
    prop: 'resourceType',
    label: t('views.auditLogs.columns.resourceType'),
    sortable: true,
    minWidth: 150,
  },
  {
    prop: 'resourceId',
    label: t('views.auditLogs.columns.resourceId'),
    slot: 'resourceId',
    sortable: true,
    minWidth: 180,
  },
  {
    prop: 'summary',
    label: t('views.auditLogs.columns.summary'),
    slot: 'summary',
    minWidth: 260,
  },
  {
    prop: 'succeeded',
    label: t('views.auditLogs.columns.succeeded'),
    slot: 'succeeded',
    sortable: true,
    width: 110,
  },
  {
    prop: 'errorMessage',
    label: t('views.auditLogs.columns.errorMessage'),
    slot: 'errorMessage',
    minWidth: 260,
  },
]);

/**
 * Loads paged audit logs and adapts the backend contract to MyTable.
 * @param params - Table paging, sorting, and transformed search parameters.
 * @returns Table-friendly paged data.
 */
async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<AuditLogRow>> {
  const query: API.AuditLog.Query = {
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: toOptionalString(params.search?.keyword),
    startTime: toOptionalString(params.search?.startTime),
    endTime: toOptionalString(params.search?.endTime),
    source: toOptionalSource(params.search?.source),
    operatorId: toOptionalString(params.search?.operatorId),
    actionType: toOptionalActionType(params.search?.actionType),
    resourceType: toOptionalString(params.search?.resourceType),
    resourceId: toOptionalString(params.search?.resourceId),
    succeeded: toOptionalBoolean(params.search?.succeeded),
    order: toOrder(params.sortField),
    desc: params.sortOrder === 'descending',
  };

  const response = await getAuditLogs(query);
  return {
    total: response.total,
    list: response.items,
  };
}

/**
 * Converts a table sort field into the backend enum string expected by the audit API.
 * @param sortField - Raw sort field emitted by Element Plus.
 * @returns Backend order value or undefined when remote sorting is unavailable.
 */
function toOrder(sortField: string | undefined): API.AuditLog.QueryOrder | undefined {
  switch (sortField) {
    case 'createdAt':
      return 'CreatedAt';
    case 'source':
      return 'Source';
    case 'operatorId':
      return 'OperatorId';
    case 'operatorName':
      return 'OperatorName';
    case 'actionType':
      return 'ActionType';
    case 'resourceType':
      return 'ResourceType';
    case 'resourceId':
      return 'ResourceId';
    case 'succeeded':
      return 'Succeeded';
    default:
      return undefined;
  }
}

/**
 * Normalizes a search field into an optional string accepted by the backend query model.
 * @param value - Raw search value.
 * @returns Trimmed string or undefined when the value is empty.
 */
function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

/**
 * Narrows a search value to an audit source enum.
 * @param value - Raw search value.
 * @returns Source enum or undefined.
 */
function toOptionalSource(value: unknown): API.AuditLog.Source | undefined {
  switch (value) {
    case 'Api':
    case 'ChatCommand':
    case 'ConsoleCommand':
    case 'Scheduler':
    case 'GameEvent':
    case 'System':
      return value as API.AuditLog.Source;
    default:
      return undefined;
  }
}

/**
 * Narrows a search value to an audit action type enum.
 * @param value - Raw search value.
 * @returns Action type enum or undefined.
 */
function toOptionalActionType(value: unknown): API.AuditLog.ActionType | undefined {
  switch (value) {
    case 'Create':
    case 'Update':
    case 'Delete':
    case 'Enable':
    case 'Disable':
    case 'Execute':
    case 'Send':
    case 'Kick':
    case 'Ban':
    case 'Unban':
    case 'Restart':
    case 'Reload':
    case 'Grant':
    case 'Revoke':
    case 'Import':
    case 'Export':
    case 'Reset':
    case 'Other':
      return value;
    default:
      return undefined;
  }
}

/**
 * Converts a select value into an optional boolean filter.
 * @param value - Raw search value.
 * @returns Boolean filter or undefined.
 */
function toOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * Maps backend audit source codes to localized labels.
 * @param source - Backend source enum value.
 * @returns Localized source label.
 */
function getSourceLabel(source: string): string {
  switch (source) {
    case 'Api':
      return t('views.auditLogs.sources.api');
    case 'ChatCommand':
      return t('views.auditLogs.sources.chatCommand');
    case 'ConsoleCommand':
      return t('views.auditLogs.sources.consoleCommand');
    case 'Scheduler':
      return t('views.auditLogs.sources.scheduler');
    case 'System':
      return t('views.auditLogs.sources.system');
    case 'GameEvent':
      return t('views.auditLogs.sources.gameEvent');
    default:
      return source;
  }
}

/**
 * Maps backend action type codes to localized labels.
 * @param actionType - Backend action type enum value.
 * @returns Localized action type label.
 */
function getActionTypeLabel(actionType: string): string {
  switch (actionType) {
    case 'Create':
      return t('views.auditLogs.actionTypes.create');
    case 'Update':
      return t('views.auditLogs.actionTypes.update');
    case 'Delete':
      return t('views.auditLogs.actionTypes.delete');
    case 'Enable':
      return t('views.auditLogs.actionTypes.enable');
    case 'Disable':
      return t('views.auditLogs.actionTypes.disable');
    case 'Execute':
      return t('views.auditLogs.actionTypes.execute');
    case 'Send':
      return t('views.auditLogs.actionTypes.send');
    case 'Kick':
      return t('views.auditLogs.actionTypes.kick');
    case 'Ban':
      return t('views.auditLogs.actionTypes.ban');
    case 'Unban':
      return t('views.auditLogs.actionTypes.unban');
    case 'Restart':
      return t('views.auditLogs.actionTypes.restart');
    case 'Reload':
      return t('views.auditLogs.actionTypes.reload');
    case 'Import':
      return t('views.auditLogs.actionTypes.import');
    case 'Export':
      return t('views.auditLogs.actionTypes.export');
    case 'Grant':
      return t('views.auditLogs.actionTypes.grant');
    case 'Revoke':
      return t('views.auditLogs.actionTypes.revoke');
    case 'Reset':
      return t('views.auditLogs.actionTypes.reset');
    case 'Other':
      return t('views.auditLogs.actionTypes.other');
    default:
      return actionType;
  }
}

/**
 * Formats UTC timestamps into a compact local representation for audit review.
 * @param value - Backend ISO timestamp.
 * @returns Formatted local timestamp.
 */
function formatTimestamp(value: string): string {
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Opens the detail dialog for a selected audit row.
 * @param row - Audit row selected from the table.
 */
function onView(row: AuditLogRow) {
  currentDetailLog.value = row;
  detailDialogRef.value?.show();
}
</script>

<template>
  <div class="h-[calc(100vh-196px)]">
    <MyTable
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :is-selectable="false"
      :is-show-add-btn="false"
      :is-show-edit-btn="false"
      :is-show-delete-btn="false"
      :show-operation-column="false"
      :auto-column-width="true"
    >
      <template #createdAt="{ row }">
        <span class="text-xs text-gray-700 font-mono dark:text-gray-200">{{ formatTimestamp(row.createdAt) }}</span>
      </template>

      <template #source="{ row }">
        <span class="text-xs text-gray-600 dark:text-gray-300">{{ getSourceLabel(row.source) }}</span>
      </template>

      <template #actionType="{ row }">
        <span class="text-xs text-gray-700 dark:text-gray-200">{{ getActionTypeLabel(row.actionType) }}</span>
      </template>

      <template #operatorId="{ row }">
        <span class="text-xs text-gray-600 font-mono dark:text-gray-300">
          {{ row.operatorId || t('views.auditLogs.empty.operatorId') }}
        </span>
      </template>

      <template #resourceId="{ row }">
        <span class="text-xs text-gray-600 font-mono dark:text-gray-300">
          {{ row.resourceId || t('views.auditLogs.empty.resourceId') }}
        </span>
      </template>

      <template #summary="{ row }">
        <div class="text-gray-800 leading-5 dark:text-gray-100">
          {{ row.summary }}
        </div>
      </template>

      <template #succeeded="{ row }">
        <el-tag :type="row.succeeded ? 'success' : 'danger'" effect="light">
          {{ row.succeeded ? t('common.yes') : t('common.no') }}
        </el-tag>
      </template>
      <template #errorMessage="{ row }">
        <span v-if="row.errorMessage" class="text-xs text-red-600 dark:text-red-400">{{ row.errorMessage }}</span>
        <span v-else class="text-xs text-gray-400 dark:text-gray-500">{{ t('views.auditLogs.empty.errorMessage') }}</span>
      </template>

      <template #operation="{ row }">
        <el-button link type="primary" @click="onView(row)">
          {{ t('components.myTable.view') }}
        </el-button>
      </template>
    </MyTable>

    <DetailDialog ref="detailDialogRef" :log="currentDetailLog" />
  </div>
</template>
