<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type { EventAutomationFeatureSettingsDto } from '~/generated/api/types.gen';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  eventAutomationGetSettings,
  eventAutomationResetSettings,
  eventAutomationUpdateSettings,
} from '~/generated/api/sdk.gen';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'EventAutomationSettingsPage' });

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

interface FormModel {
  isEnabled: boolean;
  historyRetentionDays: number;
}

const { t } = useI18n();
const { confirm, toast } = usePopup();

const formRef = useTemplateRef<FormExpose>('formRef');
const isLoading = ref(false);
const isSubmitting = ref(false);
const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const isDirty = computed(() => !isEqual(form, initialValues.value));

const schema = v.object({
  isEnabled: v.boolean(),
  historyRetentionDays: v.pipe(v.number(), v.minValue(0)),
});

const rules: FormRules = generateElementRules(schema);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.eventAutomation.settings.fields.isEnabled'),
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
    prop: 'historyRetentionDays',
    label: t('views.eventAutomation.settings.fields.historyRetentionDays'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
]);

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    historyRetentionDays: 30,
  };
}

function toFormModel(data?: EventAutomationFeatureSettingsDto | null): FormModel {
  return {
    isEnabled: data?.isEnabled ?? false,
    historyRetentionDays: data?.historyRetentionDays ?? 30,
  };
}

function applyFormValues(values: FormModel) {
  form.isEnabled = values.isEnabled;
  form.historyRetentionDays = values.historyRetentionDays;
}

async function loadSettings() {
  try {
    isLoading.value = true;
    const { data } = await eventAutomationGetSettings({ throwOnError: true });
    initialValues.value = toFormModel(data);
    applyFormValues(initialValues.value);
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

function toPayload(values: FormModel): EventAutomationFeatureSettingsDto {
  return {
    isEnabled: values.isEnabled,
    historyRetentionDays: Number(values.historyRetentionDays ?? 0),
  };
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  try {
    isSubmitting.value = true;
    await eventAutomationUpdateSettings({ body: toPayload(form), throwOnError: true });
    toast({ type: 'success', text: t('views.eventAutomation.settings.messages.saveSuccess') });
    await loadSettings();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

async function onReset() {
  const confirmed = await confirm({
    type: 'warning',
    text: t('views.eventAutomation.settings.messages.resetConfirm'),
  });
  if (!confirmed)
    return;

  try {
    isSubmitting.value = true;
    const { data } = await eventAutomationResetSettings({ throwOnError: true });
    initialValues.value = toFormModel(data);
    applyFormValues(initialValues.value);
    await nextTick();
    formRef.value?.clearValidate();
    toast({ type: 'success', text: t('views.eventAutomation.settings.messages.resetSuccess') });
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

onMounted(loadSettings);

onBeforeRouteLeave(async () => {
  if (!isDirty.value)
    return true;

  return await confirm({
    type: 'warning',
    text: t('views.eventAutomation.settings.messages.unsavedChanges'),
  });
});
</script>

<template>
  <div>
    <div v-if="isLoading" class="flex flex-col gap-4">
      <el-skeleton v-for="index in 3" :key="index" animated>
        <template #template>
          <el-skeleton-item variant="text" class="h-8" />
        </template>
      </el-skeleton>
    </div>
    <template v-else>
      <MyForm
        id="eventAutomationSettingsForm"
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
          {{ t('common.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty" @click="onSubmit">
          {{ t('common.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
