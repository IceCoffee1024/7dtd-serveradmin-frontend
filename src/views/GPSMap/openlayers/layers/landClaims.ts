import type { FeatureLike } from 'ol/Feature';
import type { LandClaimFeatureData, OpenLayersModuleContext } from '../../types';
import { createEmpty, extend } from 'ol/extent';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import Cluster from 'ol/source/Cluster';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import { getLandClaims } from '~/api/gameServer';
import { i18n } from '~/plugins/i18n';
import { useMapPopup } from '../../composables/useMapPopup';
import { LAYER_ID } from '../../constants';
import { layerRegistry } from '../mapRegistry';

/**
 * Registers land claims layers with cluster fallback and remove action popup.
 * @param context - Shared OpenLayers module context.
 */
export function setupLandClaimsLayer(context: OpenLayersModuleContext) {
  const { map, mapInfo } = context;

  const active_style = new Style({
    fill: new Fill({ color: 'rgba(34, 197, 94, 0.2)' }),
    stroke: new Stroke({ color: '#22c55e', width: 1 }),
  });

  const inactive_style = new Style({
    fill: new Fill({ color: 'rgba(239, 68, 68, 0.2)' }),
    stroke: new Stroke({ color: '#ef4444', width: 1 }),
  });

  const switchZoom = 1;

  const polygonSource = new VectorSource<Feature<Polygon>>();
  const polygonLayer = new VectorLayer({
    source: polygonSource,
    style: (feature) => {
      const data = feature.get('data') as LandClaimFeatureData;
      return data.claimActive ? active_style : inactive_style;
    },
    minZoom: switchZoom,
  });

  const markerSource = new VectorSource<Feature<Point>>();
  const clusterSource = new Cluster({ distance: 40, source: markerSource });
  const clusterStyleCache = new Map<number, Style>();
  const clusterLayer = new VectorLayer({
    source: clusterSource,
    style: (feature) => {
      const clustered = feature.get('features') as Feature<Point>[];
      const size = clustered.length;
      const cached = clusterStyleCache.get(size);
      if (cached) {
        return cached;
      }

      const style = new Style({
        image: new CircleStyle({
          radius: size >= 20 ? 22 : size >= 10 ? 18 : 14,
          fill: new Fill({ color: '#22c55e' }),
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
    maxZoom: switchZoom,
  });

  const layerGroup = new LayerGroup({
    layers: [polygonLayer, clusterLayer],
    zIndex: 20,
    visible: false,
  });

  layerGroup.set('id', LAYER_ID.LAND_CLAIMS_LAYER_GROUP);
  layerGroup.set('title', i18n.global.t('views.map.landClaim'));
  layerGroup.set('type', 'overlay');
  layerGroup.getLayersArray().forEach(layer => layer.set('interactive', true));
  map.addLayer(layerGroup);
  layerRegistry.set(LAYER_ID.LAND_CLAIMS_LAYER_GROUP, layerGroup);

  function createClaimPolygon(
    position: API.GameServer.Position,
    claimSize: number,
    owner: API.GameServer.ClaimOwner,
  ): Feature<Polygon> {
    const half = Math.floor(claimSize / 2);
    const minX = position.x - half;
    const maxX = position.x + half;
    const minZ = position.z - half;
    const maxZ = position.z + half;

    const polygon = new Polygon([[
      [minX, minZ],
      [maxX, minZ],
      [maxX, maxZ],
      [minX, maxZ],
      [minX, minZ],
    ]]);

    const feature = new Feature<Polygon>(polygon);
    const data: LandClaimFeatureData = {
      playerId: owner.playerId,
      playerName: owner.playerName,
      lastLogin: owner.lastLogin,
      claimPosition: position,
      claimActive: owner.claimActive,
    };
    feature.set('data', data);
    feature.set('layerId', LAYER_ID.LAND_CLAIMS_LAYER_GROUP);
    return feature;
  }

  function createClaimMarker(position: API.GameServer.Position, claimSize: number, owner: API.GameServer.ClaimOwner): Feature<Point> {
    const feature = new Feature<Point>(new Point([position.x, position.z]));
    const data: LandClaimFeatureData = {
      playerId: owner.playerId,
      playerName: owner.playerName,
      lastLogin: owner.lastLogin,
      claimPosition: position,
      claimActive: owner.claimActive,
    };
    feature.set('data', data);
    feature.set('layerId', LAYER_ID.LAND_CLAIMS_LAYER_GROUP);
    return feature;
  }

  const loadLandClaims = async (): Promise<void> => {
    const response = await getLandClaims();
    const polygonFeatures: Feature<Polygon>[] = [];
    const markerFeatures: Feature<Point>[] = [];

    let claimCount = 0;
    response.claimOwners.forEach((owner) => {
      owner.claimPositions.forEach((position) => {
        polygonFeatures.push(createClaimPolygon(position, response.claimSize, owner));
        markerFeatures.push(createClaimMarker(position, response.claimSize, owner));
        claimCount++;
      });
    });

    polygonSource.clear(true);
    polygonSource.addFeatures(polygonFeatures);

    markerSource.clear(true);
    markerSource.addFeatures(markerFeatures);

    layerGroup.set('title', `${i18n.global.t('views.map.landClaim')} (${claimCount})`);
  };

  const { show: showPopup, hide: hidePopup, on: onPopup } = useMapPopup();
  onPopup('landClaimRemoved', async () => {
    await loadLandClaims();
    hidePopup();
  });

  layerGroup.set('onFeatureSelected', (feature: Feature) => {
    const data = feature.get('data') as LandClaimFeatureData;
    showPopup(LAYER_ID.LAND_CLAIMS_LAYER_GROUP, data, [data.claimPosition.x, data.claimPosition.z]);
  });

  map.on('singleclick', (event) => {
    const featureLike = map.forEachFeatureAtPixel(event.pixel, f => f, {
      layerFilter: l => l === clusterLayer,
    });

    if (featureLike) {
      const clustered = featureLike.get('features') as Feature<Point>[];
      const mapView = map.getView();
      if (clustered.length === 1) {
        mapView.animate({
          center: clustered[0].getGeometry()!.getCoordinates(),
          zoom: mapInfo.maxZoom + mapInfo.extraZoom,
          duration: 250,
        });
      }
      else {
        const extent = createEmpty();
        clustered.forEach(f => extend(extent, f.getGeometry()!.getExtent()));
        mapView.fit(extent, {
          duration: 250,
          maxZoom: mapInfo.maxZoom,
          padding: [40, 40, 40, 40],
        });
      }

      event.stopPropagation();
    }
  });

  const getTooltipHTML = (featureLike: FeatureLike) => {
    const feature = featureLike.get('features') as Feature<Point>[] | undefined;
    if (feature) {
      if (feature?.length === 1) {
        const data = feature[0].get('data') as LandClaimFeatureData;
        return `${i18n.global.t('views.map.landOwner')}: <strong>${data.playerName}</strong>`;
      }
      else {
        return `${i18n.global.t('views.map.landClaim')} (${feature?.length ?? 0})`;
      }
    }

    const data = featureLike.get('data') as LandClaimFeatureData;
    return `${i18n.global.t('views.map.landOwner')}: <strong>${data.playerName}</strong>`;
  };
  layerGroup.set('getTooltipHTML', getTooltipHTML);

  layerGroup.on('change:visible', async () => {
    if (layerGroup.getVisible()) {
      await loadLandClaims();
    }
  });
}
