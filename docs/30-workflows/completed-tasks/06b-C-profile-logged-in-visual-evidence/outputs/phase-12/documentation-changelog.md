# Documentation Changelog

## Changed

| Path | Change |
| --- | --- |
| `index.md` | Corrected executable spec path to the actual Playwright layout. |
| `artifacts.json` | Corrected code change paths and DOM evidence naming. |
| `phase-01.md` to `phase-13.md` | Aligned references from stale `apps/web/tests/e2e` paths to `apps/web/playwright`. |
| `outputs/phase-11/main.md` | Runtime evidence remains pending; evidence directories are now present. |
| `outputs/phase-12/*` | Added strict Phase 12 deliverables. |

## Handoff

09a / 08b can consume the new capture command after a real logged-in storageState is created:

```bash
scripts/capture-profile-evidence.sh --base-url <origin> --storage-state apps/web/playwright/.auth/state.json
```
