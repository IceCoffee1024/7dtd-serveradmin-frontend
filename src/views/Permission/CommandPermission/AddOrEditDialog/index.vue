<script setup lang="ts">
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { addCommandPermission } from '~/api/gameServer';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import v from '~/plugins/valibot';
import { generateElementRules, showCommandResult } from '~/utils';

interface FormModel {
  command: string;
  permissionLevel: number;
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

const isEdit = computed(() => !!props.editData);
const dialogTitle = computed(() => (isEdit.value ? t('views.permission.editCommandPermission') : t('views.permission.addCommandPermission')));
const confirmText = computed(() => (isEdit.value ? t('common.update') : t('common.save')));

const form = reactive<FormModel>({
  command: '',
  permissionLevel: 2000,
  description: '',
});

const CommandPermissionSchema = v.object({
  command: v.pipe(v.string(), v.minLength(1)),
  permissionLevel: v.pipe(v.number(), v.minValue(0), v.maxValue(2000)),
  description: v.optional(v.string()),
});

const rules = generateElementRules(CommandPermissionSchema);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'command',
    label: t('views.permission.command'),
    el: 'input',
    tooltip: t('views.permission.tooltips.command'),
    disabled: () => isEdit.value,
  },
  {
    prop: 'permissionLevel',
    label: t('views.permission.permissionLevel'),
    el: 'input-number',
    props: {
      min: 0,
      max: 2000,
      class: 'w-full',
    },
    tooltip: t('views.permission.tooltips.permissionLevel'),
  },
  {
    prop: 'description',
    label: t('views.permission.description'),
    el: 'input',
    props: {
      type: 'textarea',
      rows: 3,
    },
    tooltip: t('views.permission.tooltips.description'),
  },
]);

function syncFormData() {
  if (props.editData) {
    form.command = String(props.editData.command ?? '');
    form.permissionLevel = Number(props.editData.permissionLevel ?? 2000);
    form.description = String(props.editData.description ?? '');
  }
  else {
    form.command = '';
    form.permissionLevel = 2000;
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

async function onSubmit() {
  if (!formRef.value) {
    return false;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return false;
  }

  try {
    const result = await addCommandPermission({
      command: form.command,
      permissionLevel: form.permissionLevel,
    });
    if (!showCommandResult(result, isEdit.value ? t('common.update') : t('common.save')))
      return false;

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
      :rules="rules"
      label-width="130px"
    />
  </MyDialog>
</template>
