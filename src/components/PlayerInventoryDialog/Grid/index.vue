<script setup lang="ts">
import type { InventorySlotItem } from '../types';
import type { ContextMenuOption } from '~/plugins/contextMenu';
import { useI18n } from 'vue-i18n';
import { showCustomContextMenu } from '~/plugins/contextMenu';
import { markIcon } from '~/utils';
import GameIconEx from '../GameIconEx/index.vue';

interface Props {
  bag?: InventorySlotItem[];
  belt?: InventorySlotItem[];
  equipment?: InventorySlotItem[];
}

withDefaults(defineProps<Props>(), {
  bag: () => [],
  belt: () => [],
  equipment: () => [],
});

const emit = defineEmits<{
  removeSelected: [slot: InventorySlotItem];
  removeAll: [slot: InventorySlotItem];
}>();

const iconSize = 80;
const { t } = useI18n();
const iconRemoveSelected = markIcon(() => import('~icons/mdi/package-variant-remove'));
const iconRemoveAll = markIcon(() => import('~icons/mdi/delete-sweep-outline'));

function onItemContextMenu(event: MouseEvent, slot: InventorySlotItem): void {
  const options: ContextMenuOption<InventorySlotItem>[] = [
    {
      label: t('components.playerInventoryDialog.removeSelected'),
      icon: iconRemoveSelected,
      disabled: item => item?.container === 'Equipment',
      command: item => item && emit('removeSelected', item),
    },
    {
      label: t('components.playerInventoryDialog.removeAllMatching'),
      icon: iconRemoveAll,
      divided: true,
      command: item => item && emit('removeAll', item),
    },
  ];
  showCustomContextMenu(event, options, slot);
}
</script>

<template>
  <div class="flex gap-2">
    <div :style="{ minWidth: `${4 * iconSize + 50}px` }">
      <el-tag class="my-1" type="primary" effect="dark">
        {{ $t('components.playerInventoryDialog.bag') }}
      </el-tag>
      <div class="flex flex-wrap gap-1 content-start overflow-y-auto" :style="{ height: `${5 * iconSize + 22}px` }">
        <GameIconEx
          v-for="slot in bag"
          :key="`${slot.container}-${slot.slotIndex}`"
          :size="iconSize"
          v-bind="slot.item"
          background-color="#4d4d4d"
          @contextmenu.prevent="onItemContextMenu($event, slot)"
        />
      </div>
    </div>
    <div :style="{ minWidth: `${2 * iconSize + 8}px` }">
      <el-tag class="my-1" type="primary" effect="dark">
        {{ $t('components.playerInventoryDialog.equipment') }}
      </el-tag>
      <div class="flex flex-wrap gap-1 h-full overflow-y-auto">
        <GameIconEx
          v-for="slot in equipment"
          :key="`${slot.container}-${slot.slotIndex}`"
          :size="iconSize"
          v-bind="slot.item"
          background-color="#4d4d4d"
          @contextmenu.prevent="onItemContextMenu($event, slot)"
        />
      </div>
    </div>
  </div>
  <div>
    <el-tag class="my-1" type="primary" effect="dark">
      {{ $t('components.playerInventoryDialog.belt') }}
    </el-tag>
    <div class="flex flex-wrap gap-1 overflow-y-auto" :style="{ height: `${iconSize + 8}px` }">
      <GameIconEx
        v-for="slot in belt"
        :key="`${slot.container}-${slot.slotIndex}`"
        :size="iconSize"
        v-bind="slot.item"
        background-color="#4d4d4d"
        @contextmenu.prevent="onItemContextMenu($event, slot)"
      />
    </div>
  </div>
</template>
