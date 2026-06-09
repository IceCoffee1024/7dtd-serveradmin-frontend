<script setup lang="ts">
import { useI18n } from 'vue-i18n';

type ActionType
  = | 'AdjustEconomy'
    | 'ExecuteConsoleCommand'
    | 'GiveItem'
    | 'KickPlayer'
    | 'MutePlayer'
    | 'SendAnnouncement'
    | 'SendGlobalMessage'
    | 'SendPrivateMessage';

type ActionModel = Record<string, unknown> & {
  type?: string;
};

type ActionKey
  = | 'allowConsoleCommand'
    | 'allowKick'
    | 'allowMute'
    | 'allowPermanent'
    | 'allowUnsafe'
    | 'allowedCommands'
    | 'amount'
    | 'command'
    | 'count'
    | 'durationMinutes'
    | 'durabilityPercent'
    | 'inMainThread'
    | 'itemName'
    | 'message'
    | 'playerId'
    | 'quality'
    | 'reason'
    | 'target'
    | 'type';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();

const ACTION_TYPES: ActionType[] = [
  'SendGlobalMessage',
  'SendPrivateMessage',
  'SendAnnouncement',
  'GiveItem',
  'AdjustEconomy',
  'KickPlayer',
  'MutePlayer',
  'ExecuteConsoleCommand',
];

const targetOptions = ['TriggerPlayer', 'TargetPlayer', 'PlayerId'];
const selectedActionType = ref<ActionType>('SendPrivateMessage');

const parsedActions = computed(() => parseActions(props.modelValue));
const hasInvalidJson = computed(() => parsedActions.value == null);
const actions = computed(() => parsedActions.value ?? []);
const actionTypeOptions = computed(() =>
  ACTION_TYPES.map(type => ({
    label: t(`views.eventAutomation.rules.builder.actionTypes.${type}`),
    value: type,
  })),
);

function parseActions(json: string): ActionModel[] | null {
  try {
    const parsed = JSON.parse(json || '[]');
    if (Array.isArray(parsed))
      return parsed.filter(item => item != null && typeof item === 'object') as ActionModel[];
  }
  catch {
    return null;
  }

  return null;
}

function formatActions(value: ActionModel[]) {
  emit('update:modelValue', JSON.stringify(value, null, 2));
}

function getActionType(action: ActionModel): ActionType | '' {
  return ACTION_TYPES.includes(action.type as ActionType) ? action.type as ActionType : '';
}

function getStringValue(action: ActionModel, key: ActionKey): string {
  const value = action[key];
  return typeof value === 'string' ? value : '';
}

function getNumberValue(action: ActionModel, key: ActionKey): number | undefined {
  const value = action[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getBooleanValue(action: ActionModel, key: ActionKey): boolean {
  return action[key] === true;
}

function getStringArrayValue(action: ActionModel, key: ActionKey): string[] {
  const value = action[key];
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
}

function setActionValue(index: number, key: ActionKey, value: unknown) {
  const next = actions.value.map(action => ({ ...action }));
  const action = next[index];
  if (action == null)
    return;

  const mutableAction = action as Record<string, unknown>;
  if (value == null || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0))
    delete mutableAction[key];
  else if (typeof value === 'string')
    mutableAction[key] = value.trim();
  else
    mutableAction[key] = value;

  formatActions(next);
}

function setActionType(index: number, type: ActionType) {
  const next = actions.value.map(action => ({ ...action }));
  next[index] = buildDefaultAction(type, next[index]);
  formatActions(next);
}

function addAction() {
  formatActions([...actions.value, buildDefaultAction(selectedActionType.value)]);
}

function duplicateAction(index: number) {
  const source = actions.value[index];
  if (source == null)
    return;

  formatActions([...actions.value.slice(0, index + 1), { ...source }, ...actions.value.slice(index + 1)]);
}

function removeAction(index: number) {
  formatActions(actions.value.filter((_action, actionIndex) => actionIndex !== index));
}

function buildDefaultAction(type: ActionType, previous?: ActionModel): ActionModel {
  switch (type) {
    case 'SendGlobalMessage':
      return { type, message: getPreviousString(previous, 'message', '{playerName} joined.') };
    case 'SendPrivateMessage':
      return {
        type,
        target: getPreviousString(previous, 'target', 'TriggerPlayer'),
        message: getPreviousString(previous, 'message', 'Welcome, {playerName}!'),
      };
    case 'SendAnnouncement':
      return { type, message: getPreviousString(previous, 'message', 'Server notice') };
    case 'GiveItem':
      return {
        type,
        target: getPreviousString(previous, 'target', 'TriggerPlayer'),
        itemName: getPreviousString(previous, 'itemName', 'resourceWood'),
        count: getPreviousNumber(previous, 'count', 100),
        quality: getPreviousNumber(previous, 'quality', 1),
      };
    case 'AdjustEconomy':
      return {
        type,
        target: getPreviousString(previous, 'target', 'TriggerPlayer'),
        amount: getPreviousNumber(previous, 'amount', 100),
        reason: getPreviousString(previous, 'reason', 'Reward'),
      };
    case 'KickPlayer':
      return {
        type,
        target: getPreviousString(previous, 'target', 'TriggerPlayer'),
        reason: getPreviousString(previous, 'reason', 'Rule violation'),
        allowKick: previous?.allowKick === true,
      };
    case 'MutePlayer':
      return {
        type,
        target: getPreviousString(previous, 'target', 'TriggerPlayer'),
        durationMinutes: getPreviousNumber(previous, 'durationMinutes', 30),
        reason: getPreviousString(previous, 'reason', 'Spam'),
        allowMute: previous?.allowMute === true,
      };
    case 'ExecuteConsoleCommand':
      return {
        type,
        command: getPreviousString(previous, 'command', 'saveworld'),
        allowedCommands: getStringArrayValue(previous ?? {}, 'allowedCommands').length > 0
          ? getStringArrayValue(previous ?? {}, 'allowedCommands')
          : ['saveworld'],
        allowConsoleCommand: previous?.allowConsoleCommand === true,
        inMainThread: previous?.inMainThread !== false,
      };
  }
}

function getPreviousString(source: ActionModel | undefined, key: ActionKey, fallback: string) {
  if (source == null)
    return fallback;

  const value = source[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getPreviousNumber(source: ActionModel | undefined, key: ActionKey, fallback: number) {
  if (source == null)
    return fallback;

  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isPlayerTargetAction(type: string) {
  return ['AdjustEconomy', 'GiveItem', 'KickPlayer', 'MutePlayer', 'SendPrivateMessage'].includes(type);
}

function shouldShowPlayerId(action: ActionModel) {
  return getStringValue(action, 'target') === 'PlayerId';
}

function isHighRiskAction(type: string) {
  return ['ExecuteConsoleCommand', 'KickPlayer', 'MutePlayer'].includes(type);
}

function resolveHighRiskDescription(type: string) {
  switch (type) {
    case 'KickPlayer':
      return t('views.eventAutomation.rules.builder.highRiskDescriptions.KickPlayer');
    case 'MutePlayer':
      return t('views.eventAutomation.rules.builder.highRiskDescriptions.MutePlayer');
    case 'ExecuteConsoleCommand':
      return t('views.eventAutomation.rules.builder.highRiskDescriptions.ExecuteConsoleCommand');
    default:
      return '';
  }
}
</script>

<template>
  <div class="rule-action-builder">
    <el-alert
      v-if="hasInvalidJson"
      type="warning"
      show-icon
      :closable="false"
      :title="t('views.eventAutomation.rules.builder.invalidActionsJson')"
    />

    <div class="rule-action-builder__toolbar">
      <el-select v-model="selectedActionType" class="rule-action-builder__type-select" filterable>
        <el-option
          v-for="option in actionTypeOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-button type="primary" plain @click="addAction">
        {{ t('views.eventAutomation.rules.builder.addAction') }}
      </el-button>
    </div>

    <el-empty
      v-if="actions.length === 0"
      :description="t('views.eventAutomation.rules.builder.noActions')"
      :image-size="80"
    />

    <div v-else class="rule-action-builder__list">
      <div v-for="(action, index) in actions" :key="index" class="rule-action-builder__item">
        <div class="rule-action-builder__item-header">
          <div class="rule-action-builder__item-title">
            {{ t('views.eventAutomation.rules.builder.actionIndex', { index: index + 1 }) }}
          </div>
          <div class="rule-action-builder__item-tools">
            <el-button size="small" @click="duplicateAction(index)">
              {{ t('views.eventAutomation.rules.builder.duplicateAction') }}
            </el-button>
            <el-button size="small" type="danger" plain @click="removeAction(index)">
              {{ t('common.delete') }}
            </el-button>
          </div>
        </div>

        <el-row :gutter="12">
          <el-col v-if="isHighRiskAction(getStringValue(action, 'type'))" :xs="24">
            <el-alert
              class="rule-action-builder__risk-alert"
              type="warning"
              show-icon
              :closable="false"
              :title="t('views.eventAutomation.rules.builder.highRiskTitle')"
              :description="resolveHighRiskDescription(getStringValue(action, 'type'))"
            />
          </el-col>

          <el-col :xs="24" :md="12">
            <el-form-item :label="t('views.eventAutomation.rules.builder.fields.actionType')">
              <el-select
                :model-value="getActionType(action)"
                class="w-full"
                filterable
                @update:model-value="setActionType(index, $event)"
              >
                <el-option
                  v-for="option in actionTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col v-if="isPlayerTargetAction(getStringValue(action, 'type'))" :xs="24" :md="12">
            <el-form-item :label="t('views.eventAutomation.rules.builder.fields.target')">
              <el-select
                :model-value="getStringValue(action, 'target')"
                class="w-full"
                filterable
                @update:model-value="setActionValue(index, 'target', $event)"
              >
                <el-option
                  v-for="option in targetOptions"
                  :key="option"
                  :label="t(`views.eventAutomation.rules.builder.targets.${option}`)"
                  :value="option"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col v-if="isPlayerTargetAction(getStringValue(action, 'type')) && shouldShowPlayerId(action)" :xs="24" :md="12">
            <el-form-item :label="t('views.eventAutomation.rules.builder.fields.playerId')">
              <el-input
                :model-value="getStringValue(action, 'playerId')"
                clearable
                @update:model-value="setActionValue(index, 'playerId', $event)"
              />
            </el-form-item>
          </el-col>

          <template v-if="['SendGlobalMessage', 'SendPrivateMessage', 'SendAnnouncement'].includes(getStringValue(action, 'type'))">
            <el-col :xs="24">
              <el-form-item :label="t('views.eventAutomation.rules.builder.fields.message')">
                <el-input
                  :model-value="getStringValue(action, 'message')"
                  type="textarea"
                  :rows="2"
                  clearable
                  @update:model-value="setActionValue(index, 'message', $event)"
                />
              </el-form-item>
            </el-col>
          </template>

          <template v-if="getStringValue(action, 'type') === 'GiveItem'">
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.eventAutomation.rules.builder.fields.itemName')">
                <el-input
                  :model-value="getStringValue(action, 'itemName')"
                  clearable
                  @update:model-value="setActionValue(index, 'itemName', $event)"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="6">
              <el-form-item :label="t('views.eventAutomation.rules.builder.fields.count')">
                <el-input-number
                  :model-value="getNumberValue(action, 'count')"
                  class="w-full"
                  :min="1"
                  :max="999999"
                  @update:model-value="setActionValue(index, 'count', $event)"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="6">
              <el-form-item :label="t('views.eventAutomation.rules.builder.fields.quality')">
                <el-input-number
                  :model-value="getNumberValue(action, 'quality')"
                  class="w-full"
                  :min="1"
                  :max="6"
                  @update:model-value="setActionValue(index, 'quality', $event)"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.eventAutomation.rules.builder.fields.durabilityPercent')">
                <el-input-number
                  :model-value="getNumberValue(action, 'durabilityPercent')"
                  class="w-full"
                  :min="1"
                  :max="100"
                  @update:model-value="setActionValue(index, 'durabilityPercent', $event)"
                />
              </el-form-item>
            </el-col>
          </template>

          <template v-if="getStringValue(action, 'type') === 'AdjustEconomy'">
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.eventAutomation.rules.builder.fields.amount')">
                <el-input-number
                  :model-value="getNumberValue(action, 'amount')"
                  class="w-full"
                  @update:model-value="setActionValue(index, 'amount', $event)"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.eventAutomation.rules.builder.fields.reason')">
                <el-input
                  :model-value="getStringValue(action, 'reason')"
                  clearable
                  @update:model-value="setActionValue(index, 'reason', $event)"
                />
              </el-form-item>
            </el-col>
          </template>

          <template v-if="getStringValue(action, 'type') === 'KickPlayer'">
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.eventAutomation.rules.builder.fields.reason')">
                <el-input
                  :model-value="getStringValue(action, 'reason')"
                  clearable
                  @update:model-value="setActionValue(index, 'reason', $event)"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-checkbox
                :model-value="getBooleanValue(action, 'allowKick')"
                @update:model-value="setActionValue(index, 'allowKick', $event)"
              >
                {{ t('views.eventAutomation.rules.builder.fields.allowKick') }}
              </el-checkbox>
            </el-col>
          </template>

          <template v-if="getStringValue(action, 'type') === 'MutePlayer'">
            <el-col :xs="24" :md="8">
              <el-form-item :label="t('views.eventAutomation.rules.builder.fields.durationMinutes')">
                <el-input-number
                  :model-value="getNumberValue(action, 'durationMinutes')"
                  class="w-full"
                  :min="0"
                  @update:model-value="setActionValue(index, 'durationMinutes', $event)"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="16">
              <el-form-item :label="t('views.eventAutomation.rules.builder.fields.reason')">
                <el-input
                  :model-value="getStringValue(action, 'reason')"
                  clearable
                  @update:model-value="setActionValue(index, 'reason', $event)"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-checkbox
                :model-value="getBooleanValue(action, 'allowMute')"
                @update:model-value="setActionValue(index, 'allowMute', $event)"
              >
                {{ t('views.eventAutomation.rules.builder.fields.allowMute') }}
              </el-checkbox>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-checkbox
                :model-value="getBooleanValue(action, 'allowPermanent')"
                @update:model-value="setActionValue(index, 'allowPermanent', $event)"
              >
                {{ t('views.eventAutomation.rules.builder.fields.allowPermanent') }}
              </el-checkbox>
            </el-col>
          </template>

          <template v-if="getStringValue(action, 'type') === 'ExecuteConsoleCommand'">
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.eventAutomation.rules.builder.fields.command')">
                <el-input
                  :model-value="getStringValue(action, 'command')"
                  clearable
                  @update:model-value="setActionValue(index, 'command', $event)"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item :label="t('views.eventAutomation.rules.builder.fields.allowedCommands')">
                <el-select
                  :model-value="getStringArrayValue(action, 'allowedCommands')"
                  class="w-full"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  @update:model-value="setActionValue(index, 'allowedCommands', $event)"
                >
                  <el-option
                    v-for="command in getStringArrayValue(action, 'allowedCommands')"
                    :key="command"
                    :label="command"
                    :value="command"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-checkbox
                :model-value="getBooleanValue(action, 'allowConsoleCommand')"
                @update:model-value="setActionValue(index, 'allowConsoleCommand', $event)"
              >
                {{ t('views.eventAutomation.rules.builder.fields.allowConsoleCommand') }}
              </el-checkbox>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-checkbox
                :model-value="getBooleanValue(action, 'allowUnsafe')"
                @update:model-value="setActionValue(index, 'allowUnsafe', $event)"
              >
                {{ t('views.eventAutomation.rules.builder.fields.allowUnsafe') }}
              </el-checkbox>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-checkbox
                :model-value="getBooleanValue(action, 'inMainThread')"
                @update:model-value="setActionValue(index, 'inMainThread', $event)"
              >
                {{ t('views.eventAutomation.rules.builder.fields.inMainThread') }}
              </el-checkbox>
            </el-col>
          </template>
        </el-row>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rule-action-builder {
  display: grid;
  gap: 12px;
}

.rule-action-builder__toolbar {
  display: flex;
  gap: 8px;
}

.rule-action-builder__type-select {
  flex: 1 1 auto;
}

.rule-action-builder__list {
  display: grid;
  gap: 12px;
}

.rule-action-builder__item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
}

.rule-action-builder__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.rule-action-builder__item-title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.rule-action-builder__item-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rule-action-builder__risk-alert {
  margin-bottom: 12px;
}
</style>
