<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { getPlayerInventory } from '~/api/gameServer';
import { useLocaleStore } from '~/stores/locale';
import Grid from './Grid/index.vue';
import List from './List/index.vue';

defineOptions({ name: 'PlayerInventoryDialog' });

type LayoutMode = 'list' | 'grid';

const { t } = useI18n();
const modelValue = ref<API.GameServer.Inventory | null>(null);
const layout = ref<LayoutMode>('grid');

const options = computed<Array<{ label: string; value: LayoutMode }>>(() => [
  { label: t('components.playerInventoryDialog.list'), value: 'list' },
  { label: t('components.playerInventoryDialog.grid'), value: 'grid' },
]);

const visible = ref(false);
const loading = ref(false);
const title = ref('');
const localeStore = useLocaleStore();

function onDialogClosed(): void {
  modelValue.value = null;
}

async function show(playerId: string, playerName: string): Promise<void> {
  title.value = `${playerName} (${playerId})`;
  loading.value = true;
  visible.value = true;
  try {
    modelValue.value = await getPlayerInventory(playerId, localeStore.languageEnglishName as API.GameServer.Language);
  }
  finally {
    loading.value = false;
  }
}

defineExpose({
  show,
});
</script>

<template>
  <el-dialog
    v-model="visible"
    class="w-[64vw]"
    :title="$t('components.playerInventoryDialog.header')"
    append-to-body
    destroy-on-close
    @closed="onDialogClosed"
  >
    <div v-if="loading" class="f-center h-[50vh]">
      <el-skeleton animated class="w-full">
        <template #template>
          <div class="px-4 flex flex-col gap-3">
            <el-skeleton-item v-for="idx in 10" :key="idx" variant="text" class="h-6" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <template v-else>
      <div class="mb-3 flex gap-4 items-center justify-between">
        <span>{{ title }}</span>
        <el-radio-group v-model="layout" size="small">
          <el-radio-button v-for="item in options" :key="item.value" :label="item.value">
            <el-tooltip :content="item.label" placement="top">
              <el-icon>
                <icon-ic-round-view-list v-if="item.value === 'list'" />
                <icon-ic-round-grid-view v-else />
              </el-icon>
            </el-tooltip>
          </el-radio-button>
        </el-radio-group>
      </div>

      <List
        v-if="layout === 'list'"
        :bag="modelValue?.bag ?? []"
        :belt="modelValue?.belt ?? []"
        :equipment="modelValue?.equipment ?? []"
      />
      <Grid
        v-else
        :bag="modelValue?.bag ?? []"
        :belt="modelValue?.belt ?? []"
        :equipment="modelValue?.equipment ?? []"
      />
    </template>

    <template #footer>
      <el-button @click="visible = false">
        {{ $t('common.close') }}
      </el-button>
    </template>
  </el-dialog>
</template>
