<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import { getChatSettings, resetChatSettings, updateChatSettings } from '~/api/chat';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

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
    isEnabled: true,
    globalServerName: '',
    whisperServerName: '',
    chatCommandPrefixes: '/',
    allowNoPrefix: false,
    chatCommandSeparators: ' ',
    historyRetentionDays: 0,
    excludeCommandsFromHistory: false,
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
    el: 'el-select',
    options: booleanOptions.value,
    tooltip: t('views.chatSettings.tooltips.isEnabled'),
    disabled: () => true,
    span: { xs: 24, md: 12 },
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
]);

const previewChannels = computed(() => [
  {
    key: 'global',
    label: t('views.chatSettings.preview.channels.global'),
    sender: form.globalServerName || t('views.chatSettings.preview.defaultSender'),
  },
  {
    key: 'whisper',
    label: t('views.chatSettings.preview.channels.whisper'),
    sender: form.whisperServerName || t('views.chatSettings.preview.defaultSender'),
  },
]);

function mapSettings(data: API.Chat.ChatSettings | null | undefined): FormModel {
  const source = data ?? {
    globalServerName: null,
    whisperServerName: null,
    chatCommandPrefixes: ['/'],
    allowNoPrefix: false,
    chatCommandSeparators: [' '],
  };
  return {
    isEnabled: true,
    globalServerName: source.globalServerName ?? '',
    whisperServerName: source.whisperServerName ?? '',
    chatCommandPrefixes: (source.chatCommandPrefixes ?? ['/']).join(','),
    allowNoPrefix: source.allowNoPrefix,
    chatCommandSeparators: (source.chatCommandSeparators ?? [' ']).join(','),
    historyRetentionDays: source.historyRetentionDays ?? 0,
    excludeCommandsFromHistory: source.excludeCommandsFromHistory ?? false,
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
}

function splitCommaSeparated(value: string, trimItems: boolean = true): string[] {
  return value
    .split(',')
    .map(item => trimItems ? item.trim() : item)
    .filter(item => trimItems ? item.length > 0 : item !== '');
}

async function loadSettings() {
  isLoading.value = true;
  try {
    const data = await getChatSettings();
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
    const data = await resetChatSettings();
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
  finally {
    isSubmitting.value = false;
  }
}

function toPayload(values: FormModel): API.Chat.ChatSettings {
  return {
    globalServerName: values.globalServerName || null,
    whisperServerName: values.whisperServerName || null,
    chatCommandPrefixes: splitCommaSeparated(values.chatCommandPrefixes),
    allowNoPrefix: values.allowNoPrefix,
    chatCommandSeparators: splitCommaSeparated(values.chatCommandSeparators, false),
    historyRetentionDays: Number(values.historyRetentionDays ?? 0),
    excludeCommandsFromHistory: values.excludeCommandsFromHistory,
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
    await updateChatSettings(toPayload(form));
    toast({
      type: 'success',
      title: t('views.chatSettings.actions.save'),
      text: t('views.chatSettings.messages.saveSuccess'),
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

onBeforeRouteLeave(async () => {
  if (!isDirty.value) {
    return true;
  }
  return await confirm({
    type: 'warning',
    text: t('views.chatSettings.messages.unsavedChanges'),
  });
});

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
        id="chatSettingsForm"
        ref="formRef"
        v-model="form"
        :fields="fields"
        :rules="rules"
        label-position="left"
        label-width="140px"
        :gutter="16"
        class="chat-settings-form"
        @submit.prevent="onSubmit"
      />

      <div class="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-2 dark:border-gray-700">
        <h3 class="text-sm text-gray-900 font-semibold dark:text-gray-100">
          {{ t('views.chatSettings.preview.title') }}
        </h3>
        <div class="rounded-3 bg-gray-950 px-4 py-3 font-mono text-sm flex flex-col gap-1 leading-6">
          <span v-for="ch in previewChannels" :key="ch.key">
            <span class="text-gray-500">[{{ ch.label }}]</span>
            <span class="text-yellow-400"> {{ ch.sender }}</span>
            <span class="text-gray-300">: {{ t('views.chatSettings.preview.sampleMessage') }}</span>
          </span>
        </div>
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
