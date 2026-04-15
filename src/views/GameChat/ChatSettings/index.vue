<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
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
    isEnabled: true,
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
  isEnabled: v.boolean(),
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
    prop: 'isEnabled',
    label: t('views.chatSettings.fields.isEnabled'),
    el: 'select',
    options: booleanOptions.value,
    tooltip: t('views.chatSettings.tooltips.isEnabled'),
    disabled: () => true,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'globalServerName',
    label: t('views.chatSettings.fields.globalServerName'),
    el: 'input',
    tooltip: t('views.chatSettings.tooltips.globalServerName'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'whisperServerName',
    label: t('views.chatSettings.fields.whisperServerName'),
    el: 'input',
    tooltip: t('views.chatSettings.tooltips.whisperServerName'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'chatCommandPrefixes',
    label: t('views.chatSettings.fields.chatCommandPrefixes'),
    el: 'input',
    tooltip: t('views.chatSettings.tooltips.chatCommandPrefixes'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'allowNoPrefix',
    label: t('views.chatSettings.fields.allowNoPrefix'),
    el: 'select',
    options: booleanOptions.value,
    tooltip: t('views.chatSettings.tooltips.allowNoPrefix'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'chatCommandSeparators',
    label: t('views.chatSettings.fields.chatCommandSeparators'),
    el: 'input',
    tooltip: t('views.chatSettings.tooltips.chatCommandSeparators'),
    span: { xs: 24, md: 12 },
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
    chatCommandPrefixes: source.chatCommandPrefixes.join(','),
    allowNoPrefix: source.allowNoPrefix,
    chatCommandSeparators: source.chatCommandSeparators.join(','),
  };
}

function applyFormValues(values: FormModel): void {
  form.isEnabled = true;
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
        :rules="rules"
        label-position="top"
        label-width="auto"
        :gutter="16"
      />

      <div class="mt-4 flex gap-2 justify-end">
        <el-button :disabled="isSubmitting" @click="onReset">
          <el-icon><icon-mdi-refresh /></el-icon>
          {{ t('views.chatSettings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.chatSettings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
