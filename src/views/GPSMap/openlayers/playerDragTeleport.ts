import type Feature from 'ol/Feature';
import type { Point } from 'ol/geom';
import type Map from 'ol/Map';
import type MapBrowserEvent from 'ol/MapBrowserEvent';
import type { EntityInfoFeatureData, PointLocationLayerHandle } from '../types';
import { useMutation } from '@pinia/colada';
import Control from 'ol/control/Control';
import PointerInteraction from 'ol/interaction/Pointer';
import { usePopup } from '~/composables/usePopup';
import { gameServerTeleportToPositionMutation } from '~/generated/api/@pinia/colada.gen';
import { i18n } from '~/plugins/i18n';
import { formatPosition } from '~/utils';
import { useMapPopup } from '../composables/useMapPopup';

interface DragState {
  feature: Feature<Point>;
  data: EntityInfoFeatureData;
  originalCoordinate: number[];
}

type PointerMapBrowserEvent = MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>;

/**
 * Adds an explicit drag-to-teleport mode for online player markers.
 * Only unwrapped single-player cluster features can be dragged.
 */
export function setupPlayerDragTeleportControl(
  map: Map,
  onlinePlayersLayer: PointLocationLayerHandle<EntityInfoFeatureData>,
  actionsElement?: HTMLElement,
) {
  const { confirm, toast } = usePopup();
  const { hide: hidePopup } = useMapPopup();
  const teleportToPositionMutation = useMutation({
    ...gameServerTeleportToPositionMutation(),
  });

  let enabled = false;
  let dragState: DragState | undefined;
  const viewport = map.getViewport();

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ol-player-drag-button';
  button.textContent = i18n.global.t('views.teleport.tools.actions.teleport');
  button.title = i18n.global.t('views.teleport.tools.actions.teleport');

  function setEnabled(value: boolean) {
    enabled = value;
    button.classList.toggle('is-active', enabled);
    viewport.classList.toggle('is-player-drag-mode', enabled);
    if (enabled) {
      hidePopup();
      toast({ type: 'info', text: i18n.global.t('views.map.dragTeleportHint') });
    }
    else {
      restoreDraggedFeature();
      dragState = undefined;
      onlinePlayersLayer.resumeRefresh();
    }
  }

  button.onclick = () => setEnabled(!enabled);
  if (actionsElement) {
    actionsElement.prepend(button);
  }
  else {
    const element = document.createElement('div');
    element.className = 'ol-unselectable ol-control ol-player-drag';
    element.append(button);
    map.addControl(new Control({ element }));
  }

  function getSinglePlayerFeature(event: PointerMapBrowserEvent): Feature<Point> | undefined {
    let result: Feature<Point> | undefined;
    map.forEachFeatureAtPixel(event.pixel, (featureLike, layer) => {
      if (layer !== onlinePlayersLayer.layer || featureLike.get('selectclusterlink')) {
        return undefined;
      }

      const clustered = featureLike.get('features') as Feature<Point>[] | undefined;
      if (clustered?.length === 1) {
        result = clustered[0];
        return true;
      }

      return undefined;
    }, {
      layerFilter: layer => layer === onlinePlayersLayer.layer,
      hitTolerance: 8,
    });

    return result;
  }

  function restoreDraggedFeature() {
    if (!dragState) {
      return;
    }

    dragState.feature.getGeometry()?.setCoordinates(dragState.originalCoordinate);
  }

  async function finishDrag(targetCoordinate: number[]) {
    const state = dragState;
    dragState = undefined;

    if (!state) {
      return;
    }

    const target = {
      x: Math.round(targetCoordinate[0]),
      y: state.data.position.y,
      z: Math.round(targetCoordinate[1]),
    };
    const confirmed = await confirm({
      text: i18n.global.t('views.map.dragendTelePlayerConfirm', [
        state.data.entityName,
        formatPosition(target),
      ]),
      type: 'warning',
    });

    if (!confirmed) {
      state.feature.getGeometry()?.setCoordinates(state.originalCoordinate);
      onlinePlayersLayer.resumeRefresh();
      return;
    }

    try {
      await teleportToPositionMutation.mutateAsync({
        body: {
          entityId: state.data.entityId,
          x: target.x,
          y: target.y,
          z: target.z,
        },
      });
      toast({ type: 'success', title: i18n.global.t('views.teleport.tools.messages.success') });
      await onlinePlayersLayer.refresh();
    }
    catch (error) {
      console.error(error);
      state.feature.getGeometry()?.setCoordinates(state.originalCoordinate);
    }
    finally {
      onlinePlayersLayer.resumeRefresh();
    }
  }

  const interaction = new PointerInteraction({
    handleDownEvent: (event) => {
      if (!enabled) {
        return false;
      }

      const feature = getSinglePlayerFeature(event);
      if (!feature) {
        return false;
      }

      const data = onlinePlayersLayer.getFeatureData(feature);
      const geometry = feature.getGeometry();
      if (!data || !geometry) {
        return false;
      }

      hidePopup();
      onlinePlayersLayer.pauseRefresh();
      dragState = {
        feature,
        data,
        originalCoordinate: [...geometry.getCoordinates()],
      };
      viewport.style.cursor = 'grabbing';
      return true;
    },
    handleDragEvent: (event) => {
      dragState?.feature.getGeometry()?.setCoordinates(event.coordinate);
    },
    handleUpEvent: (event) => {
      viewport.style.cursor = enabled ? 'grab' : '';
      if (!dragState) {
        return false;
      }

      void finishDrag(event.coordinate);
      return false;
    },
  });

  map.addInteraction(interaction);

  map.on('pointermove', (event) => {
    if (!enabled || dragState || event.dragging) {
      return;
    }

    viewport.style.cursor = getSinglePlayerFeature(event) ? 'grab' : '';
  });

  map.on('movestart', () => {
    if (!dragState) {
      return;
    }

    restoreDraggedFeature();
    dragState = undefined;
    onlinePlayersLayer.resumeRefresh();
  });
}
