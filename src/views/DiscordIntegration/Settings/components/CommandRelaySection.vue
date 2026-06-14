<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface CommandRelayFormModel {
  enableDiscordCommandExecution: boolean;
  discordCommandPrefix: string;
  discordCommandAllowList: string[];
  enableAccountBinding: boolean;
}

interface Props {
  model: CommandRelayFormModel;
}

interface Emits {
  'update:model': [value: CommandRelayFormModel];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

const relayForm = computed({
  get: () => props.model,
  set: value => emit('update:model', value),
});

function updateField<Key extends keyof CommandRelayFormModel>(key: Key, value: CommandRelayFormModel[Key]) {
  emit('update:model', {
    ...props.model,
    [key]: value,
  });
}
</script>

<template>
  <section class="discord-settings__section discord-settings__section--danger">
    <div class="discord-settings__section-header">
      <div>
        <h3>{{ t('views.discordIntegration.settings.sections.commandRelay') }}</h3>
        <p>{{ t('views.discordIntegration.settings.sections.commandRelayDescription') }}</p>
      </div>
      <el-switch
        :model-value="relayForm.enableDiscordCommandExecution"
        inline-prompt
        :active-text="t('common.yes')"
        :inactive-text="t('common.no')"
        @update:model-value="value => updateField('enableDiscordCommandExecution', Boolean(value))"
      />
    </div>
    <el-alert
      type="warning"
      show-icon
      :closable="false"
      :title="t('views.discordIntegration.settings.messages.commandRelayWarning')"
    />
    <el-row :gutter="12">
      <el-col :xs="24" :md="8">
        <el-form-item prop="discordCommandPrefix" :label="t('views.discordIntegration.settings.fields.discordCommandPrefix')">
          <el-input
            :model-value="relayForm.discordCommandPrefix"
            clearable
            maxlength="20"
            @update:model-value="value => updateField('discordCommandPrefix', value)"
          />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="16">
        <el-form-item prop="discordCommandAllowList" :label="t('views.discordIntegration.settings.fields.discordCommandAllowList')">
          <el-select
            :model-value="relayForm.discordCommandAllowList"
            class="w-full"
            multiple
            filterable
            allow-create
            default-first-option
            clearable
            @update:model-value="value => updateField('discordCommandAllowList', value as string[])"
          />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-form-item prop="enableAccountBinding" :label="t('views.discordIntegration.settings.fields.enableAccountBinding')">
          <el-switch
            :model-value="relayForm.enableAccountBinding"
            inline-prompt
            :active-text="t('common.yes')"
            :inactive-text="t('common.no')"
            @update:model-value="value => updateField('enableAccountBinding', Boolean(value))"
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

.discord-settings__section--danger {
  border-color: var(--el-color-warning-light-7);
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
