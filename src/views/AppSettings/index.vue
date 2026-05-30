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
  <el-card shadow="never">
    <div v-if="isLoading" class="flex flex-col gap-4">
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

      <div class="mt-4 flex gap-2 justify-end">
        <el-button :disabled="isSubmitting" @click="onReset">
          <el-icon><icon-mdi-refresh /></el-icon>
          {{ t('views.appSettings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.appSettings.actions.save') }}
        </el-button>
      </div>
    </template>
  </el-card>
</template>
