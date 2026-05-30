<script setup lang="ts">
import type { MyFormField } from '~/composables/useMyForm';
import type { WhitelistEntryDto } from '~/generated/api/types.gen';
import { useMutation } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import {
  gameServerCreateWhitelistEntryMutation,
  gameServerRemoveWhitelistEntriesMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { generateElementRules, showCommandResult } from '~/utils';

interface FormModel {
  playerId: string;
  displayName: string;
}

interface Props {
  editData?: WhitelistEntryDto | null;
}

const props = withDefaults(defineProps<Props>(), {
  editData: null,
});

const emit = defineEmits(['saved']);
const dialogRef = useTemplateRef('dialogRef');
const formRef = useTemplateRef('formRef');
const { t } = useI18n();
const createWhitelistEntryMutation = useMutation({
  ...gameServerCreateWhitelistEntryMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('GameServer');
  },
});
const removeWhitelistEntriesMutation = useMutation({
  ...gameServerRemoveWhitelistEntriesMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('GameServer');
  },
});

const isEdit = computed(() => !!props.editData);
const dialogTitle = computed(() => (isEdit.value ? t('views.banWhitelist.editWhitelist') : t('views.banWhitelist.addWhitelist')));
const confirmText = computed(() => (isEdit.value ? t('common.update') : t('common.save')));
const isSubmitting = computed(() => createWhitelistEntryMutation.isLoading.value || removeWhitelistEntriesMutation.isLoading.value);

const form = reactive<FormModel>({
  playerId: '',
  displayName: '',
});

const WhitelistSchema = v.object({
  playerId: v.pipe(v.string(), v.minLength(1)),
  displayName: v.pipe(v.string(), v.minLength(1)),
});

const rules = generateElementRules(WhitelistSchema);

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
    tooltip: t('views.banWhitelist.tooltips.displayName'),
  },
]);

function syncFormData() {
  if (props.editData) {
    form.playerId = props.editData.playerId || '';
    form.displayName = props.editData.displayName || '';
  }
  else {
    form.playerId = '';
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

  const valid = await formRef.value.validate()?.catch(() => false);
  if (!valid) {
    return false;
  }

  try {
    if (isEdit.value) {
      const oldPlayerId = props.editData?.playerId;
      if (oldPlayerId) {
        const removeResult = await removeWhitelistEntriesMutation.mutateAsync({ body: [oldPlayerId] });
        if (!showCommandResult(removeResult ?? undefined, t('common.update')))
          return false;
      }
    }

    const result = await createWhitelistEntryMutation.mutateAsync({
      body: {
        playerId: form.playerId,
        displayName: form.displayName,
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
      label-width="130px"
      :rules="rules"
    />
  </MyDialog>
</template>
