<script setup lang="ts">
import Table from './Table.vue';

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

const activeTab = ref('bag');

const equipmentItems = computed<API.GameServer.InvItem[]>(() => {
  return props.equipment.filter((item): item is API.GameServer.InvItem => !!item);
});
</script>

<template>
  <div class="size-full">
    <el-tabs v-model="activeTab">
      <el-tab-pane name="bag" :label="$t('components.playerInventoryDialog.bag')">
        <Table :table-data="bag" />
      </el-tab-pane>
      <el-tab-pane name="belt" :label="$t('components.playerInventoryDialog.belt')">
        <Table :table-data="belt" />
      </el-tab-pane>
      <el-tab-pane name="equipment" :label="$t('components.playerInventoryDialog.equipment')">
        <Table :table-data="equipmentItems" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
