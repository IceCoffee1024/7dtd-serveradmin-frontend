---
outline: deep
---

# Player tracking

> For authenticated administrators with player-tracking and sensitive-data access. Requires the Player Tracking module, a reachable backend, and an agreed retention/privacy policy; location, inventory, chat metadata, and item-acquisition data are opt-in operational records.

## Purpose

Use gameplay activity records for player operations, incident review, and trends. Player Tracking complements audit logs: it records player/game activity, while audit logs record administrator and sensitive management actions.

## Before you begin

- Confirm the module is enabled and read the current status/error counters in [Feature Modules](./feature-modules).
- Define who may view Player IDs, coordinates, inventory names/counts, chat activity metadata, and acquisition sources, and set retention before collecting more data.
- Prepare a test player and a safe cleanup window. Enable location, inventory, or item acquisition tracking only for the incident or operational need that justifies its storage cost.
- Start with the source's low-noise defaults: sessions, activities, and daily summaries on; chat metadata only when approved; locations, inventory snapshots, and item acquisition off. A practical baseline is about 30 days for activities, 14 days for locations, 30 days for inventory snapshots, 90 days for item acquisitions, and 180 days for daily summaries.

## Procedure

### Sessions and profile integration

1. In the player profile **Tracking** tab, choose a stable Player ID and time range. Review sessions (join/start, leave/end, and duration), then compare the timestamps with the player list and game-event logs.

### Activities

2. Review the activity timeline for Login, Joined, Left, Chat, Death, Kill, Location, Inventory, and Session events. Chat tracking stores activity metadata, not raw chat text in the tracking record.

### Locations

3. Open **Locations** or the GPS-linked view to inspect last-known positions and sampled movement. Use the sample time, coordinates, and movement threshold to distinguish a real route from sparse data.

### Inventory snapshots

4. Open **Inventory snapshots** and compare the snapshot time, hash/item totals, and inventory diff with the current inventory dialog. A snapshot is historical evidence, not the player's current bag.

### Daily summaries

5. Review **Daily summaries** for per-player aggregate counters and use them for trends rather than reconstructing an incident that needs event-level records.

### Item acquisition records

6. To investigate an item source, enable **Item acquisition** only after confirming the privacy and storage decision. Filter a player's acquisition records for entity loot containers (for example, a zombie loot bag) or ground pickups, then compare recipient, time, item stack, source coordinates, and entity/loot-list context when available with nearby location/activity records.

### Settings and retention {#settings}

7. In **Settings and retention**, configure the core switches (sessions, activity, chat metadata, daily summaries), optional locations/inventory snapshots/item acquisition, sample intervals, movement threshold, snapshot timing, per-category retention, activity cap, admin exclusions, and excluded Player IDs. Save, reload, and run cleanup with a confirmed scope.

### Runtime state

8. In the module center **Runtime State**, inspect the latest session/location/snapshot sampler runs, cleanup history, and runtime errors. Use the player profile and this state together before drawing an incident conclusion.

## Verify the result

- A test join/leave creates a session with start/end and duration; expected activity events appear in the selected time range.
- Enabled location or inventory options produce a timestamped sample/snapshot, and cleanup returns a structured count/status that matches the retention policy.
- An item-acquisition row, when available, identifies recipient, source type, coordinates when known, and stack details; the profile Tracking tab and module runtime state load without stale errors.

## Limits and safety notes

::: warning
Location, inventory, chat metadata, and acquisition records are sensitive. Disclose collection categories as required by community policy, limit access, and sanitize exports. Retention cleanup is data deletion; lower values and cleanup should be reviewed before production use.
:::

::: danger
Item acquisition is a source audit, not permanent item identity. The system cannot reconstruct items collected before tracking was enabled, player-to-player transfers, crafting, or sources from unsupported mods. It does not create a permanent identity after stack merging, transfers, crafting, or unsupported-mod flows. A missing acquisition record is an investigation lead, not proof of cheating; corroborate coordinates, nearby player records, inventory snapshots, and server logs.
:::

- High-frequency locations and inventory snapshots grow storage quickly. Keep location sampling around 120 seconds or more and movement thresholds above 10 meters unless a short incident window requires otherwise; use per-player activity caps and explicit exclusions.

## Related pages

- [Feature modules](./feature-modules)
- [Players and the hidden Player Profile](../daily-operations/players)
- [GPS Map](../daily-operations/gps-map)
- [Game items](./game-items)
- [Console and logs](../daily-operations/console-and-logs)
