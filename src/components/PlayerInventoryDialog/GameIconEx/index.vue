<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface Props {
  size?: number;
  itemName?: string;
  iconName?: string;
  iconColor?: string;
  localizationName?: string;
  count?: number;
  maxStackAllowed?: number;
  quality?: number;
  qualityColor?: string;
  useTimes?: number;
  maxUseTimes?: number;
  isMod?: boolean;
  isBlock?: boolean;
  backgroundColor?: string;
  fontSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 80,
  itemName: '',
  iconName: '',
  iconColor: '',
  localizationName: '',
  count: 0,
  maxStackAllowed: 0,
  quality: undefined,
  qualityColor: undefined,
  useTimes: 0,
  maxUseTimes: 0,
  isMod: false,
  isBlock: false,
  backgroundColor: undefined,
  fontSize: 24,
});

const qualityColor = computed(() => {
  const size = props.size;
  const durability = props.maxUseTimes ? (1 - props.useTimes / props.maxUseTimes) * size : size;
  return {
    backgroundColor: `#${props.qualityColor}C8`,
    width: `${durability > size ? size : durability}px`,
    height: `${(size * 2) / 10}px`,
    position: 'absolute',
    bottom: 0,
    left: 0,
  };
});

const sizePx = computed(() => {
  return `${props.size}px`;
});

const fontSizePx = computed(() => {
  return `${props.fontSize}px`;
});

const { t } = useI18n();
const tooltipContent = computed(() => {
  return `
${t('components.playerInventoryDialog.localizationName')}: ${props.localizationName} <br />
${t('components.playerInventoryDialog.itemName')}: ${props.itemName} <br />
${t('components.playerInventoryDialog.iconName')}: ${props.iconName} <br />
${t('components.playerInventoryDialog.iconColor')}: ${props.iconColor || 'FFFFFF'} <br />
${t('components.playerInventoryDialog.count')}: ${props.count} <br />
${t('components.playerInventoryDialog.maxStackAllowed')}: ${props.maxStackAllowed} <br />
${t('components.playerInventoryDialog.quality')}: ${props.quality ?? 0} <br />
${t('components.playerInventoryDialog.useTimes')}: ${props.useTimes} <br />
${t('components.playerInventoryDialog.maxUseTimes')}: ${props.maxUseTimes} <br />
${t('components.playerInventoryDialog.mod')}: ${props.isMod ? t('common.yes') : t('common.no')} <br />
${t('components.playerInventoryDialog.block')}: ${props.isBlock ? t('common.yes') : t('common.no')}`;
});
</script>

<template>
  <el-tooltip :content="tooltipContent" placement="top" effect="dark" :show-after="200" popper-class="inventory-icon-tooltip" raw-content>
    <div class="game-icon-ex" :style="{ backgroundColor }">
      <GameIcon :icon-name="iconName" :icon-color="iconColor" :size="size" />
      <template v-if="quality">
        <span :style="qualityColor" />
        <span class="quality-number">
          {{ quality }}
        </span>
      </template>
      <span v-else class="count">{{ count }}</span>
    </div>
  </el-tooltip>
</template>

<style scoped lang="scss">
.game-icon-ex {
  position: relative;
  height: v-bind(sizePx);
  width: v-bind(sizePx);

  .count {
    color: white;
    font-size: v-bind(fontSizePx);
    line-height: v-bind(fontSizePx);
    position: absolute;
    right: 1px;
    bottom: 1px;
    text-shadow:
      0 0 4px #32003c,
      0 0 4px #32003c;
  }

  .quality-number {
    color: white;
    font-size: v-bind(fontSizePx);
    line-height: v-bind(fontSizePx);
    position: absolute;
    bottom: 1px;
    text-shadow:
      0 0 4px #32003c,
      0 0 4px #32003c;
    display: flex;
    justify-content: center;
    width: 100%;
  }
}
</style>
