<script setup lang="ts">
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';

interface Props {
  runData?: API.Scheduler.Run | null;
}

interface DialogExpose {
  show: () => Promise<void> | void;
  close: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  runData: null,
});

const dialogRef = useTemplateRef<DialogExpose>('dialogRef');
const { t } = useI18n();

const dialogTitle = computed(() => (
  props.runData?.taskName
    ? t('views.scheduler.history.detailDialog.titleWithName', { name: props.runData.taskName })
    : t('views.scheduler.history.detailDialog.title')
));

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function formatDuration(value: number | null | undefined): string {
  return value == null ? '--' : `${value} ms`;
}

function prettyJson(value: string | null | undefined): string {
  if (!value || value.trim().length === 0) {
    return '--';
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  }
  catch {
    return value;
  }
}

function show() {
  dialogRef.value?.open();
}

function close() {
  dialogRef.value?.close();
}

defineExpose({
  show,
  close,
});
</script>

<template>
  <MyDialog ref="dialogRef" :title="dialogTitle" width="64rem" :show-footer="false">
    <div v-if="runData" class="flex flex-col gap-4">
      <el-descriptions :column="2" border class="w-full">
        <el-descriptions-item :label="$t('views.scheduler.history.columns.taskName')">
          {{ runData.taskName }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('views.scheduler.history.columns.taskType')">
          {{ runData.taskType }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('views.scheduler.history.columns.triggerSource')">
          {{ runData.triggerSource }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('views.scheduler.history.columns.succeeded')">
          <el-tag :type="runData.succeeded ? 'success' : 'danger'">
            {{ runData.succeeded ? $t('common.yes') : $t('common.no') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('views.scheduler.history.columns.startedAt')">
          {{ formatTimestamp(runData.startedAt) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('views.scheduler.history.columns.endedAt')">
          {{ formatTimestamp(runData.endedAt) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('views.scheduler.history.columns.durationMs')">
          {{ formatDuration(runData.durationMs) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('views.scheduler.history.columns.operatorName')">
          {{ runData.operatorName || $t('common.unknown') }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('views.scheduler.history.columns.sourceIp')">
          {{ runData.sourceIp || $t('common.unknown') }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-4 border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
          <div class="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ $t('views.scheduler.history.columns.summary') }}
          </div>
          <div class="text-sm leading-6 text-gray-700 whitespace-pre-wrap dark:text-gray-200">
            {{ runData.summary }}
          </div>
        </div>
        <div class="rounded-4 border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
          <div class="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ $t('views.scheduler.history.columns.errorMessage') }}
          </div>
          <div class="text-sm leading-6 text-gray-700 whitespace-pre-wrap dark:text-gray-200">
            {{ runData.errorMessage || $t('common.unknown') }}
          </div>
        </div>
      </div>

      <div class="rounded-4 border border-gray-200 bg-gray-900 p-4 text-gray-100 dark:border-gray-700">
        <div class="mb-2 text-sm font-semibold">
          {{ $t('views.scheduler.history.detailDialog.details') }}
        </div>
        <pre class="overflow-auto whitespace-pre-wrap break-words text-xs leading-6">{{ prettyJson(runData.detailsJson) }}</pre>
      </div>
    </div>
  </MyDialog>
</template>