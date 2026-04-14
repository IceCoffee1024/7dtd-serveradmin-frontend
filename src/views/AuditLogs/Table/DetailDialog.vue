<script setup lang="ts">
import dayjs from 'dayjs';
import { usePopup } from '~/composables';
import { useI18n } from 'vue-i18n';

defineOptions({ name: 'AuditLogDetailDialog' });

interface Props {
  log: API.AuditLog.Item | null;
}

const props = defineProps<Props>();
const dialogRef = useTemplateRef('dialogRef');
const { t } = useI18n();
const { toast } = usePopup();

const formattedDetails = computed(() => {
  const details = props.log?.details;
  if (!details) {
    return t('views.auditLogs.empty.details');
  }

  try {
    return JSON.stringify(JSON.parse(details), null, 2);
  }
  catch {
    return details;
  }
});

function show() {
  dialogRef.value?.open();
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return t('views.auditLogs.empty.timestamp');
  }

  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Copies the formatted details payload for incident triage and sharing.
 * @returns Promise that resolves when the clipboard operation finishes.
 */
async function copyDetails(): Promise<void> {
  try {
    await navigator.clipboard.writeText(formattedDetails.value);
    toast({ type: 'success', text: t('views.auditLogs.detailDialog.messages.copySuccess') });
  }
  catch {
    toast({ type: 'error', text: t('views.auditLogs.detailDialog.messages.copyFailed') });
  }
}

defineExpose({
  show,
});
</script>

<template>
  <MyDialog
    ref="dialogRef"
    :title="$t('views.auditLogs.detailDialog.title')"
    :show-footer="false"
    width="min(960px, 92vw)"
  >
    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-900/60">
        <div class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ $t('views.auditLogs.detailDialog.sections.metadata') }}
        </div>
        <div class="grid gap-3 text-sm md:grid-cols-[120px_minmax(0,1fr)]">
          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.createdAt') }}</span>
          <span class="font-mono text-gray-800 dark:text-gray-100">{{ formatTimestamp(log?.createdAt) }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.source') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ log?.source || $t('views.auditLogs.empty.source') }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.operatorId') }}</span>
          <span class="font-mono text-gray-800 dark:text-gray-100">{{ log?.operatorId || $t('views.auditLogs.empty.operatorId') }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.operatorName') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ log?.operatorName || $t('views.auditLogs.empty.operatorName') }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.actionType') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ log?.actionType || $t('views.auditLogs.empty.actionType') }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.resourceType') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ log?.resourceType || $t('views.auditLogs.empty.resourceType') }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.resourceId') }}</span>
          <span class="font-mono text-gray-800 dark:text-gray-100">{{ log?.resourceId || $t('views.auditLogs.empty.resourceId') }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.succeeded') }}</span>
          <span>
            <el-tag :type="log?.succeeded ? 'success' : 'danger'" effect="light">
              {{ log?.succeeded ? $t('common.yes') : $t('common.no') }}
            </el-tag>
          </span>
        </div>
      </div>

      <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-900/60">
        <div class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ $t('views.auditLogs.detailDialog.sections.summary') }}
        </div>
        <div class="space-y-4">
          <div>
            <div class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              {{ $t('views.auditLogs.columns.summary') }}
            </div>
            <div class="rounded-lg bg-white p-3 text-sm leading-6 text-gray-800 dark:bg-gray-950/70 dark:text-gray-100">
              {{ log?.summary || $t('views.auditLogs.empty.summary') }}
            </div>
          </div>

          <div>
            <div class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              {{ $t('views.auditLogs.columns.errorMessage') }}
            </div>
            <div class="rounded-lg bg-white p-3 text-sm leading-6 text-red-600 dark:bg-gray-950/70 dark:text-red-400">
              {{ log?.errorMessage || $t('views.auditLogs.empty.errorMessage') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 rounded-xl bg-gray-950 p-4 text-sm text-gray-100">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="text-sm font-semibold text-white">
          {{ $t('views.auditLogs.detailDialog.sections.details') }}
        </div>
        <el-button plain size="small" @click="copyDetails">
          {{ $t('views.auditLogs.detailDialog.actions.copy') }}
        </el-button>
      </div>
      <pre class="max-h-[40vh] overflow-auto whitespace-pre-wrap break-all font-mono leading-6">{{ formattedDetails }}</pre>
    </div>
  </MyDialog>
</template>