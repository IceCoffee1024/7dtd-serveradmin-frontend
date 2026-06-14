<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface WebhookTargetFormModel {
  key: string;
  displayName: string;
  isEnabled: boolean;
  webhookUrl: string;
}

interface Props {
  targets: WebhookTargetFormModel[];
}

interface Emits {
  'update:targets': [value: WebhookTargetFormModel[]];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

function addWebhookTarget() {
  emit('update:targets', [
    ...props.targets,
    {
      key: '',
      displayName: '',
      isEnabled: true,
      webhookUrl: '',
    },
  ]);
}

function removeWebhookTarget(index: number) {
  emit('update:targets', props.targets.filter((_, targetIndex) => targetIndex !== index));
}

function updateTarget<Key extends keyof WebhookTargetFormModel>(index: number, key: Key, value: WebhookTargetFormModel[Key]) {
  emit('update:targets', props.targets.map((target, targetIndex) => targetIndex === index
    ? { ...target, [key]: value }
    : target));
}
</script>

<template>
  <section class="discord-settings__section">
    <div class="discord-settings__section-header">
      <div>
        <h3>{{ t('views.discordIntegration.settings.sections.webhookTargets') }}</h3>
        <p>{{ t('views.discordIntegration.settings.sections.webhookTargetsDescription') }}</p>
      </div>
      <el-button type="primary" plain @click="addWebhookTarget">
        {{ t('views.discordIntegration.settings.actions.addWebhookTarget') }}
      </el-button>
    </div>

    <div class="discord-settings__targets">
      <div
        v-for="(target, index) in props.targets"
        :key="index"
        class="discord-settings__target"
      >
        <div class="discord-settings__target-header">
          <el-switch
            :model-value="target.isEnabled"
            inline-prompt
            :active-text="t('common.yes')"
            :inactive-text="t('common.no')"
            @update:model-value="value => updateTarget(index, 'isEnabled', Boolean(value))"
          />
          <el-button type="danger" plain size="small" @click="removeWebhookTarget(index)">
            {{ t('common.delete') }}
          </el-button>
        </div>
        <el-row :gutter="12">
          <el-col :xs="24" :md="8">
            <el-form-item :label="t('views.discordIntegration.settings.fields.webhookTargetKey')">
              <el-input
                :model-value="target.key"
                clearable
                placeholder="admin"
                @update:model-value="value => updateTarget(index, 'key', value)"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item :label="t('views.discordIntegration.settings.fields.webhookTargetName')">
              <el-input
                :model-value="target.displayName"
                clearable
                @update:model-value="value => updateTarget(index, 'displayName', value)"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item :label="t('views.discordIntegration.settings.fields.webhookTargetUrl')">
              <el-input
                :model-value="target.webhookUrl"
                type="password"
                show-password
                clearable
                autocomplete="off"
                @update:model-value="value => updateTarget(index, 'webhookUrl', value)"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </div>
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

.discord-settings__targets {
  display: grid;
  gap: 12px;
}

.discord-settings__target {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  background: var(--el-bg-color);
}

.discord-settings__target-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .discord-settings__section-header {
    flex-direction: column;
  }
}
</style>
