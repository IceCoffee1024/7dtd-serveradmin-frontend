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
  allowedCountryCodes: string;
  blockedCountryCodes: string;
  ipAllowList: string;
  ipBlockList: string;
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
const isDirty = computed(() => !isEqual(form, initialValues.value));

const providerOptions = computed(() => [
  { label: 'ipwho.is', value: 'IpWhoIs' },
  { label: 'ip-api.com', value: 'IpApi' },
  { label: 'ipinfo.io', value: 'IpInfo' },
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

function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    provider: 'IpWhoIs',
    ipInfoToken: '',
    cacheTtlMinutes: 1440,
    failureCacheTtlMinutes: 5,
    requestTimeoutSeconds: 2,
    mode: 'Disabled',
    allowedCountryCodes: '',
    blockedCountryCodes: '',
    ipAllowList: '',
    ipBlockList: '',
    unknownCountryPolicy: 'Allow',
    privateIpPolicy: 'Allow',
    bypassAdmins: true,
    kickMessage: 'Connection rejected by server GeoIP access policy.',
    logAllowedDecisions: false,
  };
}

function listToText(values: string[] | null | undefined): string {
  return (values ?? []).join('\n');
}

function textToList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
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
    allowedCountryCodes: listToText(data.allowedCountryCodes),
    blockedCountryCodes: listToText(data.blockedCountryCodes),
    ipAllowList: listToText(data.ipAllowList),
    ipBlockList: listToText(data.ipBlockList),
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
    allowedCountryCodes: textToList(values.allowedCountryCodes).map(item => item.toUpperCase()),
    blockedCountryCodes: textToList(values.blockedCountryCodes).map(item => item.toUpperCase()),
    ipAllowList: textToList(values.ipAllowList),
    ipBlockList: textToList(values.ipBlockList),
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
      <el-tag :type="form.isEnabled ? 'success' : 'info'" effect="plain">
        {{ form.isEnabled ? t('common.enabled') : t('common.disabled') }}
      </el-tag>
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

      <el-form label-position="top" class="geoip-settings__form">
        <section>
          <h3>{{ t('views.geoIpAccessControl.settings.sections.provider') }}</h3>
          <el-row :gutter="16">
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.isEnabled')">
                <el-switch
                  v-model="form.isEnabled"
                  inline-prompt
                  :active-text="t('common.yes')"
                  :inactive-text="t('common.no')"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.provider')">
                <el-select v-model="form.provider" class="w-full">
                  <el-option v-for="item in providerOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
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

        <section>
          <h3>{{ t('views.geoIpAccessControl.settings.sections.countryPolicy') }}</h3>
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
                <el-input v-model="form.allowedCountryCodes" type="textarea" :rows="4" placeholder="US, JP, KR" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.blockedCountryCodes')">
                <el-input v-model="form.blockedCountryCodes" type="textarea" :rows="4" placeholder="CN, RU" />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <section>
          <h3>{{ t('views.geoIpAccessControl.settings.sections.ipExceptions') }}</h3>
          <el-row :gutter="16">
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.ipAllowList')">
                <el-input v-model="form.ipAllowList" type="textarea" :rows="4" placeholder="127.0.0.1&#10;192.168.1.0/24" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.ipBlockList')">
                <el-input v-model="form.ipBlockList" type="textarea" :rows="4" placeholder="203.0.113.10&#10;198.51.100.0/24" />
              </el-form-item>
            </el-col>
            <el-col :xs="24">
              <el-form-item :label="t('views.geoIpAccessControl.settings.fields.kickMessage')">
                <el-input v-model="form.kickMessage" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="24">
              <el-checkbox v-model="form.bypassAdmins">
                {{ t('views.geoIpAccessControl.settings.fields.bypassAdmins') }}
              </el-checkbox>
            </el-col>
            <el-col :xs="24">
              <el-checkbox v-model="form.logAllowedDecisions">
                {{ t('views.geoIpAccessControl.settings.fields.logAllowedDecisions') }}
              </el-checkbox>
            </el-col>
          </el-row>
        </section>
      </el-form>

      <section class="geoip-settings__runtime">
        <div class="geoip-settings__section-title">
          <h3>{{ t('views.geoIpAccessControl.settings.sections.status') }}</h3>
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

.geoip-settings__header h2,
.geoip-settings h3 {
  margin: 0;
}

.geoip-settings__header p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
}

.geoip-settings section {
  margin-top: 18px;
}

.geoip-settings__section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
  .geoip-settings__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .geoip-settings__stats,
  .geoip-settings__test {
    grid-template-columns: 1fr;
  }
}
</style>
