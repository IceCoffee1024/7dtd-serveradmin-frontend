<script setup lang="ts">
import type Map from 'ol/Map';
import type { SdtdMapInfo } from './types';
import { useQueryCache } from '@pinia/colada';
import { useRoute, useRouter } from 'vue-router';
import { gameServerGetMapInfoQuery } from '~/generated/api/@pinia/colada.gen';
import { i18n } from '~/plugins/i18n';
import { initOpenLayers } from './openlayers/initOpenLayers';
import { setupPlayerTrackingOverlay } from './openlayers/layers/playerTrackingOverlay';
import { layerRegistry } from './openlayers/mapRegistry';
import PopupContainer from './PopupContainer.vue';
import { MapLifecycle } from './types';

defineOptions({ name: 'GPSMap' });

const mapContainerRef = useTemplateRef('mapContainerRef');
const popupContainerRef = useTemplateRef('popupContainerRef');
const mapInstanceRef = shallowRef<Map>();
const queryCache = useQueryCache();
const route = useRoute();
const router = useRouter();
let cleanupRegionPick: (() => void) | undefined;

const isRegionPickMode = computed(() => Boolean(route.query.pickRegionForPlayerId));

async function fetchMapInfo(): Promise<SdtdMapInfo> {
  const entry = queryCache.ensure(gameServerGetMapInfoQuery());
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  const data = state.data;
  return {
    tileSize: data?.blockSize ?? 128,
    maxZoom: data?.maxZoom ?? 5,
    chunkSize: data?.chunkSize ?? 16,
    regionSize: data?.regionSize ?? 512,
    worldSize: data?.worldSize ?? 8192,
    extraZoom: 2,
  };
}

function firstQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value))
    return value[0]?.toString();
  return value == null ? undefined : value.toString();
}

function queryNumber(value: unknown): number | undefined {
  const raw = firstQueryValue(value);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function setupRegionPick(map: Map) {
  const playerId = firstQueryValue(route.query.pickRegionForPlayerId);
  if (!playerId)
    return;

  const viewport = map.getViewport();
  viewport.classList.add('is-region-pick-mode');

  const handleClick = (event: { coordinate: number[] }) => {
    const [x, z] = event.coordinate;
    const radius = queryNumber(route.query.pickRegionRadius) ?? 100;

    void router.push({
      name: 'PlayerProfile',
      params: {
        locale: route.params.locale,
        playerId,
      },
      query: {
        tab: 'tracking',
        regionCenterX: String(Math.round(x)),
        regionCenterZ: String(Math.round(z)),
        regionRadius: String(radius),
        ...(route.query.pickRegionStartTime ? { regionStartTime: firstQueryValue(route.query.pickRegionStartTime) } : {}),
        ...(route.query.pickRegionEndTime ? { regionEndTime: firstQueryValue(route.query.pickRegionEndTime) } : {}),
      },
    });
  };

  map.on('singleclick', handleClick);
  cleanupRegionPick = () => {
    map.un('singleclick', handleClick);
    viewport.classList.remove('is-region-pick-mode');
  };
}

onMounted(async () => {
  const mapInfo = await fetchMapInfo();

  if (mapContainerRef.value && popupContainerRef.value) {
    mapInstanceRef.value = initOpenLayers(mapContainerRef.value, mapInfo, popupContainerRef.value);
    await setupPlayerTrackingOverlay({ map: mapInstanceRef.value, mapInfo }, {
      playerId: firstQueryValue(route.query.trackingPlayerId),
      startTime: firstQueryValue(route.query.trackingStartTime),
      endTime: firstQueryValue(route.query.trackingEndTime),
      minDistance: queryNumber(route.query.trackingMinDistance),
      centerX: queryNumber(route.query.regionCenterX),
      centerZ: queryNumber(route.query.regionCenterZ),
      radius: queryNumber(route.query.regionRadius),
    });
    setupRegionPick(mapInstanceRef.value);
  }
});

onUnmounted(() => {
  cleanupRegionPick?.();
  cleanupRegionPick = undefined;

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
    <div v-if="isRegionPickMode" class="map-region-picker-hint">
      {{ i18n.global.t('views.map.pickRegionHint') }}
    </div>
    <div ref="mapContainerRef" class="map" />
    <div ref="popupContainerRef">
      <PopupContainer />
    </div>
  </div>
</template>

<style scoped lang="scss">
.map-wrapper {
  height: var(
    --layout-main-available-height,
    calc(
      100vh - var(--layout-content-offset-top, 56px) - var(--layout-footer-height, 0px) - var(
          --layout-main-padding-y,
          32px
        )
    )
  );
  min-height: 360px;
  background-image: url(~/assets/images/map-background.jpg);
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-position: center;
  background-size: cover;
  background-color: black;
  border-radius: 4px;
  position: relative;

  .map-region-picker-hint {
    position: absolute;
    top: 12px;
    left: 50%;
    z-index: 1;
    max-width: min(520px, calc(100% - 24px));
    transform: translateX(-50%);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 4px;
    background: rgba(20, 20, 20, 0.72);
    color: #fff;
    padding: 8px 12px;
    font-size: 13px;
    line-height: 1.4;
    text-align: center;
    pointer-events: none;
  }

  .map {
    height: 100%;
    background-color: transparent;

    :deep(.ol-viewport) {
      &.is-region-pick-mode {
        cursor: crosshair !important;
      }

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

          &.ol-player-drag-button.is-active {
            color: #67e8f9;
            font-weight: 700;
            text-decoration: underline;
            text-underline-offset: 3px;
          }
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
