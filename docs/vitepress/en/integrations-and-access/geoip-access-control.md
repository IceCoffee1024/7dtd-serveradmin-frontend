---
outline: deep
---

# GeoIP access control

> For administrators who can configure login policy and inspect recent decisions. The feature requires outbound lookup access when a public IP is not resolved by an explicit exception.

## Purpose

Apply a coarse country and IP policy at player login, verify the decision order with safe test data, and avoid treating GeoIP as identity or anti-cheat evidence.

## Before you begin

- Choose a provider that matches the server's privacy and regional compliance policy: `IpWhoIs` uses HTTPS without a token, `IpApi` is a limited HTTP option, and `IpInfo` uses HTTPS with an account token.
- Decide the behavior for unknown countries and private or local addresses before enabling strict blocking.
- Prepare a test public IP, a private test address, a temporary CIDR exception, and a dedicated test player. Use `203.0.113.10` or `198.51.100.0/24` only as documentation examples, not as a claim about a real client.
- Keep **Bypass admins** enabled until the policy has been validated and a recovery operator is available.

::: warning
Each uncached public player IP may be sent to the selected third-party provider. Document that data flow and choose the provider, cache duration, and logging policy accordingly.
:::

## Procedure

### Settings {#settings}

1. Open **GeoIP Access Control** and leave the mode disabled while selecting the provider. Enter an `IpInfo` token only in the protected field; do not copy it into a screenshot or ticket.
2. Set request timeout, successful-cache TTL, and failure-cache TTL. Keep a short failure cache, such as five minutes, while testing provider reliability.
3. Choose a policy mode: **Disabled**, **Allow only listed countries**, or **Block listed countries**. Enter ISO country codes in the matching list and choose **Unknown country policy** and **Private/local IP policy** explicitly.
4. Add exact IP or CIDR values to the allow-list or block-list for approved test clients and recovery administrators. Explicit exceptions are evaluated before country rules.
5. Set the kick message and decide whether to log allowed decisions. Enable allowed logging temporarily when validating a new policy, then reduce noise if it is not needed.
6. Save, run **Test lookup** for a public test IP and a private address, then inspect the result provider, country, cache flag, and error state. Use **Clear cache** after changing provider or policy assumptions.

### Evaluation order

Login decisions follow this order:

1. Disabled module or disabled mode allows the login.
2. Admin bypass, when enabled, allows the login.
3. Invalid IP is recorded as `Skipped`.
4. Private or loopback IP follows `PrivateIpPolicy`.
5. IP allow-list allows before lookup.
6. IP block-list blocks before lookup.
7. A remote GeoIP lookup runs for the remaining public IP.
8. Lookup failure or a missing country follows `UnknownCountryPolicy`.
9. The country allow or block mode decides the result.

### Live verification

1. Keep the mode disabled, test provider lookup, and confirm recent decisions are readable.
2. Enable a harmless country policy that does not match the test operator, then join with the dedicated test player and confirm an allowed decision.
3. Add the test IP to the block-list and confirm the player is kicked with the configured message. Remove the entry, clear cache, and confirm the player can rejoin.
4. Simulate a provider failure only in a controlled window, then confirm the configured unknown-country policy is applied. Restore the provider and policy after the test.

## Verify the result

- The status section shows the selected provider, cache count, last lookup, and last block without a stale error.
- Recent decisions contain the expected `Allowed`, `Blocked`, `LookupFailed`, or `Skipped` result and reason.
- An explicit allow-list entry wins before country policy, and an explicit block-list entry blocks before a remote request.
- Clearing cache changes the next lookup behavior after provider or settings changes, and removing a temporary block restores login.

## Limits and safety notes

::: danger
Strict blocking can reject legitimate players when a provider is unavailable, a carrier uses an unexpected country, or an address is shared. Start with unknown-country `Allow`, test the real login event, and keep a recovery exception.
:::

- GeoIP is approximate access control. It is not an identity proof, VPN detector, or anti-cheat system. Use audit, player tracking, and server evidence for an investigation.
- `IpApi` uses HTTP and provider limits. Do not use it as a high-trust path on a hostile network.

## Related pages

- [Access control](./access-control)
- [Player list and profile](../daily-operations/players)
- [Audit logs](../daily-operations/console-and-logs#audit-logs)
- [Application settings](./application-settings)
