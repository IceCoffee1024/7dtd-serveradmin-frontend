<script setup lang="ts" generic="T extends Record<string, any>">
import type { MyTableColumn } from '~/composables/table';
import type { MyFormField, OptionItem } from '~/composables/useMyForm';
import { computed, ref, toValue } from 'vue';
import { useI18n } from 'vue-i18n';
import MyForm from '~/components/MyForm/index.vue';
import { applySearchTransform } from '~/composables/table';

interface Props {
  columns: MyTableColumn<T>[];
  defaultSpan?: number;
  loading?: boolean;
  size?: App.ThemeSettings['general']['tableSize'];
}

const props = withDefaults(defineProps<Props>(), {
  defaultSpan: 6,
  loading: false,
  size: 'default',
});

const emits = defineEmits<{
  search: [transformedParam: Record<string, any>];
  reset: [];
}>();

const { t } = useI18n();
type SearchFormField = MyFormField<any> & { advanced?: boolean };

const searchParam = defineModel<Record<string, any>>('modelValue', {
  default: () => ({}),
});

// Core mapping from table columns to MyForm fields.

const searchFields = computed<SearchFormField[]>(() =>
  props.columns
    .filter(col => col.search?.el && col.prop != null)
    .sort((a, b) => (a.search!.order ?? 0) - (b.search!.order ?? 0))
    .map((col): SearchFormField => {
      // Option priority: search.props.options > col.enum > undefined.
      const searchPropsOptions = (col.search?.props as any)?.options;
      const enumOptions = col.enum
        ? toValue(col.enum).map(({ label, value }): OptionItem => ({
            label,
            value,
          }))
        : undefined;

      // Remove options from search.props to avoid passing them twice to MyForm.
      const { options: _removed, ...restProps } = (col.search?.props ?? {}) as any;

      return {
        prop: col.prop as string,
        label: col.label,
        el: col.search!.el,
        tooltip: col.search?.tooltip,
        props: {
          size: props.size,
          ...restProps,
        },
        options: searchPropsOptions ?? enumOptions,
        span: col.search!.span ?? props.defaultSpan,
        advanced: col.search?.advanced ?? false,
      };
    }),
);

const basicSearchFields = computed(() => searchFields.value.filter(field => !field.advanced));
const advancedSearchFields = computed(() => searchFields.value.filter(field => field.advanced));
const advancedCollapsed = ref(true);

const isCompactKeywordSearch = computed(() =>
  searchFields.value.length === 1 && searchFields.value[0]?.el === 'el-input',
);

const compactSearchField = computed(() => searchFields.value[0]);

// Transforming search values here keeps MyForm and the renderer agnostic.

function onSearch() {
  const transformed = applySearchTransform(props.columns, searchParam.value);
  emits('search', transformed);
}

function onReset() {
  emits('reset');
}
</script>

<template>
  <!--
    This template stays intentionally small.
    It switches between a compact toolbar and a full search form based on
    how many searchable columns are present.
  -->
  <template v-if="searchFields.length > 0">
    <div
      v-if="isCompactKeywordSearch"
      class="search-toolbar"
    >
      <el-input
        v-model="searchParam[compactSearchField!.prop]"
        :size="size"
        class="search-toolbar__input"
        clearable
        :placeholder="compactSearchField?.placeholder || t('components.myForm.pleaseInput', { label: compactSearchField?.label })"
        @keyup.enter="onSearch"
        @clear="onSearch"
      />
      <el-button class="search-toolbar__search" :size="size" type="primary" :loading="loading" @click="onSearch">
        <icon-mdi:magnify class="mr-1" />
        {{ t('components.myTable.search') }}
      </el-button>
      <el-button class="search-toolbar__reset" :size="size" :aria-label="t('components.myTable.reset')" @click="onReset">
        <icon-mdi:restore />
      </el-button>
    </div>

    <template v-else>
      <div class="search-panel">
        <div class="search-panel__fields">
          <MyForm
            v-if="basicSearchFields.length"
            v-model="searchParam"
            :fields="basicSearchFields"
            label-position="top"
            label-width="auto"
            :gutter="12"
          />

          <div v-if="advancedSearchFields.length" class="search-panel__advanced">
            <button
              type="button"
              class="search-panel__advanced-toggle"
              @click="advancedCollapsed = !advancedCollapsed"
            >
              <span>{{ t('components.myTable.advancedFilters') }}</span>
              <el-icon
                class="search-panel__advanced-icon"
                :class="{ 'search-panel__advanced-icon--collapsed': advancedCollapsed }"
              >
                <icon-mdi:chevron-up />
              </el-icon>
            </button>

            <div v-show="!advancedCollapsed" class="search-panel__advanced-body">
              <MyForm
                v-model="searchParam"
                :fields="advancedSearchFields"
                label-position="top"
                label-width="auto"
                :gutter="12"
              />
            </div>
          </div>
        </div>

        <div class="search-panel__footer">
          <el-button class="search-panel__action" :size="size" type="primary" :loading="loading" @click="onSearch">
            <icon-mdi:magnify class="mr-1" />
            {{ t('components.myTable.search') }}
          </el-button>
          <el-button class="search-panel__action" :size="size" @click="onReset">
            <icon-mdi:restore class="mr-1" />
            {{ t('components.myTable.reset') }}
          </el-button>
        </div>
      </div>
    </template>
  </template>
</template>

<style scoped>
.search-toolbar {
  --search-control-bg: color-mix(in srgb, var(--el-bg-color) 96%, white 4%);
  --search-control-border: color-mix(in srgb, var(--el-border-color) 72%, var(--el-bg-color) 28%);
  --search-control-border-hover: color-mix(in srgb, var(--colors-primary) 34%, var(--el-border-color) 66%);
  --search-control-focus-ring: color-mix(in srgb, var(--colors-primary) 18%, transparent);

  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: nowrap;
  min-width: 0;
  padding: 0.15rem 0;
}

.search-toolbar__input {
  width: clamp(220px, 28vw, 320px);
  flex: 0 1 320px;
  min-width: 220px;
}

.search-toolbar__input :deep(.el-input__wrapper) {
  border-radius: 14px;
  background: var(--search-control-bg);
  box-shadow:
    0 0 0 1px var(--search-control-border) inset,
    0 1px 2px rgba(15, 23, 42, 0.04);
  transition:
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.search-toolbar__input :deep(.el-input__wrapper:hover) {
  box-shadow:
    0 0 0 1px var(--search-control-border-hover) inset,
    0 2px 6px rgba(15, 23, 42, 0.05);
}

.search-toolbar__input.is-focus :deep(.el-input__wrapper) {
  box-shadow:
    0 0 0 1px var(--colors-primary) inset,
    0 0 0 3px var(--search-control-focus-ring);
}

.search-toolbar__search {
  flex: 0 0 auto;
}

.search-toolbar__reset {
  flex: 0 0 auto;
  padding-inline: 0.9rem;
}

.search-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.search-panel__fields {
  min-height: 0;
}

.search-panel__footer {
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  padding-bottom: 0.15rem;
  border-top: 1px solid color-mix(in srgb, var(--el-border-color-light) 70%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 94%, transparent), var(--el-bg-color));
}

.search-panel__advanced {
  margin-top: 0.15rem;
}

.search-panel__advanced-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 30px;
  padding: 0;
  border: 0;
  color: var(--colors-primary);
  background: transparent;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.search-panel__advanced-icon {
  transition: transform 0.2s ease;
}

.search-panel__advanced-icon--collapsed {
  transform: rotate(180deg);
}

.search-panel__advanced-body {
  max-height: min(24vh, 220px);
  padding-top: 0.7rem;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

@media (max-width: 640px) {
  .search-toolbar {
    width: 100%;
    align-items: stretch;
    flex-wrap: wrap;
  }

  .search-toolbar__input {
    flex-basis: 100%;
    width: 100%;
  }

  .search-toolbar__search {
    flex: 1 1 auto;
  }
}
</style>
