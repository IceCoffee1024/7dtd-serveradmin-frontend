<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { getPlayerSkills } from '~/api/gameServer';
import { useLocaleStore } from '~/stores/locale';
import Table from './Table.vue';

defineOptions({ name: 'PlayerSkillsDialog' });

type LayoutMode = 'fold' | 'expand';

const modelValue = ref<API.GameServer.PlayerSkill[]>([]);
const visible = ref(false);
const loading = ref(false);
const title = ref('');
const activeTab = ref('0');

const { t } = useI18n();
const localeStore = useLocaleStore();
const layout = ref<LayoutMode>('expand');

const options = computed<Array<{ label: string; value: LayoutMode }>>(() => [
  { label: t('components.playerSkillsDialog.fold'), value: 'fold' },
  { label: t('components.playerSkillsDialog.expand'), value: 'expand' },
]);

function onDialogClosed() {
  modelValue.value = [];
  activeTab.value = '0';
}

async function show(playerId: string, playerName: string) {
  title.value = `${playerName} (${playerId})`;
  loading.value = true;
  visible.value = true;
  activeTab.value = '0';
  try {
    modelValue.value = await getPlayerSkills(playerId, localeStore.languageEnglishName as API.GameServer.Language);
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
    :title="$t('components.playerSkillsDialog.header')"
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
                <icon-mdi-unfold-less-horizontal v-if="item.value === 'fold'" />
                <icon-mdi-unfold-more-horizontal v-else />
              </el-icon>
            </el-tooltip>
          </el-radio-button>
        </el-radio-group>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane v-for="(item, index) in modelValue" :key="item.name || String(index)" :name="String(index)">
          <template #label>
            <div class="flex gap-1 items-center">
              <GameIcon v-if="item.iconName" is-ui-icon :icon-name="item.iconName" :size="24" :preview="false" />
              <span>{{ `${item.localizationName || item.name} (${$t('components.playerSkillsDialog.level')} ${item.level})` }}</span>
            </div>
          </template>
          <Table :table-data="item.children ?? []" :is-expand-all="layout === 'expand'" />
        </el-tab-pane>
      </el-tabs>
    </template>

    <template #footer>
      <el-button @click="visible = false">
        {{ $t('common.close') }}
      </el-button>
    </template>
  </el-dialog>
</template>
