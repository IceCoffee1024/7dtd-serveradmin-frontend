import type { InvItemDto } from '~/generated/api/types.gen';

export type InventoryItemContainer = 'Backpack' | 'Toolbelt' | 'Equipment';

export type PlayerInventoryRemovalMode = 'AllMatching' | 'SelectedSlot';

export interface InventorySlotItem {
  item: InvItemDto;
  container: InventoryItemContainer;
  slotIndex: number;
}

export interface RemovePlayerInventoryItemRequestDto {
  itemName: string;
  mode: PlayerInventoryRemovalMode;
  container?: Exclude<InventoryItemContainer, 'Equipment'>;
  slotIndex?: number;
}
