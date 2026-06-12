# Phase 11: 手動テスト（視覚確認・VISUAL）

## メタ情報

- task_id: `responsive-mobile-tablet-ui-fixes`
- visualEvidence: `VISUAL`
- workflow_state: `implemented_local_visual_present_staging_pending`
- evidence_status: `local_visual_png_present_staging_baseline_pending_user_approval`

## 目的

`apps/web` 表現層のレスポンシブ是正が、mobile/tablet の代表 viewport で横スクロール・はみ出しを発生させないことを確認する。
local 物理 PNG baseline は取得済み。authenticated admin staging baseline は user-gated のため Gate-C 側に残す。

## 実行済み evidence

| Evidence | Status | Result |
| --- | --- | --- |
| focused Vitest | PASS | `SidebarDrawer.spec.tsx` 5 tests passed |
| token gate | PASS | `tokens.runtime.spec.ts` 9 tests passed |
| typecheck / lint | PASS | `@ubm-hyogo/web typecheck` / `@ubm-hyogo/web lint` exit 0 |
| apps/api diff | PASS | `git diff --name-only -- apps/api` empty |
| local runtime smoke | PASS | `outputs/phase-11/runtime-smoke-result.json` |
| local physical PNG | PASS | `outputs/phase-11/screenshots/*.png` 5 files + `screenshot-coverage.md` |

## Runtime Smoke Matrix

| Route | Viewport | Result |
| --- | --- | --- |
| `/` | 390x844 | `scrollWidth=390`, `clientWidth=390`, overflow false |
| `/login` | 375x812 | `scrollWidth=375`, `clientWidth=375`, overflow false |
| `/admin` unauthenticated redirect | 390x844 | redirected `/login`, overflow false |
| `/admin/schema` unauthenticated redirect | 768x1024 | redirected `/login`, overflow false |

## Pending User-Gated Evidence

| Evidence | Reason |
| --- | --- |
| authenticated admin staging screenshots | requires authenticated staging session / user approval |
| commit / push / PR | Phase 13 user approval required |

## 成果物

| Path | Status |
| --- | --- |
| `outputs/phase-11/manual-test-result.md` | present |
| `outputs/phase-11/runtime-smoke-result.json` | present |
| `outputs/phase-11/screenshot-inventory.json` | present |
| `outputs/phase-11/screenshot-coverage.md` | present |
| `outputs/phase-11/screenshots/screenshot-plan.json` | present |
| `outputs/phase-11/screenshots/phase11-capture-metadata.json` | present |
| `outputs/phase-11/screenshots/*.png` | present |

## 完了条件

Local implementation evidence is captured and Gate-B is passed. Authenticated staging visual baseline remains pending user approval under Gate-C.
