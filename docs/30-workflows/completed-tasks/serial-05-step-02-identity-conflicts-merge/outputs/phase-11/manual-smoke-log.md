# Phase 11 smoke log

| Command | Expected | Actual | Verdict |
| --- | --- | --- | --- |
| `ESBUILD_BINARY_PATH=$(pwd)/node_modules/@esbuild/darwin-arm64/bin/esbuild pnpm exec vitest run apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | focused spec green | 9 / 9 passed | completed_local_evidence_captured |
| `pnpm exec playwright install chromium` | local Chromium available | installed chromium / ffmpeg / headless shell | completed_local_evidence_captured |
| inline Playwright screenshot capture script | 4 PNG files saved | `02`, `04`, `05`, `06` PNG files saved | completed_local_evidence_captured |

Full `pnpm e2e:smoke` is not used as the canonical gate for this focused row hardening; the existing admin identity-conflicts Playwright fixture path is the relevant visual capture route.
