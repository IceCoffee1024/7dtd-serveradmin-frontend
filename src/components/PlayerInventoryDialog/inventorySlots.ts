import type { InvItemDto } from '~/generated/api/types.gen';
import type { InventorySlotItem } from './types';

export function createInventorySlotItems(
  items: Array<InvItemDto | null | undefined>,
  container: InventorySlotItem['container'],
): InventorySlotItem[] {
  return items
    .map((item, slotIndex) => item
      ? {
          item,
          container,
          slotIndex,
        }
      : null)
    .filter((item): item is InventorySlotItem => item !== null);
}
