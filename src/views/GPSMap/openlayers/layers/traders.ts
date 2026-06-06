import type { OpenLayersModuleContext, TraderLocationFeatureData } from '../../types';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { i18n } from '~/plugins/i18n';
import { client } from '~/generated/api/client.gen';
import { LAYER_ID } from '../../constants';
import { setupPointLocationLayer } from '../mapUtils';

/**
 * Registers trader POI layer.
 * @param context - Shared OpenLayers module context.
 */
export function setupTradersLayer(context: OpenLayersModuleContext) {
  setupPointLocationLayer<TraderLocationFeatureData>(context, {
    layerId: LAYER_ID.TRADERS_CLUSTER_LAYER,
    layerTitle: i18n.global.t('views.map.trader'),
    fetchLocations: async () => {
      const { data } = await client.get<TraderLocationFeatureData[], unknown, true>({
        security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
        url: '/api/GameServer/TraderLocations',
        throwOnError: true,
      });
      return data ?? [];
    },
    getTooltipLabel: data => data.name,
    iconStyle: new Style({
      image: new CircleStyle({
        radius: 13,
        fill: new Fill({ color: 'rgba(16, 185, 129, 0.88)' }),
        stroke: new Stroke({ color: '#ffffff', width: 2 }),
      }),
      text: new Text({
        text: 'T',
        fill: new Fill({ color: '#ffffff' }),
        font: 'bold 12px sans-serif',
        offsetY: 0.5,
      }),
    }),
    clusterFillColor: 'rgba(16, 185, 129, 0.85)',
    zIndex: 55,
  });
}
