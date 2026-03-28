import type Map from 'ol/Map';
import LayerSwitcher from 'ol-layerswitcher';

/**
 * Adds ol-layerswitcher control for toggling OpenLayers overlay visibility.
 * @param map - OpenLayers map instance.
 */
export function setupLayerSwitcherControl(map: Map) {
  const control = new LayerSwitcher({
    reverse: false,
    startActive: true,
    activationMode: 'click',
    groupSelectStyle: 'group',
  });

  map.addControl(control);

  map.getLayers().forEach((layer) => {
    if (layer.get('title')) {
      layer.on('change:title' as any, () => {
        control.renderPanel();
      });
    }
  });
}
