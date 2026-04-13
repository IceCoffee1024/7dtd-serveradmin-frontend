<script setup lang="ts">
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { createColoredChatProfile, updateColoredChatProfile } from '~/api/chat';
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
const dialogRef = useTemplateRef<DialogExpose>('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');
const { t } = useI18n();
const { toast } = usePopup();

const isEdit = computed(() => !!props.editData);
const dialogTitle = computed(() => (isEdit.value ? t('views.chatManagement.coloredProfiles.editProfile') : t('views.chatManagement.coloredProfiles.addProfile')));
const confirmText = computed(() => (isEdit.value ? t('common.update') : t('common.save')));

const form = reactive<FormModel>({
  playerId: '',
  customName: '',
  nameColor: '',
  textColor: '',
  description: '',
});

const schema = v.object({
  playerId: v.pipe(v.string(), v.minLength(1)),
  customName: v.optional(v.string()),
  nameColor: v.optional(v.string()),
  textColor: v.optional(v.string()),
  description: v.optional(v.string()),
});

const rules = generateElementRules(schema);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'playerId',
    label: t('views.chatManagement.coloredProfiles.fields.playerId'),
    el: 'input',
    rules: rules.playerId,
    tooltip: t('views.chatManagement.coloredProfiles.tooltips.playerId'),
    disabled: () => isEdit.value,
  },
  {
    prop: 'customName',
    label: t('views.chatManagement.coloredProfiles.fields.customName'),
    el: 'input',
    rules: rules.customName,
    tooltip: t('views.chatManagement.coloredProfiles.tooltips.customName'),
  },
  {
    prop: 'nameColor',
    label: t('views.chatManagement.coloredProfiles.fields.nameColor'),
    el: 'input',
    rules: rules.nameColor,
    tooltip: t('views.chatManagement.coloredProfiles.tooltips.hexColor'),
  },
  {
    prop: 'textColor',
    label: t('views.chatManagement.coloredProfiles.fields.textColor'),
    el: 'input',
    rules: rules.textColor,
    tooltip: t('views.chatManagement.coloredProfiles.tooltips.hexColor'),
  },
  {
    prop: 'description',
    label: t('views.chatManagement.coloredProfiles.fields.description'),
    el: 'input',
    props: {
      type: 'textarea',
      rows: 3,
    },
    rules: rules.description,
    tooltip: t('views.chatManagement.coloredProfiles.tooltips.description'),
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

watch(
  () => props.editData,
  () => {
    syncFormData();
  },
  { immediate: true },
);

function toPayload(): API.Chat.ColoredChatProfileUpsert {
  return {
    playerId: form.playerId,
    customName: form.customName || null,
    nameColor: form.nameColor || null,
    textColor: form.textColor || null,
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
      await updateColoredChatProfile(toPayload());
    }
    else {
      await createColoredChatProfile(toPayload());
    }

    toast({
      type: 'success',
      title: isEdit.value ? t('common.update') : t('common.save'),
      text: t('views.chatManagement.coloredProfiles.messages.saveSuccess'),
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
