<script setup lang="ts">
import type { AuditLogDto } from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';

defineOptions({ name: 'AuditLogDetailDialog' });

const props = defineProps<Props>();

interface Props {
  log: AuditLogDto | null;
}

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
    <div class="gap-4 grid md:grid-cols-2">
      <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60">
        <div class="text-sm text-gray-900 font-semibold mb-3 dark:text-gray-100">
          {{ $t('views.auditLogs.detailDialog.sections.metadata') }}
        </div>
        <div class="text-sm gap-3 grid md:grid-cols-[120px_minmax(0,1fr)]">
          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.createdAt') }}</span>
          <span class="text-gray-800 font-mono dark:text-gray-100">{{ formatTimestamp(log?.createdAt) }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.source') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ log?.source || $t('views.auditLogs.empty.source') }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.operatorId') }}</span>
          <span class="text-gray-800 font-mono dark:text-gray-100">{{ log?.operatorId || $t('views.auditLogs.empty.operatorId') }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.operatorName') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ log?.operatorName || $t('views.auditLogs.empty.operatorName') }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.actionType') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ log?.actionType || $t('views.auditLogs.empty.actionType') }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.resourceType') }}</span>
          <span class="text-gray-800 dark:text-gray-100">{{ log?.resourceType || $t('views.auditLogs.empty.resourceType') }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.resourceId') }}</span>
          <span class="text-gray-800 font-mono dark:text-gray-100">{{ log?.resourceId || $t('views.auditLogs.empty.resourceId') }}</span>

          <span class="text-gray-500 dark:text-gray-400">{{ $t('views.auditLogs.columns.succeeded') }}</span>
          <span>
            <el-tag :type="log?.succeeded ? 'success' : 'danger'" effect="light">
              {{ log?.succeeded ? $t('common.yes') : $t('common.no') }}
            </el-tag>
          </span>
        </div>
      </div>

      <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60">
        <div class="text-sm text-gray-900 font-semibold mb-3 dark:text-gray-100">
          {{ $t('views.auditLogs.detailDialog.sections.summary') }}
        </div>
        <div class="space-y-4">
          <div>
            <div class="text-xs text-gray-500 tracking-[0.16em] font-semibold mb-2 uppercase dark:text-gray-400">
              {{ $t('views.auditLogs.columns.summary') }}
            </div>
            <div class="text-sm text-gray-800 leading-6 p-3 rounded-lg bg-white dark:text-gray-100 dark:bg-gray-950/70">
              {{ log?.summary || $t('views.auditLogs.empty.summary') }}
            </div>
          </div>

          <div>
            <div class="text-xs text-gray-500 tracking-[0.16em] font-semibold mb-2 uppercase dark:text-gray-400">
              {{ $t('views.auditLogs.columns.errorMessage') }}
            </div>
            <div class="text-sm text-red-600 leading-6 p-3 rounded-lg bg-white dark:text-red-400 dark:bg-gray-950/70">
              {{ log?.errorMessage || $t('views.auditLogs.empty.errorMessage') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="text-sm text-gray-100 mt-4 p-4 rounded-xl bg-gray-950">
      <div class="mb-3 flex gap-3 items-center justify-between">
        <div class="text-sm text-white font-semibold">
          {{ $t('views.auditLogs.detailDialog.sections.details') }}
        </div>
        <el-button plain size="small" @click="copyDetails">
          {{ $t('views.auditLogs.detailDialog.actions.copy') }}
        </el-button>
      </div>
      <pre class="leading-6 font-mono max-h-[40vh] whitespace-pre-wrap break-all overflow-auto">{{ formattedDetails }}</pre>
    </div>
  </MyDialog>
</template>
