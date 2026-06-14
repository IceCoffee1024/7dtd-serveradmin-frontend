<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import type {
  DiscordBotRuntimeStatusDto,
  DiscordBotTestResultDto,
  DiscordIntegrationFeatureSettingsDto,
  DiscordNetworkDiagnosticsDto,
  DiscordWebhookSendResultDto,
  DiscordWebhookTargetDto,
  DiscordWebhookTestRequestDto,
} from '~/generated/api/types.gen';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import { usePopup } from '~/composables';
import {
  discordIntegrationGetBotStatus,
  discordIntegrationGetDiagnostics,
  discordIntegrationGetSettings,
  discordIntegrationResetSettings,
  discordIntegrationSyncSlashCommands,
  discordIntegrationTestBot,
  discordIntegrationTestWebhook,
  discordIntegrationUpdateSettings,
} from '~/generated/api/sdk.gen';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';
import AccountBindingSection from './components/AccountBindingSection.vue';
import BotIntegrationSection from './components/BotIntegrationSection.vue';
import ChatBridgeSection from './components/ChatBridgeSection.vue';
import CommandRelaySection from './components/CommandRelaySection.vue';
import FailureAlertsSection from './components/FailureAlertsSection.vue';
import NetworkProxySection from './components/NetworkProxySection.vue';
import RelayTestsSection from './components/RelayTestsSection.vue';
import SettingsHero from './components/SettingsHero.vue';
import WebhookTargetsSection from './components/WebhookTargetsSection.vue';

defineOptions({ name: 'DiscordIntegrationSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  webhookUrl: string;
  useProxy: boolean;
  proxyUrl: string;
  proxyUsername: string;
  proxyPassword: string;
  bypassProxyOnLocal: boolean;
  defaultUsername: string;
  defaultAvatarUrl: string;
  webhookTargets: WebhookTargetFormModel[];
  timeoutSeconds: number;
  allowEventAutomationMessages: boolean;
  enableGameChatBridgeToDiscord: boolean;
  gameChatBridgeTargetKey: string;
  gameChatBridgeMessageTemplate: string;
  bridgeWhisperChatToDiscord: boolean;
  enableDiscordToGameBridge: boolean;
  enableBotIntegration: boolean;
  botToken: string;
  botGuildId: string;
  botPublicChannelId: string;
  botAdminChannelId: string;
  enableBotSlashCommands: boolean;
  enableDiscordCommandExecution: boolean;
  discordCommandPrefix: string;
  discordCommandAllowList: string[];
  enableAccountBinding: boolean;
  enableEventAutomationFailureAlerts: boolean;
  eventAutomationFailureAlertTargetKey: string;
  eventAutomationFailureAlertMessage: string;
}

interface WebhookTargetFormModel {
  key: string;
  displayName: string;
  isEnabled: boolean;
  webhookUrl: string;
}

const { t } = useI18n();
const { confirm, toast } = usePopup();

const formRef = useTemplateRef<FormInstance>('formRef');
const isLoading = ref(false);
const isSubmitting = ref(false);
const isTesting = ref(false);
const isBotTesting = ref(false);
const isBotStatusLoading = ref(false);
const isDiagnosticsRunning = ref(false);
const isSlashSyncing = ref(false);
const testMessage = ref('');
const testWebhookTargetKey = ref('');
const botTestResult = ref<DiscordBotTestResultDto | null>(null);
const botStatus = ref<DiscordBotRuntimeStatusDto | null>(null);
const networkDiagnostics = ref<DiscordNetworkDiagnosticsDto | null>(null);
const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const botFormModel = computed({
  get: () => form,
  set: (value: FormModel) => applyFormValues({ ...form, ...value }),
});
const webhookTargetsModel = computed({
  get: () => form.webhookTargets,
  set: (value: WebhookTargetFormModel[]) => form.webhookTargets = value.map(target => ({ ...target })),
});
const commandRelayModel = computed({
  get: () => form,
  set: (value: FormModel) => applyFormValues({ ...form, ...value }),
});
const chatBridgeModel = computed({
  get: () => form,
  set: (value: FormModel) => applyFormValues({ ...form, ...value }),
});
const networkProxyModel = computed({
  get: () => form,
  set: (value: FormModel) => applyFormValues({ ...form, ...value }),
});
const failureAlertsModel = computed({
  get: () => form,
  set: (value: FormModel) => applyFormValues({ ...form, ...value }),
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
const networkDiagnosticSummary = computed(() => {
  const diagnostics = networkDiagnostics.value;
  if (!diagnostics)
    return null;

  const steps = diagnostics.steps ?? [];
  const proxyTcp = findDiagnosticStep('proxyTcp');
  const restGateway = findDiagnosticStep('restGateway');
  const gatewayWebSocket = findDiagnosticStep('gatewayWebSocket');
  const gatewayProxyTunnel = findDiagnosticStep('gatewayProxyTunnel');
  const gatewayAvailable = gatewayWebSocket?.succeeded === true || gatewayProxyTunnel?.succeeded === true;
  const apiAvailable = restGateway?.succeeded === true;
  const proxyAvailable = diagnostics.useProxy === false || proxyTcp?.succeeded === true;
  const requiredOk = gatewayAvailable && apiAvailable && proxyAvailable;
  const failedRequiredCount = [apiAvailable, gatewayAvailable, proxyAvailable].filter(Boolean).length;
  const passedCount = steps.filter(step => step.succeeded).length;

  return {
    type: requiredOk ? 'success' as const : 'error' as const,
    title: requiredOk
      ? t('views.discordIntegration.settings.messages.networkDiagnosticsUsable')
      : t('views.discordIntegration.settings.messages.networkDiagnosticsNeedsAttention'),
    description: requiredOk && gatewayWebSocket?.succeeded === false && gatewayProxyTunnel?.succeeded === true
      ? t('views.discordIntegration.settings.messages.networkDiagnosticsFallbackUsable')
      : requiredOk
        ? t('views.discordIntegration.settings.messages.networkDiagnosticsAllGood')
        : t('views.discordIntegration.settings.messages.networkDiagnosticsFailedRequired'),
    passedCount,
    totalCount: steps.length,
    requiredHealthyCount: failedRequiredCount,
    requiredTotalCount: 3,
  };
});

const schema = v.object({
  isEnabled: v.boolean(),
  webhookUrl: v.string(),
  useProxy: v.boolean(),
  proxyUrl: v.string(),
  proxyUsername: v.pipe(v.string(), v.maxLength(128)),
  proxyPassword: v.pipe(v.string(), v.maxLength(256)),
  bypassProxyOnLocal: v.boolean(),
  defaultUsername: v.pipe(v.string(), v.maxLength(80)),
  defaultAvatarUrl: v.string(),
  timeoutSeconds: v.pipe(v.number(), v.minValue(1), v.maxValue(30)),
  allowEventAutomationMessages: v.boolean(),
  enableGameChatBridgeToDiscord: v.boolean(),
  gameChatBridgeTargetKey: v.string(),
  gameChatBridgeMessageTemplate: v.pipe(v.string(), v.maxLength(1900)),
  bridgeWhisperChatToDiscord: v.boolean(),
  enableDiscordToGameBridge: v.boolean(),
  enableBotIntegration: v.boolean(),
  botToken: v.pipe(v.string(), v.maxLength(256)),
  botGuildId: v.pipe(v.string(), v.maxLength(64)),
  botPublicChannelId: v.pipe(v.string(), v.maxLength(64)),
  botAdminChannelId: v.pipe(v.string(), v.maxLength(64)),
  enableBotSlashCommands: v.boolean(),
  enableDiscordCommandExecution: v.boolean(),
  discordCommandPrefix: v.pipe(v.string(), v.minLength(1), v.maxLength(20)),
  discordCommandAllowList: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(64))),
  enableAccountBinding: v.boolean(),
  enableEventAutomationFailureAlerts: v.boolean(),
  eventAutomationFailureAlertTargetKey: v.string(),
  eventAutomationFailureAlertMessage: v.string(),
});

const rules: FormRules = generateElementRules(schema);

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    webhookUrl: '',
    useProxy: false,
    proxyUrl: '',
    proxyUsername: '',
    proxyPassword: '',
    bypassProxyOnLocal: true,
    defaultUsername: '7DTD Server',
    defaultAvatarUrl: '',
    webhookTargets: [
      { key: 'public', displayName: 'Public channel', isEnabled: false, webhookUrl: '' },
      { key: 'admin', displayName: 'Admin channel', isEnabled: false, webhookUrl: '' },
      { key: 'audit', displayName: 'Audit channel', isEnabled: false, webhookUrl: '' },
    ],
    timeoutSeconds: 10,
    allowEventAutomationMessages: true,
    enableGameChatBridgeToDiscord: false,
    gameChatBridgeTargetKey: 'public',
    gameChatBridgeMessageTemplate: '[{chatType}] {playerName}: {message}',
    bridgeWhisperChatToDiscord: false,
    enableDiscordToGameBridge: false,
    enableBotIntegration: false,
    botToken: '',
    botGuildId: '',
    botPublicChannelId: '',
    botAdminChannelId: '',
    enableBotSlashCommands: false,
    enableDiscordCommandExecution: false,
    discordCommandPrefix: '!',
    discordCommandAllowList: ['listplayers', 'saveworld'],
    enableAccountBinding: false,
    enableEventAutomationFailureAlerts: false,
    eventAutomationFailureAlertTargetKey: 'admin',
    eventAutomationFailureAlertMessage: '[7DTD] Automation rule failed: {ruleName} ({triggerType}) - {errorMessage}',
  };
}

function toFormModel(data?: DiscordIntegrationFeatureSettingsDto | null): FormModel {
  return {
    isEnabled: data?.isEnabled ?? false,
    webhookUrl: data?.webhookUrl ?? '',
    useProxy: data?.useProxy ?? false,
    proxyUrl: data?.proxyUrl ?? '',
    proxyUsername: data?.proxyUsername ?? '',
    proxyPassword: data?.proxyPassword ?? '',
    bypassProxyOnLocal: data?.bypassProxyOnLocal ?? true,
    defaultUsername: data?.defaultUsername ?? '7DTD Server',
    defaultAvatarUrl: data?.defaultAvatarUrl ?? '',
    webhookTargets: normalizeWebhookTargets(data?.webhookTargets),
    timeoutSeconds: data?.timeoutSeconds ?? 10,
    allowEventAutomationMessages: data?.allowEventAutomationMessages ?? true,
    enableGameChatBridgeToDiscord: data?.enableGameChatBridgeToDiscord ?? false,
    gameChatBridgeTargetKey: data?.gameChatBridgeTargetKey ?? 'public',
    gameChatBridgeMessageTemplate: data?.gameChatBridgeMessageTemplate ?? '[{chatType}] {playerName}: {message}',
    bridgeWhisperChatToDiscord: data?.bridgeWhisperChatToDiscord ?? false,
    enableDiscordToGameBridge: data?.enableDiscordToGameBridge ?? false,
    enableBotIntegration: data?.enableBotIntegration ?? false,
    botToken: data?.botToken ?? '',
    botGuildId: data?.botGuildId ?? '',
    botPublicChannelId: data?.botPublicChannelId ?? '',
    botAdminChannelId: data?.botAdminChannelId ?? '',
    enableBotSlashCommands: data?.enableBotSlashCommands ?? false,
    enableDiscordCommandExecution: data?.enableDiscordCommandExecution ?? false,
    discordCommandPrefix: data?.discordCommandPrefix ?? '!',
    discordCommandAllowList: (data?.discordCommandAllowList ?? ['listplayers', 'saveworld'])
      .map(item => item.trim())
      .filter(item => item.length > 0),
    enableAccountBinding: data?.enableAccountBinding ?? false,
    enableEventAutomationFailureAlerts: data?.enableEventAutomationFailureAlerts ?? false,
    eventAutomationFailureAlertTargetKey: data?.eventAutomationFailureAlertTargetKey ?? 'admin',
    eventAutomationFailureAlertMessage: data?.eventAutomationFailureAlertMessage
      ?? '[7DTD] Automation rule failed: {ruleName} ({triggerType}) - {errorMessage}',
  };
}

function applyFormValues(values: FormModel) {
  form.isEnabled = values.isEnabled;
  form.webhookUrl = values.webhookUrl;
  form.useProxy = values.useProxy;
  form.proxyUrl = values.proxyUrl;
  form.proxyUsername = values.proxyUsername;
  form.proxyPassword = values.proxyPassword;
  form.bypassProxyOnLocal = values.bypassProxyOnLocal;
  form.defaultUsername = values.defaultUsername;
  form.defaultAvatarUrl = values.defaultAvatarUrl;
  form.webhookTargets = values.webhookTargets.map(target => ({ ...target }));
  form.timeoutSeconds = values.timeoutSeconds;
  form.allowEventAutomationMessages = values.allowEventAutomationMessages;
  form.enableGameChatBridgeToDiscord = values.enableGameChatBridgeToDiscord;
  form.gameChatBridgeTargetKey = values.gameChatBridgeTargetKey;
  form.gameChatBridgeMessageTemplate = values.gameChatBridgeMessageTemplate;
  form.bridgeWhisperChatToDiscord = values.bridgeWhisperChatToDiscord;
  form.enableDiscordToGameBridge = values.enableDiscordToGameBridge;
  form.enableBotIntegration = values.enableBotIntegration;
  form.botToken = values.botToken;
  form.botGuildId = values.botGuildId;
  form.botPublicChannelId = values.botPublicChannelId;
  form.botAdminChannelId = values.botAdminChannelId;
  form.enableBotSlashCommands = values.enableBotSlashCommands;
  form.enableDiscordCommandExecution = values.enableDiscordCommandExecution;
  form.discordCommandPrefix = values.discordCommandPrefix;
  form.discordCommandAllowList = [...values.discordCommandAllowList];
  form.enableAccountBinding = values.enableAccountBinding;
  form.enableEventAutomationFailureAlerts = values.enableEventAutomationFailureAlerts;
  form.eventAutomationFailureAlertTargetKey = values.eventAutomationFailureAlertTargetKey;
  form.eventAutomationFailureAlertMessage = values.eventAutomationFailureAlertMessage;
}

function normalizeWebhookTargets(targets?: Array<DiscordWebhookTargetDto | WebhookTargetFormModel> | null): WebhookTargetFormModel[] {
  const source = targets?.length ? targets : buildDefaults().webhookTargets;
  return source.map(target => ({
    key: target.key ?? '',
    displayName: target.displayName ?? '',
    isEnabled: target.isEnabled ?? true,
    webhookUrl: target.webhookUrl ?? '',
  }));
}

function toPayload(values: FormModel): DiscordIntegrationFeatureSettingsDto {
  return {
    isEnabled: values.isEnabled,
    webhookUrl: values.webhookUrl.trim() || null,
    useProxy: values.useProxy,
    proxyUrl: values.proxyUrl.trim() || null,
    proxyUsername: values.proxyUsername.trim() || null,
    proxyPassword: values.proxyPassword.trim() || null,
    bypassProxyOnLocal: values.bypassProxyOnLocal,
    defaultUsername: values.defaultUsername.trim() || null,
    defaultAvatarUrl: values.defaultAvatarUrl.trim() || null,
    webhookTargets: values.webhookTargets
      .map(target => ({
        key: target.key.trim(),
        displayName: target.displayName.trim() || target.key.trim(),
        isEnabled: target.isEnabled,
        webhookUrl: target.webhookUrl.trim() || null,
      }))
      .filter(target => target.key || target.webhookUrl),
    timeoutSeconds: Number(values.timeoutSeconds ?? 10),
    allowEventAutomationMessages: values.allowEventAutomationMessages,
    enableGameChatBridgeToDiscord: values.enableGameChatBridgeToDiscord,
    gameChatBridgeTargetKey: values.gameChatBridgeTargetKey.trim() || null,
    gameChatBridgeMessageTemplate: values.gameChatBridgeMessageTemplate.trim() || null,
    bridgeWhisperChatToDiscord: values.bridgeWhisperChatToDiscord,
    enableDiscordToGameBridge: values.enableDiscordToGameBridge,
    enableBotIntegration: values.enableBotIntegration,
    botToken: values.botToken.trim() || null,
    botGuildId: values.botGuildId.trim() || null,
    botPublicChannelId: values.botPublicChannelId.trim() || null,
    botAdminChannelId: values.botAdminChannelId.trim() || null,
    enableBotSlashCommands: values.enableBotSlashCommands,
    enableDiscordCommandExecution: values.enableDiscordCommandExecution,
    discordCommandPrefix: values.discordCommandPrefix.trim() || '!',
    discordCommandAllowList: values.discordCommandAllowList
      .map(item => item.trim())
      .filter(item => item.length > 0),
    enableAccountBinding: values.enableAccountBinding,
    enableEventAutomationFailureAlerts: values.enableEventAutomationFailureAlerts,
    eventAutomationFailureAlertTargetKey: values.eventAutomationFailureAlertTargetKey.trim() || null,
    eventAutomationFailureAlertMessage: values.eventAutomationFailureAlertMessage.trim() || null,
  };
}

function showBotTestResult(result: DiscordBotTestResultDto | undefined) {
  botTestResult.value = result ?? null;
  toast({
    type: result?.succeeded ? 'success' : 'error',
    text: result?.message || t('views.discordIntegration.settings.messages.botTestFailed'),
  });
}

function findDiagnosticStep(key: string) {
  return networkDiagnostics.value?.steps?.find(step => step.key === key);
}

async function loadBotStatus() {
  try {
    isBotStatusLoading.value = true;
    const { data } = await discordIntegrationGetBotStatus({ throwOnError: true });
    botStatus.value = data;
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBotStatusLoading.value = false;
  }
}

async function runNetworkDiagnostics() {
  if (isDirty.value) {
    const confirmed = await confirm({
      text: t('views.discordIntegration.settings.messages.diagnosticsWithUnsavedConfirm'),
      type: 'warning',
    });
    if (!confirmed)
      return;

    await onSubmit();
  }

  try {
    isDiagnosticsRunning.value = true;
    const { data } = await discordIntegrationGetDiagnostics({ throwOnError: true });
    networkDiagnostics.value = data;
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isDiagnosticsRunning.value = false;
  }
}

async function loadSettings() {
  try {
    isLoading.value = true;
    const { data } = await discordIntegrationGetSettings({ throwOnError: true });
    initialValues.value = toFormModel(data);
    applyFormValues(initialValues.value);
    await nextTick();
    formRef.value?.clearValidate();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isLoading.value = false;
  }
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  try {
    isSubmitting.value = true;
    await discordIntegrationUpdateSettings({ body: toPayload(form), throwOnError: true });
    toast({ type: 'success', text: t('views.discordIntegration.settings.messages.saveSuccess') });
    await loadSettings();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

async function onReset() {
  const confirmed = await confirm({
    type: 'warning',
    text: t('views.discordIntegration.settings.messages.resetConfirm'),
  });
  if (!confirmed)
    return;

  try {
    isSubmitting.value = true;
    const { data } = await discordIntegrationResetSettings({ throwOnError: true });
    initialValues.value = toFormModel(data);
    applyFormValues(initialValues.value);
    await nextTick();
    formRef.value?.clearValidate();
    toast({ type: 'success', text: t('views.discordIntegration.settings.messages.resetSuccess') });
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

function showTestResult(result: DiscordWebhookSendResultDto | undefined) {
  if (result?.succeeded) {
    toast({
      type: 'success',
      text: t('views.discordIntegration.settings.messages.testSuccess', {
        statusCode: result.statusCode ?? '-',
      }),
    });
    return;
  }

  toast({
    type: 'error',
    text: result?.message || t('views.discordIntegration.settings.messages.testFailed'),
  });
}

async function onTestWebhook() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  if (isDirty.value) {
    const confirmed = await confirm({
      type: 'warning',
      text: t('views.discordIntegration.settings.messages.testWithUnsavedConfirm'),
    });
    if (!confirmed)
      return;

    await onSubmit();
    if (isDirty.value)
      return;
  }

  try {
    isTesting.value = true;
    const payload: DiscordWebhookTestRequestDto = {
      message: testMessage.value.trim() || null,
      username: form.defaultUsername.trim() || null,
      webhookTargetKey: testWebhookTargetKey.value.trim() || null,
    };
    const { data } = await discordIntegrationTestWebhook({
      body: payload,
      throwOnError: true,
    });
    showTestResult(data);
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isTesting.value = false;
  }
}

async function onTestBot() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  if (isDirty.value) {
    const confirmed = await confirm({
      type: 'warning',
      text: t('views.discordIntegration.settings.messages.botTestWithUnsavedConfirm'),
    });
    if (!confirmed)
      return;

    await onSubmit();
    if (isDirty.value)
      return;
  }

  try {
    isBotTesting.value = true;
    const { data } = await discordIntegrationTestBot({ throwOnError: true });
    showBotTestResult(data);
    await loadBotStatus();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBotTesting.value = false;
  }
}

async function onSyncSlashCommands() {
  if (isDirty.value) {
    const confirmed = await confirm({
      type: 'warning',
      text: t('views.discordIntegration.settings.messages.slashSyncWithUnsavedConfirm'),
    });
    if (!confirmed)
      return;

    await onSubmit();
    if (isDirty.value)
      return;
  }

  try {
    isSlashSyncing.value = true;
    const { data } = await discordIntegrationSyncSlashCommands({ throwOnError: true });
    toast({
      type: data.succeeded ? 'success' : 'error',
      text: data.message || t('views.discordIntegration.settings.messages.slashSyncFailed'),
    });
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSlashSyncing.value = false;
  }
}

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
