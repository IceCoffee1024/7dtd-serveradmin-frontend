import type { OpenLayersModuleContext, VehicleLocationFeatureData } from '../../types';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { i18n } from '~/plugins/i18n';
import { client } from '~/generated/api/client.gen';
import { useLocaleStore } from '~/stores/locale';
import { LAYER_ID } from '../../constants';
import { setupPointLocationLayer } from '../mapUtils';

/**
 * Registers vehicle layer.
 * @param context - Shared OpenLayers module context.
 */
export function setupVehiclesLayer(context: OpenLayersModuleContext) {
  const localeStore = useLocaleStore();

  setupPointLocationLayer<VehicleLocationFeatureData>(context, {
    layerId: LAYER_ID.VEHICLES_CLUSTER_LAYER,
    layerTitle: i18n.global.t('views.map.vehicle'),
    fetchLocations: async () => {
      const { data } = await client.get<VehicleLocationFeatureData[], unknown, true>({
        security: [{ scheme: 'basic', type: 'http' }, { name: 'Authorization', type: 'apiKey' }],
        query: {
          language: localeStore.languageEnglishName,
        },
        url: '/api/GameServer/VehicleLocations',
        throwOnError: true,
      });
      return data ?? [];
    },
    getTooltipLabel: data => data.localizedName ?? data.vehicleName ?? data.entityName,
    iconStyle: new Style({
      image: new CircleStyle({
        radius: 13,
        fill: new Fill({ color: 'rgba(59, 130, 246, 0.88)' }),
        stroke: new Stroke({ color: '#ffffff', width: 2 }),
      }),
      text: new Text({
        text: 'V',
        fill: new Fill({ color: '#ffffff' }),
        font: 'bold 12px sans-serif',
        offsetY: 0.5,
      }),
    }),
    clusterFillColor: 'rgba(59, 130, 246, 0.85)',
    zIndex: 56,
  });
}
