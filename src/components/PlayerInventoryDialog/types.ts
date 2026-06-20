import type { InvItemDto, PlayerInventoryItemContainer } from '~/generated/api/types.gen';

export type InventoryItemContainer = PlayerInventoryItemContainer | 'Equipment';

export interface InventorySlotItem {
  item: InvItemDto;
  container: InventoryItemContainer;
  slotIndex: number;
}
