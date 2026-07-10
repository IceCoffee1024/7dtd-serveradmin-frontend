<script setup lang="ts">
import { useMutation } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';
import { gameServerExecuteConsoleCommandMutation } from '~/generated/api/@pinia/colada.gen';
import { formatUtcTimestamp } from '~/utils/time';

interface Props {
  nextRestartAt?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  nextRestartAt: null,
});

type QuickActionType = 'restart' | 'shutdown';

const { t } = useI18n();
const { confirm, toast } = usePopup();

const actionLoading = ref<QuickActionType | null>(null);
const executeConsoleCommandMutation = useMutation({
  ...gameServerExecuteConsoleCommandMutation(),
});
const restartLabel = computed(() => formatUtcTimestamp(
  props.nextRestartAt,
  t('common.unknown'),
  'MM-DD HH:mm',
));

const actionItems = computed(() => [
  {
    type: 'restart' as const,
    command: 'ty-RestartServer',
    tone: 'warning',
    icon: 'refresh',
    label: t('views.dashboard.quickActions.restartButton'),
    detail: restartLabel.value,
  },
  {
    type: 'shutdown' as const,
    command: 'shutdown',
    tone: 'danger',
    icon: 'power',
    label: t('views.dashboard.quickActions.shutdownButton'),
    detail: t('views.dashboard.quickActions.hint'),
  },
]);

/**
 * Executes a destructive server action after user confirmation.
 * @param actionType - Operation type used to control loading state and i18n keys.
 * @returns Resolves when the action request finishes.
 */
async function executeQuickAction(actionType: QuickActionType): Promise<void> {
  const confirmed = await confirm({
    type: 'warning',
    title: t(`views.dashboard.quickActions.${actionType}Title`),
    text: t(`views.dashboard.quickActions.${actionType}Confirm`),
  });

  if (!confirmed)
    return;

  actionLoading.value = actionType;
  try {
    await executeConsoleCommandMutation.mutateAsync({
      body: {
        command: actionType === 'restart' ? 'ty-RestartServer' : 'shutdown',
        inMainThread: true,
      },
    });

    toast({
      type: 'success',
      text: t(`views.dashboard.quickActions.${actionType}Success`),
    });
  }
  catch {
    toast({
      type: 'error',
      text: t(`views.dashboard.quickActions.${actionType}Error`),
    });
  }
  finally {
    actionLoading.value = null;
  }
}
</script>

<template>
  <div class="quick-actions">
    <div class="quick-actions__overview">
      <div class="quick-actions__schedule">
        <div class="quick-actions__schedule-label">
          <icon-mdi-clock-outline />
          <span>{{ $t('views.dashboard.quickActions.nextRestart') }}</span>
        </div>
        <strong>{{ restartLabel }}</strong>
      </div>

      <div class="quick-actions__hint">
        <span class="quick-actions__hint-icon">
          <icon-mdi-shield-alert-outline />
        </span>
        <p>
          {{ $t('views.dashboard.quickActions.hint') }}
        </p>
      </div>
    </div>

    <div class="quick-actions__buttons">
      <button
        v-for="item in actionItems"
        :key="item.type"
        type="button"
        class="quick-action"
        :class="`quick-action--${item.tone}`"
        :disabled="actionLoading !== null"
        @click="executeQuickAction(item.type)"
      >
        <span class="quick-action__icon">
          <icon-mdi-refresh v-if="item.icon === 'refresh'" />
          <icon-mdi-power v-else />
        </span>
        <span class="quick-action__content">
          <small>{{ item.command }}</small>
          <strong>{{ item.label }}</strong>
          <em>{{ item.detail }}</em>
        </span>
        <span class="quick-action__state">
          <el-icon v-if="actionLoading === item.type" class="is-loading">
            <icon-mdi-loading />
          </el-icon>
          <icon-mdi-arrow-top-right v-else />
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quick-actions__overview {
  display: grid;
  gap: 0.85rem;
}

.quick-actions__buttons {
  display: grid;
  gap: 0.85rem;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  min-width: 0;
  padding: 1rem 1rem 0.95rem;
  border-radius: 24px;
  border: 1px solid transparent;
  text-align: left;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.quick-action:hover:not(:disabled) {
  transform: translateY(-1px);
}

.quick-action:disabled {
  opacity: 0.75;
  cursor: wait;
}

.quick-action--warning {
  color: #9a3412;
  background: color-mix(in srgb, var(--el-color-warning) 12%, white 88%);
  border-color: color-mix(in srgb, var(--el-color-warning) 22%, white 78%);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--el-color-warning) 12%, transparent);
}

.quick-action--danger {
  color: #991b1b;
  background: color-mix(in srgb, var(--el-color-danger) 10%, white 90%);
  border-color: color-mix(in srgb, var(--el-color-danger) 22%, white 78%);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}

.quick-action__icon {
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 16px;
  background: color-mix(in srgb, currentColor 12%, transparent);
  font-size: 1.15rem;
  flex-shrink: 0;
}

.quick-action__content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  flex: 1;
}

.quick-action__content small {
  font-family: var(--el-font-family-monospace, 'Cascadia Mono', 'Consolas', monospace);
  font-size: 0.72rem;
  color: color-mix(in srgb, currentColor 72%, white 28%);
}

.quick-action__content strong {
  font-size: 0.95rem;
  line-height: 1.25;
}

.quick-action__content em {
  margin-top: 0.15rem;
  color: var(--el-text-color-secondary);
  font-size: 0.75rem;
  font-style: normal;
  line-height: 1.45;
}

.quick-action__state {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 10%, transparent);
  font-size: 1rem;
  flex-shrink: 0;
}

.quick-actions__schedule {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.95rem 1rem;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color)),
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 8%, transparent), transparent 38%);
}

.quick-actions__schedule-label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--el-text-color-secondary);
  font-size: 0.82rem;
}

.quick-actions__schedule strong {
  color: var(--colors-primary);
}

.quick-actions__hint {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
  color: var(--el-text-color-secondary);
}

.quick-actions__hint p {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.7;
}

.quick-actions__hint-icon {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
  color: #b45309;
  flex-shrink: 0;
}
</style>
