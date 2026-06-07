<script setup lang="ts">
import type { MyFormField } from '~/composables/useMyForm';
import type { AdminUserDto } from '~/generated/api/types.gen';
import { useMutation } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { gameServerCreateAdminUserMutation } from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { generateElementRules, showCommandResult } from '~/utils';
import { isValidPlayerIdInput, normalizePlayerIdInput } from '~/utils/playerId';

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
  editData?: AdminUserDto | null;
}

const props = withDefaults(defineProps<Props>(), {
  editData: null,
});

const emit = defineEmits(['saved']);
const dialogRef = useTemplateRef<DialogExpose>('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');
const { t } = useI18n();
const createAdminUserMutation = useMutation({
  ...gameServerCreateAdminUserMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('GameServer');
  },
});

const isEdit = computed(() => !!props.editData);
const dialogTitle = computed(() => (isEdit.value ? t('views.permission.editAdminUser') : t('views.permission.addAdminUser')));
const confirmText = computed(() => (isEdit.value ? t('common.update') : t('common.save')));
const isSubmitting = computed(() => createAdminUserMutation.isLoading.value);

const form = reactive<FormModel>({
  playerId: '',
  permissionLevel: 2000,
  displayName: '',
});

const AdminUserSchema = v.object({
  playerId: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1),
    v.check(isValidPlayerIdInput, t('views.permission.validation.invalidPlayerId')),
  ),
  permissionLevel: v.pipe(v.number(), v.minValue(0), v.maxValue(2000)),
  displayName: v.pipe(v.string(), v.minLength(1)),
});

const rules = generateElementRules(AdminUserSchema);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'playerId',
    label: t('views.banWhitelist.playerId'),
    el: 'el-input',
    tooltip: t('views.permission.tooltips.playerId'),
    disabled: () => isEdit.value,
    onChange: () => {
      form.playerId = normalizePlayerIdInput(form.playerId);
    },
  },
  {
    prop: 'permissionLevel',
    label: t('views.permission.permissionLevel'),
    el: 'el-input-number',
    props: {
      min: 0,
      max: 2000,
      class: 'w-full',
    },
    tooltip: t('views.permission.tooltips.permissionLevel'),
  },
  {
    prop: 'displayName',
    label: t('views.banWhitelist.displayName'),
    el: 'el-input',
    tooltip: t('views.permission.tooltips.displayName'),
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
    return false;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return false;
  }

  try {
    const result = await createAdminUserMutation.mutateAsync({
      body: {
        ...form,
        playerId: normalizePlayerIdInput(form.playerId),
      },
    });
    if (!showCommandResult(result ?? undefined, isEdit.value ? t('common.update') : t('common.save')))
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
    :loading="isSubmitting"
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
