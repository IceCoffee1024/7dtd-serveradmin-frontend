<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type { MyFormField } from '~/composables/useMyForm';
import type {
  EconomyCodeRedemptionDto,
  EconomyCreateRedeemCodeRequestDto,
  EconomyRedeemCodeDto,
  EconomyRedeemCodeQueryOrder,
} from '~/generated/api/types.gen';
import { useMutation, useQueryCache } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  economyRedeemCodeCreateCodeMutation,
  economyRedeemCodeDeleteCodeMutation,
  economyRedeemCodeGetCodesQuery,
  economyRedeemCodeGetRedemptionsQuery,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateEconomyRedeemCodeQueries } from '~/queries/economy';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'EconomyRedeemCodesPage' });

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

interface FormModel {
  code: string;
  description: string;
  amount: number;
  maxUses: number;
  expiresAt: string;
}

const { t } = useI18n();
const { toast, confirm } = usePopup();
const queryCache = useQueryCache();

const tableRef = useTemplateRef('tableRef');
const createDialogRef = useTemplateRef('createDialogRef');
const formRef = useTemplateRef<FormExpose>('formRef');
const redemptionsDialogRef = useTemplateRef('redemptionsDialogRef');

const createCodeMutation = useMutation({
  ...economyRedeemCodeCreateCodeMutation(),
  async onSettled() {
    await invalidateEconomyRedeemCodeQueries();
  },
});
const deleteCodeMutation = useMutation({
  ...economyRedeemCodeDeleteCodeMutation(),
  async onSettled() {
    await invalidateEconomyRedeemCodeQueries();
  },
});
const isSubmitting = computed(() => createCodeMutation.isLoading.value);
const viewingCode = ref<EconomyRedeemCodeDto | null>(null);
const redemptions = ref<EconomyCodeRedemptionDto[]>([]);
const isLoadingRedemptions = ref(false);
const commandRewards = ref<string[]>([]);

function buildDefaults(): FormModel {
  return {
    code: '',
    description: '',
    amount: 0,
    maxUses: 0,
    expiresAt: '',
  };
}

const form = reactive<FormModel>(buildDefaults());

const schema = v.object({
  code: v.pipe(v.string(), v.minLength(1)),
  description: v.optional(v.string()),
  amount: v.pipe(v.number(), v.minValue(0)),
  maxUses: v.pipe(v.number(), v.minValue(0)),
  expiresAt: v.optional(v.string()),
});

const rules: FormRules = generateElementRules(schema);

const fields = computed<MyFormField<FormModel>[]>(() => [
  {
    prop: 'code',
    label: t('views.economy.redeemCodes.form.fields.code'),
    el: 'el-input',
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'amount',
    label: t('views.economy.redeemCodes.form.fields.amount'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'maxUses',
    label: t('views.economy.redeemCodes.form.fields.maxUses'),
    el: 'el-input-number',
    props: { min: 0, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'expiresAt',
    label: t('views.economy.redeemCodes.form.fields.expiresAt'),
    el: 'el-date-picker',
    props: { type: 'datetime', valueFormat: 'YYYY-MM-DDTHH:mm:ss', class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'description',
    label: t('views.economy.redeemCodes.form.fields.description'),
    el: 'el-input',
    props: { type: 'textarea', rows: 2 },
    span: { xs: 24 },
  },
]);

const columns = computed<MyTableColumn<EconomyRedeemCodeDto>[]>(() => [
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
    prop: 'code',
    label: t('views.economy.redeemCodes.columns.code'),
    sortable: true,
  },
  {
    prop: 'description',
    label: t('views.economy.redeemCodes.columns.description'),
  },
  {
    prop: 'amount',
    label: t('views.economy.redeemCodes.columns.amount'),
    slot: 'amount',
    sortable: true,
  },
  {
    prop: 'maxUses',
    label: t('views.economy.redeemCodes.columns.maxUses'),
  },
  {
    prop: 'usedCount',
    label: t('views.economy.redeemCodes.columns.usedCount'),
    sortable: true,
  },
  {
    prop: 'isEnabled',
    label: t('views.economy.redeemCodes.columns.isEnabled'),
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
    prop: 'expiresAt',
    label: t('views.economy.redeemCodes.columns.expiresAt'),
    slot: 'expiresAt',
    sortable: true,
  },
  {
    prop: 'createdAt',
    label: t('views.economy.redeemCodes.columns.createdAt'),
    slot: 'createdAt',
    sortable: true,
  },
]);

function toOrder(sortField: string | undefined): EconomyRedeemCodeQueryOrder | undefined {
  switch (sortField) {
    case 'code': return 'Code';
    case 'expiresAt': return 'ExpiresAt';
    case 'createdAt': return 'CreatedAt';
    default: return undefined;
  }
}

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<EconomyRedeemCodeDto>> {
  const options = economyRedeemCodeGetCodesQuery({
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

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function openAdd() {
  Object.assign(form, buildDefaults());
  commandRewards.value = [];
  createDialogRef.value?.open();
  nextTick(() => formRef.value?.clearValidate());
}

function addCommandReward() {
  commandRewards.value.push('');
}

function removeCommandReward(index: number) {
  commandRewards.value.splice(index, 1);
}

async function onConfirm(): Promise<boolean | void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return false;
  }

  try {
    const filteredCommands = commandRewards.value.map(c => c.trim()).filter(c => c.length > 0);
    if (form.amount === 0 && filteredCommands.length === 0) {
      toast({ type: 'warning', text: t('views.economy.redeemCodes.form.messages.noReward') });
      return false;
    }

    const payload: EconomyCreateRedeemCodeRequestDto = {
      code: form.code.trim(),
      description: form.description.trim() || null,
      amount: Number(form.amount),
      maxUses: Number(form.maxUses),
      expiresAt: form.expiresAt || null,
      commandRewards: filteredCommands.length > 0 ? filteredCommands : null,
    };
    await createCodeMutation.mutateAsync({ body: payload });
    toast({ type: 'success', text: t('views.economy.redeemCodes.messages.createSuccess') });
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
    return false;
  }
}

async function onDelete(row: EconomyRedeemCodeDto) {
  if (row.id == null) {
    return;
  }

  const confirmed = await confirm({
    text: t('views.economy.redeemCodes.actions.deleteConfirm'),
    type: 'warning',
  });
  if (!confirmed) {
    return;
  }

  try {
    await deleteCodeMutation.mutateAsync({ path: { id: row.id } });
    toast({ type: 'success', text: t('views.economy.redeemCodes.messages.deleteSuccess') });
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
  }
}

async function onViewRedemptions(row: EconomyRedeemCodeDto) {
  if (row.id == null) {
    return;
  }

  viewingCode.value = row;
  redemptions.value = [];
  redemptionsDialogRef.value?.open();
  isLoadingRedemptions.value = true;
  try {
    const options = economyRedeemCodeGetRedemptionsQuery({ path: { id: row.id } });
    const entry = queryCache.ensure(options);
    const state = await queryCache.fetch(entry);

    if (state.status === 'error') {
      throw state.error;
    }

    redemptions.value = state.data ?? [];
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isLoadingRedemptions.value = false;
  }
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
      :operation-column-width="200"
      :auto-column-width="true"
      :search-collapsible="true"
      @add="openAdd"
    >
      <template #amount="{ row }">
        <span class="text-amber-600 font-semibold dark:text-amber-400">{{ row.amount }}</span>
      </template>

      <template #isEnabled="{ row }">
        <el-tag :type="row.isEnabled ? 'success' : 'info'">
          {{ row.isEnabled ? t('common.yes') : t('common.no') }}
        </el-tag>
      </template>

      <template #expiresAt="{ row }">
        <span class="text-xs text-gray-700 font-mono dark:text-gray-200">{{ formatTimestamp(row.expiresAt) }}</span>
      </template>

      <template #createdAt="{ row }">
        <span class="text-xs text-gray-700 font-mono dark:text-gray-200">{{ formatTimestamp(row.createdAt) }}</span>
      </template>

      <template #operation="{ row }">
        <div class="flex gap-2 justify-center">
          <el-button size="small" plain @click="onViewRedemptions(row)">
            {{ t('views.economy.redeemCodes.actions.viewRedemptions') }}
          </el-button>
          <el-button size="small" plain type="danger" @click="onDelete(row)">
            {{ t('views.economy.redeemCodes.actions.delete') }}
          </el-button>
        </div>
      </template>
    </MyTable>

    <!-- Create dialog -->
    <MyDialog
      ref="createDialogRef"
      :title="t('views.economy.redeemCodes.form.title')"
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

      <!-- Command rewards list — managed outside MyForm because it is a dynamic array -->
      <div class="mt-4 px-1">
        <div class="mb-2 flex items-center justify-between">
          <div>
            <span class="text-sm text-gray-700 font-medium dark:text-gray-300">
              {{ t('views.economy.redeemCodes.form.fields.commandRewards') }}
            </span>
            <div class="text-xs text-gray-400 mt-0.5 dark:text-gray-500">
              {{ t('views.economy.redeemCodes.form.hints.commandRewards') }}
            </div>
          </div>
          <el-button size="small" plain @click="addCommandReward">
            <el-icon><icon-mdi-plus /></el-icon>
            {{ t('views.economy.redeemCodes.form.actions.addCommand') }}
          </el-button>
        </div>
        <div v-auto-animate class="flex flex-col gap-2">
          <div v-for="(_, index) in commandRewards" :key="index" class="flex gap-2 items-center">
            <span class="text-xs text-gray-400 text-right shrink-0 w-6 dark:text-gray-500">{{ index + 1 }}</span>
            <el-input
              v-model="commandRewards[index]"
              :placeholder="t('views.economy.redeemCodes.form.placeholders.commandReward')"
              class="font-mono flex-1"
              clearable
            />
            <IconButton
              button-size="small"
              icon-size="16"
              plain
              :tooltip-content="t('views.economy.redeemCodes.form.actions.removeCommand')"
              @click="removeCommandReward(index)"
            >
              <icon-mdi-minus />
            </IconButton>
          </div>
        </div>
      </div>
    </MyDialog>

    <!-- Redemptions viewer dialog -->
    <MyDialog
      v-if="viewingCode"
      ref="redemptionsDialogRef"
      :title="t('views.economy.redeemCodes.redemptionsDialog.title', { code: viewingCode.code })"
      :show-footer="false"
    >
      <div v-if="isLoadingRedemptions" class="py-8 flex justify-center">
        <el-icon class="text-2xl animate-spin">
          <icon-mdi-loading />
        </el-icon>
      </div>
      <template v-else>
        <div v-if="redemptions.length === 0" class="text-sm text-gray-500 py-6 text-center dark:text-gray-400">
          {{ t('views.economy.redeemCodes.redemptionsDialog.empty') }}
        </div>
        <el-table v-else :data="redemptions" size="small" stripe>
          <el-table-column
            prop="playerName"
            :label="t('views.economy.redeemCodes.redemptionsDialog.columns.playerName')"
          />
          <el-table-column
            prop="playerId"
            :label="t('views.economy.redeemCodes.redemptionsDialog.columns.playerId')"
          />
          <el-table-column
            :label="t('views.economy.redeemCodes.redemptionsDialog.columns.redeemedAt')"
          >
            <template #default="{ row }">
              <span class="text-xs font-mono">{{ formatTimestamp(row.redeemedAt) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </MyDialog>
  </div>
</template>
