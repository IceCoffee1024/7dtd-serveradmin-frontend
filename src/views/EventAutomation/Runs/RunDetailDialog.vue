<script setup lang="ts">
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';

export interface EventAutomationRunLogRow {
  id: number;
  createdAt: string;
  ruleId: number;
  ruleName: string;
  triggerType: string;
  playerId?: string | null;
  playerName: string;
  entityId?: number | null;
  chatType?: string | null;
  message?: string | null;
  startedAt: string;
  endedAt: string;
  succeeded: boolean;
  status: string;
  summary: string;
  errorMessage?: string | null;
  detailsJson?: string | null;
  durationMs: number;
}

const props = defineProps<{
  runData: EventAutomationRunLogRow | null;
}>();

const { t } = useI18n();
const visible = ref(false);

const formattedDetailsJson = computed(() => {
  if (!props.runData?.detailsJson)
    return '--';

  try {
    return JSON.stringify(JSON.parse(props.runData.detailsJson), null, 2);
  }
  catch {
    return props.runData.detailsJson;
  }
});

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function show() {
  visible.value = true;
}

defineExpose({ show });
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('views.eventAutomation.runs.detail.title')"
    width="760px"
    destroy-on-close
  >
    <div v-if="runData" class="event-automation-run-detail">
      <div class="event-automation-run-detail__grid">
        <div>
          <span>{{ t('views.eventAutomation.runs.columns.ruleName') }}</span>
          <strong>{{ runData.ruleName }}</strong>
        </div>
        <div>
          <span>{{ t('views.eventAutomation.runs.columns.triggerType') }}</span>
          <strong>{{ runData.triggerType }}</strong>
        </div>
        <div>
          <span>{{ t('views.eventAutomation.runs.columns.playerName') }}</span>
          <strong>{{ runData.playerName || '--' }}</strong>
        </div>
        <div>
          <span>{{ t('views.eventAutomation.runs.columns.playerId') }}</span>
          <strong>{{ runData.playerId || '--' }}</strong>
        </div>
        <div>
          <span>{{ t('views.eventAutomation.runs.columns.startedAt') }}</span>
          <strong>{{ formatTimestamp(runData.startedAt) }}</strong>
        </div>
        <div>
          <span>{{ t('views.eventAutomation.runs.columns.endedAt') }}</span>
          <strong>{{ formatTimestamp(runData.endedAt) }}</strong>
        </div>
        <div>
          <span>{{ t('views.eventAutomation.runs.columns.durationMs') }}</span>
          <strong>{{ runData.durationMs }} ms</strong>
        </div>
        <div>
          <span>{{ t('views.eventAutomation.runs.columns.status') }}</span>
          <el-tag :type="runData.succeeded ? 'success' : 'danger'">
            {{ runData.status }}
          </el-tag>
        </div>
      </div>

      <section>
        <h3>{{ t('views.eventAutomation.runs.columns.summary') }}</h3>
        <p>{{ runData.summary || '--' }}</p>
      </section>

      <section v-if="runData.message">
        <h3>{{ t('views.eventAutomation.runs.columns.message') }}</h3>
        <p>{{ runData.message }}</p>
      </section>

      <section v-if="runData.errorMessage">
        <h3>{{ t('views.eventAutomation.runs.columns.errorMessage') }}</h3>
        <p class="event-automation-run-detail__error">
          {{ runData.errorMessage }}
        </p>
      </section>

      <section>
        <h3>{{ t('views.eventAutomation.runs.detail.detailsJson') }}</h3>
        <pre>{{ formattedDetailsJson }}</pre>
      </section>
    </div>

    <template #footer>
      <el-button @click="visible = false">
        {{ t('common.close') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.event-automation-run-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.event-automation-run-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.event-automation-run-detail__grid > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.event-automation-run-detail span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.event-automation-run-detail strong {
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.event-automation-run-detail h3 {
  margin: 0 0 6px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.event-automation-run-detail p {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.5;
}

.event-automation-run-detail__error {
  color: var(--el-color-danger);
}

.event-automation-run-detail pre {
  max-height: 280px;
  overflow: auto;
  margin: 0;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  padding: 10px;
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 640px) {
  .event-automation-run-detail__grid {
    grid-template-columns: 1fr;
  }
}
</style>
