<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { InvItemDto, PositionDto } from '~/generated/api/types.gen';
import type { ContextMenuOption } from '~/plugins/contextMenu';
import type { LandClaimContainerInventoryDto, LandClaimContainerSummaryDto } from '~/api/landClaimContainers';
import { useI18n } from 'vue-i18n';
import { getAllLandClaimContainers, getLandClaimContainerInventory } from '~/api/landClaimContainers';
import GameIconEx from '~/components/PlayerInventoryDialog/GameIconEx/index.vue';
import { useGpsMapNavigation, useLatestAsync, usePlayerProfileNavigation } from '~/composables';
import { formatPosition } from '~/utils';

defineOptions({ name: 'PlayerListLandClaimContainers' });

interface LandClaimContainerListRow extends LandClaimContainerSummaryDto {
  rowKey: string;
}

const MAP_PREVIEW_RADIUS = 48;

const { t } = useI18n();
const { viewPlayerProfile } = usePlayerProfileNavigation();
const { viewLandClaimContainerOnMap } = useGpsMapNavigation();

const selectedContainer = ref<LandClaimContainerListRow | null>(null);
const inventoryDialogVisible = ref(false);

const {
  data: inventory,
  pending: inventoryLoading,
  error: inventoryError,
  execute: executeInventory,
  reset: resetInventory,
} = useLatestAsync<LandClaimContainerInventoryDto>();

const columns = computed<MyTableColumn<LandClaimContainerListRow>[]>(() => [
  {
    prop: 'keyword',
    label: t('components.myTable.keywordSearch'),
    show: false,
    exportable: false,
    search: {
      el: 'el-input',
      props: { clearable: true },
    },
  },
  { prop: 'landClaimOwnerName', label: t('views.playerList.playerName'), slot: 'player', sortable: true },
  { prop: 'position', label: t('views.playerList.position'), slot: 'position', sortable: true },
  { prop: 'localizedName', label: t('views.playerProfile.landClaimContainers.container'), slot: 'container', sortable: true },
  { prop: 'itemCount', label: t('views.playerProfile.landClaimContainers.items'), slot: 'items', sortable: true },
  { prop: 'isLocked', label: t('views.playerProfile.landClaimContainers.lockState'), slot: 'lockState', sortable: true },
  { prop: 'ownerName', label: t('views.playerProfile.landClaimContainers.owner'), slot: 'owner', sortable: true },
  { prop: 'coverage', label: t('views.playerProfile.landClaimContainers.loadedOnlyHint'), show: false },
]);

const contextMenuItems = computed<ContextMenuOption<LandClaimContainerListRow>[]>(() => [
  {
    label: t('views.playerList.viewProfile'),
    disabled: row => !getProfilePlayerId(row),
    command: (row) => {
      const playerId = getProfilePlayerId(row);
      if (!row || !playerId)
        return;

      viewPlayerProfile({
        playerId,
        playerName: row.landClaimOwnerName ?? row.ownerName ?? undefined,
      });
    },
  },
  {
    label: t('views.playerProfile.landClaimContainers.container'),
    disabled: row => !canOpenInventory(row),
    command: (row) => {
      if (!row)
        return;
      void openInventory(row);
    },
  },
  {
    label: t('views.playerProfile.tracking.viewRegionOnMap'),
    disabled: row => !hasPosition(row?.position),
    command: (row) => {
      if (!row)
        return;
      viewLandClaimContainerOnMap(row.position, MAP_PREVIEW_RADIUS);
    },
  },
]);

const inventoryItems = computed(() => {
  return (inventory.value?.items ?? [])
    .filter((item): item is InvItemDto => item != null)
    .slice()
    .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));
});

function toRow(container: LandClaimContainerSummaryDto): LandClaimContainerListRow {
  const positionKey = hasPosition(container.position)
    ? `${container.position.x}:${container.position.y}:${container.position.z}`
    : 'missing-position';

  return {
    ...container,
    rowKey: `${container.landClaimOwnerId ?? container.ownerId ?? 'unknown'}:${positionKey}`,
  };
}

function hasPosition(position: PositionDto | null | undefined): position is PositionDto {
  return position?.x != null && position.y != null && position.z != null;
}

function canOpenInventory(row: LandClaimContainerListRow | null | undefined): boolean {
  return !!row && hasPosition(row.position) && !!getInventoryPlayerId(row);
}

function getInventoryPlayerId(row: LandClaimContainerListRow | null | undefined): string | undefined {
  return row?.landClaimOwnerId || row?.ownerId || undefined;
}

function getProfilePlayerId(row: LandClaimContainerListRow | null | undefined): string | undefined {
  return row?.landClaimOwnerId || row?.ownerId || undefined;
}

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

function getItemDisplayName(item: InvItemDto): string {
  return item.localizationName || item.itemName;
}

function getItemSlot(item: InvItemDto, index: number): number {
  return item.slotIndex ?? index;
}

function normalizeKeyword(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function matchesKeyword(row: LandClaimContainerListRow, keyword: string): boolean {
  if (!keyword)
    return true;

  const haystack = [
    row.landClaimOwnerName,
    row.landClaimOwnerId,
    row.ownerName,
    row.ownerId,
    row.localizedName,
    row.blockName,
    formatPosition(row.position),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(keyword);
}

function compareNullableStrings(left: string | null | undefined, right: string | null | undefined): number {
  return (left ?? '').localeCompare(right ?? '');
}

function compareRows(left: LandClaimContainerListRow, right: LandClaimContainerListRow, sortField?: string): number {
  switch (sortField) {
    case 'landClaimOwnerName':
      return compareNullableStrings(left.landClaimOwnerName, right.landClaimOwnerName);
    case 'position':
      return comparePosition(left.position, right.position);
    case 'localizedName':
      return compareNullableStrings(getContainerName(left), getContainerName(right));
    case 'itemCount':
      return (left.itemCount ?? 0) - (right.itemCount ?? 0);
    case 'isLocked':
      return Number(left.isLocked === true) - Number(right.isLocked === true);
    case 'ownerName':
      return compareNullableStrings(getOwnerName(left), getOwnerName(right));
    default:
      return comparePosition(left.position, right.position);
  }
}

function comparePosition(left: PositionDto | null | undefined, right: PositionDto | null | undefined): number {
  const leftX = left?.x ?? Number.MIN_SAFE_INTEGER;
  const rightX = right?.x ?? Number.MIN_SAFE_INTEGER;
  if (leftX !== rightX)
    return leftX - rightX;

  const leftY = left?.y ?? Number.MIN_SAFE_INTEGER;
  const rightY = right?.y ?? Number.MIN_SAFE_INTEGER;
  if (leftY !== rightY)
    return leftY - rightY;

  return (left?.z ?? Number.MIN_SAFE_INTEGER) - (right?.z ?? Number.MIN_SAFE_INTEGER);
}

function sortRows(rows: LandClaimContainerListRow[], sortField?: string, sortOrder?: MyTableFetchParams['sortOrder']): LandClaimContainerListRow[] {
  const sorted = rows.slice().sort((left, right) => compareRows(left, right, sortField));
  if (sortOrder === 'descending')
    sorted.reverse();
  return sorted;
}

function paginateRows(rows: LandClaimContainerListRow[], pageNumber: number, pageSize: number): LandClaimContainerListRow[] {
  const start = Math.max(0, (pageNumber - 1) * pageSize);
  return rows.slice(start, start + pageSize);
}

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<LandClaimContainerListRow>> {
  const keyword = normalizeKeyword(params.search?.keyword);
  const rows = (await getAllLandClaimContainers()).map(toRow);
  const filteredRows = rows.filter(row => matchesKeyword(row, keyword));
  const sortedRows = sortRows(filteredRows, params.sortField, params.sortOrder);

  return {
    list: paginateRows(sortedRows, params.pageNumber, params.pageSize),
    total: filteredRows.length,
  };
}

async function openInventory(container: LandClaimContainerListRow): Promise<void> {
  const playerId = getInventoryPlayerId(container);
  const position = container.position;
  if (!playerId || !hasPosition(position))
    return;

  selectedContainer.value = container;
  resetInventory();
  inventoryDialogVisible.value = true;
  await executeInventory(() => getLandClaimContainerInventory(playerId, position));
}

function onInventoryDialogClosed(): void {
  resetInventory();
  selectedContainer.value = null;
}
</script>

<template>
  <div class="h-full">
    <MyTable
      row-key="rowKey"
      :columns="columns"
      :fetch-data="fetchData"
      :context-menu-items="contextMenuItems"
      :show-add-btn="false"
      :selectable="false"
      :operation-column-width="110"
      :auto-column-width="true"
    >
      <template #player="{ row }">
        <div class="land-claim-containers__name">
          <span>{{ row.landClaimOwnerName || row.landClaimOwnerId || '--' }}</span>
          <small v-if="row.landClaimOwnerId">{{ row.landClaimOwnerId }}</small>
        </div>
      </template>
      <template #position="{ row }">
        <span class="text-xs font-mono">{{ formatPosition(row.position) || '--' }}</span>
      </template>
      <template #container="{ row }">
        <div class="land-claim-containers__name">
          <span>{{ getContainerName(row) }}</span>
          <small v-if="row.blockName && row.localizedName">{{ row.blockName }}</small>
        </div>
      </template>
      <template #items="{ row }">
        {{ getSlotSummary(row) }}
      </template>
      <template #lockState="{ row }">
        <el-tag :type="getLockType(row)" effect="plain">
          {{ getLockLabel(row) }}
        </el-tag>
      </template>
      <template #owner="{ row }">
        {{ getOwnerName(row) }}
      </template>
      <template #operation />
    </MyTable>

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
  </div>
</template>

<style scoped lang="scss">
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
