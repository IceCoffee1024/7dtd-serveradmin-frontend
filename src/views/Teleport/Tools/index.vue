<script setup lang="ts">
import type { OnlinePlayerDto } from '~/generated/api/types.gen';
import { useMutation, useQueryCache } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables/usePopup';
import {
  gameServerGetOnlinePlayersQuery,
  gameServerTeleportToPlayerMutation,
  gameServerTeleportToPositionMutation,
} from '~/generated/api/@pinia/colada.gen';

defineOptions({ name: 'TeleportToolsPage' });

const { t } = useI18n();
const { confirm, toast } = usePopup();
const queryCache = useQueryCache();

// ---- Online players ----
const onlinePlayers = ref<OnlinePlayerDto[]>([]);
const loadingPlayers = ref(false);
const teleportToPositionMutation = useMutation({
  ...gameServerTeleportToPositionMutation(),
});
const teleportToPlayerMutation = useMutation({
  ...gameServerTeleportToPlayerMutation(),
});

async function refreshPlayers() {
  loadingPlayers.value = true;
  try {
    const options = gameServerGetOnlinePlayersQuery({ query: { pageSize: 100 } });
    const entry = queryCache.ensure(options);
    const state = await queryCache.fetch(entry);

    if (state.status === 'error') {
      throw state.error;
    }

    onlinePlayers.value = state.data?.items ?? [];
  }
  catch (error) {
    console.error(error);
    onlinePlayers.value = [];
  }
  finally {
    loadingPlayers.value = false;
  }
}

onMounted(() => refreshPlayers());

// ---- Teleport to Position ----
const toPositionForm = reactive({
  entityId: null as number | null,
  x: null as number | null,
  y: null as number | null,
  z: null as number | null,
});
const toPositionLoading = ref(false);

async function submitToPosition() {
  const { entityId, x, y, z } = toPositionForm;
  if (entityId == null || x == null || y == null || z == null)
    return;
  const player = onlinePlayers.value.find(p => p.entityId === entityId);
  const name = player?.playerName ?? String(entityId);
  const confirmed = await confirm({
    text: t('views.teleport.tools.messages.confirmToPos', { name, x, y, z }),
    type: 'warning',
  });
  if (!confirmed)
    return;
  toPositionLoading.value = true;
  try {
    await teleportToPositionMutation.mutateAsync({ body: { entityId, x, y, z } });
    toast({ type: 'success', title: t('views.teleport.tools.messages.success') });
  }
  catch (error) {
    console.error(error);
  }
  finally {
    toPositionLoading.value = false;
  }
}

// ---- Teleport to Player ----
const toPlayerForm = reactive({
  sourceEntityId: null as number | null,
  targetEntityId: null as number | null,
});
const toPlayerLoading = ref(false);

async function submitToPlayer() {
  const { sourceEntityId, targetEntityId } = toPlayerForm;
  if (sourceEntityId == null || targetEntityId == null)
    return;
  const source = onlinePlayers.value.find(p => p.entityId === sourceEntityId)?.playerName ?? String(sourceEntityId);
  const target = onlinePlayers.value.find(p => p.entityId === targetEntityId)?.playerName ?? String(targetEntityId);
  const confirmed = await confirm({
    text: t('views.teleport.tools.messages.confirmToPlayer', { source, target }),
    type: 'warning',
  });
  if (!confirmed)
    return;
  toPlayerLoading.value = true;
  try {
    await teleportToPlayerMutation.mutateAsync({ body: { sourceEntityId, targetEntityId } });
    toast({ type: 'success', title: t('views.teleport.tools.messages.success') });
  }
  catch (error) {
    console.error(error);
  }
  finally {
    toPlayerLoading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <el-tabs type="border-card">
      <!-- Tab 1: Teleport to Position -->
      <el-tab-pane :label="t('views.teleport.tools.tabs.toPosition')">
        <div class="p-4 max-w-lg">
          <div class="mb-4 flex gap-2 items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('views.teleport.tools.hints.onlinePlayers') }}</span>
            <IconButton button-size="small" icon-size="16" :loading="loadingPlayers" :tooltip-content="t('components.myTable.refresh')" @click="refreshPlayers">
              <icon-mdi-refresh />
            </IconButton>
          </div>

          <el-form label-position="top" @submit.prevent>
            <el-form-item :label="t('views.teleport.tools.fields.sourcePlayer')">
              <el-select
                v-model="toPositionForm.entityId"
                :placeholder="t('views.teleport.tools.placeholders.selectPlayer')"
                filterable
                clearable
                class="w-full"
              >
                <el-option
                  v-for="player in onlinePlayers"
                  :key="player.entityId"
                  :label="player.playerName"
                  :value="player.entityId"
                />
              </el-select>
            </el-form-item>

            <div class="gap-3 grid grid-cols-3">
              <el-form-item :label="t('views.teleport.tools.fields.x')">
                <el-input-number v-model="toPositionForm.x" controls-position="right" class="w-full" />
              </el-form-item>
              <el-form-item :label="t('views.teleport.tools.fields.y')">
                <el-input-number v-model="toPositionForm.y" controls-position="right" class="w-full" />
              </el-form-item>
              <el-form-item :label="t('views.teleport.tools.fields.z')">
                <el-input-number v-model="toPositionForm.z" controls-position="right" class="w-full" />
              </el-form-item>
            </div>

            <el-form-item>
              <el-button
                type="primary"
                :loading="toPositionLoading"
                :disabled="toPositionForm.entityId == null || toPositionForm.x == null || toPositionForm.y == null || toPositionForm.z == null"
                @click="submitToPosition"
              >
                {{ t('views.teleport.tools.actions.teleport') }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- Tab 2: Teleport to Player -->
      <el-tab-pane :label="t('views.teleport.tools.tabs.toPlayer')">
        <div class="p-4 max-w-lg">
          <div class="mb-4 flex gap-2 items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('views.teleport.tools.hints.onlinePlayers') }}</span>
            <IconButton button-size="small" icon-size="16" :loading="loadingPlayers" :tooltip-content="t('components.myTable.refresh')" @click="refreshPlayers">
              <icon-mdi-refresh />
            </IconButton>
          </div>

          <el-form label-position="top" @submit.prevent>
            <el-form-item :label="t('views.teleport.tools.fields.sourcePlayer')">
              <el-select
                v-model="toPlayerForm.sourceEntityId"
                :placeholder="t('views.teleport.tools.placeholders.selectPlayer')"
                filterable
                clearable
                class="w-full"
              >
                <el-option
                  v-for="player in onlinePlayers"
                  :key="player.entityId"
                  :label="player.playerName"
                  :value="player.entityId"
                />
              </el-select>
            </el-form-item>

            <el-form-item :label="t('views.teleport.tools.fields.targetPlayer')">
              <el-select
                v-model="toPlayerForm.targetEntityId"
                :placeholder="t('views.teleport.tools.placeholders.selectPlayer')"
                filterable
                clearable
                class="w-full"
              >
                <el-option
                  v-for="player in onlinePlayers"
                  :key="player.entityId"
                  :label="player.playerName"
                  :value="player.entityId"
                  :disabled="player.entityId === toPlayerForm.sourceEntityId"
                />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :loading="toPlayerLoading"
                :disabled="toPlayerForm.sourceEntityId == null || toPlayerForm.targetEntityId == null"
                @click="submitToPlayer"
              >
                {{ t('views.teleport.tools.actions.teleport') }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
