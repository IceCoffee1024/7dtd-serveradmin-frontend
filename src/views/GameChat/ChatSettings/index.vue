<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { ChatEffectPreviewRow } from '../components/ChatEffectPreview.vue';
import type { MyFormField } from '~/composables/useMyForm';
import type { ChatFeatureSettingsDto } from '~/generated/api/types.gen';
import { useMutation, useQuery } from '@pinia/colada';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  chatGetSettingsQuery,
  chatResetSettingsMutation,
  chatUpdateSettingsMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { generateElementRules } from '~/utils';
import ChatEffectPreview from '../components/ChatEffectPreview.vue';

defineOptions({ name: 'ChatSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  globalServerName: string;
  whisperServerName: string;
  chatCommandPrefixes: string;
  allowNoPrefix: boolean;
  chatCommandSeparators: string;
  historyRetentionDays: number;
  excludeCommandsFromHistory: boolean;
  muteNotifyMessage: string;
  muteAppliedPrivateMessage: string;
  muteAppliedBroadcastMessage: string;
  muteRemovedPrivateMessage: string;
  muteRemovedBroadcastMessage: string;
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
    isEnabled: true,
    globalServerName: '',
    whisperServerName: '',
    chatCommandPrefixes: '/',
    allowNoPrefix: false,
    chatCommandSeparators: ' ',
    historyRetentionDays: 0,
    excludeCommandsFromHistory: false,
    muteNotifyMessage: '',
    muteAppliedPrivateMessage: '',
    muteAppliedBroadcastMessage: '',
    muteRemovedPrivateMessage: '',
    muteRemovedBroadcastMessage: '',
  };
}

const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const isDirty = computed(() => !isEqual(form, initialValues.value));

const schema = v.object({
  isEnabled: v.boolean(),
  globalServerName: v.optional(v.string()),
  whisperServerName: v.optional(v.string()),
  chatCommandPrefixes: v.pipe(v.string(), v.minLength(1)),
  allowNoPrefix: v.boolean(),
  chatCommandSeparators: v.pipe(v.string(), v.minLength(1)),
  historyRetentionDays: v.pipe(v.number(), v.minValue(0)),
  excludeCommandsFromHistory: v.boolean(),
  muteNotifyMessage: v.optional(v.string()),
  muteAppliedPrivateMessage: v.optional(v.string()),
  muteAppliedBroadcastMessage: v.optional(v.string()),
  muteRemovedPrivateMessage: v.optional(v.string()),
  muteRemovedBroadcastMessage: v.optional(v.string()),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.chatSettings.fields.isEnabled'),
    el: 'el-switch',
    props: {
      inlinePrompt: true,
      activeText: t('common.yes'),
      inactiveText: t('common.no'),
      size: 'large',
    },
    tooltip: t('views.chatSettings.tooltips.isEnabled'),
    disabled: () => true,
    span: { xs: 24, md: 24 },
  },
  {
    prop: 'globalServerName',
    label: t('views.chatSettings.fields.globalServerName'),
    el: 'el-input',
    tooltip: t('views.chatSettings.tooltips.globalServerName'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'whisperServerName',
    label: t('views.chatSettings.fields.whisperServerName'),
    el: 'el-input',
    tooltip: t('views.chatSettings.tooltips.whisperServerName'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'chatCommandPrefixes',
    label: t('views.chatSettings.fields.chatCommandPrefixes'),
    el: 'el-input',
    tooltip: t('views.chatSettings.tooltips.chatCommandPrefixes'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'allowNoPrefix',
    label: t('views.chatSettings.fields.allowNoPrefix'),
    el: 'el-select',
    options: booleanOptions.value,
    tooltip: t('views.chatSettings.tooltips.allowNoPrefix'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'chatCommandSeparators',
    label: t('views.chatSettings.fields.chatCommandSeparators'),
    el: 'el-input',
    tooltip: t('views.chatSettings.tooltips.chatCommandSeparators'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'historyRetentionDays',
    label: t('views.chatSettings.fields.historyRetentionDays'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    tooltip: t('views.chatSettings.tooltips.historyRetentionDays'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'excludeCommandsFromHistory',
    label: t('views.chatSettings.fields.excludeCommandsFromHistory'),
    el: 'el-select',
    options: booleanOptions.value,
    tooltip: t('views.chatSettings.tooltips.excludeCommandsFromHistory'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'muteNotifyMessage',
    label: t('views.chatSettings.fields.muteNotifyMessage'),
    el: 'el-input',
    tooltip: t('views.chatSettings.tooltips.muteNotifyMessage'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'muteAppliedPrivateMessage',
    label: t('views.chatSettings.fields.muteAppliedPrivateMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2 },
    tooltip: t('views.chatSettings.tooltips.muteAppliedPrivateMessage'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'muteAppliedBroadcastMessage',
    label: t('views.chatSettings.fields.muteAppliedBroadcastMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2 },
    tooltip: t('views.chatSettings.tooltips.muteAppliedBroadcastMessage'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'muteRemovedPrivateMessage',
    label: t('views.chatSettings.fields.muteRemovedPrivateMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2 },
    tooltip: t('views.chatSettings.tooltips.muteRemovedPrivateMessage'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'muteRemovedBroadcastMessage',
    label: t('views.chatSettings.fields.muteRemovedBroadcastMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2 },
    tooltip: t('views.chatSettings.tooltips.muteRemovedBroadcastMessage'),
    span: { xs: 24, md: 12 },
  },
]);

const previewRows = computed<ChatEffectPreviewRow[]>(() => [
  {
    key: 'global',
    channel: t('views.chatSettings.preview.channels.global'),
    sender: form.globalServerName || t('views.chatSettings.preview.defaultSender'),
    message: t('views.chatSettings.preview.sampleMessage'),
    channelColor: 'rgba(203, 213, 225, 0.76)',
    senderColor: '#facc15',
    messageColor: 'rgba(255, 255, 255, 0.86)',
  },
  {
    key: 'whisper',
    channel: t('views.chatSettings.preview.channels.whisper'),
    sender: form.whisperServerName || t('views.chatSettings.preview.defaultSender'),
    message: t('views.chatSettings.preview.sampleMessage'),
    channelColor: 'rgba(203, 213, 225, 0.76)',
    senderColor: '#eab308',
    messageColor: 'rgba(255, 255, 255, 0.86)',
  },
]);

const settingsQuery = useQuery(chatGetSettingsQuery());
const updateSettingsMutation = useMutation({
  ...chatUpdateSettingsMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('Chat');
  },
});
const resetSettingsMutation = useMutation({
  ...chatResetSettingsMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('Chat');
  },
});
const isLoading = computed(() => settingsQuery.isPending.value);
const isSubmitting = computed(() => updateSettingsMutation.isLoading.value || resetSettingsMutation.isLoading.value);

function mapSettings(data: ChatFeatureSettingsDto | null | undefined): FormModel {
  const source: Partial<ChatFeatureSettingsDto> = data ?? {
    globalServerName: null,
    whisperServerName: null,
    chatCommandPrefixes: ['/'],
    allowNoPrefix: false,
    chatCommandSeparators: [' '],
    historyRetentionDays: 0,
    excludeCommandsFromHistory: false,
    muteNotifyMessage: null,
    muteAppliedPrivateMessage: null,
    muteAppliedBroadcastMessage: null,
    muteRemovedPrivateMessage: null,
    muteRemovedBroadcastMessage: null,
  };
  return {
    isEnabled: true,
    globalServerName: source.globalServerName ?? '',
    whisperServerName: source.whisperServerName ?? '',
    chatCommandPrefixes: (source.chatCommandPrefixes ?? ['/']).join(','),
    allowNoPrefix: source.allowNoPrefix ?? false,
    chatCommandSeparators: (source.chatCommandSeparators ?? [' ']).join(','),
    historyRetentionDays: source.historyRetentionDays ?? 0,
    excludeCommandsFromHistory: source.excludeCommandsFromHistory ?? false,
    muteNotifyMessage: source.muteNotifyMessage ?? '',
    muteAppliedPrivateMessage: source.muteAppliedPrivateMessage ?? '',
    muteAppliedBroadcastMessage: source.muteAppliedBroadcastMessage ?? '',
    muteRemovedPrivateMessage: source.muteRemovedPrivateMessage ?? '',
    muteRemovedBroadcastMessage: source.muteRemovedBroadcastMessage ?? '',
  };
}

function applyFormValues(values: FormModel): void {
  form.isEnabled = true;
  form.globalServerName = values.globalServerName;
  form.whisperServerName = values.whisperServerName;
  form.chatCommandPrefixes = values.chatCommandPrefixes;
  form.allowNoPrefix = values.allowNoPrefix;
  form.chatCommandSeparators = values.chatCommandSeparators;
  form.historyRetentionDays = values.historyRetentionDays;
  form.excludeCommandsFromHistory = values.excludeCommandsFromHistory;
  form.muteNotifyMessage = values.muteNotifyMessage;
  form.muteAppliedPrivateMessage = values.muteAppliedPrivateMessage;
  form.muteAppliedBroadcastMessage = values.muteAppliedBroadcastMessage;
  form.muteRemovedPrivateMessage = values.muteRemovedPrivateMessage;
  form.muteRemovedBroadcastMessage = values.muteRemovedBroadcastMessage;
}

function splitCommaSeparated(value: string, trimItems: boolean = true): string[] {
  return value
    .split(',')
    .map(item => trimItems ? item.trim() : item)
    .filter(item => trimItems ? item.length > 0 : item !== '');
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
      title: t('views.chatSettings.actions.reset'),
      text: t('views.chatSettings.messages.resetSuccess'),
    });
  }
  catch (error) {
    console.error(error);
  }
}

function toPayload(values: FormModel): ChatFeatureSettingsDto {
  return {
    globalServerName: values.globalServerName || null,
    whisperServerName: values.whisperServerName || null,
    chatCommandPrefixes: splitCommaSeparated(values.chatCommandPrefixes),
    allowNoPrefix: values.allowNoPrefix,
    chatCommandSeparators: splitCommaSeparated(values.chatCommandSeparators, false),
    historyRetentionDays: Number(values.historyRetentionDays ?? 0),
    excludeCommandsFromHistory: values.excludeCommandsFromHistory,
    muteNotifyMessage: values.muteNotifyMessage || null,
    muteAppliedPrivateMessage: values.muteAppliedPrivateMessage || null,
    muteAppliedBroadcastMessage: values.muteAppliedBroadcastMessage || null,
    muteRemovedPrivateMessage: values.muteRemovedPrivateMessage || null,
    muteRemovedBroadcastMessage: values.muteRemovedBroadcastMessage || null,
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
      title: t('views.chatSettings.actions.save'),
      text: t('views.chatSettings.messages.saveSuccess'),
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
    text: t('views.chatSettings.messages.unsavedChanges'),
  });
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
        id="chatSettingsForm"
        ref="formRef"
        v-model="form"
        :fields="fields"
        :rules="rules"
        label-position="top"
        :gutter="16"
        class="chat-settings-form"
        @submit.prevent="onSubmit"
      />

      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <ChatEffectPreview
          :title="t('views.chatSettings.preview.title')"
          :rows="previewRows"
        />
      </div>

      <div class="mt-4 flex gap-2 justify-end">
        <el-button :disabled="isSubmitting" @click="onReset">
          <el-icon><icon-mdi-refresh /></el-icon>
          {{ t('views.chatSettings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.chatSettings.actions.save') }}
        </el-button>
      </div>
    </template>
  </el-card>
</template>
