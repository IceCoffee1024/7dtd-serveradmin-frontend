<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface NetworkProxyFormModel {
  useProxy: boolean;
  proxyUrl: string;
  proxyUsername: string;
  proxyPassword: string;
  bypassProxyOnLocal: boolean;
}

interface Props {
  model: NetworkProxyFormModel;
}

interface Emits {
  'update:model': [value: NetworkProxyFormModel];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

function updateField<Key extends keyof NetworkProxyFormModel>(key: Key, value: NetworkProxyFormModel[Key]) {
  emit('update:model', {
    ...props.model,
    [key]: value,
  });
}
</script>

<template>
  <el-collapse class="discord-settings__advanced-collapse">
    <el-collapse-item name="network">
      <template #title>
        <span class="discord-settings__collapse-title">{{ t('views.discordIntegration.settings.sections.networkProxy') }}</span>
      </template>
      <section class="discord-settings__section discord-settings__section--advanced">
        <div class="discord-settings__section-header">
          <div>
            <h3>{{ t('views.discordIntegration.settings.sections.networkProxy') }}</h3>
            <p>{{ t('views.discordIntegration.settings.sections.networkProxyDescription') }}</p>
          </div>
          <el-switch
            :model-value="props.model.useProxy"
            inline-prompt
            :active-text="t('common.yes')"
            :inactive-text="t('common.no')"
            @update:model-value="value => updateField('useProxy', Boolean(value))"
          />
        </div>

        <el-row :gutter="12">
          <el-col :xs="24" :md="12">
            <el-form-item prop="proxyUrl" :label="t('views.discordIntegration.settings.fields.proxyUrl')">
              <el-input
                :model-value="props.model.proxyUrl"
                clearable
                :disabled="!props.model.useProxy"
                :placeholder="t('views.discordIntegration.settings.placeholders.proxyUrl')"
                @update:model-value="value => updateField('proxyUrl', value)"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="bypassProxyOnLocal" :label="t('views.discordIntegration.settings.fields.bypassProxyOnLocal')">
              <el-switch
                :model-value="props.model.bypassProxyOnLocal"
                :disabled="!props.model.useProxy"
                inline-prompt
                :active-text="t('common.yes')"
                :inactive-text="t('common.no')"
                @update:model-value="value => updateField('bypassProxyOnLocal', Boolean(value))"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="proxyUsername" :label="t('views.discordIntegration.settings.fields.proxyUsername')">
              <el-input
                :model-value="props.model.proxyUsername"
                clearable
                maxlength="128"
                :disabled="!props.model.useProxy"
                :placeholder="t('views.discordIntegration.settings.placeholders.proxyUsername')"
                @update:model-value="value => updateField('proxyUsername', value)"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="proxyPassword" :label="t('views.discordIntegration.settings.fields.proxyPassword')">
              <el-input
                :model-value="props.model.proxyPassword"
                type="password"
                show-password
                clearable
                maxlength="256"
                autocomplete="new-password"
                :disabled="!props.model.useProxy"
                :placeholder="t('views.discordIntegration.settings.placeholders.proxyPassword')"
                @update:model-value="value => updateField('proxyPassword', value)"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </section>
    </el-collapse-item>
  </el-collapse>
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

.discord-settings__section--advanced {
  background: var(--el-fill-color-blank);
}

.discord-settings__advanced-collapse {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 0 12px;
  background: var(--el-bg-color);
}

.discord-settings__collapse-title {
  color: var(--el-text-color-primary);
  font-weight: 600;
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
