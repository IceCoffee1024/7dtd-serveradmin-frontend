<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import { getSettings, resetSettings, updateSettings } from '~/api/onlineReward';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'OnlineRewardSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  rewardIntervalMinutes: number;
  rewardAmount: number;
  rewardPartialPeriod: boolean;
  playerMessage: string | null;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const { t } = useI18n();
const { toast, confirm } = usePopup();

const formRef = useTemplateRef<FormExpose>('formRef');
const isLoading = ref(false);
const isSubmitting = ref(false);

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    rewardIntervalMinutes: 60,
    rewardAmount: 10,
    rewardPartialPeriod: false,
    playerMessage: null,
  };
}

const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const isDirty = computed(() => !isEqual(form, initialValues.value));

const schema = v.object({
  isEnabled: v.boolean(),
  rewardIntervalMinutes: v.pipe(v.number(), v.minValue(1)),
  rewardAmount: v.pipe(v.number(), v.minValue(0)),
  rewardPartialPeriod: v.boolean(),
  playerMessage: v.optional(v.nullable(v.string())),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.onlineReward.settings.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'rewardIntervalMinutes',
    label: t('views.onlineReward.settings.fields.rewardIntervalMinutes'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'rewardAmount',
    label: t('views.onlineReward.settings.fields.rewardAmount'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'rewardPartialPeriod',
    label: t('views.onlineReward.settings.fields.rewardPartialPeriod'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'playerMessage',
    label: t('views.onlineReward.settings.fields.playerMessage'),
    tooltip: t('views.onlineReward.settings.fields.playerMessageHint'),
    el: 'el-input',
    props: { clearable: true },
    span: { xs: 24 },
  },
]);

function applyFormValues(values: FormModel): void {
  Object.assign(form, values);
}

async function loadSettings() {
  isLoading.value = true;
  try {
    const data = await getSettings();
    initialValues.value = {
      isEnabled: data.isEnabled,
      rewardIntervalMinutes: data.rewardIntervalMinutes,
      rewardAmount: data.rewardAmount,
      rewardPartialPeriod: data.rewardPartialPeriod,
      playerMessage: data.playerMessage ?? null,
    };
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

async function onSubmit() {
  if (formRef.value == null) {
    return;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (valid === false) {
    return;
  }

  isSubmitting.value = true;
  try {
    await updateSettings({ ...form });
    toast({
      type: 'success',
      title: t('views.onlineReward.settings.actions.save'),
      text: t('views.onlineReward.settings.messages.saveSuccess'),
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

async function onReset() {
  isSubmitting.value = true;
  try {
    const data = await resetSettings();
    initialValues.value = {
      isEnabled: data.isEnabled,
      rewardIntervalMinutes: data.rewardIntervalMinutes,
      rewardAmount: data.rewardAmount,
      rewardPartialPeriod: data.rewardPartialPeriod,
      playerMessage: data.playerMessage ?? null,
    };
    applyFormValues(initialValues.value);
    await nextTick();
    formRef.value?.clearValidate();
    toast({
      type: 'success',
      title: t('views.onlineReward.settings.actions.reset'),
      text: t('views.onlineReward.settings.messages.resetSuccess'),
    });
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

onBeforeRouteLeave(async () => {
  if (!isDirty.value) {
    return true;
  }
  return await confirm({
    type: 'warning',
    text: t('views.onlineReward.settings.messages.unsavedChanges'),
  });
});

onMounted(() => {
  loadSettings();
});
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
        id="onlineRewardSettingsForm"
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
          {{ t('views.onlineReward.settings.actions.reset') }}
        </el-button>
        <el-button
          type="primary"
          :loading="isSubmitting"
          :disabled="!isDirty"
          @click="onSubmit"
        >
          {{ t('views.onlineReward.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
