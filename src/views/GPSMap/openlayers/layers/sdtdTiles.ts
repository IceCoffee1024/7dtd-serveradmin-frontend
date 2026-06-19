import type ImageTile from 'ol/ImageTile';
import type Projection from 'ol/proj/Projection';
import type { SdtdMapInfo } from '../../types';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import TileGrid from 'ol/tilegrid/TileGrid';
import TileState from 'ol/TileState';
import { useUserInfoStore } from '~/stores/userInfo';
import { getMapTileUrl } from '~/utils/gameServerAssets';
import { LAYER_ID } from '../../constants';

async function loadAuthenticatedTile(tile: ImageTile, url: string): Promise<void> {
  try {
    const token = await useUserInfoStore().getAccessToken();
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok === false) {
      tile.setState(TileState.ERROR);
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(await response.blob());
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      tile.setImage(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      tile.setState(TileState.ERROR);
    };
    image.src = objectUrl;
  }
  catch {
    tile.setState(TileState.ERROR);
  }
}

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
    tileLoadFunction: (tile, url) => {
      void loadAuthenticatedTile(tile as ImageTile, url);
    },
    tileUrlFunction: (tileCoord) => {
      const z = tileCoord[0];
      const x = tileCoord[1];
      const y = tileCoord[2];
      const tmsY = -y - 1;

      return getMapTileUrl(z, x, tmsY);
    },
  });

  const layer = new TileLayer({
    source,
  });
  layer.set('id', LAYER_ID.SDTD_TILES_LAYER);

  return layer;
}
