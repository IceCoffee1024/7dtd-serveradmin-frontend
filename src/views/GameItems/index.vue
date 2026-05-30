<script setup lang="ts">
import type { GameItemDto } from '~/generated/api/types.gen';
import type { ContextMenuOption } from '~/plugins/contextMenu';
import { useQueryCache } from '@pinia/colada';
import { useElementSize, useVirtualList } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables/usePopup';
import { gameServerGetGameItemsQuery } from '~/generated/api/@pinia/colada.gen';
import { showCustomContextMenu } from '~/plugins/contextMenu';
import { markIcon } from '~/utils';
import { getItemIconUrl } from '~/utils/gameServerAssets';

defineOptions({ name: 'GameItems' });

const { t } = useI18n();
const queryCache = useQueryCache();

// Cell: 108px wide, 88px img + 4px gap + 16px text = 108px content height
// Row: 4px pt + 108px + 4px pb = 116px
const CELL_W = 112; // cell width + gap between cells (for col count calculation)
const ROW_H = 116;

const keyword = ref('');
const activeFilter = ref<'all' | 'item' | 'block'>('item');
const showUserHidden = ref(false);
const allItems = ref<GameItemDto[]>([]);
const loading = ref(false);

async function loadItems() {
  loading.value = true;
  try {
    const options = gameServerGetGameItemsQuery({
      query: {
        showUserHidden: showUserHidden.value,
        includeBlocks: true,
      },
    });
    const entry = queryCache.ensure(options);
    const state = await queryCache.fetch(entry);

    if (state.status === 'error') {
      throw state.error;
    }

    allItems.value = state.data ?? [];
  }
  finally {
    loading.value = false;
  }
}

const filteredItems = computed(() => {
  let list = allItems.value;
  if (activeFilter.value === 'item')
    list = list.filter(i => i.isBlock === false);
  else if (activeFilter.value === 'block')
    list = list.filter(i => i.isBlock);

  const kw = keyword.value.trim().toLowerCase();
  if (kw) {
    list = list.filter(i =>
      i.name.toLowerCase().includes(kw)
      || (i.localizedName?.toLowerCase().includes(kw) ?? false),
    );
  }
  return list;
});

// Measure grid container width to compute responsive column count
const gridContainerRef = ref<HTMLElement | null>(null);
const { width: gridWidth } = useElementSize(gridContainerRef);
const colCount = computed(() => Math.max(4, Math.floor((gridWidth.value || 600) / CELL_W)));

// Chunk filtered items into rows for virtual scrolling
const rows = computed(() => {
  const cols = colCount.value;
  const items = filteredItems.value;
  const result: GameItemDto[][] = [];
  for (let i = 0; i < items.length; i += cols)
    result.push(items.slice(i, i + cols));
  return result;
});

const { list: virtualRows, containerProps, wrapperProps } = useVirtualList(rows, {
  itemHeight: ROW_H,
  overscan: 4,
});

// Context menu
const { toast } = usePopup();
const iconCopy = markIcon(() => import('~icons/mdi/content-copy'));
const iconTranslate = markIcon(() => import('~icons/mdi/translate'));

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
  toast({ text, type: 'success' });
}

function onCellContextMenu(e: MouseEvent, item: GameItemDto) {
  const options: ContextMenuOption<GameItemDto>[] = [
    {
      label: t('views.gameItems.copyName'),
      icon: iconCopy,
      command: i => copyText(i!.name),
    },
    {
      label: t('views.gameItems.copyLocalizedName'),
      icon: iconTranslate,
      disabled: i => i?.localizedName == null,
      command: i => copyText(i!.localizedName!),
    },
  ];
  showCustomContextMenu(e, options, item);
}

watch(showUserHidden, loadItems);
onMounted(loadItems);
</script>

<template>
  <el-card
    class="h-full"
    shadow="never"
    :body-style="{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px', boxSizing: 'border-box' }"
  >
    <!-- Toolbar -->
    <div class="mb-3 flex flex-shrink-0 flex-wrap gap-3 items-center">
      <el-input
        v-model="keyword"
        :placeholder="t('views.gameItems.searchPlaceholder')"
        clearable
        class="w-72"
      >
        <template #prefix>
          <icon-mdi-magnify />
        </template>
      </el-input>

      <el-radio-group v-model="activeFilter">
        <el-radio-button value="all">
          {{ t('views.gameItems.all') }}
        </el-radio-button>
        <el-radio-button value="item">
          {{ t('views.gameItems.items') }}
        </el-radio-button>
        <el-radio-button value="block">
          {{ t('views.gameItems.blocks') }}
        </el-radio-button>
      </el-radio-group>

      <el-checkbox v-model="showUserHidden">
        {{ t('views.gameItems.showUserHidden') }}
      </el-checkbox>

      <span class="text-sm text-gray-500 ml-auto dark:text-gray-400">
        {{ t('views.gameItems.totalCount', [filteredItems.length]) }}
      </span>
    </div>

    <!-- Grid with virtual row scrolling -->
    <div ref="gridContainerRef" v-loading="loading" class="flex-1 min-h-0">
      <div v-bind="containerProps" class="h-full">
        <div v-bind="wrapperProps">
          <div
            v-for="{ index, data: row } in virtualRows"
            :key="index"
            class="flex gap-1"
            :style="{ height: `${ROW_H}px`, paddingTop: '4px', paddingBottom: '4px' }"
          >
            <el-tooltip
              v-for="item in row"
              :key="item.name"
              placement="top"
              :show-after="400"
              effect="dark"
            >
              <template #content>
                <div class="text-xs min-w-44 space-y-1.5">
                  <p class="text-white leading-snug font-mono font-semibold">
                    {{ item.name }}
                  </p>
                  <p v-if="item.localizedName" class="text-gray-300 leading-snug">
                    {{ item.localizedName }}
                  </p>
                  <div class="pt-0.5 flex gap-2 items-center">
                    <el-tag :type="item.isBlock ? 'warning' : 'primary'" size="small" effect="dark">
                      {{ item.isBlock ? t('views.gameItems.blockTag') : t('views.gameItems.itemTag') }}
                    </el-tag>
                    <span class="text-gray-300">
                      {{ t('views.gameItems.stackValue', [item.maxStackAllowed]) }}
                    </span>
                  </div>
                  <div v-if="item.iconTintColor" class="text-gray-400 flex gap-1.5 items-center">
                    <span
                      class="border border-gray-500 rounded-sm flex-shrink-0 h-3.5 w-3.5 inline-block"
                      :style="{ background: `#${item.iconTintColor}` }"
                    />
                    <span class="font-mono">#{{ item.iconTintColor }}</span>
                  </div>
                </div>
              </template>

              <!-- Cell -->
              <div
                class="group rounded flex flex-col cursor-default items-center"
                :style="{ width: `${CELL_W - 4}px` }"
                @contextmenu.prevent="onCellContextMenu($event, item)"
              >
                <div
                  class="rounded bg-gray-200 flex w-full transition-colors items-center justify-center dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600"
                  style="height: 88px;"
                >
                  <img
                    :src="getItemIconUrl(item.iconName ?? item.name, item.iconTintColor)"
                    class="h-16 w-16 object-contain"
                    loading="lazy"
                    @error="(e: Event) => { (e.target as HTMLImageElement).style.visibility = 'hidden' }"
                  >
                </div>
                <p class="text-xs text-gray-600 leading-4 mt-1 px-0.5 text-center w-full truncate dark:text-gray-300">
                  {{ item.localizedName ?? item.name }}
                </p>
              </div>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>
