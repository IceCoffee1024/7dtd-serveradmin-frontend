<script setup lang="ts">
import type { FormRules } from 'element-plus';
import type { MyFormField } from '~/composables/useMyForm';
import type { GameItemDto, GiveItemToPlayerRequestDto } from '~/generated/api/types.gen';
import { useMutation } from '@pinia/colada';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import GameItemSelect from '~/components/GameItemSelect/index.vue';
import MyDialog from '~/components/MyDialog/index.vue';
import MyForm from '~/components/MyForm/index.vue';
import { usePopup } from '~/composables';
import {
  chatAddOrUpdateMuteMutation,
  chatRemoveMutesMutation,
  gameServerCreateBanMutation,
  gameServerGiveItemToOnlinePlayerMutation,
  gameServerKickPlayerMutation,
  gameServerRemoveBansMutation,
} from '~/generated/api/@pinia/colada.gen';
import v from '~/plugins/valibot';
import { invalidateGeneratedQueries } from '~/queries/generated';
import { generateElementRules, showCommandResult } from '~/utils';

interface ProfileStatus {
  isBanned: boolean;
  isMuted: boolean;
}

interface GiveItemFormModel {
  itemName: string;
  count: number;
  quality: number;
}

interface FormExpose {
  validate: () => Promise<boolean | undefined>;
  clearValidate: (props?: string | string[]) => void;
}

const props = defineProps<{
  playerId: string;
  displayName: string;
  isOnline: boolean;
  status: ProfileStatus;
}>();

const emit = defineEmits<{
  refreshed: [];
}>();

const { t } = useI18n();
const { confirm, prompt, toast } = usePopup();
const playerInventoryDialogRef = useTemplateRef('playerInventoryDialogRef');
const giveItemDialogRef = useTemplateRef('giveItemDialogRef');
const giveItemFormRef = useTemplateRef<FormExpose>('giveItemFormRef');
const selectedGameItem = ref<GameItemDto | null>(null);
const giveItemForm = reactive<GiveItemFormModel>({
  itemName: '',
  count: 1,
  quality: 1,
});

const selectedItemAcceptsQuality = computed(() => selectedGameItem.value?.hasQuality === true);
const giveItemSchema = v.object({
  itemName: v.pipe(v.string(), v.minLength(1)),
  count: v.pipe(v.number(), v.minValue(1), v.maxValue(999999)),
  quality: v.pipe(v.number(), v.minValue(1), v.maxValue(6)),
});
const giveItemRules: FormRules = generateElementRules(giveItemSchema);
const giveItemFields = computed<MyFormField<GiveItemFormModel>[]>(() => [
  {
    prop: 'itemName',
    label: t('views.playerList.giveItem.fields.itemName'),
    el: 'custom',
    span: { xs: 24 },
  },
  {
    prop: 'count',
    label: t('views.playerList.giveItem.fields.count'),
    el: 'el-input-number',
    props: { min: 1, max: 999999, precision: 0, class: 'w-full' },
    span: { xs: 24, md: 12 },
  },
  {
    prop: 'quality',
    label: t('views.playerList.giveItem.fields.quality'),
    el: 'el-input-number',
    props: { min: 1, max: 6, precision: 0, class: 'w-full' },
    disabled: () => !selectedItemAcceptsQuality.value,
    tooltip: t('views.playerList.giveItem.qualityHint'),
    span: { xs: 24, md: 12 },
  },
]);

const kickPlayerMutation = useMutation({
  ...gameServerKickPlayerMutation(),
});
const banPlayerMutation = useMutation({
  ...gameServerCreateBanMutation(),
});
const removeBanMutation = useMutation({
  ...gameServerRemoveBansMutation(),
});
const addMuteMutation = useMutation({
  ...chatAddOrUpdateMuteMutation(),
});
const removeMuteMutation = useMutation({
  ...chatRemoveMutesMutation(),
});
const giveItemMutation = useMutation({
  ...gameServerGiveItemToOnlinePlayerMutation(),
});
const isGivingItem = computed(() => giveItemMutation.isLoading.value);

function emitRefresh() {
  emit('refreshed');
}

function openInventory() {
  playerInventoryDialogRef.value?.open(props.playerId, props.displayName);
}

function openGiveItemDialog() {
  giveItemForm.itemName = '';
  giveItemForm.count = 1;
  giveItemForm.quality = 1;
  selectedGameItem.value = null;
  giveItemDialogRef.value?.open();
  nextTick(() => giveItemFormRef.value?.clearValidate());
}

function onSelectedGameItemChange(item: GameItemDto | null) {
  selectedGameItem.value = item;
  if (item?.hasQuality !== true) {
    giveItemForm.quality = 1;
  }
}

async function onGiveItemConfirm(): Promise<boolean | void> {
  const valid = await giveItemFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return false;
  }

  const body: GiveItemToPlayerRequestDto = {
    itemName: giveItemForm.itemName.trim(),
    count: Number(giveItemForm.count),
    quality: selectedItemAcceptsQuality.value ? Number(giveItemForm.quality) : null,
  };

  try {
    const result = await giveItemMutation.mutateAsync({
      path: { playerId: props.playerId },
      body,
    });
    showCommandResult(result ?? undefined, t('views.playerList.giveItem.title'));
  }
  catch (error) {
    console.error(error);
    return false;
  }
}

async function onKickPlayer() {
  if (!props.isOnline) {
    return;
  }

  const reason = await prompt({ text: t('views.playerList.kickReason') });
  if (reason === undefined) {
    return;
  }

  try {
    const result = await kickPlayerMutation.mutateAsync({
      body: { playerId: props.playerId, reason: reason || null },
    });
    showCommandResult(result ?? undefined, t('views.playerList.kick'));
    emitRefresh();
  }
  catch (error) {
    console.error(error);
  }
}

async function onBanPlayer() {
  const minutesStr = await prompt({
    text: t('views.playerList.banDuration'),
    inputValidator: value => (Number(value) > 0) || t('views.playerList.banDuration'),
  });
  if (minutesStr === undefined) {
    return;
  }

  const reason = await prompt({ text: t('views.playerList.banReason') });
  if (reason === undefined) {
    return;
  }

  const confirmed = await confirm({ text: t('views.playerList.ban'), type: 'warning' });
  if (!confirmed) {
    return;
  }

  try {
    const result = await banPlayerMutation.mutateAsync({
      body: {
        playerId: props.playerId,
        bannedUntil: dayjs().add(Number(minutesStr), 'minute').toISOString(),
        displayName: props.displayName,
        reason: reason || null,
      },
    });
    showCommandResult(result ?? undefined, t('views.playerList.ban'));
    await invalidateGeneratedQueries('GameServer');
    emitRefresh();
  }
  catch (error) {
    console.error(error);
  }
}

async function onRemoveBan() {
  const confirmed = await confirm({ text: t('views.playerProfile.flags.banned'), type: 'warning' });
  if (!confirmed) {
    return;
  }

  try {
    const result = await removeBanMutation.mutateAsync({ body: [props.playerId] });
    showCommandResult(result ?? undefined, t('views.playerProfile.flags.banned'));
    await invalidateGeneratedQueries('GameServer');
    emitRefresh();
  }
  catch (error) {
    console.error(error);
  }
}

async function onMutePlayer() {
  const minutesStr = await prompt({ text: t('views.playerList.muteDuration') });
  if (minutesStr === undefined) {
    return;
  }

  const reason = await prompt({ text: t('views.playerList.muteReason') });
  if (reason === undefined) {
    return;
  }

  try {
    const minutes = Number(minutesStr);
    const mutedUntil = minutes > 0 ? dayjs().add(minutes, 'minute').toISOString() : null;
    await addMuteMutation.mutateAsync({
      body: {
        playerId: props.playerId,
        playerName: props.displayName,
        mutedUntil,
        reason: reason || null,
      },
    });
    toast({ type: 'success', title: t('views.playerList.mute') });
    await invalidateGeneratedQueries('Chat');
    emitRefresh();
  }
  catch (error) {
    console.error(error);
  }
}

async function onRemoveMute() {
  try {
    await removeMuteMutation.mutateAsync({ body: [props.playerId] });
    toast({ type: 'success', title: t('views.playerList.unmute') });
    await invalidateGeneratedQueries('Chat');
    emitRefresh();
  }
  catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <section class="profile-panel player-profile-actions">
    <div class="profile-panel__header">
      <h3>{{ t('components.myTable.operation') }}</h3>
      <el-tag :type="isOnline ? 'success' : 'info'" effect="plain">
        {{ isOnline ? t('common.online') : t('common.offline') }}
      </el-tag>
    </div>
    <div class="player-profile-actions__list">
      <el-button :disabled="!playerId" @click="openInventory">
        <icon-mdi:bag-personal-outline class="mr-1" />
        {{ t('views.map.viewPlayerInventory') }}
      </el-button>
      <el-button type="primary" :disabled="!isOnline" :loading="isGivingItem" @click="openGiveItemDialog">
        <icon-mdi:gift-outline class="mr-1" />
        {{ t('views.playerList.giveItem.title') }}
      </el-button>
      <el-button :disabled="!isOnline" :loading="kickPlayerMutation.isLoading.value" @click="onKickPlayer">
        <icon-mdi:logout class="mr-1" />
        {{ t('views.playerList.kick') }}
      </el-button>
      <el-button
        v-if="status.isMuted"
        type="success"
        :loading="removeMuteMutation.isLoading.value"
        @click="onRemoveMute"
      >
        <icon-mdi:microphone-outline class="mr-1" />
        {{ t('views.playerList.unmute') }}
      </el-button>
      <el-button
        v-else
        type="warning"
        :loading="addMuteMutation.isLoading.value"
        @click="onMutePlayer"
      >
        <icon-mdi:microphone-off class="mr-1" />
        {{ t('views.playerList.mute') }}
      </el-button>
      <el-button
        v-if="status.isBanned"
        type="success"
        :loading="removeBanMutation.isLoading.value"
        @click="onRemoveBan"
      >
        <icon-mdi:account-check-outline class="mr-1" />
        {{ t('views.playerProfile.actions.unban') }}
      </el-button>
      <el-button
        v-else
        type="danger"
        :loading="banPlayerMutation.isLoading.value"
        @click="onBanPlayer"
      >
        <icon-mdi:account-cancel-outline class="mr-1" />
        {{ t('views.playerList.ban') }}
      </el-button>
    </div>

    <MyDialog
      ref="giveItemDialogRef"
      :title="t('views.playerList.giveItem.title')"
      :loading="isGivingItem"
      :on-confirm="onGiveItemConfirm"
    >
      <div class="give-item-target">
        <span>{{ t('views.playerList.giveItem.target') }}</span>
        <strong>{{ displayName }}</strong>
        <code>{{ playerId }}</code>
      </div>
      <MyForm
        ref="giveItemFormRef"
        v-model="giveItemForm"
        :fields="giveItemFields"
        :rules="giveItemRules"
        label-position="top"
        label-width="auto"
        :gutter="16"
      >
        <template #itemName>
          <GameItemSelect
            v-model="giveItemForm.itemName"
            include-blocks
            :placeholder="t('views.playerList.giveItem.fields.itemName')"
            @selected-change="onSelectedGameItemChange"
          />
        </template>
      </MyForm>
    </MyDialog>

    <PlayerInventoryDialog ref="playerInventoryDialogRef" />
  </section>
</template>

<style scoped lang="scss">
.player-profile-actions {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, white 4%);
}

.profile-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.profile-panel__header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.player-profile-actions__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.player-profile-actions__list :deep(.el-button) {
  margin-left: 0;
}

.give-item-target {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
  font-size: 13px;
}

.give-item-target span {
  color: var(--el-text-color-secondary);
}

.give-item-target code {
  color: var(--el-text-color-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
