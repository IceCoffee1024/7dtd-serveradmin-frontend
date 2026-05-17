<script setup lang="ts">
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { restartServer, shutdownServer } from '~/api/gameServer';
import { usePopup } from '~/composables';

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
    if (actionType === 'restart') {
      await restartServer();
    }
    else {
      await shutdownServer();
    }

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
  <div class="flex flex-col gap-3">
    <el-button-group class="flex w-full">
      <el-button
        class="flex-1"
        type="warning"
        :loading="actionLoading === 'restart'"
        @click="executeQuickAction('restart')"
      >
        <el-icon class="mr-1">
          <icon-mdi-refresh />
        </el-icon>
        {{ $t('views.dashboard.quickActions.restartButton') }}
      </el-button>
      <el-button
        class="flex-1"
        type="danger"
        :loading="actionLoading === 'shutdown'"
        @click="executeQuickAction('shutdown')"
      >
        <el-icon class="mr-1">
          <icon-mdi-power />
        </el-icon>
        {{ $t('views.dashboard.quickActions.shutdownButton') }}
      </el-button>
    </el-button-group>

    <p class="text-sm text-gray-500 leading-6 dark:text-gray-400">
      {{ $t('views.dashboard.quickActions.hint') }}
    </p>

    <div v-if="props.nextRestartAt" class="text-sm text-gray-600 flex gap-2 items-center dark:text-gray-300">
      <el-icon><icon-mdi-clock-outline /></el-icon>
      <span>{{ $t('views.dashboard.quickActions.nextRestart') }}</span>
      <span class="font-medium text-primary">{{ dayjs(props.nextRestartAt).format('MM-DD HH:mm') }}</span>
    </div>
  </div>
</template>
