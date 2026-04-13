<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { getCommonChatSettings, updateCommonChatSettings } from '~/api/chat';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'CommonChatSettings' });

interface FormModel {
  globalServerName: string;
  whisperServerName: string;
  chatCommandPrefixes: string;
  allowNoPrefix: boolean;
  chatCommandSeparators: string;
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
    globalServerName: '',
    whisperServerName: '',
    chatCommandPrefixes: '/',
    allowNoPrefix: false,
    chatCommandSeparators: ' ',
  };
}

const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  globalServerName: v.optional(v.string()),
  whisperServerName: v.optional(v.string()),
  chatCommandPrefixes: v.pipe(v.string(), v.minLength(1)),
  allowNoPrefix: v.boolean(),
  chatCommandSeparators: v.pipe(v.string(), v.minLength(1)),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'globalServerName',
    label: t('views.chatManagement.commonSettings.fields.globalServerName'),
    el: 'input',
    rules: rules.globalServerName,
    tooltip: t('views.chatManagement.commonSettings.tooltips.globalServerName'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'whisperServerName',
    label: t('views.chatManagement.commonSettings.fields.whisperServerName'),
    el: 'input',
    rules: rules.whisperServerName,
    tooltip: t('views.chatManagement.commonSettings.tooltips.whisperServerName'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'chatCommandPrefixes',
    label: t('views.chatManagement.commonSettings.fields.chatCommandPrefixes'),
    el: 'input',
    rules: rules.chatCommandPrefixes,
    tooltip: t('views.chatManagement.commonSettings.tooltips.chatCommandPrefixes'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'allowNoPrefix',
    label: t('views.chatManagement.commonSettings.fields.allowNoPrefix'),
    el: 'select',
    options: booleanOptions.value,
    rules: rules.allowNoPrefix,
    tooltip: t('views.chatManagement.commonSettings.tooltips.allowNoPrefix'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'chatCommandSeparators',
    label: t('views.chatManagement.commonSettings.fields.chatCommandSeparators'),
    el: 'input',
    rules: rules.chatCommandSeparators,
    tooltip: t('views.chatManagement.commonSettings.tooltips.chatCommandSeparators'),
    span: { xs: 24, md: 12 },
  },
]);

function readString(data: Record<string, unknown>, pascalKey: string, camelKey: string, fallback: string = ''): string {
  const pascalValue = data[pascalKey];
  if (typeof pascalValue === 'string') {
    return pascalValue;
  }

  const camelValue = data[camelKey];
  if (typeof camelValue === 'string') {
    return camelValue;
  }

  return fallback;
}

function readBoolean(data: Record<string, unknown>, pascalKey: string, camelKey: string, fallback: boolean = false): boolean {
  const pascalValue = data[pascalKey];
  if (typeof pascalValue === 'boolean') {
    return pascalValue;
  }

  const camelValue = data[camelKey];
  if (typeof camelValue === 'boolean') {
    return camelValue;
  }

  return fallback;
}

function readStringArray(data: Record<string, unknown>, pascalKey: string, camelKey: string, fallback: string[]): string[] {
  const pascalValue = data[pascalKey];
  if (Array.isArray(pascalValue)) {
    return pascalValue.filter((item): item is string => typeof item === 'string');
  }

  const camelValue = data[camelKey];
  if (Array.isArray(camelValue)) {
    return camelValue.filter((item): item is string => typeof item === 'string');
  }

  return fallback;
}

function mapSettings(data: API.Chat.CommonChatSettings | Record<string, unknown> | null | undefined): FormModel {
  const source = (data ?? {}) as Record<string, unknown>;
  return {
    globalServerName: readString(source, 'GlobalServerName', 'globalServerName'),
    whisperServerName: readString(source, 'WhisperServerName', 'whisperServerName'),
    chatCommandPrefixes: readStringArray(source, 'ChatCommandPrefixes', 'chatCommandPrefixes', ['/']).join(','),
    allowNoPrefix: readBoolean(source, 'AllowNoPrefix', 'allowNoPrefix'),
    chatCommandSeparators: readStringArray(source, 'ChatCommandSeparators', 'chatCommandSeparators', [' ']).join(','),
  };
}

function applyFormValues(values: FormModel): void {
  form.globalServerName = values.globalServerName;
  form.whisperServerName = values.whisperServerName;
  form.chatCommandPrefixes = values.chatCommandPrefixes;
  form.allowNoPrefix = values.allowNoPrefix;
  form.chatCommandSeparators = values.chatCommandSeparators;
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
    const data = await getCommonChatSettings();
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

function onReset() {
  applyFormValues(initialValues.value);
  nextTick(() => formRef.value?.clearValidate());
}

function toPayload(values: FormModel): API.Chat.CommonChatSettings {
  return {
    globalServerName: values.globalServerName || undefined,
    whisperServerName: values.whisperServerName || undefined,
    chatCommandPrefixes: splitCommaSeparated(values.chatCommandPrefixes),
    allowNoPrefix: values.allowNoPrefix,
    chatCommandSeparators: splitCommaSeparated(values.chatCommandSeparators, false),
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
    await updateCommonChatSettings(toPayload(form));
    toast({
      type: 'success',
      title: t('views.chatManagement.commonSettings.actions.save'),
      text: t('views.chatManagement.commonSettings.messages.saveSuccess'),
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
  <div>
    <div v-if="isLoading" class="flex flex-col gap-4">
      <el-skeleton v-for="index in 4" :key="index" animated>
        <template #template>
          <el-skeleton-item variant="text" class="h-8" />
        </template>
      </el-skeleton>
    </div>
    <template v-else>
      <MyForm
        ref="formRef"
        v-model="form"
        :fields="fields"
        label-position="top"
        label-width="auto"
        :gutter="16"
      />

      <div class="mt-4 flex gap-2 justify-end">
        <el-button :disabled="isSubmitting" @click="onReset">
          <el-icon><icon-mdi-refresh /></el-icon>
          {{ t('views.chatManagement.commonSettings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.chatManagement.commonSettings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>