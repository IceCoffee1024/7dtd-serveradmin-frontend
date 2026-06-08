<script setup lang="ts">
import type {
  FeatureModuleCommandDto,
  FeatureModuleConfigurationStatus,
  FeatureModuleHealth,
  FeatureModulePermissionDto,
  FeatureModuleRouteDto,
  FeatureModuleStatusDto,
  FeatureSubModuleStatusDto,
} from '~/generated/api/types.gen';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { usePopup } from '~/composables/usePopup';
import { featureModulesGetFeatureModules } from '~/generated/api/sdk.gen';
import { markIcon } from '~/utils';

defineOptions({ name: 'FeatureModulesPage' });

type FeatureModuleHealthPayload = FeatureModuleHealth | string | number | null | undefined;
type FeatureModuleConfigurationStatusPayload = FeatureModuleConfigurationStatus | string | number | null | undefined;

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const { toast } = usePopup();

const iconRefresh = markIcon(() => import('~icons/mdi/refresh'));
const iconOpen = markIcon(() => import('~icons/mdi/open-in-new'));
const iconDetails = markIcon(() => import('~icons/mdi/information-outline'));

const loading = ref(false);
const modules = ref<FeatureModuleStatusDto[]>([]);
const selectedModule = ref<FeatureModuleStatusDto | null>(null);
const detailVisible = ref(false);

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

function toModuleStatus(item: unknown): FeatureModuleStatusDto {
  return item as FeatureModuleStatusDto;
}

function getModuleName(item: unknown): string {
  const module = toModuleStatus(item);
  return module.definition?.labelKey == null
    ? t('views.featureModules.unknownModule')
    : t(module.definition.labelKey);
}

function getModuleRoutes(item: unknown): FeatureModuleRouteDto[] {
  const module = toModuleStatus(item);
  return (module.definition?.routes ?? []).filter(link => router.hasRoute(link.name));
}

function getSubModuleName(item: FeatureSubModuleStatusDto): string {
  return item.key.includes(':') ? item.key.split(':').at(-1)! : item.key;
}

function getEnabledSubModuleCount(item: unknown): number {
  const module = toModuleStatus(item);
  return module.subModules.filter(subModule => subModule.enabled).length;
}

function getSubModuleSummary(item: unknown): string {
  const module = toModuleStatus(item);
  return t('views.featureModules.countSummary', [
    getEnabledSubModuleCount(module),
    module.subModules.length,
  ]);
}

function getModuleCommands(item: unknown): FeatureModuleCommandDto[] {
  const module = toModuleStatus(item);
  return module.commands ?? [];
}

function getModulePermissions(item: unknown): FeatureModulePermissionDto[] {
  const module = toModuleStatus(item);
  return module.permissions ?? [];
}

function getEnabledCommandCount(item: unknown): number {
  return getModuleCommands(item).filter(command => command.enabled).length;
}

function getCommandSummary(item: unknown): string {
  const commands = getModuleCommands(item);
  return t('views.featureModules.countSummary', [
    getEnabledCommandCount(item),
    commands.length,
  ]);
}

function getCommandTagType(command: FeatureModuleCommandDto) {
  return command.enabled ? 'success' : 'info';
}

function getCommandDescription(command: FeatureModuleCommandDto): string {
  return command.descriptionKey == null ? '-' : t(command.descriptionKey);
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
    const { data } = await featureModulesGetFeatureModules({
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

function openRoute(link: FeatureModuleRouteDto) {
  void router.push({
    name: link.name,
    params: {
      locale: route.params.locale,
    },
  });
}

function openDetails(item: unknown) {
  selectedModule.value = toModuleStatus(item);
  detailVisible.value = true;
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

        <el-table-column :label="t('views.featureModules.columns.subModules')" width="130" align="center">
          <template #default="{ row }">
            <span v-if="row.subModules.length > 0" class="feature-modules-page__count">
              {{ getSubModuleSummary(row) }}
            </span>
            <span v-else class="text-sm text-gray-400">
              -
            </span>
          </template>
        </el-table-column>

        <el-table-column :label="t('views.featureModules.columns.commands')" width="130" align="center">
          <template #default="{ row }">
            <span v-if="getModuleCommands(row).length > 0" class="feature-modules-page__count">
              {{ getCommandSummary(row) }}
            </span>
            <span v-else class="text-sm text-gray-400">
              -
            </span>
          </template>
        </el-table-column>

        <el-table-column :label="t('views.featureModules.columns.actions')" width="300" fixed="right">
          <template #default="{ row }">
            <div class="feature-modules-page__actions">
              <el-button
                :icon="iconDetails"
                size="small"
                @click="openDetails(row)"
              >
                {{ t('views.featureModules.detailsAction') }}
              </el-button>
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

  <el-drawer
    v-model="detailVisible"
    :title="selectedModule == null ? t('views.featureModules.detail.title') : getModuleName(selectedModule)"
    size="520px"
    append-to-body
  >
    <div v-if="selectedModule != null" class="feature-module-detail">
      <section class="feature-module-detail__section">
        <h3>{{ t('views.featureModules.detail.overview') }}</h3>
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item :label="t('views.featureModules.columns.key')">
            <code>{{ selectedModule.key }}</code>
          </el-descriptions-item>
          <el-descriptions-item :label="t('views.featureModules.columns.status')">
            <el-tag :type="getHealthTagType(selectedModule.health)" effect="plain">
              {{ getHealthLabel(selectedModule.health) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('views.featureModules.columns.enabled')">
            <el-tag :type="selectedModule.enabled ? 'success' : 'info'" effect="plain">
              {{ selectedModule.enabled ? t('common.yes') : t('common.no') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('views.featureModules.columns.settingsType')">
            {{ selectedModule.settingsType ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('views.featureModules.columns.configuration')">
            <el-tag :type="getConfigurationTagType(getConfigurationStatus(selectedModule))" effect="plain">
              {{ getConfigurationText(selectedModule) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="feature-module-detail__section">
        <h3>{{ t('views.featureModules.detail.routes') }}</h3>
        <div v-if="getModuleRoutes(selectedModule).length > 0" class="feature-module-detail__list">
          <el-button
            v-for="link in getModuleRoutes(selectedModule)"
            :key="link.name"
            :icon="iconOpen"
            size="small"
            @click="openRoute(link)"
          >
            {{ t(link.labelKey) }}
          </el-button>
        </div>
        <el-empty v-else :description="t('views.featureModules.detail.emptyRoutes')" :image-size="72" />
      </section>

      <section class="feature-module-detail__section">
        <h3>{{ t('views.featureModules.columns.commands') }}</h3>
        <div v-if="getModuleCommands(selectedModule).length > 0" class="feature-module-detail__commands">
          <div
            v-for="command in getModuleCommands(selectedModule)"
            :key="command.name"
            class="feature-module-detail__command"
          >
            <div class="feature-module-detail__command-main">
              <el-tag :type="getCommandTagType(command)" effect="plain">
                {{ command.name }}
              </el-tag>
              <span v-if="command.aliases.length > 0" class="feature-module-detail__aliases">
                {{ t('views.featureModules.detail.aliases') }}: {{ command.aliases.join(', ') }}
              </span>
            </div>
            <p>{{ getCommandDescription(command) }}</p>
          </div>
        </div>
        <el-empty v-else :description="t('views.featureModules.emptyCommands')" :image-size="72" />
      </section>

      <section class="feature-module-detail__section">
        <h3>{{ t('views.featureModules.detail.permissions') }}</h3>
        <div v-if="getModulePermissions(selectedModule).length > 0" class="feature-module-detail__permissions">
          <div
            v-for="permission in getModulePermissions(selectedModule)"
            :key="permission.scope"
            class="feature-module-detail__permission"
          >
            <div class="feature-module-detail__permission-main">
              <strong>{{ t(permission.labelKey) }}</strong>
              <el-tag v-if="permission.requiresAuthentication" type="warning" effect="plain" size="small">
                {{ t('views.featureModules.permissionFlags.authenticated') }}
              </el-tag>
              <el-tag v-if="permission.requiresGameStartDone" type="info" effect="plain" size="small">
                {{ t('views.featureModules.permissionFlags.gameReady') }}
              </el-tag>
              <el-tag v-if="permission.permissionLevel != null" type="danger" effect="plain" size="small">
                {{ t('views.featureModules.permissionLevel', [permission.permissionLevel]) }}
              </el-tag>
            </div>
            <p>{{ t(permission.descriptionKey) }}</p>
          </div>
        </div>
        <el-empty v-else :description="t('views.featureModules.detail.emptyPermissions')" :image-size="72" />
      </section>

      <section class="feature-module-detail__section">
        <h3>{{ t('views.featureModules.columns.subModules') }}</h3>
        <div v-if="selectedModule.subModules.length > 0" class="feature-module-detail__tags">
          <el-tag
            v-for="subModule in selectedModule.subModules"
            :key="subModule.key"
            :type="getHealthTagType(subModule.health)"
            effect="plain"
          >
            {{ getSubModuleName(subModule) }}
          </el-tag>
        </div>
        <el-empty v-else :description="t('views.featureModules.emptySubModules')" :image-size="72" />
      </section>
    </div>
  </el-drawer>
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

.feature-modules-page__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.feature-modules-page__count {
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.feature-modules-page__status-detail {
  color: var(--el-text-color-regular);
}

.feature-modules-page__submodule-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 20px;
}

.feature-module-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-module-detail__section {
  display: flex;
  flex-direction: column;
  gap: 10px;

  h3 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 22px;
  }
}

.feature-module-detail__list,
.feature-module-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-module-detail__commands {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-module-detail__permissions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-module-detail__command,
.feature-module-detail__permission {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--el-fill-color-extra-light);

  p {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }
}

.feature-module-detail__command-main,
.feature-module-detail__permission-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-module-detail__aliases {
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
