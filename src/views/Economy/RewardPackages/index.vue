<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type {
  RewardPackageDto,
  RewardPackageEntryDto,
  RewardPackageEntryType,
  RewardPackageEntryUpsertDto,
  RewardPackageQueryOrder,
  RewardPackageUpsertDto,
} from '~/api/rewardPackages';
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { MyFormField } from '~/composables/useMyForm';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import {
  createRewardPackage,
  createRewardPackageEntry,
  deleteRewardPackage,
  deleteRewardPackageEntry,
  getRewardPackage,
  getRewardPackages,
  updateRewardPackage,
  updateRewardPackageEntry,
} from '~/api/rewardPackages';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'EconomyRewardPackagesPage' });

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

interface PackageFormModel {
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

interface EntryFormModel {
  entryType: RewardPackageEntryType;
  payloadJson: string;
  sortOrder: number;
  isEnabled: boolean;
}

const { t } = useI18n();
const { toast, confirm } = usePopup();

const tableRef = useTemplateRef('tableRef');
const packageDialogRef = useTemplateRef('packageDialogRef');
const packageFormRef = useTemplateRef<FormExpose>('packageFormRef');
const entriesDialogRef = useTemplateRef('entriesDialogRef');
const entryDialogRef = useTemplateRef('entryDialogRef');
const entryFormRef = useTemplateRef<FormExpose>('entryFormRef');

const editingPackageId = ref<number | null>(null);
const currentPackage = ref<RewardPackageDto | null>(null);
const entries = ref<RewardPackageEntryDto[]>([]);
const isSubmittingPackage = ref(false);
const isSubmittingEntry = ref(false);
const isLoadingEntries = ref(false);
const editingEntryId = ref<number | null>(null);

const packageForm = reactive<PackageFormModel>(buildPackageDefaults());
const entryForm = reactive<EntryFormModel>(buildEntryDefaults());

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const entryTypeOptions = computed(() => [
  { label: t('views.economy.rewardPackages.entryTypes.GameItem'), value: 'GameItem' },
  { label: t('views.economy.rewardPackages.entryTypes.EconomyCurrency'), value: 'EconomyCurrency' },
  { label: t('views.economy.rewardPackages.entryTypes.ConsoleCommand'), value: 'ConsoleCommand' },
]);

const packageDialogTitle = computed(() =>
  editingPackageId.value == null
    ? t('views.economy.rewardPackages.form.addTitle')
    : t('views.economy.rewardPackages.form.editTitle'),
);

const entryDialogTitle = computed(() =>
  editingEntryId.value == null
    ? t('views.economy.rewardPackages.entryForm.addTitle')
    : t('views.economy.rewardPackages.entryForm.editTitle'),
);

const packageSchema = v.object({
  key: v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.minLength(1)),
  description: v.optional(v.string()),
  isEnabled: v.boolean(),
});

const entrySchema = v.object({
  entryType: v.picklist(['GameItem', 'EconomyCurrency', 'ConsoleCommand']),
  payloadJson: v.pipe(v.string(), v.minLength(2)),
  sortOrder: v.pipe(v.number(), v.minValue(0)),
  isEnabled: v.boolean(),
});

const packageRules: FormRules = generateElementRules(packageSchema);
const entryRules: FormRules = generateElementRules(entrySchema);

const packageFields = computed<MyFormField<PackageFormModel>[]>(() => [
  {
    prop: 'key',
    label: t('views.economy.rewardPackages.form.fields.key'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'name',
    label: t('views.economy.rewardPackages.form.fields.name'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'description',
    label: t('views.economy.rewardPackages.form.fields.description'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2 },
    span: { xs: 24 },
  },
  {
    prop: 'isEnabled',
    label: t('views.economy.rewardPackages.form.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
]);

const entryFields = computed<MyFormField<EntryFormModel>[]>(() => [
  {
    prop: 'entryType',
    label: t('views.economy.rewardPackages.entryForm.fields.entryType'),
    el: 'el-select',
    options: entryTypeOptions.value,
    span: { xs: 24, md: 12 },
    onChange: (value, model) => {
      model.payloadJson = buildSamplePayload(value as RewardPackageEntryType);
    },
  },
  {
    prop: 'sortOrder',
    label: t('views.economy.rewardPackages.entryForm.fields.sortOrder'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'isEnabled',
    label: t('views.economy.rewardPackages.entryForm.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'payloadJson',
    label: t('views.economy.rewardPackages.entryForm.fields.payloadJson'),
    el: 'el-input',
    props: { type: 'textarea', rows: 10, class: 'reward-packages-page__payload-input' },
    span: { xs: 24 },
  },
]);

const columns = computed<MyTableColumn<RewardPackageDto>[]>(() => [
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
    prop: 'key',
    label: t('views.economy.rewardPackages.columns.key'),
    sortable: true,
  },
  {
    prop: 'name',
    label: t('views.economy.rewardPackages.columns.name'),
    sortable: true,
  },
  {
    prop: 'description',
    label: t('views.economy.rewardPackages.columns.description'),
  },
  {
    prop: 'isEnabled',
    label: t('views.economy.rewardPackages.columns.isEnabled'),
    slot: 'isEnabled',
    sortable: true,
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
    prop: 'updatedAt',
    label: t('views.economy.rewardPackages.columns.updatedAt'),
    slot: 'updatedAt',
    sortable: true,
  },
]);

function buildPackageDefaults(): PackageFormModel {
  return {
    key: '',
    name: '',
    description: '',
    isEnabled: true,
  };
}

function buildEntryDefaults(): EntryFormModel {
  return {
    entryType: 'GameItem',
    payloadJson: buildSamplePayload('GameItem'),
    sortOrder: 0,
    isEnabled: true,
  };
}

function buildSamplePayload(entryType: RewardPackageEntryType): string {
  switch (entryType) {
    case 'EconomyCurrency':
      return JSON.stringify({ amount: 100, reason: 'Reward package: {PackageName}' }, null, 2);
    case 'ConsoleCommand':
      return JSON.stringify({
        command: 'say Rewarded {PlayerName}',
        inMainThread: false,
        allowConsoleCommand: true,
        allowedCommands: ['say'],
        allowUnsafe: false,
      }, null, 2);
    case 'GameItem':
    default:
      return JSON.stringify({
        itemName: 'resourceWood',
        count: 100,
        quality: 1,
        durabilityPercent: 100,
        mods: [],
      }, null, 2);
  }
}

function asEntry(row: unknown): RewardPackageEntryDto {
  return row as RewardPackageEntryDto;
}

function toOrder(sortField: string | undefined): RewardPackageQueryOrder | undefined {
  switch (sortField) {
    case 'key': return 'Key';
    case 'name': return 'Name';
    case 'isEnabled': return 'IsEnabled';
    case 'updatedAt': return 'UpdatedAt';
    case 'createdAt': return 'CreatedAt';
    default: return undefined;
  }
}

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<RewardPackageDto>> {
  const response = await getRewardPackages({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    keyword: params.search?.keyword?.trim() || undefined,
    isEnabled: typeof params.search?.isEnabled === 'boolean' ? params.search.isEnabled : undefined,
    order: toOrder(params.sortField),
    desc: params.sortOrder === 'descending',
  });

  return { list: response.items ?? [], total: response.total ?? 0 };
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function openAddPackage() {
  editingPackageId.value = null;
  Object.assign(packageForm, buildPackageDefaults());
  packageDialogRef.value?.open();
  nextTick(() => packageFormRef.value?.clearValidate());
}

function openEditPackage(row: RewardPackageDto) {
  editingPackageId.value = row.id;
  packageForm.key = row.key;
  packageForm.name = row.name;
  packageForm.description = row.description ?? '';
  packageForm.isEnabled = row.isEnabled;
  packageDialogRef.value?.open();
  nextTick(() => packageFormRef.value?.clearValidate());
}

async function onConfirmPackage(): Promise<boolean | void> {
  const valid = await packageFormRef.value?.validate().catch(() => false);
  if (!valid)
    return false;

  const payload: RewardPackageUpsertDto = {
    key: packageForm.key.trim(),
    name: packageForm.name.trim(),
    description: packageForm.description.trim() || null,
    isEnabled: packageForm.isEnabled,
  };

  isSubmittingPackage.value = true;
  try {
    if (editingPackageId.value == null) {
      await createRewardPackage(payload);
      toast({ type: 'success', text: t('views.economy.rewardPackages.messages.createSuccess') });
    }
    else {
      await updateRewardPackage(editingPackageId.value, payload);
      toast({ type: 'success', text: t('views.economy.rewardPackages.messages.updateSuccess') });
    }
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
    return false;
  }
  finally {
    isSubmittingPackage.value = false;
  }
}

async function onDeletePackage(row: RewardPackageDto) {
  const confirmed = await confirm({
    text: t('views.economy.rewardPackages.actions.deleteConfirm', { name: row.name }),
    type: 'warning',
  });
  if (!confirmed)
    return;

  await deleteRewardPackage(row.id);
  toast({ type: 'success', text: t('views.economy.rewardPackages.messages.deleteSuccess') });
  tableRef.value?.reload();
}

async function openEntries(row: RewardPackageDto) {
  currentPackage.value = row;
  entries.value = [];
  entriesDialogRef.value?.open();
  await reloadEntries(row.id);
}

async function reloadEntries(packageId = currentPackage.value?.id) {
  if (packageId == null)
    return;

  isLoadingEntries.value = true;
  try {
    const detail = await getRewardPackage(packageId);
    currentPackage.value = detail.package;
    entries.value = detail.entries ?? [];
  }
  finally {
    isLoadingEntries.value = false;
  }
}

function openAddEntry() {
  editingEntryId.value = null;
  Object.assign(entryForm, buildEntryDefaults());
  entryDialogRef.value?.open();
  nextTick(() => entryFormRef.value?.clearValidate());
}

function openEditEntry(row: RewardPackageEntryDto) {
  editingEntryId.value = row.id;
  entryForm.entryType = row.entryType;
  entryForm.payloadJson = row.payloadJson;
  entryForm.sortOrder = row.sortOrder;
  entryForm.isEnabled = row.isEnabled;
  entryDialogRef.value?.open();
  nextTick(() => entryFormRef.value?.clearValidate());
}

function applyPayloadTemplate() {
  entryForm.payloadJson = buildSamplePayload(entryForm.entryType);
}

async function onConfirmEntry(): Promise<boolean | void> {
  const valid = await entryFormRef.value?.validate().catch(() => false);
  if (!valid)
    return false;

  try {
    JSON.parse(entryForm.payloadJson);
  }
  catch {
    toast({ type: 'warning', text: t('views.economy.rewardPackages.messages.invalidPayloadJson') });
    return false;
  }

  if (currentPackage.value == null)
    return false;

  const payload: RewardPackageEntryUpsertDto = {
    entryType: entryForm.entryType,
    payloadJson: entryForm.payloadJson.trim(),
    sortOrder: Number(entryForm.sortOrder),
    isEnabled: entryForm.isEnabled,
  };

  isSubmittingEntry.value = true;
  try {
    if (editingEntryId.value == null) {
      await createRewardPackageEntry(currentPackage.value.id, payload);
      toast({ type: 'success', text: t('views.economy.rewardPackages.messages.entryCreateSuccess') });
    }
    else {
      await updateRewardPackageEntry(editingEntryId.value, payload);
      toast({ type: 'success', text: t('views.economy.rewardPackages.messages.entryUpdateSuccess') });
    }
    await reloadEntries();
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
    return false;
  }
  finally {
    isSubmittingEntry.value = false;
  }
}

async function onDeleteEntry(row: RewardPackageEntryDto) {
  const confirmed = await confirm({
    text: t('views.economy.rewardPackages.actions.deleteEntryConfirm'),
    type: 'warning',
  });
  if (!confirmed)
    return;

  await deleteRewardPackageEntry(row.id);
  toast({ type: 'success', text: t('views.economy.rewardPackages.messages.entryDeleteSuccess') });
  await reloadEntries();
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
        :operation-column-width="148"
        :auto-column-width="true"
        :search-collapsible="true"
        @add="openAddPackage"
      >
        <template #isEnabled="{ row }">
          <el-tag :type="row.isEnabled ? 'success' : 'info'">
            {{ row.isEnabled ? t('common.yes') : t('common.no') }}
          </el-tag>
        </template>

        <template #updatedAt="{ row }">
          <span class="text-xs text-gray-700 font-mono dark:text-gray-200">{{ formatTimestamp(row.updatedAt) }}</span>
        </template>

        <template #operation="{ row }">
          <div class="reward-packages-page__actions">
            <IconButton
              round
              border
              button-size="small"
              :tooltip-content="t('views.economy.rewardPackages.actions.entries')"
              @click="openEntries(row)"
            >
              <icon-mdi-format-list-bulleted />
            </IconButton>
            <IconButton
              round
              border
              button-size="small"
              :tooltip-content="t('views.economy.rewardPackages.actions.edit')"
              @click="openEditPackage(row)"
            >
              <icon-mdi-pencil-outline />
            </IconButton>
            <IconButton
              round
              border
              button-size="small"
              type="danger"
              :tooltip-content="t('views.economy.rewardPackages.actions.delete')"
              @click="onDeletePackage(row)"
            >
              <icon-mdi-delete-outline />
            </IconButton>
          </div>
        </template>
      </MyTable>
    </div>

    <MyDialog
      ref="packageDialogRef"
      :title="packageDialogTitle"
      :loading="isSubmittingPackage"
      :on-confirm="onConfirmPackage"
    >
      <MyForm
        ref="packageFormRef"
        v-model="packageForm"
        :fields="packageFields"
        :rules="packageRules"
        label-position="top"
        label-width="auto"
        :gutter="16"
      />
    </MyDialog>

    <MyDialog
      ref="entriesDialogRef"
      :title="currentPackage ? t('views.economy.rewardPackages.entriesDialog.title', { name: currentPackage.name }) : ''"
      :show-footer="false"
      width="900px"
    >
      <div class="reward-packages-page__entry-toolbar">
        <el-button type="primary" plain @click="openAddEntry">
          <el-icon><icon-mdi-plus /></el-icon>
          {{ t('views.economy.rewardPackages.actions.addEntry') }}
        </el-button>
      </div>

      <div v-if="isLoadingEntries" class="py-8 flex justify-center">
        <el-icon class="text-2xl animate-spin">
          <icon-mdi-loading />
        </el-icon>
      </div>
      <el-table v-else :data="entries" stripe size="small" class="reward-packages-page__entries-table">
        <el-table-column prop="sortOrder" :label="t('views.economy.rewardPackages.entryColumns.sortOrder')" width="88" />
        <el-table-column :label="t('views.economy.rewardPackages.entryColumns.entryType')" width="160">
          <template #default="{ row }">
            <el-tag type="info">
              {{ t(`views.economy.rewardPackages.entryTypes.${row.entryType}`) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('views.economy.rewardPackages.entryColumns.payloadJson')" min-width="260">
          <template #default="{ row }">
            <code class="reward-packages-page__payload-preview">{{ row.payloadJson }}</code>
          </template>
        </el-table-column>
        <el-table-column :label="t('views.economy.rewardPackages.entryColumns.isEnabled')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'info'">
              {{ row.isEnabled ? t('common.yes') : t('common.no') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('components.myTable.operation')" width="104" fixed="right">
          <template #default="{ row }">
            <div class="reward-packages-page__actions">
              <IconButton
                round
                border
                button-size="small"
                :tooltip-content="t('common.edit')"
                @click="openEditEntry(asEntry(row))"
              >
                <icon-mdi-pencil-outline />
              </IconButton>
              <IconButton
                round
                border
                button-size="small"
                type="danger"
                :tooltip-content="t('common.delete')"
                @click="onDeleteEntry(asEntry(row))"
              >
                <icon-mdi-delete-outline />
              </IconButton>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </MyDialog>

    <MyDialog
      ref="entryDialogRef"
      :title="entryDialogTitle"
      :loading="isSubmittingEntry"
      :on-confirm="onConfirmEntry"
      width="720px"
    >
      <div class="reward-packages-page__entry-template">
        <el-button size="small" plain @click="applyPayloadTemplate">
          <el-icon><icon-mdi-code-json /></el-icon>
          {{ t('views.economy.rewardPackages.entryForm.actions.applyTemplate') }}
        </el-button>
      </div>
      <MyForm
        ref="entryFormRef"
        v-model="entryForm"
        :fields="entryFields"
        :rules="entryRules"
        label-position="top"
        label-width="auto"
        :gutter="16"
      />
    </MyDialog>
  </div>
</template>

<style scoped lang="scss">
.reward-packages-page__actions {
  display: inline-flex;
  gap: 0.35rem;
  justify-content: center;
}

.reward-packages-page__entry-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.75rem;
}

.reward-packages-page__entry-template {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.75rem;
}

.reward-packages-page__payload-preview {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reward-packages-page__entries-table {
  :deep(.el-table__cell) {
    padding-block: 0.7rem;
  }
}

:deep(.reward-packages-page__payload-input textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.82rem;
  line-height: 1.5;
}
</style>
