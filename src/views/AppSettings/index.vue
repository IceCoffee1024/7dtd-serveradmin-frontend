<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { getAppSettings, updateAppSettings } from '~/api/gameServer';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'AppSettings' });

const { t } = useI18n();
const { toast } = usePopup();

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
const isLoading = ref(false);
const isSubmitting = ref(false);

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
    el: 'input',
    rules: rules.webUrl,
    tooltip: t('views.appSettings.tooltips.webUrl'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'userName',
    label: t('views.appSettings.fields.userName'),
    el: 'input',
    rules: rules.userName,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'password',
    label: t('views.appSettings.fields.password'),
    el: 'input',
    props: { showPassword: true, autocomplete: 'new-password' },
    rules: rules.password,
    tooltip: t('views.appSettings.tooltips.password'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'serverConfigFile',
    label: t('views.appSettings.fields.serverConfigFile'),
    el: 'input',
    rules: rules.serverConfigFile,
    tooltip: t('views.appSettings.tooltips.serverConfigFile'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'accessTokenExpireTime',
    label: t('views.appSettings.fields.accessTokenExpireTime'),
    el: 'input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    rules: rules.accessTokenExpireTime,
    tooltip: t('views.appSettings.tooltips.accessTokenExpireTime'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'refreshTokenExpireTime',
    label: t('views.appSettings.fields.refreshTokenExpireTime'),
    el: 'input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    rules: rules.refreshTokenExpireTime,
    tooltip: t('views.appSettings.tooltips.refreshTokenExpireTime'),
    span: { xs: 24, md: 12 },
  },
]);

function readString(data: Record<string, unknown>, pascalKey: string, camelKey: string): string {
  const pascalValue = data[pascalKey];
  if (typeof pascalValue === 'string') {
    return pascalValue;
  }

  const camelValue = data[camelKey];
  if (typeof camelValue === 'string') {
    return camelValue;
  }

  return '';
}

function readNumber(data: Record<string, unknown>, pascalKey: string, camelKey: string): number {
  const pascalValue = data[pascalKey];
  if (typeof pascalValue === 'number') {
    return pascalValue;
  }

  const camelValue = data[camelKey];
  if (typeof camelValue === 'number') {
    return camelValue;
  }

  return Number(pascalValue ?? camelValue ?? 0);
}

function mapSettings(data: API.GameServer.AppSettings | Record<string, unknown> | null | undefined): FormModel {
  const source = (data ?? {}) as Record<string, unknown>;
  return {
    webUrl: readString(source, 'WebUrl', 'webUrl'),
    userName: readString(source, 'UserName', 'userName'),
    password: readString(source, 'Password', 'password'),
    accessTokenExpireTime: readNumber(source, 'AccessTokenExpireTime', 'accessTokenExpireTime'),
    refreshTokenExpireTime: readNumber(source, 'RefreshTokenExpireTime', 'refreshTokenExpireTime'),
    serverConfigFile: readString(source, 'ServerConfigFile', 'serverConfigFile'),
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

async function loadSettings() {
  isLoading.value = true;
  try {
    const data = await getAppSettings();
    initialValues.value = mapSettings(data);
    applyFormValues(initialValues.value);
    await nextTick();
    formRef.value?.clearValidate();
  }
  catch (error) {
    console.error(error);
    initialValues.value = buildDefaults();
    applyFormValues(initialValues.value);
  }
  finally {
    isLoading.value = false;
  }
}

function onReset() {
  applyFormValues(initialValues.value);
  nextTick(() => formRef.value?.clearValidate());
}

function toPayload(values: FormModel): API.GameServer.AppSettings {
  return {
    webUrl: values.webUrl,
    userName: values.userName,
    password: values.password,
    accessTokenExpireTime: Number(values.accessTokenExpireTime ?? 0),
    refreshTokenExpireTime: Number(values.refreshTokenExpireTime ?? 0),
    serverConfigFile: values.serverConfigFile,
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

  isSubmitting.value = true;
  try {
    await updateAppSettings(toPayload(form));
    toast({
      type: 'success',
      title: t('views.appSettings.actions.save'),
      text: t('views.appSettings.messages.saveSuccess'),
    });
    await loadSettings();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  loadSettings();
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
        <el-button type="primary" :loading="isSubmitting" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.appSettings.actions.save') }}
        </el-button>
      </div>
    </template>
  </el-card>
</template>
