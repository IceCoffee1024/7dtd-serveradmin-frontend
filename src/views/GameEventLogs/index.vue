<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { GameEventLogDto, GameEventLogQueryOrder } from '~/generated/api/types.gen';
import { useQueryCache } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { usePlayerProfileNavigation } from '~/composables';
import { gameEventLogGetGameEventLogsQuery } from '~/generated/api/@pinia/colada.gen';

defineOptions({ name: 'GameEventLogsPage' });

type LogRow = GameEventLogDto;

const { t } = useI18n();
const queryCache = useQueryCache();
const { viewPlayerProfile } = usePlayerProfileNavigation();

const EVENT_TYPES = ['PlayerJoined', 'PlayerLeft', 'PlayerDied', 'PlayerKilledZombie', 'PlayerKilledPlayer'] as const;

const eventTypeOptions = computed(() =>
  EVENT_TYPES.map(type => ({
    label: t(`views.gameEventLogs.eventTypes.${type}`),
    value: type,
  })),
);

const EVENT_TYPE_TAG_MAP: Record<string, 'success' | 'danger' | 'warning' | 'info' | undefined> = {
  PlayerJoined: 'success',
  PlayerLeft: 'info',
  PlayerDied: 'danger',
  PlayerKilledZombie: 'warning',
  PlayerKilledPlayer: 'danger',
};

const columns = computed<MyTableColumn<LogRow>[]>(() => [
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
    prop: 'eventType',
    label: t('views.gameEventLogs.filters.eventType'),
    slot: 'eventType',
    search: {
      el: 'el-select',
      props: {
        clearable: true,
        placeholder: t('views.gameEventLogs.placeholders.allEventTypes'),
      },
      options: eventTypeOptions,
      order: 1,
      span: 8,
    },
  },
  {
    prop: 'timeRange',
    label: t('views.gameEventLogs.filters.timeRange'),
    show: false,
    exportable: false,
    search: {
      el: 'el-date-picker',
      props: {
        clearable: true,
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
        startPlaceholder: t('views.gameEventLogs.placeholders.timeRange'),
        endPlaceholder: t('views.gameEventLogs.placeholders.timeRange'),
      },
      order: 2,
      span: 16,
      transform: (value: string[] | undefined) => ({
        startTime: value?.[0],
        endTime: value?.[1],
      }),
    },
  },
  { prop: 'createdAt', label: t('views.gameEventLogs.columns.createdAt'), slot: 'createdAt', sortable: true },
  { prop: 'playerName', label: t('views.gameEventLogs.columns.playerName'), slot: 'playerName', sortable: true },
  { prop: 'targetPlayerName', label: t('views.gameEventLogs.columns.targetPlayerName'), slot: 'targetPlayerName' },
  { prop: 'entityType', label: t('views.gameEventLogs.columns.entityType') },
  { prop: 'details', label: 'Details' },
]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<LogRow>> {
  const options = gameEventLogGetGameEventLogsQuery({
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      keyword: toOptionalString(params.search?.keyword),
      eventType: toOptionalString(params.search?.eventType),
      startTime: toOptionalString(params.search?.startTime),
      endTime: toOptionalString(params.search?.endTime),
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
    list: response?.items ?? [],
    total: response?.total ?? 0,
  };
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function toOrder(sortField: string | undefined): GameEventLogQueryOrder | undefined {
  switch (sortField) {
    case 'createdAt':
      return 'CreatedAt';
    case 'eventType':
      return 'EventType';
    case 'playerName':
      return 'PlayerName';
    default:
      return undefined;
  }
}

function resolveEventTypeLabel(eventType: string): string {
  const key = `views.gameEventLogs.eventTypes.${eventType}`;
  const resolved = t(key);
  return resolved === key ? eventType : resolved;
}

function resolveEventTypeTag(eventType: string): 'success' | 'danger' | 'warning' | 'info' | undefined {
  return EVENT_TYPE_TAG_MAP[eventType];
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '';
}

function onViewPlayerProfile(playerId: string | null | undefined, playerName: string | null | undefined) {
  viewPlayerProfile({ playerId, playerName });
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <MyTable
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :show-index="true"
      :show-add-btn="false"
      :auto-column-width="true"
      :search-collapsible="true"
    >
      <template #createdAt="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatTimestamp(row.createdAt) }}</span>
      </template>

      <template #eventType="{ row }">
        <el-tag :type="resolveEventTypeTag(row.eventType)">
          {{ resolveEventTypeLabel(row.eventType) }}
        </el-tag>
      </template>

      <template #playerName="{ row }">
        <el-button
          v-if="row.playerId"
          type="primary"
          link
          @click="onViewPlayerProfile(row.playerId, row.playerName)"
        >
          {{ row.playerName || row.playerId }}
        </el-button>
        <span v-else>{{ row.playerName || '--' }}</span>
      </template>

      <template #targetPlayerName="{ row }">
        <el-button
          v-if="row.targetPlayerId"
          type="primary"
          link
          @click="onViewPlayerProfile(row.targetPlayerId, row.targetPlayerName)"
        >
          {{ row.targetPlayerName || row.targetPlayerId }}
        </el-button>
        <span v-else>{{ row.targetPlayerName || '--' }}</span>
      </template>
    </MyTable>
  </div>
</template>
