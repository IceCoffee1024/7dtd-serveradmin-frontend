<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface StatusCard {
  key: string;
  label: string;
  value: string;
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  isActive: boolean;
}

interface Props {
  title: string;
  description: string;
  statusCards: StatusCard[];
  isSubmitting: boolean;
  isTesting: boolean;
  isDirty: boolean;
}

interface Emits {
  reset: [];
  testWebhook: [];
  submit: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();
</script>

<template>
  <div class="discord-settings-hero">
    <div class="discord-settings-hero__main">
      <div>
        <h2>{{ props.title }}</h2>
        <p>{{ props.description }}</p>
      </div>
      <div class="discord-settings-hero__actions">
        <el-button :disabled="props.isSubmitting || props.isTesting" @click="emit('reset')">
          {{ t('common.reset') }}
        </el-button>
        <el-button :loading="props.isTesting" :disabled="props.isSubmitting" @click="emit('testWebhook')">
          {{ t('views.discordIntegration.settings.actions.testWebhook') }}
        </el-button>
        <el-button type="primary" :loading="props.isSubmitting" :disabled="!props.isDirty || props.isTesting" @click="emit('submit')">
          {{ t('common.save') }}
        </el-button>
      </div>
    </div>

    <div class="discord-settings-hero__status-grid">
      <div
        v-for="card in props.statusCards"
        :key="card.key"
        class="discord-settings-hero__status-item"
        :class="{ 'is-active': card.isActive }"
      >
        <span>{{ card.label }}</span>
        <el-tag :type="card.type" effect="plain">
          {{ card.value }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<style scoped>
.discord-settings-hero {
  display: grid;
  gap: 14px;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
  background: var(--el-bg-color);
}

.discord-settings-hero__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  h2 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 18px;
    line-height: 26px;
  }

  p {
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 20px;
  }
}

.discord-settings-hero__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.discord-settings-hero__status-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.discord-settings-hero__status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 44px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 8px 10px;
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.discord-settings-hero__status-item.is-active {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
  color: var(--el-text-color-primary);
}

@media (max-width: 1200px) {
  .discord-settings-hero__status-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .discord-settings-hero__main {
    flex-direction: column;
  }

  .discord-settings-hero__actions {
    justify-content: flex-start;
  }

  .discord-settings-hero__status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
