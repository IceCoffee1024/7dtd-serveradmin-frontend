<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { MyFormField } from '~/composables/useMyForm';
import type {
  EconomyShopItemDto,
  EconomyShopItemQueryOrder,
  EconomyUpsertShopItemRequestDto,
} from '~/generated/api/types.gen';
import type { RewardPackageOption } from '~/queries/rewardPackages';
import { useMutation, useQueryCache } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  economyShopCreateItemMutation,
  economyShopDeleteItemMutation,
  economyShopGetItemsQuery,
  economyShopUpdateItemMutation,
  gameServerGetGameItemsQuery,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateEconomyShopQueries } from '~/queries/economy';
import { loadRewardPackageOptions } from '~/queries/rewardPackages';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'EconomyShopPage' });

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

interface FormModel {
  name: string;
  description: string;
  productType: EconomyShopProductType;
  itemName: string;
  itemCount: number;
  rewardPackageId: number | null;
  allowQualitySelection: boolean;
  minQuality: number;
  maxQuality: number;
  qualityPriceMultiplierPercent: number;
  price: number;
  isEnabled: boolean;
  displayOrder: number;
  stockLimit: number;
}

type EconomyShopProductType = 'GameItem' | 'RewardPackage';

const { t } = useI18n();
const { toast, confirm } = usePopup();
const queryCache = useQueryCache();

const tableRef = useTemplateRef('tableRef');
const dialogRef = useTemplateRef('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');

const editingId = ref<number | null>(null);
const createItemMutation = useMutation({
  ...economyShopCreateItemMutation(),
  async onSettled() {
    await invalidateEconomyShopQueries();
  },
});
const updateItemMutation = useMutation({
  ...economyShopUpdateItemMutation(),
  async onSettled() {
    await invalidateEconomyShopQueries();
  },
});
const deleteItemMutation = useMutation({
  ...economyShopDeleteItemMutation(),
  async onSettled() {
    await invalidateEconomyShopQueries();
  },
});
const isSubmitting = computed(() => createItemMutation.isLoading.value || updateItemMutation.isLoading.value);

interface GameItemOption {
  value: string;
  label: string;
}

const gameItemOptions = ref<GameItemOption[]>([]);
const rewardPackageOptions = ref<RewardPackageOption[]>([]);
const itemOptionsLoading = ref(false);
const rewardPackageOptionsLoading = ref(false);

async function loadGameItems() {
  if (gameItemOptions.value.length > 0)
    return;
  itemOptionsLoading.value = true;
  try {
    const options = gameServerGetGameItemsQuery();
    const entry = queryCache.ensure(options);
    const state = await queryCache.fetch(entry);

    if (state.status === 'error') {
      throw state.error;
    }

    const items = state.data ?? [];
    gameItemOptions.value = items.map(item => ({
      value: item.name,
      label: item.localizedName ? `${item.localizedName}  (${item.name})` : item.name,
    }));
  }
  finally {
    itemOptionsLoading.value = false;
  }
}

async function loadRewardPackages() {
  if (rewardPackageOptions.value.length > 0)
    return;
  rewardPackageOptionsLoading.value = true;
  try {
    rewardPackageOptions.value = await loadRewardPackageOptions();
  }
  finally {
    rewardPackageOptionsLoading.value = false;
  }
}

function buildDefaults(): FormModel {
  return {
    name: '',
    description: '',
    productType: 'GameItem',
    itemName: '',
    itemCount: 1,
    rewardPackageId: null,
    allowQualitySelection: false,
    minQuality: 1,
    maxQuality: 1,
    qualityPriceMultiplierPercent: 0,
    price: 0,
    isEnabled: true,
    displayOrder: 0,
    stockLimit: 0,
  };
}

const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  description: v.optional(v.string()),
  productType: v.picklist(['GameItem', 'RewardPackage']),
  itemName: v.optional(v.string()),
  itemCount: v.pipe(v.number(), v.minValue(1)),
  rewardPackageId: v.optional(v.nullable(v.number())),
  allowQualitySelection: v.boolean(),
  minQuality: v.pipe(v.number(), v.minValue(1), v.maxValue(6)),
  maxQuality: v.pipe(v.number(), v.minValue(1), v.maxValue(6)),
  qualityPriceMultiplierPercent: v.pipe(v.number(), v.minValue(0)),
  price: v.pipe(v.number(), v.minValue(0)),
  isEnabled: v.boolean(),
  displayOrder: v.pipe(v.number(), v.minValue(0)),
  stockLimit: v.pipe(v.number(), v.minValue(0)),
});

const rules: FormRules = generateElementRules(schema);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const productTypeOptions = computed(() => [
  { label: t('views.economy.shop.productTypes.GameItem'), value: 'GameItem' },
  { label: t('views.economy.shop.productTypes.RewardPackage'), value: 'RewardPackage' },
]);

const dialogTitle = computed(() =>
  editingId.value != null
    ? t('views.economy.shop.form.editTitle')
    : t('views.economy.shop.form.addTitle'),
);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'name',
    label: t('views.economy.shop.form.fields.name'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'productType',
    label: t('views.economy.shop.form.fields.productType'),
    el: 'el-select',
    options: productTypeOptions.value,
    span: { xs: 24, md: 12 },
    onChange: (value, model) => {
      if (value === 'RewardPackage') {
        model.itemName = '__reward_package__';
        model.itemCount = 1;
        model.allowQualitySelection = false;
        model.minQuality = 1;
        model.maxQuality = 1;
        model.qualityPriceMultiplierPercent = 0;
        loadRewardPackages();
      }
      else {
        model.rewardPackageId = null;
        loadGameItems();
      }
    },
  },
  {
    prop: 'itemName',
    label: t('views.economy.shop.form.fields.itemName'),
    el: 'custom',
    span: { xs: 24, md: 12 },
    show: model => model.productType !== 'RewardPackage',
  },
  {
    prop: 'rewardPackageId',
    label: t('views.economy.shop.form.fields.rewardPackageId'),
    el: 'custom',
    span: { xs: 24, md: 12 },
    show: model => model.productType === 'RewardPackage',
  },
  {
    prop: 'description',
    label: t('views.economy.shop.form.fields.description'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2 },
    span: { xs: 24 },
  },
  {
    prop: 'itemCount',
    label: t('views.economy.shop.form.fields.itemCount'),
    el: 'el-input-number',
    props: { min: 1, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
    show: model => model.productType !== 'RewardPackage',
  },
  {
    prop: 'price',
    label: t('views.economy.shop.form.fields.price'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'allowQualitySelection',
    label: t('views.economy.shop.form.fields.allowQualitySelection'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
    show: model => model.productType !== 'RewardPackage',
    onChange: (value, model) => {
      if (value !== true) {
        model.minQuality = 1;
        model.maxQuality = 1;
        model.qualityPriceMultiplierPercent = 0;
      }
      else {
        model.minQuality = Number(model.minQuality) || 1;
        model.maxQuality = Math.max(Number(model.maxQuality) || 1, Number(model.minQuality) || 1);
      }
    },
  },
  {
    prop: 'minQuality',
    label: t('views.economy.shop.form.fields.minQuality'),
    el: 'el-input-number',
    props: { min: 1, max: 6, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 8 },
    show: model => model.productType !== 'RewardPackage' && model.allowQualitySelection === true,
  },
  {
    prop: 'maxQuality',
    label: t('views.economy.shop.form.fields.maxQuality'),
    el: 'el-input-number',
    props: { min: 1, max: 6, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 8 },
    show: model => model.productType !== 'RewardPackage' && model.allowQualitySelection === true,
  },
  {
    prop: 'qualityPriceMultiplierPercent',
    label: t('views.economy.shop.form.fields.qualityPriceMultiplierPercent'),
    el: 'el-input-number',
    props: { min: 0, precision: 2, class: 'w-full' },
    span: { xs: 24, md: 8 },
    show: model => model.productType !== 'RewardPackage' && model.allowQualitySelection === true,
    tooltip: t('views.economy.shop.form.tooltips.qualityPriceMultiplierPercent'),
  },
  {
    prop: 'stockLimit',
    label: t('views.economy.shop.form.fields.stockLimit'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'displayOrder',
    label: t('views.economy.shop.form.fields.displayOrder'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'isEnabled',
    label: t('views.economy.shop.form.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
]);

const columns = computed<MyTableColumn<EconomyShopItemDto>[]>(() => [
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
    prop: 'name',
    label: t('views.economy.shop.columns.name'),
    sortable: true,
  },
  {
    prop: 'productType',
    label: t('views.economy.shop.columns.productType'),
    slot: 'productType',
  },
  {
    prop: 'itemName',
    label: t('views.economy.shop.columns.itemName'),
    slot: 'itemName',
    sortable: true,
  },
  {
    prop: 'itemCount',
    label: t('views.economy.shop.columns.itemCount'),
  },
  {
    prop: 'price',
    label: t('views.economy.shop.columns.price'),
    slot: 'price',
    sortable: true,
  },
  {
    prop: 'allowQualitySelection',
    label: t('views.economy.shop.columns.qualitySelection'),
    slot: 'qualitySelection',
  },
  {
    prop: 'isEnabled',
    label: t('views.economy.shop.columns.isEnabled'),
    slot: 'isEnabled',
    search: {
      el: 'el-select',
      options: [
        { label: t('common.yes'), value: true },
        { label: t('common.no'), value: false },
      ],
      props: { clearable: true },
      order: 1,
      span: 8,
    },
  },
  {
    prop: 'displayOrder',
    label: t('views.economy.shop.columns.displayOrder'),
    sortable: true,
  },
  {
    prop: 'stockLimit',
    label: t('views.economy.shop.columns.stockLimit'),
  },
  {
    prop: 'soldCount',
    label: t('views.economy.shop.columns.soldCount'),
    sortable: true,
  },
]);

function toOrder(sortField: string | undefined): EconomyShopItemQueryOrder | undefined {
  switch (sortField) {
    case 'name': return 'Name';
    case 'price': return 'Price';
    case 'displayOrder': return 'DisplayOrder';
    case 'createdAt': return 'CreatedAt';
    default: return undefined;
  }
}

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<EconomyShopItemDto>> {
  const options = economyShopGetItemsQuery({
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      keyword: params.search?.keyword?.trim() || undefined,
      isEnabled: typeof params.search?.isEnabled === 'boolean' ? params.search.isEnabled : undefined,
      order: toOrder(params.sortField),
      desc: params.sortOrder === 'descending',
    },
  });
  const entry = queryCache.ensure(options);
  const state = await queryCache.fetch(entry);

  if (state.status === 'error') {
    throw state.error;
  }

  const response = state.data;

  return { list: response?.items ?? [], total: response?.total ?? 0 };
}

function openAdd() {
  editingId.value = null;
  Object.assign(form, buildDefaults());
  loadGameItems();
  loadRewardPackages();
  dialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

function openEdit(row: EconomyShopItemDto) {
  if (row.id == null) {
    return;
  }

  loadGameItems();
  loadRewardPackages();
  editingId.value = row.id;
  form.name = row.name;
  form.description = row.description ?? '';
  form.productType = row.productType === 'RewardPackage' ? 'RewardPackage' : 'GameItem';
  form.itemName = form.productType === 'RewardPackage' ? row.itemName || '__reward_package__' : row.itemName;
  form.itemCount = row.itemCount ?? 1;
  form.rewardPackageId = row.rewardPackageId ?? null;
  form.allowQualitySelection = row.productType !== 'RewardPackage' && row.allowQualitySelection === true;
  form.minQuality = row.minQuality ?? 1;
  form.maxQuality = row.maxQuality ?? 1;
  form.qualityPriceMultiplierPercent = row.qualityPriceMultiplierPercent ?? 0;
  form.price = row.price ?? 0;
  form.isEnabled = row.isEnabled ?? true;
  form.displayOrder = row.displayOrder ?? 0;
  form.stockLimit = row.stockLimit ?? 0;
  dialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

async function onConfirm(): Promise<boolean | void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return false;
  }

  try {
    if (form.productType === 'GameItem' && !form.itemName.trim()) {
      toast({ type: 'warning', text: t('views.economy.shop.messages.itemRequired') });
      return false;
    }
    if (form.productType === 'RewardPackage' && form.rewardPackageId == null) {
      toast({ type: 'warning', text: t('views.economy.shop.messages.rewardPackageRequired') });
      return false;
    }
    if (form.productType === 'GameItem' && form.allowQualitySelection && Number(form.maxQuality) < Number(form.minQuality)) {
      toast({ type: 'warning', text: t('views.economy.shop.messages.invalidQualityRange') });
      return false;
    }

    const allowQualitySelection = form.productType === 'GameItem' && form.allowQualitySelection;
    const payload: EconomyUpsertShopItemRequestDto = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      productType: form.productType,
      itemName: form.productType === 'RewardPackage' ? '__reward_package__' : form.itemName.trim(),
      itemCount: form.productType === 'RewardPackage' ? 1 : Number(form.itemCount),
      rewardPackageId: form.productType === 'RewardPackage' ? form.rewardPackageId : null,
      allowQualitySelection,
      minQuality: allowQualitySelection ? Number(form.minQuality) : 1,
      maxQuality: allowQualitySelection ? Number(form.maxQuality) : 1,
      qualityPriceMultiplierPercent: allowQualitySelection ? Number(form.qualityPriceMultiplierPercent) : 0,
      price: Number(form.price),
      isEnabled: form.isEnabled,
      displayOrder: Number(form.displayOrder),
      stockLimit: Number(form.stockLimit),
    };

    if (editingId.value != null) {
      await updateItemMutation.mutateAsync({ path: { id: editingId.value }, body: payload });
      toast({ type: 'success', text: t('views.economy.shop.messages.updateSuccess') });
    }
    else {
      await createItemMutation.mutateAsync({ body: payload });
      toast({ type: 'success', text: t('views.economy.shop.messages.createSuccess') });
    }
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
    return false;
  }
}

async function onDelete(row: EconomyShopItemDto) {
  if (row.id == null) {
    return;
  }

  const confirmed = await confirm({
    text: t('views.economy.shop.actions.deleteConfirm'),
    type: 'warning',
  });
  if (!confirmed) {
    return;
  }

  try {
    await deleteItemMutation.mutateAsync({ path: { id: row.id } });
    toast({ type: 'success', text: t('views.economy.shop.messages.deleteSuccess') });
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex flex-1 min-h-0">
      <MyTable
        ref="tableRef"
        row-key="id"
        :columns="columns"
        :fetch-data="fetchData"
        :selectable="false"
        :operation-column-width="112"
        :auto-column-width="true"
        :search-collapsible="true"
        @add="openAdd"
      >
        <template #price="{ row }">
          <span class="text-amber-600 font-semibold dark:text-amber-400">{{ row.price }}</span>
        </template>

        <template #productType="{ row }">
          <el-tag :type="row.productType === 'RewardPackage' ? 'warning' : 'info'">
            {{ row.productType === 'RewardPackage' ? t('views.economy.shop.productTypes.RewardPackage') : t('views.economy.shop.productTypes.GameItem') }}
          </el-tag>
        </template>

        <template #itemName="{ row }">
          <span v-if="row.productType === 'RewardPackage'" class="text-xs text-gray-500 font-mono dark:text-gray-400">
            #{{ row.rewardPackageId ?? '--' }}
          </span>
          <span v-else class="text-xs font-mono">{{ row.itemName }}</span>
        </template>

        <template #qualitySelection="{ row }">
          <div
            v-if="row.productType !== 'RewardPackage' && row.allowQualitySelection"
            class="text-xs leading-tight flex flex-col gap-0.5"
          >
            <span class="text-gray-800 font-medium dark:text-gray-100">
              Q{{ row.minQuality ?? 1 }}-{{ row.maxQuality ?? 1 }}
            </span>
            <span class="text-gray-500 dark:text-gray-400">
              +{{ row.qualityPriceMultiplierPercent ?? 0 }}%
            </span>
          </div>
          <span v-else class="text-xs text-gray-400 dark:text-gray-500">-</span>
        </template>

        <template #isEnabled="{ row }">
          <el-tag :type="row.isEnabled ? 'success' : 'info'">
            {{ row.isEnabled ? t('common.yes') : t('common.no') }}
          </el-tag>
        </template>

        <template #operation="{ row }">
          <div class="inline-flex gap-1 justify-center">
            <IconButton
              round
              border
              button-size="small"
              :tooltip-content="t('views.economy.shop.actions.edit')"
              @click="openEdit(row)"
            >
              <icon-mdi-pencil-outline />
            </IconButton>
            <IconButton
              round
              border
              button-size="small"
              type="danger"
              :tooltip-content="t('views.economy.shop.actions.delete')"
              @click="onDelete(row)"
            >
              <icon-mdi-delete-outline />
            </IconButton>
          </div>
        </template>
      </MyTable>
    </div>

    <MyDialog
      ref="dialogRef"
      :title="dialogTitle"
      :loading="isSubmitting"
      :on-confirm="onConfirm"
    >
      <MyForm
        ref="formRef"
        v-model="form"
        :fields="fields"
        :rules="rules"
        label-position="top"
        label-width="auto"
        :gutter="16"
      >
        <template #itemName>
          <el-select-v2
            v-model="form.itemName"
            :options="gameItemOptions"
            :loading="itemOptionsLoading"
            filterable
            clearable
            class="w-full"
            :placeholder="t('views.economy.shop.form.fields.itemName')"
          />
        </template>

        <template #rewardPackageId>
          <el-select-v2
            v-model="form.rewardPackageId"
            :options="rewardPackageOptions"
            :loading="rewardPackageOptionsLoading"
            filterable
            clearable
            class="w-full"
            :placeholder="t('views.economy.shop.form.fields.rewardPackageId')"
          />
        </template>
      </MyForm>
    </MyDialog>
  </div>
</template>
