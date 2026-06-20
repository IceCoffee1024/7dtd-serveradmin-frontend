import type { InvItemDto } from '~/generated/api/types.gen';
import { describe, expect, it } from 'vitest';
import { createInventorySlotItems } from './inventorySlots';

function item(itemName: string): InvItemDto {
  return {
    itemName,
    iconName: itemName,
    iconColor: null,
    localizationName: itemName,
    count: 1,
    maxStackAllowed: 1,
    quality: null,
    qualityColor: null,
    useTimes: 0,
    maxUseTimes: 0,
    isMod: false,
    isBlock: false,
    parts: null,
  };
}

describe('player inventory slots', () => {
  it('keeps original slot indexes while filtering empty equipment slots', () => {
    const slots = createInventorySlotItems([null, item('armorMilitaryVest'), null, item('armorMilitaryBoots')], 'Equipment');

    expect(slots.map(slot => `${slot.container}:${slot.slotIndex}:${slot.item.itemName}`)).toEqual([
      'Equipment:1:armorMilitaryVest',
      'Equipment:3:armorMilitaryBoots',
    ]);
  });
});
