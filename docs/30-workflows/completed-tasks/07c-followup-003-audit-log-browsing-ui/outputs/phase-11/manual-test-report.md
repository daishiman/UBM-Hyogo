# Phase 11 Manual Test Report

Screenshots:

- `screenshots/audit-initial.png`
- `screenshots/audit-action-filter.png`
- `screenshots/audit-json-collapsed.png`
- `screenshots/audit-json-expanded-masked.png`
- `screenshots/audit-empty.png`
- `screenshots/audit-forbidden.png`
- `screenshots/audit-mobile.png`

PII check:

- Raw sample email, phone, and full name are not shown in expanded JSON evidence.
- Actor email is represented as masked text in the visual evidence.
- API tests additionally assert raw JSON fields are absent from the response.

A11y / layout check:

- Main heading is present.
- Filter group has a clear label.
- Table headers are present.
- Mobile viewport avoids overlapping controls; the table scrolls horizontally.
