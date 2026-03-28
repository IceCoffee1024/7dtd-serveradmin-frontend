import type Map from 'ol/Map';
import { useIntervalFn } from '@vueuse/core';
import Control from 'ol/control/Control';
import { getStats } from '~/api/gameServer';
import { i18n } from '~/plugins/i18n';
import { MapLifecycle } from '../../types';

const REFRESH_INTERVAL_MS = 30000;

function formatGameTime(gameTime?: API.GameServer.Stats['gameTime']): string {
  const { t } = i18n.global;

  if (!gameTime) {
    return t('views.map.gameTimeLoading');
  }

  const hours = String(gameTime.hours).padStart(2, '0');
  const minutes = String(gameTime.minutes).padStart(2, '0');

  return t('views.map.gameTimeFormat', {
    days: gameTime.days,
    hours,
    minutes,
  });
}

/**
 * Adds game-time control and periodic stats refresh.
 * @param map - OpenLayers map instance.
 */
export function setupGameTimeControl(map: Map) {
  const element = document.createElement('div');
  element.className = 'ol-unselectable ol-control ol-game-time';
  element.textContent = formatGameTime();

  const control = new Control({ element });
  map.addControl(control);

  let isRefreshing = false;
  const refreshData = async (): Promise<void> => {
    if (isRefreshing) {
      return;
    }

    isRefreshing = true;
    try {
      const data = await getStats();
      element.textContent = formatGameTime(data.gameTime);
    }
    finally {
      isRefreshing = false;
    }
  };

  const { pause, resume } = useIntervalFn(refreshData, REFRESH_INTERVAL_MS, { immediateCallback: true });

  map.on(MapLifecycle.ACTIVATED as any, () => resume());
  map.on(MapLifecycle.DEACTIVATED as any, () => pause());
  map.on(MapLifecycle.REMOVE as any, () => pause());
}
