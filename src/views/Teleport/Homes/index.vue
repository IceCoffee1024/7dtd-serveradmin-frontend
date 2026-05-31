<script setup lang="ts">
import type { HomeLocationDto } from '~/generated/api/types.gen';
import { useMutation, useQueryCache } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';
import {
  teleportDeleteHomeMutation,
  teleportGetHomesQuery,
} from '~/generated/api/@pinia/colada.gen';
import { invalidateGeneratedQueries } from '~/queries/generated';

defineOptions({ name: 'TeleportHomesPage' });

const { t } = useI18n();
const { toast, confirm } = usePopup();
const queryCache = useQueryCache();

const playerIdInput = ref('');
const searchedPlayerId = ref('');
const homes = ref<HomeLocationDto[]>([]);
const loading = ref(false);
const hasSearched = ref(false);
const deleteHomeMutation = useMutation({
  ...teleportDeleteHomeMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('Teleport');
  },
});

async function searchHomes() {
  const playerId = playerIdInput.value.trim();
  if (!playerId)
    return;
  loading.value = true;
  hasSearched.value = true;
  searchedPlayerId.value = playerId;
  try {
    const options = teleportGetHomesQuery({ query: { playerId } });
    const entry = queryCache.ensure(options);
    const state = await queryCache.fetch(entry);

    if (state.status === 'error') {
      throw state.error;
    }

    homes.value = state.data ?? [];
  }
  catch (error) {
    console.error(error);
    homes.value = [];
  }
  finally {
    loading.value = false;
  }
}

async function onDelete(row: HomeLocationDto) {
  const playerId = row.playerId ?? searchedPlayerId.value;
  const homeName = row.homeName;
  if (!playerId || !homeName) {
    return;
  }

  const confirmed = await confirm({
    text: t('views.teleport.homes.actions.deleteConfirm', { name: homeName }),
    type: 'warning',
  });
  if (!confirmed)
    return;

  try {
    await deleteHomeMutation.mutateAsync({ path: { playerId, homeName } });
    toast({ type: 'success', text: t('views.teleport.homes.messages.deleteSuccess') });
    homes.value = homes.value.filter(h => h.id !== row.id || h.homeName !== homeName);
  }
  catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div class="homes-page">
    <div class="homes-page__search-shell">
      <div class="homes-page__search-field">
        <div class="homes-page__search-label">
          {{ t('views.teleport.homes.search.playerIdLabel') }}
        </div>
        <el-input
          v-model="playerIdInput"
          :placeholder="t('views.teleport.homes.search.playerIdPlaceholder')"
          clearable
          @keyup.enter="searchHomes"
        />
      </div>
      <el-button type="primary" class="homes-page__search-btn" :loading="loading" @click="searchHomes">
        <el-icon><icon-mdi-magnify /></el-icon>
        {{ t('views.teleport.homes.search.button') }}
      </el-button>
    </div>

    <template v-if="hasSearched">
      <div class="homes-page__table-shell">
        <el-table v-loading="loading" :data="homes" row-key="id" class="homes-page__table" height="100%">
          <template #empty>
            <div class="app-empty-state homes-page__empty">
              <div class="app-empty-state__icon">
                <icon-mdi-home-search-outline />
              </div>
              <div class="app-empty-state__title">
                {{ t('views.teleport.homes.search.button') }}
              </div>
              <div class="app-empty-state__description">
                {{ t('views.teleport.homes.search.emptyHint') }}
              </div>
            </div>
          </template>
          <el-table-column prop="homeName" :label="t('views.teleport.homes.columns.homeName')" min-width="120" />
          <el-table-column prop="playerName" :label="t('views.teleport.homes.columns.playerName')" min-width="120" show-overflow-tooltip />
          <el-table-column prop="x" :label="t('views.teleport.homes.columns.x')" width="80" align="right" />
          <el-table-column prop="y" :label="t('views.teleport.homes.columns.y')" width="80" align="right" />
          <el-table-column prop="z" :label="t('views.teleport.homes.columns.z')" width="80" align="right" />
          <el-table-column prop="createdAt" :label="t('views.teleport.homes.columns.createdAt')" min-width="160" show-overflow-tooltip />
          <el-table-column :label="t('components.myTable.operation')" width="72" align="center" fixed="right">
            <template #default="{ row }">
              <IconButton
                round
                border
                button-size="small"
                type="danger"
                :tooltip-content="t('views.teleport.homes.actions.delete')"
                @click="onDelete(row)"
              >
                <icon-mdi-delete-outline />
              </IconButton>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <div v-else class="app-empty-state homes-page__empty homes-page__empty--initial">
      <div class="app-empty-state__icon">
        <icon-mdi-account-search-outline />
      </div>
      <div class="app-empty-state__title">
        {{ t('views.teleport.homes.search.playerIdLabel') }}
      </div>
      <div class="app-empty-state__description">
        {{ t('views.teleport.homes.search.emptyHint') }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.homes-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  min-height: 0;
}

.homes-page__search-shell {
  display: flex;
  gap: 0.75rem;
  align-items: end;
  padding: 1rem;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 72%, white 28%);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 7%, transparent), transparent 38%),
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.05);
}

.homes-page__search-field {
  flex: 1;
  max-width: 28rem;
}

.homes-page__search-label {
  margin-bottom: 0.35rem;
  color: var(--el-text-color-secondary);
  font-size: 0.84rem;
  font-weight: 600;
}

.homes-page__search-btn {
  border-radius: 999px;
  padding-inline: 1rem;
}

.homes-page__table-shell {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 1rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 72%, white 28%);
  border-radius: 28px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 97%, white 3%), var(--el-bg-color));
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.05);
}

.homes-page__table {
  flex: 1 1 auto;
  min-height: 0;

  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }
}

.homes-page__empty {
  min-height: 220px;
}

.homes-page__empty--initial {
  margin-top: 0.25rem;
}

@media (max-width: 720px) {
  .homes-page__search-shell {
    flex-direction: column;
    align-items: stretch;
  }

  .homes-page__search-field {
    max-width: none;
  }
}
</style>
