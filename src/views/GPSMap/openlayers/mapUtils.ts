import type { ClusterOptions } from 'ol-ext/layer/AnimatedCluster';
import type { FeatureLike } from 'ol/Feature';
import type { Geometry, LineString, Polygon } from 'ol/geom';
import type { Options } from 'ol/layer/BaseVector';
import type { EntityInfoFeatureData, EntityLayerOptions, OpenLayersModuleContext } from '../types';
import { useIntervalFn } from '@vueuse/core';
import AnimatedCluster from 'ol-ext/layer/AnimatedCluster';
import { createEmpty, extend, getCenter, getHeight, getWidth } from 'ol/extent';
import Feature from 'ol/Feature';
import { Point } from 'ol/geom';
import { Cluster } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { getLocations } from '~/api/gameServer';
import { useMapPopup } from '../composables/useMapPopup';
import { REFRESH_INTERVAL_MS } from '../constants';
import { MapLifecycle } from '../types';
import { layerRegistry } from './mapRegistry';

/**
 * Get the center coordinate of a feature, with special handling for different geometry types.
 * - For Point, return the point's coordinates.
 * - For Polygon, return the interior point's coordinates.
 * - For LineString, return the midpoint of the line.
 * - For other geometries, return the center of the geometry's extent.
 */
export function getFeatureCenter(feature: Feature): number[] {
  const geometry = feature.getGeometry();
  if (!geometry)
    throw new Error('Feature has no geometry');

  const type = geometry.getType();

  if (type === 'Point') {
    return (geometry as Point).getCoordinates();
  }
  else if (type === 'Polygon') {
    return (geometry as Polygon).getInteriorPoint().getCoordinates();
  }
  else if (type === 'LineString' || type === 'MultiLineString') {
    return (geometry as LineString).getCoordinateAt(0.5);
  }
  else {
    return getCenter(geometry.getExtent());
  }
}

/**
 * Sets up an entity location layer with clustering and popups.
 * @param context - Shared OpenLayers module context.
 * @param options - Configuration options for the entity layer.
 */
export function setupEntityLocationLayer(context: OpenLayersModuleContext, options: EntityLayerOptions) {
  const { map, mapInfo } = context;

  const distance = 40;
  const scaledDistance = distance / (2 ** mapInfo.extraZoom);

  const pointSource = new VectorSource<Feature<Point>>();
  const clusterSource = new Cluster({
    distance,
    source: pointSource,
  });

  const clusterStyleCache = new Map<number, Style>();
  const clusterLayer = new AnimatedCluster({
    source: clusterSource,
    animationDuration: 500, // Animation duration in ms, default is 500ms
    style: (feature) => {
      const clustered = feature.get('features') as Feature<Point>[];
      const size = clustered.length;

      if (size === 1) {
        return options.iconStyle;
      }

      const cached = clusterStyleCache.get(size);
      if (cached) {
        return cached;
      }

      const style = new Style({
        image: new CircleStyle({
          radius: size >= 20 ? 22 : size >= 10 ? 18 : 14,
          fill: new Fill({ color: options.clusterFillColor }),
          stroke: new Stroke({ color: '#ffffff', width: 1 }),
        }),
        text: new Text({
          text: String(size),
          fill: new Fill({ color: '#ffffff' }),
          font: '11px sans-serif',
        }),
      });

      clusterStyleCache.set(size, style);
      return style;
    },
    visible: false,
    zIndex: options.zIndex,
  } as Options<Feature, VectorSource<Feature>> & ClusterOptions);
  clusterLayer.set('id', options.layerId);
  clusterLayer.set('title', options.layerTitle);
  clusterLayer.set('type', 'overlay');
  clusterLayer.set('interactive', true);
  layerRegistry.set(options.layerId, clusterLayer);
  map.addLayer(clusterLayer);

  const { show: showPopup } = useMapPopup();
  clusterLayer.set('onFeatureSelected', (feature: Feature, geometry: Geometry) => {
    const data = feature.get('data') as EntityInfoFeatureData;
    showPopup(options.layerId, data, (geometry as Point).getCoordinates());
  });

  function createPlayerMarker(entityInfo: API.GameServer.EntityBasicInfo): Feature<Point> {
    const { position } = entityInfo;
    const feature = new Feature<Point>(new Point([position.x, position.z]));
    feature.set('data', entityInfo);
    feature.set('layerId', options.layerId);
    feature.setStyle(options.iconStyle);
    return feature;
  }

  map.on('singleclick', (event) => {
    const featureLike = map.forEachFeatureAtPixel(event.pixel, f => f, {
      layerFilter: l => l === clusterLayer,
    });

    if (featureLike) {
      const mapView = map.getView();
      if (mapView.getResolution() === mapView.getMinResolution()) {
        return;
      }

      const clustered = featureLike.get('features') as Feature<Point>[] | undefined;
      if (clustered && clustered.length > 1) {
        const extent = createEmpty();
        clustered.forEach(f => extend(extent, f.getGeometry()!.getExtent()));

        // When the extent of the clustered points is small enough at the current resolution, clicking the cluster will show the tooltip directly without zooming in.
        if (getWidth(extent) <= scaledDistance && getHeight(extent) <= scaledDistance) {
          return;
        }

        mapView.fit(extent, {
          duration: 250,
          padding: [40, 40, 40, 40],
        });

        event.stopPropagation();
      }
    }
  });

  let isRefreshing = false;
  const refreshData = async (): Promise<void> => {
    if (isRefreshing) {
      return;
    }

    isRefreshing = true;
    try {
      const data = await getLocations(options.entityType);

      const features = data.map(item => createPlayerMarker(item));
      pointSource.clear(true);
      pointSource.addFeatures(features);

      clusterLayer.set('title', `${options.layerTitle} (${features.length})`);
    }
    finally {
      isRefreshing = false;
    }
  };

  const { pause, resume } = useIntervalFn(refreshData, REFRESH_INTERVAL_MS, { immediate: false });

  map.on(MapLifecycle.ACTIVATED as any, () => resume());
  map.on(MapLifecycle.DEACTIVATED as any, () => pause());
  map.on(MapLifecycle.REMOVE as any, () => pause());

  const getTooltipHTML = (featureLike: FeatureLike) => {
    const feature = featureLike.get('features') as Feature<Point>[] | undefined;
    if (feature?.length === 1) {
      const data = feature[0].get('data') as EntityInfoFeatureData;
      return `${options.layerTitle}: <strong>${data.entityName}</strong>`;
    }
    else {
      return `${options.layerTitle} (${feature?.length ?? 0})`;
    }
  };
  clusterLayer.set('getTooltipHTML', getTooltipHTML);

  clusterLayer.on('change:visible', async () => {
    if (clusterLayer.getVisible()) {
      await refreshData();
      resume();
    }
    else {
      pause();
    }
  });

  return clusterLayer;
}
