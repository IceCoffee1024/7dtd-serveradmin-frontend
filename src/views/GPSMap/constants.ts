import type { Positioning } from 'ol/Overlay';

export const LAYER_ID = {
  SDTD_TILES_LAYER: 'sdtd_tiles_layer',
  REGION_GRID_LAYER: 'sdtd_region_grid_layer',
  LAND_CLAIMS_LAYER_GROUP: 'sdtd_land_claims_layer_group',
  OFFLINE_PLAYERS_CLUSTER_LAYER: 'sdtd_offline_players_cluster_layer',
  ONLINE_PLAYERS_CLUSTER_LAYER: 'sdtd_online_players_cluster_layer',
  ANIMALS_CLUSTER_LAYER: 'sdtd_animals_cluster_layer',
  HOSTILES_CLUSTER_LAYER: 'sdtd_hostiles_cluster_layer',
} as const;

export const POPUP_CONFIG_MAP = {
  [LAYER_ID.LAND_CLAIMS_LAYER_GROUP]: {
    offset: [0, -12],
    positioning: 'bottom-center',
  },
  [LAYER_ID.OFFLINE_PLAYERS_CLUSTER_LAYER]: {
    offset: [0, -36],
    positioning: 'bottom-center',
  },
  default: {
    offset: [0, -12],
    positioning: 'bottom-center',
  },
} as const satisfies Record<string, { offset: number[]; positioning: Positioning }>;

export const REFRESH_INTERVAL_MS = 10000;
