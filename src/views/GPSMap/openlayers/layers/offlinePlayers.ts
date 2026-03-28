import type { OpenLayersModuleContext } from '../../types';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import { i18n } from '~/plugins/i18n';
import { LAYER_ID } from '../../constants';
import { setupEntityLocationLayer } from '../mapUtils';

/**
 * Registers offline players layer.
 * @param context - Shared OpenLayers module context.
 */
export function setupOfflinePlayersLayer(context: OpenLayersModuleContext) {
  setupEntityLocationLayer(context, {
    layerId: LAYER_ID.OFFLINE_PLAYERS_CLUSTER_LAYER,
    layerTitle: i18n.global.t('views.map.offlinePlayer'),
    entityType: 'OfflinePlayer',
    iconStyle: new Style({
      image: new Icon({
        src: new URL('~/assets/images/marker-survivor-2x.png', import.meta.url).href,
        anchor: [0.5, 0.5],
        scale: 0.5,
        opacity: 0.5,
        crossOrigin: 'anonymous',
      }),
    }),
    clusterFillColor: 'rgba(144, 147, 153, 0.85)',
    zIndex: 50,
  });
}
