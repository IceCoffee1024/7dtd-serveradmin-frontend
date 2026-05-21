<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import * as api from '~/api/teleport';
import { usePopup } from '~/composables';

defineOptions({ name: 'TeleportHomesPage' });

const { t } = useI18n();
const { toast, confirm } = usePopup();

const playerIdInput = ref('');
const searchedPlayerId = ref('');
const homes = ref<API.Teleport.HomeLocation[]>([]);
const loading = ref(false);
const hasSearched = ref(false);

async function searchHomes() {
  const playerId = playerIdInput.value.trim();
  if (!playerId)
    return;
  loading.value = true;
  hasSearched.value = true;
  searchedPlayerId.value = playerId;
  try {
    homes.value = await api.getHomes(playerId);
  }
  catch (error) {
    console.error(error);
    homes.value = [];
  }
  finally {
    loading.value = false;
  }
}

async function onDelete(row: API.Teleport.HomeLocation) {
  const confirmed = await confirm({
    text: t('views.teleport.homes.actions.deleteConfirm', { name: row.homeName }),
    type: 'warning',
  });
  if (!confirmed)
    return;

  try {
    await api.deleteHome(row.playerId, row.homeName);
    toast({ type: 'success', text: t('views.teleport.homes.messages.deleteSuccess') });
    homes.value = homes.value.filter(h => h.id !== row.id);
  }
  catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-2 items-end">
      <div class="flex-1 max-w-md">
        <div class="text-sm text-gray-700 mb-1 dark:text-gray-300">
          {{ t('views.teleport.homes.search.playerIdLabel') }}
        </div>
        <el-input
          v-model="playerIdInput"
          :placeholder="t('views.teleport.homes.search.playerIdPlaceholder')"
          clearable
          @keyup.enter="searchHomes"
        />
      </div>
      <el-button type="primary" :loading="loading" @click="searchHomes">
        <el-icon><icon-mdi-magnify /></el-icon>
        {{ t('views.teleport.homes.search.button') }}
      </el-button>
    </div>

    <template v-if="hasSearched">
      <el-table v-loading="loading" :data="homes" border row-key="id">
        <el-table-column prop="homeName" :label="t('views.teleport.homes.columns.homeName')" min-width="120" />
        <el-table-column prop="playerName" :label="t('views.teleport.homes.columns.playerName')" min-width="120" show-overflow-tooltip />
        <el-table-column prop="x" :label="t('views.teleport.homes.columns.x')" width="80" align="right" />
        <el-table-column prop="y" :label="t('views.teleport.homes.columns.y')" width="80" align="right" />
        <el-table-column prop="z" :label="t('views.teleport.homes.columns.z')" width="80" align="right" />
        <el-table-column prop="createdAt" :label="t('views.teleport.homes.columns.createdAt')" min-width="160" show-overflow-tooltip />
        <el-table-column :label="t('components.myTable.operation')" width="110" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" plain type="danger" @click="onDelete(row)">
              {{ t('views.teleport.homes.actions.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="homes.length === 0 && !loading" />
    </template>

    <el-empty v-else :description="t('views.teleport.homes.search.emptyHint')" />
  </div>
</template>
