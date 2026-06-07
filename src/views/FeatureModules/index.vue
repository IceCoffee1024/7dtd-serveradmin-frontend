<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { usePopup } from '~/composables/usePopup';
import { client } from '~/generated/api/client.gen';
import { markIcon } from '~/utils';

defineOptions({ name: 'FeatureModulesPage' });

type FeatureModuleHealth = 'Healthy' | 'Disabled' | 'Unavailable';
type FeatureModuleHealthPayload = FeatureModuleHealth | string | number | null | undefined;
type FeatureModuleConfigurationStatus = 'Ok' | 'Warning' | 'Unknown';
type FeatureModuleConfigurationStatusPayload = FeatureModuleConfigurationStatus | string | number | null | undefined;

interface FeatureSubModuleStatus {
  key: string;
  enabled: boolean;
  health: FeatureModuleHealthPayload;
  settingsType?: string | null;
}

interface FeatureModuleStatus {
  key: string;
  registered: boolean;
  enabled: boolean;
  health: FeatureModuleHealthPayload;
  settingsType?: string | null;
  subModules: FeatureSubModuleStatus[];
  configuration?: FeatureModuleConfiguration | null;
}

interface FeatureModuleRouteLink {
  name: string;
  labelKey: string;
}

interface FeatureModuleMeta {
  labelKey: string;
  routes: FeatureModuleRouteLink[];
}

interface FeatureModuleConfiguration {
  status: FeatureModuleConfigurationStatusPayload;
  messageCode?: string | null;
  args?: Array<string | number | null> | null;
}

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const { toast } = usePopup();

const iconRefresh = markIcon(() => import('~icons/mdi/refresh'));
const iconOpen = markIcon(() => import('~icons/mdi/open-in-new'));

const loading = ref(false);
const modules = ref<FeatureModuleStatus[]>([]);

const moduleMeta: Record<string, FeatureModuleMeta> = {
  'chat': {
    labelKey: 'menus.gameChat',
    routes: [
      { name: 'ChatSettings', labelKey: 'menus.chatSettings' },
      { name: 'LiveChat', labelKey: 'menus.liveChat' },
      { name: 'ChatHistory', labelKey: 'menus.chatHistory' },
    ],
  },
  'colored-chat': {
    labelKey: 'menus.coloredChat',
    routes: [{ name: 'ColoredChat', labelKey: 'menus.coloredChat' }],
  },
  'economy': {
    labelKey: 'menus.economy',
    routes: [
      { name: 'EconomyOverview', labelKey: 'menus.economyOverview' },
      { name: 'EconomySettings', labelKey: 'menus.economySettings' },
      { name: 'EconomyShop', labelKey: 'menus.economyShop' },
    ],
  },
  'backup': {
    labelKey: 'menus.backup',
    routes: [
      { name: 'BackupSettings', labelKey: 'menus.backupSettings' },
      { name: 'BackupTasks', labelKey: 'menus.backupTasks' },
      { name: 'BackupHistory', labelKey: 'menus.backupHistory' },
    ],
  },
  'restart': {
    labelKey: 'menus.restart',
    routes: [
      { name: 'RestartSettings', labelKey: 'menus.restartSettings' },
      { name: 'RestartRun', labelKey: 'menus.restartRun' },
      { name: 'RestartHistory', labelKey: 'menus.restartHistory' },
    ],
  },
  'scheduled-command': {
    labelKey: 'menus.scheduler',
    routes: [
      { name: 'SchedulerTasks', labelKey: 'menus.schedulerTasks' },
      { name: 'SchedulerHistory', labelKey: 'menus.schedulerHistory' },
      { name: 'SchedulerSettings', labelKey: 'menus.schedulerSettings' },
    ],
  },
  'teleport': {
    labelKey: 'menus.teleport',
    routes: [
      { name: 'TeleportSettings', labelKey: 'menus.teleportSettings' },
      { name: 'TeleportTools', labelKey: 'menus.teleportTools' },
      { name: 'TeleportLogs', labelKey: 'menus.teleportLogs' },
    ],
  },
  'game-notice': {
    labelKey: 'menus.gameNotice',
    routes: [{ name: 'GameNotice', labelKey: 'menus.gameNotice' }],
  },
  'vote-restart': {
    labelKey: 'menus.voteRestart',
    routes: [{ name: 'VoteRestartSettings', labelKey: 'menus.voteRestartSettings' }],
  },
  'vote-kick': {
    labelKey: 'menus.voteKick',
    routes: [{ name: 'VoteKickSettings', labelKey: 'menus.voteKickSettings' }],
  },
  'achievement': {
    labelKey: 'menus.achievement',
    routes: [
      { name: 'AchievementSettings', labelKey: 'menus.achievementSettings' },
      { name: 'AchievementDefinitions', labelKey: 'menus.achievementDefinitions' },
      { name: 'AchievementRecords', labelKey: 'menus.achievementRecords' },
    ],
  },
  'online-reward': {
    labelKey: 'menus.onlineReward',
    routes: [{ name: 'OnlineRewardSettings', labelKey: 'menus.onlineRewardSettings' }],
  },
};

const summary = computed(() => {
  const result = {
    total: modules.value.length,
    enabled: 0,
    disabled: 0,
    unavailable: 0,
  };

  for (const item of modules.value) {
    const health = normalizeHealth(item.health);
    if (health === 'Healthy')
      result.enabled += 1;
    else if (health === 'Unavailable')
      result.unavailable += 1;
    else
      result.disabled += 1;
  }

  return result;
});

function normalizeHealth(value: FeatureModuleHealthPayload): FeatureModuleHealth {
  if (typeof value === 'number') {
    if (value === 0)
      return 'Healthy';
    if (value === 1)
      return 'Disabled';
    return 'Unavailable';
  }

  const text = String(value ?? '').toLowerCase();
  if (text === 'healthy')
    return 'Healthy';
  if (text === 'disabled')
    return 'Disabled';
  return 'Unavailable';
}

function getHealthLabel(value: FeatureModuleHealthPayload): string {
  return t(`views.featureModules.status.${normalizeHealth(value).toLowerCase()}`);
}

function getHealthTagType(value: FeatureModuleHealthPayload) {
  const health = normalizeHealth(value);
  if (health === 'Healthy')
    return 'success';
  if (health === 'Disabled')
    return 'info';
  return 'danger';
}

function toModuleStatus(item: unknown): FeatureModuleStatus {
  return item as FeatureModuleStatus;
}

function getModuleName(item: unknown): string {
  const module = toModuleStatus(item);
  const meta = moduleMeta[module.key];
  return meta === undefined ? t('views.featureModules.unknownModule') : t(meta.labelKey);
}

function getModuleRoutes(item: unknown): FeatureModuleRouteLink[] {
  const module = toModuleStatus(item);
  return (moduleMeta[module.key]?.routes ?? []).filter(link => router.hasRoute(link.name));
}

function getSubModuleName(item: FeatureSubModuleStatus): string {
  return item.key.includes(':') ? item.key.split(':').at(-1)! : item.key;
}

function getEnabledSubModuleCount(item: unknown): number {
  const module = toModuleStatus(item);
  return module.subModules.filter(subModule => subModule.enabled).length;
}

function getStatusDetail(item: unknown): string {
  const module = toModuleStatus(item);
  const health = normalizeHealth(module.health);

  if (!module.registered || health === 'Unavailable')
    return t('views.featureModules.details.unavailable');

  if (health === 'Disabled')
    return t('views.featureModules.details.disabled');

  if (module.subModules.length > 0) {
    return t('views.featureModules.details.subModuleSummary', [
      getEnabledSubModuleCount(module),
      module.subModules.length,
    ]);
  }

  return t('views.featureModules.details.enabled');
}

function normalizeConfigurationStatus(value: FeatureModuleConfigurationStatusPayload): FeatureModuleConfigurationStatus {
  if (typeof value === 'number') {
    if (value === 0)
      return 'Ok';
    if (value === 1)
      return 'Warning';
    return 'Unknown';
  }

  const text = String(value ?? '').toLowerCase();
  if (text === 'ok')
    return 'Ok';
  if (text === 'warning')
    return 'Warning';
  return 'Unknown';
}

function getConfigurationStatus(item: unknown): FeatureModuleConfigurationStatus {
  const module = toModuleStatus(item);
  const health = normalizeHealth(module.health);

  if (!module.registered || health === 'Unavailable')
    return 'Unknown';

  if (health === 'Disabled')
    return 'Unknown';

  return normalizeConfigurationStatus(module.configuration?.status);
}

function getConfigurationText(item: unknown): string {
  const module = toModuleStatus(item);
  const health = normalizeHealth(module.health);

  if (!module.registered || health === 'Unavailable')
    return t('views.featureModules.configuration.notAvailable');

  if (health === 'Disabled')
    return t('views.featureModules.configuration.notApplicable');

  const messageCode = module.configuration?.messageCode;
  if (messageCode == null || messageCode.length === 0)
    return t('views.featureModules.configuration.notChecked');

  return t(`views.featureModules.configuration.${messageCode}`, module.configuration?.args ?? []);
}

function getConfigurationTagType(status: FeatureModuleConfigurationStatus) {
  if (status === 'Ok')
    return 'success';
  if (status === 'Warning')
    return 'warning';
  return 'info';
}

async function loadModules() {
  loading.value = true;
  try {
    const { data } = await client.get<FeatureModuleStatus[], unknown, true>({
      security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
      url: '/api/FeatureModules',
      throwOnError: true,
    });
    modules.value = data ?? [];
  }
  catch (error) {
    toast({
      type: 'error',
      text: error instanceof Error ? error.message : String(error),
    });
  }
  finally {
    loading.value = false;
  }
}

function openRoute(link: FeatureModuleRouteLink) {
  void router.push({
    name: link.name,
    params: {
      locale: route.params.locale,
    },
  });
}

onMounted(loadModules);
</script>

<template>
  <el-card class="feature-modules-page h-full min-h-0" shadow="never">
    <div class="flex flex-col gap-4 h-full min-h-0">
      <div class="feature-modules-page__header">
        <div>
          <h2 class="text-lg text-gray-800 leading-6 font-semibold dark:text-gray-100">
            {{ t('menus.featureModules') }}
          </h2>
          <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">
            {{ t('views.featureModules.description') }}
          </p>
        </div>

        <el-button :icon="iconRefresh" :loading="loading" @click="loadModules">
          {{ t('components.myTable.refresh') }}
        </el-button>
      </div>

      <div class="feature-modules-page__summary">
        <div class="feature-modules-page__summary-item">
          <span>{{ t('views.featureModules.summary.total') }}</span>
          <strong>{{ summary.total }}</strong>
        </div>
        <div class="feature-modules-page__summary-item is-success">
          <span>{{ t('views.featureModules.summary.enabled') }}</span>
          <strong>{{ summary.enabled }}</strong>
        </div>
        <div class="feature-modules-page__summary-item">
          <span>{{ t('views.featureModules.summary.disabled') }}</span>
          <strong>{{ summary.disabled }}</strong>
        </div>
        <div class="feature-modules-page__summary-item is-danger">
          <span>{{ t('views.featureModules.summary.unavailable') }}</span>
          <strong>{{ summary.unavailable }}</strong>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="modules"
        row-key="key"

        stripe border
        class="feature-modules-page__table"
      >
        <el-table-column :label="t('views.featureModules.columns.module')" min-width="180">
          <template #default="{ row }">
            <div class="feature-modules-page__module-name">
              <span>{{ getModuleName(row) }}</span>
              <code>{{ row.key }}</code>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="t('views.featureModules.columns.status')" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getHealthTagType(row.health)" effect="plain">
              {{ getHealthLabel(row.health) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('views.featureModules.columns.enabled')" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" effect="plain">
              {{ row.enabled ? t('common.yes') : t('common.no') }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          :label="t('views.featureModules.columns.details')"
          min-width="230"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="feature-modules-page__status-detail">
              {{ getStatusDetail(row) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column :label="t('views.featureModules.columns.configuration')" min-width="220">
          <template #default="{ row }">
            <el-tag :type="getConfigurationTagType(getConfigurationStatus(row))" effect="plain">
              {{ getConfigurationText(row) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('views.featureModules.columns.subModules')" min-width="220">
          <template #default="{ row }">
            <div v-if="row.subModules.length > 0" class="feature-modules-page__submodules">
              <span class="feature-modules-page__submodule-count">
                {{ getEnabledSubModuleCount(row) }}/{{ row.subModules.length }}
              </span>
              <el-tag
                v-for="subModule in row.subModules"
                :key="subModule.key"
                :type="getHealthTagType(subModule.health)"
                effect="plain"
                size="small"
              >
                {{ getSubModuleName(subModule) }}
              </el-tag>
            </div>
            <span v-else class="text-sm text-gray-400">
              {{ t('views.featureModules.emptySubModules') }}
            </span>
          </template>
        </el-table-column>

        <el-table-column :label="t('views.featureModules.columns.actions')" width="260" fixed="right">
          <template #default="{ row }">
            <div class="feature-modules-page__actions">
              <el-button
                v-for="link in getModuleRoutes(row)"
                :key="link.name"
                :icon="iconOpen"
                size="small"
                @click="openRoute(link)"
              >
                {{ t(link.labelKey) }}
              </el-button>
              <span v-if="getModuleRoutes(row).length === 0" class="text-sm text-gray-400">
                -
              </span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.feature-modules-page {
  overflow: hidden;

  :deep(.el-card__body) {
    height: 100%;
    min-height: 0;
  }
}

.feature-modules-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.feature-modules-page__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.feature-modules-page__summary-item {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 12px 14px;
  background: var(--el-fill-color-extra-light);

  span {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  strong {
    display: block;
    margin-top: 4px;
    color: var(--el-text-color-primary);
    font-size: 22px;
    line-height: 28px;
  }

  &.is-success strong {
    color: var(--el-color-success);
  }

  &.is-danger strong {
    color: var(--el-color-danger);
  }
}

.feature-modules-page__table {
  flex: 1;
  min-height: 320px;
}

.feature-modules-page__module-name {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;

  code {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.feature-modules-page__submodules,
.feature-modules-page__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.feature-modules-page__status-detail {
  color: var(--el-text-color-regular);
}

.feature-modules-page__submodule-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 20px;
}

@media (max-width: 768px) {
  .feature-modules-page {
    overflow: auto;
  }

  .feature-modules-page__header {
    align-items: stretch;
    flex-direction: column;
  }

  .feature-modules-page__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
