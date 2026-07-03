<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type { BackupFeatureSettingsDto, DatabaseBackupSettingsDto } from '~/generated/api/types.gen';
import { useMutation, useQuery } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  backupGetSettingsQuery,
  backupRunDatabaseBackupMutation,
  backupUpdateSettingsMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateBackupQueries } from '~/queries/backup';
import { generateElementRules } from '~/utils';
import { translateLiteralPlaceholders } from '~/utils/i18nLiteralPlaceholders';

defineOptions({ name: 'DatabaseBackupConfigTab' });

interface FormModel {
  isEnabled: boolean;
  cronExpression: string;
  destinationRoot: string;
  compressToZip: boolean;
  retentionCount: number;
  broadcastOnStart: boolean;
  broadcastStartMessage: string;
  broadcastOnComplete: boolean;
  broadcastCompleteMessage: string;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const { t } = useI18n();
const { confirm, prompt, toast } = usePopup();

const formRef = useTemplateRef<FormExpose>('formRef');
const settings = ref<BackupFeatureSettingsDto | null>(null);

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    cronExpression: '0 0 * * *',
    destinationRoot: '',
    compressToZip: true,
    retentionCount: 7,
    broadcastOnStart: false,
    broadcastStartMessage: '',
    broadcastOnComplete: false,
    broadcastCompleteMessage: '',
  };
}

const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  isEnabled: v.boolean(),
  cronExpression: v.pipe(v.string(), v.minLength(1)),
  destinationRoot: v.pipe(v.string(), v.regex(/\S/)),
  compressToZip: v.boolean(),
  retentionCount: v.pipe(v.number(), v.minValue(-1)),
  broadcastOnStart: v.boolean(),
  broadcastStartMessage: v.optional(v.string()),
  broadcastOnComplete: v.boolean(),
  broadcastCompleteMessage: v.optional(v.string()),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const policyFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.backup.database.fields.isEnabled'),
    el: 'el-switch',
    props: {
      inlinePrompt: true,
      activeText: t('common.yes'),
      inactiveText: t('common.no'),
      size: 'large',
    },
    span: { xs: 24, md: 24 },
  },
]);

const settingsFields = computed<MyFormField<FormModel>[]>(() => [
  { prop: 'cronExpression', label: t('views.backup.database.fields.cronExpression'), el: 'el-input', tooltip: t('views.backup.tooltips.cronExpression'), span: { xs: 24, md: 12 } },
  { prop: 'destinationRoot', label: t('views.backup.database.fields.destinationRoot'), el: 'el-input', tooltip: t('views.backup.tooltips.destinationRoot'), span: { xs: 24, md: 12 } },
  { prop: 'compressToZip', label: t('views.backup.database.fields.compressToZip'), el: 'el-select', options: booleanOptions.value, span: { xs: 24, md: 12 } },
  { prop: 'retentionCount', label: t('views.backup.database.fields.retentionCount'), el: 'el-input-number', props: { min: -1, precision: 0, class: 'w-full' }, tooltip: t('views.backup.tooltips.retentionCount'), span: { xs: 24, md: 12 } },
  { prop: 'broadcastOnStart', label: t('views.backup.fields.broadcastOnStart'), el: 'el-select', options: booleanOptions.value, span: { xs: 24, md: 12 } },
  { prop: 'broadcastStartMessage', label: t('views.backup.fields.broadcastStartMessage'), el: 'el-input', tooltip: translateLiteralPlaceholders(t, 'views.backup.tooltips.broadcastMessage', ['taskName', 'status']), span: { xs: 24 } },
  { prop: 'broadcastOnComplete', label: t('views.backup.fields.broadcastOnComplete'), el: 'el-select', options: booleanOptions.value, span: { xs: 24, md: 12 } },
  { prop: 'broadcastCompleteMessage', label: t('views.backup.fields.broadcastCompleteMessage'), el: 'el-input', tooltip: translateLiteralPlaceholders(t, 'views.backup.tooltips.broadcastMessage', ['taskName', 'status']), span: { xs: 24 } },
]);

const settingsQuery = useQuery(backupGetSettingsQuery());
const updateSettingsMutation = useMutation({
  ...backupUpdateSettingsMutation(),
  async onSettled() {
    await invalidateBackupQueries();
  },
});
const runBackupMutation = useMutation(backupRunDatabaseBackupMutation());
const isLoading = computed(() => settingsQuery.isPending.value);
const isSubmitting = computed(() => updateSettingsMutation.isLoading.value);
const isRunning = computed(() => runBackupMutation.isLoading.value);

function applyValues(source?: DatabaseBackupSettingsDto) {
  form.isEnabled = source?.isEnabled ?? false;
  form.cronExpression = source?.cronExpression ?? '0 0 * * *';
  form.destinationRoot = source?.destinationRoot ?? '';
  form.compressToZip = source?.compressToZip ?? true;
  form.retentionCount = source?.retentionCount ?? 7;
  form.broadcastOnStart = source?.broadcastOnStart ?? false;
  form.broadcastStartMessage = source?.broadcastStartMessage ?? '';
  form.broadcastOnComplete = source?.broadcastOnComplete ?? false;
  form.broadcastCompleteMessage = source?.broadcastCompleteMessage ?? '';
}

watch(
  () => settingsQuery.data.value,
  async (data) => {
    if (data == null) {
      return;
    }

    settings.value = data;
    applyValues(data.databaseBackup);
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
  },
);

async function refreshSettings() {
  const state = await settingsQuery.refetch(true);
  if (state.status !== 'success') {
    return;
  }

  settings.value = state.data;
  applyValues(state.data.databaseBackup);
  await nextTick();
  formRef.value?.clearValidate();
}

async function onSubmit() {
  if (!formRef.value || !settings.value) {
    return;
  }
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  try {
    const payload: BackupFeatureSettingsDto = {
      ...settings.value,
      databaseBackup: {
        isEnabled: form.isEnabled,
        cronExpression: form.cronExpression.trim(),
        destinationRoot: form.destinationRoot.trim(),
        compressToZip: form.compressToZip,
        retentionCount: Number(form.retentionCount ?? 0),
        broadcastOnStart: form.broadcastOnStart,
        broadcastStartMessage: form.broadcastStartMessage.trim() || null,
        broadcastOnComplete: form.broadcastOnComplete,
        broadcastCompleteMessage: form.broadcastCompleteMessage.trim() || null,
      },
    };
    await updateSettingsMutation.mutateAsync({ body: payload });
    toast({ type: 'success', text: t('views.backup.settings.messages.saveSuccess') });
    await refreshSettings();
  }
  catch (error) {
    console.error(error);
  }
}

async function onRunNow() {
  const ok = await confirm({ text: t('views.backup.actions.runNowConfirm'), type: 'warning' });
  if (ok === false) {
    return;
  }
  const reason = await prompt({ text: t('views.backup.actions.runNowReason') });
  if (reason === undefined) {
    return;
  }

  try {
    const run = await runBackupMutation.mutateAsync({ body: { reason: reason || null } });
    toast({
      type: run.succeeded ? 'success' : 'error',
      text: run.succeeded ? t('views.backup.actions.runNowSuccess') : (run.errorMessage || t('views.backup.actions.runNowFailed')),
    });
  }
  catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div v-if="isLoading" class="flex flex-col gap-4">
    <el-skeleton v-for="index in 4" :key="index" animated>
      <template #template>
        <el-skeleton-item variant="text" class="h-8" />
      </template>
    </el-skeleton>
  </div>
  <template v-else>
    <MyForm
      v-model="form"
      :fields="policyFields"
      :rules="rules"
      label-position="top"
      :gutter="16"
    />

    <div>
      <MyForm
        id="databaseBackupConfigForm"
        ref="formRef"
        v-model="form"
        :fields="settingsFields"
        :rules="rules"
        label-position="top"
        :gutter="16"
        @submit.prevent="onSubmit"
      />
    </div>

    <div class="mt-4 flex gap-2 justify-end">
      <el-button :loading="isRunning" @click="onRunNow">
        <el-icon><icon-mdi-play /></el-icon>
        {{ t('views.backup.actions.runNow') }}
      </el-button>
      <el-button type="primary" :loading="isSubmitting" @click="onSubmit">
        <el-icon><icon-mdi-check /></el-icon>
        {{ t('views.backup.settings.actions.save') }}
      </el-button>
    </div>
  </template>
</template>
