<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import { getSettings, resetSettings, updateSettings } from '~/api/voteRestart';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'VoteRestartSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  commandName: string;
  commandAliases: string;
  minOnlinePlayers: number;
  voteDurationSeconds: number;
  passThresholdPercent: number;
  initiatorCooldownSeconds: number;
  globalCooldownSeconds: number;
  warningLeadSeconds: number;
  voteStartedMessage: string;
  votePassedMessage: string;
  voteFailedMessage: string;
  alreadyVotedMessage: string;
  initiatorCooldownMessage: string;
  globalCooldownMessage: string;
  notEnoughPlayersMessage: string;
  alreadyActiveMessage: string;
  voteProgressMessage: string;
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
    commandName: 'voterestart',
    commandAliases: '',
    minOnlinePlayers: 2,
    voteDurationSeconds: 60,
    passThresholdPercent: 60,
    initiatorCooldownSeconds: 300,
    globalCooldownSeconds: 600,
    warningLeadSeconds: 30,
    voteStartedMessage: '',
    votePassedMessage: '',
    voteFailedMessage: '',
    alreadyVotedMessage: '',
    initiatorCooldownMessage: '',
    globalCooldownMessage: '',
    notEnoughPlayersMessage: '',
    alreadyActiveMessage: '',
    voteProgressMessage: '',
  };
}

const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const isDirty = computed(() => !isEqual(form, initialValues.value));

const schema = v.object({
  isEnabled: v.boolean(),
  commandName: v.pipe(v.string(), v.minLength(1)),
  commandAliases: v.string(),
  minOnlinePlayers: v.pipe(v.number(), v.minValue(1)),
  voteDurationSeconds: v.pipe(v.number(), v.minValue(1)),
  passThresholdPercent: v.pipe(v.number(), v.minValue(1), v.maxValue(100)),
  initiatorCooldownSeconds: v.pipe(v.number(), v.minValue(0)),
  globalCooldownSeconds: v.pipe(v.number(), v.minValue(0)),
  warningLeadSeconds: v.pipe(v.number(), v.minValue(0)),
  voteStartedMessage: v.string(),
  votePassedMessage: v.string(),
  voteFailedMessage: v.string(),
  alreadyVotedMessage: v.string(),
  initiatorCooldownMessage: v.string(),
  globalCooldownMessage: v.string(),
  notEnoughPlayersMessage: v.string(),
  alreadyActiveMessage: v.string(),
  voteProgressMessage: v.string(),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const policyFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.voteRestart.settings.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
]);

const settingsFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'commandName',
    label: t('views.voteRestart.settings.fields.commandName'),
    el: 'el-input',
    props: { clearable: true },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'commandAliases',
    label: t('views.voteRestart.settings.fields.commandAliases'),
    el: 'el-input',
    props: { clearable: true },
    tooltip: t('views.voteRestart.settings.tooltips.commandAliases'),
    span: { xs: 24 },
  },
  {
    prop: 'minOnlinePlayers',
    label: t('views.voteRestart.settings.fields.minOnlinePlayers'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    tooltip: t('views.voteRestart.settings.tooltips.minOnlinePlayers'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'voteDurationSeconds',
    label: t('views.voteRestart.settings.fields.voteDurationSeconds'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'passThresholdPercent',
    label: t('views.voteRestart.settings.fields.passThresholdPercent'),
    el: 'el-input-number',
    props: { min: 1, max: 100, precision: 1, class: 'w-full' },
    tooltip: t('views.voteRestart.settings.tooltips.passThresholdPercent'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'warningLeadSeconds',
    label: t('views.voteRestart.settings.fields.warningLeadSeconds'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    tooltip: t('views.voteRestart.settings.tooltips.warningLeadSeconds'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'initiatorCooldownSeconds',
    label: t('views.voteRestart.settings.fields.initiatorCooldownSeconds'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'globalCooldownSeconds',
    label: t('views.voteRestart.settings.fields.globalCooldownSeconds'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'voteStartedMessage',
    label: t('views.voteRestart.settings.fields.voteStartedMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    tooltip: t('views.voteRestart.settings.tooltips.voteStartedMessage'),
    span: { xs: 24 },
  },
  {
    prop: 'votePassedMessage',
    label: t('views.voteRestart.settings.fields.votePassedMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    span: { xs: 24 },
  },
  {
    prop: 'voteFailedMessage',
    label: t('views.voteRestart.settings.fields.voteFailedMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    span: { xs: 24 },
  },
  {
    prop: 'voteProgressMessage',
    label: t('views.voteRestart.settings.fields.voteProgressMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    tooltip: t('views.voteRestart.settings.tooltips.voteProgressMessage'),
    span: { xs: 24 },
  },
  {
    prop: 'alreadyVotedMessage',
    label: t('views.voteRestart.settings.fields.alreadyVotedMessage'),
    el: 'el-input',
    props: { clearable: true },
    span: { xs: 24 },
  },
  {
    prop: 'initiatorCooldownMessage',
    label: t('views.voteRestart.settings.fields.initiatorCooldownMessage'),
    el: 'el-input',
    props: { clearable: true },
    tooltip: t('views.voteRestart.settings.tooltips.cooldownMessage'),
    span: { xs: 24 },
  },
  {
    prop: 'globalCooldownMessage',
    label: t('views.voteRestart.settings.fields.globalCooldownMessage'),
    el: 'el-input',
    props: { clearable: true },
    span: { xs: 24 },
  },
  {
    prop: 'notEnoughPlayersMessage',
    label: t('views.voteRestart.settings.fields.notEnoughPlayersMessage'),
    el: 'el-input',
    props: { clearable: true },
    tooltip: t('views.voteRestart.settings.tooltips.notEnoughPlayersMessage'),
    span: { xs: 24 },
  },
  {
    prop: 'alreadyActiveMessage',
    label: t('views.voteRestart.settings.fields.alreadyActiveMessage'),
    el: 'el-input',
    props: { clearable: true },
    span: { xs: 24 },
  },
]);

function mapSettings(data: API.VoteRestart.Settings | null | undefined): FormModel {
  if (!data)
    return buildDefaults();
  return {
    isEnabled: data.isEnabled,
    commandName: data.commandName ?? 'voterestart',
    commandAliases: (data.commandAliases ?? []).join(', '),
    minOnlinePlayers: data.minOnlinePlayers,
    voteDurationSeconds: data.voteDurationSeconds,
    passThresholdPercent: data.passThresholdPercent,
    initiatorCooldownSeconds: data.initiatorCooldownSeconds,
    globalCooldownSeconds: data.globalCooldownSeconds,
    warningLeadSeconds: data.warningLeadSeconds,
    voteStartedMessage: data.voteStartedMessage ?? '',
    votePassedMessage: data.votePassedMessage ?? '',
    voteFailedMessage: data.voteFailedMessage ?? '',
    alreadyVotedMessage: data.alreadyVotedMessage ?? '',
    initiatorCooldownMessage: data.initiatorCooldownMessage ?? '',
    globalCooldownMessage: data.globalCooldownMessage ?? '',
    notEnoughPlayersMessage: data.notEnoughPlayersMessage ?? '',
    alreadyActiveMessage: data.alreadyActiveMessage ?? '',
    voteProgressMessage: data.voteProgressMessage ?? '',
  };
}

function applyFormValues(values: FormModel): void {
  Object.assign(form, values);
}

function toPayload(values: FormModel): API.VoteRestart.Settings {
  const parseAliases = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
  return {
    isEnabled: values.isEnabled,
    commandName: values.commandName.trim() || null,
    commandAliases: parseAliases(values.commandAliases),
    minOnlinePlayers: Number(values.minOnlinePlayers),
    voteDurationSeconds: Number(values.voteDurationSeconds),
    passThresholdPercent: Number(values.passThresholdPercent),
    initiatorCooldownSeconds: Number(values.initiatorCooldownSeconds),
    globalCooldownSeconds: Number(values.globalCooldownSeconds),
    warningLeadSeconds: Number(values.warningLeadSeconds),
    voteStartedMessage: values.voteStartedMessage.trim() || null,
    votePassedMessage: values.votePassedMessage.trim() || null,
    voteFailedMessage: values.voteFailedMessage.trim() || null,
    alreadyVotedMessage: values.alreadyVotedMessage.trim() || null,
    initiatorCooldownMessage: values.initiatorCooldownMessage.trim() || null,
    globalCooldownMessage: values.globalCooldownMessage.trim() || null,
    notEnoughPlayersMessage: values.notEnoughPlayersMessage.trim() || null,
    alreadyActiveMessage: values.alreadyActiveMessage.trim() || null,
    voteProgressMessage: values.voteProgressMessage.trim() || null,
  };
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
    await updateSettings(toPayload(form));
    toast({
      type: 'success',
      title: t('views.voteRestart.settings.actions.save'),
      text: t('views.voteRestart.settings.messages.saveSuccess'),
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
    initialValues.value = mapSettings(data);
    applyFormValues(initialValues.value);
    await nextTick();
    formRef.value?.clearValidate();
    toast({
      type: 'success',
      title: t('views.voteRestart.settings.actions.reset'),
      text: t('views.voteRestart.settings.messages.resetSuccess'),
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
    text: t('views.voteRestart.settings.messages.unsavedChanges'),
  });
});

onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div>
    <div v-if="isLoading" class="flex flex-col gap-4">
      <el-skeleton v-for="index in 8" :key="index" animated>
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
          id="voteRestartSettingsForm"
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
          {{ t('views.voteRestart.settings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.voteRestart.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
