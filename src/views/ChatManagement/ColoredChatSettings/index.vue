<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { getColoredChatSettings, updateColoredChatSettings } from '~/api/chat';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'ColoredChatSettings' });

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
    label: t('views.chatManagement.coloredSettings.fields.isEnabled'),
    el: 'select',
    options: booleanOptions.value,
    rules: rules.isEnabled,
    tooltip: t('views.chatManagement.coloredSettings.tooltips.isEnabled'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'allowPlayerColorTags',
    label: t('views.chatManagement.coloredSettings.fields.allowPlayerColorTags'),
    el: 'select',
    options: booleanOptions.value,
    rules: rules.allowPlayerColorTags,
    tooltip: t('views.chatManagement.coloredSettings.tooltips.allowPlayerColorTags'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'globalDefault',
    label: t('views.chatManagement.coloredSettings.fields.globalDefault'),
    el: 'input',
    rules: rules.globalDefault,
    tooltip: t('views.chatManagement.coloredSettings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'whisperDefault',
    label: t('views.chatManagement.coloredSettings.fields.whisperDefault'),
    el: 'input',
    rules: rules.whisperDefault,
    tooltip: t('views.chatManagement.coloredSettings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'friendsDefault',
    label: t('views.chatManagement.coloredSettings.fields.friendsDefault'),
    el: 'input',
    rules: rules.friendsDefault,
    tooltip: t('views.chatManagement.coloredSettings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'partyDefault',
    label: t('views.chatManagement.coloredSettings.fields.partyDefault'),
    el: 'input',
    rules: rules.partyDefault,
    tooltip: t('views.chatManagement.coloredSettings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'adminDefault',
    label: t('views.chatManagement.coloredSettings.fields.adminDefault'),
    el: 'input',
    rules: rules.adminDefault,
    tooltip: t('views.chatManagement.coloredSettings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'systemDefault',
    label: t('views.chatManagement.coloredSettings.fields.systemDefault'),
    el: 'input',
    rules: rules.systemDefault,
    tooltip: t('views.chatManagement.coloredSettings.tooltips.hexColor'),
    span: { xs: 24, md: 12 },
  },
]);

function readString(data: Record<string, unknown>, pascalKey: string, camelKey: string, fallback: string): string {
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

function mapSettings(data: API.Chat.ColoredChatSettings | Record<string, unknown> | null | undefined): FormModel {
  const source = (data ?? {}) as Record<string, unknown>;
  return {
    isEnabled: readBoolean(source, 'IsEnabled', 'isEnabled'),
    globalDefault: readString(source, 'GlobalDefault', 'globalDefault', 'FFFFFF'),
    whisperDefault: readString(source, 'WhisperDefault', 'whisperDefault', 'D00000'),
    friendsDefault: readString(source, 'FriendsDefault', 'friendsDefault', '00BB00'),
    partyDefault: readString(source, 'PartyDefault', 'partyDefault', 'FFCC00'),
    adminDefault: readString(source, 'AdminDefault', 'adminDefault', 'FF4D4D'),
    systemDefault: readString(source, 'SystemDefault', 'systemDefault', 'FF8C00'),
    allowPlayerColorTags: readBoolean(source, 'AllowPlayerColorTags', 'allowPlayerColorTags'),
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
    const data = await getColoredChatSettings();
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

function toPayload(values: FormModel): API.Chat.ColoredChatSettings {
  return {
    isEnabled: values.isEnabled,
    globalDefault: values.globalDefault || undefined,
    whisperDefault: values.whisperDefault || undefined,
    friendsDefault: values.friendsDefault || undefined,
    partyDefault: values.partyDefault || undefined,
    adminDefault: values.adminDefault || undefined,
    systemDefault: values.systemDefault || undefined,
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
    await updateColoredChatSettings(toPayload(form));
    toast({
      type: 'success',
      title: t('views.chatManagement.coloredSettings.actions.save'),
      text: t('views.chatManagement.coloredSettings.messages.saveSuccess'),
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
          {{ t('views.chatManagement.coloredSettings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.chatManagement.coloredSettings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
