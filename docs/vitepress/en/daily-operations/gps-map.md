# GPS Map

## Applicability, role, and prerequisites

This page is for administrators investigating player locations, claims, entities, or tracks. Map Info, usable map rendering/tiles, and the relevant modules are required; dragging an online player to teleport, claim operations, and vehicle-inventory reads also require higher permission and a readable loaded area.

## Purpose

GPS Map is an investigation and navigation aid. It puts players, coordinates, world entities, and tracking results in one space, then sends the operator back to Player Profile, Console, or Logs to establish facts. It is not the only management entry point and is not real-time anti-cheat evidence.

## Layers and selection

The layer switcher can show map tiles, Region Grid, Land Claims, Offline Players, Online Players, Animals, Hostiles, Traders, Vehicles, Drones, and a Player Tracking overlay opened from a track query. Entity popups can show position, status, owner, fuel, or storage; vehicle inventory is available only when the backend can read the loaded vehicle.

## Procedure

1. Open GPS Map and confirm the map background, coordinate control, and game time appear. If it is blank, check map-rendering settings, Map Info, and backend connectivity.
2. Turn on only the layers needed for the investigation. Select an online/offline player or entity marker and confirm the stable Player ID, not only a cluster icon or Entity ID.
3. Read the mouse/last-click coordinate and record X/Z (or the coordinate shown by the UI) with the zoom level. Use the same coordinate to cross-check tracking, claim, or event records.
4. When opening the map from Player Profile Tracking or a region search, check the time range, center X/Z, radius, and minimum distance. The overlay must match those query values.
5. Treat GPS as a supporting action and return to Player Profile, Player List, or Logs for the management decision. If the UI exposes drag-to-teleport for an online marker, reconfirm player, destination, and maintenance authorization before submitting.

## Observable verification

- A layer toggle affects only its markers; a selected marker's player/entity identity, coordinate, and state agree with backend lists.
- The coordinate control changes after a map click, and a track overlay's player and start/end range match the profile query.
- After map refresh or a brief disconnect, tiles and available entities recover; an unavailable layer is empty or failed, not fabricated as zero entities.

## Limits and safety

- Map data is affected by backend sampling, rendering, clustering, loaded areas, and refresh intervals. Offline players and historical tracks are not live positions.
- Coordinates, claims, vehicles, and inventory are sensitive. Hide player IDs, IPs, server coordinates, and file paths in shared screenshots.
- Drag teleport, claim removal, and full-map rendering have side effects or can take time. Full-map rendering can run for minutes and reports progress in Console; use it only when needed.

## Related pages

- [Players and Player Profile](./players)
- [Console and logs](./console-and-logs)
- [Player Tracking](../game-and-player-management/player-tracking)
- [Troubleshooting](../reference/troubleshooting)
