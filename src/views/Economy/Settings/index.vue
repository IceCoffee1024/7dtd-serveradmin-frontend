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
  zombieKillRewardEnabled: boolean;
  zombieKillRewardAmount: number;
  dailyStreakEnabled: boolean;
  dailyStreakBonusPercent: number;
  dailyStreakMaxDays: number;
  shopEnabled: boolean;
  balCommandName: string;
  balCommandAliases: string;
  payCommandName: string;
  dailyCommandName: string;
  moneyTopCommandName: string;
  moneyTopCommandAliases: string;
  shopCommandName: string;
  buyCommandName: string;
  redeemCommandName: string;
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
    zombieKillRewardEnabled: false,
    zombieKillRewardAmount: 0,
    dailyStreakEnabled: false,
    dailyStreakBonusPercent: 10,
    dailyStreakMaxDays: 7,
    shopEnabled: false,
    balCommandName: 'bal',
    balCommandAliases: 'balance, money',
    payCommandName: 'pay',
    dailyCommandName: 'daily',
    moneyTopCommandName: 'moneytop',
    moneyTopCommandAliases: 'baltop, ecotop',
    shopCommandName: 'shop',
    buyCommandName: 'buy',
    redeemCommandName: 'redeem',
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
  zombieKillRewardEnabled: v.boolean(),
  zombieKillRewardAmount: v.pipe(v.number(), v.minValue(0)),
  dailyStreakEnabled: v.boolean(),
  dailyStreakBonusPercent: v.pipe(v.number(), v.minValue(0)),
  dailyStreakMaxDays: v.pipe(v.number(), v.minValue(1)),
  shopEnabled: v.boolean(),
  balCommandName: v.pipe(v.string(), v.minLength(1)),
  balCommandAliases: v.string(),
  payCommandName: v.pipe(v.string(), v.minLength(1)),
  dailyCommandName: v.pipe(v.string(), v.minLength(1)),
  moneyTopCommandName: v.pipe(v.string(), v.minLength(1)),
  moneyTopCommandAliases: v.string(),
  shopCommandName: v.pipe(v.string(), v.minLength(1)),
  buyCommandName: v.pipe(v.string(), v.minLength(1)),
  redeemCommandName: v.pipe(v.string(), v.minLength(1)),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const policyFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.economy.settings.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
]);

const settingsFields = computed<MyFormField<FormModel>[]>(() => [
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
  {
    prop: 'zombieKillRewardEnabled',
    label: t('views.economy.settings.fields.zombieKillRewardEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'zombieKillRewardAmount',
    label: t('views.economy.settings.fields.zombieKillRewardAmount'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'dailyStreakEnabled',
    label: t('views.economy.settings.fields.dailyStreakEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'dailyStreakBonusPercent',
    label: t('views.economy.settings.fields.dailyStreakBonusPercent'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'dailyStreakMaxDays',
    label: t('views.economy.settings.fields.dailyStreakMaxDays'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'shopEnabled',
    label: t('views.economy.settings.fields.shopEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
]);

const aliasesHelp = computed(() => t('views.economy.settings.commands.aliasesHelp'));

const commandFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'balCommandName',
    label: t('views.economy.settings.commands.fields.balCommandName'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'balCommandAliases',
    label: t('views.economy.settings.commands.fields.balCommandAliases'),
    el: 'el-input',
    tooltip: aliasesHelp.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'payCommandName',
    label: t('views.economy.settings.commands.fields.payCommandName'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'dailyCommandName',
    label: t('views.economy.settings.commands.fields.dailyCommandName'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'moneyTopCommandName',
    label: t('views.economy.settings.commands.fields.moneyTopCommandName'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'moneyTopCommandAliases',
    label: t('views.economy.settings.commands.fields.moneyTopCommandAliases'),
    el: 'el-input',
    tooltip: aliasesHelp.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'shopCommandName',
    label: t('views.economy.settings.commands.fields.shopCommandName'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'buyCommandName',
    label: t('views.economy.settings.commands.fields.buyCommandName'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'redeemCommandName',
    label: t('views.economy.settings.commands.fields.redeemCommandName'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
]);

const previewItems = computed(() => {
  const name = form.currencyName || 'Coin';
  const symbol = form.currencySymbol || 'C';
  const items: Array<{ key: string; label: string; value: string; colorClass: string }> = [
    {
      key: 'balance',
      label: t('views.economy.settings.preview.balance'),
      value: `${Number(form.defaultBalance).toLocaleString()} ${name} (${symbol})`,
      colorClass: 'text-gray-100',
    },
    {
      key: 'daily',
      label: t('views.economy.settings.preview.dailyReward'),
      value: `+${form.dailyRewardAmount} ${symbol}`,
      colorClass: 'text-green-400',
    },
  ];
  if (form.zombieKillRewardEnabled) {
    items.push({
      key: 'kill',
      label: t('views.economy.settings.preview.killReward'),
      value: `+${form.zombieKillRewardAmount} ${symbol}`,
      colorClass: 'text-green-400',
    });
  }
  if (form.transferTaxRate > 0) {
    items.push({
      key: 'tax',
      label: t('views.economy.settings.preview.transferTax'),
      value: `${form.transferTaxRate}%`,
      colorClass: 'text-red-400',
    });
  }
  if (form.dailyStreakEnabled) {
    items.push({
      key: 'streak',
      label: t('views.economy.settings.preview.streakBonus'),
      value: `+${form.dailyStreakBonusPercent}%`,
      colorClass: 'text-blue-400',
    });
  }
  return items;
});

function mapSettings(data: API.Economy.Settings | null | undefined): FormModel {
  const source = data ?? buildDefaults();
  const parseAliases = (arr: string[] | undefined) => (arr ?? []).join(', ');
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
    zombieKillRewardEnabled: source.zombieKillRewardEnabled ?? false,
    zombieKillRewardAmount: source.zombieKillRewardAmount ?? 0,
    dailyStreakEnabled: source.dailyStreakEnabled ?? false,
    dailyStreakBonusPercent: source.dailyStreakBonusPercent ?? 10,
    dailyStreakMaxDays: source.dailyStreakMaxDays ?? 7,
    shopEnabled: source.shopEnabled ?? false,
    balCommandName: source.balCommandName || 'bal',
    balCommandAliases: parseAliases(source.balCommandAliases),
    payCommandName: source.payCommandName || 'pay',
    dailyCommandName: source.dailyCommandName || 'daily',
    moneyTopCommandName: source.moneyTopCommandName || 'moneytop',
    moneyTopCommandAliases: parseAliases(source.moneyTopCommandAliases),
    shopCommandName: source.shopCommandName || 'shop',
    buyCommandName: source.buyCommandName || 'buy',
    redeemCommandName: source.redeemCommandName || 'redeem',
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
  form.zombieKillRewardEnabled = values.zombieKillRewardEnabled;
  form.zombieKillRewardAmount = values.zombieKillRewardAmount;
  form.dailyStreakEnabled = values.dailyStreakEnabled;
  form.dailyStreakBonusPercent = values.dailyStreakBonusPercent;
  form.dailyStreakMaxDays = values.dailyStreakMaxDays;
  form.shopEnabled = values.shopEnabled;
  form.balCommandName = values.balCommandName;
  form.balCommandAliases = values.balCommandAliases;
  form.payCommandName = values.payCommandName;
  form.dailyCommandName = values.dailyCommandName;
  form.moneyTopCommandName = values.moneyTopCommandName;
  form.moneyTopCommandAliases = values.moneyTopCommandAliases;
  form.shopCommandName = values.shopCommandName;
  form.buyCommandName = values.buyCommandName;
  form.redeemCommandName = values.redeemCommandName;
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
  const parseAliases = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
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
    zombieKillRewardEnabled: values.zombieKillRewardEnabled,
    zombieKillRewardAmount: Number(values.zombieKillRewardAmount ?? 0),
    dailyStreakEnabled: values.dailyStreakEnabled,
    dailyStreakBonusPercent: Number(values.dailyStreakBonusPercent ?? 10),
    dailyStreakMaxDays: Number(values.dailyStreakMaxDays ?? 7),
    shopEnabled: values.shopEnabled,
    balCommandName: values.balCommandName,
    balCommandAliases: parseAliases(values.balCommandAliases),
    payCommandName: values.payCommandName,
    dailyCommandName: values.dailyCommandName,
    moneyTopCommandName: values.moneyTopCommandName,
    moneyTopCommandAliases: parseAliases(values.moneyTopCommandAliases),
    shopCommandName: values.shopCommandName,
    buyCommandName: values.buyCommandName,
    redeemCommandName: values.redeemCommandName,
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
  <div>
    <div v-if="isLoading" class="flex flex-col gap-4">
      <el-skeleton v-for="index in 4" :key="index" animated>
        <template #template>
          <el-skeleton-item variant="text" class="h-8" />
        </template>
      </el-skeleton>
    </div>
    <template v-else>
      <MyForm
        v-model="form"
        :fields="policyFields"
        :rules="rules"
        label-position="top"
        label-width="auto"
        :gutter="16"
      />

      <div :class="{ 'opacity-40 pointer-events-none select-none': !form.isEnabled }">
        <MyForm
          id="economySettingsForm"
          ref="formRef"
          v-model="form"
          :fields="settingsFields"
          :rules="rules"
          label-position="top"
          label-width="auto"
          :gutter="16"
          @submit.prevent="onSubmit"
        />
      </div>

      <div :class="{ 'opacity-40 pointer-events-none select-none': !form.isEnabled }">
        <h3 class="text-sm text-gray-900 font-semibold mb-2 mt-4 dark:text-gray-100">
          {{ t('views.economy.settings.commands.sectionTitle') }}
        </h3>
        <MyForm
          v-model="form"
          :fields="commandFields"
          :rules="rules"
          label-position="top"
          label-width="auto"
          :gutter="16"
        />
      </div>

      <div :class="{ 'opacity-40 pointer-events-none select-none': !form.isEnabled }" class="pt-4 border-t border-gray-200 flex flex-col gap-2 dark:border-gray-700">
        <h3 class="text-sm text-gray-900 font-semibold dark:text-gray-100">
          {{ t('views.economy.settings.preview.title') }}
        </h3>
        <div class="text-sm leading-6 font-mono px-4 py-3 rounded-3 bg-gray-950 flex flex-col gap-1">
          <div v-for="item in previewItems" :key="item.key" class="flex gap-6 items-center">
            <span :class="item.colorClass" class="shrink-0 w-40">{{ item.value }}</span>
            <span class="text-xs text-gray-500">{{ item.label }}</span>
          </div>
        </div>
      </div>

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
  </div>
</template>
