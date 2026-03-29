<script setup lang="ts">
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { addPlayerToWhitelist, removePlayerFromWhitelist } from '~/api/gameServer';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

interface FormModel {
  playerId: string;
  displayName: string;
}

interface Props {
  editData?: Record<string, any> | null;
}

const props = withDefaults(defineProps<Props>(), {
  editData: null,
});

const emit = defineEmits(['saved']);
const dialogRef = useTemplateRef('dialogRef');
const formRef = useTemplateRef('formRef');
const { t } = useI18n();

const isEdit = computed(() => !!props.editData);
const dialogTitle = computed(() => (isEdit.value ? t('views.banWhitelist.editWhitelist') : t('views.banWhitelist.addWhitelist')));
const confirmText = computed(() => (isEdit.value ? t('common.update') : t('common.save')));

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
    el: 'input',
    rules: rules.playerId,
    disabled: () => isEdit.value,
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
    return;
  }

  const valid = await formRef.value.validate()?.catch(() => false);
  if (!valid) {
    return;
  }

  try {
    if (isEdit.value) {
      const oldPlayerId = props.editData?.playerId;
      if (oldPlayerId) {
        await removePlayerFromWhitelist([oldPlayerId]);
      }
    }

    await addPlayerToWhitelist(form.playerId, form.displayName);
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
