---
outline: deep
---

# Game items and blocks

> For administrators with game-item lookup and, when needed, player-management/item-grant permission. Requires a reachable backend and a loaded game item catalog; grants also require an online target and are audited.

## Purpose

Find the exact 7 Days to Die internal item or block identifier before using it in a shop, reward, command, or player grant. Verify a grant from the player's resulting inventory and its audit record.

## Before you begin

- Confirm **Game Items** can load the current catalog and that the target player's stable Player ID has been checked in [Players and the hidden Player Profile](../daily-operations/players).
- Decide whether you need an item or a block. Keep the requested quantity within the item's displayed maximum stack and use a quality/modification plan appropriate for the server.
- Obtain the grant permission and an audit destination before making a live change.

## Procedure

### Safe lookup

1. Open **Game Items**, search by the internal name or localized name, and switch between **All**, **Items**, and **Blocks**. Enable **Show user-hidden** only when you have a reason to inspect entries normally hidden from the catalog.
2. Hover the matching entry and compare its internal name, localized name, item/block tag, maximum stack, and icon tint. Copy the internal name from the context menu and keep the exact case for later use.

### Grant and verification

3. Open the target player's profile or inventory grant dialog, confirm the stable Player ID and online state again, and select the copied item name. Enter the quantity, quality, and permitted modifications; review the confirmation text before submitting.
4. After the grant succeeds, reload the player's current inventory or take a tracking inventory snapshot. Compare the item name, count, quality, and mods with the request, then open the related audit entry and record the operator, target, result, and timestamp.

## Verify the result

- The catalog result shows the intended internal name and item/block type; no similarly named entry was used.
- The player's current inventory or snapshot contains the requested stack, and the grant response/toast reports success.
- An audit row identifies the operator, target Player ID, item payload, result, and time. A failed or partial result is investigated before retrying.

## Limits and safety notes

::: warning
Catalog lookup is read-only, but a grant changes player state. Do not infer an item ID from a display name, and do not grant blocks or mod-only identifiers without testing them on a disposable account. The catalog may differ after a game update or unsupported mod.
:::

::: danger
Item grants can affect progression and cannot always be undone by removing one stack. Use the smallest quantity, keep the confirmation and audit record, and never publish player IDs or inventory contents in screenshots or tickets.
:::

- A changed inventory is not an audit trail by itself. Treat the grant response as an outcome check and the audit row as the operator/action boundary.
- The lookup page does not prove that a command, shop product, or reward package can deliver an item. Verify that the backend accepts the identifier and that the target inventory reflects the delivery.

## Related pages

- [Players and the hidden Player Profile](../daily-operations/players)
- [Economy](./economy)
- [Achievements and rewards](./achievements-and-rewards)
- [Player tracking](./player-tracking)
- [Console and logs](../daily-operations/console-and-logs)
