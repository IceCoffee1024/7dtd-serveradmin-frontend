<script setup lang="ts">
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import * as api from '~/api/economy';
import { usePopup } from '~/composables';
import AdjustBalanceDialog from './AdjustBalanceDialog.vue';

defineOptions({ name: 'EconomyAccountDetailDialog' });

const props = defineProps<Props>();

const emit = defineEmits<{ updated: [] }>();

interface Props {
  playerId: string;
}

const { t } = useI18n();
const { toast } = usePopup();

const dialogRef = useTemplateRef('dialogRef');
const adjustDialogRef = useTemplateRef('adjustDialogRef');
const isLoading = ref(false);
const isUpdating = ref(false);
const detail = ref<API.Economy.AccountDetail | null>(null);
const recentTransactions = ref<API.Economy.Transaction[]>([]);

async function loadRecentTransactions(playerId: string) {
  try {
    const response = await api.getTransactions({
      pageNumber: 1,
      pageSize: 5,
      playerId,
      order: 'OccurredAt',
      desc: true,
    });
    recentTransactions.value = response.items;
  }
  catch (error) {
    console.error(error);
    recentTransactions.value = [];
  }
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

async function loadDetail(playerId: string) {
  isLoading.value = true;
  detail.value = null;
  recentTransactions.value = [];
  try {
    const [detailResponse] = await Promise.all([
      api.getAccount(playerId),
      loadRecentTransactions(playerId),
    ]);
    detail.value = detailResponse;
  }
  catch (error) {
    console.error(error);
    recentTransactions.value = [];
    toast({
      type: 'error',
      text: t('views.economy.accounts.detailDialog.messages.loadFailed'),
    });
  }
  finally {
    isLoading.value = false;
  }
}

async function onToggleFrozen() {
  if (!detail.value) {
    return;
  }

  isUpdating.value = true;
  try {
    await api.setAccountFrozen(detail.value.playerId, !detail.value.isFrozen);
    await loadDetail(detail.value.playerId);
    emit('updated');
    toast({
      type: 'success',
      text: t('views.economy.accounts.detailDialog.messages.freezeSuccess'),
    });
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isUpdating.value = false;
  }
}

async function show(playerId?: string) {
  const targetPlayerId = playerId || props.playerId;
  dialogRef.value?.open();
  await loadDetail(targetPlayerId);
}

function onAdjust() {
  adjustDialogRef.value?.show();
}

async function onAdjusted() {
  if (!detail.value) {
    return;
  }

  await loadDetail(detail.value.playerId);
  emit('updated');
}

function formatTransactionAmount(transaction: API.Economy.Transaction): string {
  return `${transaction.direction === 'Income' ? '+' : '-'}${transaction.amount}`;
}

defineExpose({ show });
</script>

<template>
  <MyDialog
    ref="dialogRef"
    :title="t('views.economy.accounts.detailDialog.title')"
    width="min(920px, 92vw)"
    :show-footer="false"
  >
    <div v-loading="isLoading" class="flex flex-col gap-4 min-h-52">
      <template v-if="detail">
        <div class="flex flex-wrap gap-2 justify-end">
          <el-button size="small" plain @click="onAdjust">
            {{ t('views.economy.accounts.actions.adjust') }}
          </el-button>
          <el-button size="small" plain :loading="isUpdating" @click="onToggleFrozen">
            {{ detail.isFrozen ? t('views.economy.accounts.actions.unfreeze') : t('views.economy.accounts.actions.freeze') }}
          </el-button>
        </div>

        <div class="gap-4 grid md:grid-cols-2">
          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60">
            <div class="text-sm text-gray-900 font-semibold mb-3 dark:text-gray-100">
              {{ t('views.economy.accounts.detailDialog.sections.overview') }}
            </div>
            <div class="text-sm gap-3 grid md:grid-cols-[120px_minmax(0,1fr)]">
              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.columns.playerName') }}</span>
              <span class="text-gray-800 dark:text-gray-100">{{ detail.playerName || '--' }}</span>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.columns.playerId') }}</span>
              <span class="text-gray-800 font-mono dark:text-gray-100">{{ detail.playerId }}</span>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.columns.balance') }}</span>
              <span class="text-amber-600 font-semibold dark:text-amber-400">{{ detail.balance }}</span>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.columns.isFrozen') }}</span>
              <div>
                <el-tag :type="detail.isFrozen ? 'danger' : 'success'">
                  {{ detail.isFrozen ? t('common.yes') : t('common.no') }}
                </el-tag>
              </div>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.detailDialog.fields.createdAt') }}</span>
              <span class="text-gray-800 font-mono dark:text-gray-100">{{ formatTimestamp(detail.createdAt) }}</span>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.detailDialog.fields.updatedAt') }}</span>
              <span class="text-gray-800 font-mono dark:text-gray-100">{{ formatTimestamp(detail.updatedAt) }}</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60">
            <div class="text-sm text-gray-900 font-semibold mb-3 dark:text-gray-100">
              {{ t('views.economy.accounts.detailDialog.sections.activity') }}
            </div>
            <div class="text-sm gap-3 grid md:grid-cols-[140px_minmax(0,1fr)]">
              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.columns.lastTransactionAt') }}</span>
              <span class="text-gray-800 font-mono dark:text-gray-100">{{ formatTimestamp(detail.lastTransactionAt) }}</span>

              <span class="text-gray-500 dark:text-gray-400">{{ t('views.economy.accounts.detailDialog.fields.lastDailyClaimAt') }}</span>
              <span class="text-gray-800 font-mono dark:text-gray-100">{{ formatTimestamp(detail.lastDailyClaimAt) }}</span>
            </div>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60">
          <div class="mb-3 flex gap-3 items-center justify-between">
            <div class="text-sm text-gray-900 font-semibold dark:text-gray-100">
              {{ t('views.economy.accounts.detailDialog.sections.recentTransactions') }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('views.economy.accounts.detailDialog.hints.recentTransactions') }}
            </div>
          </div>

          <div v-if="recentTransactions.length === 0" class="text-sm text-gray-500 py-4 text-center dark:text-gray-400">
            {{ t('views.economy.accounts.detailDialog.empty.recentTransactions') }}
          </div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="transaction in recentTransactions"
              :key="transaction.id"
              class="px-3 py-3 rounded-lg bg-white flex gap-3 items-center justify-between dark:bg-gray-800/70"
            >
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap gap-x-3 gap-y-1 items-center">
                  <span class="text-sm text-gray-900 font-semibold dark:text-gray-100">{{ transaction.type }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ transaction.source }}</span>
                </div>
                <div class="text-xs text-gray-500 font-mono mt-1 dark:text-gray-400">
                  {{ formatTimestamp(transaction.occurredAt) }}
                </div>
                <div class="text-sm text-gray-700 mt-1 dark:text-gray-200">
                  {{ transaction.reason || t('views.economy.accounts.detailDialog.empty.reason') }}
                </div>
              </div>
              <div class="text-right shrink-0">
                <div
                  class="text-sm font-semibold"
                  :class="transaction.direction === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
                >
                  {{ formatTransactionAmount(transaction) }}
                </div>
                <div class="text-xs text-gray-500 mt-1 dark:text-gray-400">
                  {{ t('views.economy.transactions.columns.balanceAfter') }}: {{ transaction.balanceAfter }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <AdjustBalanceDialog
      v-if="detail"
      ref="adjustDialogRef"
      :player-id="detail.playerId"
      :player-name="detail.playerName"
      @saved="onAdjusted"
    />
  </MyDialog>
</template>
