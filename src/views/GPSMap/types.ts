import type { Coordinate } from 'ol/coordinate';
import type Feature from 'ol/Feature';
import type Map from 'ol/Map';
import type { Point } from 'ol/geom';
import type BaseLayer from 'ol/layer/Base';
import type VectorSource from 'ol/source/Vector';
import type { Style } from 'ol/style';
import type { LAYER_ID } from './constants';
import type { EntityBasicInfoDto, EntityType, InvItemDto, PositionDto } from '~/generated/api/types.gen';

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
  claimPosition: PositionDto;
  claimActive: boolean;
}

/**
 * Defines the structure of player information data stored in OpenLayers features, used for displaying player info in popups.
 */
export interface EntityInfoFeatureData extends EntityBasicInfoDto {
}

/**
 * Defines the minimum shape for point features rendered by clustered map layers.
 */
export interface MapPointFeatureData {
  position: PositionDto;
}

/**
 * Defines the structure of trader POI data stored in OpenLayers features.
 */
export interface TraderLocationFeatureData extends MapPointFeatureData {
  id: number;
  name: string;
  localizationKey?: string | null;
  localizedName?: string | null;
  prefabName?: string | null;
  position: PositionDto;
  areaPosition: PositionDto;
  areaSize: PositionDto;
  protectPosition: PositionDto;
  protectSize: PositionDto;
  isClosed: boolean;
}

/**
 * Defines the structure of vehicle data stored in OpenLayers features.
 */
export interface VehicleLocationFeatureData extends MapPointFeatureData {
  entityId: number;
  entityName: string;
  vehicleName: string;
  localizedName?: string | null;
  position: PositionDto;
  isLoaded: boolean;
  hasStorage?: boolean | null;
  isLocked?: boolean | null;
  fuelPercent?: number | null;
  quality?: number | null;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerEntityId?: number | null;
  storageItemCount?: number | null;
}

/**
 * Defines the vehicle storage payload returned by the lazy inventory endpoint.
 */
export interface VehicleInventoryData {
  entityId: number;
  isLoaded: boolean;
  hasStorage: boolean;
  items: InvItemDto[];
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
  entityType: EntityType;
  iconStyle: Style;
  clusterFillColor: string;
  zIndex: number;
}

/**
 * Defines the options for setting up a generic clustered point location layer.
 */
export interface PointLocationLayerOptions<TData extends MapPointFeatureData> {
  layerId: OverlayLayerId;
  layerTitle: string;
  iconStyle: Style;
  clusterFillColor: string;
  zIndex: number;
  fetchLocations: () => Promise<TData[]>;
  getTooltipLabel: (data: TData) => string;
}

/**
 * Runtime handle returned by clustered point layers for feature-level interactions.
 */
export interface PointLocationLayerHandle<TData extends MapPointFeatureData> {
  layer: BaseLayer;
  source: VectorSource<Feature<Point>>;
  refresh: () => Promise<void>;
  pauseRefresh: () => void;
  resumeRefresh: () => void;
  getFeatureData: (feature: Feature<Point>) => TData | undefined;
}
