import type { Overlay } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { MapPopupEvents, OverlayLayerId } from '../types';
import { createSharedComposable } from '@vueuse/core';
import mitt from 'mitt';

export const useMapPopup = createSharedComposable(() => {
  const visible = ref(false);
  const emitter = mitt<MapPopupEvents>();
  const selectedData = ref<any>();
  const activeLayerId = ref<OverlayLayerId>();
  const popupOverlayInstance = shallowRef<Overlay>();

  const registerMapInstance = (overlay: Overlay) => {
    popupOverlayInstance.value = overlay;
  };

  const show = (layerId: OverlayLayerId, data: any, position: Coordinate) => {
    activeLayerId.value = layerId;
    selectedData.value = data;
    visible.value = true;
    emitter.emit('show', {
      layerId,
      position,
    });
  };

  const hide = () => {
    if (!visible.value) {
      return;
    }

    visible.value = false;
    selectedData.value = undefined;
    activeLayerId.value = undefined;
    emitter.emit('hide');
  };

  return {
    visible: readonly(visible),
    activeLayerId: readonly(activeLayerId),
    selectedData: readonly(selectedData),
    registerMapInstance,
    show,
    hide,
    on: emitter.on,
    off: emitter.off,
    emit: emitter.emit,
  };
});
