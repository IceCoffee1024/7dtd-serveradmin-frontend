<script setup lang="ts">
import type {
  DiscordBotRuntimeStatusDto,
  DiscordNetworkDiagnosticsDto,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';

interface DiagnosticSummary {
  type: 'success' | 'error';
  title: string;
  description: string;
  passedCount: number;
  totalCount: number;
  requiredHealthyCount: number;
  requiredTotalCount: number;
}

interface Props {
  botStatus: DiscordBotRuntimeStatusDto | null;
  networkDiagnostics: DiscordNetworkDiagnosticsDto | null;
  networkDiagnosticSummary: DiagnosticSummary | null;
  isBotStatusLoading: boolean;
  isDiagnosticsRunning: boolean;
}

interface Emits {
  runDiagnostics: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

type DiagnosticStep = NonNullable<DiscordNetworkDiagnosticsDto['steps']>[number];

function getBotStatusTagType(state?: string | null) {
  switch ((state ?? '').toLowerCase()) {
    case 'connected':
      return 'success' as const;
    case 'connecting':
    case 'reconnecting':
      return 'warning' as const;
    case 'error':
    case 'unavailable':
      return 'danger' as const;
    default:
      return 'info' as const;
  }
}

function getDiagnosticTagType(succeeded?: boolean) {
  return succeeded ? 'success' : 'danger';
}

function findDiagnosticStep(key: string) {
  return props.networkDiagnostics?.steps?.find(step => step.key === key);
}

function getDiagnosticDisplayName(step: DiagnosticStep) {
  const key = `views.discordIntegration.settings.diagnostics.${step.key}`;
  const translated = t(key);
  return translated === key ? step.name : translated;
}

function isDiagnosticStepUserRelevant(step: DiagnosticStep) {
  if (step.key === 'gatewayWebSocket' && findDiagnosticStep('gatewayProxyTunnel')?.succeeded === true)
    return false;

  return true;
}

function getVisibleDiagnosticSteps() {
  return props.networkDiagnostics?.steps?.filter(isDiagnosticStepUserRelevant) ?? [];
}

function getAdvancedDiagnosticSteps() {
  return props.networkDiagnostics?.steps ?? [];
}

function formatBotTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}
</script>

<template>
  <div v-loading="props.isBotStatusLoading" class="discord-settings__bot-runtime">
    <div class="discord-settings__runtime-main">
      <div>
        <span class="discord-settings__runtime-label">{{ t('views.discordIntegration.settings.sections.botRuntime') }}</span>
        <strong>{{ props.botStatus?.message || t('views.discordIntegration.settings.messages.botStatusUnknown') }}</strong>
      </div>
      <el-tag :type="getBotStatusTagType(props.botStatus?.state)" effect="plain">
        {{ props.botStatus?.state || '-' }}
      </el-tag>
    </div>
    <div class="discord-settings__runtime-grid">
      <span>{{ t('views.discordIntegration.settings.fields.botUser') }}: {{ props.botStatus?.botUsername || '-' }}</span>
      <span>{{ t('views.discordIntegration.settings.fields.lastConnectedAt') }}: {{ formatBotTimestamp(props.botStatus?.lastConnectedAt) }}</span>
      <span>{{ t('views.discordIntegration.settings.fields.lastDisconnectedAt') }}: {{ formatBotTimestamp(props.botStatus?.lastDisconnectedAt) }}</span>
      <span>{{ t('views.discordIntegration.settings.fields.reconnectDelaySeconds') }}: {{ props.botStatus?.reconnectDelaySeconds ?? '-' }}</span>
    </div>
    <el-alert
      v-if="props.botStatus?.lastError"
      type="error"
      show-icon
      :closable="false"
      :title="props.botStatus.lastError"
    />
  </div>

  <div v-loading="props.isDiagnosticsRunning" class="discord-settings__diagnostics">
    <div class="discord-settings__runtime-main">
      <div>
        <span class="discord-settings__runtime-label">{{ t('views.discordIntegration.settings.sections.networkDiagnostics') }}</span>
        <strong>{{ t('views.discordIntegration.settings.messages.networkDiagnosticsHint') }}</strong>
      </div>
      <el-button size="small" :loading="props.isDiagnosticsRunning" @click="emit('runDiagnostics')">
        {{ t('views.discordIntegration.settings.actions.runDiagnostics') }}
      </el-button>
    </div>
    <div v-if="props.networkDiagnostics" class="discord-settings__runtime-grid">
      <span>{{ t('views.discordIntegration.settings.fields.proxy') }}: {{ props.networkDiagnostics.useProxy ? (props.networkDiagnostics.proxyUrl || '-') : '-' }}</span>
      <span>{{ t('views.discordIntegration.settings.fields.gatewayTarget') }}: {{ props.networkDiagnostics.gatewayUrl }}</span>
      <span>{{ t('views.discordIntegration.settings.fields.checkedAt') }}: {{ formatBotTimestamp(props.networkDiagnostics.checkedAt) }}</span>
    </div>
    <el-alert
      v-if="props.networkDiagnosticSummary"
      :type="props.networkDiagnosticSummary.type"
      show-icon
      :closable="false"
      :title="props.networkDiagnosticSummary.title"
    >
      <template #default>
        {{ props.networkDiagnosticSummary.description }}
      </template>
    </el-alert>
    <div v-if="props.networkDiagnostics" class="discord-settings__diagnostic-steps">
      <div
        v-for="step in getVisibleDiagnosticSteps()"
        :key="step.key"
        class="discord-settings__diagnostic-step"
      >
        <div class="discord-settings__diagnostic-step-main">
          <el-tag :type="getDiagnosticTagType(step.succeeded)" effect="plain" size="small">
            {{ step.succeeded ? t('views.discordIntegration.settings.status.passed') : t('views.discordIntegration.settings.status.failed') }}
          </el-tag>
          <div>
            <strong>{{ getDiagnosticDisplayName(step) }}</strong>
            <small>{{ step.elapsedMilliseconds }}ms</small>
          </div>
        </div>
        <p>{{ step.message }}</p>
      </div>
    </div>
    <el-collapse v-if="props.networkDiagnostics" class="discord-settings__diagnostic-advanced">
      <el-collapse-item name="diagnostics">
        <template #title>
          <span class="discord-settings__collapse-title">
            {{ t('views.discordIntegration.settings.sections.advancedDiagnostics') }}
          </span>
        </template>
        <div class="discord-settings__diagnostic-steps">
          <div
            v-for="step in getAdvancedDiagnosticSteps()"
            :key="`advanced-${step.key}`"
            class="discord-settings__diagnostic-step"
          >
            <div class="discord-settings__diagnostic-step-main">
              <el-tag :type="getDiagnosticTagType(step.succeeded)" effect="plain" size="small">
                {{ step.succeeded ? t('views.discordIntegration.settings.status.passed') : t('views.discordIntegration.settings.status.failed') }}
              </el-tag>
              <div>
                <strong>{{ getDiagnosticDisplayName(step) }}</strong>
                <small>{{ step.stage }} · {{ step.elapsedMilliseconds }}ms · {{ step.target }}</small>
              </div>
            </div>
            <p>{{ step.message }}</p>
            <el-alert
              v-if="step.error"
              type="error"
              show-icon
              :closable="false"
              :title="t('views.discordIntegration.settings.messages.rawDiagnosticError')"
            >
              <template #default>
                <pre class="discord-settings__diagnostic-error">{{ step.error }}</pre>
              </template>
            </el-alert>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
.discord-settings__bot-runtime {
  display: grid;
  gap: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  background: var(--el-bg-color);
}

.discord-settings__diagnostics {
  display: grid;
  gap: 10px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  padding: 12px;
  background: color-mix(in srgb, var(--el-bg-color) 78%, var(--el-fill-color-light));
}

.discord-settings__runtime-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  strong {
    display: block;
    margin-top: 2px;
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 20px;
  }
}

.discord-settings__runtime-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.discord-settings__runtime-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.discord-settings__diagnostic-steps {
  display: grid;
  gap: 8px;
}

.discord-settings__diagnostic-advanced {
  border: 0;

  :deep(.el-collapse-item__header) {
    height: 32px;
    border-bottom: 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: 0;
    background: transparent;
  }

  :deep(.el-collapse-item__content) {
    padding-bottom: 0;
  }
}

.discord-settings__diagnostic-step {
  display: grid;
  gap: 6px;
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px;
  background: var(--el-bg-color);

  p {
    margin: 0;
    color: var(--el-text-color-regular);
    font-size: 12px;
    line-height: 18px;
    overflow-wrap: anywhere;
  }
}

.discord-settings__diagnostic-error {
  max-height: 220px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 18px;
}

.discord-settings__diagnostic-step-main {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;

  strong,
  small {
    display: block;
    overflow-wrap: anywhere;
  }

  strong {
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 20px;
  }

  small {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }
}

@media (max-width: 768px) {
  .discord-settings__runtime-grid {
    grid-template-columns: 1fr;
  }
}
</style>
