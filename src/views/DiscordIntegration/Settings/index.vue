<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import type {
  DiscordIntegrationFeatureSettingsDto,
  DiscordWebhookSendResultDto,
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
  timeoutSeconds: number;
  allowEventAutomationMessages: boolean;
}

const { t } = useI18n();
const { confirm, toast } = usePopup();

const formRef = useTemplateRef<FormInstance>('formRef');
const isLoading = ref(false);
const isSubmitting = ref(false);
const isTesting = ref(false);
const testMessage = ref('');
const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const isDirty = computed(() => !isEqual(form, initialValues.value));

const schema = v.object({
  isEnabled: v.boolean(),
  webhookUrl: v.string(),
  defaultUsername: v.pipe(v.string(), v.maxLength(80)),
  defaultAvatarUrl: v.string(),
  timeoutSeconds: v.pipe(v.number(), v.minValue(1), v.maxValue(30)),
  allowEventAutomationMessages: v.boolean(),
});

const rules: FormRules = generateElementRules(schema);

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    webhookUrl: '',
    defaultUsername: '7DTD Server',
    defaultAvatarUrl: '',
    timeoutSeconds: 10,
    allowEventAutomationMessages: true,
  };
}

function toFormModel(data?: DiscordIntegrationFeatureSettingsDto | null): FormModel {
  return {
    isEnabled: data?.isEnabled ?? false,
    webhookUrl: data?.webhookUrl ?? '',
    defaultUsername: data?.defaultUsername ?? '7DTD Server',
    defaultAvatarUrl: data?.defaultAvatarUrl ?? '',
    timeoutSeconds: data?.timeoutSeconds ?? 10,
    allowEventAutomationMessages: data?.allowEventAutomationMessages ?? true,
  };
}

function applyFormValues(values: FormModel) {
  form.isEnabled = values.isEnabled;
  form.webhookUrl = values.webhookUrl;
  form.defaultUsername = values.defaultUsername;
  form.defaultAvatarUrl = values.defaultAvatarUrl;
  form.timeoutSeconds = values.timeoutSeconds;
  form.allowEventAutomationMessages = values.allowEventAutomationMessages;
}

function toPayload(values: FormModel): DiscordIntegrationFeatureSettingsDto {
  return {
    isEnabled: values.isEnabled,
    webhookUrl: values.webhookUrl.trim() || null,
    defaultUsername: values.defaultUsername.trim() || null,
    defaultAvatarUrl: values.defaultAvatarUrl.trim() || null,
    timeoutSeconds: Number(values.timeoutSeconds ?? 10),
    allowEventAutomationMessages: values.allowEventAutomationMessages,
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
    const { data } = await discordIntegrationTestWebhook({
      body: {
        message: testMessage.value.trim() || null,
        username: form.defaultUsername.trim() || null,
      },
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

.discord-settings__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
