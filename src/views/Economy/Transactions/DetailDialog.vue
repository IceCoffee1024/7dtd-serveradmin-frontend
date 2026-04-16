<script setup lang="ts">
import dayjs from 'dayjs';

defineOptions({ name: 'EconomyTransactionDetailDialog' });

interface Props {
  transaction: API.Economy.Transaction | null;
}

defineProps<Props>();

const dialogRef = useTemplateRef('dialogRef');

function show() {
  dialogRef.value?.open();
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

defineExpose({ show });
</script>

<template>
  <MyDialog ref="dialogRef" :title="$t('views.economy.transactions.detailDialog.title')" :show-footer="false" width="min(960px, 92vw)">
    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-900/60">
        <div class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ $t('views.economy.transactions.detailDialog.sections.primary') }}
        </div>
        <div class="grid gap-3 text-sm md:grid-cols-[120px_minmax(0,1fr)]">
          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.occurredAt') }}</span>
          <span class="font-mono text-gray-800 dark:text-gray-100">{{ formatTimestamp(transaction?.occurredAt) }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.playerName') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.playerName || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.playerId') }}</span>
          <span class="font-mono text-gray-800 dark:text-gray-100">{{ transaction?.playerId || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.type') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.type || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.direction') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.direction || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.amount') }}</span>
          <span class="font-semibold text-amber-600 dark:text-amber-400">{{ transaction?.amount ?? '--' }}</span>
        </div>
      </div>

      <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-900/60">
        <div class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ $t('views.economy.transactions.detailDialog.sections.metadata') }}
        </div>
        <div class="grid gap-3 text-sm md:grid-cols-[120px_minmax(0,1fr)]">
          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.source') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.source || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.referenceId') }}</span>
          <span class="font-mono text-gray-800 dark:text-gray-100">{{ transaction?.referenceId || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.operatorName') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.operatorName || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.operatorId') }}</span>
          <span class="font-mono text-gray-800 dark:text-gray-100">{{ transaction?.operatorId || '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.balanceBefore') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.balanceBefore ?? '--' }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.economy.transactions.columns.balanceAfter') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ transaction?.balanceAfter ?? '--' }}</span>
        </div>
      </div>
    </div>

    <div class="mt-4 rounded-xl bg-gray-50 p-4 text-sm dark:bg-gray-900/60">
      <div class="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {{ $t('views.economy.transactions.columns.reason') }}
      </div>
      <div class="leading-6 text-gray-800 dark:text-gray-100">
        {{ transaction?.reason || '--' }}
      </div>
    </div>
  </MyDialog>
</template>