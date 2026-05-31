<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type { AppSettings } from '~/generated/api/types.gen';
import { useMutation, useQuery } from '@pinia/colada';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  appSettingsGetQuery,
  appSettingsUpdateMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'AppSettings' });

const { t } = useI18n();
const { toast, confirm } = usePopup();

interface FormModel {
  webUrl: string;
  userName: string;
  password: string;
  accessTokenExpireTime: number;
  refreshTokenExpireTime: number;
  serverConfigFile: string;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const formRef = ref<FormExpose>();
const settings = ref<AppSettings | null>(null);

function buildDefaults(): FormModel {
  return {
    webUrl: '',
    userName: '',
    password: '',
    accessTokenExpireTime: 0,
    refreshTokenExpireTime: 0,
    serverConfigFile: '',
  };
}

const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const isDirty = computed(() => !isEqual(form, initialValues.value));

const AppSettingsSchema = v.object({
  webUrl: v.pipe(v.string(), v.minLength(1), v.url()),
  userName: v.pipe(v.string(), v.minLength(1)),
  password: v.pipe(v.string(), v.minLength(1)),
  accessTokenExpireTime: v.pipe(v.number(), v.minValue(0)),
  refreshTokenExpireTime: v.pipe(v.number(), v.minValue(0)),
  serverConfigFile: v.pipe(v.string(), v.minLength(1)),
});

const rules: FormRules = generateElementRules(AppSettingsSchema);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'webUrl',
    label: t('views.appSettings.fields.webUrl'),
    el: 'el-input',
    tooltip: t('views.appSettings.tooltips.webUrl'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'userName',
    label: t('views.appSettings.fields.userName'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'password',
    label: t('views.appSettings.fields.password'),
    el: 'el-input',
    props: { showPassword: true, autocomplete: 'new-password' },
    tooltip: t('views.appSettings.tooltips.password'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'serverConfigFile',
    label: t('views.appSettings.fields.serverConfigFile'),
    el: 'el-input',
    tooltip: t('views.appSettings.tooltips.serverConfigFile'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'accessTokenExpireTime',
    label: t('views.appSettings.fields.accessTokenExpireTime'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    tooltip: t('views.appSettings.tooltips.accessTokenExpireTime'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'refreshTokenExpireTime',
    label: t('views.appSettings.fields.refreshTokenExpireTime'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    tooltip: t('views.appSettings.tooltips.refreshTokenExpireTime'),
    span: { xs: 24, md: 12 },
  },
]);

const settingsQuery = useQuery(appSettingsGetQuery());
const updateSettingsMutation = useMutation({
  ...appSettingsUpdateMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('AppSettings');
  },
});
const isLoading = computed(() => settingsQuery.isPending.value);
const isSubmitting = computed(() => updateSettingsMutation.isLoading.value);
const overviewItems = computed(() => [
  {
    label: t('views.appSettings.fields.webUrl'),
    value: form.webUrl || '--',
  },
  {
    label: t('views.appSettings.fields.userName'),
    value: form.userName || '--',
  },
  {
    label: t('views.appSettings.fields.serverConfigFile'),
    value: form.serverConfigFile || '--',
  },
]);

function mapSettings(data: AppSettings | null | undefined): FormModel {
  const source = data ?? {
    webUrl: '',
    userName: '',
    password: '',
    accessTokenExpireTime: 0,
    refreshTokenExpireTime: 0,
    serverConfigFile: '',
  };
  return {
    webUrl: source.webUrl,
    userName: source.userName,
    password: source.password,
    accessTokenExpireTime: source.accessTokenExpireTime,
    refreshTokenExpireTime: source.refreshTokenExpireTime,
    serverConfigFile: source.serverConfigFile,
  };
}

function applyFormValues(values: FormModel): void {
  form.webUrl = values.webUrl;
  form.userName = values.userName;
  form.password = values.password;
  form.accessTokenExpireTime = values.accessTokenExpireTime;
  form.refreshTokenExpireTime = values.refreshTokenExpireTime;
  form.serverConfigFile = values.serverConfigFile;
}

watch(
  () => settingsQuery.data.value,
  async (data) => {
    if (data == null) {
      return;
    }

    settings.value = data;
    initialValues.value = mapSettings(data);
    applyFormValues(initialValues.value);
    await nextTick();
    formRef.value?.clearValidate();
  },
  { immediate: true },
);

watch(
  () => settingsQuery.error.value,
  (error) => {
    if (error == null) {
      return;
    }

    console.error(error);
    initialValues.value = buildDefaults();
    applyFormValues(initialValues.value);
  },
);

async function refreshSettings() {
  const state = await settingsQuery.refetch(true);
  if (state.status !== 'success') {
    return;
  }

  settings.value = state.data;
  initialValues.value = mapSettings(state.data);
  applyFormValues(initialValues.value);
  await nextTick();
  formRef.value?.clearValidate();
}

function onReset() {
  applyFormValues(initialValues.value);
  nextTick(() => formRef.value?.clearValidate());
}

function toPayload(values: FormModel): AppSettings {
  return {
    webUrl: values.webUrl,
    userName: values.userName,
    password: values.password,
    accessTokenExpireTime: Number(values.accessTokenExpireTime ?? 0),
    refreshTokenExpireTime: Number(values.refreshTokenExpireTime ?? 0),
    serverConfigFile: values.serverConfigFile,
    databasePath: settings.value?.databasePath ?? '',
    enableRequestLog: settings.value?.enableRequestLog ?? false,
  };
}

async function onSubmit() {
  if (!formRef.value) {
    return;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  try {
    await updateSettingsMutation.mutateAsync({ body: toPayload(form) });
    toast({
      type: 'success',
      title: t('views.appSettings.actions.save'),
      text: t('views.appSettings.messages.saveSuccess'),
    });
    await refreshSettings();
  }
  catch (error) {
    console.error(error);
  }
}

onBeforeRouteLeave(async () => {
  if (!isDirty.value) {
    return true;
  }
  return await confirm({
    type: 'warning',
    text: t('views.appSettings.messages.unsavedChanges'),
  });
});
</script>

<template>
  <div class="app-settings-page">
    <div class="app-settings-page__overview">
      <div
        v-for="item in overviewItems"
        :key="item.label"
        class="app-settings-page__metric"
      >
        <span class="app-settings-page__metric-label">{{ item.label }}</span>
        <strong class="app-settings-page__metric-value" :title="item.value">{{ item.value }}</strong>
      </div>
    </div>

    <div class="app-settings-page__grid">
      <el-card shadow="never" class="app-settings-shell">
        <div v-if="isLoading" class="app-settings-shell__skeleton">
          <el-skeleton v-for="index in 4" :key="index" animated>
            <template #template>
              <el-skeleton-item variant="text" class="h-8" />
            </template>
          </el-skeleton>
        </div>
        <template v-else>
          <MyForm
            id="appSettingsForm"
            ref="formRef"
            v-model="form"
            :fields="fields"
            :rules="rules"
            label-position="top"
            label-width="auto"
            :gutter="16"
            class="app-settings-form"
            @submit.prevent="onSubmit"
          />

          <div class="app-settings-shell__actions">
            <el-button class="app-settings-shell__ghost" :disabled="isSubmitting" @click="onReset">
              <el-icon><icon-mdi-refresh /></el-icon>
              {{ t('views.appSettings.actions.reset') }}
            </el-button>
            <el-button
              type="primary"
              class="app-settings-shell__save"
              :loading="isSubmitting"
              :disabled="!isDirty"
              @click="onSubmit"
            >
              <el-icon><icon-mdi-check /></el-icon>
              {{ t('views.appSettings.actions.save') }}
            </el-button>
          </div>
        </template>
      </el-card>

      <el-card shadow="never" class="app-settings-side">
        <div class="app-settings-side__status" :class="{ 'app-settings-side__status--dirty': isDirty }">
          <span>{{ t('views.appSettings.actions.save') }}</span>
          <strong>{{ isDirty ? t('common.yes') : t('common.no') }}</strong>
        </div>

        <div class="app-settings-side__list">
          <div class="app-settings-side__item">
            <span>{{ t('views.appSettings.fields.accessTokenExpireTime') }}</span>
            <strong>{{ form.accessTokenExpireTime }}</strong>
          </div>
          <div class="app-settings-side__item">
            <span>{{ t('views.appSettings.fields.refreshTokenExpireTime') }}</span>
            <strong>{{ form.refreshTokenExpireTime }}</strong>
          </div>
          <div class="app-settings-side__item">
            <span>{{ t('views.appSettings.fields.serverConfigFile') }}</span>
            <strong :title="form.serverConfigFile">{{ form.serverConfigFile || '--' }}</strong>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-settings-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.app-settings-page__overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.app-settings-page__metric {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.05rem;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 8%, transparent), transparent 36%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.05);
}

.app-settings-page__metric-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--colors-primary);
}

.app-settings-page__metric-value {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 1rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-settings-page__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 1rem;
}

.app-settings-shell,
.app-settings-side {
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, white 30%);
  border-radius: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 7%, transparent), transparent 30%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));
  box-shadow:
    0 18px 44px color-mix(in srgb, var(--colors-primary) 8%, transparent),
    0 6px 18px rgba(15, 23, 42, 0.04);
}

.app-settings-shell {
  :deep(.el-card__body) {
    padding: 1.1rem 1.1rem 1rem;
  }
}

.app-settings-shell__skeleton {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.app-settings-shell__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.35rem;
  padding-top: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
}

.app-settings-shell__ghost,
.app-settings-shell__save {
  border-radius: 999px;
  padding-inline: 1rem;
}

.app-settings-shell__save {
  box-shadow: 0 12px 24px color-mix(in srgb, var(--colors-primary) 16%, transparent);
}

.app-settings-side {
  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
}

.app-settings-side__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-radius: 20px;
  background: color-mix(in srgb, var(--el-fill-color-light) 86%, white 14%);
  color: var(--el-text-color-primary);
  font-size: 0.84rem;
  font-weight: 700;
}

.app-settings-side__status--dirty {
  background: color-mix(in srgb, var(--el-color-warning) 12%, white 88%);
  color: #9a3412;
}

.app-settings-side__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.app-settings-side__item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
  border-radius: 20px;
  background: color-mix(in srgb, var(--el-bg-color) 98%, white 2%);
}

.app-settings-side__item span {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.app-settings-side__item strong {
  overflow: hidden;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .app-settings-page__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .app-settings-page__overview {
    grid-template-columns: 1fr;
  }

  .app-settings-shell__actions {
    flex-wrap: wrap;
    justify-content: stretch;
  }

  .app-settings-shell__actions :deep(.el-button) {
    flex: 1;
  }
}
</style>
