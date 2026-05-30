<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type { BackupFeatureSettingsDto } from '~/generated/api/types.gen';
import { useMutation, useQuery } from '@pinia/colada';
import { cloneDeep, isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  backupGetSettingsQuery,
  backupResetSettingsMutation,
  backupUpdateSettingsMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateBackupQueries } from '~/queries/backup';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'BackupSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  timeZoneId: string;
  historyRetentionDays: number;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const { t } = useI18n();
const { toast, confirm } = usePopup();

const formRef = useTemplateRef<FormExpose>('formRef');
const settings = ref<BackupFeatureSettingsDto | null>(null);

function buildDefaults(): FormModel {
  return { isEnabled: false, timeZoneId: '', historyRetentionDays: 30 };
}

const form = reactive<FormModel>(buildDefaults());
const savedForm = ref<FormModel>(buildDefaults());
const isDirty = computed(() => !isEqual(form, savedForm.value));

const schema = v.object({
  isEnabled: v.boolean(),
  timeZoneId: v.string(),
  historyRetentionDays: v.pipe(v.number(), v.minValue(0)),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const policyFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.backup.settings.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
]);

const settingsFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'timeZoneId',
    label: t('views.backup.settings.fields.timeZoneId'),
    el: 'el-input',
    tooltip: t('views.backup.settings.tooltips.timeZoneId'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'historyRetentionDays',
    label: t('views.backup.settings.fields.historyRetentionDays'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
]);

const settingsQuery = useQuery(backupGetSettingsQuery());
const updateSettingsMutation = useMutation({
  ...backupUpdateSettingsMutation(),
  async onSettled() {
    await invalidateBackupQueries();
  },
});
const resetSettingsMutation = useMutation({
  ...backupResetSettingsMutation(),
  async onSettled() {
    await invalidateBackupQueries();
  },
});
const isLoading = computed(() => settingsQuery.isPending.value);
const isSubmitting = computed(() => updateSettingsMutation.isLoading.value || resetSettingsMutation.isLoading.value);

function applyValues(source: BackupFeatureSettingsDto | null | undefined) {
  const data = source ?? null;
  form.isEnabled = data?.isEnabled ?? false;
  form.timeZoneId = data?.timeZoneId ?? '';
  form.historyRetentionDays = data?.historyRetentionDays ?? 30;
}

watch(
  () => settingsQuery.data.value,
  async (data) => {
    if (data == null) {
      return;
    }

    settings.value = data;
    applyValues(data);
    savedForm.value = cloneDeep(form);
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
  applyValues(state.data);
  savedForm.value = cloneDeep(form);
  await nextTick();
  formRef.value?.clearValidate();
}

async function onReset() {
  try {
    settings.value = await resetSettingsMutation.mutateAsync({});
    applyValues(settings.value);
    savedForm.value = cloneDeep(form);
    await nextTick();
    formRef.value?.clearValidate();
    toast({ type: 'success', text: t('views.backup.settings.messages.resetSuccess') });
  }
  catch (error) {
    console.error(error);
  }
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
      isEnabled: form.isEnabled,
      timeZoneId: form.timeZoneId.trim() || null,
      historyRetentionDays: Number(form.historyRetentionDays ?? 0),
    };
    await updateSettingsMutation.mutateAsync({ body: payload });
    toast({ type: 'success', text: t('views.backup.settings.messages.saveSuccess') });
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
    text: t('views.backup.settings.messages.unsavedChanges'),
  });
});
</script>

<template>
  <el-card shadow="never">
    <div v-if="isLoading" class="flex flex-col gap-4">
      <el-skeleton v-for="index in 3" :key="index" animated>
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

      <div :class="{ 'opacity-40 pointer-events-none select-none': !form.isEnabled }">
        <MyForm
          id="backupSettingsForm"
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
        <el-button :disabled="isSubmitting" @click="onReset">
          <el-icon><icon-mdi-refresh /></el-icon>
          {{ t('views.backup.settings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.backup.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </el-card>
</template>
