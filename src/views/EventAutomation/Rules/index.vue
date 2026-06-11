<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import type { EventAutomationDryRunSampleContext } from './eventAutomationSamples';
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type {
  EventAutomationRecentFailureDto,
  EventAutomationRuleDryRunRequestDto,
  EventAutomationRuleDryRunResultDto,
  EventAutomationRuleDto,
  EventAutomationRuleQueryOrder,
  EventAutomationRuleUpsertDto,
  EventAutomationRunStatsDto,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { usePopup } from '~/composables';
import {
  eventAutomationCreateRule,
  eventAutomationDeleteRule,
  eventAutomationDryRunRule,
  eventAutomationGetRules,
  eventAutomationGetRunStats,
  eventAutomationUpdateRule,
  eventAutomationValidateRule,
} from '~/generated/api/sdk.gen';
import RuleActionBuilder from './components/RuleActionBuilder.vue';
import RuleConditionBuilder from './components/RuleConditionBuilder.vue';
import RuleDryRunSampleEditor from './components/RuleDryRunSampleEditor.vue';
import {
  cloneDryRunSampleContext,
  getDefaultDryRunSample,
} from './eventAutomationSamples';

defineOptions({ name: 'EventAutomationRulesPage' });

type RuleRow = EventAutomationRuleDto;

interface RuleFormModel {
  name: string;
  isEnabled: boolean;
  triggerType: string;
  conditionsJson: string;
  actionsJson: string;
  description: string;
}

const TRIGGER_TYPES = [
  'PlayerJoined',
  'PlayerLeft',
  'ChatMessage',
  'Cron',
] as const;

const HIGH_RISK_ACTION_TYPES = ['KickPlayer', 'MutePlayer', 'ExecuteConsoleCommand'] as const;

interface RuleTemplate {
  key: string;
  name: string;
  description: string;
  triggerType: (typeof TRIGGER_TYPES)[number];
  conditions: Record<string, unknown>;
  actions: Array<Record<string, unknown>>;
}

interface ReferenceItem {
  label: string;
  value: string;
  description: string;
}

const { t } = useI18n();
const router = useRouter();
const { confirm, toast } = usePopup();

const tableRef = useTemplateRef('tableRef');
const formRef = useTemplateRef<FormInstance>('formRef');
const dialogVisible = ref(false);
const editingRule = ref<RuleRow | null>(null);
const isSubmitting = ref(false);
const isValidatingRule = ref(false);
const isDryRunningRule = ref(false);
const dryRunResult = ref<EventAutomationRuleDryRunResultDto | null>(null);
const dryRunSample = ref<EventAutomationRuleDryRunRequestDto | null>(null);
const selectedTemplateKey = ref<string>();
const editorMode = ref<'builder' | 'json'>('builder');
const selectedDryRunSampleKey = ref<string>();
const dryRunSampleContext = ref<EventAutomationDryRunSampleContext>(cloneDryRunSampleContext(getDefaultDryRunSample('PlayerJoined').context));
const runStats = ref<EventAutomationRunStatsDto | null>(null);
const isLoadingRunStats = ref(false);

const form = reactive<RuleFormModel>(buildDefaults());

const triggerTypeOptions = computed(() =>
  TRIGGER_TYPES.map(type => ({
    label: t(`views.eventAutomation.triggers.${type}`),
    value: type,
  })),
);

const enabledOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const ruleTemplates = computed<RuleTemplate[]>(() => [
  {
    key: 'welcomePrivateMessage',
    name: t('views.eventAutomation.rules.templates.welcomePrivateMessage.name'),
    description: t('views.eventAutomation.rules.templates.welcomePrivateMessage.description'),
    triggerType: 'PlayerJoined',
    conditions: {},
    actions: [
      {
        type: 'SendPrivateMessage',
        target: 'TriggerPlayer',
        message: t('views.eventAutomation.rules.templates.welcomePrivateMessage.message'),
      },
    ],
  },
  {
    key: 'welcomeBroadcast',
    name: t('views.eventAutomation.rules.templates.welcomeBroadcast.name'),
    description: t('views.eventAutomation.rules.templates.welcomeBroadcast.description'),
    triggerType: 'PlayerJoined',
    conditions: {},
    actions: [
      {
        type: 'SendGlobalMessage',
        message: t('views.eventAutomation.rules.templates.welcomeBroadcast.message'),
      },
    ],
  },
  {
    key: 'discordPlayerJoined',
    name: t('views.eventAutomation.rules.templates.discordPlayerJoined.name'),
    description: t('views.eventAutomation.rules.templates.discordPlayerJoined.description'),
    triggerType: 'PlayerJoined',
    conditions: {
      cooldownSeconds: 30,
      cooldownScope: 'RulePlayer',
    },
    actions: [
      {
        type: 'SendDiscordMessage',
        message: t('views.eventAutomation.rules.templates.discordPlayerJoined.message'),
      },
    ],
  },
  {
    key: 'newPlayerGift',
    name: t('views.eventAutomation.rules.templates.newPlayerGift.name'),
    description: t('views.eventAutomation.rules.templates.newPlayerGift.description'),
    triggerType: 'PlayerJoined',
    conditions: {
      firstJoinOnly: true,
    },
    actions: [
      {
        type: 'GiveItem',
        target: 'TriggerPlayer',
        itemName: 'resourceWood',
        count: 100,
        quality: 1,
      },
      {
        type: 'SendPrivateMessage',
        target: 'TriggerPlayer',
        message: t('views.eventAutomation.rules.templates.newPlayerGift.message'),
      },
    ],
  },
  {
    key: 'economyWelcomeReward',
    name: t('views.eventAutomation.rules.templates.economyWelcomeReward.name'),
    description: t('views.eventAutomation.rules.templates.economyWelcomeReward.description'),
    triggerType: 'PlayerJoined',
    conditions: {
      firstJoinOnly: true,
    },
    actions: [
      {
        type: 'AdjustEconomy',
        target: 'TriggerPlayer',
        amount: 100,
        reason: t('views.eventAutomation.rules.templates.economyWelcomeReward.reason'),
      },
      {
        type: 'SendPrivateMessage',
        target: 'TriggerPlayer',
        message: t('views.eventAutomation.rules.templates.economyWelcomeReward.message'),
      },
    ],
  },
  {
    key: 'chatKeywordReply',
    name: t('views.eventAutomation.rules.templates.chatKeywordReply.name'),
    description: t('views.eventAutomation.rules.templates.chatKeywordReply.description'),
    triggerType: 'ChatMessage',
    conditions: {
      chatType: 'Global',
      messageContains: 'help',
      ignoreCase: true,
      cooldownSeconds: 60,
      cooldownScope: 'RulePlayer',
    },
    actions: [
      {
        type: 'SendPrivateMessage',
        target: 'TriggerPlayer',
        message: t('views.eventAutomation.rules.templates.chatKeywordReply.message'),
      },
    ],
  },
  {
    key: 'chatCommandBroadcast',
    name: t('views.eventAutomation.rules.templates.chatCommandBroadcast.name'),
    description: t('views.eventAutomation.rules.templates.chatCommandBroadcast.description'),
    triggerType: 'ChatMessage',
    conditions: {
      chatType: 'Global',
      messageStartsWith: '!notice',
      ignoreCase: true,
      cooldownSeconds: 300,
      cooldownScope: 'Rule',
    },
    actions: [
      {
        type: 'SendGlobalMessage',
        message: t('views.eventAutomation.rules.templates.chatCommandBroadcast.message'),
      },
    ],
  },
  {
    key: 'playerLeftAnnouncement',
    name: t('views.eventAutomation.rules.templates.playerLeftAnnouncement.name'),
    description: t('views.eventAutomation.rules.templates.playerLeftAnnouncement.description'),
    triggerType: 'PlayerLeft',
    conditions: {},
    actions: [
      {
        type: 'SendAnnouncement',
        message: t('views.eventAutomation.rules.templates.playerLeftAnnouncement.message'),
      },
    ],
  },
  {
    key: 'scheduledAnnouncement',
    name: t('views.eventAutomation.rules.templates.scheduledAnnouncement.name'),
    description: t('views.eventAutomation.rules.templates.scheduledAnnouncement.description'),
    triggerType: 'Cron',
    conditions: {
      cronExpression: '0 0/30 * * * ?',
      timeZoneId: 'Asia/Shanghai',
      allowConcurrentExecution: false,
    },
    actions: [
      {
        type: 'SendAnnouncement',
        message: t('views.eventAutomation.rules.templates.scheduledAnnouncement.message'),
      },
    ],
  },
  {
    key: 'discordScheduledAnnouncement',
    name: t('views.eventAutomation.rules.templates.discordScheduledAnnouncement.name'),
    description: t('views.eventAutomation.rules.templates.discordScheduledAnnouncement.description'),
    triggerType: 'Cron',
    conditions: {
      cronExpression: '0 0/30 * * * ?',
      timeZoneId: 'Asia/Shanghai',
      allowConcurrentExecution: false,
    },
    actions: [
      {
        type: 'SendDiscordMessage',
        message: t('views.eventAutomation.rules.templates.discordScheduledAnnouncement.message'),
      },
    ],
  },
  {
    key: 'chatKeywordMute',
    name: t('views.eventAutomation.rules.templates.chatKeywordMute.name'),
    description: t('views.eventAutomation.rules.templates.chatKeywordMute.description'),
    triggerType: 'ChatMessage',
    conditions: {
      chatType: 'Global',
      messageContains: 'spam',
      ignoreCase: true,
      cooldownSeconds: 60,
      cooldownScope: 'RulePlayer',
    },
    actions: [
      {
        type: 'MutePlayer',
        target: 'TriggerPlayer',
        durationMinutes: 30,
        reason: t('views.eventAutomation.rules.templates.chatKeywordMute.reason'),
        allowMute: true,
      },
    ],
  },
  {
    key: 'scheduledSaveWorld',
    name: t('views.eventAutomation.rules.templates.scheduledSaveWorld.name'),
    description: t('views.eventAutomation.rules.templates.scheduledSaveWorld.description'),
    triggerType: 'Cron',
    conditions: {
      cronExpression: '0 0/15 * * * ?',
      timeZoneId: 'Asia/Shanghai',
      allowConcurrentExecution: false,
    },
    actions: [
      {
        type: 'ExecuteConsoleCommand',
        command: 'saveworld',
        allowedCommands: ['saveworld'],
        allowConsoleCommand: true,
        inMainThread: true,
      },
    ],
  },
]);

const ruleTemplateOptions = computed(() =>
  ruleTemplates.value.map(template => ({
    label: template.name,
    value: template.key,
    description: template.description,
  })),
);

const variableTokens = [
  '{triggerType}',
  '{playerId}',
  '{playerName}',
  '{entityId}',
  '{message}',
  '{chatType}',
  '{cronExpression}',
  '{timeZoneId}',
  '{x}',
  '{y}',
  '{z}',
] as const;

const conditionReferences = computed<ReferenceItem[]>(() => [
  {
    label: 'chatType',
    value: '"chatType": "Global"',
    description: t('views.eventAutomation.rules.reference.conditions.chatType'),
  },
  {
    label: 'messageContains',
    value: '"messageContains": "help"',
    description: t('views.eventAutomation.rules.reference.conditions.messageContains'),
  },
  {
    label: 'messageStartsWith',
    value: '"messageStartsWith": "!help"',
    description: t('views.eventAutomation.rules.reference.conditions.messageStartsWith'),
  },
  {
    label: 'playerNameContains',
    value: '"playerNameContains": "Admin"',
    description: t('views.eventAutomation.rules.reference.conditions.playerNameContains'),
  },
  {
    label: 'cronExpression',
    value: '"cronExpression": "0 0/30 * * * ?"',
    description: t('views.eventAutomation.rules.reference.conditions.cronExpression'),
  },
  {
    label: 'ignoreCase',
    value: '"ignoreCase": true',
    description: t('views.eventAutomation.rules.reference.conditions.ignoreCase'),
  },
]);

const actionReferences = computed<ReferenceItem[]>(() => [
  {
    label: 'SendGlobalMessage',
    value: '{ "type": "SendGlobalMessage", "message": "{playerName} joined." }',
    description: t('views.eventAutomation.rules.reference.actions.sendGlobalMessage'),
  },
  {
    label: 'SendPrivateMessage',
    value: '{ "type": "SendPrivateMessage", "target": "TriggerPlayer", "message": "Welcome!" }',
    description: t('views.eventAutomation.rules.reference.actions.sendPrivateMessage'),
  },
  {
    label: 'SendAnnouncement',
    value: '{ "type": "SendAnnouncement", "message": "Server notice" }',
    description: t('views.eventAutomation.rules.reference.actions.sendAnnouncement'),
  },
  {
    label: 'GiveItem',
    value: '{ "type": "GiveItem", "target": "TriggerPlayer", "itemName": "resourceWood", "count": 100, "quality": 1 }',
    description: t('views.eventAutomation.rules.reference.actions.giveItem'),
  },
  {
    label: 'AdjustEconomy',
    value: '{ "type": "AdjustEconomy", "target": "TriggerPlayer", "amount": 100, "reason": "Reward" }',
    description: t('views.eventAutomation.rules.reference.actions.adjustEconomy'),
  },
  {
    label: 'KickPlayer',
    value: '{ "type": "KickPlayer", "target": "TriggerPlayer", "reason": "Rule violation", "allowKick": true }',
    description: t('views.eventAutomation.rules.reference.actions.kickPlayer'),
  },
  {
    label: 'MutePlayer',
    value: '{ "type": "MutePlayer", "target": "TriggerPlayer", "durationMinutes": 30, "reason": "Spam", "allowMute": true }',
    description: t('views.eventAutomation.rules.reference.actions.mutePlayer'),
  },
  {
    label: 'ExecuteConsoleCommand',
    value: '{ "type": "ExecuteConsoleCommand", "command": "saveworld", "allowedCommands": ["saveworld"], "allowConsoleCommand": true, "inMainThread": true }',
    description: t('views.eventAutomation.rules.reference.actions.executeConsoleCommand'),
  },
]);

const rules = computed<FormRules<RuleFormModel>>(() => ({
  name: [{ required: true, message: t('views.eventAutomation.rules.validation.nameRequired'), trigger: 'blur' }],
  triggerType: [{ required: true, message: t('views.eventAutomation.rules.validation.triggerRequired'), trigger: 'change' }],
  conditionsJson: [{ validator: validateJsonObject, trigger: 'blur' }],
  actionsJson: [{ validator: validateJsonArray, trigger: 'blur' }],
}));

const columns = computed<MyTableColumn<RuleRow>[]>(() => [
  {
    prop: 'keyword',
    label: t('components.myTable.keywordSearch'),
    show: false,
    exportable: false,
    search: {
      el: 'el-input',
      props: { clearable: true },
    },
  },
  {
    prop: 'isEnabled',
    label: t('views.eventAutomation.rules.columns.isEnabled'),
    slot: 'isEnabled',
    search: {
      el: 'el-select',
      props: { clearable: true },
      options: enabledOptions,
      order: 1,
      span: 8,
    },
  },
  {
    prop: 'triggerType',
    label: t('views.eventAutomation.rules.columns.triggerType'),
    slot: 'triggerType',
    sortable: true,
    search: {
      el: 'el-select',
      props: { clearable: true },
      options: triggerTypeOptions,
      order: 2,
      span: 8,
    },
  },
  { prop: 'name', label: t('views.eventAutomation.rules.columns.name'), sortable: true },
  { prop: 'description', label: t('views.eventAutomation.rules.columns.description') },
  { prop: 'lastMatchedAt', label: t('views.eventAutomation.rules.columns.lastMatchedAt'), slot: 'lastMatchedAt', sortable: true },
  { prop: 'lastStatus', label: t('views.eventAutomation.rules.columns.lastStatus'), slot: 'lastStatus' },
  { prop: 'updatedAt', label: t('views.eventAutomation.rules.columns.updatedAt'), slot: 'updatedAt', sortable: true },
]);

const latestFailure = computed(() => runStats.value?.recentFailures?.[0] ?? null);

function buildDefaults(): RuleFormModel {
  return {
    name: '',
    isEnabled: true,
    triggerType: 'PlayerJoined',
    conditionsJson: '{}',
    actionsJson: JSON.stringify([
      {
        type: 'SendPrivateMessage',
        target: 'TriggerPlayer',
        message: 'Welcome, {playerName}!',
      },
    ], null, 2),
    description: '',
  };
}

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<RuleRow>> {
  const { data } = await eventAutomationGetRules({
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      keyword: toOptionalString(params.search?.keyword),
      isEnabled: typeof params.search?.isEnabled === 'boolean' ? params.search.isEnabled : undefined,
      triggerType: toOptionalString(params.search?.triggerType),
      order: toOrder(params.sortField),
      desc: params.sortOrder === 'descending',
    },
    throwOnError: true,
  });

  return {
    list: data?.items ?? [],
    total: data?.total ?? 0,
  };
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return undefined;

  const trimmed = value.trim();
  return trimmed || undefined;
}

function toOrder(sortField: string | undefined): EventAutomationRuleQueryOrder | undefined {
  switch (sortField) {
    case 'name':
      return 'Name';
    case 'isEnabled':
      return 'IsEnabled';
    case 'triggerType':
      return 'TriggerType';
    case 'lastMatchedAt':
      return 'LastMatchedAt';
    case 'updatedAt':
      return 'UpdatedAt';
    default:
      return undefined;
  }
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function formatShortTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('MM-DD HH:mm:ss') : '--';
}

function resolveTriggerTypeLabel(triggerType: string): string {
  const key = `views.eventAutomation.triggers.${triggerType}`;
  const label = t(key);
  return label === key ? triggerType : label;
}

function resolveLastStatusType(status: string | null | undefined): 'success' | 'danger' | 'info' {
  if (status === 'Success')
    return 'success';
  if (status === 'Failed')
    return 'danger';

  return 'info';
}

function resolveLastStatusLabel(status: string | null | undefined): string {
  if (!status)
    return t('common.unknown');

  const key = `views.eventAutomation.rules.status.${status}`;
  const label = t(key);
  return label === key ? status : label;
}

async function fetchRunStats() {
  isLoadingRunStats.value = true;
  try {
    const { data } = await eventAutomationGetRunStats({
      throwOnError: true,
    });
    runStats.value = data;
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isLoadingRunStats.value = false;
  }
}

function validateJsonObject(_rule: unknown, value: string, callback: (error?: Error) => void) {
  try {
    const parsed = JSON.parse(value || '{}');
    if (parsed == null || Array.isArray(parsed) || typeof parsed !== 'object')
      callback(new Error(t('views.eventAutomation.rules.validation.conditionsJson')));
    else
      callback();
  }
  catch {
    callback(new Error(t('views.eventAutomation.rules.validation.conditionsJson')));
  }
}

function validateJsonArray(_rule: unknown, value: string, callback: (error?: Error) => void) {
  try {
    const parsed = JSON.parse(value || '[]');
    if (!Array.isArray(parsed))
      callback(new Error(t('views.eventAutomation.rules.validation.actionsJson')));
    else
      callback();
  }
  catch {
    callback(new Error(t('views.eventAutomation.rules.validation.actionsJson')));
  }
}

function formatJsonField(prop: 'actionsJson' | 'conditionsJson') {
  try {
    const parsed = JSON.parse(form[prop] || (prop === 'conditionsJson' ? '{}' : '[]'));
    form[prop] = JSON.stringify(parsed, null, 2);
    resetDryRun();
    formRef.value?.validateField(prop);
  }
  catch {
    formRef.value?.validateField(prop);
  }
}

function applyRuleTemplate(templateKey: string | undefined) {
  if (!templateKey)
    return;

  const template = ruleTemplates.value.find(item => item.key === templateKey);
  if (template == null)
    return;

  form.name = template.name;
  form.isEnabled = true;
  form.triggerType = template.triggerType;
  form.conditionsJson = JSON.stringify(template.conditions, null, 2);
  form.actionsJson = JSON.stringify(template.actions, null, 2);
  form.description = template.description;
  resetDryRunSampleForTrigger(form.triggerType);
  resetDryRun();
  nextTick(() => formRef.value?.clearValidate());
}

function applyRuleToForm(rule: RuleRow | null) {
  const source = rule ?? buildDefaults();
  form.name = source.name ?? '';
  form.isEnabled = source.isEnabled ?? true;
  form.triggerType = source.triggerType ?? 'PlayerJoined';
  form.conditionsJson = source.conditionsJson || '{}';
  form.actionsJson = source.actionsJson || '[]';
  form.description = source.description ?? '';
}

function onAdd() {
  editingRule.value = null;
  selectedTemplateKey.value = undefined;
  editorMode.value = 'builder';
  applyRuleToForm(null);
  resetDryRunSampleForTrigger(form.triggerType);
  resetDryRun();
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

function onEdit(row: RuleRow) {
  editingRule.value = row;
  selectedTemplateKey.value = undefined;
  editorMode.value = 'builder';
  applyRuleToForm(row);
  resetDryRunSampleForTrigger(form.triggerType);
  resetDryRun();
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

function onDuplicate(row: RuleRow) {
  editingRule.value = null;
  selectedTemplateKey.value = undefined;
  editorMode.value = 'builder';
  applyRuleToForm(row);
  form.name = t('views.eventAutomation.rules.messages.duplicateName', { name: row.name });
  resetDryRunSampleForTrigger(form.triggerType);
  resetDryRun();
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

function onTriggerTypeChange() {
  resetDryRunSampleForTrigger(form.triggerType);
  resetDryRun();
}

function resetDryRunSampleForTrigger(triggerType: string) {
  const sample = getDefaultDryRunSample(triggerType);
  selectedDryRunSampleKey.value = sample.key;
  dryRunSampleContext.value = cloneDryRunSampleContext(sample.context);
}

function onViewRuns(row: RuleRow) {
  if (row.id == null)
    return;

  router.push({
    name: 'EventAutomationRuns',
    query: { ruleId: String(row.id) },
  });
}

function onViewFailureRuns(failure: EventAutomationRecentFailureDto) {
  const query: Record<string, string> = { succeeded: 'false' };
  if (failure.ruleId != null)
    query.ruleId = String(failure.ruleId);

  router.push({
    name: 'EventAutomationRuns',
    query,
  });
}

function toPayload(): EventAutomationRuleUpsertDto {
  return {
    name: form.name.trim(),
    isEnabled: form.isEnabled,
    triggerType: form.triggerType.trim(),
    conditionsJson: form.conditionsJson.trim() || '{}',
    actionsJson: form.actionsJson.trim() || '[]',
    description: form.description.trim() || null,
  };
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  try {
    isSubmitting.value = true;
    const payload = toPayload();
    const validation = await eventAutomationValidateRule({ body: payload, throwOnError: true });
    const blockingIssue = validation.data?.issues?.find(issue => issue.severity === 'Error');
    if (blockingIssue != null) {
      toast({ type: 'error', text: `${blockingIssue.path}: ${blockingIssue.message}` });
      return;
    }

    const confirmedHighRiskActions = await confirmHighRiskRuleSave(payload);
    if (!confirmedHighRiskActions)
      return;

    if (editingRule.value?.id != null) {
      await eventAutomationUpdateRule({
        path: { id: editingRule.value.id },
        body: payload,
        throwOnError: true,
      });
      toast({ type: 'success', text: t('views.eventAutomation.rules.messages.updateSuccess') });
    }
    else {
      await eventAutomationCreateRule({
        body: payload,
        throwOnError: true,
      });
      toast({ type: 'success', text: t('views.eventAutomation.rules.messages.createSuccess') });
    }

    dialogVisible.value = false;
    tableRef.value?.reload();
    fetchRunStats();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

async function onValidateRule() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  isValidatingRule.value = true;
  try {
    const validation = await eventAutomationValidateRule({ body: toPayload(), throwOnError: true });
    const issues = validation.data?.issues ?? [];
    const blockingIssue = issues.find(issue => issue.severity === 'Error');
    if (blockingIssue != null) {
      toast({ type: 'error', text: `${blockingIssue.path}: ${blockingIssue.message}` });
      return;
    }

    const warningIssue = issues.find(issue => issue.severity === 'Warning');
    if (warningIssue != null) {
      toast({ type: 'warning', text: `${warningIssue.path}: ${warningIssue.message}` });
      return;
    }

    toast({ type: 'success', text: t('views.eventAutomation.rules.messages.validationPassed') });
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isValidatingRule.value = false;
  }
}

async function onDryRunRule() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  isDryRunningRule.value = true;
  try {
    const payload = toPayload();
    const request = buildDryRunRequest(payload);
    const { data } = await eventAutomationDryRunRule({ body: request, throwOnError: true });
    dryRunResult.value = data ?? null;
    dryRunSample.value = request;
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isDryRunningRule.value = false;
  }
}

function resetDryRun() {
  dryRunResult.value = null;
  dryRunSample.value = null;
}

function buildDryRunRequest(rule: EventAutomationRuleUpsertDto): EventAutomationRuleDryRunRequestDto {
  return {
    ...dryRunSampleContext.value,
    rule,
  };
}

function parseActions(actionsJson: string): Array<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(actionsJson || '[]');
    if (Array.isArray(parsed))
      return parsed.filter(item => item != null && typeof item === 'object') as Array<Record<string, unknown>>;
  }
  catch {
    // Form validation reports the JSON error before this path is normally reached.
  }

  return [];
}

async function confirmHighRiskRuleSave(rule: EventAutomationRuleUpsertDto): Promise<boolean> {
  if (rule.isEnabled !== true)
    return true;

  const highRiskActions = collectHighRiskActions(rule.actionsJson ?? '[]');
  if (highRiskActions.length === 0)
    return true;

  const actionLabels = highRiskActions
    .map(type => t(`views.eventAutomation.rules.builder.actionTypes.${type}`))
    .join(', ');

  return confirm({
    type: 'warning',
    title: t('views.eventAutomation.rules.highRiskConfirm.title'),
    text: t('views.eventAutomation.rules.highRiskConfirm.text', { actions: actionLabels }),
  });
}

function collectHighRiskActions(actionsJson: string): string[] {
  const result = new Set<string>();
  for (const action of parseActions(actionsJson)) {
    const type = toOptionalString(action.type);
    if (type != null && HIGH_RISK_ACTION_TYPES.includes(type as (typeof HIGH_RISK_ACTION_TYPES)[number]))
      result.add(type);
  }

  return [...result];
}

function formatDryRunSample(sample: EventAutomationRuleDryRunRequestDto | null): string {
  if (sample == null)
    return '--';

  return [
    `${sample.playerName ?? '--'} (${sample.playerId ?? '--'})`,
    sample.cronExpression,
    sample.timeZoneId,
    sample.chatType,
    sample.message,
  ].filter(Boolean).join(' · ');
}

async function onDelete(row: RuleRow) {
  if (row.id == null)
    return;

  const confirmed = await confirm({
    text: t('views.eventAutomation.rules.messages.deleteConfirm', { name: row.name }),
    type: 'warning',
  });
  if (!confirmed)
    return;

  try {
    await eventAutomationDeleteRule({
      path: { id: row.id },
      throwOnError: true,
    });
    toast({ type: 'success', text: t('views.eventAutomation.rules.messages.deleteSuccess') });
    tableRef.value?.reload();
    fetchRunStats();
  }
  catch (error) {
    console.error(error);
  }
}

onMounted(() => {
  fetchRunStats();
});
</script>

<template>
  <div class="event-automation-rules-page flex flex-col gap-4 h-full min-h-0">
    <el-alert
      :title="t('views.eventAutomation.rules.hint')"
      type="info"
      show-icon
      :closable="false"
    />

    <section v-loading="isLoadingRunStats" class="event-automation-run-stats">
      <div class="event-automation-run-stats__metric">
        <div class="event-automation-run-stats__label">
          {{ t('views.eventAutomation.rules.stats.todayTriggerCount') }}
        </div>
        <div class="event-automation-run-stats__value">
          {{ runStats?.todayTriggerCount ?? 0 }}
        </div>
      </div>

      <div class="event-automation-run-stats__metric">
        <div class="event-automation-run-stats__label">
          {{ t('views.eventAutomation.rules.stats.todayFailureCount') }}
        </div>
        <div class="event-automation-run-stats__value event-automation-run-stats__value--danger">
          {{ runStats?.todayFailureCount ?? 0 }}
        </div>
      </div>

      <div class="event-automation-run-stats__recent">
        <div class="event-automation-run-stats__recent-header">
          <span>{{ t('views.eventAutomation.rules.stats.recentFailures') }}</span>
          <el-button size="small" text :loading="isLoadingRunStats" @click="fetchRunStats">
            {{ t('components.myTable.refresh') }}
          </el-button>
        </div>
        <div v-if="latestFailure == null" class="event-automation-run-stats__empty">
          {{ t('views.eventAutomation.rules.stats.noRecentFailures') }}
        </div>
        <div v-else class="event-automation-run-stats__failure-list">
          <div
            v-for="(failure, index) in runStats?.recentFailures ?? []"
            :key="failure.id ?? `${failure.startedAt}-${index}`"
            class="event-automation-run-stats__failure"
            role="button"
            tabindex="0"
            @click="onViewFailureRuns(failure)"
            @keydown.enter="onViewFailureRuns(failure)"
            @keydown.space.prevent="onViewFailureRuns(failure)"
          >
            <div class="event-automation-run-stats__failure-main">
              <el-tag size="small" type="danger" effect="plain">
                {{ resolveTriggerTypeLabel(failure.triggerType) }}
              </el-tag>
              <span class="event-automation-run-stats__failure-rule">{{ failure.ruleName }}</span>
              <span class="event-automation-run-stats__failure-time">{{ formatShortTimestamp(failure.startedAt) }}</span>
            </div>
            <div class="event-automation-run-stats__failure-message">
              {{ failure.errorMessage || failure.summary || '--' }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="event-automation-rules-page__table">
      <MyTable
        ref="tableRef"
        row-key="id"
        :columns="columns"
        :fetch-data="fetchData"
        :show-index="true"
        :auto-column-width="true"
        :operation-column-width="220"
        :search-collapsible="true"
        @add="onAdd"
      >
        <template #isEnabled="{ row }">
          <el-tag :type="row.isEnabled ? 'success' : 'info'">
            {{ row.isEnabled ? t('common.yes') : t('common.no') }}
          </el-tag>
        </template>

        <template #triggerType="{ row }">
          <el-tag type="info">
            {{ resolveTriggerTypeLabel(row.triggerType) }}
          </el-tag>
        </template>

        <template #lastMatchedAt="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatTimestamp(row.lastMatchedAt) }}</span>
        </template>

        <template #lastStatus="{ row }">
          <el-tag :type="resolveLastStatusType(row.lastStatus)">
            {{ resolveLastStatusLabel(row.lastStatus) }}
          </el-tag>
        </template>

        <template #updatedAt="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatTimestamp(row.updatedAt) }}</span>
        </template>

        <template #operation="{ row }">
          <div class="flex flex-nowrap gap-1.5 justify-center">
            <IconButton button-size="small" icon-size="18" plain :tooltip-content="t('components.myTable.edit')" @click="onEdit(row)">
              <icon-mdi-pencil />
            </IconButton>
            <IconButton button-size="small" icon-size="18" plain :tooltip-content="t('views.eventAutomation.rules.actions.duplicate')" @click="onDuplicate(row)">
              <icon-mdi-content-copy />
            </IconButton>
            <IconButton button-size="small" icon-size="18" plain :tooltip-content="t('views.eventAutomation.rules.actions.viewRuns')" @click="onViewRuns(row)">
              <icon-mdi-history />
            </IconButton>
            <IconButton button-size="small" icon-size="18" plain :tooltip-content="t('common.delete')" @click="onDelete(row)">
              <icon-mdi-delete-outline />
            </IconButton>
          </div>
        </template>
      </MyTable>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingRule == null ? t('views.eventAutomation.rules.dialog.createTitle') : t('views.eventAutomation.rules.dialog.editTitle')"
      class="event-automation-rule-dialog"
      width="min(1040px, calc(100vw - 48px))"
      top="4vh"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div class="event-automation-rule-dialog__body">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="event-automation-rule-form">
          <section class="event-automation-rule-panel event-automation-rule-panel--basic">
            <el-row :gutter="16">
              <el-col :xs="24">
                <el-form-item :label="t('views.eventAutomation.rules.form.template')">
                  <el-select
                    v-model="selectedTemplateKey"
                    class="w-full"
                    clearable
                    filterable
                    :placeholder="t('views.eventAutomation.rules.form.templatePlaceholder')"
                    @change="applyRuleTemplate"
                  >
                    <el-option
                      v-for="option in ruleTemplateOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    >
                      <div class="event-automation-template-option">
                        <span>{{ option.label }}</span>
                        <small>{{ option.description }}</small>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item prop="name" :label="t('views.eventAutomation.rules.form.name')">
                  <el-input v-model="form.name" clearable />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item prop="triggerType" :label="t('views.eventAutomation.rules.form.triggerType')">
                  <el-select v-model="form.triggerType" class="w-full" filterable allow-create @change="onTriggerTypeChange">
                    <el-option
                      v-for="option in triggerTypeOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item prop="isEnabled" :label="t('views.eventAutomation.rules.form.isEnabled')">
                  <el-switch
                    v-model="form.isEnabled"
                    inline-prompt
                    :active-text="t('common.yes')"
                    :inactive-text="t('common.no')"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="16">
                <el-form-item prop="description" :label="t('views.eventAutomation.rules.form.description')">
                  <el-input v-model="form.description" clearable />
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <section class="event-automation-rule-panel">
            <el-tabs v-model="editorMode" class="event-automation-rule-editor">
              <el-tab-pane :label="t('views.eventAutomation.rules.editorModes.builder')" name="builder">
                <div class="event-automation-rule-editor__builder">
                  <section class="event-automation-rule-editor__section">
                    <div class="event-automation-rule-editor__section-title">
                      {{ t('views.eventAutomation.rules.builder.conditions') }}
                    </div>
                    <el-form-item prop="conditionsJson" class="event-automation-rule-editor__form-item">
                      <RuleConditionBuilder
                        v-model="form.conditionsJson"
                        :trigger-type="form.triggerType"
                        @update:model-value="resetDryRun"
                      />
                    </el-form-item>
                  </section>
                  <section class="event-automation-rule-editor__section">
                    <div class="event-automation-rule-editor__section-title">
                      {{ t('views.eventAutomation.rules.builder.actions') }}
                    </div>
                    <el-form-item prop="actionsJson" class="event-automation-rule-editor__form-item">
                      <RuleActionBuilder
                        v-model="form.actionsJson"
                        @update:model-value="resetDryRun"
                      />
                    </el-form-item>
                  </section>
                </div>
              </el-tab-pane>
              <el-tab-pane :label="t('views.eventAutomation.rules.editorModes.json')" name="json">
                <el-row :gutter="16">
                  <el-col :xs="24" :md="12">
                    <el-form-item prop="conditionsJson" :label="t('views.eventAutomation.rules.form.conditionsJson')">
                      <el-input v-model="form.conditionsJson" type="textarea" :rows="12" spellcheck="false" class="event-automation-json" @input="resetDryRun" />
                    </el-form-item>
                    <el-button size="small" @click="formatJsonField('conditionsJson')">
                      {{ t('views.eventAutomation.rules.actions.formatJson') }}
                    </el-button>
                  </el-col>
                  <el-col :xs="24" :md="12">
                    <el-form-item prop="actionsJson" :label="t('views.eventAutomation.rules.form.actionsJson')">
                      <el-input v-model="form.actionsJson" type="textarea" :rows="12" spellcheck="false" class="event-automation-json" @input="resetDryRun" />
                    </el-form-item>
                    <el-button size="small" @click="formatJsonField('actionsJson')">
                      {{ t('views.eventAutomation.rules.actions.formatJson') }}
                    </el-button>
                  </el-col>
                </el-row>
              </el-tab-pane>
            </el-tabs>
          </section>

          <section class="event-automation-rule-panel event-automation-rule-panel--reference">
            <el-collapse class="event-automation-reference">
              <el-collapse-item :title="t('views.eventAutomation.rules.reference.title')" name="reference">
                <div class="event-automation-reference__grid">
                  <div class="event-automation-reference__section">
                    <div class="event-automation-reference__title">
                      {{ t('views.eventAutomation.rules.reference.variables') }}
                    </div>
                    <div class="event-automation-reference__tokens">
                      <el-tag v-for="token in variableTokens" :key="token" type="info">
                        {{ token }}
                      </el-tag>
                    </div>
                  </div>

                  <div class="event-automation-reference__section">
                    <div class="event-automation-reference__title">
                      {{ t('views.eventAutomation.rules.reference.conditionsTitle') }}
                    </div>
                    <div class="event-automation-reference__list">
                      <div v-for="item in conditionReferences" :key="item.label" class="event-automation-reference__item">
                        <code>{{ item.value }}</code>
                        <span>{{ item.description }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="event-automation-reference__section">
                    <div class="event-automation-reference__title">
                      {{ t('views.eventAutomation.rules.reference.actionsTitle') }}
                    </div>
                    <div class="event-automation-reference__list">
                      <div v-for="item in actionReferences" :key="item.label" class="event-automation-reference__item">
                        <code>{{ item.value }}</code>
                        <span>{{ item.description }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </section>
        </el-form>

        <section class="event-automation-dry-run-samples">
          <el-collapse class="event-automation-dry-run-samples__collapse">
            <el-collapse-item name="samples">
              <template #title>
                <div class="event-automation-dry-run-samples__header">
                  <span>{{ t('views.eventAutomation.rules.samples.title') }}</span>
                  <small>{{ t('views.eventAutomation.rules.samples.description') }}</small>
                </div>
              </template>
              <RuleDryRunSampleEditor
                v-model="dryRunSampleContext"
                v-model:selected-sample-key="selectedDryRunSampleKey"
                :trigger-type="form.triggerType"
                @update:model-value="resetDryRun"
                @update:selected-sample-key="resetDryRun"
              />
            </el-collapse-item>
          </el-collapse>
        </section>

        <el-alert
          v-if="dryRunResult"
          class="event-automation-dry-run"
          :type="dryRunResult.matched ? 'success' : 'warning'"
          :title="dryRunResult.matched ? t('views.eventAutomation.rules.messages.dryRunMatched') : t('views.eventAutomation.rules.messages.dryRunNotMatched')"
          show-icon
          :closable="false"
        >
          <div class="event-automation-dry-run__content">
            <div class="event-automation-dry-run__sample">
              {{ t('views.eventAutomation.rules.messages.dryRunSampleContext') }}：{{ formatDryRunSample(dryRunSample) }}
            </div>
            <div v-if="dryRunResult.actions.length === 0" class="event-automation-dry-run__empty">
              {{ t('views.eventAutomation.rules.messages.dryRunNoActions') }}
            </div>
            <div v-else class="event-automation-dry-run__actions">
              <div v-for="action in dryRunResult.actions" :key="action.index" class="event-automation-dry-run__action">
                <el-tag effect="plain" size="small">
                  {{ action.type }}
                </el-tag>
                <span>{{ action.summary }}</span>
              </div>
            </div>
          </div>
        </el-alert>
      </div>

      <template #footer>
        <div class="event-automation-rule-dialog__footer">
          <el-button :disabled="isSubmitting" @click="dialogVisible = false">
            {{ t('common.cancel') }}
          </el-button>
          <el-button :loading="isDryRunningRule" :disabled="isSubmitting || isValidatingRule" @click="onDryRunRule">
            {{ t('views.eventAutomation.rules.actions.dryRun') }}
          </el-button>
          <el-button :loading="isValidatingRule" :disabled="isSubmitting" @click="onValidateRule">
            {{ t('views.featureModules.actions.validate') }}
          </el-button>
          <el-button type="primary" :loading="isSubmitting" @click="onSubmit">
            {{ t('common.save') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
:global(.event-automation-rule-dialog) {
  display: flex;
  max-height: 92vh;
  flex-direction: column;
  margin-bottom: 0;
}

:global(.event-automation-rule-dialog .el-dialog__header) {
  flex: 0 0 auto;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 14px 18px;
}

:global(.event-automation-rule-dialog .el-dialog__body) {
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
  background: var(--el-fill-color-extra-light);
  padding: 14px 18px;
}

:global(.event-automation-rule-dialog .el-dialog__footer) {
  flex: 0 0 auto;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  padding: 10px 18px;
}

.event-automation-rule-dialog__body {
  display: grid;
  max-height: calc(92vh - 116px);
  gap: 12px;
  overflow: auto;
  padding-bottom: 72px;
  padding-right: 2px;
}

.event-automation-rule-dialog__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.event-automation-rule-dialog__footer :deep(.el-button + .el-button) {
  margin-left: 0;
}

.event-automation-rule-form {
  display: grid;
  gap: 12px;
}

.event-automation-rule-panel {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
  padding: 14px;
}

.event-automation-rule-panel :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.event-automation-rule-panel--basic :deep(.el-row) {
  row-gap: 2px;
}

.event-automation-rule-panel--reference {
  padding: 0 12px;
}

.event-automation-json :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.event-automation-rules-page__table {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.event-automation-run-stats {
  position: relative;
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: minmax(132px, 168px) minmax(132px, 168px) minmax(0, 1fr);
  gap: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-bg-color);
  padding: 12px;
}

.event-automation-run-stats__metric {
  display: flex;
  min-height: 76px;
  flex-direction: column;
  justify-content: center;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-extra-light);
  padding: 10px 12px;
}

.event-automation-run-stats__label,
.event-automation-run-stats__empty,
.event-automation-run-stats__failure-time,
.event-automation-run-stats__failure-message {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.event-automation-run-stats__value {
  margin-top: 6px;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
}

.event-automation-run-stats__value--danger {
  color: var(--el-color-danger);
}

.event-automation-run-stats__recent {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
}

.event-automation-run-stats__recent-header {
  display: flex;
  min-height: 24px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.event-automation-run-stats__failure-list {
  display: grid;
  max-height: 112px;
  gap: 6px;
  overflow: auto;
  padding-right: 2px;
}

.event-automation-run-stats__failure {
  display: grid;
  min-width: 0;
  gap: 3px;
  border-radius: 4px;
  background: var(--el-fill-color-extra-light);
  cursor: pointer;
  padding: 6px 8px;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.event-automation-run-stats__failure:hover,
.event-automation-run-stats__failure:focus-visible {
  background: var(--el-fill-color-light);
  box-shadow: inset 0 0 0 1px var(--el-border-color);
  outline: none;
}

.event-automation-run-stats__failure-main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.event-automation-run-stats__failure-rule {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-automation-run-stats__failure-time {
  flex: 0 0 auto;
}

.event-automation-run-stats__failure-message {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (width <= 960px) {
  .event-automation-run-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .event-automation-run-stats__recent {
    grid-column: 1 / -1;
  }
}

@media (width <= 560px) {
  .event-automation-run-stats {
    grid-template-columns: 1fr;
  }
}

.event-automation-template-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.25;
}

.event-automation-template-option small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.event-automation-reference {
  border: 0;
}

.event-automation-reference :deep(.el-collapse-item__header) {
  height: 42px;
  border-bottom-color: var(--el-border-color-lighter);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.event-automation-reference :deep(.el-collapse-item__wrap) {
  border-bottom: 0;
}

.event-automation-reference :deep(.el-collapse-item__content) {
  padding: 12px 0 14px;
}

.event-automation-reference__grid {
  display: grid;
  grid-template-columns: minmax(160px, 0.8fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
}

.event-automation-reference__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-automation-reference__section + .event-automation-reference__section {
  margin-top: 0;
}

.event-automation-reference__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.event-automation-reference__tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.event-automation-reference__list {
  display: grid;
  gap: 8px;
  max-height: 180px;
  overflow: auto;
  padding-right: 2px;
}

.event-automation-reference__item {
  display: grid;
  grid-template-columns: minmax(104px, 0.55fr) minmax(0, 1fr);
  align-items: start;
  gap: 8px;
}

.event-automation-reference__item code {
  overflow-wrap: anywhere;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  padding: 4px 6px;
  color: var(--el-text-color-primary);
  font-size: 12px;
}

.event-automation-reference__item span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.event-automation-rule-editor {
  margin-top: 0;
}

.event-automation-rule-editor :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.event-automation-rule-editor__builder {
  display: grid;
  gap: 12px;
}

.event-automation-rule-editor__section {
  display: grid;
  gap: 10px;
}

.event-automation-rule-editor__section-title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.event-automation-rule-editor__form-item {
  margin-bottom: 0;
}

.event-automation-rule-editor__form-item :deep(.el-form-item__content) {
  display: block;
}

.event-automation-dry-run-samples__collapse {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.event-automation-dry-run-samples__collapse :deep(.el-collapse-item__header) {
  height: auto;
  min-height: 46px;
  border-bottom: 0;
  padding: 10px 14px;
}

.event-automation-dry-run-samples__collapse :deep(.el-collapse-item__wrap) {
  border-bottom: 0;
}

.event-automation-dry-run-samples__collapse :deep(.el-collapse-item__content) {
  background: var(--el-fill-color-extra-light);
  padding: 12px 14px 14px;
}

.event-automation-dry-run-samples__header {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;
}

.event-automation-dry-run-samples__header span {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.event-automation-dry-run-samples__header small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 400;
}

.event-automation-dry-run {
  margin-top: 0;
}

.event-automation-dry-run__content {
  display: grid;
  gap: 8px;
}

.event-automation-dry-run__sample,
.event-automation-dry-run__empty {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.event-automation-dry-run__actions {
  display: grid;
  gap: 6px;
}

.event-automation-dry-run__action {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.event-automation-dry-run__action span {
  overflow-wrap: anywhere;
}

@media (max-width: 720px) {
  :global(.event-automation-rule-dialog) {
    width: calc(100vw - 20px) !important;
    max-height: 96vh;
  }

  :global(.event-automation-rule-dialog .el-dialog__body) {
    padding: 12px;
  }

  .event-automation-rule-dialog__body {
    max-height: calc(96vh - 116px);
  }

  .event-automation-reference__grid,
  .event-automation-reference__item {
    grid-template-columns: 1fr;
  }

  .event-automation-rule-dialog__footer {
    justify-content: stretch;
  }

  .event-automation-rule-dialog__footer :deep(.el-button) {
    flex: 1 1 auto;
  }
}
</style>
