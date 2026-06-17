import type { OpenLayersModuleContext } from '../../types';
import type { PlayerLocationSampleDto } from '~/generated/api/types.gen';
import Feature from 'ol/Feature';
import Circle from 'ol/geom/Circle';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import { playerTrackingGetPlayerLocationTrack } from '~/generated/api/sdk.gen';
import { i18n } from '~/plugins/i18n';
import { LAYER_ID } from '../../constants';
import { layerRegistry } from '../mapRegistry';

export interface PlayerTrackingOverlayOptions {
  playerId?: string;
  startTime?: string;
  endTime?: string;
  minDistance?: number;
  centerX?: number;
  centerZ?: number;
  radius?: number;
}

function toFiniteNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildPointStyle(color: string, label?: string): Style {
  return new Style({
    image: new CircleStyle({
      radius: label ? 8 : 5,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
    }),
    text: label
      ? new Text({
          text: label,
          offsetY: -18,
          fill: new Fill({ color: '#ffffff' }),
          stroke: new Stroke({ color: 'rgba(0,0,0,0.8)', width: 3 }),
          font: '12px sans-serif',
        })
      : undefined,
  });
}

function locationToCoordinate(point: PlayerLocationSampleDto): [number, number] {
  return [point.x ?? 0, point.z ?? 0];
}

export async function setupPlayerTrackingOverlay(
  context: OpenLayersModuleContext,
  options: PlayerTrackingOverlayOptions,
) {
  const { map } = context;
  const source = new VectorSource();
  const layer = new VectorLayer({
    source,
    zIndex: 90,
    visible: true,
    style: (feature) => feature.get('style') as Style | undefined,
  });

  layer.set('id', LAYER_ID.PLAYER_TRACKING_OVERLAY);
  layer.set('title', i18n.global.t('views.map.playerTrackingOverlay'));
  layer.set('type', 'overlay');
  layer.set('interactive', false);
  map.addLayer(layer);
  layerRegistry.set(LAYER_ID.PLAYER_TRACKING_OVERLAY, layer);

  const centerX = toFiniteNumber(options.centerX);
  const centerZ = toFiniteNumber(options.centerZ);
  const radius = toFiniteNumber(options.radius);

  if (centerX != null && centerZ != null && radius != null && radius > 0) {
    const circle = new Feature({
      geometry: new Circle([centerX, centerZ], radius),
    });
    circle.set('style', new Style({
      fill: new Fill({ color: 'rgba(245, 158, 11, 0.14)' }),
      stroke: new Stroke({ color: '#f59e0b', width: 2, lineDash: [8, 6] }),
    }));
    source.addFeature(circle);
  }

  if (!options.playerId) {
    fitOverlay(map, source);
    return;
  }

  const { data } = await playerTrackingGetPlayerLocationTrack({
    path: { playerId: options.playerId },
    query: {
      startTime: options.startTime,
      endTime: options.endTime,
      minDistance: options.minDistance,
      maxPoints: 1000,
    },
    throwOnError: true,
  });

  const points = data?.points ?? [];
  const coordinates = points.map(locationToCoordinate);
  if (coordinates.length >= 2) {
    const line = new Feature({
      geometry: new LineString(coordinates),
    });
    line.set('style', new Style({
      stroke: new Stroke({ color: '#38bdf8', width: 4 }),
    }));
    source.addFeature(line);
  }

  points.forEach((point, index) => {
    const feature = new Feature({
      geometry: new Point(locationToCoordinate(point)),
    });
    const isFirst = index === 0;
    const isLast = index === points.length - 1;
    feature.set('style', buildPointStyle(
      isFirst ? '#22c55e' : isLast ? '#ef4444' : '#38bdf8',
      isFirst ? i18n.global.t('views.map.trackStart') : isLast ? i18n.global.t('views.map.trackEnd') : undefined,
    ));
    source.addFeature(feature);
  });

  layer.set('title', `${i18n.global.t('views.map.playerTrackingOverlay')} (${points.length})`);
  fitOverlay(map, source);
}

function fitOverlay(map: OpenLayersModuleContext['map'], source: VectorSource) {
  if (source.getFeatures().length === 0)
    return;

  const extent = source.getExtent();
  if (extent == null)
    return;

  map.getView().fit(extent, {
    duration: 250,
    maxZoom: 5,
    padding: [80, 80, 80, 80],
  });
}
