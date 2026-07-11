# User Manual Page Template

Use this outline for every paired operational page. Chinese and English pages must be localized independently, but must keep this information order, workflow coverage, cautions, and verification criteria aligned.

```markdown
---
outline: deep
---

# <Localized page title>

> <Availability, required role, and prerequisite summary.>

## Purpose

## Before you begin

## Procedure

1. <First ordered action and the expected state.>
2. <Next ordered action and the expected state.>

## Verify the result

- Name an observable success signal, such as a saved status, history entry, response, or visible state change.

## Limits and safety notes

::: warning
State permission, destructive-action, privacy, or feature-availability constraints here.
:::

## Related pages
```

## Authoring requirements

- Keep the frontmatter `outline: deep` and retain the same section order in both locales.
- State the required role, prerequisites, feature availability, and backend or server dependency in the opening summary and in `Before you begin` when it affects the procedure.
- Use an ordered list in `Procedure`. Each step should name the control, input, or command and the expected result.
- Make `Verify the result` observable. Refer to a status, history record, audit entry, response field, or other signal an operator can inspect.
- Use VitePress `warning`, `danger`, or `tip` containers for permission boundaries, destructive actions, privacy handling, and disabled or unavailable features.
- Keep commands, configuration keys, API fields, and code blocks identical between Chinese and English pages. Localize explanatory text, cautions, and captions.
- Use sanitized placeholders such as `<SERVERADMIN_API_BASE_URL>`, `<7DTD_SERVER_ROOT>`, `<PLAYER_ID>`, and `<REDACTED_TOKEN>`; never publish a real host, path, identifier, password, token, or Discord secret.
