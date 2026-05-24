# parent EV-12 cross-reference

Status: present
Captured: 2026-05-23

## Parent evidence

| Item | Path | Status |
| --- | --- | --- |
| EV-12 admin DOM scrape | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt` | present |
| Parent inventory | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-11-evidence-inventory.md` | EV-12 present |

## Contract hits

The generated scrape contains:

| Attribute | Expected |
| --- | --- |
| `data-theme` | `cool` |
| `data-route-group` | `admin` |
| `data-testid` | `admin-shell` |
| `data-shell` | `sidebar`, `topbar` |
| `data-route` | `admin` |

## Command

```bash
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-followup-002-admin-runtime-evidence/outputs/phase-11 pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/parallel-03-admin-shell-scrape.spec.ts --project=desktop-chromium --reporter=line
```
