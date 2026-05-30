<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type { MuteEntryDto, MuteEntryUpsertDto } from '~/generated/api/types.gen';
import { useMutation } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { chatAddOrUpdateMuteMutation } from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { generateElementRules } from '~/utils';

interface FormModel {
  playerId: string;
  playerName: string;
  mutedUntil: Date | null;
  reason: string;
}

interface Props {
  editData?: MuteEntryDto | null;
}

const props = withDefaults(defineProps<Props>(), {
  editData: null,
});

const emit = defineEmits(['saved']);
const dialogRef = useTemplateRef('dialogRef');
const formRef = useTemplateRef('formRef');
const { t } = useI18n();
const addOrUpdateMuteMutation = useMutation({
  ...chatAddOrUpdateMuteMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('Chat');
  },
});

const isEdit = computed(() => !!props.editData);
const dialogTitle = computed(() =>
  isEdit.value ? t('views.banWhitelist.editMute') : t('views.banWhitelist.addMute'),
);
const confirmText = computed(() => (isEdit.value ? t('common.update') : t('common.save')));
const isSubmitting = computed(() => addOrUpdateMuteMutation.isLoading.value);

const form = reactive<FormModel>({
  playerId: '',
  playerName: '',
  mutedUntil: null,
  reason: '',
});

const MuteSchema = v.object({
  playerId: v.pipe(v.string(), v.minLength(1)),
  playerName: v.pipe(v.string(), v.minLength(1)),
  mutedUntil: v.nullable(v.date()),
  reason: v.optional(v.string()),
});

const rules: FormRules = generateElementRules(MuteSchema);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'playerId',
    label: t('views.banWhitelist.playerId'),
    el: 'el-input',
    tooltip: t('views.banWhitelist.tooltips.playerId'),
    disabled: () => isEdit.value,
  },
  {
    prop: 'playerName',
    label: t('views.banWhitelist.playerName'),
    el: 'el-input',
  },
  {
    prop: 'mutedUntil',
    label: t('views.banWhitelist.mutedUntil'),
    el: 'el-date-picker',
    props: {
      type: 'datetime',
      format: 'YYYY-MM-DD HH:mm:ss',
      class: 'w-full',
    },
    tooltip: t('views.banWhitelist.tooltips.mutedUntil'),
  },
  {
    prop: 'reason',
    label: t('views.banWhitelist.muteReason'),
    el: 'el-input',
    props: {
      type: 'textarea',
      rows: 3,
    },
  },
]);

function syncFormData() {
  if (props.editData) {
    form.playerId = props.editData.playerId;
    form.playerName = props.editData.playerName;
    form.mutedUntil = props.editData.mutedUntil ? dayjs(props.editData.mutedUntil).toDate() : null;
    form.reason = props.editData.reason ?? '';
  }
  else {
    form.playerId = '';
    form.playerName = '';
    form.mutedUntil = null;
    form.reason = '';
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

  const valid = await formRef.value.validate()?.catch(() => false);
  if (!valid) {
    return false;
  }

  try {
    const payload: MuteEntryUpsertDto = {
      playerId: form.playerId,
      playerName: form.playerName,
      mutedUntil: form.mutedUntil ? dayjs(form.mutedUntil).toISOString() : null,
      reason: form.reason || null,
    };
    await addOrUpdateMuteMutation.mutateAsync({ body: payload });

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
}

defineExpose({ show });
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
