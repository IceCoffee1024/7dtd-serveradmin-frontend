<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import type { MyTableColumn, MyTableFetchParams, MyTableFetchResult } from '~/composables/table';
import type {
  EventAutomationRuleDto,
  EventAutomationRuleQueryOrder,
  EventAutomationRuleUpsertDto,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';
import {
  eventAutomationCreateRule,
  eventAutomationDeleteRule,
  eventAutomationGetRules,
  eventAutomationUpdateRule,
} from '~/generated/api/sdk.gen';

defineOptions({ name: 'EventAutomationRulesPage' });

type RuleRow = EventAutomationRuleDto;

interface RuleFormModel {
  name: string;
  isEnabled: boolean;
  triggerType: string;
  conditionsJson: string;
  actionsJson: string;
  description: string;
}

const TRIGGER_TYPES = ['PlayerJoined', 'PlayerLeft', 'PlayerDied', 'ChatMessage', 'Cron'] as const;

const { t } = useI18n();
const { confirm, toast } = usePopup();

const tableRef = useTemplateRef('tableRef');
const formRef = useTemplateRef<FormInstance>('formRef');
const dialogVisible = ref(false);
const editingRule = ref<RuleRow | null>(null);
const isSubmitting = ref(false);

const form = reactive<RuleFormModel>(buildDefaults());

const triggerTypeOptions = computed(() =>
  TRIGGER_TYPES.map(type => ({
    label: t(`views.eventAutomation.triggers.${type}`),
    value: type,
  })),
);

const enabledOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
]);

const rules = computed<FormRules<RuleFormModel>>(() => ({
  name: [{ required: true, message: t('views.eventAutomation.rules.validation.nameRequired'), trigger: 'blur' }],
  triggerType: [{ required: true, message: t('views.eventAutomation.rules.validation.triggerRequired'), trigger: 'change' }],
  conditionsJson: [{ validator: validateJsonObject, trigger: 'blur' }],
  actionsJson: [{ validator: validateJsonArray, trigger: 'blur' }],
}));

const columns = computed<MyTableColumn<RuleRow>[]>(() => [
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
    prop: 'isEnabled',
    label: t('views.eventAutomation.rules.columns.isEnabled'),
    slot: 'isEnabled',
    search: {
      el: 'el-select',
      props: { clearable: true },
      options: enabledOptions,
      order: 1,
      span: 8,
    },
  },
  {
    prop: 'triggerType',
    label: t('views.eventAutomation.rules.columns.triggerType'),
    slot: 'triggerType',
    sortable: true,
    search: {
      el: 'el-select',
      props: { clearable: true },
      options: triggerTypeOptions,
      order: 2,
      span: 8,
    },
  },
  { prop: 'name', label: t('views.eventAutomation.rules.columns.name'), sortable: true },
  { prop: 'description', label: t('views.eventAutomation.rules.columns.description') },
  { prop: 'lastMatchedAt', label: t('views.eventAutomation.rules.columns.lastMatchedAt'), slot: 'lastMatchedAt', sortable: true },
  { prop: 'lastStatus', label: t('views.eventAutomation.rules.columns.lastStatus'), slot: 'lastStatus' },
  { prop: 'updatedAt', label: t('views.eventAutomation.rules.columns.updatedAt'), slot: 'updatedAt', sortable: true },
]);

function buildDefaults(): RuleFormModel {
  return {
    name: '',
    isEnabled: true,
    triggerType: 'PlayerJoined',
    conditionsJson: '{}',
    actionsJson: '[]',
    description: '',
  };
}

async function fetchData(params: MyTableFetchParams): Promise<MyTableFetchResult<RuleRow>> {
  const { data } = await eventAutomationGetRules({
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      keyword: toOptionalString(params.search?.keyword),
      isEnabled: typeof params.search?.isEnabled === 'boolean' ? params.search.isEnabled : undefined,
      triggerType: toOptionalString(params.search?.triggerType),
      order: toOrder(params.sortField),
      desc: params.sortOrder === 'descending',
    },
    throwOnError: true,
  });

  return {
    list: data?.items ?? [],
    total: data?.total ?? 0,
  };
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return undefined;

  const trimmed = value.trim();
  return trimmed || undefined;
}

function toOrder(sortField: string | undefined): EventAutomationRuleQueryOrder | undefined {
  switch (sortField) {
    case 'name':
      return 'Name';
    case 'isEnabled':
      return 'IsEnabled';
    case 'triggerType':
      return 'TriggerType';
    case 'lastMatchedAt':
      return 'LastMatchedAt';
    case 'updatedAt':
      return 'UpdatedAt';
    default:
      return undefined;
  }
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function resolveTriggerTypeLabel(triggerType: string): string {
  const key = `views.eventAutomation.triggers.${triggerType}`;
  const label = t(key);
  return label === key ? triggerType : label;
}

function validateJsonObject(_rule: unknown, value: string, callback: (error?: Error) => void) {
  try {
    const parsed = JSON.parse(value || '{}');
    if (parsed == null || Array.isArray(parsed) || typeof parsed !== 'object')
      callback(new Error(t('views.eventAutomation.rules.validation.conditionsJson')));
    else
      callback();
  }
  catch {
    callback(new Error(t('views.eventAutomation.rules.validation.conditionsJson')));
  }
}

function validateJsonArray(_rule: unknown, value: string, callback: (error?: Error) => void) {
  try {
    const parsed = JSON.parse(value || '[]');
    if (!Array.isArray(parsed))
      callback(new Error(t('views.eventAutomation.rules.validation.actionsJson')));
    else
      callback();
  }
  catch {
    callback(new Error(t('views.eventAutomation.rules.validation.actionsJson')));
  }
}

function formatJsonField(prop: 'actionsJson' | 'conditionsJson') {
  try {
    const parsed = JSON.parse(form[prop] || (prop === 'conditionsJson' ? '{}' : '[]'));
    form[prop] = JSON.stringify(parsed, null, 2);
    formRef.value?.validateField(prop);
  }
  catch {
    formRef.value?.validateField(prop);
  }
}

function applyRuleToForm(rule: RuleRow | null) {
  const source = rule ?? buildDefaults();
  form.name = source.name ?? '';
  form.isEnabled = source.isEnabled ?? true;
  form.triggerType = source.triggerType ?? 'PlayerJoined';
  form.conditionsJson = source.conditionsJson || '{}';
  form.actionsJson = source.actionsJson || '[]';
  form.description = source.description ?? '';
}

function onAdd() {
  editingRule.value = null;
  applyRuleToForm(null);
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

function onEdit(row: RuleRow) {
  editingRule.value = row;
  applyRuleToForm(row);
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

function toPayload(): EventAutomationRuleUpsertDto {
  return {
    name: form.name.trim(),
    isEnabled: form.isEnabled,
    triggerType: form.triggerType.trim(),
    conditionsJson: form.conditionsJson.trim() || '{}',
    actionsJson: form.actionsJson.trim() || '[]',
    description: form.description.trim() || null,
  };
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  try {
    isSubmitting.value = true;
    const payload = toPayload();
    if (editingRule.value?.id != null) {
      await eventAutomationUpdateRule({
        path: { id: editingRule.value.id },
        body: payload,
        throwOnError: true,
      });
      toast({ type: 'success', text: t('views.eventAutomation.rules.messages.updateSuccess') });
    }
    else {
      await eventAutomationCreateRule({
        body: payload,
        throwOnError: true,
      });
      toast({ type: 'success', text: t('views.eventAutomation.rules.messages.createSuccess') });
    }

    dialogVisible.value = false;
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isSubmitting.value = false;
  }
}

async function onDelete(row: RuleRow) {
  if (row.id == null)
    return;

  const confirmed = await confirm({
    text: t('views.eventAutomation.rules.messages.deleteConfirm', { name: row.name }),
    type: 'warning',
  });
  if (!confirmed)
    return;

  try {
    await eventAutomationDeleteRule({
      path: { id: row.id },
      throwOnError: true,
    });
    toast({ type: 'success', text: t('views.eventAutomation.rules.messages.deleteSuccess') });
    tableRef.value?.reload();
  }
  catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <el-alert
      :title="t('views.eventAutomation.rules.hint')"
      type="info"
      show-icon
      :closable="false"
    />

    <MyTable
      ref="tableRef"
      row-key="id"
      :columns="columns"
      :fetch-data="fetchData"
      :show-index="true"
      :auto-column-width="true"
      :search-collapsible="true"
      @add="onAdd"
    >
      <template #isEnabled="{ row }">
        <el-tag :type="row.isEnabled ? 'success' : 'info'">
          {{ row.isEnabled ? t('common.yes') : t('common.no') }}
        </el-tag>
      </template>

      <template #triggerType="{ row }">
        <el-tag type="info">
          {{ resolveTriggerTypeLabel(row.triggerType) }}
        </el-tag>
      </template>

      <template #lastMatchedAt="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatTimestamp(row.lastMatchedAt) }}</span>
      </template>

      <template #lastStatus="{ row }">
        <el-tag type="info">
          {{ row.lastStatus || t('common.unknown') }}
        </el-tag>
      </template>

      <template #updatedAt="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-200">{{ formatTimestamp(row.updatedAt) }}</span>
      </template>

      <template #operation="{ row }">
        <div class="flex gap-1.5 justify-center">
          <IconButton button-size="small" icon-size="18" plain :tooltip-content="t('components.myTable.edit')" @click="onEdit(row)">
            <icon-mdi-pencil />
          </IconButton>
          <IconButton button-size="small" icon-size="18" plain :tooltip-content="t('common.delete')" @click="onDelete(row)">
            <icon-mdi-delete-outline />
          </IconButton>
        </div>
      </template>
    </MyTable>

    <el-dialog
      v-model="dialogVisible"
      :title="editingRule == null ? t('views.eventAutomation.rules.dialog.createTitle') : t('views.eventAutomation.rules.dialog.editTitle')"
      width="760px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item prop="name" :label="t('views.eventAutomation.rules.form.name')">
              <el-input v-model="form.name" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="triggerType" :label="t('views.eventAutomation.rules.form.triggerType')">
              <el-select v-model="form.triggerType" class="w-full" filterable allow-create>
                <el-option
                  v-for="option in triggerTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="isEnabled" :label="t('views.eventAutomation.rules.form.isEnabled')">
              <el-switch
                v-model="form.isEnabled"
                inline-prompt
                :active-text="t('common.yes')"
                :inactive-text="t('common.no')"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24">
            <el-form-item prop="description" :label="t('views.eventAutomation.rules.form.description')">
              <el-input v-model="form.description" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="conditionsJson" :label="t('views.eventAutomation.rules.form.conditionsJson')">
              <el-input v-model="form.conditionsJson" type="textarea" :rows="10" spellcheck="false" class="event-automation-json" />
            </el-form-item>
            <el-button size="small" @click="formatJsonField('conditionsJson')">
              {{ t('views.eventAutomation.rules.actions.formatJson') }}
            </el-button>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item prop="actionsJson" :label="t('views.eventAutomation.rules.form.actionsJson')">
              <el-input v-model="form.actionsJson" type="textarea" :rows="10" spellcheck="false" class="event-automation-json" />
            </el-form-item>
            <el-button size="small" @click="formatJsonField('actionsJson')">
              {{ t('views.eventAutomation.rules.actions.formatJson') }}
            </el-button>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button :disabled="isSubmitting" @click="dialogVisible = false">
          {{ t('common.cancel') }}
        </el-button>
        <el-button type="primary" :loading="isSubmitting" @click="onSubmit">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.event-automation-json :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}
</style>
