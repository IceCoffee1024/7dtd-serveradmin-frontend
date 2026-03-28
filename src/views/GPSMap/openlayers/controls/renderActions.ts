import type Map from 'ol/Map';
import type TileSource from 'ol/source/Tile';
import Control from 'ol/control/Control';
import { renderExploredArea, renderFullMap } from '~/api/gameServer';
import { usePopup } from '~/composables/usePopup';
import { i18n } from '~/plugins/i18n';

/**
 * Adds render action controls for full-map and explored-area rendering.
 * @param map - OpenLayers map instance.
 * @param sdtdTileSource - SDTD tile source instance.
 */
export function setupRenderActionsControl(map: Map, sdtdTileSource: TileSource) {
  const { confirm } = usePopup();

  const element = document.createElement('div');
  element.className = 'ol-unselectable ol-control ol-render-actions';

  const createActionButton = (label: string): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    return button;
  };

  const refreshButton = createActionButton(i18n.global.t('views.map.refreshMap'));
  refreshButton.onclick = () => {
    sdtdTileSource.refresh();
  };

  const fullButton = createActionButton(i18n.global.t('views.map.renderFullMap'));
  fullButton.onclick = async () => {
    const confirmed = await confirm({ text: i18n.global.t('views.map.renderFullMapConfirm') });
    if (confirmed) {
      await renderFullMap();
    }
  };

  const exploredButton = createActionButton(i18n.global.t('views.map.renderExploredArea'));
  exploredButton.onclick = async () => {
    const confirmed = await confirm({ text: i18n.global.t('views.map.renderExploredAreaConfirm') });
    if (confirmed) {
      await renderExploredArea();
    }
  };

  element.append(refreshButton, fullButton, exploredButton);

  const control = new Control({ element });
  map.addControl(control);
}
