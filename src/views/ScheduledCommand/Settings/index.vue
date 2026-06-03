<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type { ScheduledCommandFeatureSettingsDto } from '~/generated/api/types.gen';
import { useMutation, useQuery } from '@pinia/colada';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  scheduledCommandsGetSettingsQuery,
  scheduledCommandsResetSettingsMutation,
  scheduledCommandsUpdateSettingsMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateScheduledCommandQueries } from '~/queries/scheduledCommand';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'ScheduledCommandSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  defaultTimeZoneId: string;
  defaultAllowConcurrentExecution: boolean;
  historyRetentionDays: number;
  failureNotifyEnabled: boolean;
  failureNotifyMessage: string;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const { t } = useI18n();
const { toast, confirm } = usePopup();

const formRef = useTemplateRef<FormExpose>('formRef');

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    defaultTimeZoneId: '',
    defaultAllowConcurrentExecution: false,
    historyRetentionDays: 30,
    failureNotifyEnabled: false,
    failureNotifyMessage: '',
  };
}

const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const isDirty = computed(() => !isEqual(form, initialValues.value));

const schema = v.object({
  isEnabled: v.boolean(),
  defaultTimeZoneId: v.string(),
  defaultAllowConcurrentExecution: v.boolean(),
  historyRetentionDays: v.pipe(v.number(), v.minValue(0)),
  failureNotifyEnabled: v.boolean(),
  failureNotifyMessage: v.optional(v.string()),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.scheduler.settings.fields.isEnabled'),
    el: 'el-switch',
    props: {
      inlinePrompt: true,
      activeText: t('common.yes'),
      inactiveText: t('common.no'),
      size: 'large',
    },
    span: { xs: 24, md: 24 },
  },
  {
    prop: 'defaultTimeZoneId',
    label: t('views.scheduler.settings.fields.defaultTimeZoneId'),
    el: 'el-input',
    tooltip: t('views.scheduler.settings.tooltips.defaultTimeZoneId'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'defaultAllowConcurrentExecution',
    label: t('views.scheduler.settings.fields.defaultAllowConcurrentExecution'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'historyRetentionDays',
    label: t('views.scheduler.settings.fields.historyRetentionDays'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'failureNotifyEnabled',
    label: t('views.scheduler.settings.fields.failureNotifyEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    tooltip: t('views.scheduler.settings.tooltips.failureNotifyEnabled'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'failureNotifyMessage',
    label: t('views.scheduler.settings.fields.failureNotifyMessage'),
    el: 'el-input',
    props: { clearable: true },
    tooltip: t('views.scheduler.settings.tooltips.failureNotifyMessage'),
    span: { xs: 24 },
  },
]);

const settingsQuery = useQuery(scheduledCommandsGetSettingsQuery());
const updateSettingsMutation = useMutation({
  ...scheduledCommandsUpdateSettingsMutation(),
  async onSettled() {
    await invalidateScheduledCommandQueries();
  },
});
const resetSettingsMutation = useMutation({
  ...scheduledCommandsResetSettingsMutation(),
  async onSettled() {
    await invalidateScheduledCommandQueries();
  },
});
const isLoading = computed(() => settingsQuery.isPending.value);
const isSubmitting = computed(() => updateSettingsMutation.isLoading.value || resetSettingsMutation.isLoading.value);

function mapSettings(data: ScheduledCommandFeatureSettingsDto | null | undefined): FormModel {
  const source = data ?? buildDefaults();
  return {
    isEnabled: source.isEnabled ?? false,
    defaultTimeZoneId: source.defaultTimeZoneId ?? '',
    defaultAllowConcurrentExecution: source.defaultAllowConcurrentExecution ?? false,
    historyRetentionDays: source.historyRetentionDays ?? 30,
    failureNotifyEnabled: source.failureNotifyEnabled ?? false,
    failureNotifyMessage: source.failureNotifyMessage ?? '',
  };
}

function applyFormValues(values: FormModel): void {
  form.isEnabled = values.isEnabled;
  form.defaultTimeZoneId = values.defaultTimeZoneId;
  form.defaultAllowConcurrentExecution = values.defaultAllowConcurrentExecution;
  form.historyRetentionDays = values.historyRetentionDays;
  form.failureNotifyEnabled = values.failureNotifyEnabled;
  form.failureNotifyMessage = values.failureNotifyMessage;
}

watch(
  () => settingsQuery.data.value,
  async (data) => {
    if (data == null) {
      return;
    }

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

  initialValues.value = mapSettings(state.data);
  applyFormValues(initialValues.value);
  await nextTick();
  formRef.value?.clearValidate();
}

async function onReset() {
  try {
    const data = await resetSettingsMutation.mutateAsync({});
    initialValues.value = mapSettings(data);
    applyFormValues(initialValues.value);
    await nextTick();
    formRef.value?.clearValidate();
    toast({
      type: 'success',
      title: t('views.scheduler.settings.actions.reset'),
      text: t('views.scheduler.settings.messages.resetSuccess'),
    });
  }
  catch (error) {
    console.error(error);
  }
}

function toPayload(values: FormModel): ScheduledCommandFeatureSettingsDto {
  return {
    isEnabled: values.isEnabled,
    defaultTimeZoneId: values.defaultTimeZoneId.trim() || null,
    defaultAllowConcurrentExecution: values.defaultAllowConcurrentExecution,
    historyRetentionDays: Number(values.historyRetentionDays ?? 0),
    failureNotifyEnabled: values.failureNotifyEnabled,
    failureNotifyMessage: values.failureNotifyMessage.trim() || null,
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
      title: t('views.scheduler.settings.actions.save'),
      text: t('views.scheduler.settings.messages.saveSuccess'),
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
    text: t('views.scheduler.settings.messages.unsavedChanges'),
  });
});
</script>

<template>
  <div>
    <div v-if="isLoading" class="flex flex-col gap-4">
      <el-skeleton v-for="index in 4" :key="index" animated>
        <template #template>
          <el-skeleton-item variant="text" class="h-8" />
        </template>
      </el-skeleton>
    </div>
    <template v-else>
      <MyForm
        id="schedulerSettingsForm"
        ref="formRef"
        v-model="form"
        :fields="fields"
        :rules="rules"
        label-position="top"
        :gutter="16"
        @submit.prevent="onSubmit"
      />

      <div class="mt-4 flex gap-2 justify-end">
        <el-button :disabled="isSubmitting" @click="onReset">
          <el-icon><icon-mdi-refresh /></el-icon>
          {{ t('views.scheduler.settings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.scheduler.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
