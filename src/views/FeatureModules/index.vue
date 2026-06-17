<script setup lang="ts">
import type {
  FeatureModuleCapabilityDto,
  FeatureModuleCommandDto,
  FeatureModuleConfigurationIssueSeverity,
  FeatureModuleConfigurationStatus,
  FeatureModuleConsoleCommandPolicyDto,
  FeatureModuleDependencyDto,
  FeatureModuleHealth,
  FeatureModuleHealthIssueDto,
  FeatureModuleHealthIssueSource,
  FeatureModulePermissionDto,
  FeatureModuleRouteDto,
  FeatureModuleSecurityActionDto,
  FeatureModuleSecurityPolicyDto,
  FeatureModuleSettingsFieldDto,
  FeatureModuleSettingsSchemaDto,
  FeatureModuleStatusDto,
  FeatureSubModuleStatusDto,
  ModuleStateCleanupRequestDto,
  ModuleStateDto,
} from '~/generated/api/types.gen';
import { useWindowSize } from '@vueuse/core';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { usePopup } from '~/composables/usePopup';
import {
  featureModulesCleanupStates,
  featureModulesDisableModule,
  featureModulesEnableModule,
  featureModulesGetFeatureModules,
  featureModulesGetStates,
  featureModulesValidateSettings,
} from '~/generated/api/sdk.gen';
import { markIcon } from '~/utils';

defineOptions({ name: 'FeatureModulesPage' });

type FeatureModuleHealthPayload = FeatureModuleHealth | string | number | null | undefined;
type FeatureModuleConfigurationStatusPayload = FeatureModuleConfigurationStatus | string | number | null | undefined;
type FeatureModuleConfigurationIssueSeverityPayload = FeatureModuleConfigurationIssueSeverity | string | number | null | undefined;
type FeatureModuleHealthIssueSourcePayload = FeatureModuleHealthIssueSource | string | number | null | undefined;
type ModuleFilter = 'all' | 'disabled' | 'enabled' | 'issues' | 'unavailable';
type ModuleStateCategory = 'all' | 'runtime' | 'history' | 'cooldown' | 'reward' | 'request' | 'cache' | 'firstJoin' | 'other';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const { confirm, toast } = usePopup();
const { width: windowWidth } = useWindowSize();

const iconRefresh = markIcon(() => import('~icons/mdi/refresh'));
const iconOpen = markIcon(() => import('~icons/mdi/open-in-new'));
const iconDetails = markIcon(() => import('~icons/mdi/information-outline'));
const iconValidate = markIcon(() => import('~icons/mdi/check-circle-outline'));
const iconPower = markIcon(() => import('~icons/mdi/power'));
const issueSeverities: FeatureModuleConfigurationIssueSeverity[] = ['Error', 'Warning', 'Info'];

const loading = ref(false);
const actionLoadingKey = ref('');
const modules = ref<FeatureModuleStatusDto[]>([]);
const selectedModule = ref<FeatureModuleStatusDto | null>(null);
const detailVisible = ref(false);
const moduleStates = ref<ModuleStateDto[]>([]);
const moduleStateTotal = ref(0);
const moduleStateLoading = ref(false);
const moduleStateCleanupLoading = ref(false);
const moduleStateCategory = ref<ModuleStateCategory>('all');
const moduleStateKeyword = ref('');
const moduleStateCleanupScope = ref('');
const filter = ref<ModuleFilter>('all');
const keyword = ref('');
const issueFirst = ref(true);
const detailDrawerSize = computed(() => {
  if (windowWidth.value <= 768)
    return '100%';
  if (windowWidth.value <= 1280)
    return '760px';
  return '960px';
});
const isCompactViewport = computed(() => windowWidth.value <= 1280);

const moduleStateCategoryOptions = computed(() => [
  { label: t('views.featureModules.state.categories.all'), value: 'all' },
  { label: t('views.featureModules.state.categories.runtime'), value: 'runtime' },
  { label: t('views.featureModules.state.categories.history'), value: 'history' },
  { label: t('views.featureModules.state.categories.cooldown'), value: 'cooldown' },
  { label: t('views.featureModules.state.categories.reward'), value: 'reward' },
  { label: t('views.featureModules.state.categories.request'), value: 'request' },
  { label: t('views.featureModules.state.categories.cache'), value: 'cache' },
  { label: t('views.featureModules.state.categories.firstJoin'), value: 'firstJoin' },
  { label: t('views.featureModules.state.categories.other'), value: 'other' },
]);

const moduleStateCleanupScopeOptions = computed(() => getModuleStateScopeSummaries().map(item => ({
  label: `${item.scope} (${item.total})`,
  value: item.scope,
})));

const filteredModuleStates = computed(() => {
  const normalizedKeyword = moduleStateKeyword.value.trim().toLowerCase();
  return moduleStates.value.filter((row) => {
    if (moduleStateCategory.value !== 'all' && getModuleStateCategory(row) !== moduleStateCategory.value) {
      return false;
    }

    if (normalizedKeyword.length === 0) {
      return true;
    }

    return [
      row.scope,
      row.scopeKey,
      row.stateKey,
      row.valueJson,
      formatModuleStateValue(row.valueJson),
      getModuleStateReadableValue(row),
    ].some(value => String(value ?? '').toLowerCase().includes(normalizedKeyword));
  });
});

const moduleStateOverview = computed(() => {
  const latestUpdatedAt = moduleStates.value
    .map(row => row.updatedAt)
    .filter((value): value is string => value != null && value.length > 0)
    .sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf())
    .at(0);

  return {
    total: moduleStateTotal.value,
    loaded: moduleStates.value.length,
    runtime: getModuleStateCountByCategory('runtime'),
    history: getModuleStateCountByCategory('history'),
    cooldown: getModuleStateCountByCategory('cooldown'),
    reward: getModuleStateCountByCategory('reward'),
    request: getModuleStateCountByCategory('request'),
    cache: getModuleStateCountByCategory('cache'),
    firstJoin: getModuleStateCountByCategory('firstJoin'),
    other: getModuleStateCountByCategory('other'),
    latestUpdatedAt,
  };
});

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

const filteredModules = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();
  const items = modules.value.filter((item) => {
    if (!matchesFilter(item))
      return false;

    if (normalizedKeyword.length === 0)
      return true;

    return item.key.toLowerCase().includes(normalizedKeyword)
      || getModuleName(item).toLowerCase().includes(normalizedKeyword);
  });

  return [...items].sort((a, b) => {
    if (issueFirst.value) {
      const issueDiff = getModuleIssueCount(b) - getModuleIssueCount(a);
      if (issueDiff !== 0)
        return issueDiff;
    }

    return getModuleName(a).localeCompare(getModuleName(b));
  });
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

function getModuleDefinition(item: unknown): FeatureModuleStatusDto['definition'] | null {
  const module = toModuleStatus(item);
  return module.definition ?? null;
}

function matchesFilter(item: FeatureModuleStatusDto): boolean {
  const health = normalizeHealth(item.health);
  if (filter.value === 'enabled')
    return health === 'Healthy';
  if (filter.value === 'disabled')
    return health === 'Disabled';
  if (filter.value === 'unavailable')
    return health === 'Unavailable';
  if (filter.value === 'issues')
    return getModuleIssueCount(item) > 0;
  return true;
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

function getConfigurationIssueCount(item: unknown): number {
  const module = toModuleStatus(item);
  return module.configuration?.issueCount ?? module.configuration?.issues?.length ?? 0;
}

function getModuleIssueCount(item: unknown): number {
  const healthIssues = getModuleHealthIssues(item);
  if (healthIssues.length > 0) {
    return healthIssues.filter(issue => normalizeIssueSeverity(issue.severity) !== 'Info').length;
  }

  return getConfigurationIssueCount(item) + getRequiredDependencyIssueCount(item);
}

function getConfigurationCheckedAt(item: unknown): string {
  const module = toModuleStatus(item);
  return module.configuration?.checkedAt == null
    ? '-'
    : dayjs(module.configuration.checkedAt).format('YYYY-MM-DD HH:mm:ss');
}

function getModuleHealthIssues(item: unknown): FeatureModuleHealthIssueDto[] {
  const module = toModuleStatus(item);
  return module.healthIssues ?? [];
}

function getHealthIssuesBySeverity(item: unknown, severity: FeatureModuleConfigurationIssueSeverity): FeatureModuleHealthIssueDto[] {
  return getModuleHealthIssues(item)
    .filter(issue => normalizeIssueSeverity(issue.severity) === severity);
}

function getPrimaryHealthIssue(item: unknown): FeatureModuleHealthIssueDto | null {
  const issues = getModuleHealthIssues(item);
  const nonConfigurationIssues = issues.filter(issue => normalizeHealthIssueSource(issue.source) !== 'Configuration');
  const candidates = nonConfigurationIssues.length > 0 ? nonConfigurationIssues : issues;
  for (const severity of issueSeverities) {
    const issue = candidates.find(item => normalizeIssueSeverity(item.severity) === severity);
    if (issue != null)
      return issue;
  }

  return null;
}

function normalizeHealthIssueSource(source: FeatureModuleHealthIssueSourcePayload): FeatureModuleHealthIssueSource {
  if (typeof source === 'number') {
    if (source === 1)
      return 'Configuration';
    if (source === 2)
      return 'Dependency';
    if (source === 3)
      return 'RuntimeState';
    if (source === 4)
      return 'Security';
    return 'Availability';
  }

  const text = String(source ?? '').toLowerCase();
  if (text === 'configuration')
    return 'Configuration';
  if (text === 'dependency')
    return 'Dependency';
  if (text === 'runtimestate')
    return 'RuntimeState';
  if (text === 'security')
    return 'Security';
  return 'Availability';
}

function getHealthIssueSourceLabel(source: FeatureModuleHealthIssueSourcePayload): string {
  return t(`views.featureModules.healthIssueSources.${normalizeHealthIssueSource(source)}`);
}

function getHealthIssueText(issue: FeatureModuleHealthIssueDto): string {
  const source = normalizeHealthIssueSource(issue.source);
  if (issue.messageCode == null || issue.messageCode.length === 0)
    return issue.code ?? '-';

  if (source === 'Configuration') {
    return t(`views.featureModules.configuration.${issue.messageCode}`, issue.args ?? []);
  }

  if (source === 'Dependency' && (issue.args?.length ?? 0) >= 2) {
    const label = t(issue.args![0]);
    return t(`views.featureModules.healthIssues.${issue.messageCode}`, [
      label === issue.args![0] ? issue.args![1] : label,
    ]);
  }

  return t(`views.featureModules.healthIssues.${issue.messageCode}`, issue.args ?? []);
}

function getHealthIssueSuggestionText(issue: FeatureModuleHealthIssueDto): string {
  const suggestionCode = issue.suggestionCode;
  if (suggestionCode == null || suggestionCode.length === 0)
    return '';

  return t(`views.featureModules.healthIssueSuggestions.${suggestionCode}`, issue.suggestionArgs ?? []);
}

function canOpenHealthIssueFix(issue: FeatureModuleHealthIssueDto): boolean {
  const routeName = issue.fixRouteName;
  return routeName != null && routeName.length > 0 && router.hasRoute(routeName);
}

function getHealthIssueFixLabel(issue: FeatureModuleHealthIssueDto): string {
  const labelKey = issue.fixLabelKey;
  return labelKey == null || labelKey.length === 0
    ? t('views.featureModules.healthIssueFixes.open')
    : t(labelKey);
}

function openHealthIssueFix(issue: FeatureModuleHealthIssueDto) {
  const routeName = issue.fixRouteName;
  if (routeName == null || routeName.length === 0 || router.hasRoute(routeName) === false)
    return;

  void router.push({
    name: routeName,
    params: {
      locale: route.params.locale,
    },
  });
}

function getHealthIssueKey(issue: FeatureModuleHealthIssueDto): string {
  return [
    normalizeHealthIssueSource(issue.source),
    issue.code,
    issue.messageCode,
    issue.relatedModuleKey,
    issue.relatedStateScope,
  ].filter(Boolean).join(':');
}

function getIssueTagType(severity: FeatureModuleConfigurationIssueSeverityPayload) {
  if (typeof severity === 'number') {
    if (severity === 1)
      return 'warning';
    if (severity === 2)
      return 'danger';
    return 'info';
  }

  const text = String(severity ?? '').toLowerCase();
  if (text === 'warning')
    return 'warning';
  if (text === 'error')
    return 'danger';
  return 'info';
}

function normalizeIssueSeverity(severity: FeatureModuleConfigurationIssueSeverityPayload): FeatureModuleConfigurationIssueSeverity {
  if (typeof severity === 'number') {
    if (severity === 1)
      return 'Warning';
    if (severity === 2)
      return 'Error';
    return 'Info';
  }

  const text = String(severity ?? '').toLowerCase();
  if (text === 'warning')
    return 'Warning';
  if (text === 'error')
    return 'Error';
  return 'Info';
}

function getIssueSeverityLabel(severity: FeatureModuleConfigurationIssueSeverityPayload): string {
  if (typeof severity === 'number') {
    if (severity === 1)
      return t('views.featureModules.issueSeverity.warning');
    if (severity === 2)
      return t('views.featureModules.issueSeverity.error');
    return t('views.featureModules.issueSeverity.info');
  }

  const text = String(severity ?? '').toLowerCase();
  if (text === 'warning')
    return t('views.featureModules.issueSeverity.warning');
  if (text === 'error')
    return t('views.featureModules.issueSeverity.error');
  return t('views.featureModules.issueSeverity.info');
}

function getModuleCapabilities(item: unknown): FeatureModuleCapabilityDto[] {
  return getModuleDefinition(item)?.capabilities ?? [];
}

function getModuleDependencies(item: unknown): FeatureModuleDependencyDto[] {
  return getModuleDefinition(item)?.dependencies ?? [];
}

function getModuleHookTypes(item: unknown): FeatureModuleCapabilityDto[] {
  return getModuleDefinition(item)?.hookTypes ?? [];
}

function getModuleActionTypes(item: unknown): FeatureModuleCapabilityDto[] {
  return getModuleDefinition(item)?.actionTypes ?? [];
}

function getModuleTemplates(item: unknown): FeatureModuleCapabilityDto[] {
  return getModuleDefinition(item)?.templates ?? [];
}

function getModuleStateScopes(item: unknown): FeatureModuleCapabilityDto[] {
  return getModuleDefinition(item)?.stateScopes ?? [];
}

function getModuleSettingsFields(item: unknown): FeatureModuleSettingsFieldDto[] {
  return toModuleStatus(item).settingsFields ?? [];
}

function toSettingsField(row: unknown): FeatureModuleSettingsFieldDto {
  return row as FeatureModuleSettingsFieldDto;
}

function getModuleSettingsSchema(item: unknown): FeatureModuleSettingsSchemaDto {
  const module = toModuleStatus(item);
  const fields = getModuleSettingsFields(module);
  return module.settingsSchema ?? {
    totalFieldCount: fields.length,
    enableFlagCount: fields.filter(field => field.isEnableFlag).length,
    sensitiveFieldCount: fields.filter(field => field.isSensitive).length,
    advancedFieldCount: fields.filter(field => field.isAdvanced).length,
    collectionFieldCount: fields.filter(field => field.isCollection).length,
    groupKeys: [...new Set(fields.map(field => field.groupKey).filter((key): key is string => key != null && key.length > 0))],
  };
}

function getCapabilityLabel(capability: FeatureModuleCapabilityDto): string {
  return capability.labelKey == null || capability.labelKey.length === 0
    ? capability.key
    : t(capability.labelKey);
}

function getDependencyLabel(dependency: FeatureModuleDependencyDto): string {
  return dependency.labelKey == null || dependency.labelKey.length === 0
    ? dependency.key
    : t(dependency.labelKey);
}

function getDependencyModule(dependency: FeatureModuleDependencyDto): FeatureModuleStatusDto | null {
  return modules.value.find(module => module.key === dependency.key) ?? null;
}

function getDependencyHealth(dependency: FeatureModuleDependencyDto): FeatureModuleHealth {
  const module = getDependencyModule(dependency);
  return module == null ? 'Unavailable' : normalizeHealth(module.health);
}

function hasRequiredDependencyIssue(dependency: FeatureModuleDependencyDto): boolean {
  return dependency.required && getDependencyHealth(dependency) !== 'Healthy';
}

function getRequiredDependencyIssueCount(item: unknown): number {
  return getModuleDependencies(item).filter(hasRequiredDependencyIssue).length;
}

function getDependencyTagType(dependency: FeatureModuleDependencyDto) {
  if (hasRequiredDependencyIssue(dependency))
    return 'danger';
  return dependency.required ? 'warning' : 'info';
}

function getDependencyStatusLabel(dependency: FeatureModuleDependencyDto): string {
  const health = getDependencyHealth(dependency);
  if (health === 'Healthy')
    return t('views.featureModules.dependencies.statusHealthy');
  if (health === 'Disabled')
    return t('views.featureModules.dependencies.statusDisabled');
  return t('views.featureModules.dependencies.statusUnavailable');
}

function toModuleStateRow(row: unknown): ModuleStateDto {
  return row as ModuleStateDto;
}

function parseModuleStateValue(valueJson: string): unknown {
  if (valueJson.length === 0)
    return null;

  try {
    return JSON.parse(valueJson);
  }
  catch {
    return valueJson;
  }
}

function formatModuleStateValue(valueJson: string): string {
  if (valueJson.length === 0)
    return '-';

  try {
    const parsed = JSON.parse(valueJson);
    if (typeof parsed === 'string')
      return parsed;

    return JSON.stringify(parsed);
  }
  catch {
    return valueJson;
  }
}

function getModuleStateCategory(row: ModuleStateDto): ModuleStateCategory {
  const scope = row.scope.toLowerCase();
  const stateKey = row.stateKey.toLowerCase();
  if (scope.includes('runtime'))
    return 'runtime';
  if (scope.includes('history'))
    return 'history';
  if (scope.includes('cooldown'))
    return 'cooldown';
  if (scope.includes('reward') || scope.includes('daily') || scope.includes('streak') || stateKey.includes('daily') || stateKey.includes('claim'))
    return 'reward';
  if (scope.includes('request'))
    return 'request';
  if (scope.includes('cache') || scope.includes('decision'))
    return 'cache';
  if (scope.includes('firstjoin') || scope.includes('first_join'))
    return 'firstJoin';
  return 'other';
}

function getModuleStateCategoryLabel(row: ModuleStateDto): string {
  return t(`views.featureModules.state.categories.${getModuleStateCategory(row)}`);
}

function getModuleStateCategoryTagType(row: ModuleStateDto) {
  const category = getModuleStateCategory(row);
  if (category === 'runtime')
    return 'primary';
  if (category === 'history')
    return 'danger';
  if (category === 'cooldown')
    return 'warning';
  if (category === 'reward')
    return 'success';
  if (category === 'request')
    return 'warning';
  if (category === 'cache')
    return 'info';
  if (category === 'firstJoin')
    return 'success';
  return 'info';
}

function getModuleStateCountByCategory(category: ModuleStateCategory): number {
  return moduleStates.value.filter(row => getModuleStateCategory(row) === category).length;
}

function formatModuleStateTime(value: string | null | undefined): string {
  return value == null ? '-' : dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

function formatDurationFromNow(value: string): string {
  const timestamp = dayjs(value);
  if (!timestamp.isValid())
    return '-';

  const seconds = Math.max(0, dayjs().diff(timestamp, 'second'));
  if (seconds < 60)
    return t('views.featureModules.state.duration.seconds', [seconds]);

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return t('views.featureModules.state.duration.minutes', [minutes]);

  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return t('views.featureModules.state.duration.hours', [hours]);

  return t('views.featureModules.state.duration.days', [Math.floor(hours / 24)]);
}

function readDateTimeFromStateValue(value: unknown): string | null {
  if (typeof value === 'string') {
    return dayjs(value).isValid() ? value : null;
  }

  if (value != null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['completedAt', 'lastTriggeredAt', 'claimedAt', 'updatedAt', 'UpdatedAt', 'timestamp', 'Timestamp', 'lastUseAt', 'LastUseAt', 'lastRewardAt', 'LastRewardAt', 'awardedAt', 'AwardedAt', 'startedAt', 'StartedAt', 'endedAt', 'EndedAt', 'fetchedAt', 'FetchedAt']) {
      const fieldValue = record[key];
      if (typeof fieldValue === 'string' && dayjs(fieldValue).isValid()) {
        return fieldValue;
      }
    }
  }

  return null;
}

function getModuleStateReadableValue(row: ModuleStateDto): string {
  const parsedValue = parseModuleStateValue(row.valueJson);
  const timestamp = readDateTimeFromStateValue(parsedValue);
  const category = getModuleStateCategory(row);

  if (parsedValue != null && typeof parsedValue === 'object') {
    const record = parsedValue as Record<string, unknown>;
    if (category === 'runtime') {
      return t('views.featureModules.state.readable.runtime', [
        String(record.State ?? record.state ?? '-'),
        String(record.Message ?? record.message ?? '-'),
      ]);
    }

    if (category === 'history') {
      return t('views.featureModules.state.readable.history', [
        String(record.TaskName ?? record.taskName ?? '-'),
        String(record.Status ?? record.status ?? '-'),
        String(record.Summary ?? record.summary ?? '-'),
      ]);
    }

    if (category === 'request') {
      return t('views.featureModules.state.readable.request', [
        String(record.Status ?? record.status ?? '-'),
        String(record.SourcePlayerName ?? record.sourcePlayerName ?? record.SourcePlayerId ?? record.sourcePlayerId ?? '-'),
        String(record.TargetPlayerName ?? record.targetPlayerName ?? record.TargetPlayerId ?? record.targetPlayerId ?? '-'),
      ]);
    }

    if (category === 'cache') {
      return t('views.featureModules.state.readable.cache', [
        String(record.Provider ?? record.provider ?? row.scope),
        String(record.CountryCode ?? record.countryCode ?? record.Decision ?? record.decision ?? '-'),
        timestamp == null ? '-' : formatModuleStateTime(timestamp),
      ]);
    }
  }

  if (category === 'cooldown' && timestamp != null) {
    return t('views.featureModules.state.readable.cooldown', [
      formatModuleStateTime(timestamp),
      formatDurationFromNow(timestamp),
    ]);
  }

  if (category === 'firstJoin') {
    const playerName = parsedValue != null && typeof parsedValue === 'object'
      ? (parsedValue as Record<string, unknown>).playerName
      : null;
    return t('views.featureModules.state.readable.firstJoin', [
      timestamp == null ? '-' : formatModuleStateTime(timestamp),
      typeof playerName === 'string' && playerName.length > 0 ? playerName : '-',
    ]);
  }

  if (category === 'reward' && timestamp != null) {
    return t('views.featureModules.state.readable.reward', [
      formatModuleStateTime(timestamp),
      formatDurationFromNow(timestamp),
    ]);
  }

  return formatModuleStateValue(row.valueJson);
}

function getModuleStateScopeSummaries() {
  return [...moduleStates.value.reduce((map, row) => {
    const current = map.get(row.scope);
    const updatedAt = row.updatedAt ?? '';
    if (current == null) {
      map.set(row.scope, {
        scope: row.scope,
        total: 1,
        latestUpdatedAt: updatedAt,
      });
      return map;
    }

    current.total += 1;
    if (dayjs(updatedAt).isAfter(dayjs(current.latestUpdatedAt))) {
      current.latestUpdatedAt = updatedAt;
    }
    return map;
  }, new Map<string, { scope: string; total: number; latestUpdatedAt: string }>()).values()];
}

function getSettingsFieldTypeLabel(type: string): string {
  const key = `views.featureModules.settingTypes.${type.toLowerCase()}`;
  const label = t(key);
  return label === key ? type : label;
}

function getSettingsFieldGroupLabel(field: FeatureModuleSettingsFieldDto): string {
  const key = field.groupKey ?? 'views.featureModules.settingsSchema.groups.general';
  const label = t(key);
  return label === key ? key.split('.').at(-1) ?? field.name : label;
}

function getSettingsSchemaGroupLabels(item: unknown): string {
  const groups = getModuleSettingsSchema(item).groupKeys.map((key) => {
    const label = t(key);
    return label === key ? key.split('.').at(-1) ?? key : label;
  });

  return groups.length === 0 ? '-' : groups.join(' / ');
}

function getSecurityPolicy(item: unknown): FeatureModuleSecurityPolicyDto {
  return getModuleDefinition(item)?.securityPolicy ?? {
    sensitiveActions: [],
    auditedActions: [],
    consoleCommandPolicy: {
      supportsConsoleCommands: false,
      requiresAllowList: false,
      requiresUnsafeOptIn: false,
      defaultAllowedCommands: [],
    },
  };
}

function getSensitiveActions(item: unknown): FeatureModuleSecurityActionDto[] {
  return getSecurityPolicy(item).sensitiveActions ?? [];
}

function getAuditedActions(item: unknown): FeatureModuleSecurityActionDto[] {
  return getSecurityPolicy(item).auditedActions ?? [];
}

function getConsoleCommandPolicy(item: unknown): FeatureModuleConsoleCommandPolicyDto {
  return getSecurityPolicy(item).consoleCommandPolicy ?? {
    supportsConsoleCommands: false,
    requiresAllowList: false,
    requiresUnsafeOptIn: false,
    defaultAllowedCommands: [],
  };
}

function hasSecurityPolicy(item: unknown): boolean {
  const policy = getSecurityPolicy(item);
  return (policy.sensitiveActions?.length ?? 0) > 0
    || (policy.auditedActions?.length ?? 0) > 0
    || policy.consoleCommandPolicy?.supportsConsoleCommands === true;
}

function getSecurityActionLabel(action: FeatureModuleSecurityActionDto): string {
  if (action.labelKey == null || action.labelKey.length === 0)
    return action.key;

  const label = t(action.labelKey);
  return label === action.labelKey ? action.key : label;
}

function getConsoleCommandPolicyTags(item: unknown): string[] {
  const policy = getConsoleCommandPolicy(item);
  if (!policy.supportsConsoleCommands)
    return [t('views.featureModules.security.consoleUnsupported')];

  return [
    policy.requiresAllowList
      ? t('views.featureModules.security.allowListRequired')
      : t('views.featureModules.security.allowListNotRequired'),
    policy.requiresUnsafeOptIn
      ? t('views.featureModules.security.unsafeOptInRequired')
      : t('views.featureModules.security.unsafeOptInNotRequired'),
  ];
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
    const selectedKey = selectedModule.value?.key;
    const { data } = await featureModulesGetFeatureModules({
      throwOnError: true,
    });
    modules.value = data ?? [];
    if (selectedKey != null) {
      selectedModule.value = modules.value.find(item => item.key === selectedKey) ?? selectedModule.value;
    }
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

async function loadModuleStates(moduleKey: string) {
  moduleStateLoading.value = true;
  moduleStates.value = [];
  moduleStateTotal.value = 0;
  moduleStateCleanupScope.value = '';
  try {
    const data = await fetchModuleStates(moduleKey, -1) ?? await fetchModuleStates(moduleKey, 100);
    moduleStates.value = data?.items ?? [];
    moduleStateTotal.value = data?.total ?? 0;
  }
  catch (error) {
    toast({
      type: 'error',
      text: error instanceof Error ? error.message : String(error),
    });
  }
  finally {
    moduleStateLoading.value = false;
  }
}

function buildModuleStateCleanupRequest(): ModuleStateCleanupRequestDto | null {
  const scope = moduleStateCleanupScope.value.trim();
  const keyword = moduleStateKeyword.value.trim();
  const request: ModuleStateCleanupRequestDto = {
    previewOnly: true,
  };

  if (scope.length > 0) {
    request.scope = scope;
  }

  if (keyword.length >= 3) {
    request.keyword = keyword;
  }

  return request.scope == null && request.keyword == null ? null : request;
}

async function cleanupModuleStates(moduleKey: string, request: ModuleStateCleanupRequestDto) {
  const { data } = await featureModulesCleanupStates({
    path: {
      key: moduleKey,
    },
    body: request,
    throwOnError: true,
  });

  return data;
}

async function onCleanupModuleStates() {
  if (selectedModule.value == null) {
    return;
  }

  const request = buildModuleStateCleanupRequest();
  if (request == null) {
    toast({
      type: 'warning',
      text: t('views.featureModules.state.cleanupNoCriteria'),
    });
    return;
  }

  moduleStateCleanupLoading.value = true;
  try {
    const preview = await cleanupModuleStates(selectedModule.value.key, {
      ...request,
      previewOnly: true,
    });
    const matchedCount = preview.matchedCount ?? 0;
    if (matchedCount <= 0) {
      toast({
        type: 'info',
        text: t('views.featureModules.state.cleanupNoMatches'),
      });
      return;
    }

    const ok = await confirm({
      type: 'warning',
      title: t('views.featureModules.state.cleanupConfirmTitle'),
      text: t('views.featureModules.state.cleanupConfirm', [
        getModuleName(selectedModule.value),
        preview.criteria ?? '-',
        matchedCount,
      ]),
    });
    if (!ok) {
      return;
    }

    const result = await cleanupModuleStates(selectedModule.value.key, {
      ...request,
      previewOnly: false,
    });
    toast({
      type: 'success',
      text: t('views.featureModules.state.cleanupSuccess', [result.deletedCount ?? 0]),
    });
    await loadModuleStates(selectedModule.value.key);
  }
  catch (error) {
    toast({
      type: 'error',
      text: error instanceof Error ? error.message : String(error),
    });
  }
  finally {
    moduleStateCleanupLoading.value = false;
  }
}

async function fetchModuleStates(moduleKey: string, pageSize: number) {
  try {
    const { data } = await featureModulesGetStates({
      path: {
        key: moduleKey,
      },
      query: {
        pageNumber: 1,
        pageSize,
        order: 'UpdatedAt',
        desc: true,
      },
      throwOnError: true,
    });
    return data;
  }
  catch (error) {
    if (pageSize < 0) {
      return null;
    }
    throw error;
  }
}

function getModuleActionLoadingKey(item: unknown, action: string): string {
  const module = toModuleStatus(item);
  return `${module.key}:${action}`;
}

function isModuleActionLoading(item: unknown, action: string): boolean {
  return actionLoadingKey.value === getModuleActionLoadingKey(item, action);
}

async function postModuleAction(item: unknown, action: 'Enable' | 'Disable' | 'Validate') {
  const module = toModuleStatus(item);
  if (!canRunModuleAction(module, action)) {
    toast({
      type: 'warning',
      text: t('views.featureModules.actionUnavailable'),
    });
    return;
  }

  if (action === 'Enable' || action === 'Disable') {
    const ok = await confirm({
      type: action === 'Disable' ? 'warning' : 'question',
      text: t(`views.featureModules.${action === 'Enable' ? 'enableConfirm' : 'disableConfirm'}`, [getModuleName(module)]),
    });
    if (!ok)
      return;
  }

  const loadingKey = getModuleActionLoadingKey(module, action);
  actionLoadingKey.value = loadingKey;

  try {
    const options = {
      path: {
        key: module.key,
      },
      throwOnError: true,
    };

    if (action === 'Enable')
      await featureModulesEnableModule(options);
    else if (action === 'Disable')
      await featureModulesDisableModule(options);
    else
      await featureModulesValidateSettings(options);

    toast({
      type: 'success',
      title: t(`views.featureModules.actions.${action.toLowerCase()}Success`),
    });
    await loadModules();
  }
  catch (error) {
    toast({
      type: 'error',
      text: error instanceof Error ? error.message : String(error),
    });
  }
  finally {
    if (actionLoadingKey.value === loadingKey) {
      actionLoadingKey.value = '';
    }
  }
}

function canRunModuleAction(item: unknown, action: 'Enable' | 'Disable' | 'Validate'): boolean {
  const module = toModuleStatus(item);
  if (!module.registered)
    return false;

  if (action === 'Enable')
    return module.canEnable ?? true;
  if (action === 'Disable')
    return module.canDisable ?? true;
  return module.canValidate ?? true;
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
  if (getModuleStateScopes(selectedModule.value).length > 0) {
    void loadModuleStates(selectedModule.value.key);
  }
  else {
    moduleStates.value = [];
    moduleStateTotal.value = 0;
  }
}

onMounted(loadModules);
</script>

<template>
  <div class="feature-modules-page-root h-full min-h-0">
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

        <div class="feature-modules-page__toolbar">
          <el-segmented
            v-model="filter"
            :options="[
              { label: t('views.featureModules.filterAll'), value: 'all' },
              { label: t('views.featureModules.filterEnabled'), value: 'enabled' },
              { label: t('views.featureModules.filterDisabled'), value: 'disabled' },
              { label: t('views.featureModules.filterIssues'), value: 'issues' },
              { label: t('views.featureModules.filterUnavailable'), value: 'unavailable' },
            ]"
          />
          <div class="feature-modules-page__toolbar-right">
            <el-input
              v-model="keyword"
              clearable
              :placeholder="t('views.featureModules.searchPlaceholder')"
              class="feature-modules-page__search"
            />
            <el-switch
              v-model="issueFirst"
              :active-text="t('views.featureModules.issueFirst')"
            />
          </div>
        </div>

        <el-table
          v-loading="loading"
          :data="filteredModules"
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
              <div class="feature-modules-page__configuration">
                <el-tag :type="getConfigurationTagType(getConfigurationStatus(row))" effect="plain">
                  {{ getConfigurationText(row) }}
                </el-tag>
                <el-tooltip
                  v-if="getModuleIssueCount(row) > 0"
                  placement="top"
                  :content="getPrimaryHealthIssue(row) == null ? t('views.featureModules.issueCount', [getModuleIssueCount(row)]) : getHealthIssueText(getPrimaryHealthIssue(row)!)"
                >
                  <span class="feature-modules-page__issue-count">
                    {{ t('views.featureModules.issueCount', [getModuleIssueCount(row)]) }}
                  </span>
                </el-tooltip>
                <span v-if="getPrimaryHealthIssue(row)" class="feature-modules-page__issue-preview">
                  {{ getHealthIssueText(getPrimaryHealthIssue(row)!) }}
                </span>
              </div>
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

          <el-table-column :label="t('views.featureModules.columns.actions')" width="420" fixed="right">
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
                  v-if="canRunModuleAction(row, 'Validate')"
                  :icon="iconValidate"
                  :loading="isModuleActionLoading(row, 'Validate')"
                  size="small"
                  @click="postModuleAction(row, 'Validate')"
                >
                  {{ t('views.featureModules.actions.validate') }}
                </el-button>
                <el-button
                  v-if="canRunModuleAction(row, row.enabled ? 'Disable' : 'Enable')"
                  :icon="iconPower"
                  :loading="isModuleActionLoading(row, row.enabled ? 'Disable' : 'Enable')"
                  :type="row.enabled ? 'warning' : 'success'"
                  size="small"
                  @click="postModuleAction(row, row.enabled ? 'Disable' : 'Enable')"
                >
                  {{ row.enabled ? t('views.featureModules.actions.disable') : t('views.featureModules.actions.enable') }}
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
      :size="detailDrawerSize"
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
            <el-descriptions-item :label="t('views.featureModules.columns.issueCount')">
              {{ getModuleIssueCount(selectedModule) }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('views.featureModules.columns.checkedAt')">
              {{ getConfigurationCheckedAt(selectedModule) }}
            </el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="feature-module-detail__section">
          <h3>{{ t('views.featureModules.detail.capabilities') }}</h3>
          <div v-if="getModuleCapabilities(selectedModule).length > 0" class="feature-module-detail__tags">
            <el-tag
              v-for="capability in getModuleCapabilities(selectedModule)"
              :key="capability.key"
              effect="plain"
            >
              {{ getCapabilityLabel(capability) }}
            </el-tag>
          </div>
          <el-empty v-else :description="t('views.featureModules.detail.emptyCapabilities')" :image-size="72" />
        </section>

        <section class="feature-module-detail__section">
          <h3>{{ t('views.featureModules.detail.dependencies') }}</h3>
          <div v-if="getModuleDependencies(selectedModule).length > 0" class="feature-module-detail__tags">
            <el-tag
              v-for="dependency in getModuleDependencies(selectedModule)"
              :key="dependency.key"
              :type="getDependencyTagType(dependency)"
              effect="plain"
            >
              {{ getDependencyLabel(dependency) }}
              <span class="feature-module-detail__tag-suffix">
                {{ dependency.required ? t('views.featureModules.dependencies.required') : t('views.featureModules.dependencies.optional') }}
                · {{ getDependencyStatusLabel(dependency) }}
              </span>
            </el-tag>
          </div>
          <el-empty v-else :description="t('views.featureModules.detail.emptyDependencies')" :image-size="72" />
        </section>

        <section class="feature-module-detail__section">
          <h3>{{ t('views.featureModules.detail.hooks') }}</h3>
          <div v-if="getModuleHookTypes(selectedModule).length > 0" class="feature-module-detail__tags">
            <el-tag
              v-for="hook in getModuleHookTypes(selectedModule)"
              :key="hook.key"
              effect="plain"
            >
              {{ getCapabilityLabel(hook) }}
            </el-tag>
          </div>
          <el-empty v-else :description="t('views.featureModules.detail.emptyHooks')" :image-size="72" />
        </section>

        <section class="feature-module-detail__section">
          <h3>{{ t('views.featureModules.detail.actions') }}</h3>
          <div v-if="getModuleActionTypes(selectedModule).length > 0" class="feature-module-detail__tags">
            <el-tag
              v-for="action in getModuleActionTypes(selectedModule)"
              :key="action.key"
              effect="plain"
            >
              {{ getCapabilityLabel(action) }}
            </el-tag>
          </div>
          <el-empty v-else :description="t('views.featureModules.detail.emptyActions')" :image-size="72" />
        </section>

        <section class="feature-module-detail__section">
          <h3>{{ t('views.featureModules.detail.templates') }}</h3>
          <div v-if="getModuleTemplates(selectedModule).length > 0" class="feature-module-detail__tags">
            <el-tag
              v-for="template in getModuleTemplates(selectedModule)"
              :key="template.key"
              effect="plain"
            >
              {{ getCapabilityLabel(template) }}
            </el-tag>
          </div>
          <el-empty v-else :description="t('views.featureModules.detail.emptyTemplates')" :image-size="72" />
        </section>

        <section class="feature-module-detail__section">
          <h3>{{ t('views.featureModules.detail.stateScopes') }}</h3>
          <div v-if="getModuleStateScopes(selectedModule).length > 0" class="feature-module-detail__tags">
            <el-tag
              v-for="scope in getModuleStateScopes(selectedModule)"
              :key="scope.key"
              effect="plain"
            >
              {{ getCapabilityLabel(scope) }}
            </el-tag>
          </div>
          <el-empty v-else :description="t('views.featureModules.detail.emptyStateScopes')" :image-size="72" />
        </section>

        <section v-if="getModuleStateScopes(selectedModule).length > 0" class="feature-module-detail__section">
          <div class="feature-module-detail__section-header">
            <h3>{{ t('views.featureModules.detail.runtimeStates') }}</h3>
            <div class="feature-module-detail__section-actions">
              <span>{{ t('views.featureModules.detail.runtimeStateCount', [filteredModuleStates.length, moduleStateTotal]) }}</span>
              <el-button size="small" :loading="moduleStateLoading" @click="loadModuleStates(selectedModule.key)">
                {{ t('components.myTable.refresh') }}
              </el-button>
            </div>
          </div>
          <div class="feature-module-detail__state-overview">
            <div class="feature-module-detail__state-overview-item">
              <span>{{ t('views.featureModules.state.overview.total') }}</span>
              <strong>{{ moduleStateOverview.total }}</strong>
            </div>
            <div class="feature-module-detail__state-overview-item">
              <span>{{ t('views.featureModules.state.overview.runtime') }}</span>
              <strong>{{ moduleStateOverview.runtime }}</strong>
            </div>
            <div class="feature-module-detail__state-overview-item">
              <span>{{ t('views.featureModules.state.overview.history') }}</span>
              <strong>{{ moduleStateOverview.history }}</strong>
            </div>
            <div class="feature-module-detail__state-overview-item">
              <span>{{ t('views.featureModules.state.overview.cooldown') }}</span>
              <strong>{{ moduleStateOverview.cooldown }}</strong>
            </div>
            <div class="feature-module-detail__state-overview-item">
              <span>{{ t('views.featureModules.state.overview.reward') }}</span>
              <strong>{{ moduleStateOverview.reward }}</strong>
            </div>
            <div class="feature-module-detail__state-overview-item">
              <span>{{ t('views.featureModules.state.overview.request') }}</span>
              <strong>{{ moduleStateOverview.request }}</strong>
            </div>
            <div class="feature-module-detail__state-overview-item">
              <span>{{ t('views.featureModules.state.overview.cache') }}</span>
              <strong>{{ moduleStateOverview.cache }}</strong>
            </div>
            <div class="feature-module-detail__state-overview-item">
              <span>{{ t('views.featureModules.state.overview.other') }}</span>
              <strong>{{ moduleStateOverview.other }}</strong>
            </div>
            <div class="feature-module-detail__state-overview-item">
              <span>{{ t('views.featureModules.state.overview.latestUpdatedAt') }}</span>
              <strong>{{ formatModuleStateTime(moduleStateOverview.latestUpdatedAt) }}</strong>
            </div>
          </div>
          <div class="feature-module-detail__state-toolbar">
            <el-segmented
              v-model="moduleStateCategory"
              :options="moduleStateCategoryOptions"
              size="small"
            />
            <el-input
              v-model="moduleStateKeyword"
              clearable
              :prefix-icon="iconDetails"
              :placeholder="t('views.featureModules.state.searchPlaceholder')"
            />
            <el-select
              v-model="moduleStateCleanupScope"
              clearable
              filterable
              :placeholder="t('views.featureModules.state.cleanupScopePlaceholder')"
            >
              <el-option
                v-for="option in moduleStateCleanupScopeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-button
              type="danger"
              plain
              :loading="moduleStateCleanupLoading"
              :disabled="moduleStateLoading || moduleStateTotal <= 0"
              @click="onCleanupModuleStates"
            >
              {{ t('views.featureModules.state.cleanupAction') }}
            </el-button>
          </div>
          <div v-if="getModuleStateScopeSummaries().length > 0" class="feature-module-detail__state-summary">
            <div
              v-for="summaryItem in getModuleStateScopeSummaries()"
              :key="summaryItem.scope"
              class="feature-module-detail__state-summary-item"
            >
              <strong>{{ summaryItem.scope }}</strong>
              <span>{{ t('views.featureModules.detail.runtimeStateScopeSummary', [summaryItem.total, formatModuleStateTime(summaryItem.latestUpdatedAt)]) }}</span>
            </div>
          </div>
          <el-table
            v-if="!isCompactViewport"
            v-loading="moduleStateLoading"
            :data="filteredModuleStates"
            size="small"
            border
            class="feature-module-detail__state-table"
          >
            <el-table-column :label="t('views.featureModules.state.category')" width="96">
              <template #default="{ row }">
                <el-tag size="small" :type="getModuleStateCategoryTagType(toModuleStateRow(row))" effect="plain">
                  {{ getModuleStateCategoryLabel(toModuleStateRow(row)) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="scope" :label="t('views.featureModules.state.scope')" width="110" />
            <el-table-column prop="scopeKey" :label="t('views.featureModules.state.scopeKey')" min-width="140" show-overflow-tooltip />
            <el-table-column prop="stateKey" :label="t('views.featureModules.state.stateKey')" width="130" show-overflow-tooltip />
            <el-table-column :label="t('views.featureModules.state.updatedAt')" width="150">
              <template #default="{ row }">
                {{ formatModuleStateTime(row.updatedAt) }}
              </template>
            </el-table-column>
            <el-table-column :label="t('views.featureModules.state.value')" min-width="260">
              <template #default="{ row }">
                <div class="feature-module-detail__state-value">
                  <span>{{ getModuleStateReadableValue(toModuleStateRow(row)) }}</span>
                  <code>{{ formatModuleStateValue(row.valueJson) }}</code>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div
            v-else
            v-loading="moduleStateLoading"
            class="feature-module-detail__state-cards"
          >
            <div
              v-for="row in filteredModuleStates"
              :key="`${row.scope}:${row.scopeKey}:${row.stateKey}`"
              class="feature-module-detail__state-card"
            >
              <div class="feature-module-detail__state-card-header">
                <el-tag size="small" :type="getModuleStateCategoryTagType(toModuleStateRow(row))" effect="plain">
                  {{ getModuleStateCategoryLabel(toModuleStateRow(row)) }}
                </el-tag>
                <span>{{ formatModuleStateTime(row.updatedAt) }}</span>
              </div>
              <dl>
                <div>
                  <dt>{{ t('views.featureModules.state.scope') }}</dt>
                  <dd>{{ row.scope }}</dd>
                </div>
                <div>
                  <dt>{{ t('views.featureModules.state.scopeKey') }}</dt>
                  <dd>{{ row.scopeKey }}</dd>
                </div>
                <div>
                  <dt>{{ t('views.featureModules.state.stateKey') }}</dt>
                  <dd>{{ row.stateKey }}</dd>
                </div>
                <div class="is-wide">
                  <dt>{{ t('views.featureModules.state.value') }}</dt>
                  <dd>
                    <span>{{ getModuleStateReadableValue(toModuleStateRow(row)) }}</span>
                    <code>{{ formatModuleStateValue(row.valueJson) }}</code>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <el-empty v-if="!moduleStateLoading && filteredModuleStates.length === 0" :description="t('views.featureModules.detail.emptyRuntimeStates')" :image-size="72" />
        </section>

        <section class="feature-module-detail__section">
          <h3>{{ t('views.featureModules.detail.settingsSchema') }}</h3>
          <div class="feature-module-detail__schema-overview">
            <div class="feature-module-detail__schema-overview-item">
              <span>{{ t('views.featureModules.settingsSchema.totalFields') }}</span>
              <strong>{{ getModuleSettingsSchema(selectedModule).totalFieldCount }}</strong>
            </div>
            <div class="feature-module-detail__schema-overview-item">
              <span>{{ t('views.featureModules.settingsSchema.enableFlags') }}</span>
              <strong>{{ getModuleSettingsSchema(selectedModule).enableFlagCount }}</strong>
            </div>
            <div class="feature-module-detail__schema-overview-item">
              <span>{{ t('views.featureModules.settingsSchema.advancedFields') }}</span>
              <strong>{{ getModuleSettingsSchema(selectedModule).advancedFieldCount }}</strong>
            </div>
            <div class="feature-module-detail__schema-overview-item">
              <span>{{ t('views.featureModules.settingsSchema.sensitiveFields') }}</span>
              <strong>{{ getModuleSettingsSchema(selectedModule).sensitiveFieldCount }}</strong>
            </div>
            <div class="feature-module-detail__schema-overview-item is-wide">
              <span>{{ t('views.featureModules.settingsSchema.groupsLabel') }}</span>
              <strong>{{ getSettingsSchemaGroupLabels(selectedModule) }}</strong>
            </div>
          </div>
          <el-table
            v-if="getModuleSettingsFields(selectedModule).length > 0"
            :data="getModuleSettingsFields(selectedModule)"
            size="small"
            border
            class="feature-module-detail__schema-table"
          >
            <el-table-column prop="name" :label="t('views.featureModules.settingsSchema.name')" min-width="170" show-overflow-tooltip>
              <template #default="{ row }">
                <code>{{ row.name }}</code>
              </template>
            </el-table-column>
            <el-table-column :label="t('views.featureModules.settingsSchema.group')" width="110">
              <template #default="{ row }">
                <el-tag effect="plain" size="small">
                  {{ getSettingsFieldGroupLabel(toSettingsField(row)) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('views.featureModules.settingsSchema.type')" width="110">
              <template #default="{ row }">
                <el-tag effect="plain" size="small">
                  {{ getSettingsFieldTypeLabel(toSettingsField(row).type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="clrType" :label="t('views.featureModules.settingsSchema.clrType')" min-width="130" show-overflow-tooltip />
            <el-table-column :label="t('views.featureModules.settingsSchema.flags')" min-width="150">
              <template #default="{ row }">
                <div class="feature-module-detail__schema-flags">
                  <el-tag v-if="toSettingsField(row).isEnableFlag" type="success" effect="plain" size="small">
                    {{ t('views.featureModules.settingsSchema.enableFlag') }}
                  </el-tag>
                  <el-tag v-if="toSettingsField(row).isCollection" type="info" effect="plain" size="small">
                    {{ t('views.featureModules.settingsSchema.collection') }}
                  </el-tag>
                  <el-tag v-if="toSettingsField(row).isNullable" type="warning" effect="plain" size="small">
                    {{ t('views.featureModules.settingsSchema.nullable') }}
                  </el-tag>
                  <el-tag v-if="toSettingsField(row).isSensitive" type="danger" effect="plain" size="small">
                    {{ t('views.featureModules.settingsSchema.sensitive') }}
                  </el-tag>
                  <el-tag v-if="toSettingsField(row).isAdvanced" type="warning" effect="plain" size="small">
                    {{ t('views.featureModules.settingsSchema.advanced') }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else :description="t('views.featureModules.detail.emptySettingsSchema')" :image-size="72" />
        </section>

        <section class="feature-module-detail__section">
          <h3>{{ t('views.featureModules.detail.healthIssues') }}</h3>
          <div v-if="getModuleHealthIssues(selectedModule).length > 0" class="feature-module-detail__issues">
            <template v-for="severity in issueSeverities" :key="severity">
              <div v-if="getHealthIssuesBySeverity(selectedModule, severity).length > 0" class="feature-module-detail__issue-group">
                <div class="feature-module-detail__issue-group-title">
                  {{ getIssueSeverityLabel(severity) }}
                </div>
                <div
                  v-for="issue in getHealthIssuesBySeverity(selectedModule, severity)"
                  :key="getHealthIssueKey(issue)"
                  class="feature-module-detail__issue"
                >
                  <el-tag :type="getIssueTagType(issue.severity)" effect="plain" size="small">
                    {{ getIssueSeverityLabel(issue.severity) }}
                  </el-tag>
                  <el-tag effect="plain" size="small">
                    {{ getHealthIssueSourceLabel(issue.source) }}
                  </el-tag>
                  <div class="feature-module-detail__issue-body">
                    <span>{{ getHealthIssueText(issue) }}</span>
                    <div class="feature-module-detail__issue-meta">
                      <el-tag v-if="issue.code" class="feature-module-detail__issue-meta-tag" effect="plain" size="small">
                        {{ t('views.featureModules.healthIssueMeta.code') }}: {{ issue.code }}
                      </el-tag>
                      <el-tag
                        v-if="issue.relatedModuleKey"
                        class="feature-module-detail__issue-meta-tag"
                        effect="plain"
                        size="small"
                      >
                        {{ t('views.featureModules.healthIssueMeta.relatedModule') }}: {{ issue.relatedModuleKey }}
                      </el-tag>
                      <el-tag
                        v-if="issue.relatedStateScope"
                        class="feature-module-detail__issue-meta-tag"
                        effect="plain"
                        size="small"
                      >
                        {{ t('views.featureModules.healthIssueMeta.relatedStateScope') }}: {{ issue.relatedStateScope }}
                      </el-tag>
                    </div>
                    <p v-if="getHealthIssueSuggestionText(issue)">
                      {{ getHealthIssueSuggestionText(issue) }}
                    </p>
                  </div>
                  <el-button
                    v-if="canOpenHealthIssueFix(issue)"
                    :icon="iconOpen"
                    size="small"
                    text
                    type="primary"
                    @click="openHealthIssueFix(issue)"
                  >
                    {{ getHealthIssueFixLabel(issue) }}
                  </el-button>
                </div>
              </div>
            </template>
          </div>
          <el-empty v-else :description="t('views.featureModules.detail.emptyHealthIssues')" :image-size="72" />
        </section>

        <section class="feature-module-detail__section">
          <h3>{{ t('views.featureModules.detail.securityPolicy') }}</h3>
          <div v-if="hasSecurityPolicy(selectedModule)" class="feature-module-detail__security">
            <div class="feature-module-detail__security-block">
              <strong>{{ t('views.featureModules.security.sensitiveActions') }}</strong>
              <div v-if="getSensitiveActions(selectedModule).length > 0" class="feature-module-detail__tags">
                <el-tag
                  v-for="action in getSensitiveActions(selectedModule)"
                  :key="action.key"
                  :type="action.highRisk ? 'danger' : 'warning'"
                  effect="plain"
                  size="small"
                >
                  {{ getSecurityActionLabel(action) }}
                </el-tag>
              </div>
              <span v-else>{{ t('views.featureModules.security.none') }}</span>
            </div>
            <div class="feature-module-detail__security-block">
              <strong>{{ t('views.featureModules.security.auditedActions') }}</strong>
              <div v-if="getAuditedActions(selectedModule).length > 0" class="feature-module-detail__tags">
                <el-tag
                  v-for="action in getAuditedActions(selectedModule)"
                  :key="action.key"
                  :type="action.highRisk ? 'danger' : 'info'"
                  effect="plain"
                  size="small"
                >
                  {{ getSecurityActionLabel(action) }}
                </el-tag>
              </div>
              <span v-else>{{ t('views.featureModules.security.none') }}</span>
            </div>
            <div class="feature-module-detail__security-block">
              <strong>{{ t('views.featureModules.security.consolePolicy') }}</strong>
              <div class="feature-module-detail__tags">
                <el-tag
                  v-for="tag in getConsoleCommandPolicyTags(selectedModule)"
                  :key="tag"
                  effect="plain"
                  size="small"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div v-if="getConsoleCommandPolicy(selectedModule).defaultAllowedCommands?.length" class="feature-module-detail__console-commands">
                <span>{{ t('views.featureModules.security.defaultAllowedCommands') }}</span>
                <code>{{ getConsoleCommandPolicy(selectedModule).defaultAllowedCommands?.join(', ') }}</code>
              </div>
            </div>
          </div>
          <el-empty v-else :description="t('views.featureModules.detail.emptySecurityPolicy')" :image-size="72" />
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
                <el-tag v-if="permission.requiresAdmin" type="danger" effect="plain" size="small">
                  {{ t('views.featureModules.permissionFlags.admin') }}
                </el-tag>
                <el-tag v-if="permission.requiresOnlinePlayer" type="success" effect="plain" size="small">
                  {{ t('views.featureModules.permissionFlags.onlinePlayer') }}
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
  </div>
</template>

<style scoped lang="scss">
.feature-modules-page-root {
  display: flex;
  flex-direction: column;
}

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

.feature-modules-page__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.feature-modules-page__toolbar-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.feature-modules-page__search {
  width: 260px;
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

.feature-modules-page__configuration {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.feature-modules-page__issue-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.feature-modules-page__issue-preview {
  display: block;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
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

  :deep(.el-descriptions__label) {
    width: 104px;
    min-width: 104px;
    white-space: nowrap;
  }

  :deep(.el-descriptions__content) {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  :deep(.el-descriptions__content .el-tag) {
    max-width: 100%;
    height: auto;
    min-height: 24px;
    padding-top: 3px;
    padding-bottom: 3px;
    white-space: normal;
  }

  :deep(.el-descriptions__content .el-tag__content) {
    min-width: 0;
    line-height: 18px;
    overflow-wrap: anywhere;
    white-space: normal;
  }
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

.feature-module-detail__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }
}

.feature-module-detail__section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feature-module-detail__list,
.feature-module-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-module-detail__tag-suffix {
  margin-left: 4px;
  color: var(--el-text-color-secondary);
}

.feature-module-detail__state-table {
  width: 100%;

  code {
    color: var(--el-text-color-regular);
    font-size: 12px;
  }
}

.feature-module-detail__state-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-module-detail__state-card {
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px 12px;
  background: var(--el-bg-color);
}

.feature-module-detail__state-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;

  span {
    min-width: 0;
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.feature-module-detail__state-card {
  dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 10px;
    margin: 10px 0 0;
  }

  dl > div {
    min-width: 0;

    &.is-wide {
      grid-column: span 2;
    }
  }

  dt {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  dd {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    margin: 2px 0 0;
    color: var(--el-text-color-primary);
    font-size: 12px;
    line-height: 18px;
  }

  dd span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  dd code {
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    line-height: 16px;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.feature-module-detail__state-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.feature-module-detail__state-overview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px 12px;
  background: var(--el-fill-color-extra-light);

  span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  strong {
    min-width: 0;
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 16px;
    line-height: 22px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.feature-module-detail__state-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;

  :deep(.el-segmented) {
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
  }

  :deep(.el-segmented__group) {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .el-input {
    min-width: 180px;
    width: 260px;
  }

  .el-select {
    min-width: 180px;
    width: 200px;
  }
}

.feature-module-detail__state-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.feature-module-detail__state-summary-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 8px 10px;
  background: var(--el-fill-color-extra-light);

  strong {
    display: block;
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 18px;
  }

  span {
    display: block;
    margin-top: 2px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }
}

.feature-module-detail__state-value {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: var(--el-text-color-primary);
    font-size: 12px;
    line-height: 18px;
  }

  code {
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    line-height: 16px;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.feature-module-detail__schema-table {
  width: 100%;

  code {
    color: var(--el-text-color-regular);
    font-size: 12px;
  }
}

.feature-module-detail__schema-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.feature-module-detail__schema-overview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px 12px;
  background: var(--el-fill-color-extra-light);

  &.is-wide {
    grid-column: span 4;
  }

  span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  strong {
    min-width: 0;
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 15px;
    line-height: 22px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.is-wide strong {
    white-space: normal;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
}

.feature-module-detail__schema-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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

.feature-module-detail__security {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-module-detail__security-block {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--el-fill-color-extra-light);

  strong {
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 18px;
  }

  span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }
}

.feature-module-detail__console-commands {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;

  code {
    min-width: 0;
    overflow: hidden;
    color: var(--el-text-color-regular);
    font-size: 12px;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.feature-module-detail__issues {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-module-detail__issue-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-module-detail__issue-group-title {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.feature-module-detail__command,
.feature-module-detail__permission,
.feature-module-detail__issue {
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

.feature-module-detail__issue {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 20px;
}

.feature-module-detail__issue-body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;

  span,
  p {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  p {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }
}

.feature-module-detail__issue-meta {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 6px;
}

.feature-module-detail__issue-meta-tag {
  max-width: 100%;
  height: auto;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 18px;
  padding-block: 3px;
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

  .feature-modules-page__toolbar,
  .feature-modules-page__toolbar-right {
    align-items: stretch;
    flex-direction: column;
  }

  .feature-modules-page__search {
    width: 100%;
  }

  .feature-module-detail__section-header,
  .feature-module-detail__state-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .feature-module-detail__section-actions {
    justify-content: space-between;
  }

  .feature-module-detail__state-overview,
  .feature-module-detail__state-summary,
  .feature-module-detail__schema-overview {
    grid-template-columns: 1fr;
  }

  .feature-module-detail__schema-overview-item.is-wide {
    grid-column: span 1;
  }

  .feature-module-detail__state-toolbar .el-input,
  .feature-module-detail__state-toolbar .el-select {
    width: 100%;
  }

  .feature-module-detail {
    :deep(.el-descriptions__label) {
      width: 88px;
      min-width: 88px;
    }
  }

  .feature-module-detail__issue {
    flex-wrap: wrap;
  }

  .feature-module-detail__issue > .el-tag {
    flex: 0 0 auto;
  }

  .feature-module-detail__issue-body {
    min-width: 100%;
    flex-basis: 100%;
    order: 2;
  }

  .feature-module-detail__issue > .el-button {
    flex: 1 1 100%;
    order: 3;
  }
}
</style>
