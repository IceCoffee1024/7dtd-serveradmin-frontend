import type { ComposerTranslation } from 'vue-i18n';
import type { EnumProps } from '~/composables/table';

export type ChatType = 'Global' | 'Friends' | 'Party' | 'Whisper' | 'Unknown' | (string & {});
export type LiveChatTypeFilter = ChatType | 'All';

export const CHAT_TYPE_VALUES: ChatType[] = ['Global', 'Friends', 'Party', 'Whisper', 'Unknown'];

export function getChatTypeLabel(chatType: ChatType | undefined, t: ComposerTranslation): string {
  switch (chatType) {
    case 'Global':
      return t('views.coloredChat.settings.preview.channels.global');
    case 'Friends':
      return t('views.coloredChat.settings.preview.channels.friends');
    case 'Party':
      return t('views.coloredChat.settings.preview.channels.party');
    case 'Whisper':
      return t('views.coloredChat.settings.preview.channels.whisper');
    default:
      return t('common.unknown');
  }
}

export function getChatTypeTagType(chatType: ChatType | undefined): EnumProps['tagType'] {
  switch (chatType) {
    case 'Global':
      return 'success';
    case 'Friends':
      return 'info';
    case 'Party':
      return 'warning';
    case 'Whisper':
      return 'danger';
    default:
      return 'info';
  }
}

export function getChatTypeOptions(t: ComposerTranslation): EnumProps[] {
  return CHAT_TYPE_VALUES.map(value => ({
    label: getChatTypeLabel(value, t),
    value,
    tagType: getChatTypeTagType(value),
  }));
}
