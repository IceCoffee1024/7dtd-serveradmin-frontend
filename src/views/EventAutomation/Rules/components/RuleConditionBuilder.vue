<script setup lang="ts">
import { useI18n } from 'vue-i18n';

type ConditionKey
  = | 'allowConcurrentExecution'
    | 'chatType'
    | 'cooldownScope'
    | 'cooldownSeconds'
    | 'cronExpression'
    | 'entityNameContains'
    | 'entityType'
    | 'firstJoinOnly'
    | 'gameShuttingDown'
    | 'ignoreCase'
    | 'messageContains'
    | 'messageEquals'
    | 'messageStartsWith'
    | 'playerId'
    | 'playerNameContains'
    | 'targetPlayerId'
    | 'targetPlayerNameContains'
    | 'timeZoneId';

const props = defineProps<{
  modelValue: string;
  triggerType: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();

const chatTypeOptions = ['Global', 'Friends', 'Allies', 'Whisper'];
const entityTypeOptions = ['Zombie', 'Animal', 'OnlinePlayer', 'Vehicle'];
const timeZoneOptions = ['Asia/Shanghai', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
const cooldownScopeOptions = ['RulePlayer', 'Rule'];

const parsedConditions = computed(() => parseObject(props.modelValue));
const hasInvalidJson = computed(() => parsedConditions.value == null);
const conditions = computed(() => parsedConditions.value ?? {});
const isCronTrigger = computed(() => props.triggerType === 'Cron');
const shouldShowPlayerConditions = computed(() => props.triggerType !== 'Cron');
const shouldShowChatConditions = computed(() => props.triggerType === 'ChatMessage');
const shouldShowTargetPlayerConditions = computed(() => props.triggerType === 'PlayerKilledPlayer');
const shouldShowEntityConditions = computed(() => ['PlayerDied', 'PlayerKilledZombie'].includes(props.triggerType));
const shouldShowLeaveConditions = computed(() => props.triggerType === 'PlayerLeft');
const shouldShowTextMatchOptions = computed(() => props.triggerType !== 'Cron');

function parseObject(json: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(json || '{}');
    if (parsed != null && !Array.isArray(parsed) && typeof parsed === 'object')
      return parsed as Record<string, unknown>;
  }
  catch {
    return null;
  }

  return null;
}

function formatConditions(value: Record<string, unknown>) {
  emit('update:modelValue', JSON.stringify(value, null, 2));
}

function setConditionValue(key: ConditionKey, value: unknown) {
  const next = { ...conditions.value };
  if (value == null || (typeof value === 'string' && value.trim() === ''))
    delete next[key];
  else if (typeof value === 'string')
    next[key] = value.trim();
  else
    next[key] = value;

  formatConditions(next);
}

function getStringValue(key: ConditionKey): string {
  const value = conditions.value[key];
  return typeof value === 'string' ? value : '';
}

function getBooleanValue(key: ConditionKey): boolean {
  return conditions.value[key] === true;
}

function getNumberValue(key: ConditionKey): number | undefined {
  const value = conditions.value[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
</script>

<template>
  <div class="rule-condition-builder">
    <el-alert
      v-if="hasInvalidJson"
      type="warning"
      show-icon
      :closable="false"
      :title="t('views.eventAutomation.rules.builder.invalidConditionsJson')"
    />

    <div class="rule-condition-builder__section">
      <div class="rule-condition-builder__title">
        {{ t('views.eventAutomation.rules.builder.sections.safety') }}
      </div>
      <el-row :gutter="12">
        <el-col v-if="triggerType === 'PlayerJoined'" :xs="24" :md="8">
          <el-checkbox
            :model-value="getBooleanValue('firstJoinOnly')"
            @update:model-value="setConditionValue('firstJoinOnly', $event)"
          >
            {{ t('views.eventAutomation.rules.builder.fields.firstJoinOnly') }}
          </el-checkbox>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.cooldownSeconds')">
            <el-input-number
              :model-value="getNumberValue('cooldownSeconds')"
              :min="1"
              :max="86400"
              class="w-full"
              controls-position="right"
              @update:model-value="setConditionValue('cooldownSeconds', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.cooldownScope')">
            <el-select
              :model-value="getStringValue('cooldownScope') || 'RulePlayer'"
              class="w-full"
              @update:model-value="setConditionValue('cooldownScope', $event)"
            >
              <el-option
                v-for="option in cooldownScopeOptions"
                :key="option"
                :label="t(`views.eventAutomation.rules.builder.cooldownScopes.${option}`)"
                :value="option"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <div v-if="isCronTrigger" class="rule-condition-builder__section">
      <div class="rule-condition-builder__title">
        {{ t('views.eventAutomation.rules.builder.sections.cron') }}
      </div>
      <el-row :gutter="12">
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.cronExpression')">
            <el-input
              :model-value="getStringValue('cronExpression')"
              clearable
              placeholder="0 0/30 * * * ?"
              @update:model-value="setConditionValue('cronExpression', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.timeZoneId')">
            <el-select
              :model-value="getStringValue('timeZoneId')"
              class="w-full"
              clearable
              filterable
              allow-create
              @update:model-value="setConditionValue('timeZoneId', $event)"
            >
              <el-option v-for="option in timeZoneOptions" :key="option" :label="option" :value="option" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24">
          <el-checkbox
            :model-value="getBooleanValue('allowConcurrentExecution')"
            @update:model-value="setConditionValue('allowConcurrentExecution', $event)"
          >
            {{ t('views.eventAutomation.rules.builder.fields.allowConcurrentExecution') }}
          </el-checkbox>
        </el-col>
      </el-row>
    </div>

    <div v-if="shouldShowPlayerConditions" class="rule-condition-builder__section">
      <div class="rule-condition-builder__title">
        {{ t('views.eventAutomation.rules.builder.sections.player') }}
      </div>
      <el-row :gutter="12">
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.playerId')">
            <el-input
              :model-value="getStringValue('playerId')"
              clearable
              @update:model-value="setConditionValue('playerId', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.playerNameContains')">
            <el-input
              :model-value="getStringValue('playerNameContains')"
              clearable
              @update:model-value="setConditionValue('playerNameContains', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <div v-if="shouldShowChatConditions" class="rule-condition-builder__section">
      <div class="rule-condition-builder__title">
        {{ t('views.eventAutomation.rules.builder.sections.chat') }}
      </div>
      <el-row :gutter="12">
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.chatType')">
            <el-select
              :model-value="getStringValue('chatType')"
              class="w-full"
              clearable
              filterable
              allow-create
              @update:model-value="setConditionValue('chatType', $event)"
            >
              <el-option v-for="option in chatTypeOptions" :key="option" :label="option" :value="option" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.messageContains')">
            <el-input
              :model-value="getStringValue('messageContains')"
              clearable
              @update:model-value="setConditionValue('messageContains', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.messageStartsWith')">
            <el-input
              :model-value="getStringValue('messageStartsWith')"
              clearable
              @update:model-value="setConditionValue('messageStartsWith', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.messageEquals')">
            <el-input
              :model-value="getStringValue('messageEquals')"
              clearable
              @update:model-value="setConditionValue('messageEquals', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <div v-if="shouldShowTargetPlayerConditions" class="rule-condition-builder__section">
      <div class="rule-condition-builder__title">
        {{ t('views.eventAutomation.rules.builder.sections.targetPlayer') }}
      </div>
      <el-row :gutter="12">
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.targetPlayerId')">
            <el-input
              :model-value="getStringValue('targetPlayerId')"
              clearable
              @update:model-value="setConditionValue('targetPlayerId', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.targetPlayerNameContains')">
            <el-input
              :model-value="getStringValue('targetPlayerNameContains')"
              clearable
              @update:model-value="setConditionValue('targetPlayerNameContains', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <div v-if="shouldShowEntityConditions" class="rule-condition-builder__section">
      <div class="rule-condition-builder__title">
        {{ t('views.eventAutomation.rules.builder.sections.entity') }}
      </div>
      <el-row :gutter="12">
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.entityType')">
            <el-select
              :model-value="getStringValue('entityType')"
              class="w-full"
              clearable
              filterable
              allow-create
              @update:model-value="setConditionValue('entityType', $event)"
            >
              <el-option v-for="option in entityTypeOptions" :key="option" :label="option" :value="option" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.builder.fields.entityNameContains')">
            <el-input
              :model-value="getStringValue('entityNameContains')"
              clearable
              @update:model-value="setConditionValue('entityNameContains', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <div v-if="shouldShowLeaveConditions" class="rule-condition-builder__section">
      <div class="rule-condition-builder__title">
        {{ t('views.eventAutomation.rules.builder.sections.leave') }}
      </div>
      <el-checkbox
        :model-value="getBooleanValue('gameShuttingDown')"
        @update:model-value="setConditionValue('gameShuttingDown', $event)"
      >
        {{ t('views.eventAutomation.rules.builder.fields.gameShuttingDown') }}
      </el-checkbox>
    </div>

    <div v-if="shouldShowTextMatchOptions" class="rule-condition-builder__section">
      <div class="rule-condition-builder__title">
        {{ t('views.eventAutomation.rules.builder.sections.matching') }}
      </div>
      <el-checkbox
        :model-value="getBooleanValue('ignoreCase')"
        @update:model-value="setConditionValue('ignoreCase', $event)"
      >
        {{ t('views.eventAutomation.rules.builder.fields.ignoreCase') }}
      </el-checkbox>
    </div>
  </div>
</template>

<style scoped>
.rule-condition-builder {
  display: grid;
  gap: 14px;
}

.rule-condition-builder__section {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
}

.rule-condition-builder__title {
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}
</style>
