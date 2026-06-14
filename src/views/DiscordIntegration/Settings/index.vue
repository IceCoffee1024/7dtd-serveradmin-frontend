<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import type { FormModel, WebhookTargetFormModel } from './formModel';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import { usePopup } from '~/composables';
import AccountBindingSection from './components/AccountBindingSection.vue';
import BotIntegrationSection from './components/BotIntegrationSection.vue';
import ChatBridgeSection from './components/ChatBridgeSection.vue';
import CommandRelaySection from './components/CommandRelaySection.vue';
import FailureAlertsSection from './components/FailureAlertsSection.vue';
import NetworkProxySection from './components/NetworkProxySection.vue';
import RelayTestsSection from './components/RelayTestsSection.vue';
import SettingsHero from './components/SettingsHero.vue';
import WebhookTargetsSection from './components/WebhookTargetsSection.vue';
import { applyFormValues, buildDefaults, rules } from './formModel';
import { useDiscordSettingsRuntime } from './useDiscordSettingsRuntime';
import './components/sharedSectionStyles.css';

defineOptions({ name: 'DiscordIntegrationSettingsPage' });

const { t } = useI18n();
const { confirm } = usePopup();

const formRef = useTemplateRef<FormInstance>('formRef');
const testMessage = ref('');
const testWebhookTargetKey = ref('');
const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const botFormModel = computed({
  get: () => form,
  set: (value: FormModel) => applyFormValues(form, { ...form, ...value }),
});
const webhookTargetsModel = computed({
  get: () => form.webhookTargets,
  set: (value: WebhookTargetFormModel[]) => form.webhookTargets = value.map(target => ({ ...target })),
});
const commandRelayModel = computed({
  get: () => form,
  set: (value: FormModel) => applyFormValues(form, { ...form, ...value }),
});
const chatBridgeModel = computed({
  get: () => form,
  set: (value: FormModel) => applyFormValues(form, { ...form, ...value }),
});
const networkProxyModel = computed({
  get: () => form,
  set: (value: FormModel) => applyFormValues(form, { ...form, ...value }),
});
const failureAlertsModel = computed({
  get: () => form,
  set: (value: FormModel) => applyFormValues(form, { ...form, ...value }),
});
const isDirty = computed(() => !isEqual(form, initialValues.value));
const isWebhookConfigured = computed(() => form.webhookUrl.trim().length > 0 || form.webhookTargets.some(target => target.isEnabled && target.webhookUrl.trim().length > 0));
const isBotConfigured = computed(() => form.enableBotIntegration && form.botToken.trim().length > 0);
const statusCards = computed(() => [
  {
    key: 'integration',
    label: t('views.discordIntegration.settings.statusCards.integration'),
    value: form.isEnabled ? t('common.enabled') : t('common.disabled'),
    type: form.isEnabled ? 'success' as const : 'info' as const,
    isActive: form.isEnabled,
  },
  {
    key: 'webhook',
    label: t('views.discordIntegration.settings.statusCards.webhook'),
    value: isWebhookConfigured.value ? t('views.discordIntegration.settings.status.configured') : t('views.discordIntegration.settings.status.missing'),
    type: isWebhookConfigured.value ? 'success' as const : 'warning' as const,
    isActive: isWebhookConfigured.value,
  },
  {
    key: 'bot',
    label: t('views.discordIntegration.settings.statusCards.bot'),
    value: isBotConfigured.value ? t('views.discordIntegration.settings.status.configured') : t('views.discordIntegration.settings.status.notConfigured'),
    type: isBotConfigured.value ? 'success' as const : 'info' as const,
    isActive: isBotConfigured.value,
  },
  {
    key: 'commandRelay',
    label: t('views.discordIntegration.settings.statusCards.commandRelay'),
    value: form.enableDiscordCommandExecution ? t('common.enabled') : t('common.disabled'),
    type: form.enableDiscordCommandExecution ? 'warning' as const : 'info' as const,
    isActive: form.enableDiscordCommandExecution,
  },
  {
    key: 'accountBinding',
    label: t('views.discordIntegration.settings.statusCards.accountBinding'),
    value: form.enableAccountBinding ? t('common.enabled') : t('common.disabled'),
    type: form.enableAccountBinding ? 'success' as const : 'info' as const,
    isActive: form.enableAccountBinding,
  },
]);
const webhookTargetOptions = computed(() =>
  form.webhookTargets
    .filter(target => target.key.trim().length > 0)
    .map(target => ({
      label: `${target.displayName.trim() || target.key.trim()} (${target.key.trim()})`,
      value: target.key.trim(),
    })),
);
const {
  isLoading,
  isSubmitting,
  isTesting,
  isBotTesting,
  isBotStatusLoading,
  isDiagnosticsRunning,
  isSlashSyncing,
  botTestResult,
  botStatus,
  networkDiagnostics,
  networkDiagnosticSummary,
  loadBotStatus,
  runNetworkDiagnostics,
  loadSettings,
  onSubmit,
  onReset,
  onTestWebhook,
  onTestBot,
  onSyncSlashCommands,
} = useDiscordSettingsRuntime({
  formRef,
  form,
  initialValues,
  isDirty,
  testMessage,
  testWebhookTargetKey,
});

onMounted(loadSettings);
onMounted(loadBotStatus);

onBeforeRouteLeave(async () => {
  if (!isDirty.value)
    return true;

  return await confirm({
    type: 'warning',
    text: t('views.discordIntegration.settings.messages.unsavedChanges'),
  });
});
</script>

<template>
  <div class="discord-settings">
    <div v-if="isLoading" class="flex flex-col gap-4">
      <el-skeleton v-for="index in 4" :key="index" animated>
        <template #template>
          <el-skeleton-item variant="text" class="h-8" />
        </template>
      </el-skeleton>
    </div>

    <template v-else>
      <SettingsHero
        :title="t('menus.discordIntegration')"
        :description="t('views.discordIntegration.settings.description')"
        :status-cards="statusCards"
        :is-submitting="isSubmitting"
        :is-testing="isTesting"
        :is-dirty="isDirty"
        @reset="onReset"
        @test-webhook="onTestWebhook"
        @submit="onSubmit"
      />

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="discord-settings__form"
        @submit.prevent="onSubmit"
      >
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item prop="isEnabled" :label="t('views.discordIntegration.settings.fields.isEnabled')">
              <el-switch
                v-model="form.isEnabled"
                inline-prompt
                :active-text="t('common.yes')"
                :inactive-text="t('common.no')"
                size="large"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="12">
            <el-form-item prop="allowEventAutomationMessages" :label="t('views.discordIntegration.settings.fields.allowEventAutomationMessages')">
              <el-switch
                v-model="form.allowEventAutomationMessages"
                inline-prompt
                :active-text="t('common.yes')"
                :inactive-text="t('common.no')"
                size="large"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24">
            <ChatBridgeSection v-model:model="chatBridgeModel" :webhook-target-options="webhookTargetOptions" />
          </el-col>

          <el-col :xs="24">
            <BotIntegrationSection
              v-model:form="botFormModel"
              :bot-test-result="botTestResult"
              :bot-status="botStatus"
              :network-diagnostics="networkDiagnostics"
              :network-diagnostic-summary="networkDiagnosticSummary"
              :is-submitting="isSubmitting"
              :is-bot-testing="isBotTesting"
              :is-bot-status-loading="isBotStatusLoading"
              :is-diagnostics-running="isDiagnosticsRunning"
              :is-slash-syncing="isSlashSyncing"
              @refresh-bot-status="loadBotStatus"
              @run-diagnostics="runNetworkDiagnostics"
              @sync-slash-commands="onSyncSlashCommands"
              @test-bot="onTestBot"
            />
          </el-col>

          <el-col :xs="24">
            <el-form-item prop="webhookUrl" :label="t('views.discordIntegration.settings.fields.webhookUrl')">
              <el-input
                v-model="form.webhookUrl"
                type="password"
                show-password
                clearable
                autocomplete="off"
                :placeholder="t('views.discordIntegration.settings.placeholders.webhookUrl')"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24">
            <NetworkProxySection v-model:model="networkProxyModel" />
          </el-col>

          <el-col :xs="24">
            <WebhookTargetsSection v-model:targets="webhookTargetsModel" />
          </el-col>

          <el-col :xs="24">
            <CommandRelaySection v-model:model="commandRelayModel" />
          </el-col>

          <el-col :xs="24">
            <AccountBindingSection />
          </el-col>

          <el-col :xs="24">
            <RelayTestsSection />
          </el-col>

          <el-col :xs="24" :md="12">
            <el-form-item prop="defaultUsername" :label="t('views.discordIntegration.settings.fields.defaultUsername')">
              <el-input
                v-model="form.defaultUsername"
                clearable
                maxlength="80"
                show-word-limit
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="12">
            <el-form-item prop="timeoutSeconds" :label="t('views.discordIntegration.settings.fields.timeoutSeconds')">
              <el-input-number
                v-model="form.timeoutSeconds"
                class="w-full"
                :min="1"
                :max="30"
                :precision="0"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24">
            <el-form-item prop="defaultAvatarUrl" :label="t('views.discordIntegration.settings.fields.defaultAvatarUrl')">
              <el-input
                v-model="form.defaultAvatarUrl"
                clearable
                :placeholder="t('views.discordIntegration.settings.placeholders.defaultAvatarUrl')"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24">
            <FailureAlertsSection v-model:model="failureAlertsModel" :webhook-target-options="webhookTargetOptions" />
          </el-col>

          <el-col :xs="24">
            <el-form-item :label="t('views.discordIntegration.settings.fields.testMessage')">
              <el-input
                v-model="testMessage"
                type="textarea"
                :rows="3"
                maxlength="1900"
                show-word-limit
                clearable
                :placeholder="t('views.discordIntegration.settings.placeholders.testMessage')"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="12">
            <el-form-item :label="t('views.discordIntegration.settings.fields.testWebhookTargetKey')">
              <el-select
                v-model="testWebhookTargetKey"
                class="w-full"
                filterable
                clearable
                :placeholder="t('views.discordIntegration.settings.placeholders.testWebhookTargetKey')"
              >
                <el-option
                  v-for="option in webhookTargetOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </template>
  </div>
</template>

<style scoped>
.discord-settings {
  min-height: 0;
  max-width: 1360px;
}

.discord-settings__form {
  width: min(100%, 1100px);
}

@media (max-width: 768px) {
  .discord-settings {
    max-width: none;
  }
}
</style>
