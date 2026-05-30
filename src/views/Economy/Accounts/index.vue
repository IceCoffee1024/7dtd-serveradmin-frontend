<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type {
  EconomyAccountDto,
  EconomyAccountQueryOrder,
} from '~/generated/api/types.gen';
import type { EconomyLeaderboardRow } from '~/queries/economy';
import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';
import {
  economyDeleteAccountMutation,
  economyFreezeAccountMutation,
  economyGetAccountsQuery,
  economyGetLeaderboardQuery,
} from '~/generated/api/@pinia/colada.gen';
import {
  invalidateEconomyAndTransactionsQueries,
  toEconomyLeaderboardRows,
} from '~/queries/economy';
import AccountDetailDialog from './AccountDetailDialog.vue';
import AdjustBalanceDialog from './AdjustBalanceDialog.vue';
import BatchAdjustDialog from './BatchAdjustDialog.vue';

defineOptions({ name: 'EconomyAccountsPage' });

type AccountRow = EconomyAccountDto;

const { t } = useI18n();
const { confirm } = usePopup();
const queryCache = useQueryCache();
const tableRef = useTemplateRef('tableRef');
const adjustDialogRef = useTemplateRef('adjustDialogRef');
const detailDialogRef = useTemplateRef('detailDialogRef');
const batchAdjustDialogRef = useTemplateRef('batchAdjustDialogRef');
const currentRow = ref<AccountRow | null>(null);
const detailPlayerId = ref('');
const leaderboardQuery = useQuery(economyGetLeaderboardQuery());
const deleteAccountMutation = useMutation({
  ...economyDeleteAccountMutation(),
  async onSettled() {
    await invalidateEconomyAndTransactionsQueries();
  },
});
const freezeAccountMutation = useMutation({
  ...economyFreezeAccountMutation(),
  async onSettled() {
    await invalidateEconomyAndTransactionsQueries();
  },
});
const leaderboard = computed<EconomyLeaderboardRow[]>(() =>
  toEconomyLeaderboardRows(leaderboardQuery.data.value ?? []),
);

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
]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<AccountRow>> {
  const options = economyGetAccountsQuery({
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      keyword: params.search?.keyword?.trim() || undefined,
      playerId: toOptionalString(params.search?.playerId),
      playerName: toOptionalString(params.search?.playerName),
      isFrozen: typeof params.search?.isFrozen === 'boolean' ? params.search.isFrozen : undefined,
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

async function refreshLeaderboard() {
  try {
    const state = await leaderboardQuery.refetch(true);
    if (state.status === 'error') {
      throw state.error;
    }
  }
  catch (error) {
    console.error(error);
  }
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

function toOrder(sortField: string | undefined): EconomyAccountQueryOrder | undefined {
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

function onBatchAdjust() {
  batchAdjustDialogRef.value?.show();
}

async function onDelete(row: AccountRow) {
  const ok = await confirm({
    type: 'warning',
    text: t('views.economy.accounts.deleteConfirm', { playerName: row.playerName }),
  });
  if (!ok) {
    return;
  }

  try {
    await deleteAccountMutation.mutateAsync({ path: { playerId: row.playerId } });
    tableRef.value?.reload();
    await refreshLeaderboard();
  }
  catch (error) {
    console.error(error);
  }
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
  try {
    await freezeAccountMutation.mutateAsync({
      path: { playerId: row.playerId },
      body: { isFrozen: !row.isFrozen },
    });
    tableRef.value?.reload();
    await refreshLeaderboard();
  }
  catch (error) {
    console.error(error);
  }
}

async function onSaved() {
  tableRef.value?.reload();
  await refreshLeaderboard();
}
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
        :operation-column-width="270"
        :auto-column-width="true"
        :search-collapsible="true"
      >
        <template #toolbar-left>
          <el-button type="primary" plain @click="onBatchAdjust">
            {{ t('views.economy.accounts.actions.batchAdjust') }}
          </el-button>
        </template>

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

        <template #operation="{ row }">
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
            <el-button size="small" type="danger" plain @click="onDelete(row)">
              {{ t('views.economy.accounts.actions.delete') }}
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
          <div v-for="item in leaderboard" :key="item.playerId" class="px-3 py-2 rounded-3 bg-gray-50 flex gap-3 items-center justify-between dark:bg-gray-800/70">
            <div class="min-w-0">
              <div class="text-xs text-gray-400 tracking-[0.16em] uppercase">
                #{{ item.rank }}
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

    <BatchAdjustDialog
      ref="batchAdjustDialogRef"
      @saved="onSaved"
    />
  </div>
</template>
