<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { cancelRestart, getSettings, updateSettings } from '~/api/restart';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
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
const { toast } = usePopup();

const formRef = useTemplateRef<FormExpose>('formRef');
const isLoading = ref(false);
const isSubmitting = ref(false);
const isCancelling = ref(false);
const settings = ref<API.Restart.Settings | null>(null);
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
    historyRetentionDays: 30,
  };
}

const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  isEnabled: v.boolean(),
  cronExpression: v.pipe(v.string(), v.minLength(1)),
  timeZoneId: v.string(),
  warningLeadSeconds: v.pipe(v.number(), v.minValue(0)),
  warningMessage: v.string(),
  saveWorldBeforeRestart: v.boolean(),
  restartMode: v.pipe(v.string(), v.minLength(1)),
  restartCommand: v.string(),
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

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.restart.settings.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
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
    prop: 'historyRetentionDays',
    label: t('views.restart.settings.fields.historyRetentionDays'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
]);

function applyValues(source: API.Restart.Settings) {
  form.isEnabled = source.isEnabled;
  form.cronExpression = source.cronExpression ?? '0 6 * * *';
  form.timeZoneId = source.timeZoneId ?? '';
  form.warningLeadSeconds = source.warningLeadSeconds ?? 300;
  form.warningMessage = source.warningMessage ?? '';
  form.saveWorldBeforeRestart = source.saveWorldBeforeRestart;
  form.restartMode = source.restartMode ?? 'Graceful';
  form.restartCommand = source.restartCommand ?? '';
  form.historyRetentionDays = source.historyRetentionDays ?? 30;
  warningStages.value = (source.warningStages ?? []).map(s => ({ leadSeconds: s.leadSeconds, message: s.message }));
}

function addWarningStage() {
  warningStages.value.push({ leadSeconds: 60, message: '' });
}

function removeWarningStage(index: number) {
  warningStages.value.splice(index, 1);
}

async function loadSettings() {
  isLoading.value = true;
  try {
    settings.value = await getSettings();
    applyValues(settings.value);
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
  if (formRef.value == null || settings.value == null) {
    return;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (valid === false) {
    return;
  }

  isSubmitting.value = true;
  try {
    const payload: API.Restart.Settings = {
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
      historyRetentionDays: Number(form.historyRetentionDays ?? 0),
    };
    await updateSettings(payload);
    settings.value = { ...payload };
    toast({ type: 'success', text: t('views.restart.settings.messages.saveSuccess') });
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

async function onCancelRestart() {
  isCancelling.value = true;
  try {
    const result = await cancelRestart();
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
  finally {
    isCancelling.value = false;
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
        id="restartSettingsForm"
        ref="formRef"
        v-model="form"
        :fields="fields"
        :rules="rules"
        label-position="top"
        label-width="auto"
        :gutter="16"
        @submit.prevent="onSubmit"
      />

      <div class="mt-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
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
        <div v-if="warningStages.length === 0" class="text-xs text-gray-400 dark:text-gray-500 mb-2">
          {{ t('views.restart.settings.warningStages.empty') }}
        </div>
        <div v-for="(stage, idx) in warningStages" :key="idx" class="flex gap-2 items-end mb-2">
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

      <div class="mt-4 flex gap-2 justify-end">
        <el-button :loading="isCancelling" @click="onCancelRestart">
          <el-icon><icon-mdi-cancel /></el-icon>
          {{ t('views.restart.settings.actions.cancelPending') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.restart.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
