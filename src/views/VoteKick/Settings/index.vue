<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type { VoteKickFeatureSettingsDto } from '~/generated/api/types.gen';
import { useMutation, useQuery } from '@pinia/colada';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  voteKickGetSettingsQuery,
  voteKickResetSettingsMutation,
  voteKickUpdateSettingsMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { generateElementRules } from '~/utils';
import { translateLiteralPlaceholders } from '~/utils/i18nLiteralPlaceholders';

defineOptions({ name: 'VoteKickSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  commandName: string;
  commandAliases: string;
  minOnlinePlayers: number;
  voteDurationSeconds: number;
  passThresholdPercent: number;
  initiatorCooldownSeconds: number;
  targetImmunitySeconds: number;
  kickReason: string;
  voteStartedMessage: string;
  votePassedMessage: string;
  voteFailedMessage: string;
  alreadyVotedMessage: string;
  cooldownMessage: string;
  cannotKickAdminMessage: string;
  targetNotFoundMessage: string;
  targetAlreadyGoneMessage: string;
  alreadyActiveMessage: string;
  usageTipMessage: string;
  notEnoughPlayersMessage: string;
  voteProgressMessage: string;
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
    commandName: 'votekick',
    commandAliases: '',
    minOnlinePlayers: 3,
    voteDurationSeconds: 60,
    passThresholdPercent: 60,
    initiatorCooldownSeconds: 120,
    targetImmunitySeconds: 300,
    kickReason: 'Voted off by players',
    voteStartedMessage: '',
    votePassedMessage: '',
    voteFailedMessage: '',
    alreadyVotedMessage: '',
    cooldownMessage: '',
    cannotKickAdminMessage: '',
    targetNotFoundMessage: '',
    targetAlreadyGoneMessage: '',
    alreadyActiveMessage: '',
    usageTipMessage: '',
    notEnoughPlayersMessage: '',
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
  targetImmunitySeconds: v.pipe(v.number(), v.minValue(0)),
  kickReason: v.string(),
  voteStartedMessage: v.string(),
  votePassedMessage: v.string(),
  voteFailedMessage: v.string(),
  alreadyVotedMessage: v.string(),
  cooldownMessage: v.string(),
  cannotKickAdminMessage: v.string(),
  targetNotFoundMessage: v.string(),
  targetAlreadyGoneMessage: v.string(),
  alreadyActiveMessage: v.string(),
  usageTipMessage: v.string(),
  notEnoughPlayersMessage: v.string(),
  voteProgressMessage: v.string(),
});

const rules: FormRules = generateElementRules(schema);

const policyFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.voteKick.settings.fields.isEnabled'),
    el: 'el-switch',
    props: {
      inlinePrompt: true,
      activeText: t('common.yes'),
      inactiveText: t('common.no'),
      size: 'large',
    },
    span: { xs: 24, md: 24 },
  },
]);

const settingsFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'commandName',
    label: t('views.voteKick.settings.fields.commandName'),
    el: 'el-input',
    props: { clearable: true },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'commandAliases',
    label: t('views.voteKick.settings.fields.commandAliases'),
    el: 'el-input',
    props: { clearable: true },
    tooltip: t('views.voteKick.settings.tooltips.commandAliases'),
    span: { xs: 24 },
  },
  {
    prop: 'minOnlinePlayers',
    label: t('views.voteKick.settings.fields.minOnlinePlayers'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    tooltip: t('views.voteKick.settings.tooltips.minOnlinePlayers'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'voteDurationSeconds',
    label: t('views.voteKick.settings.fields.voteDurationSeconds'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'passThresholdPercent',
    label: t('views.voteKick.settings.fields.passThresholdPercent'),
    el: 'el-input-number',
    props: { min: 1, max: 100, precision: 1, class: 'w-full' },
    tooltip: t('views.voteKick.settings.tooltips.passThresholdPercent'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'initiatorCooldownSeconds',
    label: t('views.voteKick.settings.fields.initiatorCooldownSeconds'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'targetImmunitySeconds',
    label: t('views.voteKick.settings.fields.targetImmunitySeconds'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    tooltip: t('views.voteKick.settings.tooltips.targetImmunitySeconds'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'kickReason',
    label: t('views.voteKick.settings.fields.kickReason'),
    el: 'el-input',
    props: { clearable: true },
    tooltip: t('views.voteKick.settings.tooltips.kickReason'),
    span: { xs: 24 },
  },
  {
    prop: 'voteStartedMessage',
    label: t('views.voteKick.settings.fields.voteStartedMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    tooltip: translateLiteralPlaceholders(t, 'views.voteKick.settings.tooltips.voteStartedMessage', ['Initiator', 'Target', 'Duration', 'Command']),
    span: { xs: 24 },
  },
  {
    prop: 'votePassedMessage',
    label: t('views.voteKick.settings.fields.votePassedMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    span: { xs: 24 },
  },
  {
    prop: 'voteFailedMessage',
    label: t('views.voteKick.settings.fields.voteFailedMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    span: { xs: 24 },
  },
  {
    prop: 'voteProgressMessage',
    label: t('views.voteKick.settings.fields.voteProgressMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    tooltip: translateLiteralPlaceholders(t, 'views.voteKick.settings.tooltips.voteProgressMessage', ['Yes', 'No', 'Total', 'Threshold']),
    span: { xs: 24 },
  },
  {
    prop: 'alreadyVotedMessage',
    label: t('views.voteKick.settings.fields.alreadyVotedMessage'),
    el: 'el-input',
    props: { clearable: true },
    span: { xs: 24 },
  },
  {
    prop: 'cooldownMessage',
    label: t('views.voteKick.settings.fields.cooldownMessage'),
    el: 'el-input',
    props: { clearable: true },
    tooltip: translateLiteralPlaceholders(t, 'views.voteKick.settings.tooltips.cooldownMessage', ['RemainingSeconds']),
    span: { xs: 24 },
  },
  {
    prop: 'cannotKickAdminMessage',
    label: t('views.voteKick.settings.fields.cannotKickAdminMessage'),
    el: 'el-input',
    props: { clearable: true },
    span: { xs: 24 },
  },
  {
    prop: 'targetNotFoundMessage',
    label: t('views.voteKick.settings.fields.targetNotFoundMessage'),
    el: 'el-input',
    props: { clearable: true },
    span: { xs: 24 },
  },
  {
    prop: 'targetAlreadyGoneMessage',
    label: t('views.voteKick.settings.fields.targetAlreadyGoneMessage'),
    el: 'el-input',
    props: { clearable: true },
    span: { xs: 24 },
  },
  {
    prop: 'alreadyActiveMessage',
    label: t('views.voteKick.settings.fields.alreadyActiveMessage'),
    el: 'el-input',
    props: { clearable: true },
    span: { xs: 24 },
  },
  {
    prop: 'usageTipMessage',
    label: t('views.voteKick.settings.fields.usageTipMessage'),
    el: 'el-input',
    props: { clearable: true },
    tooltip: t('views.voteKick.settings.tooltips.usageTipMessage'),
    span: { xs: 24 },
  },
  {
    prop: 'notEnoughPlayersMessage',
    label: t('views.voteKick.settings.fields.notEnoughPlayersMessage'),
    el: 'el-input',
    props: { clearable: true },
    tooltip: translateLiteralPlaceholders(t, 'views.voteKick.settings.tooltips.notEnoughPlayersMessage', ['MinPlayers', 'CurrentPlayers']),
    span: { xs: 24 },
  },
]);

const settingsQuery = useQuery(voteKickGetSettingsQuery());
const updateSettingsMutation = useMutation({
  ...voteKickUpdateSettingsMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('VoteKick');
  },
});
const resetSettingsMutation = useMutation({
  ...voteKickResetSettingsMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('VoteKick');
  },
});
const isLoading = computed(() => settingsQuery.isPending.value);
const isSubmitting = computed(() => updateSettingsMutation.isLoading.value || resetSettingsMutation.isLoading.value);

function mapSettings(data: VoteKickFeatureSettingsDto | null | undefined): FormModel {
  if (!data)
    return buildDefaults();
  return {
    isEnabled: data.isEnabled ?? false,
    commandName: data.commandName ?? 'votekick',
    commandAliases: (data.commandAliases ?? []).join(', '),
    minOnlinePlayers: data.minOnlinePlayers ?? 3,
    voteDurationSeconds: data.voteDurationSeconds ?? 60,
    passThresholdPercent: data.passThresholdPercent ?? 60,
    initiatorCooldownSeconds: data.initiatorCooldownSeconds ?? 120,
    targetImmunitySeconds: data.targetImmunitySeconds ?? 300,
    kickReason: data.kickReason ?? 'Voted off by players',
    voteStartedMessage: data.voteStartedMessage ?? '',
    votePassedMessage: data.votePassedMessage ?? '',
    voteFailedMessage: data.voteFailedMessage ?? '',
    alreadyVotedMessage: data.alreadyVotedMessage ?? '',
    cooldownMessage: data.cooldownMessage ?? '',
    cannotKickAdminMessage: data.cannotKickAdminMessage ?? '',
    targetNotFoundMessage: data.targetNotFoundMessage ?? '',
    targetAlreadyGoneMessage: data.targetAlreadyGoneMessage ?? '',
    alreadyActiveMessage: data.alreadyActiveMessage ?? '',
    usageTipMessage: data.usageTipMessage ?? '',
    notEnoughPlayersMessage: data.notEnoughPlayersMessage ?? '',
    voteProgressMessage: data.voteProgressMessage ?? '',
  };
}

function applyFormValues(values: FormModel): void {
  Object.assign(form, values);
}

function toPayload(values: FormModel): VoteKickFeatureSettingsDto {
  const parseAliases = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
  return {
    isEnabled: values.isEnabled,
    commandName: values.commandName.trim() || null,
    commandAliases: parseAliases(values.commandAliases),
    minOnlinePlayers: Number(values.minOnlinePlayers),
    voteDurationSeconds: Number(values.voteDurationSeconds),
    passThresholdPercent: Number(values.passThresholdPercent),
    initiatorCooldownSeconds: Number(values.initiatorCooldownSeconds),
    targetImmunitySeconds: Number(values.targetImmunitySeconds),
    kickReason: values.kickReason.trim() || null,
    voteStartedMessage: values.voteStartedMessage.trim() || null,
    votePassedMessage: values.votePassedMessage.trim() || null,
    voteFailedMessage: values.voteFailedMessage.trim() || null,
    alreadyVotedMessage: values.alreadyVotedMessage.trim() || null,
    cooldownMessage: values.cooldownMessage.trim() || null,
    cannotKickAdminMessage: values.cannotKickAdminMessage.trim() || null,
    targetNotFoundMessage: values.targetNotFoundMessage.trim() || null,
    targetAlreadyGoneMessage: values.targetAlreadyGoneMessage.trim() || null,
    alreadyActiveMessage: values.alreadyActiveMessage.trim() || null,
    usageTipMessage: values.usageTipMessage.trim() || null,
    notEnoughPlayersMessage: values.notEnoughPlayersMessage.trim() || null,
    voteProgressMessage: values.voteProgressMessage.trim() || null,
  };
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

async function onSubmit() {
  if (formRef.value == null) {
    return;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (valid === false) {
    return;
  }

  try {
    await updateSettingsMutation.mutateAsync({ body: toPayload(form) });
    toast({
      type: 'success',
      title: t('views.voteKick.settings.actions.save'),
      text: t('views.voteKick.settings.messages.saveSuccess'),
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
    initialValues.value = mapSettings(data);
    applyFormValues(initialValues.value);
    await nextTick();
    formRef.value?.clearValidate();
    toast({
      type: 'success',
      title: t('views.voteKick.settings.actions.reset'),
      text: t('views.voteKick.settings.messages.resetSuccess'),
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
    text: t('views.voteKick.settings.messages.unsavedChanges'),
  });
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

      <div>
        <MyForm
          id="voteKickSettingsForm"
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
          {{ t('views.voteKick.settings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.voteKick.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
