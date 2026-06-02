<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type {
  AuditActionType,
  AuditLogDto,
  AuditLogQueryOrder,
  AuditLogSource,
} from '~/generated/api/types.gen';
import { useQueryCache } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { auditLogsGetQuery } from '~/generated/api/@pinia/colada.gen';
import DetailDialog from './DetailDialog.vue';

defineOptions({ name: 'AuditLogTable' });

type AuditLogRow = AuditLogDto;

const { t } = useI18n();
const detailDialogRef = useTemplateRef('detailDialogRef');
const currentDetailLog = ref<AuditLogRow | null>(null);
const queryCache = useQueryCache();

const sourceOptions = computed(() => [
  { label: t('views.auditLogs.sources.api'), value: 'Api' },
  { label: t('views.auditLogs.sources.chatCommand'), value: 'ChatCommand' },
  { label: t('views.auditLogs.sources.consoleCommand'), value: 'ConsoleCommand' },
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
  { label: t('views.auditLogs.actionTypes.grant'), value: 'Grant' },
  { label: t('views.auditLogs.actionTypes.revoke'), value: 'Revoke' },
  { label: t('views.auditLogs.actionTypes.export'), value: 'Export' },
  { label: t('views.auditLogs.actionTypes.reset'), value: 'Reset' },
]);

const succeededOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const overviewItems = computed(() => [
  {
    label: t('views.auditLogs.columns.source'),
    value: sourceOptions.value.length,
    tone: 'primary',
  },
  {
    label: t('views.auditLogs.columns.actionType'),
    value: actionTypeOptions.value.length,
    tone: 'warning',
  },
  {
    label: t('views.auditLogs.columns.succeeded'),
    value: succeededOptions.value.length,
    tone: 'success',
  },
]);

const columns = computed<MyTableColumn<AuditLogRow>[]>(() => [
  {
    prop: 'keyword',
    label: t('components.myTable.keywordSearch'),
    show: false,
    exportable: false,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 0,
    },
  },
  {
    prop: 'timeRange',
    label: t('views.auditLogs.filters.timeRange'),
    show: false,
    exportable: false,
    search: {
      el: 'el-date-picker',
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
    label: t('views.auditLogs.columns.source'),
    slot: 'source',
    sortable: true,
    enum: sourceOptions,
    search: {
      el: 'el-select',
      props: {
        clearable: true,
        placeholder: t('views.auditLogs.placeholders.allSources'),
      },
      order: 2,
    },
  },
  {
    prop: 'operatorId',
    label: t('views.auditLogs.columns.operatorId'),
    slot: 'operatorId',
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 3,
    },
  },
  {
    prop: 'actionType',
    label: t('views.auditLogs.columns.actionType'),
    slot: 'actionType',
    sortable: true,
    enum: actionTypeOptions,
    search: {
      el: 'el-select',
      props: {
        clearable: true,
        placeholder: t('views.auditLogs.placeholders.allActionTypes'),
      },
      order: 4,
    },
  },
  {
    prop: 'resourceType',
    label: t('views.auditLogs.columns.resourceType'),
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 5,
    },
  },
  {
    prop: 'resourceId',
    label: t('views.auditLogs.columns.resourceId'),
    slot: 'resourceId',
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 6,
      span: 12,
    },
  },
  {
    prop: 'succeeded',
    label: t('views.auditLogs.columns.succeeded'),
    slot: 'succeeded',
    sortable: true,
    enum: succeededOptions,
    search: {
      el: 'el-select',
      props: {
        clearable: true,
        placeholder: t('views.auditLogs.placeholders.allResults'),
      },
      order: 7,
      span: 12,
    },
  },
  {
    prop: 'createdAt',
    label: t('views.auditLogs.columns.createdAt'),
    slot: 'createdAt',
    sortable: true,
  },
  {
    prop: 'operatorName',
    label: t('views.auditLogs.columns.operatorName'),
    sortable: true,
  },
  {
    prop: 'summary',
    label: t('views.auditLogs.columns.summary'),
    slot: 'summary',
  },
  {
    prop: 'errorMessage',
    label: t('views.auditLogs.columns.errorMessage'),
    slot: 'errorMessage',
  },
]);

/**
 * Loads paged audit logs and adapts the backend contract to MyTable.
 * @param params - Table paging, sorting, and transformed search parameters.
 * @returns Table-friendly paged data.
 */
async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<AuditLogRow>> {
  const options = auditLogsGetQuery({
    query: {
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
    },
  });
  const entry = queryCache.ensure(options);
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  const response = state.data;

  return {
    total: response?.total ?? 0,
    list: response?.items ?? [],
  };
}

/**
 * Converts a table sort field into the backend enum string expected by the audit API.
 * @param sortField - Raw sort field emitted by Element Plus.
 * @returns Backend order value or undefined when remote sorting is unavailable.
 */
function toOrder(sortField: string | undefined): AuditLogQueryOrder | undefined {
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
function toOptionalSource(value: unknown): AuditLogSource | undefined {
  switch (value) {
    case 'Api':
    case 'ChatCommand':
    case 'ConsoleCommand':
      return value;
    default:
      return undefined;
  }
}

/**
 * Narrows a search value to an audit action type enum.
 * @param value - Raw search value.
 * @returns Action type enum or undefined.
 */
function toOptionalActionType(value: unknown): AuditActionType | undefined {
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
    case 'Grant':
    case 'Revoke':
    case 'Export':
    case 'Reset':
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
    case 'Export':
      return t('views.auditLogs.actionTypes.export');
    case 'Grant':
      return t('views.auditLogs.actionTypes.grant');
    case 'Revoke':
      return t('views.auditLogs.actionTypes.revoke');
    case 'Reset':
      return t('views.auditLogs.actionTypes.reset');
    default:
      return actionType;
  }
}

/**
 * Formats UTC timestamps into a compact local representation for audit review.
 * @param value - Backend ISO timestamp.
 * @returns Formatted local timestamp.
 */
function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '';
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
  <div class="audit-log-page">
    <div class="audit-log-page__overview">
      <div
        v-for="item in overviewItems"
        :key="item.label"
        class="audit-log-page__metric"
        :class="`audit-log-page__metric--${item.tone}`"
      >
        <span class="audit-log-page__metric-label">{{ item.label }}</span>
        <strong class="audit-log-page__metric-value">{{ item.value }}</strong>
      </div>
    </div>

    <MyTable
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :selectable="false"
      :show-add-btn="false"
      :operation-column-width="96"
      :auto-column-width="true"
      :search-collapsible="true"
      class="audit-log-page__table"
    >
      <template #createdAt="{ row }">
        <span class="audit-log-page__mono">{{ formatTimestamp(row.createdAt) }}</span>
      </template>

      <template #source="{ row }">
        <span class="audit-log-page__pill audit-log-page__pill--neutral">{{ getSourceLabel(row.source) }}</span>
      </template>

      <template #actionType="{ row }">
        <span class="audit-log-page__pill audit-log-page__pill--accent">{{ getActionTypeLabel(row.actionType) }}</span>
      </template>

      <template #operatorId="{ row }">
        <span class="audit-log-page__mono">
          {{ row.operatorId || t('views.auditLogs.empty.operatorId') }}
        </span>
      </template>

      <template #resourceId="{ row }">
        <span class="audit-log-page__mono">
          {{ row.resourceId || t('views.auditLogs.empty.resourceId') }}
        </span>
      </template>

      <template #summary="{ row }">
        <div class="audit-log-page__summary">
          {{ row.summary }}
        </div>
      </template>

      <template #succeeded="{ row }">
        <el-tag :type="row.succeeded ? 'success' : 'danger'" effect="light">
          {{ row.succeeded ? t('common.yes') : t('common.no') }}
        </el-tag>
      </template>
      <template #errorMessage="{ row }">
        <span v-if="row.errorMessage" class="audit-log-page__error">{{ row.errorMessage }}</span>
        <span v-else class="audit-log-page__empty">{{ t('views.auditLogs.empty.errorMessage') }}</span>
      </template>

      <template #operation="{ row }">
        <IconButton
          round
          border
          button-size="small"
          :tooltip-content="t('components.myTable.view')"
          @click="onView(row as AuditLogRow)"
        >
          <icon-mdi-eye-outline />
        </IconButton>
      </template>
    </MyTable>

    <DetailDialog ref="detailDialogRef" :log="currentDetailLog" />
  </div>
</template>

<style scoped lang="scss">
.audit-log-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  min-height: 0;
}

.audit-log-page__overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.audit-log-page__metric {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.05rem;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, currentColor 10%, transparent), transparent 36%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.05);
}

.audit-log-page__metric--primary {
  color: var(--colors-primary);
}

.audit-log-page__metric--warning {
  color: #b45309;
}

.audit-log-page__metric--success {
  color: #0f766e;
}

.audit-log-page__metric-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.audit-log-page__metric-value {
  font-size: 1.6rem;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.audit-log-page__table {
  flex: 1;
  min-height: 0;
}

.audit-log-page__mono {
  font-family: var(--el-font-family-monospace, 'Cascadia Mono', 'Consolas', monospace);
  font-size: 0.76rem;
  color: var(--el-text-color-secondary);
}

.audit-log-page__pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0.1rem 0.75rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
}

.audit-log-page__pill--neutral {
  color: var(--el-text-color-primary);
  background: color-mix(in srgb, var(--el-fill-color-light) 86%, white 14%);
}

.audit-log-page__pill--accent {
  color: var(--colors-primary);
  background: color-mix(in srgb, var(--colors-primary) 10%, transparent);
}

.audit-log-page__summary {
  color: var(--el-text-color-primary);
  line-height: 1.65;
}

.audit-log-page__error {
  font-size: 0.76rem;
  color: var(--el-color-danger);
}

.audit-log-page__empty {
  font-size: 0.76rem;
  color: var(--el-text-color-placeholder);
}

@media (max-width: 900px) {
  .audit-log-page__overview {
    grid-template-columns: 1fr;
  }
}
</style>
