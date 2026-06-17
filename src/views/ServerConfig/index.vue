<script setup lang="ts">
import { useMutation, useQuery } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';
import {
  gameServerSettingsGetQuery,
  gameServerSettingsPutMutation,
} from '~/generated/api/@pinia/colada.gen';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { buildServerConfigGroups, getServerConfigDisplayName, type ServerConfigGroup, type ServerConfigItem } from './serverConfigModel';

defineOptions({
  name: 'ServerConfig',
});

const { t, te, locale } = useI18n();
const { prompt } = usePopup();

const modelValue = ref<ServerConfigGroup[]>([]);
const activeCollapseNames = ref<Array<string | number>>([]);
const settingsQuery = useQuery(gameServerSettingsGetQuery());
const updateSettingsMutation = useMutation({
  ...gameServerSettingsPutMutation(),
  async onSettled() {
    await invalidateGeneratedQueries('GameServer');
  },
});

function applyData(data: Record<string, string>) {
  const groupedList = buildServerConfigGroups(data, { t, te });
  modelValue.value = groupedList;
  activeCollapseNames.value = groupedList.map((_, index) => index);
}

watch(
  () => ({ data: settingsQuery.data.value, language: locale.value }),
  ({ data }) => {
    if (data == null) {
      return;
    }

    applyData(data);
  },
  { immediate: true },
);

async function refreshData() {
  const state = await settingsQuery.refetch(true);
  if (state.status === 'success') {
    applyData(state.data);
  }
}

function getName(str: string) {
  return getServerConfigDisplayName(str);
}

async function onEdit(data: ServerConfigItem) {
  try {
    const name = getName(data.name);
    const value = await prompt({ title: name, inputValue: data.value });

    if (value === undefined) {
      return;
    }

    const dict: Record<string, string> = {};
    dict[name] = value;
    await updateSettingsMutation.mutateAsync({ body: dict });
    await refreshData();
  }
  catch {}
}
</script>

<template>
  <el-card class="server-config-page h-full">
    <el-collapse v-model="activeCollapseNames" class="server-config-collapse">
      <el-collapse-item v-for="(item, index) in modelValue" :key="index" :title="item.group" :name="index">
        <el-table :data="item.children" row-key="name" size="small" :show-header="false" border>
          <el-table-column prop="name" width="320">
            <template #default="{ row }">
              <el-tag class="font-bold font-mono">
                {{ getName(row.name) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="desc">
            <template #default="{ row }">
              <span class="text-sm">{{ row.desc }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="value" width="280">
            <template #default="{ row }">
              <span class="font-semibold">{{ row.value }}</span>
            </template>
          </el-table-column>
          <el-table-column width="64" align="center">
            <template #default="{ row }">
              <IconButton button-size="small" type="primary" circle plain border :tooltip-content="$t('common.edit')" @click="onEdit(row as ServerConfigItem)">
                <icon-mdi:pencil />
              </IconButton>
            </template>
          </el-table-column>
        </el-table>
      </el-collapse-item>
    </el-collapse>
  </el-card>
</template>

<style scoped lang="scss">
.server-config-collapse {
  :deep(.el-collapse-item__header) {
    @apply: px-12px text-base font-semibold transition-colors;
  }

  :deep(.el-collapse-item.is-active .el-collapse-item__header) {
    @apply: text-primary;
  }

  :deep(.el-collapse-item__arrow) {
    @apply: text-base;
  }
}
</style>
