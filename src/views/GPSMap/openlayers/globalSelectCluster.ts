import type Feature from 'ol/Feature';
import type { Layer } from 'ol/layer';
import type { OpenLayersModuleContext, OverlayLayerId } from '../types';
import SelectCluster from 'ol-ext/interaction/SelectCluster';
import LayerGroup from 'ol/layer/Group';
import { Stroke, Style } from 'ol/style';
import { useMapPopup } from '../composables/useMapPopup';
import { layerRegistry } from './mapRegistry';

export function setupGlobalSelectCluster(context: OpenLayersModuleContext) {
  const { map } = context;

  // Line style for connections when expanded
  const defaultLinkStyle = new Style({
    stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.5)', width: 2, lineDash: [4, 4] }),
  });

  function getLayers(): Layer[] {
    return Array.from(layerRegistry.values()).flatMap((layer) => {
      if (layer instanceof LayerGroup) {
        return layer.getLayersArray();
      }
      return layer;
    });
  }

  // Add SelectCluster interaction for spiderfy effect on clusters
  const globalSelectCluster = new SelectCluster({
    pointRadius: 20, // Distance between icons when expanded
    animate: true, // Enable spiderfy animation
    animationDuration: 250, // Default is 500ms
    spiral: true, // Automatically arrange in a spiral if there are too many points
    circleMaxObject: 6, // Use spiral if more than 6 points, otherwise use circle
    featureStyle: (featureLike, resolution) => {
      if (featureLike.getGeometry()!.getType() === 'LineString') {
        return defaultLinkStyle;
      }

      const styleFunction = featureLike.getStyleFunction();
      if (!styleFunction) {
        console.warn('Selected feature has no style function', featureLike);
        return;
      }
      return styleFunction.call(featureLike, featureLike, resolution);
    },
    style: null,
    layers: getLayers(), // Only effective for cluster layers
    multi: false, // Only allow one cluster to be expanded at a time
    // selectCluster: false, // Don't select the cluster feature itself
  });

  const selectLayer = globalSelectCluster.getLayer();
  selectLayer.set('interactive', true);
  map.addInteraction(globalSelectCluster);

  const { on: onPopup, hide: hidePopup, activeLayerId } = useMapPopup();

  globalSelectCluster.on('select', (event) => {
    if (event.selected.length > 0) {
      let selectedFeature = event.selected[0];
      const clustered = selectedFeature.get('features') as Feature[] | undefined;
      if (clustered) {
        if (clustered.length === 1) {
          selectedFeature = clustered[0];
        }
        else {
          // If it's a true cluster (not just a single point), we won't show a popup, just return
          hidePopup();
          return;
        }
      }

      const layerId = selectedFeature.get('layerId') as OverlayLayerId | undefined;
      if (layerId) {
        const layer = layerRegistry.get(layerId);
        if (layer) {
          layer.get('onFeatureSelected')?.(selectedFeature, event.selected[0].getGeometry());
        }
      }
    }
    else {
      hidePopup();
    }
  });

  onPopup('hide', () => {
    globalSelectCluster.getFeatures().clear();
  });

  layerRegistry.forEach((layer) => {
    layer.on('change:visible' as any, () => {
      if (!layer.getVisible()) {
        const layerId = layer.get('id') as string | undefined;
        if (!layerId) {
          console.warn('A layer without id is being toggled, global select cluster cannot determine if it should clear spiderfy or not.', layer);
          return;
        }

        if (activeLayerId.value === layerId) {
          hidePopup();
        }

        // Get the currently selected feature in the global select cluster (usually the one being expanded)
        const selectedFeatures = globalSelectCluster.getFeatures();
        if (selectedFeatures.getLength() > 0) {
          const activeCluster = selectedFeatures.item(0);
          // Extract the original feature array from the cluster
          const innerFeatures = activeCluster.get('features');

          if (innerFeatures && innerFeatures.length > 0) {
            // Read the stamp on the original feature
            const currentClusterLayerId = innerFeatures[0].get('layerId');
            // Core check: Only clear if the currently expanded spiderweb indeed belongs to the layer group we are closing!
            if (currentClusterLayerId === layerId) {
              globalSelectCluster.clear();
            }
          }
        }
      }
    });
  });
}
