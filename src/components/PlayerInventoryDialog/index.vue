<script setup lang="ts">
import type { MyDialogExpose } from '../MyDialog/index.vue';
import { useI18n } from 'vue-i18n';
import { getPlayerInventory } from '~/api/gameServer';
import { useLocaleStore } from '~/stores/locale';
import Grid from './Grid/index.vue';
import List from './List/index.vue';

type LayoutMode = 'list' | 'grid';

const { t } = useI18n();
const modelValue = ref<API.GameServer.Inventory>();
const layout = ref<LayoutMode>('grid');

const options = computed(() => [
  { label: t('components.playerInventoryDialog.list'), value: 'list' },
  { label: t('components.playerInventoryDialog.grid'), value: 'grid' },
]);

const dialogRef = useTemplateRef('dialogRef');
const loading = ref(false);
const title = ref('');
const localeStore = useLocaleStore();

function onDialogClosed(): void {
  modelValue.value = undefined;
}

async function open(playerId: string, playerName: string): Promise<void> {
  title.value = `${playerName} (${playerId})`;
  loading.value = true;
  try {
    const data = await getPlayerInventory(playerId, localeStore.languageEnglishName);
    dialogRef.value?.open(data);
  }
  finally {
    loading.value = false;
  }
}

defineExpose({
  open,
});
</script>

<template>
  <MyDialog
    ref="dialogRef"
    v-slot="{ data, isFullscreen }"
    class="min-w-650px"
    width="64%"
    :title="$t('components.playerInventoryDialog.header')"
    :show-footer="false"
    :loading="loading"
    @closed="onDialogClosed"
  >
    <div>
      <div class="mb-3 flex gap-4 items-center justify-between">
        <span>{{ title }}</span>
        <el-radio-group v-model="layout" size="small">
          <el-radio-button v-for="item in options" :key="item.value" :value="item.value">
            <el-tooltip :content="item.label">
              <el-icon :size="16">
                <icon-ic-round-view-list v-if="item.value === 'list'" />
                <icon-ic-round-grid-view v-else />
              </el-icon>
            </el-tooltip>
          </el-radio-button>
        </el-radio-group>
      </div>
      <List
        v-if="layout === 'list'"
        :bag="data?.bag ?? []"
        :belt="data?.belt ?? []"
        :equipment="data?.equipment ?? []"
      />
      <Grid
        v-else
        :bag="data?.bag ?? []"
        :belt="data?.belt ?? []"
        :equipment="data?.equipment ?? []"
      />
    </div>
  </MyDialog>
</template>
