import type { Coordinate } from 'ol/coordinate';
import type Map from 'ol/Map';
import Control from 'ol/control/Control';
import { i18n } from '~/plugins/i18n';
import { MapLifecycle } from '../../types';

function formatCoord(coord?: Coordinate): string {
  if (!coord) {
    return '- E / - N';
  }

  const x = coord[0];
  const z = coord[1];
  const ew = x >= 0 ? ' E' : ' W';
  const ns = z >= 0 ? ' N' : ' S';
  return `${Math.abs(x).toFixed(0)}${ew} / ${Math.abs(z).toFixed(0)}${ns}`;
}

function createLabel(mousePos?: Coordinate, lastClick?: Coordinate): string {
  return `${i18n.global.t('views.map.mousePos')}: ${formatCoord(mousePos)}<br/>${i18n.global.t('views.map.lastClick')}: ${formatCoord(lastClick)}`;
}

/**
 * Adds a coordinates control for current mouse position and last clicked point.
 * @param map - OpenLayers map instance.
 */
export function setupCoordinatesControl(map: Map) {
  const element = document.createElement('div');
  element.className = 'ol-unselectable ol-control ol-coordinates';
  element.innerHTML = createLabel();

  const control = new Control({ element });
  map.addControl(control);

  let mousePos: Coordinate | undefined;
  let lastClick: Coordinate | undefined;

  const render = (): void => {
    element.innerHTML = createLabel(mousePos, lastClick);
  };

  map.on('pointermove', (event) => {
    mousePos = event.coordinate;
    render();
  });

  map.on('singleclick', (event) => {
    lastClick = event.coordinate;
    render();
  });

  const onPointerLeave = (): void => {
    mousePos = undefined;
    render();
  };

  const viewport = map.getViewport();
  viewport.addEventListener('pointerleave', onPointerLeave);

  map.on(MapLifecycle.REMOVE as any, () => {
    viewport.removeEventListener('pointerleave', onPointerLeave);
  });
}
