import type { Coordinate } from 'ol/coordinate';
import type { OpenLayersModuleContext, OverlayLayerId } from '../types';
import { Overlay } from 'ol';
import { useMapPopup } from '../composables/useMapPopup';
import { POPUP_CONFIG_MAP } from '../constants';
import { MapLifecycle } from '../types';

export function setupGlobalPopupOverlay(context: OpenLayersModuleContext, popupContainer: HTMLElement) {
  const { map } = context;

  const popupOverlay = new Overlay({
    element: popupContainer,
    stopEvent: true,
    autoPan: {
      animation: {
        duration: 250,
      },
      margin: 20,
    },
  });
  map.addOverlay(popupOverlay);

  const { on: onPopup, off: offPopup, hide: hidePopup } = useMapPopup();
  let isDisposed = false;

  const handlePopupShow = ({ layerId, position }: { layerId: OverlayLayerId; position: Coordinate }) => {
    const config = POPUP_CONFIG_MAP[layerId as keyof typeof POPUP_CONFIG_MAP] ?? POPUP_CONFIG_MAP.default;
    popupOverlay.setOffset(config.offset);
    popupOverlay.setPositioning(config.positioning);

    // Wait for the popup content to finish rendering.
    nextTick(() => {
      if (isDisposed) {
        return;
      }
      popupOverlay.setPosition(position);
    });
  };

  onPopup('show', handlePopupShow);

  map.on(MapLifecycle.REMOVE as any, () => {
    isDisposed = true;
    offPopup('show', handlePopupShow);
    hidePopup();
    popupOverlay.setPosition(undefined);
    map.removeOverlay(popupOverlay);
  });
}
