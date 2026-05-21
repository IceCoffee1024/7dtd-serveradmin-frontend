<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { useI18n } from 'vue-i18n';
import * as api from '~/api/teleport';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'TeleportSettingsPage' });

interface FormModel {
  isEnabled: boolean
  // Home
  homeEnabled: boolean
  homeCooldownSeconds: number
  homeSetCurrencyRequired: number
  homeTeleCurrencyRequired: number
  homeMaxHomes: number
  homeListCommandName: string
  homeSetCommandName: string
  homeDeleteCommandName: string
  homeTeleCommandName: string
  homeNoHomeTip: string
  homeSetLimitTip: string
  homeSetSuccessTip: string
  homeOverwriteTip: string
  homeDeleteSuccessTip: string
  homeHomeNotFoundTip: string
  homeCoolingTip: string
  homeTeleSuccessTip: string
  homeSetCurrencyNotEnoughTip: string
  homeTeleCurrencyNotEnoughTip: string
  // City
  cityEnabled: boolean
  cityCooldownSeconds: number
  cityListCommandName: string
  cityTeleCommandName: string
  cityNoCitiesTip: string
  cityCityNotFoundTip: string
  cityCoolingTip: string
  cityTeleSuccessTip: string
  cityCurrencyNotEnoughTip: string
  // Friend
  friendEnabled: boolean
  friendCooldownSeconds: number
  friendCurrencyRequired: number
  friendRequestExpirySeconds: number
  friendFriendBypass: boolean
  friendRequestCommandName: string
  friendAcceptCommandName: string
  friendRejectCommandName: string
  friendTargetNotFoundTip: string
  friendRequestSentTip: string
  friendRequestReceivedTip: string
  friendAcceptedTip: string
  friendRejectedTip: string
  friendTargetRejectedTip: string
  friendNoRequestTip: string
  friendCoolingTip: string
  friendTeleSuccessTip: string
  friendCurrencyNotEnoughTip: string
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>
  clearValidate: (props?: string | string[]) => void
}

const { t } = useI18n();
const { toast } = usePopup();

const formRef = useTemplateRef<FormExpose>('formRef');
const isLoading = ref(false);
const isSubmitting = ref(false);

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    homeEnabled: false,
    homeCooldownSeconds: 60,
    homeSetCurrencyRequired: 0,
    homeTeleCurrencyRequired: 0,
    homeMaxHomes: 3,
    homeListCommandName: '',
    homeSetCommandName: '',
    homeDeleteCommandName: '',
    homeTeleCommandName: '',
    homeNoHomeTip: '',
    homeSetLimitTip: '',
    homeSetSuccessTip: '',
    homeOverwriteTip: '',
    homeDeleteSuccessTip: '',
    homeHomeNotFoundTip: '',
    homeCoolingTip: '',
    homeTeleSuccessTip: '',
    homeSetCurrencyNotEnoughTip: '',
    homeTeleCurrencyNotEnoughTip: '',
    cityEnabled: false,
    cityCooldownSeconds: 60,
    cityListCommandName: '',
    cityTeleCommandName: '',
    cityNoCitiesTip: '',
    cityCityNotFoundTip: '',
    cityCoolingTip: '',
    cityTeleSuccessTip: '',
    cityCurrencyNotEnoughTip: '',
    friendEnabled: false,
    friendCooldownSeconds: 60,
    friendCurrencyRequired: 0,
    friendRequestExpirySeconds: 60,
    friendFriendBypass: false,
    friendRequestCommandName: '',
    friendAcceptCommandName: '',
    friendRejectCommandName: '',
    friendTargetNotFoundTip: '',
    friendRequestSentTip: '',
    friendRequestReceivedTip: '',
    friendAcceptedTip: '',
    friendRejectedTip: '',
    friendTargetRejectedTip: '',
    friendNoRequestTip: '',
    friendCoolingTip: '',
    friendTeleSuccessTip: '',
    friendCurrencyNotEnoughTip: '',
  };
}

const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  isEnabled: v.boolean(),
  homeEnabled: v.boolean(),
  homeCooldownSeconds: v.pipe(v.number(), v.minValue(0)),
  homeSetCurrencyRequired: v.pipe(v.number(), v.minValue(0)),
  homeTeleCurrencyRequired: v.pipe(v.number(), v.minValue(0)),
  homeMaxHomes: v.pipe(v.number(), v.minValue(1)),
  homeListCommandName: v.optional(v.string()),
  homeSetCommandName: v.optional(v.string()),
  homeDeleteCommandName: v.optional(v.string()),
  homeTeleCommandName: v.optional(v.string()),
  homeNoHomeTip: v.optional(v.string()),
  homeSetLimitTip: v.optional(v.string()),
  homeSetSuccessTip: v.optional(v.string()),
  homeOverwriteTip: v.optional(v.string()),
  homeDeleteSuccessTip: v.optional(v.string()),
  homeHomeNotFoundTip: v.optional(v.string()),
  homeCoolingTip: v.optional(v.string()),
  homeTeleSuccessTip: v.optional(v.string()),
  homeSetCurrencyNotEnoughTip: v.optional(v.string()),
  homeTeleCurrencyNotEnoughTip: v.optional(v.string()),
  cityEnabled: v.boolean(),
  cityCooldownSeconds: v.pipe(v.number(), v.minValue(0)),
  cityListCommandName: v.optional(v.string()),
  cityTeleCommandName: v.optional(v.string()),
  cityNoCitiesTip: v.optional(v.string()),
  cityCityNotFoundTip: v.optional(v.string()),
  cityCoolingTip: v.optional(v.string()),
  cityTeleSuccessTip: v.optional(v.string()),
  cityCurrencyNotEnoughTip: v.optional(v.string()),
  friendEnabled: v.boolean(),
  friendCooldownSeconds: v.pipe(v.number(), v.minValue(0)),
  friendCurrencyRequired: v.pipe(v.number(), v.minValue(0)),
  friendRequestExpirySeconds: v.pipe(v.number(), v.minValue(1)),
  friendFriendBypass: v.boolean(),
  friendRequestCommandName: v.optional(v.string()),
  friendAcceptCommandName: v.optional(v.string()),
  friendRejectCommandName: v.optional(v.string()),
  friendTargetNotFoundTip: v.optional(v.string()),
  friendRequestSentTip: v.optional(v.string()),
  friendRequestReceivedTip: v.optional(v.string()),
  friendAcceptedTip: v.optional(v.string()),
  friendRejectedTip: v.optional(v.string()),
  friendTargetRejectedTip: v.optional(v.string()),
  friendNoRequestTip: v.optional(v.string()),
  friendCoolingTip: v.optional(v.string()),
  friendTeleSuccessTip: v.optional(v.string()),
  friendCurrencyNotEnoughTip: v.optional(v.string()),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

// ---- Master fields ----
const masterFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'isEnabled',
    label: t('views.teleport.settings.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
]);

// ---- Home fields ----
const homeBasicFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'homeEnabled',
    label: t('views.teleport.settings.fields.home.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'homeCooldownSeconds',
    label: t('views.teleport.settings.fields.home.cooldownSeconds'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'homeMaxHomes',
    label: t('views.teleport.settings.fields.home.maxHomes'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'homeSetCurrencyRequired',
    label: t('views.teleport.settings.fields.home.setCurrencyRequired'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'homeTeleCurrencyRequired',
    label: t('views.teleport.settings.fields.home.teleCurrencyRequired'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
]);

const homeCommandFields = computed<MyFormField<FormModel>[]>(() => [
  { prop: 'homeListCommandName', label: t('views.teleport.settings.fields.home.listCommandName'), el: 'el-input', span: { xs: 24, md: 12 } },
  { prop: 'homeSetCommandName', label: t('views.teleport.settings.fields.home.setCommandName'), el: 'el-input', span: { xs: 24, md: 12 } },
  { prop: 'homeDeleteCommandName', label: t('views.teleport.settings.fields.home.deleteCommandName'), el: 'el-input', span: { xs: 24, md: 12 } },
  { prop: 'homeTeleCommandName', label: t('views.teleport.settings.fields.home.teleCommandName'), el: 'el-input', span: { xs: 24, md: 12 } },
]);

const homeTipFields = computed<MyFormField<FormModel>[]>(() => [
  { prop: 'homeNoHomeTip', label: t('views.teleport.settings.fields.home.noHomeTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'homeSetLimitTip', label: t('views.teleport.settings.fields.home.setLimitTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'homeSetSuccessTip', label: t('views.teleport.settings.fields.home.setSuccessTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'homeOverwriteTip', label: t('views.teleport.settings.fields.home.overwriteTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'homeDeleteSuccessTip', label: t('views.teleport.settings.fields.home.deleteSuccessTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'homeHomeNotFoundTip', label: t('views.teleport.settings.fields.home.homeNotFoundTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'homeCoolingTip', label: t('views.teleport.settings.fields.home.coolingTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'homeTeleSuccessTip', label: t('views.teleport.settings.fields.home.teleSuccessTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'homeSetCurrencyNotEnoughTip', label: t('views.teleport.settings.fields.home.setCurrencyNotEnoughTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'homeTeleCurrencyNotEnoughTip', label: t('views.teleport.settings.fields.home.teleCurrencyNotEnoughTip'), el: 'el-input', span: { xs: 24 } },
]);

// ---- City fields ----
const cityBasicFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'cityEnabled',
    label: t('views.teleport.settings.fields.city.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'cityCooldownSeconds',
    label: t('views.teleport.settings.fields.city.cooldownSeconds'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
]);

const cityCommandFields = computed<MyFormField<FormModel>[]>(() => [
  { prop: 'cityListCommandName', label: t('views.teleport.settings.fields.city.listCommandName'), el: 'el-input', span: { xs: 24, md: 12 } },
  { prop: 'cityTeleCommandName', label: t('views.teleport.settings.fields.city.teleCommandName'), el: 'el-input', span: { xs: 24, md: 12 } },
]);

const cityTipFields = computed<MyFormField<FormModel>[]>(() => [
  { prop: 'cityNoCitiesTip', label: t('views.teleport.settings.fields.city.noCitiesTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'cityCityNotFoundTip', label: t('views.teleport.settings.fields.city.cityNotFoundTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'cityCoolingTip', label: t('views.teleport.settings.fields.city.coolingTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'cityTeleSuccessTip', label: t('views.teleport.settings.fields.city.teleSuccessTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'cityCurrencyNotEnoughTip', label: t('views.teleport.settings.fields.city.currencyNotEnoughTip'), el: 'el-input', span: { xs: 24 } },
]);

// ---- Friend fields ----
const friendBasicFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'friendEnabled',
    label: t('views.teleport.settings.fields.friend.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'friendCooldownSeconds',
    label: t('views.teleport.settings.fields.friend.cooldownSeconds'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'friendCurrencyRequired',
    label: t('views.teleport.settings.fields.friend.currencyRequired'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'friendRequestExpirySeconds',
    label: t('views.teleport.settings.fields.friend.requestExpirySeconds'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'friendFriendBypass',
    label: t('views.teleport.settings.fields.friend.friendBypass'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
]);

const friendCommandFields = computed<MyFormField<FormModel>[]>(() => [
  { prop: 'friendRequestCommandName', label: t('views.teleport.settings.fields.friend.requestCommandName'), el: 'el-input', span: { xs: 24, md: 12 } },
  { prop: 'friendAcceptCommandName', label: t('views.teleport.settings.fields.friend.acceptCommandName'), el: 'el-input', span: { xs: 24, md: 12 } },
  { prop: 'friendRejectCommandName', label: t('views.teleport.settings.fields.friend.rejectCommandName'), el: 'el-input', span: { xs: 24, md: 12 } },
]);

const friendTipFields = computed<MyFormField<FormModel>[]>(() => [
  { prop: 'friendTargetNotFoundTip', label: t('views.teleport.settings.fields.friend.targetNotFoundTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'friendRequestSentTip', label: t('views.teleport.settings.fields.friend.requestSentTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'friendRequestReceivedTip', label: t('views.teleport.settings.fields.friend.requestReceivedTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'friendAcceptedTip', label: t('views.teleport.settings.fields.friend.acceptedTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'friendRejectedTip', label: t('views.teleport.settings.fields.friend.rejectedTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'friendTargetRejectedTip', label: t('views.teleport.settings.fields.friend.targetRejectedTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'friendNoRequestTip', label: t('views.teleport.settings.fields.friend.noRequestTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'friendCoolingTip', label: t('views.teleport.settings.fields.friend.coolingTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'friendTeleSuccessTip', label: t('views.teleport.settings.fields.friend.teleSuccessTip'), el: 'el-input', span: { xs: 24 } },
  { prop: 'friendCurrencyNotEnoughTip', label: t('views.teleport.settings.fields.friend.currencyNotEnoughTip'), el: 'el-input', span: { xs: 24 } },
]);

// ---- Data mapping ----
function mapSettings(dto: API.Teleport.FeatureSettings | null | undefined): FormModel {
  const h = dto?.home;
  const c = dto?.city;
  const f = dto?.friend;
  return {
    isEnabled: dto?.isEnabled ?? false,
    homeEnabled: h?.isEnabled ?? false,
    homeCooldownSeconds: h?.cooldownSeconds ?? 60,
    homeSetCurrencyRequired: h?.setCurrencyRequired ?? 0,
    homeTeleCurrencyRequired: h?.teleCurrencyRequired ?? 0,
    homeMaxHomes: h?.maxHomes ?? 3,
    homeListCommandName: h?.listCommandName ?? '',
    homeSetCommandName: h?.setCommandName ?? '',
    homeDeleteCommandName: h?.deleteCommandName ?? '',
    homeTeleCommandName: h?.teleCommandName ?? '',
    homeNoHomeTip: h?.noHomeTip ?? '',
    homeSetLimitTip: h?.setLimitTip ?? '',
    homeSetSuccessTip: h?.setSuccessTip ?? '',
    homeOverwriteTip: h?.overwriteTip ?? '',
    homeDeleteSuccessTip: h?.deleteSuccessTip ?? '',
    homeHomeNotFoundTip: h?.homeNotFoundTip ?? '',
    homeCoolingTip: h?.coolingTip ?? '',
    homeTeleSuccessTip: h?.teleSuccessTip ?? '',
    homeSetCurrencyNotEnoughTip: h?.setCurrencyNotEnoughTip ?? '',
    homeTeleCurrencyNotEnoughTip: h?.teleCurrencyNotEnoughTip ?? '',
    cityEnabled: c?.isEnabled ?? false,
    cityCooldownSeconds: c?.cooldownSeconds ?? 60,
    cityListCommandName: c?.listCommandName ?? '',
    cityTeleCommandName: c?.teleCommandName ?? '',
    cityNoCitiesTip: c?.noCitiesTip ?? '',
    cityCityNotFoundTip: c?.cityNotFoundTip ?? '',
    cityCoolingTip: c?.coolingTip ?? '',
    cityTeleSuccessTip: c?.teleSuccessTip ?? '',
    cityCurrencyNotEnoughTip: c?.currencyNotEnoughTip ?? '',
    friendEnabled: f?.isEnabled ?? false,
    friendCooldownSeconds: f?.cooldownSeconds ?? 60,
    friendCurrencyRequired: f?.currencyRequired ?? 0,
    friendRequestExpirySeconds: f?.requestExpirySeconds ?? 60,
    friendFriendBypass: f?.friendBypass ?? false,
    friendRequestCommandName: f?.requestCommandName ?? '',
    friendAcceptCommandName: f?.acceptCommandName ?? '',
    friendRejectCommandName: f?.rejectCommandName ?? '',
    friendTargetNotFoundTip: f?.targetNotFoundTip ?? '',
    friendRequestSentTip: f?.requestSentTip ?? '',
    friendRequestReceivedTip: f?.requestReceivedTip ?? '',
    friendAcceptedTip: f?.acceptedTip ?? '',
    friendRejectedTip: f?.rejectedTip ?? '',
    friendTargetRejectedTip: f?.targetRejectedTip ?? '',
    friendNoRequestTip: f?.noRequestTip ?? '',
    friendCoolingTip: f?.coolingTip ?? '',
    friendTeleSuccessTip: f?.teleSuccessTip ?? '',
    friendCurrencyNotEnoughTip: f?.currencyNotEnoughTip ?? '',
  };
}

function buildPayload(): API.Teleport.FeatureSettings {
  const nullIfEmpty = (s: string) => s.trim() || null;
  return {
    isEnabled: form.isEnabled,
    home: {
      isEnabled: form.homeEnabled,
      cooldownSeconds: Number(form.homeCooldownSeconds),
      setCurrencyRequired: Number(form.homeSetCurrencyRequired),
      teleCurrencyRequired: Number(form.homeTeleCurrencyRequired),
      maxHomes: Number(form.homeMaxHomes),
      listCommandName: nullIfEmpty(form.homeListCommandName),
      setCommandName: nullIfEmpty(form.homeSetCommandName),
      deleteCommandName: nullIfEmpty(form.homeDeleteCommandName),
      teleCommandName: nullIfEmpty(form.homeTeleCommandName),
      noHomeTip: nullIfEmpty(form.homeNoHomeTip),
      setLimitTip: nullIfEmpty(form.homeSetLimitTip),
      setSuccessTip: nullIfEmpty(form.homeSetSuccessTip),
      overwriteTip: nullIfEmpty(form.homeOverwriteTip),
      deleteSuccessTip: nullIfEmpty(form.homeDeleteSuccessTip),
      homeNotFoundTip: nullIfEmpty(form.homeHomeNotFoundTip),
      coolingTip: nullIfEmpty(form.homeCoolingTip),
      teleSuccessTip: nullIfEmpty(form.homeTeleSuccessTip),
      setCurrencyNotEnoughTip: nullIfEmpty(form.homeSetCurrencyNotEnoughTip),
      teleCurrencyNotEnoughTip: nullIfEmpty(form.homeTeleCurrencyNotEnoughTip),
    },
    city: {
      isEnabled: form.cityEnabled,
      cooldownSeconds: Number(form.cityCooldownSeconds),
      listCommandName: nullIfEmpty(form.cityListCommandName),
      teleCommandName: nullIfEmpty(form.cityTeleCommandName),
      noCitiesTip: nullIfEmpty(form.cityNoCitiesTip),
      cityNotFoundTip: nullIfEmpty(form.cityCityNotFoundTip),
      coolingTip: nullIfEmpty(form.cityCoolingTip),
      teleSuccessTip: nullIfEmpty(form.cityTeleSuccessTip),
      currencyNotEnoughTip: nullIfEmpty(form.cityCurrencyNotEnoughTip),
    },
    friend: {
      isEnabled: form.friendEnabled,
      cooldownSeconds: Number(form.friendCooldownSeconds),
      currencyRequired: Number(form.friendCurrencyRequired),
      requestExpirySeconds: Number(form.friendRequestExpirySeconds),
      friendBypass: form.friendFriendBypass,
      requestCommandName: nullIfEmpty(form.friendRequestCommandName),
      acceptCommandName: nullIfEmpty(form.friendAcceptCommandName),
      rejectCommandName: nullIfEmpty(form.friendRejectCommandName),
      targetNotFoundTip: nullIfEmpty(form.friendTargetNotFoundTip),
      requestSentTip: nullIfEmpty(form.friendRequestSentTip),
      requestReceivedTip: nullIfEmpty(form.friendRequestReceivedTip),
      acceptedTip: nullIfEmpty(form.friendAcceptedTip),
      rejectedTip: nullIfEmpty(form.friendRejectedTip),
      targetRejectedTip: nullIfEmpty(form.friendTargetRejectedTip),
      noRequestTip: nullIfEmpty(form.friendNoRequestTip),
      coolingTip: nullIfEmpty(form.friendCoolingTip),
      teleSuccessTip: nullIfEmpty(form.friendTeleSuccessTip),
      currencyNotEnoughTip: nullIfEmpty(form.friendCurrencyNotEnoughTip),
    },
  };
}

async function loadSettings() {
  isLoading.value = true;
  try {
    const data = await api.getSettings();
    Object.assign(form, mapSettings(data));
    await nextTick();
    formRef.value?.clearValidate();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isLoading.value = false;
  }
}

async function onReset() {
  isSubmitting.value = true;
  try {
    const data = await api.resetSettings();
    Object.assign(form, mapSettings(data));
    await nextTick();
    formRef.value?.clearValidate();
    toast({ type: 'success', text: t('views.teleport.settings.messages.resetSuccess') });
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

async function onSubmit() {
  if (formRef.value == null)
    return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid)
    return;
  isSubmitting.value = true;
  try {
    await api.updateSettings(buildPayload());
    toast({ type: 'success', text: t('views.teleport.settings.messages.saveSuccess') });
    await loadSettings();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

onMounted(() => loadSettings());
</script>

<template>
  <div>
    <div v-if="isLoading" class="flex flex-col gap-4">
      <el-skeleton v-for="index in 6" :key="index" animated>
        <template #template>
          <el-skeleton-item variant="text" class="h-8" />
        </template>
      </el-skeleton>
    </div>
    <template v-else>
      <MyForm
        ref="formRef"
        v-model="form"
        :fields="masterFields"
        :rules="rules"
        label-position="top"
        label-width="auto"
        :gutter="16"
      />

      <div :class="{ 'opacity-40 pointer-events-none select-none': !form.isEnabled }">
        <el-tabs class="mt-2">
          <!-- ==================== Home Tab ==================== -->
          <el-tab-pane :label="t('views.teleport.settings.tabs.home')">
            <MyForm
              v-model="form"
              :fields="homeBasicFields"
              :rules="rules"
              label-position="top"
              label-width="auto"
              :gutter="16"
            />

            <div :class="{ 'opacity-40 pointer-events-none select-none': !form.homeEnabled }">
              <h3 class="text-sm font-semibold text-gray-900 mb-2 mt-4 dark:text-gray-100">
                {{ t('views.teleport.settings.sections.commands') }}
              </h3>
              <MyForm
                v-model="form"
                :fields="homeCommandFields"
                :rules="rules"
                label-position="top"
                label-width="auto"
                :gutter="16"
              />

              <el-collapse class="mt-2">
                <el-collapse-item :title="t('views.teleport.settings.sections.tips')">
                  <MyForm
                    v-model="form"
                    :fields="homeTipFields"
                    :rules="rules"
                    label-position="top"
                    label-width="auto"
                    :gutter="16"
                  />
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-tab-pane>

          <!-- ==================== City Tab ==================== -->
          <el-tab-pane :label="t('views.teleport.settings.tabs.city')">
            <MyForm
              v-model="form"
              :fields="cityBasicFields"
              :rules="rules"
              label-position="top"
              label-width="auto"
              :gutter="16"
            />

            <div :class="{ 'opacity-40 pointer-events-none select-none': !form.cityEnabled }">
              <h3 class="text-sm font-semibold text-gray-900 mb-2 mt-4 dark:text-gray-100">
                {{ t('views.teleport.settings.sections.commands') }}
              </h3>
              <MyForm
                v-model="form"
                :fields="cityCommandFields"
                :rules="rules"
                label-position="top"
                label-width="auto"
                :gutter="16"
              />

              <el-collapse class="mt-2">
                <el-collapse-item :title="t('views.teleport.settings.sections.tips')">
                  <MyForm
                    v-model="form"
                    :fields="cityTipFields"
                    :rules="rules"
                    label-position="top"
                    label-width="auto"
                    :gutter="16"
                  />
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-tab-pane>

          <!-- ==================== Friend Tab ==================== -->
          <el-tab-pane :label="t('views.teleport.settings.tabs.friend')">
            <MyForm
              v-model="form"
              :fields="friendBasicFields"
              :rules="rules"
              label-position="top"
              label-width="auto"
              :gutter="16"
            />

            <div :class="{ 'opacity-40 pointer-events-none select-none': !form.friendEnabled }">
              <h3 class="text-sm font-semibold text-gray-900 mb-2 mt-4 dark:text-gray-100">
                {{ t('views.teleport.settings.sections.commands') }}
              </h3>
              <MyForm
                v-model="form"
                :fields="friendCommandFields"
                :rules="rules"
                label-position="top"
                label-width="auto"
                :gutter="16"
              />

              <el-collapse class="mt-2">
                <el-collapse-item :title="t('views.teleport.settings.sections.tips')">
                  <MyForm
                    v-model="form"
                    :fields="friendTipFields"
                    :rules="rules"
                    label-position="top"
                    label-width="auto"
                    :gutter="16"
                  />
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="mt-4 flex gap-2 justify-end">
        <el-button :disabled="isSubmitting" @click="onReset">
          <el-icon><icon-mdi-refresh /></el-icon>
          {{ t('views.teleport.settings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.teleport.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
