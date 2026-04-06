<script setup lang="ts">
import type Map from 'ol/Map';
import { getMapInfo } from '~/api/gameServer';
import { initOpenLayers } from './openlayers/initOpenLayers';
import { layerRegistry } from './openlayers/mapRegistry';
import PopupContainer from './PopupContainer.vue';
import { MapLifecycle } from './types';

defineOptions({ name: 'GPSMap' });

const mapContainerRef = useTemplateRef('mapContainerRef');
const popupContainerRef = useTemplateRef('popupContainerRef');
const mapInstanceRef = shallowRef<Map>();

onMounted(async () => {
  const data = await getMapInfo();
  const mapInfo = {
    tileSize: data.blockSize, // Default to 128
    maxZoom: data.maxZoom, // Default to 5
    chunkSize: data.chunkSize, // Default to 16
    regionSize: data.regionSize, // Default to 512
    worldSize: data.worldSize, // Default to 8192
    extraZoom: 2, // Additional zoom levels for better close-up view
  };

  if (mapContainerRef.value && popupContainerRef.value) {
    mapInstanceRef.value = initOpenLayers(mapContainerRef.value, mapInfo, popupContainerRef.value);
  }
});

onUnmounted(() => {
  const map = mapInstanceRef.value;
  if (map) {
    map.dispatchEvent(MapLifecycle.REMOVE);
    map.setTarget(undefined);
    mapInstanceRef.value = undefined;
  }

  layerRegistry.clear();
});

onActivated(() => {
  mapInstanceRef.value?.dispatchEvent(MapLifecycle.ACTIVATED);
});

onDeactivated(() => {
  mapInstanceRef.value?.dispatchEvent(MapLifecycle.DEACTIVATED);
});
</script>

<template>
  <div class="map-wrapper">
    <div ref="mapContainerRef" class="map" />
    <div ref="popupContainerRef">
      <PopupContainer />
    </div>
  </div>
</template>

<style scoped lang="scss">
.map-wrapper {
  height: calc(100vh - 88px);
  background-image: url(~/assets/images/map-background.jpg);
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-position: center;
  background-size: cover;
  background-color: black;
  border-radius: 4px;

  .map {
    height: 100%;
    background-color: transparent;

    :deep(.ol-viewport) {
      button {
        cursor: pointer;
        color: $map-button-color;
        text-shadow: inherit;
      }

      .ol-control,
      .ol-overlay-container {
        cursor: auto;
      }

      .ol-custom-control {
        border: 1px solid rgba(255, 255, 255, 0.1);
        background-color: rgba(50, 50, 50, 0.6) !important;
        color: $map-text-color;
        box-shadow: 0 3px 14px rgba(0, 0, 0, 0.5);
        padding: 6px 10px 6px 6px;
        font-size: 12px;
        line-height: 16px;
        text-shadow:
          1px 1px 2px rgba(0, 0, 0, 0.8),
          0 0 5px rgba(0, 0, 0, 0.5);
      }

      .ol-tooltip {
        background: rgba(0, 0, 0, 0.75);
        color: #fff;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        margin-top: -12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      }

      .ol-rotate {
        top: auto;
        right: 8px;
        bottom: 200px;
      }

      .ol-game-time {
        @extend .ol-custom-control;
        left: 50%;
        top: 8px;
        transform: translateX(-50%);
      }

      .ol-coordinates {
        @extend .ol-custom-control;
        left: 8px;
        bottom: 8px;
      }

      .ol-render-actions {
        @extend .ol-custom-control;
        left: 8px;
        bottom: 64px;
        & > button {
          background: none;
          border: none;
          color: $map-button-color;
          width: auto;
          height: 20px;
          text-shadow: inherit;
        }
      }

      .ol-overviewmap {
        right: 8px;
        bottom: 40px;
        left: auto;

        & > button {
          right: 0;
          left: auto;
        }

        .ol-overviewmap-box {
          border: 2px solid $map-text-color;
          background-color: color-mix(in srgb, $map-text-color, transparent 80%);
        }
      }

      .layer-switcher {
        top: 8px;
        right: 8px;

        & > button {
          display: none;
        }

        .panel {
          @extend .ol-custom-control;

          ul {
            padding-left: 5px;
            margin: 0;

            li {
              display: flex;
              align-items: center;
              gap: 8px;
              list-style: none;
              font-weight: bold;

              input[type='checkbox'] {
                accent-color: $map-button-color;
                cursor: pointer;
                margin: 0;
                position: static;
              }

              label {
                cursor: pointer;
                padding: 0;
                color: $map-button-color;
              }
            }
          }
        }
      }
    }
  }
}
</style>
