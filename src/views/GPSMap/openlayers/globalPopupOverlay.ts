import type { OpenLayersModuleContext } from '../types';
import { Overlay } from 'ol';
import { useMapPopup } from '../composables/useMapPopup';
import { POPUP_CONFIG_MAP } from '../constants';

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

  const { on: onPopup } = useMapPopup();

  onPopup('show', ({ layerId, position }) => {
    const config = POPUP_CONFIG_MAP[layerId as keyof typeof POPUP_CONFIG_MAP] ?? POPUP_CONFIG_MAP.default;
    popupOverlay.setOffset(config.offset);
    popupOverlay.setPositioning(config.positioning);

    // Wait for the popup content to finish rendering.
    nextTick(() => {
      popupOverlay.setPosition(position);
    });
  });
}
