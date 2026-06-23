<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { ChatEffectPreviewRow } from '../../components/ChatEffectPreview.vue';
import type { MyFormField } from '~/composables/useMyForm';
import type { ColoredChatFeatureSettingsDto } from '~/generated/api/types.gen';
import { useMutation, useQuery } from '@pinia/colada';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import { COLORED_CHAT_COLOR_PRESETS } from '~/constants/coloredChat';
import {
  coloredChatGetSettingsQuery,
  coloredChatResetSettingsMutation,
  coloredChatUpdateSettingsMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { generateElementRules } from '~/utils';
import ChatEffectPreview from '../../components/ChatEffectPreview.vue';

defineOptions({ name: 'ColoredChatSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  globalDefault: string;
  whisperDefault: string;
  friendsDefault: string;
  partyDefault: string;
  adminDefault: string;
  systemDefault: string;
  playerColorTagPermission: string;
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
    globalDefault: 'FFFFFF',
    whisperDefault: 'D00000',
    friendsDefault: '00BB00',
    partyDefault: 'FFCC00',
    adminDefault: 'FF4D4D',
    systemDefault: 'FF8C00',
    playerColorTagPermission: 'None',
  };
}

const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const isDirty = computed(() => !isEqual(form, initialValues.value));

const schema = v.object({
  isEnabled: v.boolean(),
  globalDefault: v.optional(v.string()),
  whisperDefault: v.optional(v.string()),
  friendsDefault: v.optional(v.string()),
  partyDefault: v.optional(v.string()),
  adminDefault: v.optional(v.string()),
  systemDefault: v.optional(v.string()),
  playerColorTagPermission: v.pipe(v.string(), v.minLength(1)),
});

const rules: FormRules = generateElementRules(schema);

const playerColorTagPermissionOptions = computed(() => [
  { label: t('views.coloredChat.settings.playerColorTagPermissions.none'), value: 'None' },
  { label: t('views.coloredChat.settings.playerColorTagPermissions.all'), value: 'All' },
  { label: t('views.coloredChat.settings.playerColorTagPermissions.adminOnly'), value: 'AdminOnly' },
]);

const colorPresets = computed(() => [...COLORED_CHAT_COLOR_PRESETS]);

const policyFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.coloredChat.settings.fields.isEnabled'),
    el: 'el-switch',
    props: {
      inlinePrompt: true,
      activeText: t('common.yes'),
      inactiveText: t('common.no'),
      size: 'large',
    },
    tooltip: t('views.coloredChat.settings.tooltips.isEnabled'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'playerColorTagPermission',
    label: t('views.coloredChat.settings.fields.playerColorTagPermission'),
    el: 'el-select',
    options: playerColorTagPermissionOptions.value,
    tooltip: t('views.coloredChat.settings.tooltips.playerColorTagPermission'),
    span: { xs: 24, md: 12 },
  },
]);

const playerColorFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'globalDefault',
    label: t('views.coloredChat.settings.fields.globalDefault'),
    el: 'color-picker',
    props: { presets: colorPresets.value },
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'whisperDefault',
    label: t('views.coloredChat.settings.fields.whisperDefault'),
    el: 'color-picker',
    props: { presets: colorPresets.value },
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'friendsDefault',
    label: t('views.coloredChat.settings.fields.friendsDefault'),
    el: 'color-picker',
    props: { presets: colorPresets.value },
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'partyDefault',
    label: t('views.coloredChat.settings.fields.partyDefault'),
    el: 'color-picker',
    props: { presets: colorPresets.value },
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
]);

const systemColorFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'adminDefault',
    label: t('views.coloredChat.settings.fields.adminDefault'),
    el: 'color-picker',
    props: { presets: colorPresets.value },
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'systemDefault',
    label: t('views.coloredChat.settings.fields.systemDefault'),
    el: 'color-picker',
    props: { presets: colorPresets.value },
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
]);

const previewChannels = computed(() => [
  { key: 'global', label: t('views.coloredChat.settings.preview.channels.global'), color: form.globalDefault },
  { key: 'whisper', label: t('views.coloredChat.settings.preview.channels.whisper'), color: form.whisperDefault },
  { key: 'friends', label: t('views.coloredChat.settings.preview.channels.friends'), color: form.friendsDefault },
  { key: 'party', label: t('views.coloredChat.settings.preview.channels.party'), color: form.partyDefault },
  { key: 'admin', label: t('views.coloredChat.settings.preview.channels.admin'), color: form.adminDefault },
  { key: 'system', label: t('views.coloredChat.settings.preview.channels.system'), color: form.systemDefault },
]);

function previewColor(hex: string): string {
  return hex ? `#${hex}` : 'inherit';
}

const previewRows = computed<ChatEffectPreviewRow[]>(() =>
  previewChannels.value.map((ch) => {
    const isSystemChannel = ch.key === 'system';
    return {
      key: ch.key,
      channel: ch.label,
      sender: isSystemChannel
        ? t('views.chatSettings.preview.defaultSender')
        : t('views.coloredChat.settings.preview.samplePlayerName'),
      message: t('views.coloredChat.settings.preview.sampleMessage'),
      channelColor: previewColor(ch.color),
      senderColor: previewColor(ch.color),
      messageColor: previewColor(ch.color),
    };
  }),
);

const settingsQuery = useQuery(coloredChatGetSettingsQuery());
const updateSettingsMutation = useMutation({
  ...coloredChatUpdateSettingsMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('ColoredChat');
  },
});
const resetSettingsMutation = useMutation({
  ...coloredChatResetSettingsMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('ColoredChat');
  },
});
const isLoading = computed(() => settingsQuery.isPending.value);
const isSubmitting = computed(() => updateSettingsMutation.isLoading.value || resetSettingsMutation.isLoading.value);

function mapSettings(data: ColoredChatFeatureSettingsDto | null | undefined): FormModel {
  const source = data ?? {
    isEnabled: false,
    globalDefaultColor: null,
    whisperDefaultColor: null,
    friendsDefaultColor: null,
    partyDefaultColor: null,
    adminDefaultColor: null,
    systemDefaultColor: null,
    playerColorTagPermission: 'None',
  };
  return {
    isEnabled: source.isEnabled ?? false,
    globalDefault: source.globalDefaultColor ?? 'FFFFFF',
    whisperDefault: source.whisperDefaultColor ?? 'D00000',
    friendsDefault: source.friendsDefaultColor ?? '00BB00',
    partyDefault: source.partyDefaultColor ?? 'FFCC00',
    adminDefault: source.adminDefaultColor ?? 'FF4D4D',
    systemDefault: source.systemDefaultColor ?? 'FF8C00',
    playerColorTagPermission: source.playerColorTagPermission ?? 'None',
  };
}

function applyFormValues(values: FormModel): void {
  form.isEnabled = values.isEnabled;
  form.globalDefault = values.globalDefault;
  form.whisperDefault = values.whisperDefault;
  form.friendsDefault = values.friendsDefault;
  form.partyDefault = values.partyDefault;
  form.adminDefault = values.adminDefault;
  form.systemDefault = values.systemDefault;
  form.playerColorTagPermission = values.playerColorTagPermission;
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
      title: t('views.coloredChat.settings.actions.reset'),
      text: t('views.coloredChat.settings.messages.resetSuccess'),
    });
  }
  catch (error) {
    console.error(error);
  }
}

function toPayload(values: FormModel): ColoredChatFeatureSettingsDto {
  return {
    isEnabled: values.isEnabled,
    globalDefaultColor: values.globalDefault || null,
    whisperDefaultColor: values.whisperDefault || null,
    friendsDefaultColor: values.friendsDefault || null,
    partyDefaultColor: values.partyDefault || null,
    adminDefaultColor: values.adminDefault || null,
    systemDefaultColor: values.systemDefault || null,
    playerColorTagPermission: values.playerColorTagPermission,
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
      title: t('views.coloredChat.settings.actions.save'),
      text: t('views.coloredChat.settings.messages.saveSuccess'),
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
    text: t('views.coloredChat.settings.messages.unsavedChanges'),
  });
});
</script>

<template>
  <div class="pb-2 flex flex-col gap-4">
    <div v-if="isLoading" class="flex flex-col gap-4">
      <el-skeleton v-for="index in 6" :key="index" animated>
        <template #template>
          <el-skeleton-item variant="text" class="h-8" />
        </template>
      </el-skeleton>
    </div>

    <template v-else>
      <!-- Policy fields -->
      <MyForm
        ref="formRef"
        v-model="form"
        :fields="policyFields"
        :rules="rules"
        label-position="top"
        :gutter="16"
      />

      <!-- Color section -->
      <div class="pt-4 border-t border-gray-200 flex flex-col gap-2 dark:border-gray-700">
        <div class="flex flex-col gap-1">
          <h3 class="text-sm text-gray-900 font-semibold dark:text-gray-100">
            {{ t('views.coloredChat.settings.sections.colorsTitle') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('views.coloredChat.settings.sections.colorsDescription') }}
          </p>
        </div>
        <div class="text-xs text-gray-500 leading-5 px-3 py-2 rounded-3 bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
          {{ t('views.coloredChat.settings.sections.colorsHint') }}
        </div>
      </div>

      <div>
        <!-- Player channels group (#4) -->
        <p class="text-xs text-gray-400 tracking-wide font-semibold mb-3 uppercase dark:text-gray-500">
          {{ t('views.coloredChat.settings.sections.playerChannels') }}
        </p>
        <MyForm
          v-model="form"
          :fields="playerColorFields"
          :rules="rules"
          label-position="top"
          :gutter="16"
        />

        <!-- System channels group (#4) -->
        <p class="text-xs text-gray-400 tracking-wide font-semibold mb-3 mt-5 uppercase dark:text-gray-500">
          {{ t('views.coloredChat.settings.sections.systemChannels') }}
        </p>
        <MyForm
          v-model="form"
          :fields="systemColorFields"
          :rules="rules"
          label-position="top"
          :gutter="16"
        />
      </div>

      <!-- Effect preview (#2) -->
      <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
        <ChatEffectPreview
          :title="t('views.coloredChat.settings.preview.title')"
          :rows="previewRows"
        />
      </div>

      <!-- Buttons -->
      <div class="px-1 pt-2 border-t border-gray-200 flex gap-2 justify-end dark:border-gray-700">
        <el-button :disabled="isSubmitting" @click="onReset">
          <el-icon><icon-mdi-refresh /></el-icon>
          {{ t('views.coloredChat.settings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.coloredChat.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
