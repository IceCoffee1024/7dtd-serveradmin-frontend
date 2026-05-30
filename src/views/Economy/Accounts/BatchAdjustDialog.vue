<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type { EconomyBatchAdjustRequestDto } from '~/generated/api/types.gen';
import { useMutation } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import { economyBatchAdjustMutation } from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateEconomyAndTransactionsQueries } from '~/queries/economy';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'EconomyBatchAdjustDialog' });

const emit = defineEmits<{ saved: [] }>();

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

interface FormModel {
  scope: 'AllOnline' | 'AllAccounts';
  amount: number;
  reason: string;
}

const { t } = useI18n();
const { toast } = usePopup();

const dialogRef = useTemplateRef('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');
const batchAdjustMutation = useMutation({
  ...economyBatchAdjustMutation(),
  async onSettled() {
    await invalidateEconomyAndTransactionsQueries();
  },
});
const isSubmitting = computed(() => batchAdjustMutation.isLoading.value);
const form = reactive<FormModel>({ scope: 'AllOnline', amount: 0, reason: '' });

const schema = v.object({
  scope: v.picklist(['AllOnline', 'AllAccounts']),
  amount: v.pipe(v.number(), v.notValue(0)),
  reason: v.optional(v.string()),
});

const rules: FormRules = generateElementRules(schema);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'scope',
    label: t('views.economy.accounts.batchAdjustDialog.fields.scope'),
    el: 'el-select',
    props: { class: 'w-full' },
    span: { xs: 24 },
    options: [
      { label: t('views.economy.accounts.batchAdjustDialog.scopeOptions.allOnline'), value: 'AllOnline' },
      { label: t('views.economy.accounts.batchAdjustDialog.scopeOptions.allAccounts'), value: 'AllAccounts' },
    ],
  },
  {
    prop: 'amount',
    label: t('views.economy.accounts.batchAdjustDialog.fields.amount'),
    el: 'el-input-number',
    props: { precision: 0, class: 'w-full' },
    span: { xs: 24 },
  },
  {
    prop: 'reason',
    label: t('views.economy.accounts.batchAdjustDialog.fields.reason'),
    el: 'el-input',
    props: { type: 'textarea', rows: 3 },
    span: { xs: 24 },
  },
]);

function show() {
  form.scope = 'AllOnline';
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
    const payload: EconomyBatchAdjustRequestDto = {
      scope: form.scope,
      amount: Number(form.amount),
      reason: form.reason.trim() || null,
    };
    const result = await batchAdjustMutation.mutateAsync({ body: payload });

    const failedCount = result.failed?.length ?? 0;
    const successMsg = t('views.economy.accounts.batchAdjustDialog.messages.success', { succeeded: result.succeeded ?? 0 });
    const failMsg = failedCount > 0 ? t('views.economy.accounts.batchAdjustDialog.messages.partialFail', { failed: failedCount }) : '';

    toast({
      type: failedCount > 0 ? 'warning' : 'success',
      text: successMsg + failMsg,
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
    :title="t('views.economy.accounts.batchAdjustDialog.title')"
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
