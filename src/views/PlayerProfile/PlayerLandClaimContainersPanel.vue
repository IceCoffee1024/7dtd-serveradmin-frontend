<script setup lang="ts">
import type { LandClaimContainerInventoryDto, LandClaimContainerSummaryDto } from '~/api/landClaimContainers';
import type { InvItemDto, PositionDto } from '~/generated/api/types.gen';
import { useI18n } from 'vue-i18n';
import { getLandClaimContainerInventory, getLandClaimContainers } from '~/api/landClaimContainers';
import GameIconEx from '~/components/PlayerInventoryDialog/GameIconEx/index.vue';
import { useLatestAsync } from '~/composables/useLatestAsync';
import { formatPosition } from '~/utils';

const props = defineProps<{
  playerId: string;
}>();

const { t } = useI18n();

const selectedContainer = ref<LandClaimContainerSummaryDto | null>(null);
const inventoryDialogVisible = ref(false);
const fallbackRowKeys = new WeakMap<LandClaimContainerSummaryDto, string>();
let fallbackRowKeySequence = 0;

const {
  data: containers,
  pending: containersLoading,
  error: containersError,
  execute: executeContainers,
  reset: resetContainers,
} = useLatestAsync<LandClaimContainerSummaryDto[]>({ initialValue: [] });

const {
  data: inventory,
  pending: inventoryLoading,
  error: inventoryError,
  execute: executeInventory,
  reset: resetInventory,
} = useLatestAsync<LandClaimContainerInventoryDto>();

const inventoryItems = computed(() => {
  return (inventory.value?.items ?? [])
    .filter((item): item is InvItemDto => item != null)
    .slice()
    .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));
});

function getContainerName(container: LandClaimContainerSummaryDto | null): string {
  if (!container)
    return '--';

  return container.localizedName || container.blockName || t('views.playerProfile.landClaimContainers.unknownContainer');
}

function getOwnerName(container: LandClaimContainerSummaryDto): string {
  return container.ownerName || container.ownerId || container.landClaimOwnerName || container.landClaimOwnerId || '--';
}

function getSlotSummary(container: LandClaimContainerSummaryDto): string {
  const itemCount = container.itemCount ?? 0;
  const slotCount = container.slotCount;
  if (slotCount == null)
    return String(itemCount);

  return `${itemCount}/${slotCount}`;
}

function getLockType(container: LandClaimContainerSummaryDto): 'danger' | 'warning' | 'success' | 'info' {
  if (container.isUserAccessing)
    return 'warning';
  if (container.isLocked)
    return 'danger';
  if (container.hasPassword)
    return 'warning';
  return 'success';
}

function getLockLabel(container: LandClaimContainerSummaryDto): string {
  if (container.isUserAccessing)
    return t('views.playerProfile.landClaimContainers.accessing');
  if (container.isLocked)
    return t('views.playerProfile.landClaimContainers.locked');
  if (container.hasPassword)
    return t('views.playerProfile.landClaimContainers.password');
  return t('views.playerProfile.landClaimContainers.unlocked');
}

function hasPosition(position: PositionDto | null | undefined): position is PositionDto {
  return position?.x != null && position.y != null && position.z != null;
}

function getContainerRowKey(container: LandClaimContainerSummaryDto): string {
  const position = container.position;
  if (!hasPosition(position))
    return getFallbackRowKey(container);

  return `${position.x}:${position.y}:${position.z}`;
}

function getFallbackRowKey(container: LandClaimContainerSummaryDto): string {
  const existingKey = fallbackRowKeys.get(container);
  if (existingKey)
    return existingKey;

  fallbackRowKeySequence += 1;
  const key = `missing-position:${fallbackRowKeySequence}`;
  fallbackRowKeys.set(container, key);
  return key;
}

function getContainerRowClassName({ row }: { row: LandClaimContainerSummaryDto }): string {
  return hasPosition(row.position) ? '' : 'land-claim-containers__row--disabled';
}

function getItemDisplayName(item: InvItemDto): string {
  return item.localizationName || item.itemName;
}

function getItemSlot(item: InvItemDto, index: number): number {
  return item.slotIndex ?? index;
}

function asContainer(row: unknown): LandClaimContainerSummaryDto {
  return row as LandClaimContainerSummaryDto;
}

async function refreshContainers(): Promise<void> {
  inventoryDialogVisible.value = false;
  selectedContainer.value = null;
  resetInventory();
  resetContainers();

  if (!props.playerId) {
    return;
  }

  await executeContainers(() => getLandClaimContainers(props.playerId));
}

async function openInventory(container: LandClaimContainerSummaryDto): Promise<void> {
  const position = container.position;
  if (!props.playerId || !hasPosition(position))
    return;

  selectedContainer.value = container;
  resetInventory();
  inventoryDialogVisible.value = true;
  await executeInventory(() => getLandClaimContainerInventory(props.playerId, position));
}

function onInventoryDialogClosed(): void {
  resetInventory();
  selectedContainer.value = null;
}

onMounted(refreshContainers);
watch(() => props.playerId, refreshContainers);
</script>

<template>
  <section class="profile-panel">
    <div class="profile-panel__header">
      <div>
        <h3>{{ t('views.playerProfile.sections.landClaimContainers') }}</h3>
        <p class="land-claim-containers__hint">
          {{ t('views.playerProfile.landClaimContainers.loadedOnlyHint') }}
        </p>
      </div>
      <el-button :loading="containersLoading" type="primary" link @click="refreshContainers">
        {{ t('components.myTable.refresh') }}
      </el-button>
    </div>

    <el-alert
      v-if="containersError"
      class="mb-3"
      type="error"
      :title="t('views.playerProfile.landClaimContainers.loadFailed')"
      show-icon
      :closable="false"
    />

    <el-table
      v-loading="containersLoading"
      :data="containers ?? []"
      size="small"
      border
      :row-key="getContainerRowKey"
      :row-class-name="getContainerRowClassName"
      class="land-claim-containers__table"
      @row-click="openInventory"
    >
      <template #empty>
        <el-empty :description="t('views.playerProfile.landClaimContainers.empty')" />
      </template>

      <el-table-column :label="t('views.playerList.position')" min-width="150">
        <template #default="{ row }">
          <span class="text-xs font-mono">{{ formatPosition(row.position) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('views.playerProfile.landClaimContainers.container')" min-width="180">
        <template #default="{ row }">
          <div class="land-claim-containers__name">
            <span>{{ getContainerName(asContainer(row)) }}</span>
            <small v-if="asContainer(row).blockName && asContainer(row).localizedName">{{ asContainer(row).blockName }}</small>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('views.playerProfile.landClaimContainers.items')" width="100">
        <template #default="{ row }">
          {{ getSlotSummary(asContainer(row)) }}
        </template>
      </el-table-column>
      <el-table-column :label="t('views.playerProfile.landClaimContainers.lockState')" width="120">
        <template #default="{ row }">
          <el-tag :type="getLockType(asContainer(row))" effect="plain">
            {{ getLockLabel(asContainer(row)) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('views.playerProfile.landClaimContainers.owner')" min-width="160">
        <template #default="{ row }">
          {{ getOwnerName(asContainer(row)) }}
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="inventoryDialogVisible"
      :title="getContainerName(selectedContainer)"
      width="760px"
      destroy-on-close
      @closed="onInventoryDialogClosed"
    >
      <div v-loading="inventoryLoading" class="land-claim-inventory">
        <div class="land-claim-inventory__meta">
          <el-tag effect="plain">
            {{ formatPosition(inventory?.position ?? selectedContainer?.position) || '--' }}
          </el-tag>
          <el-tag v-if="selectedContainer" :type="getLockType(selectedContainer)" effect="plain">
            {{ getLockLabel(selectedContainer) }}
          </el-tag>
        </div>

        <el-alert
          v-if="inventoryError"
          type="error"
          :title="t('views.playerProfile.landClaimContainers.inventoryLoadFailed')"
          show-icon
          :closable="false"
        />

        <div v-else-if="inventoryItems.length > 0" class="land-claim-inventory__items">
          <div
            v-for="(item, index) in inventoryItems"
            :key="`${getItemSlot(item, index)}-${item.itemName}`"
            class="land-claim-inventory__item"
          >
            <GameIconEx :size="52" :font-size="16" v-bind="item" />
            <div class="land-claim-inventory__item-main">
              <span>{{ getItemDisplayName(item) }}</span>
              <small>{{ item.itemName }}</small>
            </div>
            <div class="land-claim-inventory__item-meta">
              <el-tag size="small" effect="plain">
                #{{ getItemSlot(item, index) }}
              </el-tag>
              <span>x{{ item.count }}</span>
            </div>
          </div>
        </div>

        <el-empty v-else :description="t('views.playerProfile.landClaimContainers.inventoryEmpty')" />
      </div>
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
.profile-panel h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.profile-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.land-claim-containers__hint {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.land-claim-containers__table {
  :deep(.el-table__row) {
    cursor: pointer;
  }

  :deep(.land-claim-containers__row--disabled) {
    cursor: default;
  }
}

.land-claim-containers__name {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.land-claim-containers__name small,
.land-claim-inventory__item-main small {
  color: var(--el-text-color-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.land-claim-inventory {
  min-height: 260px;
}

.land-claim-inventory__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.land-claim-inventory__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
  max-height: 520px;
  overflow-y: auto;
}

.land-claim-inventory__item {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.land-claim-inventory__item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.land-claim-inventory__item-main span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.land-claim-inventory__item-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  color: var(--el-text-color-regular);
  font-size: 13px;
}
</style>
