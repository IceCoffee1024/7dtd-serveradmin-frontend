<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { getSettings, resetSettings, updateSettings } from '~/api/coloredChat';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
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

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.coloredChat.settings.fields.isEnabled'),
    el: 'select',
    options: booleanOptions.value,
    rules: rules.isEnabled,
    tooltip: t('views.coloredChat.settings.tooltips.isEnabled'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'allowPlayerColorTags',
    label: t('views.coloredChat.settings.fields.allowPlayerColorTags'),
    el: 'select',
    options: booleanOptions.value,
    rules: rules.allowPlayerColorTags,
    tooltip: t('views.coloredChat.settings.tooltips.allowPlayerColorTags'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'globalDefault',
    label: t('views.coloredChat.settings.fields.globalDefault'),
    el: 'input',
    rules: rules.globalDefault,
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'whisperDefault',
    label: t('views.coloredChat.settings.fields.whisperDefault'),
    el: 'input',
    rules: rules.whisperDefault,
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'friendsDefault',
    label: t('views.coloredChat.settings.fields.friendsDefault'),
    el: 'input',
    rules: rules.friendsDefault,
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'partyDefault',
    label: t('views.coloredChat.settings.fields.partyDefault'),
    el: 'input',
    rules: rules.partyDefault,
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'adminDefault',
    label: t('views.coloredChat.settings.fields.adminDefault'),
    el: 'input',
    rules: rules.adminDefault,
    tooltip: t('views.coloredChat.settings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'systemDefault',
    label: t('views.coloredChat.settings.fields.systemDefault'),
    el: 'input',
    rules: rules.systemDefault,
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
