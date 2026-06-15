# GeoIP Access Control

GeoIP access control blocks or allows player logins by country/region lookup and explicit IP exceptions. It is intended as a coarse access-control layer, not as an identity or anti-cheat system.

## Providers

The server can use one of three remote lookup providers:

- `ipwho.is`: HTTPS, no token required, suitable as the default low-friction option.
- `ip-api.com`: HTTP, no token required, useful for simple testing. Because it is plain HTTP, avoid treating it as a high-trust provider on hostile networks.
- `ipinfo.io`: HTTPS, token required, suitable when the server owner already has an ipinfo token or wants account-based quota management.

Lookup results are cached in memory. Successful lookups use `CacheTtlMinutes`; failed lookups use `FailureCacheTtlMinutes`. Cache is process-local and is cleared on server restart or from the settings page.

## Policy Order

Login evaluation follows this order:

1. Disabled module or disabled mode: allow.
2. Admin bypass, when enabled: allow.
3. Invalid player IP: record as skipped.
4. Private or loopback IP: apply `PrivateIpPolicy`.
5. Explicit IP allow-list: allow.
6. Explicit IP block-list: block.
7. Remote GeoIP lookup.
8. Lookup failure or missing country: apply `UnknownCountryPolicy`.
9. Country allow/block mode decision.

IP exceptions support exact IP values and CIDR ranges, for example `203.0.113.10` or `198.51.100.0/24`.

## Privacy And Reliability

Each uncached public player IP may be sent to the selected third-party provider. Server owners should choose a provider that matches their privacy policy and regional compliance expectations.

Remote lookups can fail because of provider downtime, quota limits, DNS issues, proxy/firewall rules, or slow network paths. Use conservative defaults:

- Keep unknown country policy as `Allow` until the provider path has been tested.
- Use a short failure cache such as 5 minutes.
- Use explicit allow-list entries for trusted admins or test clients if needed.

## Real Server Verification

Before enabling strict blocking on a live server:

1. Set mode to disabled, choose provider, and run test lookup for `8.8.8.8` and a known local/private IP.
2. Enable logging for allowed decisions temporarily.
3. Enable `BlockCountries` with a harmless country list that should not match current testers.
4. Join the real server and confirm a recent allowed decision appears.
5. Add the tester IP to the block-list and confirm the login is kicked with the configured message.
6. Remove the tester IP from the block-list, clear cache, and confirm login succeeds.
7. Test provider outage behavior by switching to `IpInfo` without a token or by using a blocked network path, then confirm `UnknownCountryPolicy` behaves as configured.
8. Disable allowed-decision logging after verification if the extra noise is not needed.

Do not rely on simulated chat or console messages to validate this feature. The important path is the real player login event, because that is where the server-provided player IP is read.
