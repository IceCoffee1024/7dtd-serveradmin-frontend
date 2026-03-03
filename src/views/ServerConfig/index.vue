<script setup lang="ts">
import { groupBy } from 'es-toolkit';
import { useI18n } from 'vue-i18n';
import { getServerSettings, updateServerSettings } from '~/api/gameServer';
import { usePopup } from '~/composables';

defineOptions({
  name: 'ServerConfig',
});

interface ServerConfigItem {
  name: string;
  value: string;
  desc: string;
  group: string;
}

interface ServerConfigGroup {
  group: string;
  children: ServerConfigItem[];
}

const { t, locale } = useI18n();
const { prompt } = usePopup();

const modelValue = ref<ServerConfigGroup[]>([]);
const activeCollapseNames = ref<Array<string | number>>([]);

async function getData() {
  const data = await getServerSettings();
  const list: ServerConfigItem[] = [];

  Object.keys(data).forEach((key) => {
    list.push({
      name: key,
      value: data[key],
      desc: t(`views.serverConfig.settings.${key}.desc`),
      group: t(`views.serverConfig.settings.${key}.group`),
    });
  });

  const grouped = groupBy(list, item => item.group);

  const groupedList: ServerConfigGroup[] = [];
  Object.keys(grouped).forEach((key) => {
    groupedList.push({
      group: key,
      children: grouped[key],
    });
  });

  modelValue.value = groupedList;
  activeCollapseNames.value = groupedList.map((_, index) => index);
}
getData();

watch(locale, getData);

function getName(str: string) {
  if (!str) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function onEdit(data: ServerConfigItem) {
  try {
    const name = getName(data.name);
    const value = await prompt({ title: name, inputValue: data.value });

    if (value === undefined) {
      return;
    }

    const dict: API.GameServer.ServerSettings = {};
    dict[name] = value;
    await updateServerSettings(dict);
    await getData();
  }
  catch {}
}
</script>

<template>
  <el-card class="h-full">
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
              <el-button plain circle size="small" @click="onEdit(row)">
                <icon-mdi:pencil />
              </el-button>
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
