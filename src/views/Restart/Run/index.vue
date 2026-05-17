<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { runRestart } from '~/api/restart';
import { usePopup } from '~/composables';
import dayjs from '~/plugins/dayjs';

defineOptions({ name: 'RestartRunPage' });

const { t } = useI18n();
const { confirm, toast } = usePopup();

const isRunning = ref(false);
const lastRun = ref<API.Restart.Run | null>(null);

const runForm = reactive<API.Restart.RunRequest>({
  reason: null,
  warningLeadSecondsOverride: null,
  restartModeOverride: null,
});

const restartModeOptions = computed(() => [
  { label: t('views.restart.run.restartModeOptions.graceful'), value: 'Graceful' },
  { label: t('views.restart.run.restartModeOptions.force'), value: 'Force' },
]);

async function onRunNow() {
  const ok = await confirm({ text: t('views.restart.run.messages.runConfirm'), type: 'warning' });
  if (ok == false) {
    return;
  }

  isRunning.value = true;
  lastRun.value = null;
  try {
    const run = await runRestart({
      reason: runForm.reason || null,
      warningLeadSecondsOverride: runForm.warningLeadSecondsOverride ?? null,
      restartModeOverride: runForm.restartModeOverride || null,
    });
    lastRun.value = run;
    toast({
      type: run.succeeded ? 'success' : 'error',
      text: run.succeeded
        ? t('views.restart.run.messages.runSuccess')
        : (run.errorMessage || t('views.restart.run.messages.runFailed')),
    });
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isRunning.value = false;
  }
}

function formatDate(value: string | null | undefined): string {
  if (value == null) {
    return '—';
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null) {
    return '—';
  }
  return `${ms} ms`;
}
</script>

<template>
  <el-card shadow="never">
    <p class="text-sm text-gray-500 mb-4 dark:text-gray-400">
      {{ t('views.restart.run.description') }}
    </p>

    <el-form :model="runForm" label-position="top" :disabled="isRunning">
      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.restart.run.fields.reason')">
            <el-input v-model="runForm.reason" clearable />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.restart.run.fields.restartModeOverride')">
            <el-tooltip :content="t('views.restart.run.tooltips.restartModeOverride')" placement="top">
              <el-select v-model="runForm.restartModeOverride" clearable class="w-full">
                <el-option
                  v-for="opt in restartModeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-tooltip>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.restart.run.fields.warningLeadSecondsOverride')">
            <el-tooltip :content="t('views.restart.run.tooltips.warningLeadSecondsOverride')" placement="top">
              <el-input-number
                v-model="runForm.warningLeadSecondsOverride"
                :min="0"
                :precision="0"
                :value-on-clear="null"
                class="w-full"
                controls-position="right"
              />
            </el-tooltip>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div class="flex justify-end">
      <el-button type="danger" :loading="isRunning" @click="onRunNow">
        <el-icon><icon-mdi-restart /></el-icon>
        {{ t('views.restart.run.actions.run') }}
      </el-button>
    </div>

    <template v-if="lastRun">
      <el-divider />
      <el-descriptions
        :title="t('views.restart.run.result.title')"
        border
        :column="2"
      >
        <el-descriptions-item :label="t('views.restart.run.result.succeeded')">
          <el-tag :type="lastRun.succeeded ? 'success' : 'danger'" size="small">
            {{ lastRun.succeeded ? t('views.restart.run.result.succeeded') : t('views.restart.run.result.failed') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('views.restart.run.result.durationMs')">
          {{ formatDuration(lastRun.durationMs) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('views.restart.run.result.startedAt')">
          {{ formatDate(lastRun.startedAt) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('views.restart.run.result.endedAt')">
          {{ formatDate(lastRun.endedAt) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('views.restart.run.result.summary')" :span="2">
          {{ lastRun.summary || '—' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="lastRun.errorMessage" :label="t('views.restart.run.result.errorMessage')" :span="2">
          <span class="text-danger">{{ lastRun.errorMessage }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </template>
  </el-card>
</template>
