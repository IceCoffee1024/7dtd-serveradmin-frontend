<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import type {
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
  discordIntegrationGetSettings,
  discordIntegrationResetSettings,
  discordIntegrationTestWebhook,
  discordIntegrationUpdateSettings,
} from '~/generated/api/sdk.gen';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'DiscordIntegrationSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  webhookUrl: string;
  defaultUsername: string;
  defaultAvatarUrl: string;
  webhookTargets: WebhookTargetFormModel[];
  timeoutSeconds: number;
  allowEventAutomationMessages: boolean;
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
const testMessage = ref('');
const testWebhookTargetKey = ref('');
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
  defaultUsername: v.pipe(v.string(), v.maxLength(80)),
  defaultAvatarUrl: v.string(),
  timeoutSeconds: v.pipe(v.number(), v.minValue(1), v.maxValue(30)),
  allowEventAutomationMessages: v.boolean(),
  enableEventAutomationFailureAlerts: v.boolean(),
  eventAutomationFailureAlertTargetKey: v.string(),
  eventAutomationFailureAlertMessage: v.string(),
});

const rules: FormRules = generateElementRules(schema);

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    webhookUrl: '',
    defaultUsername: '7DTD Server',
    defaultAvatarUrl: '',
    webhookTargets: [
      { key: 'public', displayName: 'Public channel', isEnabled: false, webhookUrl: '' },
      { key: 'admin', displayName: 'Admin channel', isEnabled: false, webhookUrl: '' },
      { key: 'audit', displayName: 'Audit channel', isEnabled: false, webhookUrl: '' },
    ],
    timeoutSeconds: 10,
    allowEventAutomationMessages: true,
    enableEventAutomationFailureAlerts: false,
    eventAutomationFailureAlertTargetKey: 'admin',
    eventAutomationFailureAlertMessage: '[7DTD] Automation rule failed: {ruleName} ({triggerType}) - {errorMessage}',
  };
}

function toFormModel(data?: DiscordIntegrationFeatureSettingsDto | null): FormModel {
  return {
    isEnabled: data?.isEnabled ?? false,
    webhookUrl: data?.webhookUrl ?? '',
    defaultUsername: data?.defaultUsername ?? '7DTD Server',
    defaultAvatarUrl: data?.defaultAvatarUrl ?? '',
    webhookTargets: normalizeWebhookTargets(data?.webhookTargets),
    timeoutSeconds: data?.timeoutSeconds ?? 10,
    allowEventAutomationMessages: data?.allowEventAutomationMessages ?? true,
    enableEventAutomationFailureAlerts: data?.enableEventAutomationFailureAlerts ?? false,
    eventAutomationFailureAlertTargetKey: data?.eventAutomationFailureAlertTargetKey ?? 'admin',
    eventAutomationFailureAlertMessage: data?.eventAutomationFailureAlertMessage
      ?? '[7DTD] Automation rule failed: {ruleName} ({triggerType}) - {errorMessage}',
  };
}

function applyFormValues(values: FormModel) {
  form.isEnabled = values.isEnabled;
  form.webhookUrl = values.webhookUrl;
  form.defaultUsername = values.defaultUsername;
  form.defaultAvatarUrl = values.defaultAvatarUrl;
  form.webhookTargets = values.webhookTargets.map(target => ({ ...target }));
  form.timeoutSeconds = values.timeoutSeconds;
  form.allowEventAutomationMessages = values.allowEventAutomationMessages;
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
    enableEventAutomationFailureAlerts: values.enableEventAutomationFailureAlerts,
    eventAutomationFailureAlertTargetKey: values.eventAutomationFailureAlertTargetKey.trim() || null,
    eventAutomationFailureAlertMessage: values.eventAutomationFailureAlertMessage.trim() || null,
  };
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

onMounted(loadSettings);

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
}
</style>
