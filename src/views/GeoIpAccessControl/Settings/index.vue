<script setup lang="ts">
import type {
  GeoIpAccessControlSettingsDto,
  GeoIpAccessControlStatusDto,
  GeoIpLookupResultDto,
} from '~/generated/api/types.gen';
import { isEqual } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import { usePopup } from '~/composables';
import { ISO_COUNTRIES } from '~/constants/countries';
import {
  geoIpAccessControlGetSettings,
  geoIpAccessControlGetStatus,
  geoIpAccessControlClearCache,
  geoIpAccessControlResetSettings,
  geoIpAccessControlTestLookup,
  geoIpAccessControlUpdateSettings,
} from '~/generated/api/sdk.gen';

defineOptions({ name: 'GeoIpAccessControlSettingsPage' });

type Provider = 'IpWhoIs' | 'IpApi' | 'IpInfo';
type Mode = 'Disabled' | 'AllowCountries' | 'BlockCountries';
type UnknownPolicy = 'Allow' | 'Block';
type PrivatePolicy = 'Allow' | 'Block';

interface FormModel {
  isEnabled: boolean;
  provider: Provider;
  ipInfoToken: string;
  cacheTtlMinutes: number;
  failureCacheTtlMinutes: number;
  requestTimeoutSeconds: number;
  mode: Mode;
  allowedCountryCodes: string[];
  blockedCountryCodes: string[];
  ipAllowList: string[];
  ipBlockList: string[];
  unknownCountryPolicy: UnknownPolicy;
  privateIpPolicy: PrivatePolicy;
  bypassAdmins: boolean;
  kickMessage: string;
  logAllowedDecisions: boolean;
}

const { t } = useI18n();
const { toast, confirm } = usePopup();

const isLoading = ref(false);
const isSubmitting = ref(false);
const isTesting = ref(false);
const isClearingCache = ref(false);
const initialValues = ref<FormModel>(buildDefaults());
const form = reactive<FormModel>(buildDefaults());
const status = ref<GeoIpAccessControlStatusDto | null>(null);
const testIp = ref('8.8.8.8');
const testResult = ref<GeoIpLookupResultDto | null>(null);
const newAllowIpEntry = ref('');
const newBlockIpEntry = ref('');
const allowBulkText = ref('');
const blockBulkText = ref('');
const showAdvancedProvider = ref(false);
const showAdvancedIpImport = ref(false);
const isDirty = computed(() => !isEqual(form, initialValues.value));

const providerOptions = computed(() => [
  {
    label: 'ipwho.is',
    value: 'IpWhoIs',
    badge: t('views.geoIpAccessControl.settings.providerBadges.recommended'),
    description: t('views.geoIpAccessControl.settings.providerDescriptions.ipWhoIs'),
  },
  {
    label: 'ip-api.com',
    value: 'IpApi',
    badge: t('views.geoIpAccessControl.settings.providerBadges.http'),
    description: t('views.geoIpAccessControl.settings.providerDescriptions.ipApi'),
  },
  {
    label: 'ipinfo.io',
    value: 'IpInfo',
    badge: t('views.geoIpAccessControl.settings.providerBadges.token'),
    description: t('views.geoIpAccessControl.settings.providerDescriptions.ipInfo'),
  },
]);
const modeOptions = computed(() => [
  { label: t('views.geoIpAccessControl.settings.modes.disabled'), value: 'Disabled' },
  { label: t('views.geoIpAccessControl.settings.modes.allowCountries'), value: 'AllowCountries' },
  { label: t('views.geoIpAccessControl.settings.modes.blockCountries'), value: 'BlockCountries' },
]);
const policyOptions = computed(() => [
  { label: t('views.geoIpAccessControl.settings.policies.allow'), value: 'Allow' },
  { label: t('views.geoIpAccessControl.settings.policies.block'), value: 'Block' },
]);
const countryOptions = ISO_COUNTRIES.map(country => ({
  label: `${country.name} (${country.code})`,
  value: country.code,
}));
const selectedProvider = computed(() => providerOptions.value.find(item => item.value === form.provider) ?? providerOptions.value[0]);
const strategySummaryType = computed(() => {
  if (!form.isEnabled || form.mode === 'Disabled')
    return 'info';
  if (form.mode === 'AllowCountries')
    return 'warning';
  return 'success';
});
const strategySummary = computed(() => {
  if (!form.isEnabled)
    return t('views.geoIpAccessControl.settings.summaries.disabled');
  if (form.mode === 'Disabled')
    return t('views.geoIpAccessControl.settings.summaries.enabledNoPolicy');
  if (form.mode === 'AllowCountries') {
    return t('views.geoIpAccessControl.settings.summaries.allowCountries', {
      countries: formatCountryList(form.allowedCountryCodes),
      unknown: policyLabel(form.unknownCountryPolicy),
      privateIp: policyLabel(form.privateIpPolicy),
    });
  }
  return t('views.geoIpAccessControl.settings.summaries.blockCountries', {
    countries: formatCountryList(form.blockedCountryCodes),
    unknown: policyLabel(form.unknownCountryPolicy),
    privateIp: policyLabel(form.privateIpPolicy),
  });
});
const testDecisionSummary = computed(() => {
  if (!testResult.value)
    return null;

  if (testResult.value.succeeded === false)
    return t('views.geoIpAccessControl.settings.testDecision.lookupFailed', { policy: policyLabel(form.unknownCountryPolicy) });

  const code = testResult.value.countryCode?.toUpperCase();
  if (!form.isEnabled || form.mode === 'Disabled')
    return t('views.geoIpAccessControl.settings.testDecision.allowedDisabled');
  if (!code)
    return t('views.geoIpAccessControl.settings.testDecision.unknownCountry', { policy: policyLabel(form.unknownCountryPolicy) });
  if (form.mode === 'AllowCountries')
    return form.allowedCountryCodes.includes(code)
      ? t('views.geoIpAccessControl.settings.testDecision.allowedByCountry', { country: code })
      : t('views.geoIpAccessControl.settings.testDecision.blockedByAllowMode', { country: code });
  if (form.mode === 'BlockCountries')
    return form.blockedCountryCodes.includes(code)
      ? t('views.geoIpAccessControl.settings.testDecision.blockedByCountry', { country: code })
      : t('views.geoIpAccessControl.settings.testDecision.allowedByCountry', { country: code });
  return null;
});

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    provider: 'IpWhoIs',
    ipInfoToken: '',
    cacheTtlMinutes: 1440,
    failureCacheTtlMinutes: 5,
    requestTimeoutSeconds: 2,
    mode: 'Disabled',
    allowedCountryCodes: [],
    blockedCountryCodes: [],
    ipAllowList: [],
    ipBlockList: [],
    unknownCountryPolicy: 'Allow',
    privateIpPolicy: 'Allow',
    bypassAdmins: true,
    kickMessage: 'Connection rejected by server GeoIP access policy.',
    logAllowedDecisions: false,
  };
}

function textToList(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeCountryList(values: string[] | null | undefined): string[] {
  return Array.from(new Set((values ?? []).map(item => item.trim().toUpperCase()).filter(Boolean)));
}

function normalizeTextList(values: string[] | null | undefined): string[] {
  return Array.from(new Set((values ?? []).map(item => item.trim()).filter(Boolean)));
}

function toFormModel(data?: GeoIpAccessControlSettingsDto | null): FormModel {
  if (!data)
    return buildDefaults();

  return {
    isEnabled: data.isEnabled ?? false,
    provider: (data.provider ?? 'IpWhoIs') as Provider,
    ipInfoToken: data.ipInfoToken ?? '',
    cacheTtlMinutes: data.cacheTtlMinutes ?? 1440,
    failureCacheTtlMinutes: data.failureCacheTtlMinutes ?? 5,
    requestTimeoutSeconds: data.requestTimeoutSeconds ?? 2,
    mode: (data.mode ?? 'Disabled') as Mode,
    allowedCountryCodes: normalizeCountryList(data.allowedCountryCodes),
    blockedCountryCodes: normalizeCountryList(data.blockedCountryCodes),
    ipAllowList: normalizeTextList(data.ipAllowList),
    ipBlockList: normalizeTextList(data.ipBlockList),
    unknownCountryPolicy: (data.unknownCountryPolicy ?? 'Allow') as UnknownPolicy,
    privateIpPolicy: (data.privateIpPolicy ?? 'Allow') as PrivatePolicy,
    bypassAdmins: data.bypassAdmins ?? true,
    kickMessage: data.kickMessage ?? 'Connection rejected by server GeoIP access policy.',
    logAllowedDecisions: data.logAllowedDecisions ?? false,
  };
}

function toPayload(values: FormModel): GeoIpAccessControlSettingsDto {
  return {
    isEnabled: values.isEnabled,
    provider: values.provider,
    ipInfoToken: values.provider === 'IpInfo' ? values.ipInfoToken.trim() || null : null,
    cacheTtlMinutes: Number(values.cacheTtlMinutes),
    failureCacheTtlMinutes: Number(values.failureCacheTtlMinutes),
    requestTimeoutSeconds: Number(values.requestTimeoutSeconds),
    mode: values.mode,
    allowedCountryCodes: normalizeCountryList(values.allowedCountryCodes),
    blockedCountryCodes: normalizeCountryList(values.blockedCountryCodes),
    ipAllowList: normalizeTextList(values.ipAllowList),
    ipBlockList: normalizeTextList(values.ipBlockList),
    unknownCountryPolicy: values.unknownCountryPolicy,
    privateIpPolicy: values.privateIpPolicy,
    bypassAdmins: values.bypassAdmins,
    action: 'Kick',
    kickMessage: values.kickMessage.trim() || null,
    logAllowedDecisions: values.logAllowedDecisions,
  };
}

async function loadData() {
  isLoading.value = true;
  try {
    const [{ data: settingsData }, { data: statusData }] = await Promise.all([
      geoIpAccessControlGetSettings({ throwOnError: true }),
      geoIpAccessControlGetStatus({ throwOnError: true }),
    ]);
    initialValues.value = toFormModel(settingsData);
    Object.assign(form, initialValues.value);
    status.value = statusData ?? null;
  }
  finally {
    isLoading.value = false;
  }
}

async function saveSettings() {
  isSubmitting.value = true;
  try {
    await geoIpAccessControlUpdateSettings({ body: toPayload(form), throwOnError: true });
    toast({ type: 'success', text: t('views.geoIpAccessControl.settings.messages.saveSuccess') });
    await loadData();
  }
  finally {
    isSubmitting.value = false;
  }
}

async function resetSettings() {
  const ok = await confirm({
    type: 'warning',
    text: t('views.geoIpAccessControl.settings.messages.resetConfirm'),
  });
  if (!ok)
    return;

  isSubmitting.value = true;
  try {
    const { data } = await geoIpAccessControlResetSettings({ throwOnError: true });
    initialValues.value = toFormModel(data);
    Object.assign(form, initialValues.value);
    toast({ type: 'success', text: t('views.geoIpAccessControl.settings.messages.resetSuccess') });
    await loadData();
  }
  finally {
    isSubmitting.value = false;
  }
}

async function testLookup() {
  isTesting.value = true;
  try {
    const { data } = await geoIpAccessControlTestLookup({
      body: { ip: testIp.value.trim() },
      throwOnError: true,
    });
    testResult.value = data ?? null;
    toast({ type: 'success', text: t('views.geoIpAccessControl.settings.messages.lookupSuccess') });
    await loadStatus();
  }
  finally {
    isTesting.value = false;
  }
}

async function loadStatus() {
  const { data } = await geoIpAccessControlGetStatus({ throwOnError: true });
  status.value = data ?? null;
}

async function clearCache() {
  const ok = await confirm({
    type: 'warning',
    text: t('views.geoIpAccessControl.settings.messages.clearCacheConfirm'),
  });
  if (!ok)
    return;

  isClearingCache.value = true;
  try {
    const { data } = await geoIpAccessControlClearCache({ throwOnError: true });
    toast({
      type: 'success',
      text: t('views.geoIpAccessControl.settings.messages.clearCacheSuccess', { count: data?.clearedCount ?? 0 }),
    });
    await loadStatus();
  }
  finally {
    isClearingCache.value = false;
  }
}

function decisionType(decision?: string) {
  if (decision === 'Blocked')
    return 'danger';
  if (decision === 'Allowed')
    return 'success';
  if (decision === 'LookupFailed')
    return 'warning';
  return 'info';
}

function policyLabel(policy: UnknownPolicy | PrivatePolicy) {
  return policy === 'Block'
    ? t('views.geoIpAccessControl.settings.policies.block')
    : t('views.geoIpAccessControl.settings.policies.allow');
}

function formatCountryList(values: string[]) {
  if (values.length === 0)
    return t('views.geoIpAccessControl.settings.summaries.none');
  if (values.length <= 6)
    return values.join(', ');
  return t('views.geoIpAccessControl.settings.summaries.countryCount', { count: values.length });
}

function addIpEntry(target: 'allow' | 'block') {
  const source = target === 'allow' ? newAllowIpEntry : newBlockIpEntry;
  const value = source.value.trim();
  if (!value)
    return;

  const list = target === 'allow' ? form.ipAllowList : form.ipBlockList;
  if (!list.some(item => item.toLowerCase() === value.toLowerCase()))
    list.push(value);
  source.value = '';
}

function removeIpEntry(target: 'allow' | 'block', value: string) {
  const list = target === 'allow' ? form.ipAllowList : form.ipBlockList;
  const index = list.findIndex(item => item === value);
  if (index >= 0)
    list.splice(index, 1);
}

function importIpEntries(target: 'allow' | 'block') {
  const source = target === 'allow' ? allowBulkText : blockBulkText;
  const entries = textToList(source.value);
  const list = target === 'allow' ? form.ipAllowList : form.ipBlockList;
  for (const entry of entries) {
    if (!list.some(item => item.toLowerCase() === entry.toLowerCase()))
      list.push(entry);
  }
  source.value = '';
}

function applyPreset(preset: 'cnRegion' | 'blockCommon' | 'observeOnly') {
  if (preset === 'cnRegion') {
    form.isEnabled = true;
    form.mode = 'AllowCountries';
    form.allowedCountryCodes = ['CN', 'HK', 'MO', 'TW'];
    form.unknownCountryPolicy = 'Allow';
    form.privateIpPolicy = 'Allow';
  }
  else if (preset === 'blockCommon') {
    form.isEnabled = true;
    form.mode = 'BlockCountries';
    form.blockedCountryCodes = ['RU', 'KP'];
    form.unknownCountryPolicy = 'Allow';
    form.privateIpPolicy = 'Allow';
  }
  else {
    form.isEnabled = false;
    form.mode = 'Disabled';
    form.unknownCountryPolicy = 'Allow';
    form.privateIpPolicy = 'Allow';
    form.logAllowedDecisions = true;
  }
}

onMounted(loadData);

onBeforeRouteLeave(async () => {
  if (!isDirty.value)
    return true;
  return await confirm({
    type: 'warning',
    text: t('views.geoIpAccessControl.settings.messages.unsavedChanges'),
  });
});
</script>

<template>
  <div class="geoip-settings">
    <div class="geoip-settings__header">
      <div>
        <h2>{{ t('menus.geoIpAccessControl') }}</h2>
        <p>{{ t('views.geoIpAccessControl.settings.description') }}</p>
      </div>
      <div class="geoip-settings__header-actions">
        <el-tag :type="form.isEnabled ? 'success' : 'info'" effect="plain">
          {{ form.isEnabled ? t('common.enabled') : t('common.disabled') }}
        </el-tag>
        <el-switch
          v-model="form.isEnabled"
          inline-prompt
          :active-text="t('common.yes')"
          :inactive-text="t('common.no')"
        />
      </div>
    </div>

    <el-skeleton v-if="isLoading" :rows="10" animated />

    <template v-else>
      <el-alert
        v-if="form.provider === 'IpApi'"
        class="mb-4"
        type="warning"
        :closable="false"
        :title="t('views.geoIpAccessControl.settings.messages.ipApiWarning')"
      />

      <section class="geoip-settings__overview">
        <div class="geoip-settings__metric">
          <span>{{ t('views.geoIpAccessControl.settings.overview.mode') }}</span>
          <strong>{{ modeOptions.find(item => item.value === form.mode)?.label }}</strong>
        </div>
        <div class="geoip-settings__metric">
          <span>{{ t('views.geoIpAccessControl.settings.overview.provider') }}</span>
          <strong>{{ selectedProvider.label }}</strong>
        </div>
        <div class="geoip-settings__metric">
          <span>{{ t('views.geoIpAccessControl.settings.status.cacheCount') }}</span>
          <strong>{{ status?.cacheCount ?? 0 }}</strong>
        </div>
        <div class="geoip-settings__metric">
          <span>{{ t('views.geoIpAccessControl.settings.status.lastBlockedAt') }}</span>
          <strong>{{ status?.lastBlockedAt || '-' }}</strong>
        </div>
      </section>

      <el-alert class="geoip-settings__summary" :type="strategySummaryType" :closable="false" :title="strategySummary" />

      <el-form label-position="top" class="geoip-settings__form">
        <section class="geoip-settings__panel">
          <div class="geoip-settings__section-title">
            <div>
              <h3>{{ t('views.geoIpAccessControl.settings.sections.provider') }}</h3>
              <p>{{ t('views.geoIpAccessControl.settings.sectionDescriptions.provider') }}</p>
            </div>
            <el-button text size="small" @click="showAdvancedProvider = !showAdvancedProvider">
              {{ showAdvancedProvider ? t('views.geoIpAccessControl.settings.actions.hideAdvanced') : t('views.geoIpAccessControl.settings.actions.showAdvanced') }}
            </el-button>
          </div>

          <div class="geoip-settings__provider-grid">
            <button
              v-for="item in providerOptions"
              :key="item.value"
              class="geoip-settings__provider-card"
              :class="{ 'is-active': form.provider === item.value }"
              type="button"
              @click="form.provider = item.value as Provider"
            >
              <span>
                <strong>{{ item.label }}</strong>
                <small>{{ item.description }}</small>
              </span>
              <el-tag size="small" effect="plain">
                {{ item.badge }}
              </el-tag>
            </button>
          </div>

          <el-row v-if="showAdvancedProvider || form.provider === 'IpInfo'" :gutter="16" class="mt-4">
            <el-col v-if="form.provider === 'IpInfo'" :xs="24" :md="8">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.ipInfoToken')">
                <el-input v-model="form.ipInfoToken" type="password" show-password clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.requestTimeoutSeconds')">
                <el-input-number v-model="form.requestTimeoutSeconds" class="w-full" :min="1" :max="30" :precision="0" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.cacheTtlMinutes')">
                <el-input-number v-model="form.cacheTtlMinutes" class="w-full" :min="1" :precision="0" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.failureCacheTtlMinutes')">
                <el-input-number v-model="form.failureCacheTtlMinutes" class="w-full" :min="1" :precision="0" />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <section class="geoip-settings__panel">
          <div class="geoip-settings__section-title">
            <div>
              <h3>{{ t('views.geoIpAccessControl.settings.sections.countryPolicy') }}</h3>
              <p>{{ t('views.geoIpAccessControl.settings.sectionDescriptions.countryPolicy') }}</p>
            </div>
          </div>

          <div class="geoip-settings__presets">
            <el-button size="small" @click="applyPreset('cnRegion')">
              {{ t('views.geoIpAccessControl.settings.presets.cnRegion') }}
            </el-button>
            <el-button size="small" @click="applyPreset('blockCommon')">
              {{ t('views.geoIpAccessControl.settings.presets.blockCommon') }}
            </el-button>
            <el-button size="small" @click="applyPreset('observeOnly')">
              {{ t('views.geoIpAccessControl.settings.presets.observeOnly') }}
            </el-button>
          </div>

          <el-row :gutter="16">
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.mode')">
                <el-select v-model="form.mode" class="w-full">
                  <el-option v-for="item in modeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.unknownCountryPolicy')">
                <el-select v-model="form.unknownCountryPolicy" class="w-full">
                  <el-option v-for="item in policyOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.privateIpPolicy')">
                <el-select v-model="form.privateIpPolicy" class="w-full">
                  <el-option v-for="item in policyOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.allowedCountryCodes')">
                <el-select
                  v-model="form.allowedCountryCodes"
                  class="w-full"
                  multiple
                  filterable
                  clearable
                  collapse-tags
                  collapse-tags-tooltip
                  :placeholder="t('views.geoIpAccessControl.settings.placeholders.countrySelect')"
                >
                  <el-option v-for="item in countryOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.blockedCountryCodes')">
                <el-select
                  v-model="form.blockedCountryCodes"
                  class="w-full"
                  multiple
                  filterable
                  clearable
                  collapse-tags
                  collapse-tags-tooltip
                  :placeholder="t('views.geoIpAccessControl.settings.placeholders.countrySelect')"
                >
                  <el-option v-for="item in countryOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <section class="geoip-settings__panel">
          <div class="geoip-settings__section-title">
            <div>
              <h3>{{ t('views.geoIpAccessControl.settings.sections.ipExceptions') }}</h3>
              <p>{{ t('views.geoIpAccessControl.settings.sectionDescriptions.ipExceptions') }}</p>
            </div>
            <el-button text size="small" @click="showAdvancedIpImport = !showAdvancedIpImport">
              {{ showAdvancedIpImport ? t('views.geoIpAccessControl.settings.actions.hideAdvanced') : t('views.geoIpAccessControl.settings.actions.showAdvanced') }}
            </el-button>
          </div>

          <div class="geoip-settings__exception-grid">
            <div class="geoip-settings__tag-box">
              <label>{{ t('views.geoIpAccessControl.settings.fields.ipAllowList') }}</label>
              <div class="geoip-settings__tag-list">
                <el-tag
                  v-for="item in form.ipAllowList"
                  :key="item"
                  closable
                  type="success"
                  effect="plain"
                  @close="removeIpEntry('allow', item)"
                >
                  {{ item }}
                </el-tag>
              </div>
              <div class="geoip-settings__inline-input">
                <el-input
                  v-model="newAllowIpEntry"
                  clearable
                  placeholder="127.0.0.1 or 192.168.1.0/24"
                  @keyup.enter="addIpEntry('allow')"
                />
                <el-button @click="addIpEntry('allow')">
                  {{ t('views.geoIpAccessControl.settings.actions.addEntry') }}
                </el-button>
              </div>
              <el-input
                v-if="showAdvancedIpImport"
                v-model="allowBulkText"
                type="textarea"
                :rows="3"
                class="mt-2"
                placeholder="127.0.0.1&#10;192.168.1.0/24"
              />
              <el-button v-if="showAdvancedIpImport" size="small" class="mt-2" @click="importIpEntries('allow')">
                {{ t('views.geoIpAccessControl.settings.actions.importEntries') }}
              </el-button>
            </div>

            <div class="geoip-settings__tag-box">
              <label>{{ t('views.geoIpAccessControl.settings.fields.ipBlockList') }}</label>
              <div class="geoip-settings__tag-list">
                <el-tag
                  v-for="item in form.ipBlockList"
                  :key="item"
                  closable
                  type="danger"
                  effect="plain"
                  @close="removeIpEntry('block', item)"
                >
                  {{ item }}
                </el-tag>
              </div>
              <div class="geoip-settings__inline-input">
                <el-input
                  v-model="newBlockIpEntry"
                  clearable
                  placeholder="203.0.113.10 or 198.51.100.0/24"
                  @keyup.enter="addIpEntry('block')"
                />
                <el-button @click="addIpEntry('block')">
                  {{ t('views.geoIpAccessControl.settings.actions.addEntry') }}
                </el-button>
              </div>
              <el-input
                v-if="showAdvancedIpImport"
                v-model="blockBulkText"
                type="textarea"
                :rows="3"
                class="mt-2"
                placeholder="203.0.113.10&#10;198.51.100.0/24"
              />
              <el-button v-if="showAdvancedIpImport" size="small" class="mt-2" @click="importIpEntries('block')">
                {{ t('views.geoIpAccessControl.settings.actions.importEntries') }}
              </el-button>
            </div>
          </div>

          <el-form-item class="mt-4" :label="t('views.geoIpAccessControl.settings.fields.kickMessage')">
            <el-input v-model="form.kickMessage" clearable />
          </el-form-item>
          <div class="geoip-settings__checks">
            <el-checkbox v-model="form.bypassAdmins">
              {{ t('views.geoIpAccessControl.settings.fields.bypassAdmins') }}
            </el-checkbox>
            <el-checkbox v-model="form.logAllowedDecisions">
              {{ t('views.geoIpAccessControl.settings.fields.logAllowedDecisions') }}
            </el-checkbox>
          </div>
        </section>
      </el-form>

      <section class="geoip-settings__runtime geoip-settings__panel">
        <div class="geoip-settings__section-title">
          <div>
            <h3>{{ t('views.geoIpAccessControl.settings.sections.status') }}</h3>
            <p>{{ t('views.geoIpAccessControl.settings.sectionDescriptions.status') }}</p>
          </div>
          <el-button size="small" :loading="isClearingCache" @click="clearCache">
            {{ t('views.geoIpAccessControl.settings.actions.clearCache') }}
          </el-button>
        </div>
        <div class="geoip-settings__stats">
          <el-statistic :title="t('views.geoIpAccessControl.settings.status.cacheCount')" :value="status?.cacheCount ?? 0" />
          <div class="geoip-settings__stat">
            <span>{{ t('views.geoIpAccessControl.settings.status.lastLookupAt') }}</span>
            <strong>{{ status?.lastLookupAt || '-' }}</strong>
          </div>
          <div class="geoip-settings__stat">
            <span>{{ t('views.geoIpAccessControl.settings.status.lastBlockedAt') }}</span>
            <strong>{{ status?.lastBlockedAt || '-' }}</strong>
          </div>
        </div>
        <el-alert v-if="status?.lastError" class="mt-3" type="warning" :closable="false" :title="status.lastError" />

        <div class="geoip-settings__test">
          <el-input v-model="testIp" clearable :placeholder="t('views.geoIpAccessControl.settings.placeholders.testIp')" />
          <el-button :loading="isTesting" @click="testLookup">
            {{ t('views.geoIpAccessControl.settings.actions.testLookup') }}
          </el-button>
        </div>
        <el-alert
          v-if="testDecisionSummary"
          class="mt-3"
          type="info"
          :closable="false"
          :title="testDecisionSummary"
        />
        <el-descriptions v-if="testResult" class="mt-3" :column="2" border>
          <el-descriptions-item label="IP">{{ testResult.ip }}</el-descriptions-item>
          <el-descriptions-item :label="t('views.geoIpAccessControl.settings.result.country')">
            {{ testResult.countryCode || '-' }} {{ testResult.countryName || '' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('views.geoIpAccessControl.settings.result.city')">{{ testResult.city || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('views.geoIpAccessControl.settings.result.provider')">{{ testResult.provider }}</el-descriptions-item>
        </el-descriptions>

        <el-table class="mt-4" :data="status?.recentDecisions ?? []" size="small">
          <el-table-column prop="timestamp" :label="t('views.geoIpAccessControl.settings.log.timestamp')" min-width="160" />
          <el-table-column prop="playerName" :label="t('views.geoIpAccessControl.settings.log.player')" min-width="140" />
          <el-table-column prop="ip" label="IP" min-width="130" />
          <el-table-column prop="countryCode" :label="t('views.geoIpAccessControl.settings.log.country')" width="100" />
          <el-table-column prop="reason" :label="t('views.geoIpAccessControl.settings.log.reason')" min-width="150" />
          <el-table-column :label="t('views.geoIpAccessControl.settings.log.decision')" width="120">
            <template #default="{ row }">
              <el-tag :type="decisionType(row.decision)" effect="plain">
                {{ row.decision }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <div class="geoip-settings__actions">
        <el-button :disabled="isSubmitting" @click="resetSettings">
          {{ t('common.reset') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" :disabled="!isDirty" @click="saveSettings">
          {{ t('common.save') }}
        </el-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.geoip-settings {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.geoip-settings__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.geoip-settings__header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.geoip-settings__header h2,
.geoip-settings h3 {
  margin: 0;
}

.geoip-settings__header p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
}

.geoip-settings__overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.geoip-settings__metric,
.geoip-settings__panel {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.geoip-settings__metric {
  min-width: 0;
  padding: 12px;
}

.geoip-settings__metric span,
.geoip-settings__section-title p,
.geoip-settings__tag-box label {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.geoip-settings__metric strong {
  display: block;
  margin-top: 8px;
  overflow-wrap: anywhere;
  font-size: 17px;
}

.geoip-settings__panel {
  padding: 16px;
}

.geoip-settings__section-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.geoip-settings__section-title p {
  margin: 6px 0 0;
}

.geoip-settings__provider-grid,
.geoip-settings__exception-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.geoip-settings__exception-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.geoip-settings__provider-card {
  display: flex;
  min-height: 86px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
  cursor: pointer;
  text-align: left;
}

.geoip-settings__provider-card.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.geoip-settings__provider-card strong,
.geoip-settings__provider-card small {
  display: block;
}

.geoip-settings__provider-card small {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  line-height: 1.45;
}

.geoip-settings__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.geoip-settings__tag-box {
  min-width: 0;
}

.geoip-settings__tag-list {
  display: flex;
  min-height: 38px;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 8px;
  margin: 8px 0;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
}

.geoip-settings__inline-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.geoip-settings__checks {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
}

.geoip-settings__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.geoip-settings__stat {
  min-width: 0;
  padding: 4px 0;
}

.geoip-settings__stat span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.geoip-settings__stat strong {
  display: block;
  margin-top: 8px;
  overflow-wrap: anywhere;
  font-size: 16px;
  font-weight: 600;
}

.geoip-settings__test {
  display: grid;
  grid-template-columns: minmax(180px, 320px) auto;
  gap: 10px;
  align-items: center;
  margin-top: 14px;
}

.geoip-settings__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 720px) {
  .geoip-settings__header,
  .geoip-settings__section-title,
  .geoip-settings__actions,
  .geoip-settings__header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .geoip-settings__overview,
  .geoip-settings__stats,
  .geoip-settings__test,
  .geoip-settings__provider-grid,
  .geoip-settings__exception-grid {
    grid-template-columns: 1fr;
  }
}
</style>
