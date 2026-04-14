<script setup lang="ts">
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { createProfile, updateProfile } from '~/api/coloredChat';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

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

const props = withDefaults(defineProps<Props>(), {
  editData: null,
});

const emit = defineEmits(['saved']);

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

const dialogRef = useTemplateRef<DialogExpose>('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');
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
    rules: rules.playerId,
    tooltip: t('views.coloredChat.profiles.tooltips.playerId'),
    disabled: () => isEdit.value,
  },
  {
    prop: 'customName',
    label: t('views.coloredChat.profiles.fields.customName'),
    el: 'input',
    rules: rules.customName,
    tooltip: t('views.coloredChat.profiles.tooltips.customName'),
  },
  {
    prop: 'nameColor',
    label: t('views.coloredChat.profiles.fields.nameColor'),
    el: 'input',
    rules: rules.nameColor,
    tooltip: t('views.coloredChat.profiles.tooltips.hexColor'),
  },
  {
    prop: 'textColor',
    label: t('views.coloredChat.profiles.fields.textColor'),
    el: 'input',
    rules: rules.textColor,
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
    rules: rules.description,
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
  const normalizedValue = value.trim().replace(/^#/, '').toUpperCase();
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
      label-width="130px"
    />
  </MyDialog>
</template>
