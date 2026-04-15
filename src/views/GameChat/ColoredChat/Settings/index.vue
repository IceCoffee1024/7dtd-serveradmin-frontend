<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { getSettings, resetSettings, updateSettings } from '~/api/coloredChat';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import { COLORED_CHAT_COLOR_PRESETS } from '~/constants/coloredChat';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'ColoredChatSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  globalDefault: string;
  whisperDefault: string;
  friendsDefault: string;
  partyDefault: string;
  adminDefault: string;
  systemDefault: string;
  allowPlayerColorTags: boolean;
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
    isEnabled: false,
    globalDefault: 'FFFFFF',
    whisperDefault: 'D00000',
    friendsDefault: '00BB00',
    partyDefault: 'FFCC00',
    adminDefault: 'FF4D4D',
    systemDefault: 'FF8C00',
    allowPlayerColorTags: false,
  };
}

const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  isEnabled: v.boolean(),
  globalDefault: v.optional(v.string()),
  whisperDefault: v.optional(v.string()),
  friendsDefault: v.optional(v.string()),
  partyDefault: v.optional(v.string()),
  adminDefault: v.optional(v.string()),
  systemDefault: v.optional(v.string()),
  allowPlayerColorTags: v.boolean(),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const colorPresets = computed(() => [...COLORED_CHAT_COLOR_PRESETS]);

const policyFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.coloredChat.settings.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    tooltip: t('views.coloredChat.settings.tooltips.isEnabled'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'allowPlayerColorTags',
    label: t('views.coloredChat.settings.fields.allowPlayerColorTags'),
    el: 'el-select',
    options: booleanOptions.value,
    tooltip: t('views.coloredChat.settings.tooltips.allowPlayerColorTags'),
    span: { xs: 24, md: 12 },
  },
]);

const colorFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'globalDefault',
    label: t('views.coloredChat.settings.fields.globalDefault'),
    el: 'color-picker',
    props: {
      presets: colorPresets.value,
    },
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'whisperDefault',
    label: t('views.coloredChat.settings.fields.whisperDefault'),
    el: 'color-picker',
    props: {
      presets: colorPresets.value,
    },
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'friendsDefault',
    label: t('views.coloredChat.settings.fields.friendsDefault'),
    el: 'color-picker',
    props: {
      presets: colorPresets.value,
    },
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'partyDefault',
    label: t('views.coloredChat.settings.fields.partyDefault'),
    el: 'color-picker',
    props: {
      presets: colorPresets.value,
    },
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'adminDefault',
    label: t('views.coloredChat.settings.fields.adminDefault'),
    el: 'color-picker',
    props: {
      presets: colorPresets.value,
    },
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'systemDefault',
    label: t('views.coloredChat.settings.fields.systemDefault'),
    el: 'color-picker',
    props: {
      presets: colorPresets.value,
    },
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
]);

function mapSettings(data: API.ColoredChat.Settings | null | undefined): FormModel {
  const source = data ?? {
    isEnabled: false,
    globalDefault: null,
    whisperDefault: null,
    friendsDefault: null,
    partyDefault: null,
    adminDefault: null,
    systemDefault: null,
    allowPlayerColorTags: false,
  };
  return {
    isEnabled: source.isEnabled,
    globalDefault: source.globalDefault ?? 'FFFFFF',
    whisperDefault: source.whisperDefault ?? 'D00000',
    friendsDefault: source.friendsDefault ?? '00BB00',
    partyDefault: source.partyDefault ?? 'FFCC00',
    adminDefault: source.adminDefault ?? 'FF4D4D',
    systemDefault: source.systemDefault ?? 'FF8C00',
    allowPlayerColorTags: source.allowPlayerColorTags,
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
  form.allowPlayerColorTags = values.allowPlayerColorTags;
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
      title: t('views.coloredChat.settings.actions.reset'),
      text: t('views.coloredChat.settings.messages.resetSuccess'),
    });
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

function toPayload(values: FormModel): API.ColoredChat.Settings {
  return {
    isEnabled: values.isEnabled,
    globalDefault: values.globalDefault || null,
    whisperDefault: values.whisperDefault || null,
    friendsDefault: values.friendsDefault || null,
    partyDefault: values.partyDefault || null,
    adminDefault: values.adminDefault || null,
    systemDefault: values.systemDefault || null,
    allowPlayerColorTags: values.allowPlayerColorTags,
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
    await updateSettings(toPayload(form));
    toast({
      type: 'success',
      title: t('views.coloredChat.settings.actions.save'),
      text: t('views.coloredChat.settings.messages.saveSuccess'),
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
  <div class="pb-2 flex flex-col gap-4">
    <div v-if="isLoading" class="flex flex-col gap-4">
      <el-skeleton v-for="index in 6" :key="index" animated>
        <template #template>
          <el-skeleton-item variant="text" class="h-8" />
        </template>
      </el-skeleton>
    </div>

    <template v-else>
      <section class="p-4 border border-gray-200 rounded-4 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
        <MyForm
          ref="formRef"
          v-model="form"
          :fields="policyFields"
          :rules="rules"
          label-position="top"
          label-width="auto"
          :gutter="16"
        />

        <div class="mb-4 mt-2 pt-3 border-t border-gray-100 flex flex-col gap-2 dark:border-gray-800">
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

        <MyForm
          v-model="form"
          :fields="colorFields"
          :rules="rules"
          label-position="top"
          label-width="auto"
          :gutter="16"
        />
      </section>

      <div class="px-1 pt-2 border-t border-gray-200 flex gap-2 justify-end dark:border-gray-700">
        <el-button :disabled="isSubmitting" @click="onReset">
          <el-icon><icon-mdi-refresh /></el-icon>
          {{ t('views.coloredChat.settings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.coloredChat.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
