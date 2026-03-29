<script setup lang="ts">
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { addAdminUser } from '~/api/gameServer';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

interface FormModel {
  playerId: string;
  permissionLevel: number;
  displayName: string;
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
const dialogTitle = computed(() => (isEdit.value ? t('views.permission.editAdminUser') : t('views.permission.addAdminUser')));
const confirmText = computed(() => (isEdit.value ? t('common.update') : t('common.save')));

const form = reactive<FormModel>({
  playerId: '',
  permissionLevel: 2000,
  displayName: '',
});

const AdminUserSchema = v.object({
  playerId: v.pipe(v.string(), v.minLength(1)),
  permissionLevel: v.pipe(v.number(), v.minValue(0), v.maxValue(2000)),
  displayName: v.pipe(v.string(), v.minLength(1)),
});

const rules = generateElementRules(AdminUserSchema);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'playerId',
    label: t('views.banWhitelist.playerId'),
    el: 'input',
    rules: rules.playerId,
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
    rules: rules.permissionLevel,
  },
  {
    prop: 'displayName',
    label: t('views.banWhitelist.displayName'),
    el: 'input',
    rules: rules.displayName,
  },
]);

function syncFormData() {
  if (props.editData) {
    form.playerId = String(props.editData.playerId ?? '');
    form.permissionLevel = Number(props.editData.permissionLevel ?? 2000);
    form.displayName = String(props.editData.displayName ?? '');
  }
  else {
    form.playerId = '';
    form.permissionLevel = 2000;
    form.displayName = '';
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
    return;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  try {
    await addAdminUser(form);
    emit('saved');
    dialogRef.value?.close();
  }
  catch (error) {
    console.error(error);
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
