<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { getPlayerSkills } from '~/api/gameServer';
import MyDialog from '~/components/MyDialog/index.vue';
import { useLocaleStore } from '~/stores/locale';
import Table from './Table.vue';

defineOptions({ name: 'PlayerSkillsDialog' });

type LayoutMode = 'fold' | 'expand';

const modelValue = ref<API.GameServer.PlayerSkill[]>([]);
const dialogRef = useTemplateRef('dialogRef');
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

async function open(playerId: string, playerName: string) {
  title.value = `${playerName} (${playerId})`;
  loading.value = true;
  activeTab.value = '0';
  try {
    dialogRef.value?.open();
    modelValue.value = await getPlayerSkills(playerId, localeStore.languageEnglishName);
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
    class="min-w-650px"
    width="64%"
    :title="$t('components.playerSkillsDialog.header')"
    :show-footer="false"
    :loading="loading"
    @closed="onDialogClosed"
  >
    <div>
      <div class="mb-3 flex gap-4 items-center justify-between">
        <span>{{ title }}</span>
        <el-radio-group v-model="layout" size="small">
          <el-radio-button v-for="item in options" :key="item.value" :value="item.value">
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
        <el-tab-pane v-for="(item, index) in modelValue" :key="item.name || String(index)" :name="String(index)" lazy>
          <template #label>
            <div class="flex gap-1 items-center">
              <GameIcon v-if="item.iconName" is-ui-icon :icon-name="item.iconName" :size="24" :preview="false" />
              <span>{{ `${item.localizationName || item.name} (${$t('components.playerSkillsDialog.level')} ${item.level})` }}</span>
            </div>
          </template>
          <Table :table-data="item.children ?? []" :is-expand-all="layout === 'expand'" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </MyDialog>
</template>
