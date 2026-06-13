<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import type {
  DiscordAccountBindingCodeCreateResultDto,
  DiscordAccountBindingCodeDto,
  DiscordAccountBindingCodeRedeemResultDto,
  DiscordAccountBindingDto,
  DiscordAccountBindingUpsertDto,
  DiscordBotRuntimeStatusDto,
  DiscordBotTestResultDto,
  DiscordChatRelayResultDto,
  DiscordCommandExecuteResultDto,
  DiscordIntegrationFeatureSettingsDto,
  DiscordNetworkDiagnosticsDto,
  DiscordWebhookSendResultDto,
  DiscordWebhookTargetDto,
  DiscordWebhookTestRequestDto,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import { usePopup } from '~/composables';
import {
  discordIntegrationCleanupExpiredBindingCodes,
  discordIntegrationCreateBindingCode,
  discordIntegrationDeleteBindingCode,
  discordIntegrationDeleteBinding,
  discordIntegrationExecuteDiscordCommand,
  discordIntegrationGetBindingCodes,
  discordIntegrationGetBindings,
  discordIntegrationGetBotStatus,
  discordIntegrationGetDiagnostics,
  discordIntegrationRedeemBindingCode,
  discordIntegrationGetSettings,
  discordIntegrationRelayDiscordChat,
  discordIntegrationResetSettings,
  discordIntegrationSyncSlashCommands,
  discordIntegrationTestBot,
  discordIntegrationTestWebhook,
  discordIntegrationUpdateSettings,
  discordIntegrationUpsertBinding,
} from '~/generated/api/sdk.gen';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

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

interface BindingFormModel {
  id: number | null;
  playerId: string;
  playerName: string;
  discordUserId: string;
  discordUsername: string;
  isActive: boolean;
}

interface BindingCodeCreateFormModel {
  playerId: string;
  playerName: string;
  expiresInMinutes: number;
}

interface BindingCodeRedeemFormModel {
  code: string;
  discordUserId: string;
  discordUsername: string;
}

const { t } = useI18n();
const { confirm, toast } = usePopup();

const formRef = useTemplateRef<FormInstance>('formRef');
const bindingFormRef = useTemplateRef<FormInstance>('bindingFormRef');
const bindingCodeCreateFormRef = useTemplateRef<FormInstance>('bindingCodeCreateFormRef');
const bindingCodeRedeemFormRef = useTemplateRef<FormInstance>('bindingCodeRedeemFormRef');
const isLoading = ref(false);
const isSubmitting = ref(false);
const isTesting = ref(false);
const isBindingsLoading = ref(false);
const isBindingSubmitting = ref(false);
const isBindingCodesLoading = ref(false);
const isBindingCodeCreating = ref(false);
const isBindingCodeRedeeming = ref(false);
const isBindingCodeCleaning = ref(false);
const isCommandTesting = ref(false);
const isChatRelayTesting = ref(false);
const isBotTesting = ref(false);
const isBotStatusLoading = ref(false);
const isDiagnosticsRunning = ref(false);
const isSlashSyncing = ref(false);
const testMessage = ref('');
const testWebhookTargetKey = ref('');
const bindings = ref<DiscordAccountBindingDto[]>([]);
const bindingCodes = ref<DiscordAccountBindingCodeDto[]>([]);
const bindingKeyword = ref('');
const bindingCodeKeyword = ref('');
const bindingForm = reactive<BindingFormModel>(buildBindingDefaults());
const bindingCodeCreateForm = reactive<BindingCodeCreateFormModel>(buildBindingCodeCreateDefaults());
const bindingCodeRedeemForm = reactive<BindingCodeRedeemFormModel>(buildBindingCodeRedeemDefaults());
const latestCreatedBindingCode = ref<DiscordAccountBindingCodeCreateResultDto | null>(null);
const latestRedeemResult = ref<DiscordAccountBindingCodeRedeemResultDto | null>(null);
const commandTestForm = reactive({
  commandText: '!listplayers',
  discordUserId: '',
  discordUsername: 'Discord Admin',
  inMainThread: false,
});
const chatRelayTestForm = reactive({
  message: 'Hello from Discord',
  discordUserId: '',
  discordUsername: 'Discord User',
});
const commandTestResult = ref<DiscordCommandExecuteResultDto | null>(null);
const chatRelayTestResult = ref<DiscordChatRelayResultDto | null>(null);
const botTestResult = ref<DiscordBotTestResultDto | null>(null);
const botStatus = ref<DiscordBotRuntimeStatusDto | null>(null);
const networkDiagnostics = ref<DiscordNetworkDiagnosticsDto | null>(null);
const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const isDirty = computed(() => !isEqual(form, initialValues.value));
const webhookTargetOptions = computed(() =>
  form.webhookTargets
    .filter(target => target.key.trim().length > 0)
    .map(target => ({
      label: `${target.displayName.trim() || target.key.trim()} (${target.key.trim()})`,
      value: target.key.trim(),
    })),
);

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
const bindingRules: FormRules = generateElementRules(v.object({
  id: v.nullish(v.number()),
  playerId: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  playerName: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  discordUserId: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  discordUsername: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  isActive: v.boolean(),
}));
const bindingCodeCreateRules: FormRules = generateElementRules(v.object({
  playerId: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  playerName: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  expiresInMinutes: v.pipe(v.number(), v.minValue(1), v.maxValue(60)),
}));
const bindingCodeRedeemRules: FormRules = generateElementRules(v.object({
  code: v.pipe(v.string(), v.minLength(6), v.maxLength(32)),
  discordUserId: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  discordUsername: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
}));

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

function buildBindingDefaults(): BindingFormModel {
  return {
    id: null,
    playerId: '',
    playerName: '',
    discordUserId: '',
    discordUsername: '',
    isActive: true,
  };
}

function resetBindingForm() {
  Object.assign(bindingForm, buildBindingDefaults());
  nextTick(() => bindingFormRef.value?.clearValidate());
}

function buildBindingCodeCreateDefaults(): BindingCodeCreateFormModel {
  return {
    playerId: '',
    playerName: '',
    expiresInMinutes: 10,
  };
}

function buildBindingCodeRedeemDefaults(): BindingCodeRedeemFormModel {
  return {
    code: '',
    discordUserId: '',
    discordUsername: '',
  };
}

function resetBindingCodeCreateForm() {
  Object.assign(bindingCodeCreateForm, buildBindingCodeCreateDefaults());
  latestCreatedBindingCode.value = null;
  nextTick(() => bindingCodeCreateFormRef.value?.clearValidate());
}

function resetBindingCodeRedeemForm() {
  Object.assign(bindingCodeRedeemForm, buildBindingCodeRedeemDefaults());
  latestRedeemResult.value = null;
  nextTick(() => bindingCodeRedeemFormRef.value?.clearValidate());
}

function editBinding(row: DiscordAccountBindingDto) {
  bindingForm.id = row.id ?? null;
  bindingForm.playerId = row.playerId;
  bindingForm.playerName = row.playerName;
  bindingForm.discordUserId = row.discordUserId;
  bindingForm.discordUsername = row.discordUsername;
  bindingForm.isActive = row.isActive ?? true;
}

function editBindingRow(row: unknown) {
  editBinding(row as DiscordAccountBindingDto);
}

function deleteBindingRow(row: unknown) {
  return onDeleteBinding(row as DiscordAccountBindingDto);
}

async function loadBindings() {
  try {
    isBindingsLoading.value = true;
    const { data } = await discordIntegrationGetBindings({
      query: {
        pageNumber: 1,
        pageSize: 20,
        keyword: bindingKeyword.value.trim() || undefined,
        desc: true,
      },
      throwOnError: true,
    });
    bindings.value = data.items ?? [];
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBindingsLoading.value = false;
  }
}

async function loadBindingCodes() {
  try {
    isBindingCodesLoading.value = true;
    const { data } = await discordIntegrationGetBindingCodes({
      query: {
        pageNumber: 1,
        pageSize: 20,
        keyword: bindingCodeKeyword.value.trim() || undefined,
        desc: true,
      },
      throwOnError: true,
    });
    bindingCodes.value = data.items ?? [];
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBindingCodesLoading.value = false;
  }
}

async function onSubmitBinding() {
  const valid = await bindingFormRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  try {
    isBindingSubmitting.value = true;
    const body: DiscordAccountBindingUpsertDto = {
      id: bindingForm.id,
      playerId: bindingForm.playerId.trim(),
      playerName: bindingForm.playerName.trim(),
      discordUserId: bindingForm.discordUserId.trim(),
      discordUsername: bindingForm.discordUsername.trim(),
      isActive: bindingForm.isActive,
    };
    await discordIntegrationUpsertBinding({ body, throwOnError: true });
    toast({ type: 'success', text: t('views.discordIntegration.settings.messages.bindingSaved') });
    resetBindingForm();
    await loadBindings();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBindingSubmitting.value = false;
  }
}

async function onDeleteBinding(row: DiscordAccountBindingDto) {
  if (!row.id)
    return;

  const confirmed = await confirm({
    type: 'warning',
    text: t('views.discordIntegration.settings.messages.deleteBindingConfirm', {
      playerName: row.playerName,
      discordUsername: row.discordUsername,
    }),
  });
  if (!confirmed)
    return;

  try {
    await discordIntegrationDeleteBinding({
      path: { id: row.id },
      throwOnError: true,
    });
    toast({ type: 'success', text: t('views.discordIntegration.settings.messages.bindingDeleted') });
    if (bindingForm.id === row.id)
      resetBindingForm();
    await loadBindings();
  }
  catch (error) {
    console.error(error);
  }
}

async function onCreateBindingCode() {
  const valid = await bindingCodeCreateFormRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  try {
    isBindingCodeCreating.value = true;
    const { data } = await discordIntegrationCreateBindingCode({
      body: {
        playerId: bindingCodeCreateForm.playerId.trim(),
        playerName: bindingCodeCreateForm.playerName.trim(),
        expiresInMinutes: bindingCodeCreateForm.expiresInMinutes,
      },
      throwOnError: true,
    });
    latestCreatedBindingCode.value = data;
    toast({ type: 'success', text: t('views.discordIntegration.settings.messages.bindingCodeCreated') });
    await loadBindingCodes();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBindingCodeCreating.value = false;
  }
}

async function onRedeemBindingCode() {
  const valid = await bindingCodeRedeemFormRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  try {
    isBindingCodeRedeeming.value = true;
    const { data } = await discordIntegrationRedeemBindingCode({
      body: {
        code: bindingCodeRedeemForm.code.trim(),
        discordUserId: bindingCodeRedeemForm.discordUserId.trim(),
        discordUsername: bindingCodeRedeemForm.discordUsername.trim(),
      },
      throwOnError: true,
    });
    latestRedeemResult.value = data;
    toast({ type: 'success', text: data.message || t('views.discordIntegration.settings.messages.bindingCodeRedeemed') });
    await Promise.all([loadBindingCodes(), loadBindings()]);
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBindingCodeRedeeming.value = false;
  }
}

async function onDeleteBindingCode(row: DiscordAccountBindingCodeDto) {
  if (!row.id)
    return;

  const confirmed = await confirm({
    type: 'warning',
    text: t('views.discordIntegration.settings.messages.deleteBindingCodeConfirm', {
      playerName: row.playerName,
      codePrefix: row.codePrefix,
    }),
  });
  if (!confirmed)
    return;

  try {
    await discordIntegrationDeleteBindingCode({
      path: { id: row.id },
      throwOnError: true,
    });
    toast({ type: 'success', text: t('views.discordIntegration.settings.messages.bindingCodeDeleted') });
    await loadBindingCodes();
  }
  catch (error) {
    console.error(error);
  }
}

function getBindingCodeStatusForRow(row: unknown) {
  return getBindingCodeStatus(row as DiscordAccountBindingCodeDto);
}

function deleteBindingCodeRow(row: unknown) {
  return onDeleteBindingCode(row as DiscordAccountBindingCodeDto);
}

async function onCleanupExpiredBindingCodes() {
  const confirmed = await confirm({
    type: 'warning',
    text: t('views.discordIntegration.settings.messages.cleanupBindingCodesConfirm'),
  });
  if (!confirmed)
    return;

  try {
    isBindingCodeCleaning.value = true;
    const { data } = await discordIntegrationCleanupExpiredBindingCodes({ throwOnError: true });
    toast({
      type: 'success',
      text: t('views.discordIntegration.settings.messages.bindingCodesCleaned', { count: data ?? 0 }),
    });
    await loadBindingCodes();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBindingCodeCleaning.value = false;
  }
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function getBindingCodeStatus(row: DiscordAccountBindingCodeDto) {
  if (row.redeemedAt)
    return { type: 'success' as const, text: t('views.discordIntegration.settings.status.redeemed') };

  if (row.expiresAt && dayjs(row.expiresAt).isBefore(dayjs()))
    return { type: 'info' as const, text: t('views.discordIntegration.settings.status.expired') };

  return { type: 'warning' as const, text: t('views.discordIntegration.settings.status.pending') };
}

function showCommandTestResult(result: DiscordCommandExecuteResultDto | undefined) {
  commandTestResult.value = result ?? null;
  toast({
    type: result?.succeeded ? 'success' : 'error',
    text: result?.message || t('views.discordIntegration.settings.messages.commandTestFailed'),
  });
}

function showChatRelayTestResult(result: DiscordChatRelayResultDto | undefined) {
  chatRelayTestResult.value = result ?? null;
  toast({
    type: result?.succeeded ? 'success' : 'error',
    text: result?.message || t('views.discordIntegration.settings.messages.chatRelayTestFailed'),
  });
}

function showBotTestResult(result: DiscordBotTestResultDto | undefined) {
  botTestResult.value = result ?? null;
  toast({
    type: result?.succeeded ? 'success' : 'error',
    text: result?.message || t('views.discordIntegration.settings.messages.botTestFailed'),
  });
}

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

function formatBotTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
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

function addWebhookTarget() {
  form.webhookTargets.push({
    key: '',
    displayName: '',
    isEnabled: true,
    webhookUrl: '',
  });
}

function removeWebhookTarget(index: number) {
  form.webhookTargets.splice(index, 1);
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

async function onTestDiscordCommand() {
  if (!commandTestForm.commandText.trim())
    return;

  const confirmed = await confirm({
    type: 'warning',
    text: t('views.discordIntegration.settings.messages.commandTestConfirm'),
  });
  if (!confirmed)
    return;

  try {
    isCommandTesting.value = true;
    const { data } = await discordIntegrationExecuteDiscordCommand({
      body: {
        commandText: commandTestForm.commandText.trim(),
        discordUserId: commandTestForm.discordUserId.trim() || null,
        discordUsername: commandTestForm.discordUsername.trim() || null,
        inMainThread: commandTestForm.inMainThread,
      },
      throwOnError: true,
    });
    showCommandTestResult(data);
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isCommandTesting.value = false;
  }
}

async function onTestDiscordChatRelay() {
  if (!chatRelayTestForm.message.trim())
    return;

  try {
    isChatRelayTesting.value = true;
    const { data } = await discordIntegrationRelayDiscordChat({
      body: {
        message: chatRelayTestForm.message.trim(),
        discordUserId: chatRelayTestForm.discordUserId.trim() || null,
        discordUsername: chatRelayTestForm.discordUsername.trim() || null,
      },
      throwOnError: true,
    });
    showChatRelayTestResult(data);
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isChatRelayTesting.value = false;
  }
}

onMounted(loadSettings);
onMounted(loadBindings);
onMounted(loadBindingCodes);
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
      <div class="discord-settings__hero">
        <div class="discord-settings__hero-main">
          <div>
            <h2>{{ t('menus.discordIntegration') }}</h2>
            <p>{{ t('views.discordIntegration.settings.description') }}</p>
          </div>
          <div class="discord-settings__hero-actions">
            <el-button :disabled="isSubmitting || isTesting" @click="onReset">
              {{ t('common.reset') }}
            </el-button>
            <el-button :loading="isTesting" :disabled="isSubmitting" @click="onTestWebhook">
              {{ t('views.discordIntegration.settings.actions.testWebhook') }}
            </el-button>
            <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty || isTesting" @click="onSubmit">
              {{ t('common.save') }}
            </el-button>
          </div>
        </div>

        <div class="discord-settings__status-grid">
          <div class="discord-settings__status-item" :class="{ 'is-active': form.isEnabled }">
            <span>{{ t('views.discordIntegration.settings.statusCards.integration') }}</span>
            <el-tag :type="form.isEnabled ? 'success' : 'info'" effect="plain">
              {{ form.isEnabled ? t('common.enabled') : t('common.disabled') }}
            </el-tag>
          </div>
          <div class="discord-settings__status-item" :class="{ 'is-active': form.webhookUrl.trim() || form.webhookTargets.some(target => target.isEnabled && target.webhookUrl.trim()) }">
            <span>{{ t('views.discordIntegration.settings.statusCards.webhook') }}</span>
            <el-tag :type="(form.webhookUrl.trim() || form.webhookTargets.some(target => target.isEnabled && target.webhookUrl.trim())) ? 'success' : 'warning'" effect="plain">
              {{ (form.webhookUrl.trim() || form.webhookTargets.some(target => target.isEnabled && target.webhookUrl.trim())) ? t('views.discordIntegration.settings.status.configured') : t('views.discordIntegration.settings.status.missing') }}
            </el-tag>
          </div>
          <div class="discord-settings__status-item" :class="{ 'is-active': form.enableBotIntegration && form.botToken.trim() }">
            <span>{{ t('views.discordIntegration.settings.statusCards.bot') }}</span>
            <el-tag :type="(form.enableBotIntegration && form.botToken.trim()) ? 'success' : 'info'" effect="plain">
              {{ (form.enableBotIntegration && form.botToken.trim()) ? t('views.discordIntegration.settings.status.configured') : t('views.discordIntegration.settings.status.notConfigured') }}
            </el-tag>
          </div>
          <div class="discord-settings__status-item" :class="{ 'is-active': form.enableDiscordCommandExecution }">
            <span>{{ t('views.discordIntegration.settings.statusCards.commandRelay') }}</span>
            <el-tag :type="form.enableDiscordCommandExecution ? 'warning' : 'info'" effect="plain">
              {{ form.enableDiscordCommandExecution ? t('common.enabled') : t('common.disabled') }}
            </el-tag>
          </div>
          <div class="discord-settings__status-item" :class="{ 'is-active': form.enableAccountBinding }">
            <span>{{ t('views.discordIntegration.settings.statusCards.accountBinding') }}</span>
            <el-tag :type="form.enableAccountBinding ? 'success' : 'info'" effect="plain">
              {{ form.enableAccountBinding ? t('common.enabled') : t('common.disabled') }}
            </el-tag>
          </div>
        </div>
      </div>

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
            <section class="discord-settings__section">
              <div class="discord-settings__section-header">
                <div>
                  <h3>{{ t('views.discordIntegration.settings.sections.chatBridge') }}</h3>
                  <p>{{ t('views.discordIntegration.settings.sections.chatBridgeDescription') }}</p>
                </div>
                <el-switch
                  v-model="form.enableGameChatBridgeToDiscord"
                  inline-prompt
                  :active-text="t('common.yes')"
                  :inactive-text="t('common.no')"
                />
              </div>
              <el-row :gutter="12">
                <el-col :xs="24" :md="10">
                  <el-form-item prop="gameChatBridgeTargetKey" :label="t('views.discordIntegration.settings.fields.gameChatBridgeTargetKey')">
                    <el-select
                      v-model="form.gameChatBridgeTargetKey"
                      class="w-full"
                      filterable
                      allow-create
                      clearable
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
                <el-col :xs="24" :md="14">
                  <el-form-item prop="gameChatBridgeMessageTemplate" :label="t('views.discordIntegration.settings.fields.gameChatBridgeMessageTemplate')">
                    <el-input
                      v-model="form.gameChatBridgeMessageTemplate"
                      clearable
                      maxlength="1900"
                      show-word-limit
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item prop="bridgeWhisperChatToDiscord" :label="t('views.discordIntegration.settings.fields.bridgeWhisperChatToDiscord')">
                    <el-switch
                      v-model="form.bridgeWhisperChatToDiscord"
                      inline-prompt
                      :active-text="t('common.yes')"
                      :inactive-text="t('common.no')"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item prop="enableDiscordToGameBridge" :label="t('views.discordIntegration.settings.fields.enableDiscordToGameBridge')">
                    <el-switch
                      v-model="form.enableDiscordToGameBridge"
                      inline-prompt
                      :active-text="t('common.yes')"
                      :inactive-text="t('common.no')"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </section>
          </el-col>

          <el-col :xs="24">
            <section class="discord-settings__section discord-settings__section--bot">
              <div class="discord-settings__section-header">
                <div>
                  <h3>{{ t('views.discordIntegration.settings.sections.botIntegration') }}</h3>
                  <p>{{ t('views.discordIntegration.settings.sections.botIntegrationDescription') }}</p>
                </div>
                <el-switch
                  v-model="form.enableBotIntegration"
                  inline-prompt
                  :active-text="t('common.yes')"
                  :inactive-text="t('common.no')"
                />
              </div>

              <div class="discord-settings__steps">
                <div class="discord-settings__step" :class="{ 'is-done': form.botToken.trim() }">
                  <span>1</span>
                  <div>
                    <strong>{{ t('views.discordIntegration.settings.botSteps.token') }}</strong>
                    <small>{{ t('views.discordIntegration.settings.botSteps.tokenHint') }}</small>
                  </div>
                </div>
                <div class="discord-settings__step" :class="{ 'is-done': form.botPublicChannelId.trim() || form.botAdminChannelId.trim() }">
                  <span>2</span>
                  <div>
                    <strong>{{ t('views.discordIntegration.settings.botSteps.channels') }}</strong>
                    <small>{{ t('views.discordIntegration.settings.botSteps.channelsHint') }}</small>
                  </div>
                </div>
                <div class="discord-settings__step" :class="{ 'is-done': botTestResult?.succeeded }">
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

              <div v-loading="isBotStatusLoading" class="discord-settings__bot-runtime">
                <div class="discord-settings__runtime-main">
                  <div>
                    <span class="discord-settings__runtime-label">{{ t('views.discordIntegration.settings.sections.botRuntime') }}</span>
                    <strong>{{ botStatus?.message || t('views.discordIntegration.settings.messages.botStatusUnknown') }}</strong>
                  </div>
                  <el-tag :type="getBotStatusTagType(botStatus?.state)" effect="plain">
                    {{ botStatus?.state || '-' }}
                  </el-tag>
                </div>
                <div class="discord-settings__runtime-grid">
                  <span>{{ t('views.discordIntegration.settings.fields.botUser') }}: {{ botStatus?.botUsername || '-' }}</span>
                  <span>{{ t('views.discordIntegration.settings.fields.lastConnectedAt') }}: {{ formatBotTimestamp(botStatus?.lastConnectedAt) }}</span>
                  <span>{{ t('views.discordIntegration.settings.fields.lastDisconnectedAt') }}: {{ formatBotTimestamp(botStatus?.lastDisconnectedAt) }}</span>
                  <span>{{ t('views.discordIntegration.settings.fields.reconnectDelaySeconds') }}: {{ botStatus?.reconnectDelaySeconds ?? '-' }}</span>
                </div>
                <el-alert
                  v-if="botStatus?.lastError"
                  type="error"
                  show-icon
                  :closable="false"
                  :title="botStatus.lastError"
                />
              </div>

              <div v-loading="isDiagnosticsRunning" class="discord-settings__diagnostics">
                <div class="discord-settings__runtime-main">
                  <div>
                    <span class="discord-settings__runtime-label">{{ t('views.discordIntegration.settings.sections.networkDiagnostics') }}</span>
                    <strong>{{ t('views.discordIntegration.settings.messages.networkDiagnosticsHint') }}</strong>
                  </div>
                  <el-button size="small" :loading="isDiagnosticsRunning" @click="runNetworkDiagnostics">
                    {{ t('views.discordIntegration.settings.actions.runDiagnostics') }}
                  </el-button>
                </div>
                <div v-if="networkDiagnostics" class="discord-settings__runtime-grid">
                  <span>{{ t('views.discordIntegration.settings.fields.proxy') }}: {{ networkDiagnostics.useProxy ? (networkDiagnostics.proxyUrl || '-') : '-' }}</span>
                  <span>{{ t('views.discordIntegration.settings.fields.gatewayTarget') }}: {{ networkDiagnostics.gatewayUrl }}</span>
                  <span>{{ t('views.discordIntegration.settings.fields.checkedAt') }}: {{ formatBotTimestamp(networkDiagnostics.checkedAt) }}</span>
                </div>
                <div v-if="networkDiagnostics" class="discord-settings__diagnostic-steps">
                  <div
                    v-for="step in networkDiagnostics.steps"
                    :key="step.key"
                    class="discord-settings__diagnostic-step"
                  >
                    <div class="discord-settings__diagnostic-step-main">
                      <el-tag :type="getDiagnosticTagType(step.succeeded)" effect="plain" size="small">
                        {{ step.succeeded ? t('views.discordIntegration.settings.status.passed') : t('views.discordIntegration.settings.status.failed') }}
                      </el-tag>
                      <div>
                        <strong>{{ step.name }}</strong>
                        <small>{{ step.stage }} · {{ step.elapsedMilliseconds }}ms · {{ step.target }}</small>
                      </div>
                    </div>
                    <p>{{ step.message }}</p>
                    <el-alert
                      v-if="step.error"
                      type="error"
                      show-icon
                      :closable="false"
                      :title="step.error"
                    />
                  </div>
                </div>
              </div>

              <el-row :gutter="12">
                <el-col :xs="24">
                  <el-form-item prop="botToken" :label="t('views.discordIntegration.settings.fields.botToken')">
                    <el-input
                      v-model="form.botToken"
                      type="password"
                      show-password
                      clearable
                      maxlength="256"
                      autocomplete="new-password"
                      :disabled="!form.enableBotIntegration"
                      :placeholder="t('views.discordIntegration.settings.placeholders.botToken')"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="8">
                  <el-form-item prop="botGuildId" :label="t('views.discordIntegration.settings.fields.botGuildId')">
                    <el-input
                      v-model="form.botGuildId"
                      clearable
                      maxlength="64"
                      :disabled="!form.enableBotIntegration"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="8">
                  <el-form-item prop="botPublicChannelId" :label="t('views.discordIntegration.settings.fields.botPublicChannelId')">
                    <el-input
                      v-model="form.botPublicChannelId"
                      clearable
                      maxlength="64"
                      :disabled="!form.enableBotIntegration"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="8">
                  <el-form-item prop="botAdminChannelId" :label="t('views.discordIntegration.settings.fields.botAdminChannelId')">
                    <el-input
                      v-model="form.botAdminChannelId"
                      clearable
                      maxlength="64"
                      :disabled="!form.enableBotIntegration"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item prop="enableBotSlashCommands" :label="t('views.discordIntegration.settings.fields.enableBotSlashCommands')">
                    <el-switch
                      v-model="form.enableBotSlashCommands"
                      :disabled="!form.enableBotIntegration"
                      inline-prompt
                      :active-text="t('common.yes')"
                      :inactive-text="t('common.no')"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <div class="discord-settings__bot-test">
                    <el-button :loading="isBotStatusLoading" :disabled="isSubmitting" @click="loadBotStatus">
                      {{ t('views.discordIntegration.settings.actions.refreshBotStatus') }}
                    </el-button>
                    <el-button :loading="isSlashSyncing" :disabled="isSubmitting || !form.enableBotIntegration || !form.enableBotSlashCommands" @click="onSyncSlashCommands">
                      {{ t('views.discordIntegration.settings.actions.syncSlashCommands') }}
                    </el-button>
                    <el-button :loading="isBotTesting" :disabled="isSubmitting || !form.enableBotIntegration" @click="onTestBot">
                      {{ t('views.discordIntegration.settings.actions.testBot') }}
                    </el-button>
                  </div>
                </el-col>
              </el-row>

              <el-alert
                v-if="botTestResult"
                :type="botTestResult.succeeded ? 'success' : 'error'"
                show-icon
                :closable="false"
                :title="botTestResult.message"
              >
                <template v-if="botTestResult.succeeded" #default>
                  {{ t('views.discordIntegration.settings.messages.botTestSuccessDetail', {
                    botUsername: botTestResult.botUsername || '-',
                    botUserId: botTestResult.botUserId || '-',
                  }) }}
                </template>
              </el-alert>
            </section>
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
            <el-collapse class="discord-settings__advanced-collapse">
              <el-collapse-item name="network">
                <template #title>
                  <span class="discord-settings__collapse-title">{{ t('views.discordIntegration.settings.sections.networkProxy') }}</span>
                </template>
                <section class="discord-settings__section discord-settings__section--advanced">
                  <div class="discord-settings__section-header">
                    <div>
                      <h3>{{ t('views.discordIntegration.settings.sections.networkProxy') }}</h3>
                      <p>{{ t('views.discordIntegration.settings.sections.networkProxyDescription') }}</p>
                    </div>
                    <el-switch
                      v-model="form.useProxy"
                      inline-prompt
                      :active-text="t('common.yes')"
                      :inactive-text="t('common.no')"
                    />
                  </div>

                  <el-row :gutter="12">
                    <el-col :xs="24" :md="12">
                      <el-form-item prop="proxyUrl" :label="t('views.discordIntegration.settings.fields.proxyUrl')">
                        <el-input
                          v-model="form.proxyUrl"
                          clearable
                          :disabled="!form.useProxy"
                          :placeholder="t('views.discordIntegration.settings.placeholders.proxyUrl')"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :md="12">
                      <el-form-item prop="bypassProxyOnLocal" :label="t('views.discordIntegration.settings.fields.bypassProxyOnLocal')">
                        <el-switch
                          v-model="form.bypassProxyOnLocal"
                          :disabled="!form.useProxy"
                          inline-prompt
                          :active-text="t('common.yes')"
                          :inactive-text="t('common.no')"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :md="12">
                      <el-form-item prop="proxyUsername" :label="t('views.discordIntegration.settings.fields.proxyUsername')">
                        <el-input
                          v-model="form.proxyUsername"
                          clearable
                          maxlength="128"
                          :disabled="!form.useProxy"
                          :placeholder="t('views.discordIntegration.settings.placeholders.proxyUsername')"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :md="12">
                      <el-form-item prop="proxyPassword" :label="t('views.discordIntegration.settings.fields.proxyPassword')">
                        <el-input
                          v-model="form.proxyPassword"
                          type="password"
                          show-password
                          clearable
                          maxlength="256"
                          autocomplete="new-password"
                          :disabled="!form.useProxy"
                          :placeholder="t('views.discordIntegration.settings.placeholders.proxyPassword')"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </section>
              </el-collapse-item>
            </el-collapse>
          </el-col>

          <el-col :xs="24">
            <section class="discord-settings__section">
              <div class="discord-settings__section-header">
                <div>
                  <h3>{{ t('views.discordIntegration.settings.sections.webhookTargets') }}</h3>
                  <p>{{ t('views.discordIntegration.settings.sections.webhookTargetsDescription') }}</p>
                </div>
                <el-button type="primary" plain @click="addWebhookTarget">
                  {{ t('views.discordIntegration.settings.actions.addWebhookTarget') }}
                </el-button>
              </div>

              <div class="discord-settings__targets">
                <div
                  v-for="(target, index) in form.webhookTargets"
                  :key="index"
                  class="discord-settings__target"
                >
                  <div class="discord-settings__target-header">
                    <el-switch
                      v-model="target.isEnabled"
                      inline-prompt
                      :active-text="t('common.yes')"
                      :inactive-text="t('common.no')"
                    />
                    <el-button type="danger" plain size="small" @click="removeWebhookTarget(index)">
                      {{ t('common.delete') }}
                    </el-button>
                  </div>
                  <el-row :gutter="12">
                    <el-col :xs="24" :md="8">
                      <el-form-item :label="t('views.discordIntegration.settings.fields.webhookTargetKey')">
                        <el-input v-model="target.key" clearable placeholder="admin" />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :md="8">
                      <el-form-item :label="t('views.discordIntegration.settings.fields.webhookTargetName')">
                        <el-input v-model="target.displayName" clearable />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :md="8">
                      <el-form-item :label="t('views.discordIntegration.settings.fields.webhookTargetUrl')">
                        <el-input
                          v-model="target.webhookUrl"
                          type="password"
                          show-password
                          clearable
                          autocomplete="off"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </section>
          </el-col>

          <el-col :xs="24">
            <section class="discord-settings__section discord-settings__section--danger">
              <div class="discord-settings__section-header">
                <div>
                  <h3>{{ t('views.discordIntegration.settings.sections.commandRelay') }}</h3>
                  <p>{{ t('views.discordIntegration.settings.sections.commandRelayDescription') }}</p>
                </div>
                <el-switch
                  v-model="form.enableDiscordCommandExecution"
                  inline-prompt
                  :active-text="t('common.yes')"
                  :inactive-text="t('common.no')"
                />
              </div>
              <el-alert
                type="warning"
                show-icon
                :closable="false"
                :title="t('views.discordIntegration.settings.messages.commandRelayWarning')"
              />
              <el-row :gutter="12">
                <el-col :xs="24" :md="8">
                  <el-form-item prop="discordCommandPrefix" :label="t('views.discordIntegration.settings.fields.discordCommandPrefix')">
                    <el-input
                      v-model="form.discordCommandPrefix"
                      clearable
                      maxlength="20"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="16">
                  <el-form-item prop="discordCommandAllowList" :label="t('views.discordIntegration.settings.fields.discordCommandAllowList')">
                    <el-select
                      v-model="form.discordCommandAllowList"
                      class="w-full"
                      multiple
                      filterable
                      allow-create
                      default-first-option
                      clearable
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item prop="enableAccountBinding" :label="t('views.discordIntegration.settings.fields.enableAccountBinding')">
                    <el-switch
                      v-model="form.enableAccountBinding"
                      inline-prompt
                      :active-text="t('common.yes')"
                      :inactive-text="t('common.no')"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </section>
          </el-col>

          <el-col :xs="24">
            <section class="discord-settings__section">
              <div class="discord-settings__section-header">
                <div>
                  <h3>{{ t('views.discordIntegration.settings.sections.accountBindings') }}</h3>
                  <p>{{ t('views.discordIntegration.settings.sections.accountBindingsDescription') }}</p>
                </div>
                <el-button :loading="isBindingsLoading" plain @click="loadBindings">
                  {{ t('components.myTable.refresh') }}
                </el-button>
              </div>

              <div class="discord-settings__binding-toolbar">
                <el-input
                  v-model="bindingKeyword"
                  clearable
                  :placeholder="t('views.discordIntegration.settings.placeholders.bindingKeyword')"
                  @keyup.enter="loadBindings"
                />
                <el-button :loading="isBindingsLoading" @click="loadBindings">
                  {{ t('components.myTable.search') }}
                </el-button>
              </div>

              <el-form
                ref="bindingFormRef"
                :model="bindingForm"
                :rules="bindingRules"
                label-position="top"
                class="discord-settings__binding-form"
                @submit.prevent="onSubmitBinding"
              >
                <el-row :gutter="12">
                  <el-col :xs="24" :md="6">
                    <el-form-item prop="playerId" :label="t('views.discordIntegration.settings.fields.bindingPlayerId')">
                      <el-input v-model="bindingForm.playerId" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="6">
                    <el-form-item prop="playerName" :label="t('views.discordIntegration.settings.fields.bindingPlayerName')">
                      <el-input v-model="bindingForm.playerName" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="6">
                    <el-form-item prop="discordUserId" :label="t('views.discordIntegration.settings.fields.bindingDiscordUserId')">
                      <el-input v-model="bindingForm.discordUserId" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="6">
                    <el-form-item prop="discordUsername" :label="t('views.discordIntegration.settings.fields.bindingDiscordUsername')">
                      <el-input v-model="bindingForm.discordUsername" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="6">
                    <el-form-item prop="isActive" :label="t('views.discordIntegration.settings.fields.bindingIsActive')">
                      <el-switch
                        v-model="bindingForm.isActive"
                        inline-prompt
                        :active-text="t('common.yes')"
                        :inactive-text="t('common.no')"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="18">
                    <el-form-item class="discord-settings__binding-actions">
                      <el-button :disabled="isBindingSubmitting" @click="resetBindingForm">
                        {{ t('common.reset') }}
                      </el-button>
                      <el-button type="primary" :loading="isBindingSubmitting" @click="onSubmitBinding">
                        {{ bindingForm.id ? t('common.save') : t('components.myTable.add') }}
                      </el-button>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>

              <el-table
                v-loading="isBindingsLoading"
                :data="bindings"
                row-key="id"
                class="discord-settings__binding-table"
              >
                <el-table-column prop="playerName" :label="t('views.discordIntegration.settings.fields.bindingPlayerName')" min-width="140" />
                <el-table-column prop="playerId" :label="t('views.discordIntegration.settings.fields.bindingPlayerId')" min-width="220" show-overflow-tooltip />
                <el-table-column prop="discordUsername" :label="t('views.discordIntegration.settings.fields.bindingDiscordUsername')" min-width="160" />
                <el-table-column prop="discordUserId" :label="t('views.discordIntegration.settings.fields.bindingDiscordUserId')" min-width="180" show-overflow-tooltip />
                <el-table-column :label="t('views.discordIntegration.settings.fields.bindingIsActive')" width="110">
                  <template #default="{ row }">
                    <el-tag :type="row.isActive ? 'success' : 'info'" effect="plain">
                      {{ row.isActive ? t('common.yes') : t('common.no') }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column :label="t('components.myTable.operation')" width="160" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" @click="editBindingRow(row)">
                      {{ t('common.edit') }}
                    </el-button>
                    <el-button link type="danger" @click="deleteBindingRow(row)">
                      {{ t('common.delete') }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <div class="discord-settings__subsection">
                <div class="discord-settings__section-header">
                  <div>
                    <h3>{{ t('views.discordIntegration.settings.sections.bindingCodes') }}</h3>
                    <p>{{ t('views.discordIntegration.settings.sections.bindingCodesDescription') }}</p>
                  </div>
                  <div class="discord-settings__section-actions">
                    <el-button :loading="isBindingCodeCleaning" plain @click="onCleanupExpiredBindingCodes">
                      {{ t('views.discordIntegration.settings.actions.cleanupExpiredBindingCodes') }}
                    </el-button>
                    <el-button :loading="isBindingCodesLoading" plain @click="loadBindingCodes">
                      {{ t('components.myTable.refresh') }}
                    </el-button>
                  </div>
                </div>

                <div class="discord-settings__binding-code-grid">
                  <el-form
                    ref="bindingCodeCreateFormRef"
                    :model="bindingCodeCreateForm"
                    :rules="bindingCodeCreateRules"
                    label-position="top"
                    class="discord-settings__binding-form"
                    @submit.prevent="onCreateBindingCode"
                  >
                    <h4>{{ t('views.discordIntegration.settings.sections.createBindingCode') }}</h4>
                    <el-form-item prop="playerId" :label="t('views.discordIntegration.settings.fields.bindingPlayerId')">
                      <el-input v-model="bindingCodeCreateForm.playerId" clearable />
                    </el-form-item>
                    <el-form-item prop="playerName" :label="t('views.discordIntegration.settings.fields.bindingPlayerName')">
                      <el-input v-model="bindingCodeCreateForm.playerName" clearable />
                    </el-form-item>
                    <el-form-item prop="expiresInMinutes" :label="t('views.discordIntegration.settings.fields.bindingCodeExpiresInMinutes')">
                      <el-input-number
                        v-model="bindingCodeCreateForm.expiresInMinutes"
                        class="w-full"
                        :min="1"
                        :max="60"
                        :precision="0"
                      />
                    </el-form-item>
                    <div class="discord-settings__inline-actions">
                      <el-button :disabled="isBindingCodeCreating" @click="resetBindingCodeCreateForm">
                        {{ t('common.reset') }}
                      </el-button>
                      <el-button type="primary" :loading="isBindingCodeCreating" @click="onCreateBindingCode">
                        {{ t('views.discordIntegration.settings.actions.createBindingCode') }}
                      </el-button>
                    </div>
                    <el-alert
                      v-if="latestCreatedBindingCode"
                      type="success"
                      show-icon
                      :closable="false"
                    >
                      <template #title>
                        <span class="discord-settings__code">{{ latestCreatedBindingCode.code }}</span>
                      </template>
                      <template #default>
                        {{ t('views.discordIntegration.settings.messages.bindingCodeCreatedDetail', {
                          expiresAt: formatTimestamp(latestCreatedBindingCode.expiresAt),
                        }) }}
                      </template>
                    </el-alert>
                  </el-form>

                  <el-form
                    ref="bindingCodeRedeemFormRef"
                    :model="bindingCodeRedeemForm"
                    :rules="bindingCodeRedeemRules"
                    label-position="top"
                    class="discord-settings__binding-form"
                    @submit.prevent="onRedeemBindingCode"
                  >
                    <h4>{{ t('views.discordIntegration.settings.sections.redeemBindingCode') }}</h4>
                    <el-form-item prop="code" :label="t('views.discordIntegration.settings.fields.bindingCode')">
                      <el-input v-model="bindingCodeRedeemForm.code" clearable />
                    </el-form-item>
                    <el-form-item prop="discordUserId" :label="t('views.discordIntegration.settings.fields.bindingDiscordUserId')">
                      <el-input v-model="bindingCodeRedeemForm.discordUserId" clearable />
                    </el-form-item>
                    <el-form-item prop="discordUsername" :label="t('views.discordIntegration.settings.fields.bindingDiscordUsername')">
                      <el-input v-model="bindingCodeRedeemForm.discordUsername" clearable />
                    </el-form-item>
                    <div class="discord-settings__inline-actions">
                      <el-button :disabled="isBindingCodeRedeeming" @click="resetBindingCodeRedeemForm">
                        {{ t('common.reset') }}
                      </el-button>
                      <el-button type="primary" :loading="isBindingCodeRedeeming" @click="onRedeemBindingCode">
                        {{ t('views.discordIntegration.settings.actions.redeemBindingCode') }}
                      </el-button>
                    </div>
                    <el-alert
                      v-if="latestRedeemResult"
                      :type="latestRedeemResult.succeeded ? 'success' : 'error'"
                      show-icon
                      :closable="false"
                      :title="latestRedeemResult.message"
                    />
                  </el-form>
                </div>

                <div class="discord-settings__binding-toolbar">
                  <el-input
                    v-model="bindingCodeKeyword"
                    clearable
                    :placeholder="t('views.discordIntegration.settings.placeholders.bindingCodeKeyword')"
                    @keyup.enter="loadBindingCodes"
                  />
                  <el-button :loading="isBindingCodesLoading" @click="loadBindingCodes">
                    {{ t('components.myTable.search') }}
                  </el-button>
                </div>

                <el-table
                  v-loading="isBindingCodesLoading"
                  :data="bindingCodes"
                  row-key="id"
                  class="discord-settings__binding-table"
                >
                  <el-table-column prop="codePrefix" :label="t('views.discordIntegration.settings.fields.bindingCodePrefix')" width="110">
                    <template #default="{ row }">
                      <span class="discord-settings__mono">{{ row.codePrefix }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="playerName" :label="t('views.discordIntegration.settings.fields.bindingPlayerName')" min-width="140" />
                  <el-table-column prop="playerId" :label="t('views.discordIntegration.settings.fields.bindingPlayerId')" min-width="220" show-overflow-tooltip />
                  <el-table-column :label="t('views.discordIntegration.settings.fields.bindingCodeStatus')" width="110">
                    <template #default="{ row }">
                      <el-tag :type="getBindingCodeStatusForRow(row).type" effect="plain">
                        {{ getBindingCodeStatusForRow(row).text }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column :label="t('views.discordIntegration.settings.fields.bindingCodeExpiresAt')" min-width="170">
                    <template #default="{ row }">
                      <span class="discord-settings__mono">{{ formatTimestamp(row.expiresAt) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column :label="t('views.discordIntegration.settings.fields.bindingCodeRedeemedAt')" min-width="170">
                    <template #default="{ row }">
                      <span class="discord-settings__mono">{{ formatTimestamp(row.redeemedAt) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="redeemedDiscordUsername" :label="t('views.discordIntegration.settings.fields.bindingDiscordUsername')" min-width="160" />
                  <el-table-column :label="t('components.myTable.operation')" width="100" fixed="right">
                    <template #default="{ row }">
                      <el-button link type="danger" @click="deleteBindingCodeRow(row)">
                        {{ t('common.delete') }}
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </section>
          </el-col>

          <el-col :xs="24">
            <section class="discord-settings__section">
              <div class="discord-settings__section-header">
                <div>
                  <h3>{{ t('views.discordIntegration.settings.sections.relayTests') }}</h3>
                  <p>{{ t('views.discordIntegration.settings.sections.relayTestsDescription') }}</p>
                </div>
              </div>
              <div class="discord-settings__test-grid">
                <div class="discord-settings__test-panel">
                  <h4>{{ t('views.discordIntegration.settings.sections.commandRelayTest') }}</h4>
                  <el-input v-model="commandTestForm.commandText" clearable />
                  <el-input v-model="commandTestForm.discordUserId" clearable :placeholder="t('views.discordIntegration.settings.fields.discordUserId')" />
                  <el-input v-model="commandTestForm.discordUsername" clearable :placeholder="t('views.discordIntegration.settings.fields.discordUsername')" />
                  <el-checkbox v-model="commandTestForm.inMainThread">
                    {{ t('views.discordIntegration.settings.fields.inMainThread') }}
                  </el-checkbox>
                  <el-button type="warning" :loading="isCommandTesting" @click="onTestDiscordCommand">
                    {{ t('views.discordIntegration.settings.actions.testCommandRelay') }}
                  </el-button>
                  <pre v-if="commandTestResult" class="discord-settings__result">{{ JSON.stringify(commandTestResult, null, 2) }}</pre>
                </div>

                <div class="discord-settings__test-panel">
                  <h4>{{ t('views.discordIntegration.settings.sections.chatRelayTest') }}</h4>
                  <el-input v-model="chatRelayTestForm.message" clearable />
                  <el-input v-model="chatRelayTestForm.discordUserId" clearable :placeholder="t('views.discordIntegration.settings.fields.discordUserId')" />
                  <el-input v-model="chatRelayTestForm.discordUsername" clearable :placeholder="t('views.discordIntegration.settings.fields.discordUsername')" />
                  <el-button type="primary" :loading="isChatRelayTesting" @click="onTestDiscordChatRelay">
                    {{ t('views.discordIntegration.settings.actions.testChatRelay') }}
                  </el-button>
                  <pre v-if="chatRelayTestResult" class="discord-settings__result">{{ JSON.stringify(chatRelayTestResult, null, 2) }}</pre>
                </div>
              </div>
            </section>
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
            <section class="discord-settings__section">
              <div class="discord-settings__section-header">
                <div>
                  <h3>{{ t('views.discordIntegration.settings.sections.failureAlerts') }}</h3>
                  <p>{{ t('views.discordIntegration.settings.sections.failureAlertsDescription') }}</p>
                </div>
                <el-switch
                  v-model="form.enableEventAutomationFailureAlerts"
                  inline-prompt
                  :active-text="t('common.yes')"
                  :inactive-text="t('common.no')"
                />
              </div>
              <el-row :gutter="12">
                <el-col :xs="24" :md="8">
                  <el-form-item prop="eventAutomationFailureAlertTargetKey" :label="t('views.discordIntegration.settings.fields.eventAutomationFailureAlertTargetKey')">
                    <el-select
                      v-model="form.eventAutomationFailureAlertTargetKey"
                      class="w-full"
                      filterable
                      allow-create
                      clearable
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
                <el-col :xs="24" :md="16">
                  <el-form-item prop="eventAutomationFailureAlertMessage" :label="t('views.discordIntegration.settings.fields.eventAutomationFailureAlertMessage')">
                    <el-input
                      v-model="form.eventAutomationFailureAlertMessage"
                      type="textarea"
                      :rows="3"
                      maxlength="1900"
                      show-word-limit
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </section>
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

.discord-settings__hero {
  display: grid;
  gap: 14px;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
  background: var(--el-bg-color);
}

.discord-settings__hero-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  h2 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 18px;
    line-height: 26px;
  }

  p {
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 20px;
  }
}

.discord-settings__hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.discord-settings__status-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.discord-settings__status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 44px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 8px 10px;
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.discord-settings__status-item.is-active {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
  color: var(--el-text-color-primary);
}

.discord-settings__form {
  width: min(100%, 1100px);
}

.discord-settings__section {
  display: grid;
  gap: 12px;
  margin: 4px 0 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 14px;
  background: var(--el-fill-color-extra-light);
}

.discord-settings__section--advanced {
  background: var(--el-fill-color-blank);
}

.discord-settings__section--bot {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}

.discord-settings__section--danger {
  border-color: var(--el-color-warning-light-7);
}

.discord-settings__advanced-collapse {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 0 12px;
  background: var(--el-bg-color);
}

.discord-settings__collapse-title {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.discord-settings__section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 15px;
    line-height: 22px;
  }

  p {
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }
}

.discord-settings__section-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.discord-settings__subsection {
  display: grid;
  gap: 12px;
  border-top: 1px dashed var(--el-border-color);
  padding-top: 14px;
}

.discord-settings__targets {
  display: grid;
  gap: 12px;
}

.discord-settings__target {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  background: var(--el-bg-color);
}

.discord-settings__target-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.discord-settings__binding-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.discord-settings__binding-form {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  background: var(--el-bg-color);
}

.discord-settings__binding-actions :deep(.el-form-item__content) {
  justify-content: flex-end;
  align-items: end;
  height: 100%;
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

.discord-settings__binding-code-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  h4 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 14px;
    line-height: 20px;
  }
}

.discord-settings__inline-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.discord-settings__binding-table {
  width: 100%;
}

.discord-settings__code,
.discord-settings__mono {
  font-family: var(--el-font-family-monospace, ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace);
}

.discord-settings__code {
  font-size: 16px;
  letter-spacing: 0;
}

.discord-settings__test-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.discord-settings__test-panel {
  display: grid;
  gap: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  background: var(--el-bg-color);

  h4 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 14px;
    line-height: 20px;
  }
}

.discord-settings__result {
  overflow: auto;
  max-height: 220px;
  margin: 0;
  border-radius: 6px;
  padding: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 18px;
}

@media (max-width: 1200px) {
  .discord-settings__status-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .discord-settings {
    max-width: none;
  }

  .discord-settings__hero-main,
  .discord-settings__section-header {
    flex-direction: column;
  }

  .discord-settings__hero-actions,
  .discord-settings__section-actions,
  .discord-settings__inline-actions {
    justify-content: flex-start;
  }

  .discord-settings__status-grid,
  .discord-settings__steps,
  .discord-settings__runtime-grid,
  .discord-settings__binding-toolbar,
  .discord-settings__binding-code-grid,
  .discord-settings__test-grid {
    grid-template-columns: 1fr;
  }

  .discord-settings__binding-actions :deep(.el-form-item__content) {
    justify-content: flex-start;
  }

  .discord-settings__bot-test {
    justify-content: flex-start;
    min-height: auto;
  }
}
</style>
