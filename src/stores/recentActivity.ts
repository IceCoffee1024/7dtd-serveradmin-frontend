import dayjs from 'dayjs';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';
import emitter, { EVENT_TYPES } from '~/plugins/mitt';
import { markIcon } from '~/utils';

type ActivityTone = 'success' | 'danger';

interface Activity {
  icon: ReturnType<typeof markIcon>;
  text: string;
  time: string | dayjs.Dayjs;
  tone: ActivityTone;
}

export const useRecentActivityStore = defineStore('recentActivity', () => {
  const max = 8;
  const { t } = useI18n();
  const state = ref<Activity[]>([
    {
      icon: markIcon(() => import('~icons/ic/baseline-login')),
      text: t('views.dashboard.recentActivity.login'),
      time: dayjs(),
      tone: 'success',
    },
  ]);

  const activities: ComputedRef<Activity[]> = computed(() => {
    const result: Activity[] = [];

    for (const activity of state.value) {
      result.push({
        ...activity,
        time: dayjs(activity.time).fromNow(),
        text: activity.text,
      });
    }
    return result;
  });

  const addActivity = (activity: Activity) => {
    state.value.unshift(activity);
    if (state.value.length > max) {
      state.value.pop();
    }
  };

  emitter.on(EVENT_TYPES.GAME.PLAYER_SPAWNED_IN_WORLD, (data) => {
    addActivity({
      icon: markIcon(() => import('~icons/ic/baseline-gamepad')),
      text: t('views.dashboard.recentActivity.playerEnterGame', [data.playerInfo.playerName]),
      time: dayjs(),
      tone: 'success',
    });
  });

  emitter.on(EVENT_TYPES.GAME.PLAYER_DISCONNECTED, (data) => {
    addActivity({
      icon: markIcon(() => import('~icons/ic/baseline-gamepad')),
      text: t('views.dashboard.recentActivity.playerLeaveGame', [data.playerInfo.playerName]),
      time: dayjs(),
      tone: 'danger',
    });
  });

  return {
    activities,
    addActivity,
  };
});
