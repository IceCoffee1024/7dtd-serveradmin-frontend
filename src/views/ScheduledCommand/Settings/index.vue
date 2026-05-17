<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { getSettings, resetSettings, updateSettings } from '~/api/scheduledCommand';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'ScheduledCommandSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  defaultTimeZoneId: string;
  defaultAllowConcurrentExecution: boolean;
  historyRetentionDays: number;
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

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    defaultTimeZoneId: 'UTC',
    defaultAllowConcurrentExecution: false,
    historyRetentionDays: 30,
  };
}

const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  isEnabled: v.boolean(),
  defaultTimeZoneId: v.pipe(v.string(), v.minLength(1)),
  defaultAllowConcurrentExecution: v.boolean(),
  historyRetentionDays: v.pipe(v.number(), v.minValue(0)),
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
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
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
]);

function mapSettings(data: API.ScheduledCommand.Settings | null | undefined): FormModel {
  const source = data ?? buildDefaults();
  return {
    isEnabled: source.isEnabled,
    defaultTimeZoneId: source.defaultTimeZoneId || 'UTC',
    defaultAllowConcurrentExecution: source.defaultAllowConcurrentExecution,
    historyRetentionDays: source.historyRetentionDays,
  };
}

function applyFormValues(values: FormModel): void {
  form.isEnabled = values.isEnabled;
  form.defaultTimeZoneId = values.defaultTimeZoneId;
  form.defaultAllowConcurrentExecution = values.defaultAllowConcurrentExecution;
  form.historyRetentionDays = values.historyRetentionDays;
}

async function loadSettings() {
  isLoading.value = true;
  try {
    const data = await getSettings();
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

async function onReset() {
  isSubmitting.value = true;
  try {
    const data = await resetSettings();
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
  finally {
    isSubmitting.value = false;
  }
}

function toPayload(values: FormModel): API.ScheduledCommand.Settings {
  return {
    isEnabled: values.isEnabled,
    defaultTimeZoneId: values.defaultTimeZoneId.trim() || 'UTC',
    defaultAllowConcurrentExecution: values.defaultAllowConcurrentExecution,
    historyRetentionDays: Number(values.historyRetentionDays ?? 0),
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
    await updateSettings(toPayload(form));
    toast({
      type: 'success',
      title: t('views.scheduler.settings.actions.save'),
      text: t('views.scheduler.settings.messages.saveSuccess'),
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
        id="schedulerSettingsForm"
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
        <el-button :disabled="isSubmitting" @click="onReset">
          <el-icon><icon-mdi-refresh /></el-icon>
          {{ t('views.scheduler.settings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.scheduler.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </el-card>
</template>
