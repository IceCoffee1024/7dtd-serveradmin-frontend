import type { Layer } from 'ol/layer';
import type LayerGroup from 'ol/layer/Group';
import type { OverlayLayerId } from '../types';

export const layerRegistry = new Map<OverlayLayerId, Layer | LayerGroup>();
