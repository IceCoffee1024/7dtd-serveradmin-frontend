<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import type {
  DiscordAccountBindingCodeCreateResultDto,
  DiscordAccountBindingCodeDto,
  DiscordAccountBindingCodeRedeemResultDto,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';
import {
  discordIntegrationCleanupExpiredBindingCodes,
  discordIntegrationCreateBindingCode,
  discordIntegrationDeleteBindingCode,
  discordIntegrationGetBindingCodes,
  discordIntegrationRedeemBindingCode,
} from '~/generated/api/sdk.gen';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

interface BindingCodeCreateFormModel {
  playerId: string;
  playerName: string;
  expiresInMinutes: number;
}

interface BindingCodeRedeemFormModel {
  code: string;
  discordUserId: string;
  discordUsername: string;
}

interface Emits {
  redeemed: [];
}

const emit = defineEmits<Emits>();
const { t } = useI18n();
const { confirm, toast } = usePopup();

const bindingCodeCreateFormRef = useTemplateRef<FormInstance>('bindingCodeCreateFormRef');
const bindingCodeRedeemFormRef = useTemplateRef<FormInstance>('bindingCodeRedeemFormRef');
const isBindingCodesLoading = ref(false);
const isBindingCodeCreating = ref(false);
const isBindingCodeRedeeming = ref(false);
const isBindingCodeCleaning = ref(false);
const bindingCodes = ref<DiscordAccountBindingCodeDto[]>([]);
const bindingCodeKeyword = ref('');
const bindingCodeCreateForm = reactive<BindingCodeCreateFormModel>(buildBindingCodeCreateDefaults());
const bindingCodeRedeemForm = reactive<BindingCodeRedeemFormModel>(buildBindingCodeRedeemDefaults());
const latestCreatedBindingCode = ref<DiscordAccountBindingCodeCreateResultDto | null>(null);
const latestRedeemResult = ref<DiscordAccountBindingCodeRedeemResultDto | null>(null);

const bindingCodeCreateRules: FormRules = generateElementRules(v.object({
  playerId: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  playerName: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  expiresInMinutes: v.pipe(v.number(), v.minValue(1), v.maxValue(60)),
}));
const bindingCodeRedeemRules: FormRules = generateElementRules(v.object({
  code: v.pipe(v.string(), v.minLength(6), v.maxLength(32)),
  discordUserId: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  discordUsername: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
}));

function buildBindingCodeCreateDefaults(): BindingCodeCreateFormModel {
  return {
    playerId: '',
    playerName: '',
    expiresInMinutes: 10,
  };
}

function buildBindingCodeRedeemDefaults(): BindingCodeRedeemFormModel {
  return {
    code: '',
    discordUserId: '',
    discordUsername: '',
  };
}

function resetBindingCodeCreateForm() {
  Object.assign(bindingCodeCreateForm, buildBindingCodeCreateDefaults());
  latestCreatedBindingCode.value = null;
  nextTick(() => bindingCodeCreateFormRef.value?.clearValidate());
}

function resetBindingCodeRedeemForm() {
  Object.assign(bindingCodeRedeemForm, buildBindingCodeRedeemDefaults());
  latestRedeemResult.value = null;
  nextTick(() => bindingCodeRedeemFormRef.value?.clearValidate());
}

async function loadBindingCodes() {
  try {
    isBindingCodesLoading.value = true;
    const { data } = await discordIntegrationGetBindingCodes({
      query: {
        pageNumber: 1,
        pageSize: 20,
        keyword: bindingCodeKeyword.value.trim() || undefined,
        desc: true,
      },
      throwOnError: true,
    });
    bindingCodes.value = data.items ?? [];
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBindingCodesLoading.value = false;
  }
}

async function onCreateBindingCode() {
  const valid = await bindingCodeCreateFormRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  try {
    isBindingCodeCreating.value = true;
    const { data } = await discordIntegrationCreateBindingCode({
      body: {
        playerId: bindingCodeCreateForm.playerId.trim(),
        playerName: bindingCodeCreateForm.playerName.trim(),
        expiresInMinutes: bindingCodeCreateForm.expiresInMinutes,
      },
      throwOnError: true,
    });
    latestCreatedBindingCode.value = data;
    toast({ type: 'success', text: t('views.discordIntegration.settings.messages.bindingCodeCreated') });
    await loadBindingCodes();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBindingCodeCreating.value = false;
  }
}

async function onRedeemBindingCode() {
  const valid = await bindingCodeRedeemFormRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  try {
    isBindingCodeRedeeming.value = true;
    const { data } = await discordIntegrationRedeemBindingCode({
      body: {
        code: bindingCodeRedeemForm.code.trim(),
        discordUserId: bindingCodeRedeemForm.discordUserId.trim(),
        discordUsername: bindingCodeRedeemForm.discordUsername.trim(),
      },
      throwOnError: true,
    });
    latestRedeemResult.value = data;
    toast({ type: 'success', text: data.message || t('views.discordIntegration.settings.messages.bindingCodeRedeemed') });
    await loadBindingCodes();
    emit('redeemed');
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBindingCodeRedeeming.value = false;
  }
}

async function onDeleteBindingCode(row: DiscordAccountBindingCodeDto) {
  if (!row.id)
    return;

  const confirmed = await confirm({
    type: 'warning',
    text: t('views.discordIntegration.settings.messages.deleteBindingCodeConfirm', {
      playerName: row.playerName,
      codePrefix: row.codePrefix,
    }),
  });
  if (!confirmed)
    return;

  try {
    await discordIntegrationDeleteBindingCode({
      path: { id: row.id },
      throwOnError: true,
    });
    toast({ type: 'success', text: t('views.discordIntegration.settings.messages.bindingCodeDeleted') });
    await loadBindingCodes();
  }
  catch (error) {
    console.error(error);
  }
}

function getBindingCodeStatusForRow(row: unknown) {
  return getBindingCodeStatus(row as DiscordAccountBindingCodeDto);
}

function deleteBindingCodeRow(row: unknown) {
  return onDeleteBindingCode(row as DiscordAccountBindingCodeDto);
}

async function onCleanupExpiredBindingCodes() {
  const confirmed = await confirm({
    type: 'warning',
    text: t('views.discordIntegration.settings.messages.cleanupBindingCodesConfirm'),
  });
  if (!confirmed)
    return;

  try {
    isBindingCodeCleaning.value = true;
    const { data } = await discordIntegrationCleanupExpiredBindingCodes({ throwOnError: true });
    toast({
      type: 'success',
      text: t('views.discordIntegration.settings.messages.bindingCodesCleaned', { count: data ?? 0 }),
    });
    await loadBindingCodes();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBindingCodeCleaning.value = false;
  }
}

function formatTimestamp(value: string | null | undefined): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function getBindingCodeStatus(row: DiscordAccountBindingCodeDto) {
  if (row.redeemedAt)
    return { type: 'success' as const, text: t('views.discordIntegration.settings.status.redeemed') };

  if (row.expiresAt && dayjs(row.expiresAt).isBefore(dayjs()))
    return { type: 'info' as const, text: t('views.discordIntegration.settings.status.expired') };

  return { type: 'warning' as const, text: t('views.discordIntegration.settings.status.pending') };
}

onMounted(loadBindingCodes);
</script>

<template>
  <div class="discord-settings__subsection">
    <div class="discord-settings__section-header">
      <div>
        <h3>{{ t('views.discordIntegration.settings.sections.bindingCodes') }}</h3>
        <p>{{ t('views.discordIntegration.settings.sections.bindingCodesDescription') }}</p>
      </div>
      <div class="discord-settings__section-actions">
        <el-button :loading="isBindingCodeCleaning" plain @click="onCleanupExpiredBindingCodes">
          {{ t('views.discordIntegration.settings.actions.cleanupExpiredBindingCodes') }}
        </el-button>
        <el-button :loading="isBindingCodesLoading" plain @click="loadBindingCodes">
          {{ t('components.myTable.refresh') }}
        </el-button>
      </div>
    </div>

    <div class="discord-settings__binding-code-grid">
      <el-form
        ref="bindingCodeCreateFormRef"
        :model="bindingCodeCreateForm"
        :rules="bindingCodeCreateRules"
        label-position="top"
        class="discord-settings__binding-form"
        @submit.prevent="onCreateBindingCode"
      >
        <h4>{{ t('views.discordIntegration.settings.sections.createBindingCode') }}</h4>
        <el-form-item prop="playerId" :label="t('views.discordIntegration.settings.fields.bindingPlayerId')">
          <el-input v-model="bindingCodeCreateForm.playerId" clearable />
        </el-form-item>
        <el-form-item prop="playerName" :label="t('views.discordIntegration.settings.fields.bindingPlayerName')">
          <el-input v-model="bindingCodeCreateForm.playerName" clearable />
        </el-form-item>
        <el-form-item prop="expiresInMinutes" :label="t('views.discordIntegration.settings.fields.bindingCodeExpiresInMinutes')">
          <el-input-number
            v-model="bindingCodeCreateForm.expiresInMinutes"
            class="w-full"
            :min="1"
            :max="60"
            :precision="0"
          />
        </el-form-item>
        <div class="discord-settings__inline-actions">
          <el-button :disabled="isBindingCodeCreating" @click="resetBindingCodeCreateForm">
            {{ t('common.reset') }}
          </el-button>
          <el-button type="primary" :loading="isBindingCodeCreating" @click="onCreateBindingCode">
            {{ t('views.discordIntegration.settings.actions.createBindingCode') }}
          </el-button>
        </div>
        <el-alert
          v-if="latestCreatedBindingCode"
          type="success"
          show-icon
          :closable="false"
        >
          <template #title>
            <span class="discord-settings__code">{{ latestCreatedBindingCode.code }}</span>
          </template>
          <template #default>
            {{ t('views.discordIntegration.settings.messages.bindingCodeCreatedDetail', {
              expiresAt: formatTimestamp(latestCreatedBindingCode.expiresAt),
            }) }}
          </template>
        </el-alert>
      </el-form>

      <el-form
        ref="bindingCodeRedeemFormRef"
        :model="bindingCodeRedeemForm"
        :rules="bindingCodeRedeemRules"
        label-position="top"
        class="discord-settings__binding-form"
        @submit.prevent="onRedeemBindingCode"
      >
        <h4>{{ t('views.discordIntegration.settings.sections.redeemBindingCode') }}</h4>
        <el-form-item prop="code" :label="t('views.discordIntegration.settings.fields.bindingCode')">
          <el-input v-model="bindingCodeRedeemForm.code" clearable />
        </el-form-item>
        <el-form-item prop="discordUserId" :label="t('views.discordIntegration.settings.fields.bindingDiscordUserId')">
          <el-input v-model="bindingCodeRedeemForm.discordUserId" clearable />
        </el-form-item>
        <el-form-item prop="discordUsername" :label="t('views.discordIntegration.settings.fields.bindingDiscordUsername')">
          <el-input v-model="bindingCodeRedeemForm.discordUsername" clearable />
        </el-form-item>
        <div class="discord-settings__inline-actions">
          <el-button :disabled="isBindingCodeRedeeming" @click="resetBindingCodeRedeemForm">
            {{ t('common.reset') }}
          </el-button>
          <el-button type="primary" :loading="isBindingCodeRedeeming" @click="onRedeemBindingCode">
            {{ t('views.discordIntegration.settings.actions.redeemBindingCode') }}
          </el-button>
        </div>
        <el-alert
          v-if="latestRedeemResult"
          :type="latestRedeemResult.succeeded ? 'success' : 'error'"
          show-icon
          :closable="false"
          :title="latestRedeemResult.message"
        />
      </el-form>
    </div>

    <div class="discord-settings__binding-toolbar">
      <el-input
        v-model="bindingCodeKeyword"
        clearable
        :placeholder="t('views.discordIntegration.settings.placeholders.bindingCodeKeyword')"
        @keyup.enter="loadBindingCodes"
      />
      <el-button :loading="isBindingCodesLoading" @click="loadBindingCodes">
        {{ t('components.myTable.search') }}
      </el-button>
    </div>

    <el-table
      v-loading="isBindingCodesLoading"
      :data="bindingCodes"
      row-key="id"
      class="discord-settings__binding-table"
    >
      <el-table-column prop="codePrefix" :label="t('views.discordIntegration.settings.fields.bindingCodePrefix')" width="110">
        <template #default="{ row }">
          <span class="discord-settings__mono">{{ row.codePrefix }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="playerName" :label="t('views.discordIntegration.settings.fields.bindingPlayerName')" min-width="140" />
      <el-table-column prop="playerId" :label="t('views.discordIntegration.settings.fields.bindingPlayerId')" min-width="220" show-overflow-tooltip />
      <el-table-column :label="t('views.discordIntegration.settings.fields.bindingCodeStatus')" width="110">
        <template #default="{ row }">
          <el-tag :type="getBindingCodeStatusForRow(row).type" effect="plain">
            {{ getBindingCodeStatusForRow(row).text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('views.discordIntegration.settings.fields.bindingCodeExpiresAt')" min-width="170">
        <template #default="{ row }">
          <span class="discord-settings__mono">{{ formatTimestamp(row.expiresAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('views.discordIntegration.settings.fields.bindingCodeRedeemedAt')" min-width="170">
        <template #default="{ row }">
          <span class="discord-settings__mono">{{ formatTimestamp(row.redeemedAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="redeemedDiscordUsername" :label="t('views.discordIntegration.settings.fields.bindingDiscordUsername')" min-width="160" />
      <el-table-column :label="t('components.myTable.operation')" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="danger" @click="deleteBindingCodeRow(row)">
            {{ t('common.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.discord-settings__section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 15px;
    line-height: 22px;
  }

  p {
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }
}

.discord-settings__section-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.discord-settings__subsection {
  display: grid;
  gap: 12px;
  border-top: 1px dashed var(--el-border-color);
  padding-top: 14px;
}

.discord-settings__binding-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.discord-settings__binding-form {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  background: var(--el-bg-color);
}

.discord-settings__binding-code-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  h4 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 14px;
    line-height: 20px;
  }
}

.discord-settings__inline-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.discord-settings__binding-table {
  width: 100%;
}

.discord-settings__code,
.discord-settings__mono {
  font-family: var(--el-font-family-monospace, ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace);
}

.discord-settings__code {
  font-size: 16px;
  letter-spacing: 0;
}

@media (max-width: 768px) {
  .discord-settings__section-header {
    flex-direction: column;
  }

  .discord-settings__section-actions,
  .discord-settings__inline-actions {
    justify-content: flex-start;
  }

  .discord-settings__binding-toolbar,
  .discord-settings__binding-code-grid {
    grid-template-columns: 1fr;
  }
}
</style>
