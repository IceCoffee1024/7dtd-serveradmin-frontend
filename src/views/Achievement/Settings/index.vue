<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useMutation, useQuery } from '@pinia/colada';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  achievementGetSettingsQuery,
  achievementResetSettingsMutation,
  achievementUpdateSettingsMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateAchievementQueries } from '~/queries/achievement';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'AchievementSettingsPage' });

interface FormModel {
  isEnabled: boolean;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const { t } = useI18n();
const { toast, confirm } = usePopup();

const formRef = useTemplateRef<FormExpose>('formRef');

function buildDefaults(): FormModel {
  return { isEnabled: false };
}

const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const isDirty = computed(() => !isEqual(form, initialValues.value));

const schema = v.object({
  isEnabled: v.boolean(),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.achievement.settings.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
]);

const settingsQuery = useQuery(achievementGetSettingsQuery());
const updateSettingsMutation = useMutation({
  ...achievementUpdateSettingsMutation(),
  async onSettled() {
    await invalidateAchievementQueries();
  },
});
const resetSettingsMutation = useMutation({
  ...achievementResetSettingsMutation(),
  async onSettled() {
    await invalidateAchievementQueries();
  },
});
const isLoading = computed(() => settingsQuery.isPending.value);
const isSubmitting = computed(() => updateSettingsMutation.isLoading.value || resetSettingsMutation.isLoading.value);

function applyFormValues(values: FormModel): void {
  Object.assign(form, values);
}

watch(
  () => settingsQuery.data.value,
  async (data) => {
    if (data == null) {
      return;
    }

    initialValues.value = { isEnabled: data.isEnabled ?? false };
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
  if (state.status === 'success') {
    initialValues.value = { isEnabled: state.data.isEnabled ?? false };
    applyFormValues(initialValues.value);
  }
}

async function onSubmit() {
  if (formRef.value == null) {
    return;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (valid === false) {
    return;
  }

  try {
    await updateSettingsMutation.mutateAsync({ body: { isEnabled: form.isEnabled } });
    toast({
      type: 'success',
      title: t('views.achievement.settings.actions.save'),
      text: t('views.achievement.settings.messages.saveSuccess'),
    });
    await refreshSettings();
  }
  catch (error) {
    console.error(error);
  }
}

async function onReset() {
  try {
    const data = await resetSettingsMutation.mutateAsync({});
    initialValues.value = { isEnabled: data.isEnabled ?? false };
    applyFormValues(initialValues.value);
    await nextTick();
    formRef.value?.clearValidate();
    toast({
      type: 'success',
      title: t('views.achievement.settings.actions.reset'),
      text: t('views.achievement.settings.messages.resetSuccess'),
    });
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
    text: t('views.achievement.settings.messages.unsavedChanges'),
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
        id="achievementSettingsForm"
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
          {{ t('views.achievement.settings.actions.reset') }}
        </el-button>
        <el-button
          type="primary"
          :loading="isSubmitting"
          :disabled="!isDirty"
          @click="onSubmit"
        >
          {{ t('views.achievement.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
