<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { getChatMessages } from '~/api/chat';

defineOptions({ name: 'ChatHistory' });

type ChatMessageRow = API.Chat.ChatMessage;

const { t } = useI18n();

const chatTypeOptions = computed(() => [
  { label: 'Global', value: 'Global' },
  { label: 'Whisper', value: 'Whisper' },
  { label: 'Party', value: 'Party' },
  { label: 'Friends', value: 'Friends' },
  { label: 'System', value: 'System' },
]);

const columns = computed<MyTableColumn<ChatMessageRow>[]>(() => [
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
    label: t('views.gameChat.history.filters.timeRange'),
    isShow: false,
    exportable: false,
    search: {
      el: 'date-picker',
      props: {
        clearable: true,
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
        startPlaceholder: t('views.gameChat.history.placeholders.timeRange'),
        endPlaceholder: t('views.gameChat.history.placeholders.timeRange'),
      },
      order: 4,
      span: 12,
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
    width: 180,
  },
  {
    prop: 'chatType',
    label: t('views.gameChat.history.columns.chatType'),
    sortable: true,
    width: 120,
    enum: chatTypeOptions,
    search: {
      el: 'select',
      props: {
        clearable: true,
        placeholder: t('views.gameChat.history.placeholders.allChatTypes'),
      },
      order: 3,
    },
  },
  {
    prop: 'senderName',
    label: t('views.gameChat.history.columns.senderName'),
    sortable: true,
    minWidth: 160,
    search: {
      el: 'input',
      props: { clearable: true },
      order: 1,
    },
  },
  {
    prop: 'playerId',
    label: t('views.gameChat.history.columns.playerId'),
    slot: 'playerId',
    sortable: true,
    minWidth: 180,
    search: {
      el: 'input',
      props: { clearable: true },
      order: 2,
    },
  },
  {
    prop: 'entityId',
    label: t('views.gameChat.history.columns.entityId'),
    sortable: true,
    width: 110,
  },
  {
    prop: 'message',
    label: t('views.gameChat.history.columns.message'),
    slot: 'message',
    minWidth: 320,
  },
]);

/**
 * Loads persisted chat history and adapts the backend paging contract to MyTable.
 * @param params - Table paging, sorting, and transformed search parameters.
 * @returns Table-friendly paged data.
 */
async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<ChatMessageRow>> {
  const query: API.Chat.ChatMessageQuery = {
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: toOptionalString(params.search?.keyword),
    senderName: toOptionalString(params.search?.senderName),
    playerId: toOptionalString(params.search?.playerId),
    chatType: toOptionalString(params.search?.chatType),
    startTime: toOptionalString(params.search?.startTime),
    endTime: toOptionalString(params.search?.endTime),
    order: toOrder(params.sortField),
    desc: params.sortOrder === 'descending',
  };

  const response = await getChatMessages(query);
  return {
    total: response.total,
    list: response.items,
  };
}

/**
 * Converts a table sort field into the backend enum string expected by the API.
 * @param sortField - Raw sort field emitted by Element Plus.
 * @returns Backend order value or undefined when the column is not sortable remotely.
 */
function toOrder(sortField: string | undefined): API.Chat.ChatMessageQueryOrder | undefined {
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

/**
 * Formats UTC timestamps into a compact local representation for operator review.
 * @param value - Backend ISO timestamp.
 * @returns Formatted local timestamp.
 */
function formatTimestamp(value: string): string {
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}
</script>

<template>
  <div class="h-[calc(100vh-138px)]">
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

      <template #playerId="{ row }">
        <span class="text-xs text-gray-600 font-mono dark:text-gray-300">
          {{ row.playerId || t('views.gameChat.history.emptyPlayerId') }}
        </span>
      </template>

      <template #message="{ row }">
        <div class="text-sm text-gray-800 leading-6 whitespace-pre-wrap break-words dark:text-gray-100">
          {{ row.message }}
        </div>
      </template>
    </MyTable>
  </div>
</template>
