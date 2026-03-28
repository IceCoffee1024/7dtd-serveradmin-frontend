import type { SdtdMapInfo } from '../types';
import { defaults as defaultControls } from 'ol/control/defaults';
import ZoomSlider from 'ol/control/ZoomSlider';
import Map from 'ol/Map';
import { addProjection } from 'ol/proj';
import Projection from 'ol/proj/Projection';
import View from 'ol/View';
import { setupCoordinatesControl } from './controls/coordinates';
import { setupGameTimeControl } from './controls/gameTime';
import { setupLayerSwitcherControl } from './controls/layerSwitcher';
import { setupMinimapControl } from './controls/minimap';
import { setupRenderActionsControl } from './controls/renderActions';
import { setupGlobalPopupOverlay } from './globalPopupOverlay';
import { setupGlobalSelectCluster } from './globalSelectCluster';
import { setupGlobalTooltipOverlay } from './globalTooltipOverlay';
import { setupAnimalsLayer } from './layers/animals';
import { setupHostilesLayer } from './layers/hostiles';
import { setupLandClaimsLayer } from './layers/landClaims';
import { setupOfflinePlayersLayer } from './layers/offlinePlayers';
import { setupOnlinePlayersLayer } from './layers/onlinePlayers';
import { setupRegionGridLayer } from './layers/regionGrid';
import { createSdtdTileLayer } from './layers/sdtdTiles';
import 'ol/ol.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import 'ol-ext/dist/ol-ext.css';

const SDTD_PROJECTION_CODE = 'SDTD-CRS';

/**
 * Initializes an OpenLayers-based GPS map with a linear pixel-first projection.
 * @param mapContainer - Container element of the map view.
 * @param mapInfo - Runtime map metadata from backend.
 * @param popupContainer - Container element for the popup overlay.
 * @returns Initialized OpenLayers result containing the map instance and popup anchors.
 */
export function initOpenLayers(
  mapContainer: HTMLElement,
  mapInfo: SdtdMapInfo,
  popupContainer: HTMLElement,
): Map {
  const resolutions = Array.from({ length: mapInfo.maxZoom + 1 + mapInfo.extraZoom }, (_, z) => 2 ** (mapInfo.maxZoom - z));

  const halfWorldSize = mapInfo.worldSize / 2;
  const projection = new Projection({
    code: SDTD_PROJECTION_CODE,
    units: 'pixels',
    extent: [-halfWorldSize, -halfWorldSize, halfWorldSize, halfWorldSize],
  });

  addProjection(projection);

  const sdtdTileLayer = createSdtdTileLayer(mapInfo, projection);
  const sdtdTileSource = sdtdTileLayer.getSource()!;

  const map = new Map({
    target: mapContainer,
    layers: [sdtdTileLayer],
    controls: defaultControls({
      attribution: true,
      zoom: true,
      rotate: true,
    }),
    view: new View({
      projection,
      center: [0, 0],
      zoom: 0,
      resolutions,
      constrainResolution: true,

      multiWorld: false,
      constrainOnlyCenter: true,
      extent: projection.getExtent(),
    }),
  });

  map.addControl(new ZoomSlider());

  const context = { map, mapInfo };

  setupRegionGridLayer(context);
  setupLandClaimsLayer(context);
  setupAnimalsLayer(context);
  setupHostilesLayer(context);
  setupOfflinePlayersLayer(context);
  setupOnlinePlayersLayer(context);

  setupGameTimeControl(map);
  setupRenderActionsControl(map, sdtdTileSource);
  setupMinimapControl(map, sdtdTileSource);
  setupCoordinatesControl(map);

  setupGlobalTooltipOverlay(context);
  setupGlobalSelectCluster(context);
  setupGlobalPopupOverlay(context, popupContainer);

  setupLayerSwitcherControl(map);

  map.on('pointermove', (event) => {
    if (event.dragging) {
      mapContainer.style.cursor = 'grabbing';
      return;
    }

    const hit = map.hasFeatureAtPixel(event.pixel, {
      layerFilter: (layer) => {
        return layer.get('interactive') === true;
      },
    });
    mapContainer.style.cursor = hit ? 'pointer' : 'grab';
  });

  return map;
}
