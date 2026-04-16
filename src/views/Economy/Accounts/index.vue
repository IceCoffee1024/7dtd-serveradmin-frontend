<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import * as api from '~/api/economy';
import AccountDetailDialog from './AccountDetailDialog.vue';
import AdjustBalanceDialog from './AdjustBalanceDialog.vue';

defineOptions({ name: 'EconomyAccountsPage' });

interface AccountRow {
  id: number;
  playerId: string;
  playerName: string;
  balance: number;
  isFrozen: boolean;
  lastTransactionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeaderboardItem {
  rank: number;
  playerId: string;
  playerName: string;
  balance: number;
}

type AccountQueryOrder = API.Economy.AccountQueryOrder;

const { t } = useI18n();
const tableRef = useTemplateRef('tableRef');
const adjustDialogRef = useTemplateRef('adjustDialogRef');
const detailDialogRef = useTemplateRef('detailDialogRef');
const currentRow = ref<AccountRow | null>(null);
const detailPlayerId = ref('');
const leaderboard = ref<LeaderboardItem[]>([]);

const columns = computed<MyTableColumn<AccountRow>[]>(() => [
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
    prop: 'playerId',
    label: t('views.economy.accounts.columns.playerId'),
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 1,
      span: 8,
    },
  },
  {
    prop: 'playerName',
    label: t('views.economy.accounts.columns.playerName'),
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 2,
      span: 8,
    },
  },
  {
    prop: 'balance',
    label: t('views.economy.accounts.columns.balance'),
    slot: 'balance',
    sortable: true,
  },
  {
    prop: 'isFrozen',
    label: t('views.economy.accounts.columns.isFrozen'),
    slot: 'isFrozen',
    search: {
      el: 'el-select',
      options: [
        { label: t('common.yes'), value: true },
        { label: t('common.no'), value: false },
      ],
      props: { clearable: true },
      order: 3,
      span: 8,
    },
  },
  {
    prop: 'lastTransactionAt',
    label: t('views.economy.accounts.columns.lastTransactionAt'),
    slot: 'lastTransactionAt',
    sortable: true,
  },
  { prop: 'actions', label: t('components.myTable.operation'), slot: 'actions', exportable: false, className: 'text-center' },
]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<AccountRow>> {
  const response = await api.getAccounts({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: params.search?.keyword?.trim() || undefined,
    playerId: toOptionalString(params.search?.playerId),
    playerName: toOptionalString(params.search?.playerName),
    isFrozen: typeof params.search?.isFrozen === 'boolean' ? params.search.isFrozen : undefined,
    order: toOrder(params.sortField),
    desc: params.sortOrder === 'descending',
  });

  return {
    list: response.items,
    total: response.total,
  };
}

async function loadLeaderboard() {
  try {
    leaderboard.value = await api.getLeaderboard();
  }
  catch (error) {
    console.error(error);
    leaderboard.value = [];
  }
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

function toOrder(sortField: string | undefined): AccountQueryOrder | undefined {
  switch (sortField) {
    case 'playerId':
      return 'PlayerId';
    case 'playerName':
      return 'PlayerName';
    case 'balance':
      return 'Balance';
    case 'lastTransactionAt':
      return 'LastTransactionAt';
    case 'createdAt':
      return 'CreatedAt';
    default:
      return undefined;
  }
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function onAdjust(row: AccountRow) {
  currentRow.value = row;
  adjustDialogRef.value?.show();
}

function onView(row: AccountRow) {
  detailPlayerId.value = row.playerId;
  detailDialogRef.value?.show(row.playerId);
}

async function onToggleFrozen(row: AccountRow) {
  await api.setAccountFrozen(row.playerId, !row.isFrozen);
  tableRef.value?.reload();
  await loadLeaderboard();
}

async function onSaved() {
  tableRef.value?.reload();
  await loadLeaderboard();
}

onMounted(() => {
  loadLeaderboard();
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="gap-4 grid lg:grid-cols-[minmax(0,1fr)_320px]">
      <MyTable
        ref="tableRef"
        row-key="playerId"
        :columns="columns"
        :fetch-data="fetchData"
        :is-selectable="false"
        :show-add-btn="false"
        :show-edit-btn="false"
        :show-delete-btn="false"
        :show-operation-column="false"
        :auto-column-width="true"
        :search-collapsible="true"
      >
        <template #balance="{ row }">
          <span class="text-amber-600 font-semibold dark:text-amber-400">{{ row.balance }}</span>
        </template>

        <template #isFrozen="{ row }">
          <el-tag :type="row.isFrozen ? 'danger' : 'success'">
            {{ row.isFrozen ? t('common.yes') : t('common.no') }}
          </el-tag>
        </template>

        <template #lastTransactionAt="{ row }">
          <span class="text-xs text-gray-700 font-mono dark:text-gray-200">{{ formatTimestamp(row.lastTransactionAt) }}</span>
        </template>

        <template #actions="{ row }">
          <div class="flex gap-2 justify-center">
            <el-button size="small" plain @click="onView(row)">
              {{ t('components.myTable.view') }}
            </el-button>
            <el-button size="small" plain @click="onAdjust(row)">
              {{ t('views.economy.accounts.actions.adjust') }}
            </el-button>
            <el-button size="small" plain @click="onToggleFrozen(row)">
              {{ row.isFrozen ? t('views.economy.accounts.actions.unfreeze') : t('views.economy.accounts.actions.freeze') }}
            </el-button>
          </div>
        </template>
      </MyTable>

      <div class="p-4 border border-gray-200 rounded-4 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
        <div class="text-sm text-gray-900 font-semibold mb-3 dark:text-gray-100">
          {{ t('views.economy.accounts.leaderboard.title') }}
        </div>
        <div v-if="leaderboard.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('views.economy.accounts.leaderboard.empty') }}
        </div>
        <div v-else class="flex flex-col gap-3">
          <div v-for="(item, index) in leaderboard" :key="item.playerId" class="px-3 py-2 rounded-3 bg-gray-50 flex gap-3 items-center justify-between dark:bg-gray-800/70">
            <div class="min-w-0">
              <div class="text-xs text-gray-400 tracking-[0.16em] uppercase">
                #{{ index + 1 }}
              </div>
              <div class="text-sm text-gray-900 font-semibold truncate dark:text-gray-100">
                {{ item.playerName }}
              </div>
              <div class="text-xs text-gray-500 font-mono truncate dark:text-gray-400">
                {{ item.playerId }}
              </div>
            </div>
            <div class="text-sm text-amber-600 font-semibold dark:text-amber-400">
              {{ item.balance }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <AdjustBalanceDialog
      v-if="currentRow"
      ref="adjustDialogRef"
      :player-id="currentRow.playerId"
      :player-name="currentRow.playerName"
      @saved="onSaved"
    />

    <AccountDetailDialog
      v-if="detailPlayerId"
      ref="detailDialogRef"
      :player-id="detailPlayerId"
      @updated="onSaved"
    />
  </div>
</template>
