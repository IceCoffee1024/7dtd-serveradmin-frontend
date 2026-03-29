<script lang="ts" setup>
import type { EntityInfoFeatureData, LandClaimFeatureData } from './types';
import { useMapPopup } from './composables/useMapPopup';
import { LAYER_ID } from './constants';
import EntityInfoPopup from './EntityInfoPopup.vue';
import LandClaimPopup from './LandClaimPopup.vue';

const { visible, activeLayerId, selectedData, emit, hide } = useMapPopup();
</script>

<template>
  <Transition name="popup-anim" appear>
    <div v-if="visible" class="ol-popup-card">
      <button class="close-button" :title="$t('common.close')" @click="hide()">
        <span aria-hidden="true">×</span>
      </button>
      <div class="box">
        <LandClaimPopup
          v-if="activeLayerId === LAYER_ID.LAND_CLAIMS_LAYER_GROUP"
          :data="(selectedData as LandClaimFeatureData)"
          @claim-removed="emit('landClaimRemoved')"
        />
        <EntityInfoPopup
          v-else-if="activeLayerId === LAYER_ID.OFFLINE_PLAYERS_CLUSTER_LAYER
            || activeLayerId === LAYER_ID.ONLINE_PLAYERS_CLUSTER_LAYER
            || activeLayerId === LAYER_ID.ANIMALS_CLUSTER_LAYER
            || activeLayerId === LAYER_ID.HOSTILES_CLUSTER_LAYER"
          :data="(selectedData as EntityInfoFeatureData)"
        />
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
/* Enter Active State & Leave Active State */
.popup-anim-enter-active,
.popup-anim-leave-active {
  /* Use 'ease-out' to give the popup a crisper, more professional feel */
  transition: all 0.25s ease-out;
}

/* Enter Start State (From) & Leave End State (To) */
.popup-anim-enter-from,
.popup-anim-leave-to {
  opacity: 0;
  /* Initial scale of 0.8, shifted down by 15px to create a floating-up effect */
  transform: scale(0.8) translateY(15px);
}

.ol-popup-card {
  background: rgba(50, 50, 50, 0.8);
  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.4);
  padding: 1px;
  text-align: left;
  border-radius: 12px;
  color: $map-text-color;
  font-size: 13px;
  text-shadow:
    1px 1px 2px rgba(0, 0, 0, 0.8),
    0 0 5px rgba(0, 0, 0, 0.5);
  position: relative;
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid rgba(50, 50, 50, 0.8);
    filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.4));
  }

  .close-button {
    position: absolute;
    top: 0;
    right: 0;
    border: none;
    text-align: center;
    width: 24px;
    height: 24px;
    font:
      16px / 24px Tahoma,
      Verdana,
      sans-serif;
    text-decoration: none;
    background: transparent;
    color: $map-button-color;
  }

  .box {
    margin: 13px 24px 13px 20px;
  }
}
</style>
