<script setup lang="ts">
import type { GameItemDto } from '~/generated/api/types.gen';
import { useQueryCache } from '@pinia/colada';
import { gameServerGetGameItemsQuery } from '~/generated/api/@pinia/colada.gen';
import { useLocaleStore } from '~/stores/locale';

defineOptions({ name: 'GameItemSelect' });

const props = withDefaults(defineProps<{
  modelValue?: string;
  includeBlocks?: boolean;
  showUserHidden?: boolean;
  disabled?: boolean;
  placeholder?: string;
}>(), {
  modelValue: '',
  includeBlocks: false,
  showUserHidden: false,
  disabled: false,
  placeholder: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'selectedChange', value: GameItemDto | null): void;
}>();

interface GameItemOption {
  value: string;
  label: string;
  item: GameItemDto;
}

const queryCache = useQueryCache();
const localeStore = useLocaleStore();
const options = ref<GameItemOption[]>([]);
const loading = ref(false);
const loadedKey = ref('');

const valueModel = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value ?? ''),
});

const selectedItem = computed(() => options.value.find(item => item.value === props.modelValue)?.item ?? null);

function buildLoadKey() {
  return [
    localeStore.languageEnglishName,
    props.includeBlocks,
    props.showUserHidden,
  ].join('|');
}

async function loadGameItems() {
  const key = buildLoadKey();
  if (loadedKey.value === key && options.value.length > 0) {
    return;
  }

  loading.value = true;
  try {
    const queryOptions = gameServerGetGameItemsQuery({
      query: {
        language: localeStore.languageEnglishName,
        includeBlocks: props.includeBlocks,
        showUserHidden: props.showUserHidden,
      },
    });
    const entry = queryCache.ensure(queryOptions);
    const state = await queryCache.fetch(entry);

    if (state.status === 'error') {
      throw state.error;
    }

    options.value = (state.data ?? []).map(item => ({
      value: item.name,
      label: item.localizedName ? `${item.localizedName} (${item.name})` : item.name,
      item,
    }));
    loadedKey.value = key;
  }
  finally {
    loading.value = false;
  }
}

watch(selectedItem, value => emit('selectedChange', value), { immediate: true });
watch(
  () => [localeStore.languageEnglishName, props.includeBlocks, props.showUserHidden],
  () => {
    loadedKey.value = '';
    options.value = [];
    emit('selectedChange', null);
  },
);
</script>

<template>
  <el-select-v2
    v-model="valueModel"
    :options="options"
    :loading="loading"
    :disabled="disabled"
    :placeholder="placeholder"
    filterable
    clearable
    class="w-full"
    @visible-change="visible => visible && loadGameItems()"
    @focus="loadGameItems"
  />
</template>
