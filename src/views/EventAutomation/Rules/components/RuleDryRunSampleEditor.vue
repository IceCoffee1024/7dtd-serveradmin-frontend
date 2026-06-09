<script setup lang="ts">
import type { EventAutomationDryRunSampleContext } from '../eventAutomationSamples';
import { useI18n } from 'vue-i18n';
import {
  cloneDryRunSampleContext,
  getDefaultDryRunSample,
  getDryRunSamplesByTrigger,
} from '../eventAutomationSamples';

type SampleKey = keyof EventAutomationDryRunSampleContext;

const props = defineProps<{
  modelValue: EventAutomationDryRunSampleContext;
  selectedSampleKey?: string;
  triggerType: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: EventAutomationDryRunSampleContext];
  'update:selectedSampleKey': [value: string | undefined];
}>();

const { t } = useI18n();

const editorMode = ref<'builder' | 'json'>('builder');
const contextJson = ref(formatJson(props.modelValue));
const jsonError = ref(false);

const sampleOptions = computed(() => getDryRunSamplesByTrigger(props.triggerType));

watch(
  () => props.modelValue,
  (value) => {
    if (editorMode.value !== 'json')
      contextJson.value = formatJson(value);
  },
  { deep: true },
);

watch(
  () => props.triggerType,
  () => {
    const hasCurrentSample = sampleOptions.value.some(sample => sample.key === props.selectedSampleKey);
    if (!hasCurrentSample)
      applySample(getDefaultDryRunSample(props.triggerType).key);
  },
);

watch(editorMode, (value) => {
  if (value === 'json') {
    contextJson.value = formatJson(props.modelValue);
    jsonError.value = false;
  }
});

function applySample(sampleKey: string) {
  const sample = sampleOptions.value.find(item => item.key === sampleKey);
  if (sample == null)
    return;

  const next = cloneDryRunSampleContext(sample.context);
  emit('update:selectedSampleKey', sample.key);
  emit('update:modelValue', next);
  contextJson.value = formatJson(next);
  jsonError.value = false;
}

function setContextValue(key: SampleKey, value: unknown) {
  const next = { ...props.modelValue } as Record<string, unknown>;
  if (value === undefined || (typeof value === 'string' && value.trim() === ''))
    next[key] = null;
  else if (typeof value === 'string')
    next[key] = value.trim();
  else
    next[key] = value;

  emit('update:modelValue', next as EventAutomationDryRunSampleContext);
  contextJson.value = formatJson(next);
  jsonError.value = false;
}

function getStringValue(key: SampleKey): string {
  const value = props.modelValue[key];
  return typeof value === 'string' ? value : '';
}

function getNumberValue(key: SampleKey): number | undefined {
  const value = props.modelValue[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getBooleanValue(key: SampleKey): boolean {
  return props.modelValue[key] === true;
}

function onJsonInput(value: string) {
  contextJson.value = value;
  try {
    const parsed = JSON.parse(value || '{}');
    if (parsed == null || Array.isArray(parsed) || typeof parsed !== 'object') {
      jsonError.value = true;
      return;
    }

    jsonError.value = false;
    emit('update:modelValue', parsed as EventAutomationDryRunSampleContext);
  }
  catch {
    jsonError.value = true;
  }
}

function formatJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}
</script>

<template>
  <div class="rule-dry-run-sample-editor">
    <div class="rule-dry-run-sample-editor__toolbar">
      <el-select
        :model-value="selectedSampleKey"
        class="rule-dry-run-sample-editor__select"
        filterable
        @update:model-value="applySample"
      >
        <el-option
          v-for="sample in sampleOptions"
          :key="sample.key"
          :label="t(sample.nameKey)"
          :value="sample.key"
        >
          <div class="rule-dry-run-sample-editor__option">
            <span>{{ t(sample.nameKey) }}</span>
            <small>{{ t(sample.descriptionKey) }}</small>
          </div>
        </el-option>
      </el-select>
      <el-radio-group v-model="editorMode" size="small">
        <el-radio-button value="builder">
          {{ t('views.eventAutomation.rules.samples.editorModes.form') }}
        </el-radio-button>
        <el-radio-button value="json">
          {{ t('views.eventAutomation.rules.samples.editorModes.json') }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <el-alert
      v-if="jsonError"
      type="warning"
      show-icon
      :closable="false"
      :title="t('views.eventAutomation.rules.samples.invalidJson')"
    />

    <el-row v-if="editorMode === 'builder'" :gutter="12">
      <el-col v-if="triggerType !== 'Cron'" :xs="24" :md="12">
        <el-form-item :label="t('views.eventAutomation.rules.samples.fields.playerId')">
          <el-input
            :model-value="getStringValue('playerId')"
            clearable
            @update:model-value="setContextValue('playerId', $event)"
          />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-form-item :label="t('views.eventAutomation.rules.samples.fields.playerName')">
          <el-input
            :model-value="getStringValue('playerName')"
            clearable
            @update:model-value="setContextValue('playerName', $event)"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="triggerType !== 'Cron'" :xs="24" :md="8">
        <el-form-item :label="t('views.eventAutomation.rules.samples.fields.entityId')">
          <el-input-number
            :model-value="getNumberValue('entityId')"
            class="w-full"
            @update:model-value="setContextValue('entityId', $event)"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="triggerType !== 'Cron'" :xs="24" :md="8">
        <el-form-item label="X">
          <el-input-number
            :model-value="getNumberValue('x')"
            class="w-full"
            @update:model-value="setContextValue('x', $event)"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="triggerType !== 'Cron'" :xs="24" :md="8">
        <el-form-item label="Y">
          <el-input-number
            :model-value="getNumberValue('y')"
            class="w-full"
            @update:model-value="setContextValue('y', $event)"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="triggerType !== 'Cron'" :xs="24" :md="8">
        <el-form-item label="Z">
          <el-input-number
            :model-value="getNumberValue('z')"
            class="w-full"
            @update:model-value="setContextValue('z', $event)"
          />
        </el-form-item>
      </el-col>

      <template v-if="triggerType === 'ChatMessage'">
        <el-col :xs="24" :md="8">
          <el-form-item :label="t('views.eventAutomation.rules.samples.fields.chatType')">
            <el-select
              :model-value="getStringValue('chatType')"
              class="w-full"
              filterable
              allow-create
              @update:model-value="setContextValue('chatType', $event)"
            >
              <el-option label="Global" value="Global" />
              <el-option label="Whisper" value="Whisper" />
              <el-option label="Friends" value="Friends" />
              <el-option label="Allies" value="Allies" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="16">
          <el-form-item :label="t('views.eventAutomation.rules.samples.fields.message')">
            <el-input
              :model-value="getStringValue('message')"
              clearable
              @update:model-value="setContextValue('message', $event)"
            />
          </el-form-item>
        </el-col>
      </template>

      <template v-if="['PlayerDied', 'PlayerKilledPlayer', 'PlayerKilledZombie'].includes(triggerType)">
        <el-col v-if="triggerType === 'PlayerKilledPlayer'" :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.samples.fields.targetPlayerId')">
            <el-input
              :model-value="getStringValue('targetPlayerId')"
              clearable
              @update:model-value="setContextValue('targetPlayerId', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="triggerType === 'PlayerKilledPlayer'" :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.samples.fields.targetPlayerName')">
            <el-input
              :model-value="getStringValue('targetPlayerName')"
              clearable
              @update:model-value="setContextValue('targetPlayerName', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-form-item :label="t('views.eventAutomation.rules.samples.fields.targetEntityId')">
            <el-input-number
              :model-value="getNumberValue('targetEntityId')"
              class="w-full"
              @update:model-value="setContextValue('targetEntityId', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-form-item :label="t('views.eventAutomation.rules.samples.fields.targetEntityName')">
            <el-input
              :model-value="getStringValue('targetEntityName')"
              clearable
              @update:model-value="setContextValue('targetEntityName', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-form-item :label="t('views.eventAutomation.rules.samples.fields.entityType')">
            <el-select
              :model-value="getStringValue('entityType')"
              class="w-full"
              filterable
              allow-create
              @update:model-value="setContextValue('entityType', $event)"
            >
              <el-option label="Zombie" value="Zombie" />
              <el-option label="Animal" value="Animal" />
              <el-option label="OnlinePlayer" value="OnlinePlayer" />
              <el-option label="Vehicle" value="Vehicle" />
            </el-select>
          </el-form-item>
        </el-col>
      </template>

      <el-col v-if="triggerType === 'PlayerLeft'" :xs="24">
        <el-checkbox
          :model-value="getBooleanValue('gameShuttingDown')"
          @update:model-value="setContextValue('gameShuttingDown', $event)"
        >
          {{ t('views.eventAutomation.rules.samples.fields.gameShuttingDown') }}
        </el-checkbox>
      </el-col>

      <template v-if="triggerType === 'Cron'">
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.samples.fields.cronExpression')">
            <el-input
              :model-value="getStringValue('cronExpression')"
              clearable
              @update:model-value="setContextValue('cronExpression', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item :label="t('views.eventAutomation.rules.samples.fields.timeZoneId')">
            <el-input
              :model-value="getStringValue('timeZoneId')"
              clearable
              @update:model-value="setContextValue('timeZoneId', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24">
          <el-form-item :label="t('views.eventAutomation.rules.samples.fields.message')">
            <el-input
              :model-value="getStringValue('message')"
              clearable
              @update:model-value="setContextValue('message', $event)"
            />
          </el-form-item>
        </el-col>
      </template>
    </el-row>

    <el-input
      v-else
      :model-value="contextJson"
      type="textarea"
      :rows="9"
      spellcheck="false"
      class="rule-dry-run-sample-editor__json"
      @update:model-value="onJsonInput"
    />
  </div>
</template>

<style scoped>
.rule-dry-run-sample-editor {
  display: grid;
  gap: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
}

.rule-dry-run-sample-editor__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rule-dry-run-sample-editor__select {
  flex: 1 1 280px;
}

.rule-dry-run-sample-editor__option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.25;
}

.rule-dry-run-sample-editor__option small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.rule-dry-run-sample-editor__json :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}
</style>
