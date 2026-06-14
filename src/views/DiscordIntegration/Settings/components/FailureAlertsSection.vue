<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface WebhookTargetOption {
  label: string;
  value: string;
}

interface FailureAlertsFormModel {
  enableEventAutomationFailureAlerts: boolean;
  eventAutomationFailureAlertTargetKey: string;
  eventAutomationFailureAlertMessage: string;
}

interface Props {
  model: FailureAlertsFormModel;
  webhookTargetOptions: WebhookTargetOption[];
}

interface Emits {
  'update:model': [value: FailureAlertsFormModel];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

function updateField<Key extends keyof FailureAlertsFormModel>(key: Key, value: FailureAlertsFormModel[Key]) {
  emit('update:model', {
    ...props.model,
    [key]: value,
  });
}
</script>

<template>
  <section class="discord-settings__section">
    <div class="discord-settings__section-header">
      <div>
        <h3>{{ t('views.discordIntegration.settings.sections.failureAlerts') }}</h3>
        <p>{{ t('views.discordIntegration.settings.sections.failureAlertsDescription') }}</p>
      </div>
      <el-switch
        :model-value="props.model.enableEventAutomationFailureAlerts"
        inline-prompt
        :active-text="t('common.yes')"
        :inactive-text="t('common.no')"
        @update:model-value="value => updateField('enableEventAutomationFailureAlerts', Boolean(value))"
      />
    </div>
    <el-row :gutter="12">
      <el-col :xs="24" :md="8">
        <el-form-item prop="eventAutomationFailureAlertTargetKey" :label="t('views.discordIntegration.settings.fields.eventAutomationFailureAlertTargetKey')">
          <el-select
            :model-value="props.model.eventAutomationFailureAlertTargetKey"
            class="w-full"
            filterable
            allow-create
            clearable
            @update:model-value="value => updateField('eventAutomationFailureAlertTargetKey', value as string)"
          >
            <el-option
              v-for="option in props.webhookTargetOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="16">
        <el-form-item prop="eventAutomationFailureAlertMessage" :label="t('views.discordIntegration.settings.fields.eventAutomationFailureAlertMessage')">
          <el-input
            :model-value="props.model.eventAutomationFailureAlertMessage"
            type="textarea"
            :rows="3"
            maxlength="1900"
            show-word-limit
            @update:model-value="value => updateField('eventAutomationFailureAlertMessage', value)"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped>
.discord-settings__section {
  display: grid;
  gap: 12px;
  margin: 4px 0 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 14px;
  background: var(--el-fill-color-extra-light);
}

.discord-settings__section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 15px;
    line-height: 22px;
  }

  p {
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }
}

@media (max-width: 768px) {
  .discord-settings__section-header {
    flex-direction: column;
  }
}
</style>
