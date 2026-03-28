import type { FeatureLike } from 'ol/Feature';
import type BaseLayer from 'ol/layer/Base';
import type { OpenLayersModuleContext } from '../types';
import { Overlay } from 'ol';
import { layerRegistry } from './mapRegistry';

export function setupGlobalTooltipOverlay(context: OpenLayersModuleContext) {
  const { map } = context;

  const tooltipElement = document.createElement('div');
  tooltipElement.className = 'ol-tooltip';
  const tooltipOverlay = new Overlay({
    element: tooltipElement,
    offset: [0, -4],
    positioning: 'bottom-left',
    stopEvent: true,
  });
  map.addOverlay(tooltipOverlay);

  interface HoveredItem { feature: FeatureLike; layer: BaseLayer }

  const getTheHihestZIndexLayer = (hoveredItems: HoveredItem[]) => {
    // Get the feature of the layer with the highest z-index as the currently hovered feature
    return hoveredItems.reduce((prev, current) => {
      const prevZIndex = prev.layer.getZIndex() || 0;
      const currentZIndex = current.layer.getZIndex() || 0;
      return currentZIndex > prevZIndex ? current : prev;
    });
  };

  let lastHoveredFeature: FeatureLike | undefined;
  map.on('pointermove', (event) => {
    if (event.dragging)
      return;

    const hoveredFeatures = map.getFeaturesAtPixel(event.pixel, {
      layerFilter: layer => layer.get('interactive') === true,
    });
    let hoveredItem: HoveredItem | undefined;
    if (hoveredFeatures.length > 0) {
      const hoveredItems: HoveredItem[] = [];
      hoveredFeatures.forEach((feature) => {
        if (feature.get('selectclusterlink')) {
          return; // Skip link features in clusters
        }
        const cluster = feature.get('features') as FeatureLike[] | undefined;
        // If it's a cluster, find the first feature for layer reference (they should all be from the same layer)
        const layerId = cluster ? cluster[0].get('layerId') : feature.get('layerId');
        const layer = layerRegistry.get(layerId);
        if (!layer) {
          return;
        }
        hoveredItems.push({ feature, layer });
      });
      if (hoveredItems.length > 0) {
        hoveredItem = getTheHihestZIndexLayer(hoveredItems);
      }
    }

    const currentFeature = hoveredItem?.feature;
    if (currentFeature !== lastHoveredFeature) {
      lastHoveredFeature = currentFeature;
      if (lastHoveredFeature) {
        const tooltipHTML = hoveredItem!.layer.get('getTooltipHTML')?.(lastHoveredFeature);
        if (tooltipHTML) {
          tooltipElement.innerHTML = tooltipHTML;
          tooltipOverlay.setPosition(event.coordinate);
        }
        else {
          tooltipOverlay.setPosition(undefined);
          lastHoveredFeature = undefined;
        }
      }
      else {
        // No features hovered, hide tooltip
        tooltipOverlay.setPosition(undefined);
      }
    }
    else if (currentFeature) {
      tooltipOverlay.setPosition(event.coordinate);
    }
  });
};
