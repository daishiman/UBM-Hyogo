# Screenshot Coverage

Status: `present`

Command:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3100 PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_EVIDENCE_TASK=admin-meetings-prototype-alignment mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-meetings-prototype-alignment.spec.ts --project=desktop-chromium
```

Result: 2 tests passed on 2026-05-27.

| Route | State | Screenshot |
| --- | --- | --- |
| `/admin/meetings` | default | `outputs/phase-11/screenshots/list-default.png` |
| `/admin/meetings` | empty | `outputs/phase-11/screenshots/list-empty.png` |
| `/admin/meetings` | drawer open | `outputs/phase-11/screenshots/list-drawer-open.png` |
| `/admin/meetings/[id]` | default | `outputs/phase-11/screenshots/detail-default.png` |
| `/admin/meetings/[id]` | CSV preview | `outputs/phase-11/screenshots/detail-csv-preview.png` |

Staging runtime observation remains user-gated and is separated in `manual-evidence-deferred.md`.
