import type { OpenLayersModuleContext } from '../../types';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import { i18n } from '~/plugins/i18n';
import { LAYER_ID } from '../../constants';
import { setupEntityLocationLayer } from '../mapUtils';

/**
 * Registers animals layer.
 * @param context - Shared OpenLayers module context.
 */
export function setupAnimalsLayer(context: OpenLayersModuleContext) {
  setupEntityLocationLayer(context, {
    layerId: LAYER_ID.ANIMALS_CLUSTER_LAYER,
    layerTitle: i18n.global.t('views.map.animal'),
    entityType: 'Animal',
    iconStyle: new Style({
      image: new Icon({
        src: new URL('~/assets/images/marker-animal-2x.png', import.meta.url).href,
        anchor: [0.5, 0.5],
        scale: 0.6,
        opacity: 0.8,
        crossOrigin: 'anonymous',
      }),
    }),
    clusterFillColor: 'rgba(245, 158, 11, 0.85)',
    zIndex: 30,
  });

  // const { map, mapInfo } = context;
  // const localeStore = useLocaleStore();

  // const pointSource = new VectorSource<Feature<Point>>();
  // const clusterSource = new Cluster({
  //   distance: 40,
  //   source: pointSource,
  // });

  // const iconStyle = new Style({
  //   image: new Icon({
  //     src: new URL('~/assets/images/marker-animal.png', import.meta.url).href,
  //     anchor: [0.5, 0.5],
  //     scale: 1,
  //     crossOrigin: 'anonymous',
  //   }),
  // });

  // const clusterStyleCache = new Map<number, Style>();
  // const layer = new VectorLayer({
  //   source: clusterSource,
  //   style: (feature) => {
  //     const clustered = feature.get('features') as Feature<Point>[] | undefined;
  //     const size = clustered?.length ?? 0;

  //     if (size <= 1) {
  //       return iconStyle;
  //     }

  //     const cached = clusterStyleCache.get(size);
  //     if (cached) {
  //       return cached;
  //     }

  //     const style = new Style({
  //       image: new CircleStyle({
  //         radius: size >= 50 ? 22 : size >= 20 ? 18 : 16,
  //         fill: new Fill({ color: 'rgba(245, 158, 11, 0.85)' }),
  //         stroke: new Stroke({ color: '#ffffff', width: 1 }),
  //       }),
  //       text: new Text({
  //         text: String(size),
  //         fill: new Fill({ color: '#ffffff' }),
  //         font: '11px sans-serif',
  //       }),
  //     });

  //     clusterStyleCache.set(size, style);
  //     return style;
  //   },
  //   zIndex: 30,
  // });
  // layer.set('id', ANIMALS_LAYER_ID);
  // layer.set('title', i18n.global.t('views.map.animal'));
  // layer.set('type', 'overlay');
  // map.addLayer(layer);

  // const popupElement = document.createElement('div');
  // popupElement.className = 'rounded bg-[var(--colors-surface-100)] p-2 text-xs shadow';

  // const popupOverlay = new Overlay({
  //   element: popupElement,
  //   positioning: 'bottom-center',
  //   offset: [0, -12],
  //   stopEvent: true,
  // });
  // map.addOverlay(popupOverlay);

  // const refreshData = async (): Promise<void> => {
  //   const data = await getLocations('Animal');

  //   const localizedNames = await Promise.all(data.map(async (item) => {
  //     const language = localeStore.languageEnglishName as API.GameServer.Language;
  //     const cacheKey = `${language}:${item.entityName}`;
  //     const cached = entityNameCache.get(cacheKey);
  //     if (cached) {
  //       return cached;
  //     }

  //     try {
  //       const localizedName = await getLocalizationByKey(item.entityName, language);
  //       entityNameCache.set(cacheKey, localizedName);
  //       return localizedName;
  //     }
  //     catch {
  //       return item.entityName;
  //     }
  //   }));

  //   const nextFeatures = data.map((item, index) => {
  //     const feature = new Feature<Point>(
  //       new Point(toOlCoordinate({ x: item.position.x, z: item.position.z }, mapInfo.maxZoom)),
  //     );

  //     feature.set('entityId', String(item.entityId));
  //     feature.set('entityName', localizedNames[index] ?? item.entityName);
  //     return feature;
  //   });

  //   pointSource.clear(true);
  //   pointSource.addFeatures(nextFeatures);
  //   setAnimalsCount(nextFeatures.length);
  // };

  // const polling = useMapLayerPolling({
  //   intervalMs: REFRESH_INTERVAL_MS,
  //   immediateOnStart: false,
  //   shouldRun: () => map.getLayers().getArray().includes(layer),
  //   execute: refreshData,
  //   onError: () => {
  //     setAnimalsCount(0);
  //   },
  // });

  // const clickKey: EventsKey = map.on('singleclick', (event) => {
  //   let handled = false;

  //   map.forEachFeatureAtPixel(
  //     event.pixel,
  //     (featureLike, targetLayer) => {
  //       if (targetLayer !== layer) {
  //         return undefined;
  //       }

  //       const clustered = featureLike.get('features') as Feature<Point>[] | undefined;
  //       const clusterSize = clustered?.length ?? 0;

  //       if (clusterSize > 1) {
  //         const firstGeometry = clustered?.[0]?.getGeometry();
  //         if (!firstGeometry) {
  //           return undefined;
  //         }

  //         const extent = firstGeometry.getExtent().slice() as [number, number, number, number];
  //         (clustered ?? []).slice(1).forEach((clusteredFeature) => {
  //           const geometry = clusteredFeature.getGeometry();
  //           if (geometry) {
  //             extend(extent, geometry.getExtent());
  //           }
  //         });

  //         map.getView().fit(extent, {
  //           duration: 250,
  //           maxZoom: mapInfo.maxZoom + 1,
  //           padding: [40, 40, 40, 40],
  //         });
  //         popupOverlay.setPosition(undefined);
  //         handled = true;
  //         return true;
  //       }

  //       const animalFeature = resolveSingleFeature(featureLike);
  //       if (!animalFeature) {
  //         return undefined;
  //       }

  //       const coordinate = (animalFeature.getGeometry() as Point).getCoordinates();
  //       const entityName = String(animalFeature.get('entityName') ?? '-');
  //       const entityId = String(animalFeature.get('entityId') ?? '-');

  //       popupElement.textContent = `${i18n.global.t('views.map.animal')}: ${entityName} (${entityId})`;
  //       popupOverlay.setPosition(coordinate);
  //       handled = true;
  //       return true;
  //     },
  //     { hitTolerance: 4 },
  //   );

  //   if (!handled) {
  //     popupOverlay.setPosition(undefined);
  //   }
  // });

  // const pointerMoveKey: EventsKey = map.on('pointermove', (event) => {
  //   let onFeature = false;

  //   map.forEachFeatureAtPixel(
  //     event.pixel,
  //     (_featureLike, targetLayer) => {
  //       if (targetLayer === layer) {
  //         onFeature = true;
  //         return true;
  //       }
  //       return undefined;
  //     },
  //     { hitTolerance: 4 },
  //   );

  //   map.getTargetElement().style.cursor = onFeature ? 'pointer' : '';
  // });

  // void polling.runNow();
  // polling.start();

  // return () => {
  //   polling.stop();
  //   unByKey(clickKey);
  //   unByKey(pointerMoveKey);
  //   popupOverlay.setPosition(undefined);
  //   map.removeOverlay(popupOverlay);
  //   map.removeLayer(layer);
  //   map.getTargetElement().style.cursor = '';
  // };
}
