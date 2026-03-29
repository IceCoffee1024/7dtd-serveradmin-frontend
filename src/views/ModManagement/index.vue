<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/useMyTable';
import { useI18n } from 'vue-i18n';
import { getMods, toggleModStatus } from '~/api/gameServer';
import { usePopup } from '~/composables';
import { orderByField, searchByKeyword } from '~/utils/index';

const { t } = useI18n();
const { toast } = usePopup();

const tableRef = useTemplateRef('tableRef');

type ModItem = API.GameServer.ModInfo;

const columns = computed<MyTableColumn<ModItem>[]>(() => [
  { prop: 'displayName', label: t('views.modManagement.columns.displayName'), slot: 'displayName', sortable: true, className: 'min-w-60' },
  { prop: 'author', label: t('views.modManagement.columns.author'), sortable: true, className: 'min-w-40' },
  { prop: 'version', label: t('views.modManagement.columns.version'), sortable: true, className: 'min-w-28' },
  { prop: 'website', label: t('views.modManagement.columns.website'), slot: 'website', className: 'min-w-60' },
  { prop: 'isLoaded', label: t('views.modManagement.columns.loaded'), slot: 'isLoaded', className: 'min-w-32 text-center' },
  { prop: 'isUninstalled', label: t('views.modManagement.columns.uninstalled'), slot: 'isUninstalled', className: 'min-w-36 text-center' },
  { prop: 'actions', label: t('views.modManagement.columns.actions'), slot: 'actions', exportable: false, className: 'min-w-40 text-center' },
]);

const pendingIds = ref(new Set<string>());

function getModKey(mod: ModItem): string {
  return mod.folderName || mod.name || '';
}

function isPending(id: string): boolean {
  return pendingIds.value.has(id);
}

function setPending(id: string, value: boolean) {
  const next = new Set(pendingIds.value);
  if (value) {
    next.add(id);
  }
  else {
    next.delete(id);
  }
  pendingIds.value = next;
}

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<ModItem>> {
  const response = await getMods();
  const list = Array.isArray(response)
    ? response
    : (response?.items ?? response?.data ?? []);
  let data = searchByKeyword(list, params.searchQuery?.trim() || '', ['displayName', 'name', 'author', 'folderName', 'description']);
  data = orderByField(data, params.sortField ?? '', params.sortOrder === 'descending');
  return {
    list: data.slice((params.pageNumber - 1) * params.pageSize, params.pageNumber * params.pageSize),
    total: data.length,
  };
}

async function onToggleStatus(mod: ModItem) {
  const key = getModKey(mod);
  if (!key || isPending(key)) {
    return;
  }

  setPending(key, true);
  try {
    await toggleModStatus(key);
    toast({
      type: 'success',
      title: t('views.modManagement.toast.title'),
      text: t('views.modManagement.toast.toggleSuccess'),
    });
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    setPending(key, false);
  }
}

defineExpose({ reload: () => tableRef.value?.reload() });
</script>

<template>
  <div class="h-[calc(100vh-138px)]">
    <MyTable
      ref="tableRef"
      row-key="folderName"
      :columns="columns"
      :fetch-data="fetchData"
      :is-selectable="false"
      :is-show-add-btn="false"
      :is-show-edit-btn="false"
      :is-show-delete-btn="false"
    >
      <template #displayName="{ row }">
        <div class="flex flex-col gap-1">
          <span class="font-semibold">{{ row.displayName || row.name }}</span>
          <span v-if="row.description" class="text-xs text-gray-500 dark:text-gray-300">{{ row.description }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-300">{{ row.folderName }}</span>
        </div>
      </template>
      <template #website="{ row }">
        <a v-if="row.website" :href="row.website" class="underline decoration-dotted text-primary" target="_blank" rel="noopener">
          {{ row.website }}
        </a>
        <span v-else class="text-gray-500 dark:text-gray-300">--</span>
      </template>
      <template #isLoaded="{ row }">
        <el-tag :type="row.isLoaded ? 'success' : 'danger'">
          {{ row.isLoaded ? t('views.modManagement.status.loaded') : t('views.modManagement.status.unloaded') }}
        </el-tag>
      </template>
      <template #isUninstalled="{ row }">
        <el-tag :type="row.isUninstalled ? 'warning' : 'info'">
          {{ row.isUninstalled ? t('views.modManagement.status.uninstalled') : t('views.modManagement.status.installed') }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <div class="flex justify-center">
          <el-button
            size="small"
            plain
            :loading="isPending(getModKey(row))"
            @click="onToggleStatus(row)"
          >
            <template #icon>
              <icon-mdi:power v-if="row.isUninstalled" />
              <icon-mdi:power-plug v-else />
            </template>
            {{ row.isUninstalled ? t('views.modManagement.actions.install') : t('views.modManagement.actions.uninstall') }}
          </el-button>
        </div>
      </template>
    </MyTable>
  </div>
</template>
