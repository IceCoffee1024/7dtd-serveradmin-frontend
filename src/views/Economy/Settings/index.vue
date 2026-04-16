<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import { getSettings, resetSettings, updateSettings } from '~/api/economy';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'EconomySettingsPage' });

interface FormModel {
  isEnabled: boolean;
  currencyName: string;
  currencySymbol: string;
  defaultBalance: number;
  allowTransfer: boolean;
  minTransferAmount: number;
  transferTaxRate: number;
  dailyRewardAmount: number;
  leaderboardSize: number;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const { t } = useI18n();
const { toast } = usePopup();

const formRef = useTemplateRef<FormExpose>('formRef');
const isLoading = ref(false);
const isSubmitting = ref(false);

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    currencyName: 'Coin',
    currencySymbol: 'C',
    defaultBalance: 0,
    allowTransfer: true,
    minTransferAmount: 1,
    transferTaxRate: 0,
    dailyRewardAmount: 0,
    leaderboardSize: 10,
  };
}

const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  isEnabled: v.boolean(),
  currencyName: v.pipe(v.string(), v.minLength(1)),
  currencySymbol: v.pipe(v.string(), v.minLength(1)),
  defaultBalance: v.pipe(v.number(), v.minValue(0)),
  allowTransfer: v.boolean(),
  minTransferAmount: v.pipe(v.number(), v.minValue(1)),
  transferTaxRate: v.pipe(v.number(), v.minValue(0)),
  dailyRewardAmount: v.pipe(v.number(), v.minValue(0)),
  leaderboardSize: v.pipe(v.number(), v.minValue(1)),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.economy.settings.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'allowTransfer',
    label: t('views.economy.settings.fields.allowTransfer'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'currencyName',
    label: t('views.economy.settings.fields.currencyName'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'currencySymbol',
    label: t('views.economy.settings.fields.currencySymbol'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'defaultBalance',
    label: t('views.economy.settings.fields.defaultBalance'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'minTransferAmount',
    label: t('views.economy.settings.fields.minTransferAmount'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'transferTaxRate',
    label: t('views.economy.settings.fields.transferTaxRate'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'dailyRewardAmount',
    label: t('views.economy.settings.fields.dailyRewardAmount'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'leaderboardSize',
    label: t('views.economy.settings.fields.leaderboardSize'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
]);

function mapSettings(data: API.Economy.Settings | null | undefined): FormModel {
  const source = data ?? buildDefaults();
  return {
    isEnabled: source.isEnabled,
    currencyName: source.currencyName || 'Coin',
    currencySymbol: source.currencySymbol || 'C',
    defaultBalance: source.defaultBalance,
    allowTransfer: source.allowTransfer,
    minTransferAmount: source.minTransferAmount,
    transferTaxRate: source.transferTaxRate,
    dailyRewardAmount: source.dailyRewardAmount,
    leaderboardSize: source.leaderboardSize,
  };
}

function applyFormValues(values: FormModel): void {
  form.isEnabled = values.isEnabled;
  form.currencyName = values.currencyName;
  form.currencySymbol = values.currencySymbol;
  form.defaultBalance = values.defaultBalance;
  form.allowTransfer = values.allowTransfer;
  form.minTransferAmount = values.minTransferAmount;
  form.transferTaxRate = values.transferTaxRate;
  form.dailyRewardAmount = values.dailyRewardAmount;
  form.leaderboardSize = values.leaderboardSize;
}

async function loadSettings() {
  isLoading.value = true;
  try {
    const data = await getSettings();
    initialValues.value = mapSettings(data);
    applyFormValues(initialValues.value);
    await nextTick();
    formRef.value?.clearValidate();
  }
  catch (error) {
    console.error(error);
    initialValues.value = buildDefaults();
    applyFormValues(initialValues.value);
  }
  finally {
    isLoading.value = false;
  }
}

async function onReset() {
  isSubmitting.value = true;
  try {
    const data = await resetSettings();
    initialValues.value = mapSettings(data);
    applyFormValues(initialValues.value);
    await nextTick();
    formRef.value?.clearValidate();
    toast({
      type: 'success',
      title: t('views.economy.settings.actions.reset'),
      text: t('views.economy.settings.messages.resetSuccess'),
    });
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

function toPayload(values: FormModel): API.Economy.Settings {
  return {
    isEnabled: values.isEnabled,
    currencyName: values.currencyName,
    currencySymbol: values.currencySymbol,
    defaultBalance: Number(values.defaultBalance ?? 0),
    allowTransfer: values.allowTransfer,
    minTransferAmount: Number(values.minTransferAmount ?? 1),
    transferTaxRate: Number(values.transferTaxRate ?? 0),
    dailyRewardAmount: Number(values.dailyRewardAmount ?? 0),
    leaderboardSize: Number(values.leaderboardSize ?? 10),
  };
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
    await updateSettings(toPayload(form));
    toast({
      type: 'success',
      title: t('views.economy.settings.actions.save'),
      text: t('views.economy.settings.messages.saveSuccess'),
    });
    await loadSettings();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  loadSettings();
});
</script>

<template>
  <el-card shadow="never">
    <div v-if="isLoading" class="flex flex-col gap-4">
      <el-skeleton v-for="index in 4" :key="index" animated>
        <template #template>
          <el-skeleton-item variant="text" class="h-8" />
        </template>
      </el-skeleton>
    </div>
    <template v-else>
      <MyForm
        id="economySettingsForm"
        ref="formRef"
        v-model="form"
        :fields="fields"
        :rules="rules"
        label-position="top"
        label-width="auto"
        :gutter="16"
        @submit.prevent="onSubmit"
      />

      <div class="mt-4 flex gap-2 justify-end">
        <el-button :disabled="isSubmitting" @click="onReset">
          <el-icon><icon-mdi-refresh /></el-icon>
          {{ t('views.economy.settings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.economy.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </el-card>
</template>