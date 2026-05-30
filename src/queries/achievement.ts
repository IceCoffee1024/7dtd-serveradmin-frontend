import type {
  AchievementDefinitionDto,
  AchievementRecordDto,
} from '~/generated/api/types.gen';
import { invalidateGeneratedQueries } from './generated';

export async function invalidateAchievementQueries() {
  await invalidateGeneratedQueries('Achievement');
}

export type AchievementDefinitionRow = AchievementDefinitionDto & {
  id: number;
  isEnabled: boolean;
  threshold: number;
  economyReward: number;
  sortOrder: number;
};

export type AchievementRecordRow = AchievementRecordDto & {
  id: number;
  createdAt: string;
  achievementId: number;
  economyRewarded: number;
};

export function toAchievementDefinitionRow(item: AchievementDefinitionDto): AchievementDefinitionRow {
  return {
    ...item,
    id: item.id ?? 0,
    isEnabled: item.isEnabled ?? false,
    threshold: item.threshold ?? 0,
    economyReward: item.economyReward ?? 0,
    sortOrder: item.sortOrder ?? 0,
  };
}

export function toAchievementRecordRow(item: AchievementRecordDto): AchievementRecordRow {
  return {
    ...item,
    id: item.id ?? 0,
    createdAt: item.createdAt ?? '',
    achievementId: item.achievementId ?? 0,
    economyRewarded: item.economyRewarded ?? 0,
  };
}
