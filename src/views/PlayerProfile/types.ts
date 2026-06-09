export interface ProfileStatus {
  isAdmin: boolean;
  isBanned: boolean;
  isMuted: boolean;
  isWhitelisted: boolean;
}

export type TimelineType = 'chat' | 'event' | 'economy' | 'teleport' | 'audit';

export interface TimelineItem {
  id: string;
  type: TimelineType;
  title: string;
  description: string;
  timestamp: string;
  tagType: 'primary' | 'success' | 'warning' | 'info';
}
