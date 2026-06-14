import type { FormInstance } from 'element-plus';
import type { ComputedRef, Ref } from 'vue';
import type { DiagnosticSummary } from './diagnosticsModel';
import type { FormModel } from './formModel';
import type {
  DiscordBotRuntimeStatusDto,
  DiscordBotTestResultDto,
  DiscordNetworkDiagnosticsDto,
  DiscordWebhookSendResultDto,
  DiscordWebhookTestRequestDto,
} from '~/generated/api/types.gen';
import { useI18n } from 'vue-i18n';
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
import { buildNetworkDiagnosticSummary } from './diagnosticsModel';
import { applyFormValues, toFormModel, toPayload } from './formModel';

interface UseDiscordSettingsRuntimeOptions {
  formRef: Readonly<Ref<FormInstance | null | undefined>>;
  form: FormModel;
  initialValues: Ref<FormModel>;
  isDirty: ComputedRef<boolean>;
  testMessage: Ref<string>;
  testWebhookTargetKey: Ref<string>;
}

interface UseDiscordSettingsRuntimeReturn {
  isLoading: Ref<boolean>;
  isSubmitting: Ref<boolean>;
  isTesting: Ref<boolean>;
  isBotTesting: Ref<boolean>;
  isBotStatusLoading: Ref<boolean>;
  isDiagnosticsRunning: Ref<boolean>;
  isSlashSyncing: Ref<boolean>;
  botTestResult: Ref<DiscordBotTestResultDto | null>;
  botStatus: Ref<DiscordBotRuntimeStatusDto | null>;
  networkDiagnostics: Ref<DiscordNetworkDiagnosticsDto | null>;
  networkDiagnosticSummary: ComputedRef<DiagnosticSummary | null>;
  loadBotStatus: () => Promise<void>;
  runNetworkDiagnostics: () => Promise<void>;
  loadSettings: () => Promise<void>;
  onSubmit: () => Promise<void>;
  onReset: () => Promise<void>;
  onTestWebhook: () => Promise<void>;
  onTestBot: () => Promise<void>;
  onSyncSlashCommands: () => Promise<void>;
}

/**
 * Coordinates Discord settings API calls and transient runtime state for the settings page.
 * @param options - Reactive form state owned by the settings page.
 * @returns Loading flags, runtime results, and action handlers used by the page template.
 */
export function useDiscordSettingsRuntime(options: UseDiscordSettingsRuntimeOptions): UseDiscordSettingsRuntimeReturn {
  const { t } = useI18n();
  const { confirm, toast } = usePopup();

  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const isTesting = ref(false);
  const isBotTesting = ref(false);
  const isBotStatusLoading = ref(false);
  const isDiagnosticsRunning = ref(false);
  const isSlashSyncing = ref(false);
  const botTestResult = ref<DiscordBotTestResultDto | null>(null);
  const botStatus = ref<DiscordBotRuntimeStatusDto | null>(null);
  const networkDiagnostics = ref<DiscordNetworkDiagnosticsDto | null>(null);
  const networkDiagnosticSummary = computed(() => buildNetworkDiagnosticSummary(networkDiagnostics.value, t));

  function showBotTestResult(result: DiscordBotTestResultDto | undefined): void {
    botTestResult.value = result ?? null;
    toast({
      type: result?.succeeded ? 'success' : 'error',
      text: result?.message || t('views.discordIntegration.settings.messages.botTestFailed'),
    });
  }

  async function loadBotStatus(): Promise<void> {
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

  async function onSubmit(): Promise<void> {
    const valid = await options.formRef.value?.validate().catch(() => false);
    if (!valid)
      return;

    try {
      isSubmitting.value = true;
      await discordIntegrationUpdateSettings({ body: toPayload(options.form), throwOnError: true });
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

  async function runNetworkDiagnostics(): Promise<void> {
    if (options.isDirty.value) {
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

  async function loadSettings(): Promise<void> {
    try {
      isLoading.value = true;
      const { data } = await discordIntegrationGetSettings({ throwOnError: true });
      options.initialValues.value = toFormModel(data);
      applyFormValues(options.form, options.initialValues.value);
      await nextTick();
      options.formRef.value?.clearValidate();
    }
    catch (error) {
      console.error(error);
    }
    finally {
      isLoading.value = false;
    }
  }

  async function onReset(): Promise<void> {
    const confirmed = await confirm({
      type: 'warning',
      text: t('views.discordIntegration.settings.messages.resetConfirm'),
    });
    if (!confirmed)
      return;

    try {
      isSubmitting.value = true;
      const { data } = await discordIntegrationResetSettings({ throwOnError: true });
      options.initialValues.value = toFormModel(data);
      applyFormValues(options.form, options.initialValues.value);
      await nextTick();
      options.formRef.value?.clearValidate();
      toast({ type: 'success', text: t('views.discordIntegration.settings.messages.resetSuccess') });
    }
    catch (error) {
      console.error(error);
    }
    finally {
      isSubmitting.value = false;
    }
  }

  function showTestResult(result: DiscordWebhookSendResultDto | undefined): void {
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

  async function onTestWebhook(): Promise<void> {
    const valid = await options.formRef.value?.validate().catch(() => false);
    if (!valid)
      return;

    if (options.isDirty.value) {
      const confirmed = await confirm({
        type: 'warning',
        text: t('views.discordIntegration.settings.messages.testWithUnsavedConfirm'),
      });
      if (!confirmed)
        return;

      await onSubmit();
      if (options.isDirty.value)
        return;
    }

    try {
      isTesting.value = true;
      const payload: DiscordWebhookTestRequestDto = {
        message: options.testMessage.value.trim() || null,
        username: options.form.defaultUsername.trim() || null,
        webhookTargetKey: options.testWebhookTargetKey.value.trim() || null,
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

  async function onTestBot(): Promise<void> {
    const valid = await options.formRef.value?.validate().catch(() => false);
    if (!valid)
      return;

    if (options.isDirty.value) {
      const confirmed = await confirm({
        type: 'warning',
        text: t('views.discordIntegration.settings.messages.botTestWithUnsavedConfirm'),
      });
      if (!confirmed)
        return;

      await onSubmit();
      if (options.isDirty.value)
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

  async function onSyncSlashCommands(): Promise<void> {
    if (options.isDirty.value) {
      const confirmed = await confirm({
        type: 'warning',
        text: t('views.discordIntegration.settings.messages.slashSyncWithUnsavedConfirm'),
      });
      if (!confirmed)
        return;

      await onSubmit();
      if (options.isDirty.value)
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

  return {
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
  };
}
