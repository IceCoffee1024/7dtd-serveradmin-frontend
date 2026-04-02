<script setup lang="ts">
import GameIconEx from '../GameIconEx/index.vue';

interface Props {
  bag?: API.GameServer.InvItem[];
  belt?: API.GameServer.InvItem[];
  equipment?: Array<API.GameServer.InvItem | null>;
}

const props = withDefaults(defineProps<Props>(), {
  bag: () => [],
  belt: () => [],
  equipment: () => [],
});

const iconSize = 80;

const equipmentItems = computed<API.GameServer.InvItem[]>(() => {
  return props.equipment.filter((item): item is API.GameServer.InvItem => !!item);
});
</script>

<template>
  <div class="flex gap-2">
    <div :style="{ minWidth: `${4 * iconSize + 50}px` }">
      <el-tag class="my-1" type="primary" effect="dark">
        {{ $t('components.playerInventoryDialog.bag') }}
      </el-tag>
      <div class="flex flex-wrap gap-1 content-start overflow-y-auto" :style="{ height: `${5 * iconSize + 22}px` }">
        <GameIconEx v-for="(item, index) in bag" :key="index" :size="iconSize" v-bind="item" background-color="#4d4d4d" />
      </div>
    </div>
    <div :style="{ minWidth: `${2 * iconSize + 8}px` }">
      <el-tag class="my-1" type="primary" effect="dark">
        {{ $t('components.playerInventoryDialog.equipment') }}
      </el-tag>
      <div class="flex flex-wrap gap-1 h-full overflow-y-auto">
        <GameIconEx v-for="(item, index) in equipmentItems" :key="index" :size="iconSize" v-bind="item" background-color="#4d4d4d" />
      </div>
    </div>
  </div>
  <div>
    <el-tag class="my-1" type="primary" effect="dark">
      {{ $t('components.playerInventoryDialog.belt') }}
    </el-tag>
    <div class="flex flex-wrap gap-1 overflow-y-auto" :style="{ height: `${iconSize + 8}px` }">
      <GameIconEx v-for="(item, index) in belt" :key="index" :size="iconSize" v-bind="item" background-color="#4d4d4d" />
    </div>
  </div>
</template>
