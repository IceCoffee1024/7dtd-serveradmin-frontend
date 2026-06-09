<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { ChatMessageDto, ChatMessageQueryOrder, ChatType } from '~/generated/api/types.gen';
import { useQueryCache } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { usePlayerProfileNavigation, useRoutePlayerTableSearch } from '~/composables';
import { chatMessagesGetQuery } from '~/generated/api/@pinia/colada.gen';
import { getChatTypeOptions, getChatTypeTagType } from '../chatType';

defineOptions({ name: 'ChatHistory' });

type ChatMessageRow = ChatMessageDto;

const { t } = useI18n();
const queryCache = useQueryCache();
const { viewPlayerProfile } = usePlayerProfileNavigation();
const tableRef = useTemplateRef('tableRef');
useRoutePlayerTableSearch(tableRef);

const chatTypeOptions = computed(() => getChatTypeOptions(t));

const columns = computed<MyTableColumn<ChatMessageRow>[]>(() => [
  {
    prop: 'keyword',
    label: t('components.myTable.keywordSearch'),
    show: false,
    exportable: false,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 0,
      span: 8,
    },
  },
  {
    prop: 'timeRange',
    label: t('views.gameChat.history.filters.timeRange'),
    show: false,
    exportable: false,
    search: {
      el: 'el-date-picker',
      props: {
        clearable: true,
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
        startPlaceholder: t('views.gameChat.history.placeholders.timeRange'),
        endPlaceholder: t('views.gameChat.history.placeholders.timeRange'),
      },
      order: 4,
      span: 16,
      transform: (value: string[] | undefined) => ({
        startTime: value?.[0],
        endTime: value?.[1],
      }),
    },
  },
  {
    prop: 'createdAt',
    label: t('views.gameChat.history.columns.createdAt'),
    slot: 'createdAt',
    sortable: true,
  },
  {
    prop: 'chatType',
    label: t('views.gameChat.history.columns.chatType'),
    slot: 'chatType',
    sortable: true,
    enum: chatTypeOptions,
    search: {
      el: 'el-select',
      props: {
        clearable: true,
        placeholder: t('views.gameChat.history.placeholders.allChatTypes'),
      },
      order: 3,
      span: 8,
    },
  },
  {
    prop: 'senderName',
    label: t('views.gameChat.history.columns.senderName'),
    slot: 'senderName',
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 1,
      span: 8,
    },
  },
  {
    prop: 'playerId',
    label: t('views.gameChat.history.columns.playerId'),
    slot: 'playerId',
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 2,
      span: 8,
    },
  },
  {
    prop: 'entityId',
    label: t('views.gameChat.history.columns.entityId'),
    sortable: true,
  },
  {
    prop: 'message',
    label: t('views.gameChat.history.columns.message'),
    slot: 'message',
  },
]);

/**
 * Loads persisted chat history and adapts the backend paging contract to MyTable.
 * @param params - Table paging, sorting, and transformed search parameters.
 * @returns Table-friendly paged data.
 */
async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<ChatMessageRow>> {
  const options = chatMessagesGetQuery({
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      keyword: toOptionalString(params.search?.keyword),
      senderName: toOptionalString(params.search?.senderName),
      playerId: toOptionalString(params.search?.playerId),
      chatType: toOptionalChatType(params.search?.chatType),
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
    total: response?.total ?? 0,
    list: response?.items ?? [],
  };
}

/**
 * Converts a table sort field into the backend enum string expected by the API.
 * @param sortField - Raw sort field emitted by Element Plus.
 * @returns Backend order value or undefined when the column is not sortable remotely.
 */
function toOrder(sortField: string | undefined): ChatMessageQueryOrder | undefined {
  switch (sortField) {
    case 'createdAt':
      return 'CreatedAt';
    case 'entityId':
      return 'EntityId';
    case 'playerId':
      return 'PlayerId';
    case 'chatType':
      return 'ChatType';
    case 'senderName':
      return 'SenderName';
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

function toOptionalChatType(value: unknown): ChatType | undefined {
  switch (value) {
    case 'Global':
    case 'Friends':
    case 'Party':
    case 'Whisper':
    case 'Unknown':
      return value;
    default:
      return undefined;
  }
}

/**
 * Formats UTC timestamps into a compact local representation for operator review.
 * @param value - Backend ISO timestamp.
 * @returns Formatted local timestamp.
 */
function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '';
}

function onViewPlayerProfile(row: ChatMessageRow) {
  viewPlayerProfile({ playerId: row.playerId, playerName: row.senderName });
}
</script>

<template>
  <el-card
    class="h-full min-h-0"
    shadow="never"
    :body-style="{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '0',
      overflow: 'hidden',
    }"
  >
    <MyTable
      ref="tableRef"
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :selectable="false"
      :show-add-btn="false"
      :show-operation-column="false"
      :auto-column-width="true"
      :search-collapsible="true"
    >
      <template #createdAt="{ row }">
        <span class="text-xs text-gray-700 font-mono dark:text-gray-200">{{ formatTimestamp(row.createdAt) }}</span>
      </template>

      <template #playerId="{ row }">
        <el-button
          v-if="row.playerId"
          type="primary"
          link
          class="text-xs font-mono"
          @click="onViewPlayerProfile(row as ChatMessageRow)"
        >
          {{ row.playerId }}
        </el-button>
        <span v-else class="text-xs text-gray-600 font-mono dark:text-gray-300">
          {{ row.playerId || t('views.gameChat.history.emptyPlayerId') }}
        </span>
      </template>

      <template #senderName="{ row }">
        <el-button
          v-if="row.playerId"
          type="primary"
          link
          @click="onViewPlayerProfile(row as ChatMessageRow)"
        >
          {{ row.senderName || row.playerId }}
        </el-button>
        <span v-else>{{ row.senderName || '--' }}</span>
      </template>

      <template #chatType="{ row }">
        <el-tag size="small" round effect="plain" :type="getChatTypeTagType(row.chatType as ChatType)">
          {{ chatTypeOptions.find(item => item.value === row.chatType)?.label ?? t('common.unknown') }}
        </el-tag>
      </template>

      <template #message="{ row }">
        <div class="text-sm text-gray-800 leading-6 whitespace-pre-wrap break-words dark:text-gray-100">
          {{ row.message }}
        </div>
      </template>
    </MyTable>
  </el-card>
</template>
