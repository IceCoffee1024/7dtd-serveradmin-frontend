<script setup lang="ts">
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { createProfile, updateProfile } from '~/api/coloredChat';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

const props = withDefaults(defineProps<Props>(), {
  editData: null,
});

const emit = defineEmits(['saved']);

/** Variables supported by the CustomName template engine on the backend. */
const COLORED_CHAT_NAME_VARIABLES = [
  { key: '{playerName}', descriptionKey: 'views.coloredChat.profiles.variables.playerName' },
  { key: '{playerId}', descriptionKey: 'views.coloredChat.profiles.variables.playerId' },
  { key: '{entityId}', descriptionKey: 'views.coloredChat.profiles.variables.entityId' },
  { key: '{chatType}', descriptionKey: 'views.coloredChat.profiles.variables.chatType' },
] as const;

interface FormModel {
  playerId: string;
  customName: string;
  nameColor: string;
  textColor: string;
  description: string;
}

interface DialogExpose {
  open: () => void;
  close: () => void;
}

interface FormExpose {
  validate: () => Promise<boolean>;
  clearValidate: (props?: string | string[]) => void;
}

interface Props {
  editData?: Record<string, unknown> | null;
}

const PLAYER_ID_SCHEMA = v.pipe(
  v.string(),
  v.minLength(1),
  v.regex(/^\S+$/),
);

const HEX_COLOR_INPUT_SCHEMA = v.union([
  v.literal(''),
  v.pipe(
    v.string(),
    v.regex(/^#?[0-9A-F]{6}$/i),
  ),
]);

const HEX_COLOR_PREFIX_REGEX = /^#/;

const dialogRef = useTemplateRef<DialogExpose>('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');
const customNameInputRef = useTemplateRef<{ input: HTMLInputElement }>('customNameInputRef');
const { t } = useI18n();
const { toast } = usePopup();

const isEdit = computed(() => !!props.editData);
const dialogTitle = computed(() => (isEdit.value ? t('views.coloredChat.profiles.editProfile') : t('views.coloredChat.profiles.addProfile')));
const confirmText = computed(() => (isEdit.value ? t('common.update') : t('common.save')));

const form = reactive<FormModel>({
  playerId: '',
  customName: '',
  nameColor: '',
  textColor: '',
  description: '',
});

const schema = v.object({
  playerId: PLAYER_ID_SCHEMA,
  customName: v.optional(v.string()),
  nameColor: HEX_COLOR_INPUT_SCHEMA,
  textColor: HEX_COLOR_INPUT_SCHEMA,
  description: v.optional(v.string()),
});

const rules = generateElementRules(schema);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'playerId',
    label: t('views.coloredChat.profiles.fields.playerId'),
    el: 'input',
    tooltip: t('views.coloredChat.profiles.tooltips.playerId'),
    disabled: () => isEdit.value,
  },
  {
    prop: 'customName',
    label: t('views.coloredChat.profiles.fields.customName'),
    el: 'custom',
    tooltip: t('views.coloredChat.profiles.tooltips.customName'),
  },
  {
    prop: 'nameColor',
    label: t('views.coloredChat.profiles.fields.nameColor'),
    el: 'input',
    tooltip: t('views.coloredChat.profiles.tooltips.hexColor'),
  },
  {
    prop: 'textColor',
    label: t('views.coloredChat.profiles.fields.textColor'),
    el: 'input',
    tooltip: t('views.coloredChat.profiles.tooltips.hexColor'),
  },
  {
    prop: 'description',
    label: t('views.coloredChat.profiles.fields.description'),
    el: 'input',
    props: {
      type: 'textarea',
      rows: 3,
    },
    tooltip: t('views.coloredChat.profiles.tooltips.description'),
  },
]);

function syncFormData() {
  if (props.editData) {
    form.playerId = String(props.editData.playerId ?? '');
    form.customName = String(props.editData.customName ?? '');
    form.nameColor = String(props.editData.nameColor ?? '');
    form.textColor = String(props.editData.textColor ?? '');
    form.description = String(props.editData.description ?? '');
  }
  else {
    form.playerId = '';
    form.customName = '';
    form.nameColor = '';
    form.textColor = '';
    form.description = '';
  }
}

function normalizePlayerId(value: string): string {
  return value.trim();
}

function normalizeHexColor(value: string): string | null {
  const normalizedValue = value.trim().replace(HEX_COLOR_PREFIX_REGEX, '').toUpperCase();
  return normalizedValue.length === 0 ? null : normalizedValue;
}

watch(
  () => props.editData,
  () => {
    syncFormData();
  },
  { immediate: true },
);

function toPayload(): API.ColoredChat.ProfileUpsert {
  return {
    playerId: normalizePlayerId(form.playerId),
    customName: form.customName || null,
    nameColor: normalizeHexColor(form.nameColor),
    textColor: normalizeHexColor(form.textColor),
    description: form.description || null,
  };
}

async function onSubmit() {
  if (!formRef.value) {
    return false;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return false;
  }

  try {
    if (isEdit.value) {
      await updateProfile(toPayload());
    }
    else {
      await createProfile(toPayload());
    }

    toast({
      type: 'success',
      title: isEdit.value ? t('common.update') : t('common.save'),
      text: t('views.coloredChat.profiles.messages.saveSuccess'),
    });

    emit('saved');
    dialogRef.value?.close();
    return true;
  }
  catch (error) {
    console.error(error);
    return false;
  }
}

/**
 * Inserts a variable token at the current cursor position in the customName input.
 * Falls back to appending if the input reference is unavailable.
 * @param variable - The variable token string to insert, e.g. '{playerName}'.
 */
function insertVariable(variable: string): void {
  const inputEl = customNameInputRef.value?.input;
  if (inputEl) {
    const start = inputEl.selectionStart ?? form.customName.length;
    const end = inputEl.selectionEnd ?? form.customName.length;
    const current = form.customName || '';
    form.customName = current.slice(0, start) + variable + current.slice(end);
    nextTick(() => {
      inputEl.focus();
      const newPos = start + variable.length;
      inputEl.setSelectionRange(newPos, newPos);
    });
  }
  else {
    form.customName = (form.customName || '') + variable;
  }
}

async function show() {
  syncFormData();
  dialogRef.value?.open();
  await nextTick();
  formRef.value?.clearValidate();
}

defineExpose({
  show,
});
</script>

<template>
  <MyDialog
    ref="dialogRef"
    :title="dialogTitle"
    width="50rem"
    :on-confirm="onSubmit"
    :confirm-text="confirmText"
    :cancel-text="t('common.cancel')"
  >
    <MyForm
      ref="formRef"
      v-model="form"
      :fields="fields"
      :rules="rules"
      label-width="130px"
    >
      <template #customName>
        <div class="flex flex-col gap-2 w-full">
          <el-input
            ref="customNameInputRef"
            v-model="form.customName"
            :placeholder="t('components.myForm.pleaseInput', { label: t('views.coloredChat.profiles.fields.customName') })"
          />
          <div class="flex flex-wrap gap-1.5 items-center">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('views.coloredChat.profiles.availableVariables') }}:
            </span>
            <el-tooltip
              v-for="variable in COLORED_CHAT_NAME_VARIABLES"
              :key="variable.key"
              :content="t(variable.descriptionKey)"
              placement="top"
            >
              <el-tag
                type="primary"
                class="cursor-pointer"
                @click="insertVariable(variable.key)"
              >
                {{ variable.key }}
              </el-tag>
            </el-tooltip>
          </div>
        </div>
      </template>
    </MyForm>
  </MyDialog>
</template>
