<script setup lang="ts">
import type { TimelineType } from './types';
import type {
  ChatMessageDto,
  EconomyTransactionDto,
  GameEventLogDto,
  PlayerProfileTimelineItemDto,
  PlayerProfileTimelineItemType,
  TeleportLogDto,
} from '~/generated/api/types.gen';
import { useI18n } from 'vue-i18n';

defineProps<{
  timelineItems: PlayerProfileTimelineItemDto[];
  timelineTotal: number;
  timelineLoading: boolean;
  timelinePage: number;
  timelinePageSize: number;
  timelineType: 'all' | PlayerProfileTimelineItemType;
  chatMessages: ChatMessageDto[];
  gameEvents: GameEventLogDto[];
  economyTransactions: EconomyTransactionDto[];
  teleportLogs: TeleportLogDto[];
  formatTime: (value: string | null | undefined) => string;
}>();

const emit = defineEmits<{
  'update:timelineType': [value: 'all' | PlayerProfileTimelineItemType];
  'update:timelinePage': [value: number];
  'viewPage': [name: string];
}>();

const { t } = useI18n();

const timelineTypeOptions = computed(() => [
  {
    label: t('views.gameItems.all'),
    value: 'all' as const,
  },
  {
    label: t('views.playerProfile.timeline.chat'),
    value: 'Chat' as const,
  },
  {
    label: t('views.playerProfile.timeline.event'),
    value: 'Event' as const,
  },
  {
    label: t('views.playerProfile.timeline.economy'),
    value: 'Economy' as const,
  },
  {
    label: t('views.playerProfile.timeline.teleport'),
    value: 'Teleport' as const,
  },
  {
    label: t('views.playerProfile.timeline.audit'),
    value: 'Audit' as const,
  },
  {
    label: t('views.playerProfile.timeline.tracking'),
    value: 'Tracking' as const,
  },
]);

function toTimelineType(type: PlayerProfileTimelineItemType): TimelineType {
  return type.toLowerCase() as TimelineType;
}

function normalizeTimelineItemType(type: PlayerProfileTimelineItemType | undefined): PlayerProfileTimelineItemType {
  return type ?? 'Event';
}

function resolveTimelineTagType(type: PlayerProfileTimelineItemType | undefined): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
  switch (type) {
    case 'Chat':
      return 'primary';
    case 'Event':
      return 'warning';
    case 'Economy':
      return 'success';
    case 'Teleport':
      return 'info';
    case 'Audit':
      return 'danger';
    case 'Tracking':
      return 'primary';
    default:
      return 'info';
  }
}
</script>

<template>
  <div class="profile-panel-stack">
    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.timeline') }}</h3>
        <el-segmented
          :model-value="timelineType"
          :options="timelineTypeOptions"
          size="small"
          @update:model-value="emit('update:timelineType', $event as 'all' | PlayerProfileTimelineItemType)"
        />
      </div>
      <el-empty
        v-if="timelineItems.length === 0 && !timelineLoading"
        :description="t('components.myTable.noData')"
      />
      <template v-else>
        <el-timeline class="player-profile-timeline">
          <el-timeline-item
            v-for="item in timelineItems"
            :key="item.id"
            :timestamp="formatTime(item.timestamp)"
            placement="top"
          >
            <div class="player-profile-timeline__item">
              <div class="player-profile-timeline__header">
                <el-tag :type="resolveTimelineTagType(item.type)" effect="plain" size="small">
                  {{ t(`views.playerProfile.timeline.${toTimelineType(normalizeTimelineItemType(item.type))}`) }}
                </el-tag>
                <strong>{{ item.title }}</strong>
              </div>
              <p>{{ item.description }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-pagination
          :current-page="timelinePage"
          :page-size="timelinePageSize"
          :total="timelineTotal"
          background
          layout="prev, pager, next"
          size="small"
          class="player-profile-timeline__pagination"
          @current-change="emit('update:timelinePage', $event)"
        />
      </template>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.gameEvents') }}</h3>
        <el-button type="primary" link @click="emit('viewPage', 'GameEventLogs')">
          {{ t('components.myTable.view') }}
        </el-button>
      </div>
      <el-table :data="gameEvents" size="small" border>
        <el-table-column :label="t('views.gameEventLogs.columns.createdAt')" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="eventType" :label="t('views.gameEventLogs.columns.eventType')" />
        <el-table-column prop="playerName" :label="t('views.gameEventLogs.columns.playerName')" />
        <el-table-column prop="targetPlayerName" :label="t('views.gameEventLogs.columns.targetPlayerName')" />
      </el-table>
    </section>

    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.chat') }}</h3>
        <el-button type="primary" link @click="emit('viewPage', 'ChatHistory')">
          {{ t('components.myTable.view') }}
        </el-button>
      </div>
      <el-table :data="chatMessages" size="small" border>
        <el-table-column :label="t('views.gameChat.history.columns.createdAt')" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="chatType" :label="t('views.gameChat.history.columns.chatType')" width="120" />
        <el-table-column prop="message" :label="t('views.gameChat.history.columns.message')" />
      </el-table>
    </section>
  </div>
</template>

<style scoped lang="scss">
.profile-panel-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-panel {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, white 4%);
}

.profile-panel h3 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
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
}

.profile-panel__header :deep(.el-segmented) {
  max-width: 100%;
  overflow-x: auto;
}

.player-profile-timeline {
  padding-left: 2px;
}

.player-profile-timeline__item {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.player-profile-timeline__header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.player-profile-timeline__header strong,
.player-profile-timeline__item p {
  min-width: 0;
  overflow-wrap: anywhere;
}

.player-profile-timeline__item p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.player-profile-timeline__pagination {
  justify-content: flex-end;
  margin-top: 8px;
}

@media (max-width: 960px) {
  .profile-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
