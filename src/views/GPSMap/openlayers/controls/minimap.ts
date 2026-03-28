import type Map from 'ol/Map';
import type TileSource from 'ol/source/Tile';
import OverviewMap from 'ol/control/OverviewMap';
import TileLayer from 'ol/layer/Tile';

/**
 * Adds a minimap overview control based on SDTD raster tiles.
 * @param map - OpenLayers map instance.
 * @param sdtdTileSource - SDTD tile source instance.
 */
export function setupMinimapControl(
  map: Map,
  sdtdTileSource: TileSource,
) {
  const overviewLayer = new TileLayer({
    source: sdtdTileSource,
  });

  const control = new OverviewMap({
    className: 'ol-overviewmap',
    layers: [overviewLayer],
    collapseLabel: '»',
    label: '«',
    collapsed: false,
    collapsible: true,
  });

  map.addControl(control);
}
