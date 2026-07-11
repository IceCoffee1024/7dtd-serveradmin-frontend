---
outline: deep
---

# Application settings

> For an administrator responsible for the ServerAdmin backend connection and session policy. These values affect the application and authentication boundary, not just one game feature.

## Purpose

Set the backend web address, server account credentials, token lifetimes, and server configuration file reference used by the application.

## Before you begin

- Obtain the target backend address and account from the deployment handoff. Use `<SERVERADMIN_API_BASE_URL>` and `<SERVERADMIN_ADMIN_USERNAME>` in examples.
- Confirm the account can update application settings and that a second operator can recover access if the web URL or password is wrong.
- Decide whether a frontend reload or re-login is required after changing the session lifetimes or backend address.
- A console locale/language switch changes frontend labels and may require a frontend reload; it does not change the backend time zone or any Cron schedule.
- Never paste a real password, token, database path, or private configuration path into documentation, screenshots, or browser environment variables.

## Procedure

1. Open **Application Settings** and wait for the existing values to load. The page shows a summary of the web URL, username, and server configuration file while keeping the password out of the overview.
2. Enter a full `http://` or `https://` Web URL, the backend username, and the server password. The form validates that these fields are non-empty and that the URL is valid.
3. Set access-token and refresh-token expiry in seconds. Use the shortest lifetimes compatible with the operator workflow and record the reason for any long-lived session.
4. Set the server configuration file reference to `<SERVER_CONFIG_FILE>` or the deployment-approved relative path. The backend resolves the actual path; do not guess a local path from a browser machine.
5. Select **Save Settings**. If you have changed values but need to discard them, select **Reset** before leaving. The page warns when unsaved changes would be lost.
6. Reload the settings from the backend. Token-expiry changes apply to newly issued sessions; sign out and sign in again to force the current account onto the new access/refresh-token lifetimes. A locale switch requires a frontend reload to update labels but does not change backend time-zone or scheduled-task behavior. Update the reverse proxy and frontend environment together when changing the address.

## Verify the result

- A fresh read shows the intended URL, username, expiry values, and configuration-file reference.
- The frontend can reach `<SERVERADMIN_API_BASE_URL>`, authenticate, load the dashboard, and open a protected feature.
- A new session expires according to the selected lifetime, and an expired access token can be renewed only while the refresh token remains valid.
- After a sign-out/sign-in, the new session uses the saved token lifetimes. Switching the UI language changes visible labels after reload while the backend schedule and time zone remain unchanged.
- The server configuration page can read the intended file without revealing its contents in an audit message.

## Limits and safety notes

::: danger
Saving a wrong URL, password, or file reference can prevent all operators from logging in or can expose the wrong server. Validate the target with a second operator and retain the previous values until the new session is proven.
:::

::: warning
Token expiry values are measured in seconds and affect active sessions. A frontend reload may be needed after changing the backend address, while a session change may require sign-out and sign-in to observe.
:::

## Related pages

- [Initial administrator configuration](../getting-started/initial-administrator-configuration)
- [Server configuration](./server-configuration)
- [API documentation](./api-documentation)
- [Publishing](../getting-started/publishing)
