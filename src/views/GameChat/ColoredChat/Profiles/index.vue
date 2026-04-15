<script setup lang="ts">
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import { useI18n } from 'vue-i18n';
import * as api from '~/api/coloredChat';
import { usePopup } from '~/composables';
import { markIcon } from '~/utils';
import AddOrEditDialog from './AddOrEditDialog.vue';

defineOptions({ name: 'ColoredProfilesPage' });

type ColoredProfileRow = API.ColoredChat.Profile;

const HEX_COLOR_PREFIX_REGEX = /^#/;

const tableRef = useTemplateRef('tableRef');
const addOrEditDialogRef = useTemplateRef('addOrEditDialogRef');
const { t } = useI18n();
const { confirm } = usePopup();
const editData = ref<ColoredProfileRow | null>(null);
const selectedRows = ref<ColoredProfileRow[]>([]);

const columns = computed<MyTableColumn<ColoredProfileRow>[]>(() => [
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
  {
    prop: 'playerId',
    label: t('views.coloredChat.profiles.fields.playerId'),
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 1,
      span: 8,
    },
  },
  {
    prop: 'customName',
    label: t('views.coloredChat.profiles.fields.customName'),
    sortable: true,
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 2,
      span: 8,
    },
  },
  {
    prop: 'nameColor',
    label: t('views.coloredChat.profiles.fields.nameColor'),
    slot: 'nameColor',
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 3,
      span: 8,
    },
  },
  {
    prop: 'textColor',
    label: t('views.coloredChat.profiles.fields.textColor'),
    slot: 'textColor',
    search: {
      el: 'el-input',
      props: { clearable: true },
      order: 4,
      span: 8,
    },
  },
  { prop: 'description', label: t('views.coloredChat.profiles.fields.description') },
  {
    prop: 'createdAt',
    label: t('views.coloredChat.profiles.fields.createdAt'),
    sortable: true,
    search: {
      el: 'el-date-picker',
      props: {
        clearable: true,
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
        startPlaceholder: t('views.coloredChat.profiles.placeholders.createdAtRange'),
        endPlaceholder: t('views.coloredChat.profiles.placeholders.createdAtRange'),
      },
      order: 5,
      span: 16,
      transform: (value: string[] | undefined) => ({
        startTime: value?.[0],
        endTime: value?.[1],
      }),
    },
  },
]);

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<ColoredProfileRow>> {
  const response = await api.getProfiles({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: params.search?.keyword?.trim() || undefined,
    playerId: toOptionalString(params.search?.playerId),
    customName: toOptionalString(params.search?.customName),
    nameColor: toOptionalColor(params.search?.nameColor),
    startTime: toOptionalString(params.search?.startTime),
    endTime: toOptionalString(params.search?.endTime),
    order: toOrder(params.sortField),
    desc: params.sortOrder === 'descending',
  });

  return {
    list: response.items,
    total: response.total,
  };
}

const batchMenuItems = computed(() => [
  {
    icon: markIcon(() => import('~icons/mdi/delete-sweep')),
    label: t('common.batchDelete'),
    disabled: selectedRows.value.length === 0,
    action: async () => {
      if (await confirm()) {
        await api.deleteProfiles(selectedRows.value.map(row => row.playerId));
        tableRef.value?.reload();
      }
    },
  },
]);

/**
 * Normalizes a free-text table search value into an optional trimmed string.
 * @param value - Raw search value from the table state.
 * @returns Trimmed string or undefined when the field is empty.
 */
function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

/**
 * Normalizes a color filter into the uppercase backend storage format.
 * @param value - Raw color search value from the table state.
 * @returns Uppercase hex string without a leading #, or undefined when empty.
 */
function toOptionalColor(value: unknown): string | undefined {
  const normalizedValue = toOptionalString(value)?.replace(HEX_COLOR_PREFIX_REGEX, '').toUpperCase();
  return normalizedValue || undefined;
}

/**
 * Maps the table sort key to the backend enum value used by the profile query DTO.
 * @param sortField - Column key emitted by the table.
 * @returns Backend order enum value or undefined when the column is not remotely sortable.
 */
function toOrder(sortField: string | undefined): API.ColoredChat.ProfileQueryOrder | undefined {
  switch (sortField) {
    case 'createdAt':
      return 'CreatedAt';
    case 'playerId':
      return 'PlayerId';
    case 'customName':
      return 'CustomName';
    case 'nameColor':
      return 'NameColor';
    case 'textColor':
      return 'TextColor';
    case 'description':
      return 'Description';
    default:
      return undefined;
  }
}

function onAdd() {
  editData.value = null;
  addOrEditDialogRef.value?.show();
}

function onEdit(rowData: ColoredProfileRow) {
  editData.value = rowData;
  addOrEditDialogRef.value?.show();
}

async function onDelete(rowData: ColoredProfileRow) {
  await api.deleteProfiles([rowData.playerId]);
  tableRef.value?.reload();
}

function onSaved() {
  tableRef.value?.reload();
  editData.value = null;
}

/**
 * Formats a stored hex color into a UI-friendly label with leading '#'.
 * @param value - Backend color value without leading '#'.
 * @returns Display text for the table cell.
 */
function formatColorLabel(value: string | null | undefined): string {
  const normalizedValue = value?.trim().replace(HEX_COLOR_PREFIX_REGEX, '').toUpperCase();
  return normalizedValue ? `#${normalizedValue}` : t('common.unknown');
}

/**
 * Maps a stored hex color to an inline swatch background.
 * @param value - Backend color value without leading '#'.
 * @returns CSS color string or undefined when the value is empty.
 */
function getColorSwatch(value: string | null | undefined): string | undefined {
  const normalizedValue = value?.trim().replace(HEX_COLOR_PREFIX_REGEX, '').toUpperCase();
  return normalizedValue ? `#${normalizedValue}` : undefined;
}
</script>

<template>
  <div class="h-[calc(100vh-250px)]">
    <MyTable
      ref="tableRef"
      v-model:selection="selectedRows"
      row-key="playerId"
      :columns="columns"
      :fetch-data="fetchData"
      :batch-menu-items="batchMenuItems"
      :show-index="true"
      :auto-column-width="true"
      :search-collapsible="true"
      @add="onAdd"
      @edit="onEdit"
      @delete="onDelete"
    >
      <template #nameColor="{ row }">
        <div class="flex gap-2 min-w-0 items-center">
          <span
            class="border border-gray-300 rounded-full shrink-0 h-4 w-4 dark:border-gray-600"
            :style="{ backgroundColor: getColorSwatch(row.nameColor) ?? 'transparent' }"
          />
          <span class="truncate">{{ formatColorLabel(row.nameColor) }}</span>
        </div>
      </template>

      <template #textColor="{ row }">
        <div class="flex gap-2 min-w-0 items-center">
          <span
            class="border border-gray-300 rounded-full shrink-0 h-4 w-4 dark:border-gray-600"
            :style="{ backgroundColor: getColorSwatch(row.textColor) ?? 'transparent' }"
          />
          <span class="truncate">{{ formatColorLabel(row.textColor) }}</span>
        </div>
      </template>
    </MyTable>
    <AddOrEditDialog ref="addOrEditDialogRef" :edit-data="editData" @saved="onSaved" />
  </div>
</template>
