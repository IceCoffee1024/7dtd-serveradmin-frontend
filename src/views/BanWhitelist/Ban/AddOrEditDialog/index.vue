<script setup lang="ts">
import type { MyFormField } from '~/composables/useMyForm';
import type { BanEntryDto } from '~/generated/api/types.gen';
import { useMutation } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import {
  gameServerCreateBanMutation,
  gameServerRemoveBansMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { generateElementRules, showCommandResult } from '~/utils';

interface FormModel {
  playerId: string;
  displayName: string;
  bannedUntil: Date | null;
  reason: string;
}

interface Props {
  editData?: BanEntryDto | null;
}

const props = withDefaults(defineProps<Props>(), {
  editData: null,
});

const emit = defineEmits(['saved']);
const dialogRef = useTemplateRef('dialogRef');
const formRef = useTemplateRef('formRef');
const { t } = useI18n();
const createBanMutation = useMutation({
  ...gameServerCreateBanMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('GameServer');
  },
});
const removeBansMutation = useMutation({
  ...gameServerRemoveBansMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('GameServer');
  },
});

const isEdit = computed(() => !!props.editData);
const dialogTitle = computed(() => (isEdit.value ? t('views.banWhitelist.editBan') : t('views.banWhitelist.addBan')));
const confirmText = computed(() => (isEdit.value ? t('common.update') : t('common.save')));
const isSubmitting = computed(() => createBanMutation.isLoading.value || removeBansMutation.isLoading.value);

const form = reactive<FormModel>({
  playerId: '',
  displayName: '',
  bannedUntil: null,
  reason: '',
});

const BanSchema = v.object({
  playerId: v.pipe(v.string(), v.minLength(1)),
  displayName: v.pipe(v.string(), v.minLength(1)),
  bannedUntil: v.date(),
  reason: v.optional(v.string()),
});

const rules = generateElementRules(BanSchema);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'playerId',
    label: t('views.banWhitelist.playerId'),
    el: 'el-input',
    tooltip: t('views.banWhitelist.tooltips.playerId'),
    disabled: () => isEdit.value,
  },
  {
    prop: 'displayName',
    label: t('views.banWhitelist.displayName'),
    el: 'el-input',
  },
  {
    prop: 'bannedUntil',
    label: t('views.banWhitelist.bannedUntil'),
    el: 'el-date-picker',
    props: {
      type: 'datetime',
      format: 'YYYY-MM-DD HH:mm:ss',
      class: 'w-full',
    },
    tooltip: t('views.banWhitelist.tooltips.bannedUntil'),
  },
  {
    prop: 'reason',
    label: t('views.banWhitelist.reason'),
    el: 'el-input',
    props: {
      type: 'textarea',
      rows: 3,
    },
    tooltip: t('views.banWhitelist.tooltips.reason'),
  },
]);

function syncFormData() {
  if (props.editData) {
    form.playerId = props.editData.playerId || '';
    form.displayName = props.editData.displayName || '';
    form.bannedUntil = props.editData.bannedUntil ? dayjs(props.editData.bannedUntil).toDate() : null;
    form.reason = props.editData.reason || '';
  }
  else {
    form.playerId = '';
    form.displayName = '';
    form.bannedUntil = null;
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
  if (!valid || !form.bannedUntil) {
    return false;
  }

  try {
    if (isEdit.value) {
      const oldPlayerId = props.editData?.playerId;
      if (oldPlayerId) {
        const unbanResult = await removeBansMutation.mutateAsync({ body: [oldPlayerId] });
        if (!showCommandResult(unbanResult ?? undefined, t('common.update')))
          return false;
      }
    }

    const result = await createBanMutation.mutateAsync({
      body: {
        playerId: form.playerId,
        bannedUntil: dayjs(form.bannedUntil).toISOString(),
        displayName: form.displayName,
        reason: form.reason || null,
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
