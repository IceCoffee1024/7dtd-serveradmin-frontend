<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type { EconomyAdjustBalanceRequestDto } from '~/generated/api/types.gen';
import { useMutation } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import { economyAdjustBalanceMutation } from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateEconomyAndTransactionsQueries } from '~/queries/economy';
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
const adjustBalanceMutation = useMutation({
  ...economyAdjustBalanceMutation(),
  async onSettled() {
    await invalidateEconomyAndTransactionsQueries();
  },
});
const isSubmitting = computed(() => adjustBalanceMutation.isLoading.value);
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
    return false;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return false;
  }

  try {
    const payload: EconomyAdjustBalanceRequestDto = {
      amount: Number(form.amount),
      reason: form.reason.trim() || null,
    };
    await adjustBalanceMutation.mutateAsync({ path: { playerId: props.playerId }, body: payload });
    toast({
      type: 'success',
      text: t('views.economy.accounts.adjustDialog.messages.saveSuccess'),
    });
    dialogRef.value?.close();
    emit('saved');
  }
  catch {
    return false;
  }
}

defineExpose({ show });
</script>

<template>
  <MyDialog
    ref="dialogRef"
    :title="t('views.economy.accounts.adjustDialog.title', { playerName })"
    :loading="isSubmitting"
    :on-confirm="onSubmit"
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
