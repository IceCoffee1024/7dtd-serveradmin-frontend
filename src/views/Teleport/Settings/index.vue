<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import { cloneDeep, isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import * as api from '~/api/teleport';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'TeleportSettingsPage' });

interface FormModel {
  isEnabled: boolean;
  // Home
  homeEnabled: boolean;
  homeCooldownSeconds: number;
  homeSetCurrencyRequired: number;
  homeTeleCurrencyRequired: number;
  homeMaxHomes: number;
  homeAllowDuringBloodMoon: boolean;
  homeListCommandName: string;
  homeSetCommandName: string;
  homeDeleteCommandName: string;
  homeTeleCommandName: string;
  homeNoHomeTip: string;
  homeSetLimitTip: string;
  homeSetSuccessTip: string;
  homeOverwriteTip: string;
  homeDeleteSuccessTip: string;
  homeHomeNotFoundTip: string;
  homeCoolingTip: string;
  homeTeleSuccessTip: string;
  homeSetCurrencyNotEnoughTip: string;
  homeTeleCurrencyNotEnoughTip: string;
  homeBloodMoonBlockedTip: string;
  // City
  cityEnabled: boolean;
  cityCooldownSeconds: number;
  cityListCommandName: string;
  cityTeleCommandName: string;
  cityNoCitiesTip: string;
  cityCityNotFoundTip: string;
  cityCoolingTip: string;
  cityTeleSuccessTip: string;
  cityCurrencyNotEnoughTip: string;
  // Friend
  friendEnabled: boolean;
  friendCooldownSeconds: number;
  friendCurrencyRequired: number;
  friendRequestExpirySeconds: number;
  friendFriendBypass: boolean;
  friendRequestCommandName: string;
  friendAcceptCommandName: string;
  friendRejectCommandName: string;
  friendTargetNotFoundTip: string;
  friendRequestSentTip: string;
  friendRequestReceivedTip: string;
  friendAcceptedTip: string;
  friendRejectedTip: string;
  friendTargetRejectedTip: string;
  friendNoRequestTip: string;
  friendCoolingTip: string;
  friendTeleSuccessTip: string;
  friendCurrencyNotEnoughTip: string;
  // Global Cooldown
  globalCooldownEnabled: boolean;
  globalCooldownSeconds: number;
  // Back
  backEnabled: boolean;
  backCooldownSeconds: number;
  backCurrencyRequired: number;
  backCommandName: string;
  backNoPositionTip: string;
  backCoolingTip: string;
  backTeleSuccessTip: string;
  backCurrencyNotEnoughTip: string;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const { t } = useI18n();
const { toast, confirm } = usePopup();

const formRef = useTemplateRef<FormExpose>('formRef');
const isLoading = ref(false);
const isSubmitting = ref(false);
const savedForm = ref<FormModel>(buildDefaults());

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    homeEnabled: false,
    homeCooldownSeconds: 60,
    homeSetCurrencyRequired: 0,
    homeTeleCurrencyRequired: 0,
    homeMaxHomes: 3,
    homeAllowDuringBloodMoon: false,
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
    homeBloodMoonBlockedTip: '',
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
    globalCooldownEnabled: false,
    globalCooldownSeconds: 60,
    backEnabled: false,
    backCooldownSeconds: 60,
    backCurrencyRequired: 0,
    backCommandName: '',
    backNoPositionTip: '',
    backCoolingTip: '',
    backTeleSuccessTip: '',
    backCurrencyNotEnoughTip: '',
  };
}

const form = reactive<FormModel>(buildDefaults());
const isDirty = computed(() => !isEqual(form, savedForm.value));

const schema = v.object({
  isEnabled: v.boolean(),
  homeEnabled: v.boolean(),
  homeCooldownSeconds: v.pipe(v.number(), v.minValue(0)),
  homeSetCurrencyRequired: v.pipe(v.number(), v.minValue(0)),
  homeTeleCurrencyRequired: v.pipe(v.number(), v.minValue(0)),
  homeMaxHomes: v.pipe(v.number(), v.minValue(1)),
  homeAllowDuringBloodMoon: v.boolean(),
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
  homeBloodMoonBlockedTip: v.optional(v.string()),
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
  globalCooldownEnabled: v.boolean(),
  globalCooldownSeconds: v.pipe(v.number(), v.minValue(0)),
  backEnabled: v.boolean(),
  backCooldownSeconds: v.pipe(v.number(), v.minValue(0)),
  backCurrencyRequired: v.pipe(v.number(), v.minValue(0)),
  backCommandName: v.optional(v.string()),
  backNoPositionTip: v.optional(v.string()),
  backCoolingTip: v.optional(v.string()),
  backTeleSuccessTip: v.optional(v.string()),
  backCurrencyNotEnoughTip: v.optional(v.string()),
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
  {
    prop: 'homeAllowDuringBloodMoon',
    label: t('views.teleport.settings.fields.home.allowDuringBloodMoon'),
    el: 'el-select',
    options: booleanOptions.value,
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
  { prop: 'homeNoHomeTip', label: t('views.teleport.settings.fields.home.noHomeTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'homeSetLimitTip', label: t('views.teleport.settings.fields.home.setLimitTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'homeSetSuccessTip', label: t('views.teleport.settings.fields.home.setSuccessTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'homeOverwriteTip', label: t('views.teleport.settings.fields.home.overwriteTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'homeDeleteSuccessTip', label: t('views.teleport.settings.fields.home.deleteSuccessTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'homeHomeNotFoundTip', label: t('views.teleport.settings.fields.home.homeNotFoundTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'homeCoolingTip', label: t('views.teleport.settings.fields.home.coolingTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'homeTeleSuccessTip', label: t('views.teleport.settings.fields.home.teleSuccessTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'homeSetCurrencyNotEnoughTip', label: t('views.teleport.settings.fields.home.setCurrencyNotEnoughTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'homeTeleCurrencyNotEnoughTip', label: t('views.teleport.settings.fields.home.teleCurrencyNotEnoughTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'homeBloodMoonBlockedTip', label: t('views.teleport.settings.fields.home.bloodMoonBlockedTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
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
  { prop: 'cityNoCitiesTip', label: t('views.teleport.settings.fields.city.noCitiesTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'cityCityNotFoundTip', label: t('views.teleport.settings.fields.city.cityNotFoundTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'cityCoolingTip', label: t('views.teleport.settings.fields.city.coolingTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'cityTeleSuccessTip', label: t('views.teleport.settings.fields.city.teleSuccessTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'cityCurrencyNotEnoughTip', label: t('views.teleport.settings.fields.city.currencyNotEnoughTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
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
  { prop: 'friendTargetNotFoundTip', label: t('views.teleport.settings.fields.friend.targetNotFoundTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'friendRequestSentTip', label: t('views.teleport.settings.fields.friend.requestSentTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'friendRequestReceivedTip', label: t('views.teleport.settings.fields.friend.requestReceivedTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'friendAcceptedTip', label: t('views.teleport.settings.fields.friend.acceptedTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'friendRejectedTip', label: t('views.teleport.settings.fields.friend.rejectedTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'friendTargetRejectedTip', label: t('views.teleport.settings.fields.friend.targetRejectedTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'friendNoRequestTip', label: t('views.teleport.settings.fields.friend.noRequestTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'friendCoolingTip', label: t('views.teleport.settings.fields.friend.coolingTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'friendTeleSuccessTip', label: t('views.teleport.settings.fields.friend.teleSuccessTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'friendCurrencyNotEnoughTip', label: t('views.teleport.settings.fields.friend.currencyNotEnoughTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
]);

// ---- Global Cooldown fields ----
const globalCooldownFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'globalCooldownEnabled',
    label: t('views.teleport.settings.fields.globalCooldown.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'globalCooldownSeconds',
    label: t('views.teleport.settings.fields.globalCooldown.cooldownSeconds'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
]);

// ---- Back fields ----
const backBasicFields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'backEnabled',
    label: t('views.teleport.settings.fields.back.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'backCooldownSeconds',
    label: t('views.teleport.settings.fields.back.cooldownSeconds'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'backCurrencyRequired',
    label: t('views.teleport.settings.fields.back.currencyRequired'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
]);

const backCommandFields = computed<MyFormField<FormModel>[]>(() => [
  { prop: 'backCommandName', label: t('views.teleport.settings.fields.back.commandName'), el: 'el-input', span: { xs: 24, md: 12 } },
]);

const backTipFields = computed<MyFormField<FormModel>[]>(() => [
  { prop: 'backNoPositionTip', label: t('views.teleport.settings.fields.back.noPositionTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'backCoolingTip', label: t('views.teleport.settings.fields.back.coolingTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'backTeleSuccessTip', label: t('views.teleport.settings.fields.back.teleSuccessTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
  { prop: 'backCurrencyNotEnoughTip', label: t('views.teleport.settings.fields.back.currencyNotEnoughTip'), el: 'el-input', props: { clearable: true }, span: { xs: 24 } },
]);

// ---- Data mapping ----
function mapSettings(dto: API.Teleport.FeatureSettings | null | undefined): FormModel {
  const h = dto?.home;
  const c = dto?.city;
  const f = dto?.friend;
  const g = dto?.globalCooldown;
  const b = dto?.back;
  return {
    isEnabled: dto?.isEnabled ?? false,
    homeEnabled: h?.isEnabled ?? false,
    homeCooldownSeconds: h?.cooldownSeconds ?? 60,
    homeSetCurrencyRequired: h?.setCurrencyRequired ?? 0,
    homeTeleCurrencyRequired: h?.teleCurrencyRequired ?? 0,
    homeMaxHomes: h?.maxHomes ?? 3,
    homeAllowDuringBloodMoon: h?.allowDuringBloodMoon ?? false,
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
    homeBloodMoonBlockedTip: h?.bloodMoonBlockedTip ?? '',
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
    globalCooldownEnabled: g?.isEnabled ?? false,
    globalCooldownSeconds: g?.cooldownSeconds ?? 60,
    backEnabled: b?.isEnabled ?? false,
    backCooldownSeconds: b?.cooldownSeconds ?? 60,
    backCurrencyRequired: b?.currencyRequired ?? 0,
    backCommandName: b?.commandName ?? '',
    backNoPositionTip: b?.noPositionTip ?? '',
    backCoolingTip: b?.coolingTip ?? '',
    backTeleSuccessTip: b?.teleSuccessTip ?? '',
    backCurrencyNotEnoughTip: b?.currencyNotEnoughTip ?? '',
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
      allowDuringBloodMoon: form.homeAllowDuringBloodMoon,
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
      bloodMoonBlockedTip: nullIfEmpty(form.homeBloodMoonBlockedTip),
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
    globalCooldown: {
      isEnabled: form.globalCooldownEnabled,
      cooldownSeconds: Number(form.globalCooldownSeconds),
    },
    back: {
      isEnabled: form.backEnabled,
      cooldownSeconds: Number(form.backCooldownSeconds),
      currencyRequired: Number(form.backCurrencyRequired),
      commandName: nullIfEmpty(form.backCommandName),
      noPositionTip: nullIfEmpty(form.backNoPositionTip),
      coolingTip: nullIfEmpty(form.backCoolingTip),
      teleSuccessTip: nullIfEmpty(form.backTeleSuccessTip),
      currencyNotEnoughTip: nullIfEmpty(form.backCurrencyNotEnoughTip),
    },
  };
}

async function loadSettings() {
  isLoading.value = true;
  try {
    const data = await api.getSettings();
    Object.assign(form, mapSettings(data));
    savedForm.value = cloneDeep(form);
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
    savedForm.value = cloneDeep(form);
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
    savedForm.value = cloneDeep(form);
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

onBeforeRouteLeave(async (_to, _from, next) => {
  if (isDirty.value === false) {
    next();
    return;
  }
  const confirmed = await confirm({ text: t('views.teleport.settings.messages.unsavedChanges'), type: 'warning' });
  next(confirmed);
});

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
      <el-card shadow="never" class="mb-4">
        <MyForm
          ref="formRef"
          v-model="form"
          :fields="masterFields"
          :rules="rules"
          label-position="left"
          label-width="140px"
          :gutter="16"
        />
      </el-card>

      <div :class="{ 'opacity-40 pointer-events-none select-none': !form.isEnabled }">
        <el-tabs type="border-card">
          <!-- ==================== Home Tab ==================== -->
          <el-tab-pane :label="t('views.teleport.settings.tabs.home')">
            <div class="gap-4 grid grid-cols-1 xl:grid-cols-2">
              <el-card shadow="never" class="border-none bg-gray-50/50 dark:bg-dark-900">
                <template #header>
                  <span class="text-sm font-semibold">{{ t('views.teleport.settings.sections.basic') }}</span>
                </template>
                <MyForm
                  v-model="form"
                  :fields="homeBasicFields"
                  :rules="rules"
                  label-position="left"
                  label-width="140px"
                  :gutter="16"
                />
              </el-card>

              <el-card shadow="never" class="border-none bg-gray-50/50 dark:bg-dark-900" :class="{ 'opacity-40 pointer-events-none select-none': !form.homeEnabled }">
                <template #header>
                  <span class="text-sm font-semibold">{{ t('views.teleport.settings.sections.commands') }}</span>
                </template>
                <MyForm
                  v-model="form"
                  :fields="homeCommandFields"
                  :rules="rules"
                  label-position="left"
                  label-width="140px"
                  :gutter="16"
                />
              </el-card>

              <el-card shadow="never" class="border-none bg-gray-50/50 dark:bg-dark-900 xl:col-span-2" :class="{ 'opacity-40 pointer-events-none select-none': !form.homeEnabled }">
                <template #header>
                  <span class="text-sm font-semibold">{{ t('views.teleport.settings.sections.tips') }}</span>
                </template>
                <MyForm
                  v-model="form"
                  :fields="homeTipFields"
                  :rules="rules"
                  label-position="left"
                  label-width="140px"
                  :gutter="16"
                />
              </el-card>
            </div>
          </el-tab-pane>

          <!-- ==================== City Tab ==================== -->
          <el-tab-pane :label="t('views.teleport.settings.tabs.city')">
            <div class="gap-4 grid grid-cols-1 xl:grid-cols-2">
              <el-card shadow="never" class="border-none bg-gray-50/50 dark:bg-dark-900">
                <template #header>
                  <span class="text-sm font-semibold">{{ t('views.teleport.settings.sections.basic') }}</span>
                </template>
                <MyForm
                  v-model="form"
                  :fields="cityBasicFields"
                  :rules="rules"
                  label-position="left"
                  label-width="140px"
                  :gutter="16"
                />
              </el-card>

              <el-card shadow="never" class="border-none bg-gray-50/50 dark:bg-dark-900" :class="{ 'opacity-40 pointer-events-none select-none': !form.cityEnabled }">
                <template #header>
                  <span class="text-sm font-semibold">{{ t('views.teleport.settings.sections.commands') }}</span>
                </template>
                <MyForm
                  v-model="form"
                  :fields="cityCommandFields"
                  :rules="rules"
                  label-position="left"
                  label-width="140px"
                  :gutter="16"
                />
              </el-card>

              <el-card shadow="never" class="border-none bg-gray-50/50 dark:bg-dark-900 xl:col-span-2" :class="{ 'opacity-40 pointer-events-none select-none': !form.cityEnabled }">
                <template #header>
                  <span class="text-sm font-semibold">{{ t('views.teleport.settings.sections.tips') }}</span>
                </template>
                <MyForm
                  v-model="form"
                  :fields="cityTipFields"
                  :rules="rules"
                  label-position="left"
                  label-width="140px"
                  :gutter="16"
                />
              </el-card>
            </div>
          </el-tab-pane>

          <!-- ==================== Friend Tab ==================== -->
          <el-tab-pane :label="t('views.teleport.settings.tabs.friend')">
            <div class="gap-4 grid grid-cols-1 xl:grid-cols-2">
              <el-card shadow="never" class="border-none bg-gray-50/50 dark:bg-dark-900">
                <template #header>
                  <span class="text-sm font-semibold">{{ t('views.teleport.settings.sections.basic') }}</span>
                </template>
                <MyForm
                  v-model="form"
                  :fields="friendBasicFields"
                  :rules="rules"
                  label-position="left"
                  label-width="140px"
                  :gutter="16"
                />
              </el-card>

              <el-card shadow="never" class="border-none bg-gray-50/50 dark:bg-dark-900" :class="{ 'opacity-40 pointer-events-none select-none': !form.friendEnabled }">
                <template #header>
                  <span class="text-sm font-semibold">{{ t('views.teleport.settings.sections.commands') }}</span>
                </template>
                <MyForm
                  v-model="form"
                  :fields="friendCommandFields"
                  :rules="rules"
                  label-position="left"
                  label-width="140px"
                  :gutter="16"
                />
              </el-card>

              <el-card shadow="never" class="border-none bg-gray-50/50 dark:bg-dark-900 xl:col-span-2" :class="{ 'opacity-40 pointer-events-none select-none': !form.friendEnabled }">
                <template #header>
                  <span class="text-sm font-semibold">{{ t('views.teleport.settings.sections.tips') }}</span>
                </template>
                <MyForm
                  v-model="form"
                  :fields="friendTipFields"
                  :rules="rules"
                  label-position="left"
                  label-width="140px"
                  :gutter="16"
                />
              </el-card>
            </div>
          </el-tab-pane>

          <!-- ==================== Global Cooldown Tab ==================== -->
          <el-tab-pane :label="t('views.teleport.settings.tabs.globalCooldown')">
            <el-card shadow="never" class="border-none bg-gray-50/50 dark:bg-dark-900">
              <template #header>
                <span class="text-sm font-semibold">{{ t('views.teleport.settings.sections.basic') }}</span>
              </template>
              <MyForm
                v-model="form"
                :fields="globalCooldownFields"
                :rules="rules"
                label-position="left"
                label-width="140px"
                :gutter="16"
              />
            </el-card>
          </el-tab-pane>

          <!-- ==================== Back Tab ==================== -->
          <el-tab-pane :label="t('views.teleport.settings.tabs.back')">
            <div class="gap-4 grid grid-cols-1 xl:grid-cols-2">
              <el-card shadow="never" class="border-none bg-gray-50/50 dark:bg-dark-900">
                <template #header>
                  <span class="text-sm font-semibold">{{ t('views.teleport.settings.sections.basic') }}</span>
                </template>
                <MyForm
                  v-model="form"
                  :fields="backBasicFields"
                  :rules="rules"
                  label-position="left"
                  label-width="140px"
                  :gutter="16"
                />
              </el-card>

              <el-card shadow="never" class="border-none bg-gray-50/50 dark:bg-dark-900" :class="{ 'opacity-40 pointer-events-none select-none': !form.backEnabled }">
                <template #header>
                  <span class="text-sm font-semibold">{{ t('views.teleport.settings.sections.commands') }}</span>
                </template>
                <MyForm
                  v-model="form"
                  :fields="backCommandFields"
                  :rules="rules"
                  label-position="left"
                  label-width="140px"
                  :gutter="16"
                />
              </el-card>

              <el-card shadow="never" class="border-none bg-gray-50/50 dark:bg-dark-900 xl:col-span-2" :class="{ 'opacity-40 pointer-events-none select-none': !form.backEnabled }">
                <template #header>
                  <span class="text-sm font-semibold">{{ t('views.teleport.settings.sections.tips') }}</span>
                </template>
                <MyForm
                  v-model="form"
                  :fields="backTipFields"
                  :rules="rules"
                  label-position="left"
                  label-width="140px"
                  :gutter="16"
                />
              </el-card>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="mt-4 flex gap-2 justify-end">
        <el-button :disabled="isSubmitting" @click="onReset">
          <el-icon><icon-mdi-refresh /></el-icon>
          {{ t('views.teleport.settings.actions.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty" @click="onSubmit">
          <el-icon><icon-mdi-check /></el-icon>
          {{ t('views.teleport.settings.actions.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>
