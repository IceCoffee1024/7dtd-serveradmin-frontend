<script setup lang="ts">
import type { TimelineItem, TimelineType } from './types';
import type {
  ChatMessageDto,
  EconomyTransactionDto,
  GameEventLogDto,
  TeleportLogDto,
} from '~/generated/api/types.gen';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  chatMessages: ChatMessageDto[];
  gameEvents: GameEventLogDto[];
  economyTransactions: EconomyTransactionDto[];
  teleportLogs: TeleportLogDto[];
  formatTime: (value: string | null | undefined) => string;
}>();

const emit = defineEmits<{
  viewPage: [name: string];
}>();

const { t } = useI18n();
const selectedTimelineType = ref<'all' | TimelineType>('all');
const timelinePage = ref(1);
const timelinePageSize = 8;

const timelineItems = computed<TimelineItem[]>(() => {
  const items: TimelineItem[] = [
    ...props.chatMessages.map((message, index) => ({
      id: `chat-${message.id ?? index}`,
      type: 'chat' as const,
      title: t('views.playerProfile.timeline.chat'),
      description: [
        message.chatType,
        message.message,
      ].filter(Boolean).join(' · '),
      timestamp: message.createdAt ?? '',
      tagType: 'primary' as const,
    })),
    ...props.gameEvents.map((event, index) => ({
      id: `event-${event.id ?? index}`,
      type: 'event' as const,
      title: event.eventType ?? t('views.playerProfile.timeline.event'),
      description: [
        event.playerName,
        event.targetPlayerName,
      ].filter(Boolean).join(' -> ') || event.details || '--',
      timestamp: event.createdAt ?? '',
      tagType: 'warning' as const,
    })),
    ...props.economyTransactions.map((transaction, index) => ({
      id: `economy-${transaction.id ?? index}`,
      type: 'economy' as const,
      title: t('views.playerProfile.timeline.economy'),
      description: [
        transaction.type,
        transaction.amount != null ? `${t('views.economy.transactions.columns.amount')}: ${transaction.amount}` : '',
        transaction.balanceAfter != null ? `${t('views.economy.transactions.columns.balanceAfter')}: ${transaction.balanceAfter}` : '',
        transaction.source,
      ].filter(Boolean).join(' · '),
      timestamp: transaction.occurredAt ?? '',
      tagType: 'success' as const,
    })),
    ...props.teleportLogs.map((log, index) => ({
      id: `teleport-${log.id ?? index}`,
      type: 'teleport' as const,
      title: t('views.playerProfile.timeline.teleport'),
      description: [
        log.subSystem,
        `${formatTeleportPosition(log, 'from')} -> ${formatTeleportPosition(log, 'to')}`,
        log.costPaid != null ? `${t('views.teleport.logs.columns.costPaid')}: ${log.costPaid}` : '',
      ].filter(Boolean).join(' · '),
      timestamp: log.timestamp ?? '',
      tagType: 'info' as const,
    })),
  ].filter(item => item.timestamp);

  return items.sort((a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf());
});

const filteredTimelineItems = computed(() => {
  if (selectedTimelineType.value === 'all')
    return timelineItems.value;
  return timelineItems.value.filter(item => item.type === selectedTimelineType.value);
});

const pagedTimelineItems = computed(() => {
  const start = (timelinePage.value - 1) * timelinePageSize;
  return filteredTimelineItems.value.slice(start, start + timelinePageSize);
});

const timelineTypeOptions = computed(() => [
  {
    label: t('views.gameItems.all'),
    value: 'all' as const,
  },
  {
    label: t('views.playerProfile.timeline.chat'),
    value: 'chat' as const,
  },
  {
    label: t('views.playerProfile.timeline.event'),
    value: 'event' as const,
  },
  {
    label: t('views.playerProfile.timeline.economy'),
    value: 'economy' as const,
  },
  {
    label: t('views.playerProfile.timeline.teleport'),
    value: 'teleport' as const,
  },
]);

watch(selectedTimelineType, () => {
  timelinePage.value = 1;
});

watch(filteredTimelineItems, () => {
  const maxPage = Math.max(1, Math.ceil(filteredTimelineItems.value.length / timelinePageSize));
  if (timelinePage.value > maxPage) {
    timelinePage.value = maxPage;
  }
});

function formatTeleportPosition(log: TeleportLogDto, side: 'from' | 'to'): string {
  const x = side === 'from' ? log.fromX : log.toX;
  const y = side === 'from' ? log.fromY : log.toY;
  const z = side === 'from' ? log.fromZ : log.toZ;
  if (x == null || y == null || z == null)
    return '--';
  return `${x}, ${y}, ${z}`;
}
</script>

<template>
  <div class="profile-panel-stack">
    <section class="profile-panel">
      <div class="profile-panel__header">
        <h3>{{ t('views.playerProfile.sections.timeline') }}</h3>
        <el-segmented v-model="selectedTimelineType" :options="timelineTypeOptions" size="small" />
      </div>
      <el-empty
        v-if="filteredTimelineItems.length === 0"
        :description="t('components.myTable.noData')"
      />
      <template v-else>
        <el-timeline class="player-profile-timeline">
          <el-timeline-item
            v-for="item in pagedTimelineItems"
            :key="item.id"
            :timestamp="formatTime(item.timestamp)"
            placement="top"
          >
            <div class="player-profile-timeline__item">
              <div class="player-profile-timeline__header">
                <el-tag :type="item.tagType" effect="plain" size="small">
                  {{ t(`views.playerProfile.timeline.${item.type}`) }}
                </el-tag>
                <strong>{{ item.title }}</strong>
              </div>
              <p>{{ item.description }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-pagination
          v-model:current-page="timelinePage"
          :page-size="timelinePageSize"
          :total="filteredTimelineItems.length"
          background
          layout="prev, pager, next"
          small
          class="player-profile-timeline__pagination"
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
