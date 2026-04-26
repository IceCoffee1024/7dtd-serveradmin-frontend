<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { getSettings, runWorldBackup, updateSettings } from '~/api/backup';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'WorldBackupConfigTab' });

interface FormModel {
  isEnabled: boolean;
  cronExpression: string;
  destinationRoot: string;
  compressToZip: boolean;
  retentionCount: number;
  saveWorldBeforeBackup: boolean;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const { t } = useI18n();
const { confirm, prompt, toast } = usePopup();

const formRef = useTemplateRef<FormExpose>('formRef');
const isLoading = ref(false);
const isSubmitting = ref(false);
const isRunning = ref(false);
const settings = ref<API.Backup.Settings | null>(null);

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    cronExpression: '0 0 * * *',
    destinationRoot: '',
    compressToZip: true,
    retentionCount: 7,
    saveWorldBeforeBackup: true,
  };
}

const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  isEnabled: v.boolean(),
  cronExpression: v.pipe(v.string(), v.minLength(1)),
  destinationRoot: v.pipe(v.string(), v.regex(/\S/)),
  compressToZip: v.boolean(),
  retentionCount: v.pipe(v.number(), v.minValue(-1)),
  saveWorldBeforeBackup: v.boolean(),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const fields = computed<MyFormField<FormModel>[]>(() => [
  { prop: 'isEnabled', label: t('views.backup.world.fields.isEnabled'), el: 'el-select', options: booleanOptions.value, span: { xs: 24, md: 12 } },
  { prop: 'cronExpression', label: t('views.backup.world.fields.cronExpression'), el: 'el-input', tooltip: t('views.backup.tooltips.cronExpression'), span: { xs: 24, md: 12 } },
  { prop: 'destinationRoot', label: t('views.backup.world.fields.destinationRoot'), el: 'el-input', tooltip: t('views.backup.tooltips.destinationRoot'), span: { xs: 24, md: 12 } },
  { prop: 'compressToZip', label: t('views.backup.world.fields.compressToZip'), el: 'el-select', options: booleanOptions.value, span: { xs: 24, md: 12 } },
  { prop: 'retentionCount', label: t('views.backup.world.fields.retentionCount'), el: 'el-input-number', props: { min: -1, precision: 0, class: 'w-full' }, tooltip: t('views.backup.tooltips.retentionCount'), span: { xs: 24, md: 12 } },
  { prop: 'saveWorldBeforeBackup', label: t('views.backup.world.fields.saveWorldBeforeBackup'), el: 'el-select', options: booleanOptions.value, tooltip: t('views.backup.world.tooltips.saveWorldBeforeBackup'), span: { xs: 24, md: 12 } },
]);

function applyValues(source: API.Backup.WorldBackupConfig) {
  form.isEnabled = source.isEnabled;
  form.cronExpression = source.cronExpression;
  form.destinationRoot = source.destinationRoot;
  form.compressToZip = source.compressToZip;
  form.retentionCount = source.retentionCount;
  form.saveWorldBeforeBackup = source.saveWorldBeforeBackup;
}

async function loadSettings() {
  isLoading.value = true;
  try {
    settings.value = await getSettings();
    applyValues(settings.value.worldBackup);
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
  if (!formRef.value || !settings.value) {
    return;
  }
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  isSubmitting.value = true;
  try {
    const payload: API.Backup.Settings = {
      ...settings.value,
      worldBackup: {
        isEnabled: form.isEnabled,
        cronExpression: form.cronExpression.trim(),
        destinationRoot: form.destinationRoot.trim(),
        compressToZip: form.compressToZip,
        retentionCount: Number(form.retentionCount ?? 0),
        saveWorldBeforeBackup: form.saveWorldBeforeBackup,
      },
    };
    await updateSettings(payload);
    toast({ type: 'success', text: t('views.backup.settings.messages.saveSuccess') });
    await loadSettings();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
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

  isRunning.value = true;
  try {
    const run = await runWorldBackup({ reason: reason || null });
    toast({
      type: run.succeeded ? 'success' : 'error',
      text: run.succeeded ? t('views.backup.actions.runNowSuccess') : (run.errorMessage || t('views.backup.actions.runNowFailed')),
    });
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isRunning.value = false;
  }
}

onMounted(() => {
  loadSettings();
});
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
      id="worldBackupConfigForm"
      ref="formRef"
      v-model="form"
      :fields="fields"
      :rules="rules"
      label-position="top"
      label-width="auto"
      :gutter="16"
      @submit.prevent="onSubmit"
    />

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
