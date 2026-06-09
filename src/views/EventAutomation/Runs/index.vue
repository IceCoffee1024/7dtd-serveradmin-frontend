<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type {
  EventAutomationRunLogCleanupRequestDto,
  EventAutomationRunLogCleanupResultDto,
  EventAutomationRunLogDto,
  EventAutomationRunLogQueryOrder,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { usePopup } from '~/composables';
import { eventAutomationCleanupRuns, eventAutomationGetRuns } from '~/generated/api/sdk.gen';
import RunDetailDialog from './RunDetailDialog.vue';

defineOptions({ name: 'EventAutomationRunsPage' });

type RunRow = EventAutomationRunLogDto;

const TRIGGER_TYPES = [
  'PlayerJoined',
  'PlayerLeft',
  'ChatMessage',
  'Cron',
] as const;

const { t } = useI18n();
const route = useRoute();
const { confirm, prompt, toast } = usePopup();

const tableRef = useTemplateRef('tableRef');
const detailDialogRef = useTemplateRef('detailDialogRef');
const currentRun = ref<RunRow | null>(null);
const cleanupLoading = ref(false);

const triggerTypeOptions = computed(() =>
  TRIGGER_TYPES.map(type => ({
    label: t(`views.eventAutomation.triggers.${type}`),
    value: type,
  })),
);

const succeededOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const routeRuleId = computed(() => {
  const value = Array.isArray(route.query.ruleId) ? route.query.ruleId[0] : route.query.ruleId;
  if (typeof value !== 'string')
    return undefined;

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
});

const routeSucceeded = computed(() => {
  const value = Array.isArray(route.query.succeeded) ? route.query.succeeded[0] : route.query.succeeded;
  if (value === 'true')
    return true;
  if (value === 'false')
    return false;

  return undefined;
});

const columns = computed<MyTableColumn<RunRow>[]>(() => [
  {
    prop: 'ruleId',
    label: t('views.eventAutomation.runs.columns.ruleId'),
    show: false,
    exportable: false,
    search: {
      el: 'el-input',
      defaultValue: routeRuleId.value,
      transform: value => ({
        ruleId: typeof value === 'number' ? value : Number(value) || undefined,
      }),
    },
  },
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
    prop: 'triggerType',
    label: t('views.eventAutomation.runs.columns.triggerType'),
    slot: 'triggerType',
    search: {
      el: 'el-select',
      props: { clearable: true },
      options: triggerTypeOptions,
      order: 1,
      span: 8,
    },
  },
  {
    prop: 'succeeded',
    label: t('views.eventAutomation.runs.filters.succeeded'),
    slot: 'succeeded',
    search: {
      el: 'el-select',
      props: { clearable: true },
      options: succeededOptions,
      defaultValue: routeSucceeded.value,
      order: 2,
      span: 8,
    },
  },
  {
    prop: 'timeRange',
    label: t('views.eventAutomation.runs.filters.timeRange'),
    show: false,
    exportable: false,
    search: {
      el: 'el-date-picker',
      props: {
        clearable: true,
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
        startPlaceholder: t('views.eventAutomation.runs.placeholders.timeRange'),
        endPlaceholder: t('views.eventAutomation.runs.placeholders.timeRange'),
      },
      order: 3,
      span: 16,
      transform: (value: string[] | undefined) => ({
        startTime: value?.[0],
        endTime: value?.[1],
      }),
    },
  },
  { prop: 'ruleName', label: t('views.eventAutomation.runs.columns.ruleName'), sortable: true },
  { prop: 'playerName', label: t('views.eventAutomation.runs.columns.playerName'), sortable: true },
  { prop: 'startedAt', label: t('views.eventAutomation.runs.columns.startedAt'), slot: 'startedAt', sortable: true },
  { prop: 'durationMs', label: t('views.eventAutomation.runs.columns.durationMs'), slot: 'durationMs', sortable: true, className: 'text-center' },
  { prop: 'summary', label: t('views.eventAutomation.runs.columns.summary'), slot: 'summary' },
  { prop: 'errorMessage', label: t('views.eventAutomation.runs.columns.errorMessage'), slot: 'errorMessage' },
]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<RunRow>> {
  const { data } = await eventAutomationGetRuns({
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      keyword: toOptionalString(params.search?.keyword),
      ruleId: toOptionalPositiveInteger(params.search?.ruleId ?? routeRuleId.value),
      triggerType: toOptionalString(params.search?.triggerType),
      succeeded: toOptionalBoolean(params.search?.succeeded ?? routeSucceeded.value),
      startTime: toOptionalString(params.search?.startTime),
      endTime: toOptionalString(params.search?.endTime),
      order: toOrder(params.sortField),
      desc: params.sortOrder === 'descending',
    },
    throwOnError: true,
  });

  return {
    list: data?.items ?? [],
    total: data?.total ?? 0,
  };
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return undefined;

  const trimmed = value.trim();
  return trimmed || undefined;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean')
    return value;
  if (value === 'true')
    return true;
  if (value === 'false')
    return false;

  return undefined;
}

function toOptionalPositiveInteger(value: unknown): number | undefined {
  const id = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function toOrder(sortField: string | undefined): EventAutomationRunLogQueryOrder | undefined {
  switch (sortField) {
    case 'ruleName':
      return 'RuleName';
    case 'triggerType':
      return 'TriggerType';
    case 'playerName':
      return 'PlayerName';
    case 'startedAt':
      return 'StartedAt';
    case 'endedAt':
      return 'EndedAt';
    case 'succeeded':
      return 'Succeeded';
    case 'durationMs':
      return 'DurationMs';
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

function resolveTriggerTypeLabel(triggerType: string): string {
  const key = `views.eventAutomation.triggers.${triggerType}`;
  const label = t(key);
  return label === key ? triggerType : label;
}

function onView(row: RunRow) {
  currentRun.value = row;
  detailDialogRef.value?.show();
}

async function cleanupRuns(request: EventAutomationRunLogCleanupRequestDto): Promise<EventAutomationRunLogCleanupResultDto> {
  const { data } = await eventAutomationCleanupRuns({
    body: request,
    throwOnError: true,
  });

  return data;
}

async function onCleanupTestRuns() {
  cleanupLoading.value = true;
  try {
    const preview = await cleanupRuns({
      deleteTestRuns: true,
      previewOnly: true,
    });
    const matchedCount = preview.matchedCount ?? 0;

    if (matchedCount <= 0) {
      toast({ type: 'info', text: t('views.eventAutomation.runs.cleanup.noMatches') });
      return;
    }

    const ok = await confirm({
      type: 'warning',
      title: t('views.eventAutomation.runs.cleanup.testRunsTitle'),
      text: t('views.eventAutomation.runs.cleanup.confirmDelete', [matchedCount]),
    });
    if (!ok)
      return;

    const result = await cleanupRuns({
      deleteTestRuns: true,
      previewOnly: false,
    });
    toast({
      type: 'success',
      text: t('views.eventAutomation.runs.cleanup.deleted', [result.deletedCount ?? 0]),
    });
    await tableRef.value?.reload();
  }
  catch (error) {
    toast({ type: 'error', text: error instanceof Error ? error.message : String(error) });
  }
  finally {
    cleanupLoading.value = false;
  }
}

async function onCleanupExpiredRuns() {
  const value = await prompt({
    type: 'warning',
    title: t('views.eventAutomation.runs.cleanup.expiredTitle'),
    text: t('views.eventAutomation.runs.cleanup.daysPrompt'),
    inputValue: '30',
    inputValidator: (input) => {
      const days = Number(input);
      return Number.isInteger(days) && days > 0
        ? true
        : t('views.eventAutomation.runs.cleanup.invalidDays');
    },
  });
  if (value == null)
    return;

  const olderThanDays = Number(value);
  cleanupLoading.value = true;
  try {
    const preview = await cleanupRuns({
      olderThanDays,
      previewOnly: true,
    });
    const matchedCount = preview.matchedCount ?? 0;

    if (matchedCount <= 0) {
      toast({ type: 'info', text: t('views.eventAutomation.runs.cleanup.noMatches') });
      return;
    }

    const ok = await confirm({
      type: 'warning',
      title: t('views.eventAutomation.runs.cleanup.expiredTitle'),
      text: t('views.eventAutomation.runs.cleanup.confirmDeleteExpired', [
        matchedCount,
        olderThanDays,
      ]),
    });
    if (!ok)
      return;

    const result = await cleanupRuns({
      olderThanDays,
      previewOnly: false,
    });
    toast({
      type: 'success',
      text: t('views.eventAutomation.runs.cleanup.deleted', [result.deletedCount ?? 0]),
    });
    await tableRef.value?.reload();
  }
  catch (error) {
    toast({ type: 'error', text: error instanceof Error ? error.message : String(error) });
  }
  finally {
    cleanupLoading.value = false;
  }
}
</script>

<template>
  <div class="event-automation-runs-page flex flex-col gap-4 h-full min-h-0">
    <div class="event-automation-runs-page__table">
      <MyTable
        ref="tableRef"
        row-key="id"
        :columns="columns"
        :fetch-data="fetchData"
        :show-index="true"
        :show-add-btn="false"
        :auto-column-width="true"
        :search-collapsible="true"
      >
        <template #toolbar-right>
          <div class="event-automation-runs-page__cleanup-actions">
            <el-button size="small" :loading="cleanupLoading" @click="onCleanupTestRuns">
              {{ t('views.eventAutomation.runs.cleanup.testRuns') }}
            </el-button>
            <el-button size="small" :loading="cleanupLoading" @click="onCleanupExpiredRuns">
              {{ t('views.eventAutomation.runs.cleanup.expired') }}
            </el-button>
          </div>
        </template>

        <template #triggerType="{ row }">
          <el-tag type="info">
            {{ resolveTriggerTypeLabel(row.triggerType) }}
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

        <template #durationMs="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatDuration(row.durationMs) }}</span>
        </template>

        <template #summary="{ row }">
          <span class="text-sm text-gray-800 line-clamp-2 dark:text-gray-100">{{ row.summary }}</span>
        </template>

        <template #errorMessage="{ row }">
          <span class="text-sm text-red-600 line-clamp-2 dark:text-red-400">{{ row.errorMessage || '--' }}</span>
        </template>

        <template #operation="{ row }">
          <IconButton button-size="small" icon-size="18" plain :tooltip-content="t('views.eventAutomation.runs.actions.viewDetails')" @click="onView(row)">
            <icon-mdi-eye-outline />
          </IconButton>
        </template>
      </MyTable>
    </div>

    <RunDetailDialog ref="detailDialogRef" :run-data="currentRun" />
  </div>
</template>

<style scoped>
.event-automation-runs-page__table {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.event-automation-runs-page__cleanup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
