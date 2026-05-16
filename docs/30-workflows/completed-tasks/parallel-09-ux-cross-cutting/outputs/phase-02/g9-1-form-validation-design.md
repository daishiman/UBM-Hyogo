# G9-1 Form Validation Design

`FormField` は `name` / `label` / `error?` / single `children` を受け、`id`、`aria-invalid`、`aria-describedby`、`role="alert"` を一貫して注入する。CSS は `data-component="form-field"` と `data-component="form-error"` を使い、色は `var(--ubm-color-danger)` 系のみ参照する。

Acceptance: AC-1 spec_created.

