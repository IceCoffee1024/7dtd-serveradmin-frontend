import type { DroneLocationFeatureData, OpenLayersModuleContext } from '../../types';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { client } from '~/generated/api/client.gen';
import { i18n } from '~/plugins/i18n';
import { useLocaleStore } from '~/stores/locale';
import { LAYER_ID } from '../../constants';
import { setupPointLocationLayer } from '../mapUtils';

/**
 * Registers drone layer.
 * @param context - Shared OpenLayers module context.
 */
export function setupDronesLayer(context: OpenLayersModuleContext) {
  const localeStore = useLocaleStore();

  setupPointLocationLayer<DroneLocationFeatureData>(context, {
    layerId: LAYER_ID.DRONES_CLUSTER_LAYER,
    layerTitle: i18n.global.t('views.map.drone'),
    fetchLocations: async () => {
      const { data } = await client.get<DroneLocationFeatureData[], unknown, true>({
        security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
        query: {
          language: localeStore.languageEnglishName,
        },
        url: '/api/GameServer/DroneLocations',
        throwOnError: true,
      });
      return data ?? [];
    },
    getTooltipLabel: data => data.localizedName ?? data.entityName,
    iconStyle: new Style({
      image: new CircleStyle({
        radius: 12,
        fill: new Fill({ color: 'rgba(124, 58, 237, 0.88)' }),
        stroke: new Stroke({ color: '#ffffff', width: 2 }),
      }),
      text: new Text({
        text: 'D',
        fill: new Fill({ color: '#ffffff' }),
        font: 'bold 12px sans-serif',
        offsetY: 0.5,
      }),
    }),
    clusterFillColor: 'rgba(124, 58, 237, 0.85)',
    zIndex: 57,
  });
}
