<script setup lang="ts">
import type {
  DiscordBotRuntimeStatusDto,
  DiscordBotTestResultDto,
  DiscordNetworkDiagnosticsDto,
} from '~/generated/api/types.gen';
import { useI18n } from 'vue-i18n';
import BotRuntimePanel from './BotRuntimePanel.vue';

interface BotSettingsFormModel {
  enableBotIntegration: boolean;
  botToken: string;
  botGuildId: string;
  botPublicChannelId: string;
  botAdminChannelId: string;
  enableBotSlashCommands: boolean;
}

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
  form: BotSettingsFormModel;
  botTestResult: DiscordBotTestResultDto | null;
  botStatus: DiscordBotRuntimeStatusDto | null;
  networkDiagnostics: DiscordNetworkDiagnosticsDto | null;
  networkDiagnosticSummary: DiagnosticSummary | null;
  isSubmitting: boolean;
  isBotTesting: boolean;
  isBotStatusLoading: boolean;
  isDiagnosticsRunning: boolean;
  isSlashSyncing: boolean;
}

interface Emits {
  'update:form': [value: BotSettingsFormModel];
  'refreshBotStatus': [];
  'runDiagnostics': [];
  'syncSlashCommands': [];
  'testBot': [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

const botForm = computed({
  get: () => props.form,
  set: value => emit('update:form', value),
});

function updateFormField<Key extends keyof BotSettingsFormModel>(key: Key, value: BotSettingsFormModel[Key]) {
  emit('update:form', {
    ...props.form,
    [key]: value,
  });
}
</script>

<template>
  <section class="discord-settings__section discord-settings__section--bot">
    <div class="discord-settings__section-header">
      <div>
        <h3>{{ t('views.discordIntegration.settings.sections.botIntegration') }}</h3>
        <p>{{ t('views.discordIntegration.settings.sections.botIntegrationDescription') }}</p>
      </div>
      <el-switch
        :model-value="botForm.enableBotIntegration"
        inline-prompt
        :active-text="t('common.yes')"
        :inactive-text="t('common.no')"
        @update:model-value="value => updateFormField('enableBotIntegration', Boolean(value))"
      />
    </div>

    <div class="discord-settings__steps">
      <div class="discord-settings__step" :class="{ 'is-done': botForm.botToken.trim() }">
        <span>1</span>
        <div>
          <strong>{{ t('views.discordIntegration.settings.botSteps.token') }}</strong>
          <small>{{ t('views.discordIntegration.settings.botSteps.tokenHint') }}</small>
        </div>
      </div>
      <div class="discord-settings__step" :class="{ 'is-done': botForm.botPublicChannelId.trim() || botForm.botAdminChannelId.trim() }">
        <span>2</span>
        <div>
          <strong>{{ t('views.discordIntegration.settings.botSteps.channels') }}</strong>
          <small>{{ t('views.discordIntegration.settings.botSteps.channelsHint') }}</small>
        </div>
      </div>
      <div class="discord-settings__step" :class="{ 'is-done': props.botTestResult?.succeeded }">
        <span>3</span>
        <div>
          <strong>{{ t('views.discordIntegration.settings.botSteps.test') }}</strong>
          <small>{{ t('views.discordIntegration.settings.botSteps.testHint') }}</small>
        </div>
      </div>
    </div>

    <el-alert
      type="warning"
      show-icon
      :closable="false"
      :title="t('views.discordIntegration.settings.messages.botSecretWarning')"
    />
    <el-alert
      type="info"
      show-icon
      :closable="false"
      :title="t('views.discordIntegration.settings.messages.slashCommandRuntimeHint')"
    />

    <BotRuntimePanel
      :bot-status="props.botStatus"
      :network-diagnostics="props.networkDiagnostics"
      :network-diagnostic-summary="props.networkDiagnosticSummary"
      :is-bot-status-loading="props.isBotStatusLoading"
      :is-diagnostics-running="props.isDiagnosticsRunning"
      @run-diagnostics="emit('runDiagnostics')"
    />

    <el-row :gutter="12">
      <el-col :xs="24">
        <el-form-item prop="botToken" :label="t('views.discordIntegration.settings.fields.botToken')">
          <el-input
            :model-value="botForm.botToken"
            type="password"
            show-password
            clearable
            maxlength="256"
            autocomplete="new-password"
            :disabled="!botForm.enableBotIntegration"
            :placeholder="t('views.discordIntegration.settings.placeholders.botToken')"
            @update:model-value="value => updateFormField('botToken', value)"
          />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-form-item prop="botGuildId" :label="t('views.discordIntegration.settings.fields.botGuildId')">
          <el-input
            :model-value="botForm.botGuildId"
            clearable
            maxlength="64"
            :disabled="!botForm.enableBotIntegration"
            @update:model-value="value => updateFormField('botGuildId', value)"
          />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-form-item prop="botPublicChannelId" :label="t('views.discordIntegration.settings.fields.botPublicChannelId')">
          <el-input
            :model-value="botForm.botPublicChannelId"
            clearable
            maxlength="64"
            :disabled="!botForm.enableBotIntegration"
            @update:model-value="value => updateFormField('botPublicChannelId', value)"
          />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-form-item prop="botAdminChannelId" :label="t('views.discordIntegration.settings.fields.botAdminChannelId')">
          <el-input
            :model-value="botForm.botAdminChannelId"
            clearable
            maxlength="64"
            :disabled="!botForm.enableBotIntegration"
            @update:model-value="value => updateFormField('botAdminChannelId', value)"
          />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-form-item prop="enableBotSlashCommands" :label="t('views.discordIntegration.settings.fields.enableBotSlashCommands')">
          <el-switch
            :model-value="botForm.enableBotSlashCommands"
            :disabled="!botForm.enableBotIntegration"
            inline-prompt
            :active-text="t('common.yes')"
            :inactive-text="t('common.no')"
            @update:model-value="value => updateFormField('enableBotSlashCommands', Boolean(value))"
          />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="discord-settings__bot-test">
          <el-button :loading="props.isBotStatusLoading" :disabled="props.isSubmitting" @click="emit('refreshBotStatus')">
            {{ t('views.discordIntegration.settings.actions.refreshBotStatus') }}
          </el-button>
          <el-button :loading="props.isSlashSyncing" :disabled="props.isSubmitting || !botForm.enableBotIntegration || !botForm.enableBotSlashCommands" @click="emit('syncSlashCommands')">
            {{ t('views.discordIntegration.settings.actions.syncSlashCommands') }}
          </el-button>
          <el-button :loading="props.isBotTesting" :disabled="props.isSubmitting || !botForm.enableBotIntegration" @click="emit('testBot')">
            {{ t('views.discordIntegration.settings.actions.testBot') }}
          </el-button>
        </div>
      </el-col>
    </el-row>

    <el-alert
      v-if="props.botTestResult"
      :type="props.botTestResult.succeeded ? 'success' : 'error'"
      show-icon
      :closable="false"
      :title="props.botTestResult.message"
    >
      <template v-if="props.botTestResult.succeeded" #default>
        {{ t('views.discordIntegration.settings.messages.botTestSuccessDetail', {
          botUsername: props.botTestResult.botUsername || '-',
          botUserId: props.botTestResult.botUserId || '-',
        }) }}
      </template>
    </el-alert>
  </section>
</template>

<style scoped>
.discord-settings__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.discord-settings__step {
  display: flex;
  gap: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px;
  background: var(--el-bg-color);

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 24px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 600;
  }

  strong {
    display: block;
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 20px;
  }

  small {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }
}

.discord-settings__step.is-done span {
  background: var(--el-color-success-light-8);
  color: var(--el-color-success);
}

.discord-settings__bot-test {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: end;
  justify-content: flex-end;
  height: 100%;
  min-height: 54px;
}

@media (max-width: 768px) {
  .discord-settings__steps {
    grid-template-columns: 1fr;
  }

  .discord-settings__bot-test {
    justify-content: flex-start;
    min-height: auto;
  }
}
</style>
