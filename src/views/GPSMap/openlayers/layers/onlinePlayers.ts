import type { OpenLayersModuleContext } from '../../types';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import { i18n } from '~/plugins/i18n';
import { LAYER_ID } from '../../constants';
import { setupEntityLocationLayer } from '../mapUtils';

/**
 * Registers online players layer.
 * @param context - Shared OpenLayers module context.
 */
export function setupOnlinePlayersLayer(context: OpenLayersModuleContext) {
  setupEntityLocationLayer(context, {
    layerId: LAYER_ID.ONLINE_PLAYERS_CLUSTER_LAYER,
    layerTitle: i18n.global.t('views.map.onlinePlayer'),
    entityType: 'OnlinePlayer',
    iconStyle: new Style({
      image: new Icon({
        src: new URL('~/assets/images/marker-survivor-2x.png', import.meta.url).href,
        anchor: [0.5, 0.5],
        scale: 0.5,
        opacity: 0.8,
        crossOrigin: 'anonymous',
      }),
    }),
    clusterFillColor: 'rgba(64, 158, 255, 0.85)',
    zIndex: 60,
  });
}
