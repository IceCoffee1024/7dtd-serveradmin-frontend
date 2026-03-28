import type { Coordinate } from 'ol/coordinate';
import type Map from 'ol/Map';
import type { Style } from 'ol/style';
import type { LAYER_ID } from './constants';

/**
 * Defines runtime map metadata required by 7DTD map rendering.
 */
export interface SdtdMapInfo {
  regionSize: number;
  chunkSize: number;
  tileSize: number;
  maxZoom: number;
  worldSize: number;
  extraZoom: number;
}

/**
 * Defines the context shared by OpenLayers map modules.
 */
export interface OpenLayersModuleContext {
  map: Map;
  mapInfo: SdtdMapInfo;
}

/**
 * Map lifecycle events emitted by GPSMap component to manage OpenLayers resources and timers.
 * - ACTIVATED: Emitted when the map view is activated (keep-alive enter).
 * - DEACTIVATED: Emitted when the map view is deactivated (keep-alive left).
 * - REMOVE: Emitted when the map component is preparing to unmount, used for cleanup.
 */
export const MapLifecycle = {
  ACTIVATED: 'map:activated', // Keep-alive enter
  DEACTIVATED: 'map:deactivated', // Keep-alive left
  REMOVE: 'map:remove', // Component prepare to unmount
} as const;

/**
 * Defines the structure of land claim data stored in OpenLayers features, used for displaying claim information and managing interactions.
 */
export interface LandClaimFeatureData {
  playerId: string;
  playerName: string;
  lastLogin: string;
  claimPosition: API.GameServer.Position;
  claimActive: boolean;
}

/**
 * Defines the structure of player information data stored in OpenLayers features, used for displaying player info in popups.
 */
export interface EntityInfoFeatureData extends API.GameServer.EntityBasicInfo {
}

export type OverlayLayerId = (typeof LAYER_ID)[keyof typeof LAYER_ID];

/**
 * Defines the structure of player information data stored in OpenLayers features, used for displaying player info in popups.
 */
// eslint-disable-next-line ts/consistent-type-definitions
export type MapPopupEvents = {
  show: {
    layerId: OverlayLayerId;
    position: Coordinate;
  };
  hide: void;
  landClaimRemoved: void;
};

/**
 * Defines the options for setting up an entity location layer, including styling and interaction behavior.
 */
export interface EntityLayerOptions {
  layerId: OverlayLayerId;
  layerTitle: string;
  entityType: API.GameServer.EntityType;
  iconStyle: Style;
  clusterFillColor: string;
  zIndex: number;
}
