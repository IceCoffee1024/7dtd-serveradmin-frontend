# Player Tracking

Player Tracking records player sessions, activity events, optional location samples, optional inventory snapshots, and daily summary counters. It is intended for player operations, incident review, and long-term trend analysis.

## Scope

Tracked data can include:

- Login, join, leave, chat, death, kill, session, location, and inventory events.
- Session start/end time and total play time.
- Last known position and sampled movement.
- Inventory snapshot hashes and item totals.
- Daily aggregate counters for profile trends.

The feature does not replace audit logs. Audit logs remain for admin actions and sensitive management operations. Player Tracking stores gameplay and operational activity.

## Recommended Defaults

Keep the default low-noise setup first:

- Session tracking enabled.
- Activity logs enabled.
- Chat activity enabled only when the server owner accepts the retention/privacy implications.
- Daily summaries enabled.
- Location samples disabled until needed.
- Inventory snapshots disabled until needed.
- Activity retention around 30 days.
- Daily summary retention around 180 days.

Enable location sampling or inventory snapshots only after confirming storage growth and privacy expectations.

## Runtime State

Player Tracking writes runtime state into Module State so the module center can show:

- Latest session run.
- Latest location sampler run.
- Latest inventory snapshot run.
- Cleanup history.
- Runtime errors.

Use the module center Runtime State panel for diagnostics. Use the Player Tracking settings page for configuration and cleanup.

## Player Profile Integration

The player profile page includes a Tracking tab that can show:

- Recent sessions.
- Activity timeline entries.
- Location samples.
- Inventory snapshots.
- Daily summary counters.

The overview and timeline also include tracking-derived summary data when available.

## Performance And Storage

High-volume servers should treat location and inventory tracking as explicit opt-in features.

Operational guidance:

- Keep `locationSampleIntervalSeconds` at 120 seconds or higher unless investigating a short incident window.
- Keep `locationMovementThresholdMeters` above 10 meters to avoid repeated near-identical samples.
- Use `maxActivityLogsPerPlayer` to cap per-player activity volume.
- Run cleanup after lowering retention values.
- Exclude admins or test accounts when they create noisy operational data.

## Privacy Notes

Chat tracking records activity metadata, not raw chat text in the tracking record. Inventory snapshots may include item names and counts. Location samples include coordinates. Server owners should disclose these data categories to administrators and players when required by their community policy.

## Live Verification

Before relying on Player Tracking in production:

1. Enable the feature with sessions, activities, and daily summaries.
2. Join the real server with a test player.
3. Confirm a session is created.
4. Send one global chat message and confirm a chat activity appears when chat tracking is enabled.
5. Leave the server and confirm the session closes with a duration.
6. Enable location tracking temporarily and confirm a join/save/sample location appears.
7. Enable inventory snapshots temporarily and capture a manual snapshot from the player profile.
8. Run cleanup with safe retention values and confirm status counts update.
9. Open the module center and confirm runtime state is visible.

Minimum acceptance criteria:

- Settings and status endpoints are reachable.
- Session count increases after a real join/leave.
- Activity log contains expected event types.
- Player profile Tracking tab loads without layout overflow.
- Module center health does not show stale runtime errors.
- Cleanup returns a structured result and writes an audit entry.

