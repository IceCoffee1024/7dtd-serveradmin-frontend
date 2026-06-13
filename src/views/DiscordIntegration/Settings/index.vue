<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import type {
  DiscordAccountBindingDto,
  DiscordAccountBindingUpsertDto,
  DiscordChatRelayResultDto,
  DiscordCommandExecuteResultDto,
  DiscordIntegrationFeatureSettingsDto,
  DiscordWebhookSendResultDto,
  DiscordWebhookTargetDto,
  DiscordWebhookTestRequestDto,
} from '~/generated/api/types.gen';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import { usePopup } from '~/composables';
import {
  discordIntegrationDeleteBinding,
  discordIntegrationExecuteDiscordCommand,
  discordIntegrationGetBindings,
  discordIntegrationGetSettings,
  discordIntegrationRelayDiscordChat,
  discordIntegrationResetSettings,
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

const { t } = useI18n();
const { confirm, toast } = usePopup();

const formRef = useTemplateRef<FormInstance>('formRef');
const bindingFormRef = useTemplateRef<FormInstance>('bindingFormRef');
const isLoading = ref(false);
const isSubmitting = ref(false);
const isTesting = ref(false);
const isBindingsLoading = ref(false);
const isBindingSubmitting = ref(false);
const isCommandTesting = ref(false);
const isChatRelayTesting = ref(false);
const testMessage = ref('');
const testWebhookTargetKey = ref('');
const bindings = ref<DiscordAccountBindingDto[]>([]);
const bindingKeyword = ref('');
const bindingForm = reactive<BindingFormModel>(buildBindingDefaults());
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
      <el-alert
        class="discord-settings__alert"
        type="info"
        show-icon
        :closable="false"
        :title="t('views.discordIntegration.settings.description')"
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
            <section class="discord-settings__section">
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

      <div class="discord-settings__actions">
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
    </template>
  </div>
</template>

<style scoped>
.discord-settings {
  min-height: 0;
}

.discord-settings__alert {
  margin-bottom: 16px;
}

.discord-settings__form {
  max-width: 960px;
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

.discord-settings__binding-table {
  width: 100%;
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

.discord-settings__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .discord-settings__section-header {
    flex-direction: column;
  }

  .discord-settings__binding-toolbar,
  .discord-settings__test-grid {
    grid-template-columns: 1fr;
  }

  .discord-settings__binding-actions :deep(.el-form-item__content) {
    justify-content: flex-start;
  }
}
</style>
