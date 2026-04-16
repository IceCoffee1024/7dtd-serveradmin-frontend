<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { adjustBalance } from '~/api/economy';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'EconomyAdjustBalanceDialog' });

const props = defineProps<Props>();

const emit = defineEmits<{ saved: [] }>();

interface Props {
  playerId: string;
  playerName: string;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

interface FormModel {
  amount: number;
  reason: string;
}

const { t } = useI18n();
const { toast } = usePopup();

const dialogRef = useTemplateRef('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');
const isSubmitting = ref(false);
const form = reactive<FormModel>({ amount: 0, reason: '' });

const schema = v.object({
  amount: v.pipe(v.number(), v.notValue(0)),
  reason: v.optional(v.string()),
});

const rules: FormRules = generateElementRules(schema);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'amount',
    label: t('views.economy.accounts.adjustDialog.fields.amount'),
    el: 'el-input-number',
    props: { precision: 0, class: 'w-full' },
    span: { xs: 24 },
  },
  {
    prop: 'reason',
    label: t('views.economy.accounts.adjustDialog.fields.reason'),
    el: 'el-input',
    props: { type: 'textarea', rows: 3 },
    span: { xs: 24 },
  },
]);

function show() {
  form.amount = 0;
  form.reason = '';
  dialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

async function onSubmit() {
  if (!formRef.value) {
    return;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  isSubmitting.value = true;
  try {
    await adjustBalance(props.playerId, {
      amount: Number(form.amount),
      reason: form.reason.trim() || null,
    });
    toast({
      type: 'success',
      text: t('views.economy.accounts.adjustDialog.messages.saveSuccess'),
    });
    dialogRef.value?.close();
    emit('saved');
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <MyDialog
    ref="dialogRef"
    :title="t('views.economy.accounts.adjustDialog.title', { playerName })"
    :confirm-loading="isSubmitting"
    @confirm="onSubmit"
  >
    <MyForm
      ref="formRef"
      v-model="form"
      :fields="fields"
      :rules="rules"
      label-position="top"
      label-width="auto"
      :gutter="16"
      @submit.prevent="onSubmit"
    />
  </MyDialog>
</template>
