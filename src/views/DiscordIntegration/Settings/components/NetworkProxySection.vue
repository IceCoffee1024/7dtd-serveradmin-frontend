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
