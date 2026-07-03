import { translateLiteralPlaceholders } from '~/utils/i18nLiteralPlaceholders';

export type MuteNotificationTooltipKey
  = | 'muteAppliedPrivateMessage'
    | 'muteAppliedBroadcastMessage'
    | 'muteRemovedPrivateMessage'
    | 'muteRemovedBroadcastMessage';

type Translate = (key: string, named?: Record<string, string>) => string;

const MUTE_NOTIFICATION_PLACEHOLDERS = ['player', 'playerName', 'playerId', 'reason', 'mutedUntil'];

export function getMuteNotificationTooltip(t: Translate, key: MuteNotificationTooltipKey): string {
  return translateLiteralPlaceholders(t, `views.chatSettings.tooltips.${key}`, MUTE_NOTIFICATION_PLACEHOLDERS);
}
