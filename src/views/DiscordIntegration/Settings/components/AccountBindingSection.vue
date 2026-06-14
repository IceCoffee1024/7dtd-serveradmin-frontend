<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import type {
  DiscordAccountBindingDto,
  DiscordAccountBindingUpsertDto,
} from '~/generated/api/types.gen';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';
import {
  discordIntegrationDeleteBinding,
  discordIntegrationGetBindings,
  discordIntegrationUpsertBinding,
} from '~/generated/api/sdk.gen';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';
import BindingCodesSection from './BindingCodesSection.vue';

interface BindingFormModel {
  id: number | null;
  playerId: string;
  playerName: string;
  discordUserId: string;
  discordUsername: string;
  isActive: boolean;
}

const { t } = useI18n();
const { confirm, toast } = usePopup();

const bindingFormRef = useTemplateRef<FormInstance>('bindingFormRef');
const isBindingsLoading = ref(false);
const isBindingSubmitting = ref(false);
const bindings = ref<DiscordAccountBindingDto[]>([]);
const bindingKeyword = ref('');
const bindingForm = reactive<BindingFormModel>(buildBindingDefaults());

const bindingRules: FormRules = generateElementRules(v.object({
  id: v.nullish(v.number()),
  playerId: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  playerName: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  discordUserId: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  discordUsername: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
  isActive: v.boolean(),
}));

function buildBindingDefaults(): BindingFormModel {
  return {
    id: null,
    playerId: '',
    playerName: '',
    discordUserId: '',
    discordUsername: '',
    isActive: true,
  };
}

function resetBindingForm() {
  Object.assign(bindingForm, buildBindingDefaults());
  nextTick(() => bindingFormRef.value?.clearValidate());
}

function editBinding(row: DiscordAccountBindingDto) {
  bindingForm.id = row.id ?? null;
  bindingForm.playerId = row.playerId;
  bindingForm.playerName = row.playerName;
  bindingForm.discordUserId = row.discordUserId;
  bindingForm.discordUsername = row.discordUsername;
  bindingForm.isActive = row.isActive ?? true;
}

function editBindingRow(row: unknown) {
  editBinding(row as DiscordAccountBindingDto);
}

function deleteBindingRow(row: unknown) {
  return onDeleteBinding(row as DiscordAccountBindingDto);
}

async function loadBindings() {
  try {
    isBindingsLoading.value = true;
    const { data } = await discordIntegrationGetBindings({
      query: {
        pageNumber: 1,
        pageSize: 20,
        keyword: bindingKeyword.value.trim() || undefined,
        desc: true,
      },
      throwOnError: true,
    });
    bindings.value = data.items ?? [];
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBindingsLoading.value = false;
  }
}

async function onSubmitBinding() {
  const valid = await bindingFormRef.value?.validate().catch(() => false);
  if (!valid)
    return;

  try {
    isBindingSubmitting.value = true;
    const body: DiscordAccountBindingUpsertDto = {
      id: bindingForm.id,
      playerId: bindingForm.playerId.trim(),
      playerName: bindingForm.playerName.trim(),
      discordUserId: bindingForm.discordUserId.trim(),
      discordUsername: bindingForm.discordUsername.trim(),
      isActive: bindingForm.isActive,
    };
    await discordIntegrationUpsertBinding({ body, throwOnError: true });
    toast({ type: 'success', text: t('views.discordIntegration.settings.messages.bindingSaved') });
    resetBindingForm();
    await loadBindings();
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isBindingSubmitting.value = false;
  }
}

async function onDeleteBinding(row: DiscordAccountBindingDto) {
  if (!row.id)
    return;

  const confirmed = await confirm({
    type: 'warning',
    text: t('views.discordIntegration.settings.messages.deleteBindingConfirm', {
      playerName: row.playerName,
      discordUsername: row.discordUsername,
    }),
  });
  if (!confirmed)
    return;

  try {
    await discordIntegrationDeleteBinding({
      path: { id: row.id },
      throwOnError: true,
    });
    toast({ type: 'success', text: t('views.discordIntegration.settings.messages.bindingDeleted') });
    if (bindingForm.id === row.id)
      resetBindingForm();
    await loadBindings();
  }
  catch (error) {
    console.error(error);
  }
}

onMounted(loadBindings);
</script>

<template>
  <section class="discord-settings__section">
    <div class="discord-settings__section-header">
      <div>
        <h3>{{ t('views.discordIntegration.settings.sections.accountBindings') }}</h3>
        <p>{{ t('views.discordIntegration.settings.sections.accountBindingsDescription') }}</p>
      </div>
      <el-button :loading="isBindingsLoading" plain @click="loadBindings">
        {{ t('components.myTable.refresh') }}
      </el-button>
    </div>

    <div class="discord-settings__binding-toolbar">
      <el-input
        v-model="bindingKeyword"
        clearable
        :placeholder="t('views.discordIntegration.settings.placeholders.bindingKeyword')"
        @keyup.enter="loadBindings"
      />
      <el-button :loading="isBindingsLoading" @click="loadBindings">
        {{ t('components.myTable.search') }}
      </el-button>
    </div>

    <el-form
      ref="bindingFormRef"
      :model="bindingForm"
      :rules="bindingRules"
      label-position="top"
      class="discord-settings__binding-form"
      @submit.prevent="onSubmitBinding"
    >
      <el-row :gutter="12">
        <el-col :xs="24" :md="6">
          <el-form-item prop="playerId" :label="t('views.discordIntegration.settings.fields.bindingPlayerId')">
            <el-input v-model="bindingForm.playerId" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="6">
          <el-form-item prop="playerName" :label="t('views.discordIntegration.settings.fields.bindingPlayerName')">
            <el-input v-model="bindingForm.playerName" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="6">
          <el-form-item prop="discordUserId" :label="t('views.discordIntegration.settings.fields.bindingDiscordUserId')">
            <el-input v-model="bindingForm.discordUserId" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="6">
          <el-form-item prop="discordUsername" :label="t('views.discordIntegration.settings.fields.bindingDiscordUsername')">
            <el-input v-model="bindingForm.discordUsername" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="6">
          <el-form-item prop="isActive" :label="t('views.discordIntegration.settings.fields.bindingIsActive')">
            <el-switch
              v-model="bindingForm.isActive"
              inline-prompt
              :active-text="t('common.yes')"
              :inactive-text="t('common.no')"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="18">
          <el-form-item class="discord-settings__binding-actions">
            <el-button :disabled="isBindingSubmitting" @click="resetBindingForm">
              {{ t('common.reset') }}
            </el-button>
            <el-button type="primary" :loading="isBindingSubmitting" @click="onSubmitBinding">
              {{ bindingForm.id ? t('common.save') : t('components.myTable.add') }}
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-table
      v-loading="isBindingsLoading"
      :data="bindings"
      row-key="id"
      class="discord-settings__binding-table"
    >
      <el-table-column prop="playerName" :label="t('views.discordIntegration.settings.fields.bindingPlayerName')" min-width="140" />
      <el-table-column prop="playerId" :label="t('views.discordIntegration.settings.fields.bindingPlayerId')" min-width="220" show-overflow-tooltip />
      <el-table-column prop="discordUsername" :label="t('views.discordIntegration.settings.fields.bindingDiscordUsername')" min-width="160" />
      <el-table-column prop="discordUserId" :label="t('views.discordIntegration.settings.fields.bindingDiscordUserId')" min-width="180" show-overflow-tooltip />
      <el-table-column :label="t('views.discordIntegration.settings.fields.bindingIsActive')" width="110">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'" effect="plain">
            {{ row.isActive ? t('common.yes') : t('common.no') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('components.myTable.operation')" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="editBindingRow(row)">
            {{ t('common.edit') }}
          </el-button>
          <el-button link type="danger" @click="deleteBindingRow(row)">
            {{ t('common.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <BindingCodesSection @redeemed="loadBindings" />
  </section>
</template>

<style scoped>
.discord-settings__binding-actions :deep(.el-form-item__content) {
  justify-content: flex-end;
  align-items: end;
  height: 100%;
}

@media (max-width: 768px) {
  .discord-settings__binding-actions :deep(.el-form-item__content) {
    justify-content: flex-start;
  }
}
</style>
