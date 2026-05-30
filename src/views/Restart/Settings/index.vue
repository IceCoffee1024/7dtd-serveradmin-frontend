<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type { RestartFeatureSettingsDto } from '~/generated/api/types.gen';
import { useMutation, useQuery } from '@pinia/colada';
import { cloneDeep, isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  restartCancelRestartMutation,
  restartGetSettingsQuery,
  restartUpdateSettingsMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'RestartSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  cronExpression: string;
  timeZoneId: string;
  warningLeadSeconds: number;
  warningMessage: string;
  saveWorldBeforeRestart: boolean;
  restartMode: string;
  restartCommand: string;
  deferScheduledRestartDuringBloodMoonWindow: boolean;
  bloodMoonPreDuskProtectionHours: number;
  bloodMoonDeferMinutes: number;
  historyRetentionDays: number;
}

interface WarningStageRow {
  leadSeconds: number;
  message: string;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const { t } = useI18n();
const { toast, confirm } = usePopup();

const formRef = useTemplateRef<FormExpose>('formRef');
const settings = ref<RestartFeatureSettingsDto | null>(null);
const warningStages = ref<WarningStageRow[]>([]);

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    cronExpression: '0 6 * * *',
    timeZoneId: '',
    warningLeadSeconds: 300,
    warningMessage: 'Server will restart in {minutes} minutes.',
    saveWorldBeforeRestart: true,
    restartMode: 'Graceful',
    restartCommand: '',
    deferScheduledRestartDuringBloodMoonWindow: false,
    bloodMoonPreDuskProtectionHours: 2,
    bloodMoonDeferMinutes: 30,
    historyRetentionDays: 30,
  };
}

const form = reactive<FormModel>(buildDefaults());
const savedForm = ref<FormModel>(buildDefaults());
const savedWarningStages = ref<WarningStageRow[]>([]);
const isDirty = computed(() =>
  !isEqual(form, savedForm.value)
  || !isEqual(warningStages.value, savedWarningStages.value),
);

const schema = v.object({
  isEnabled: v.boolean(),
  cronExpression: v.pipe(v.string(), v.minLength(1)),
  timeZoneId: v.string(),
  warningLeadSeconds: v.pipe(v.number(), v.minValue(0)),
  warningMessage: v.string(),
  saveWorldBeforeRestart: v.boolean(),
  restartMode: v.pipe(v.string(), v.minLength(1)),
  restartCommand: v.string(),
  deferScheduledRestartDuringBloodMoonWindow: v.boolean(),
  bloodMoonPreDuskProtectionHours: v.pipe(v.number(), v.minValue(0)),
  bloodMoonDeferMinutes: v.pipe(v.number(), v.minValue(1)),
  historyRetentionDays: v.pipe(v.number(), v.minValue(0)),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const restartModeOptions = computed(() => [
  { label: t('views.restart.settings.restartModes.graceful'), value: 'Graceful' },
  { label: t('views.restart.settings.restartModes.force'), value: 'Force' },
]);

const policyFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.restart.settings.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
]);

const settingsFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'cronExpression',
    label: t('views.restart.settings.fields.cronExpression'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'timeZoneId',
    label: t('views.restart.settings.fields.timeZoneId'),
    el: 'el-input',
    tooltip: t('views.restart.settings.tooltips.timeZoneId'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'warningLeadSeconds',
    label: t('views.restart.settings.fields.warningLeadSeconds'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'warningMessage',
    label: t('views.restart.settings.fields.warningMessage'),
    el: 'el-input',
    props: { clearable: true },
    tooltip: t('views.restart.settings.tooltips.warningMessage'),
    span: { xs: 24 },
  },
  {
    prop: 'saveWorldBeforeRestart',
    label: t('views.restart.settings.fields.saveWorldBeforeRestart'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'restartMode',
    label: t('views.restart.settings.fields.restartMode'),
    el: 'el-select',
    options: restartModeOptions.value,
    tooltip: t('views.restart.settings.tooltips.restartMode'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'restartCommand',
    label: t('views.restart.settings.fields.restartCommand'),
    el: 'el-input',
    tooltip: t('views.restart.settings.tooltips.restartCommand'),
    span: { xs: 24 },
  },
  {
    prop: 'deferScheduledRestartDuringBloodMoonWindow',
    label: t('views.restart.settings.fields.deferScheduledRestartDuringBloodMoonWindow'),
    el: 'el-select',
    options: booleanOptions.value,
    tooltip: t('views.restart.settings.tooltips.deferScheduledRestartDuringBloodMoonWindow'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'bloodMoonPreDuskProtectionHours',
    label: t('views.restart.settings.fields.bloodMoonPreDuskProtectionHours'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    tooltip: t('views.restart.settings.tooltips.bloodMoonPreDuskProtectionHours'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'bloodMoonDeferMinutes',
    label: t('views.restart.settings.fields.bloodMoonDeferMinutes'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    tooltip: t('views.restart.settings.tooltips.bloodMoonDeferMinutes'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'historyRetentionDays',
    label: t('views.restart.settings.fields.historyRetentionDays'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
]);

const settingsQuery = useQuery(restartGetSettingsQuery());
const updateSettingsMutation = useMutation({
  ...restartUpdateSettingsMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('Restart');
  },
});
const cancelRestartMutation = useMutation(restartCancelRestartMutation());
const isLoading = computed(() => settingsQuery.isPending.value);
const isSubmitting = computed(() => updateSettingsMutation.isLoading.value);
const isCancelling = computed(() => cancelRestartMutation.isLoading.value);

function applyValues(source: RestartFeatureSettingsDto) {
  form.isEnabled = source.isEnabled ?? false;
  form.cronExpression = source.cronExpression ?? '0 6 * * *';
  form.timeZoneId = source.timeZoneId ?? '';
  form.warningLeadSeconds = source.warningLeadSeconds ?? 300;
  form.warningMessage = source.warningMessage ?? '';
  form.saveWorldBeforeRestart = source.saveWorldBeforeRestart ?? true;
  form.restartMode = source.restartMode ?? 'Graceful';
  form.restartCommand = source.restartCommand ?? '';
  form.deferScheduledRestartDuringBloodMoonWindow = source.deferScheduledRestartDuringBloodMoonWindow ?? false;
  form.bloodMoonPreDuskProtectionHours = source.bloodMoonPreDuskProtectionHours ?? 2;
  form.bloodMoonDeferMinutes = source.bloodMoonDeferMinutes ?? 30;
  form.historyRetentionDays = source.historyRetentionDays ?? 30;
  warningStages.value = (source.warningStages ?? []).map(s => ({
    leadSeconds: s.leadSeconds ?? 0,
    message: s.message ?? '',
  }));
}

function addWarningStage() {
  warningStages.value.push({ leadSeconds: 60, message: '' });
}

function removeWarningStage(index: number) {
  warningStages.value.splice(index, 1);
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
    savedWarningStages.value = cloneDeep(warningStages.value);
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
  savedWarningStages.value = cloneDeep(warningStages.value);
  await nextTick();
  formRef.value?.clearValidate();
}

async function onSubmit() {
  if (formRef.value == null || settings.value == null) {
    return;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (valid === false) {
    return;
  }

  try {
    const payload: RestartFeatureSettingsDto = {
      ...settings.value,
      isEnabled: form.isEnabled,
      cronExpression: form.cronExpression.trim(),
      timeZoneId: form.timeZoneId.trim() || null,
      warningLeadSeconds: Number(form.warningLeadSeconds ?? 0),
      warningMessage: form.warningMessage,
      warningStages: warningStages.value.length > 0
        ? warningStages.value.map(s => ({ leadSeconds: Number(s.leadSeconds ?? 0), message: s.message }))
        : null,
      saveWorldBeforeRestart: form.saveWorldBeforeRestart,
      restartMode: form.restartMode,
      restartCommand: form.restartCommand.trim() || null,
      deferScheduledRestartDuringBloodMoonWindow: form.deferScheduledRestartDuringBloodMoonWindow,
      bloodMoonPreDuskProtectionHours: Number(form.bloodMoonPreDuskProtectionHours ?? 0),
      bloodMoonDeferMinutes: Number(form.bloodMoonDeferMinutes ?? 30),
      historyRetentionDays: Number(form.historyRetentionDays ?? 0),
    };
    await updateSettingsMutation.mutateAsync({ body: payload });
    toast({ type: 'success', text: t('views.restart.settings.messages.saveSuccess') });
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
    text: t('views.restart.settings.messages.unsavedChanges'),
  });
});

async function onCancelRestart() {
  try {
    const result = await cancelRestartMutation.mutateAsync({});
    toast({
      type: result.succeeded ? 'success' : 'warning',
      text: result.message || (result.succeeded
        ? t('views.restart.settings.messages.cancelSuccess')
        : t('views.restart.settings.messages.cancelNoActive')),
    });
  }
  catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div>
    <div v-if="isLoading" class="flex flex-col gap-4">
      <el-skeleton v-for="index in 5" :key="index" animated>
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
          id="restartSettingsForm"
          ref="formRef"
          v-model="form"
          :fields="settingsFields"
          :rules="rules"
          label-position="top"
          :gutter="16"
          @submit.prevent="onSubmit"
        />

        <div class="mt-4">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-sm text-gray-900 font-semibold dark:text-gray-100">
              {{ t('views.restart.settings.warningStages.sectionTitle') }}
            </h3>
            <el-button size="small" @click="addWarningStage">
              <el-icon><icon-mdi-plus /></el-icon>
              {{ t('views.restart.settings.warningStages.add') }}
            </el-button>
          </div>
          <p class="text-xs text-gray-500 mb-3 dark:text-gray-400">
            {{ t('views.restart.settings.warningStages.description') }}
          </p>
          <div v-if="warningStages.length === 0" class="text-xs text-gray-400 mb-2 dark:text-gray-500">
            {{ t('views.restart.settings.warningStages.empty') }}
          </div>
          <div v-for="(stage, idx) in warningStages" :key="idx" class="mb-2 flex gap-2 items-end">
            <el-form-item :label="t('views.restart.settings.warningStages.leadSeconds')" class="flex-none w-48">
              <el-input-number v-model="stage.leadSeconds" :min="1" :precision="0" class="w-full" />
            </el-form-item>
            <el-form-item :label="t('views.restart.settings.warningStages.message')" class="flex-1">
              <el-input v-model="stage.message" :placeholder="t('views.restart.settings.warningStages.messagePlaceholder')" />
            </el-form-item>
            <el-form-item class="flex-none">
              <el-button type="danger" plain size="small" @click="removeWarningStage(idx)">
                <el-icon><icon-mdi-trash-can-outline /></el-icon>
              </el-button>
            </el-form-item>
          </div>
        </div>
      </div>

      <div class="mt-4 flex gap-2 justify-end">
        <el-button :loading="isCancelling" @click="onCancelRestart">
          <el-icon><icon-mdi-cancel /></el-icon>
          {{ t('views.restart.settings.actions.cancelPending') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.restart.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
