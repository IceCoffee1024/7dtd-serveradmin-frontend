<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { MyFormField } from '~/composables/useMyForm';
import type {
  AchievementDefinitionQueryOrder,
  AchievementDefinitionUpsertDto,
} from '~/generated/api/types.gen';
import type { AchievementDefinitionRow } from '~/queries/achievement';
import { useMutation, useQueryCache } from '@pinia/colada';
import { useI18n } from 'vue-i18n';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  achievementCreateDefinitionMutation,
  achievementDeleteDefinitionMutation,
  achievementGetDefinitionsQuery,
  achievementUpdateDefinitionMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import {
  invalidateAchievementQueries,
  toAchievementDefinitionRow,
} from '~/queries/achievement';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'AchievementDefinitionsPage' });

type DefinitionRow = AchievementDefinitionRow;

interface FormModel {
  name: string;
  description: string;
  isEnabled: boolean;
  triggerType: string;
  threshold: number;
  economyReward: number;
  consoleCommands: string;
  playerMessage: string;
  broadcastMessage: string;
  sortOrder: number;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const { t } = useI18n();
const { toast, confirm } = usePopup();

const tableRef = useTemplateRef('tableRef');
const dialogRef = useTemplateRef('dialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');

const editingId = ref<number | null>(null);
const queryCache = useQueryCache();
const createDefinitionMutation = useMutation({
  ...achievementCreateDefinitionMutation(),
  async onSettled() {
    await invalidateAchievementQueries();
  },
});
const updateDefinitionMutation = useMutation({
  ...achievementUpdateDefinitionMutation(),
  async onSettled() {
    await invalidateAchievementQueries();
  },
});
const deleteDefinitionMutation = useMutation({
  ...achievementDeleteDefinitionMutation(),
  async onSettled() {
    await invalidateAchievementQueries();
  },
});
const isSubmitting = computed(() => createDefinitionMutation.isLoading.value || updateDefinitionMutation.isLoading.value);

const triggerTypeOptions = computed(() => [
  { label: t('views.achievement.definitions.triggerTypes.level'), value: 'Level' },
  { label: t('views.achievement.definitions.triggerTypes.zombieKills'), value: 'ZombieKills' },
  { label: t('views.achievement.definitions.triggerTypes.playerKills'), value: 'PlayerKills' },
  { label: t('views.achievement.definitions.triggerTypes.deaths'), value: 'Deaths' },
  { label: t('views.achievement.definitions.triggerTypes.gameStage'), value: 'GameStage' },
]);

const booleanOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const dialogTitle = computed(() =>
  editingId.value
    ? t('views.achievement.definitions.form.editTitle')
    : t('views.achievement.definitions.form.addTitle'),
);

function buildDefaults(): FormModel {
  return {
    name: '',
    description: '',
    isEnabled: true,
    triggerType: 'Level',
    threshold: 1,
    economyReward: 0,
    consoleCommands: '',
    playerMessage: '',
    broadcastMessage: '',
    sortOrder: 0,
  };
}

const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  description: v.optional(v.string()),
  isEnabled: v.boolean(),
  triggerType: v.pipe(v.string(), v.minLength(1)),
  threshold: v.pipe(v.number(), v.minValue(1)),
  economyReward: v.pipe(v.number(), v.minValue(0)),
  consoleCommands: v.optional(v.string()),
  playerMessage: v.optional(v.string()),
  broadcastMessage: v.optional(v.string()),
  sortOrder: v.pipe(v.number(), v.minValue(0)),
});

const rules: FormRules = generateElementRules(schema);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'name',
    label: t('views.achievement.definitions.form.fields.name'),
    el: 'el-input',
    props: { clearable: true },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'triggerType',
    label: t('views.achievement.definitions.form.fields.triggerType'),
    el: 'el-select',
    options: triggerTypeOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'threshold',
    label: t('views.achievement.definitions.form.fields.threshold'),
    el: 'el-input-number',
    props: { min: 1, controlsPosition: 'right', style: 'width: 100%' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'economyReward',
    label: t('views.achievement.definitions.form.fields.economyReward'),
    el: 'el-input-number',
    props: { min: 0, controlsPosition: 'right', style: 'width: 100%' },
    tooltip: t('views.achievement.definitions.form.tooltips.economyReward'),
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'isEnabled',
    label: t('views.achievement.definitions.form.fields.isEnabled'),
    el: 'el-select',
    options: booleanOptions.value,
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'sortOrder',
    label: t('views.achievement.definitions.form.fields.sortOrder'),
    el: 'el-input-number',
    props: { min: 0, controlsPosition: 'right', style: 'width: 100%' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'description',
    label: t('views.achievement.definitions.form.fields.description'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    span: { xs: 24 },
  },
  {
    prop: 'playerMessage',
    label: t('views.achievement.definitions.form.fields.playerMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    tooltip: t('views.achievement.definitions.form.tooltips.playerMessage'),
    span: { xs: 24 },
  },
  {
    prop: 'broadcastMessage',
    label: t('views.achievement.definitions.form.fields.broadcastMessage'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2, clearable: true },
    tooltip: t('views.achievement.definitions.form.tooltips.broadcastMessage'),
    span: { xs: 24 },
  },
  {
    prop: 'consoleCommands',
    label: t('views.achievement.definitions.form.fields.consoleCommands'),
    el: 'el-input',
    props: { type: 'textarea', rows: 3, clearable: true },
    tooltip: t('views.achievement.definitions.form.tooltips.consoleCommands'),
    span: { xs: 24 },
  },
]);

const columns = computed<MyTableColumn<DefinitionRow>[]>(() => [
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
    label: t('views.achievement.definitions.columns.name'),
    sortable: true,
    minWidth: 140,
  },
  {
    prop: 'triggerType',
    label: t('views.achievement.definitions.columns.triggerType'),
    slot: 'triggerType',
    sortable: true,
    width: 130,
    search: {
      el: 'el-select',
      options: triggerTypeOptions.value.map(o => ({ ...o })),
      props: { clearable: true },
      order: 1,
      span: 6,
    },
  },
  {
    prop: 'threshold',
    label: t('views.achievement.definitions.columns.threshold'),
    sortable: true,
    width: 110,
    align: 'right',
  },
  {
    prop: 'economyReward',
    label: t('views.achievement.definitions.columns.economyReward'),
    slot: 'economyReward',
    width: 120,
    align: 'right',
  },
  {
    prop: 'isEnabled',
    label: t('views.achievement.definitions.columns.isEnabled'),
    slot: 'isEnabled',
    width: 100,
    align: 'center',
    search: {
      el: 'el-select',
      options: [
        { label: t('common.yes'), value: true },
        { label: t('common.no'), value: false },
      ],
      props: { clearable: true },
      order: 2,
      span: 6,
    },
  },
  {
    prop: 'sortOrder',
    label: t('views.achievement.definitions.columns.sortOrder'),
    sortable: true,
    width: 90,
    align: 'right',
  },
]);

function toOrder(sortField: string | undefined): AchievementDefinitionQueryOrder | undefined {
  switch (sortField) {
    case 'name': return 'Name';
    case 'triggerType': return 'TriggerType';
    case 'threshold': return 'Threshold';
    case 'sortOrder': return 'SortOrder';
    case 'createdAt': return 'CreatedAt';
    default: return undefined;
  }
}

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<DefinitionRow>> {
  const options = achievementGetDefinitionsQuery({
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      keyword: params.search?.keyword?.trim() || undefined,
      triggerType: typeof params.search?.triggerType === 'string' ? params.search.triggerType || undefined : undefined,
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

  if (response == null) {
    return { list: [], total: 0 };
  }

  return { list: response.items.map(toAchievementDefinitionRow), total: response.total };
}

function openAdd() {
  editingId.value = null;
  Object.assign(form, buildDefaults());
  dialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

function openEdit(row: DefinitionRow) {
  editingId.value = row.id;
  form.name = row.name;
  form.description = row.description ?? '';
  form.isEnabled = row.isEnabled;
  form.triggerType = row.triggerType;
  form.threshold = row.threshold;
  form.economyReward = row.economyReward;
  form.consoleCommands = row.consoleCommands ?? '';
  form.playerMessage = row.playerMessage ?? '';
  form.broadcastMessage = row.broadcastMessage ?? '';
  form.sortOrder = row.sortOrder;
  dialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

async function onConfirm(): Promise<boolean | void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return false;
  }

  try {
    const payload: AchievementDefinitionUpsertDto = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      isEnabled: form.isEnabled,
      triggerType: form.triggerType,
      threshold: Number(form.threshold),
      economyReward: Number(form.economyReward),
      consoleCommands: form.consoleCommands.trim() || null,
      playerMessage: form.playerMessage.trim() || null,
      broadcastMessage: form.broadcastMessage.trim() || null,
      sortOrder: Number(form.sortOrder),
    };

    if (editingId.value != null) {
      await updateDefinitionMutation.mutateAsync({ path: { id: editingId.value }, body: payload });
      toast({ type: 'success', text: t('views.achievement.definitions.messages.updateSuccess') });
    }
    else {
      await createDefinitionMutation.mutateAsync({ body: payload });
      toast({ type: 'success', text: t('views.achievement.definitions.messages.createSuccess') });
    }
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
    return false;
  }
}

async function onDelete(row: DefinitionRow) {
  const confirmed = await confirm({
    text: t('views.achievement.definitions.actions.deleteConfirm'),
    type: 'warning',
  });
  if (!confirmed) {
    return;
  }

  try {
    await deleteDefinitionMutation.mutateAsync({ path: { id: row.id } });
    toast({ type: 'success', text: t('views.achievement.definitions.messages.deleteSuccess') });
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
  }
}

function triggerTypeLabel(value: string): string {
  return triggerTypeOptions.value.find(o => o.value === value)?.label ?? value;
}
</script>

<template>
  <div>
    <MyTable
      ref="tableRef"
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :selectable="false"
      :operation-column-width="160"
      :auto-column-width="true"
      :search-collapsible="true"
      @add="openAdd"
    >
      <template #triggerType="{ row }">
        <el-tag type="info">
          {{ triggerTypeLabel(row.triggerType) }}
        </el-tag>
      </template>

      <template #economyReward="{ row }">
        <span class="text-amber-600 font-semibold dark:text-amber-400">{{ row.economyReward }}</span>
      </template>

      <template #isEnabled="{ row }">
        <el-tag :type="row.isEnabled ? 'success' : 'info'">
          {{ row.isEnabled ? t('common.yes') : t('common.no') }}
        </el-tag>
      </template>

      <template #operation="{ row }">
        <div class="flex gap-2 justify-center">
          <el-button size="small" plain @click="openEdit(row)">
            {{ t('components.myTable.edit') }}
          </el-button>
          <el-button size="small" plain type="danger" @click="onDelete(row)">
            {{ t('common.delete') }}
          </el-button>
        </div>
      </template>
    </MyTable>

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
      />
    </MyDialog>
  </div>
</template>
