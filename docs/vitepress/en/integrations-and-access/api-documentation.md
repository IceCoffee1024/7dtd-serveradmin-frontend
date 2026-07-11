---
outline: deep
---

# API documentation

> For developers and operators who need to inspect the running backend contract or regenerate the frontend client. Access depends on the backend's authentication and Swagger exposure policy.

## Purpose

Use the running backend's Swagger/OpenAPI document as the source of truth for routes, request bodies, response schemas, and generated frontend code.

## Before you begin

- Confirm the intended `<SERVERADMIN_API_BASE_URL>` and that the backend has finished starting after a publish or restart.
- Obtain an authorized account for protected endpoints. Never place an access token, password, cookie, or private host in a public example.
- Swagger UI or the raw document may be public or may require authentication, depending on the deployment policy. A public document is not automatically safe to expose; a protected document returning `401` or `403` is an authentication boundary, not a broken schema.
- Use a test server or sanitized sample values such as `<PLAYER_ID>` and `<EXAMPLE_WEBHOOK_URL>` when trying requests.
- Ensure the frontend and backend workspaces are on the same expected revision before regenerating code.

## Procedure

1. Open **API Documentation** from the console menu. The route is the localized `swagger` entry and redirects to the backend Swagger UI or document according to the deployment configuration.
2. Check `<SERVERADMIN_API_BASE_URL>/swagger/v1/swagger.json`. Continue only when the response is HTTP 200 and contains a non-empty JSON OpenAPI document. An HTML login page, empty response, or stale cached schema is not a valid contract.
3. In Swagger UI, select an operation to read its authentication requirement, HTTP method, path, query or body fields, success response, and documented error response. Use the **Authorize** control only in a private test browser.
4. Try a read-only operation with sanitized values first. Confirm the status code and response shape before testing a mutating operation. Do not send a real webhook, command, ban, restart, or restore request from an exploratory session.
5. After a backend API change, run `pnpm api:gen` in the frontend workspace against the verified Swagger document. Review the generated types, SDK, validation, and Pinia Colada files; do not hand-edit generated files.
6. Run `pnpm typecheck` and `pnpm locale:check`, then smoke-test the affected page. Record the schema URL, generation time, and frontend commit without recording credentials.

## Verify the result

- The Swagger document is non-empty and lists the endpoint needed by the page.
- The generated API client contains the expected route and DTO fields, and the frontend type-check passes.
- A protected read-only request succeeds with the intended account, while an unauthorized request is rejected with the expected `401` or `403` boundary without leaking sensitive details. If the document is intentionally public, confirm that this exposure was approved separately.
- The published frontend sends the same request shape shown in Swagger and renders the response without a schema mismatch.

## Limits and safety notes

::: warning
Swagger reflects the backend currently running, not necessarily the source or the frontend bundle you are editing. Always wait for Swagger recovery after publishing and regenerate from that exact document.
:::

::: danger
Swagger UI can execute live operations. Treat every mutating button as production-capable, use a test server and least-privilege account, and never store authorization headers or request bodies containing secrets in screenshots or Git.
:::

## Related pages

- [Publishing](../getting-started/publishing)
- [Application settings](./application-settings)
- [Console and logs](../daily-operations/console-and-logs)
- [Troubleshooting](../reference/troubleshooting)
