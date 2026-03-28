import type { OpenLayersModuleContext } from '../../types';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import { i18n } from '~/plugins/i18n';
import { LAYER_ID } from '../../constants';

/**
 * Creates a full world grid with region lines and labels.
 */
function createFullWorldGrid(worldSize: number, regionSize: number): Feature[] {
  const half = worldSize / 2;
  const features: Feature[] = [];

  // 1. Generate vertical and horizontal grid lines
  // For a 6144 map, this loop runs about 13 times (from -3072 to 3072 with step 512)
  for (let pos = -half; pos <= half; pos += regionSize) {
    // Vertical lines (X axis fixed)
    features.push(new Feature({
      geometry: new LineString([[pos, -half], [pos, half]]),
    }));
    // Horizontal lines (Z axis fixed)
    features.push(new Feature({
      geometry: new LineString([[-half, pos], [half, pos]]),
    }));
  }

  // 2. Generate Region labels
  // For a 6144 map, approximately 12x12 = 144 labels
  for (let x = -half; x < half; x += regionSize) {
    for (let z = -half; z < half; z += regionSize) {
      // Calculate Region number (e.g., -512 corresponds to -1)
      const rX = Math.floor(x / regionSize);
      const rZ = Math.floor(z / regionSize);

      const centerPoint = new Point([x, z]);
      const feature = new Feature({ geometry: centerPoint });
      feature.set('regionName', `r.${rX}.${rZ}.7rg`);
      features.push(feature);
    }
  }

  return features;
}

/**
 * Sets up region grid overlay for OpenLayers map and refreshes it by viewport.
 * @param context - Shared OpenLayers module context.
 */
export function setupRegionGridLayer(context: OpenLayersModuleContext) {
  const { map, mapInfo } = context;
  const source = new VectorSource();

  source.addFeatures(createFullWorldGrid(mapInfo.worldSize, mapInfo.regionSize));

  const lineStyle = new Style({
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.5)',
      width: 2,
    }),
  });

  const labelStyle = new Style({
    text: new Text({
      font: '900 13px "Tahoma", "Arial"',
      fill: new Fill({ color: 'white' }),
      stroke: new Stroke({ color: 'black', width: 2 }),
      offsetX: 8,
      offsetY: -8,
      textAlign: 'left',
      textBaseline: 'bottom',
      rotateWithView: true,
    }),
  });

  const layer = new VectorLayer({
    source,
    zIndex: 10,
    style: (feature, resolution) => {
      const geometry = feature.getGeometry();
      if (geometry instanceof Point) {
        // 1 / resolution will increase as you zoom in, so we can use it to scale the text size dynamically.
        // We also use Math.min to cap the maximum scale to prevent the text from becoming too large and overwhelming the screen when zoomed in.
        const dynamicScale = Math.max(0.5, Math.min(2, 1 / resolution * 4));
        const textStyle = labelStyle.getText()!;
        textStyle.setScale(dynamicScale);
        textStyle.setText(feature.get('regionName'));
        return labelStyle;
      }
      return lineStyle;
    },
    visible: false,
  });

  layer.set('id', LAYER_ID.REGION_GRID_LAYER);
  layer.set('title', i18n.global.t('views.map.region'));
  layer.set('type', 'overlay');

  map.addLayer(layer);
}
