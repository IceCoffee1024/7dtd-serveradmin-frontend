<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { getMods, toggleModStatus } from '~/api/gameServer';
import { usePopup } from '~/composables';
import { orderByField, searchByKeyword } from '~/utils/index';

const { t } = useI18n();
const { toast } = usePopup();

const tableRef = ref();

const columns = computed(() => [
  { field: 'displayName', header: t('views.modManagement.columns.displayName'), sortable: true, class: 'min-w-60' },
  { field: 'author', header: t('views.modManagement.columns.author'), sortable: true, class: 'min-w-40' },
  { field: 'version', header: t('views.modManagement.columns.version'), sortable: true, class: 'min-w-28' },
  { field: 'website', header: t('views.modManagement.columns.website'), class: 'min-w-60' },
  { field: 'isLoaded', header: t('views.modManagement.columns.loaded'), class: 'min-w-32 text-center' },
  { field: 'isUninstalled', header: t('views.modManagement.columns.uninstalled'), class: 'min-w-36 text-center' },
  { field: 'actions', header: t('views.modManagement.columns.actions'), exportable: false, class: 'min-w-40 text-center' },
]);

interface ModItem {
  folderName?: string;
  name?: string;
  displayName?: string;
  description?: string;
  author?: string;
  version?: string;
  website?: string;
  isLoaded?: boolean;
  isUninstalled?: boolean;
}

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

async function fetchData(params: { pageNumber: number; pageSize: number; order: string | null; desc: boolean; keyword: string }) {
  const response = await getMods();
  const list = Array.isArray(response) ? response : (response?.items ?? []);
  let data = searchByKeyword(list, params.keyword, ['displayName', 'name', 'author', 'folderName', 'description']);
  data = orderByField(data, params.order ?? '', params.desc);
  return { items: data.slice((params.pageNumber - 1) * params.pageSize, params.pageNumber * params.pageSize), total: data.length };
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
    <MyTable ref="tableRef" :columns="columns" :fetch-data="fetchData" :is-selectable="false" :is-show-add-btn="false" :is-show-edit-btn="false" :is-show-delete-btn="false">
      <template #displayName-body="{ data }">
        <div class="flex flex-col gap-1">
          <span class="font-semibold">{{ data.displayName || data.name }}</span>
          <span v-if="data.description" class="text-xs text-gray-500 dark:text-gray-300">{{ data.description }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-300">{{ data.folderName }}</span>
        </div>
      </template>
      <template #website-body="{ data }">
        <a v-if="data.website" :href="data.website" class="underline decoration-dotted text-primary" target="_blank" rel="noopener">
          {{ data.website }}
        </a>
        <span v-else class="text-gray-500 dark:text-gray-300">--</span>
      </template>
      <template #isLoaded-body="{ data }">
        <el-tag :type="data.isLoaded ? 'success' : 'danger'">
          {{ data.isLoaded ? t('views.modManagement.status.loaded') : t('views.modManagement.status.unloaded') }}
        </el-tag>
      </template>
      <template #isUninstalled-body="{ data }">
        <el-tag :type="data.isUninstalled ? 'warning' : 'info'">
          {{ data.isUninstalled ? t('views.modManagement.status.uninstalled') : t('views.modManagement.status.installed') }}
        </el-tag>
      </template>
      <template #actions-body="{ data }">
        <div class="flex justify-center">
          <el-button
            size="small"
            plain
            :loading="isPending(getModKey(data))"
            @click="onToggleStatus(data)"
          >
            <template #icon>
              <icon-mdi:power v-if="data.isUninstalled" />
              <icon-mdi:power-plug v-else />
            </template>
            {{ data.isUninstalled ? t('views.modManagement.actions.install') : t('views.modManagement.actions.uninstall') }}
          </el-button>
        </div>
      </template>
    </MyTable>
  </div>
</template>
