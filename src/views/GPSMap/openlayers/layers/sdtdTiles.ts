import type Projection from 'ol/proj/Projection';
import type { SdtdMapInfo } from '../../types';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import TileGrid from 'ol/tilegrid/TileGrid';
import { getMapTileUrl } from '~/api/gameServer';
import { useUserInfoStore } from '~/stores/userInfo';
import { LAYER_ID } from '../../constants';

/**
 * Creates SDTD raster tile layer for OpenLayers map.
 * @param mapInfo - Runtime map metadata from backend.
 * @param projection - Registered OpenLayers projection.
 * @returns OpenLayers raster tile layer instance.
 */
export function createSdtdTileLayer(mapInfo: SdtdMapInfo, projection: Projection): TileLayer<XYZ> {
  const resolutions = Array.from({ length: mapInfo.maxZoom + 1 }, (_, z) => 2 ** (mapInfo.maxZoom - z));

  const tileGrid = new TileGrid({
    origin: [0, 0],
    minZoom: 0,
    tileSize: mapInfo.tileSize,
    resolutions,
    extent: projection.getExtent(),
  });

  const source = new XYZ({
    projection,
    tileGrid,
    minZoom: 0,
    maxZoom: mapInfo.maxZoom,
    wrapX: false,
    attributions: '© The Fun Pimps LLC',
    tileUrlFunction: (tileCoord) => {
      // Builds a tile endpoint URL for OpenLayers tile requests.
      const z = tileCoord[0]; // Tile zoom level.
      const x = tileCoord[1]; // Tile x index.
      const y = tileCoord[2]; // Tile y index.
      const tmsY = -y - 1; // Convert XYZ y to TMS y index.

      const token = useUserInfoStore().accessToken; // Current user access token.
      return getMapTileUrl(z, x, tmsY, token);
    },
  });

  const layer = new TileLayer({
    source,
  });
  layer.set('id', LAYER_ID.SDTD_TILES_LAYER);

  return layer;
}
