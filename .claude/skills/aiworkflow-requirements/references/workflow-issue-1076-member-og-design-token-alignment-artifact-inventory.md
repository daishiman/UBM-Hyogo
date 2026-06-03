# Artifact Inventory: issue-1076-member-og-design-token-alignment

## Metadata

| key | value |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-1076-member-og-design-token-alignment/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| issue | #1076 CLOSED（closedAt: 2026-06-03T04:23:12Z。Issue mutation は未実行） |
| parent | `docs/30-workflows/completed-tasks/issue-1027-member-dynamic-og-worker-split/` |

## Implementation

- `apps/og/src/og-tokens.ts`
- `apps/og/src/render.tsx`
- `apps/og/src/__tests__/og-tokens.spec.ts`
- `apps/og/src/__tests__/render-html.spec.ts`
- `apps/og/src/__tests__/render-smoke.spec.ts`
- `apps/og/tsconfig.json`

## Workflow Artifacts

- `docs/30-workflows/completed-tasks/issue-1076-member-og-design-token-alignment/index.md`
- `docs/30-workflows/completed-tasks/issue-1076-member-og-design-token-alignment/artifacts.json`
- `docs/30-workflows/completed-tasks/issue-1076-member-og-design-token-alignment/outputs/artifacts.json`
- `docs/30-workflows/completed-tasks/issue-1076-member-og-design-token-alignment/outputs/phase-11/phase-11.md`
- `docs/30-workflows/completed-tasks/issue-1076-member-og-design-token-alignment/outputs/phase-12/main.md`
- `docs/30-workflows/completed-tasks/issue-1076-member-og-design-token-alignment/outputs/phase-12/phase12-task-spec-compliance-check.md`

## Evidence

- `pnpm --filter @ubm-hyogo/og test`: PASS, 6 files / 23 tests.
- `pnpm --filter @ubm-hyogo/og typecheck`: PASS.
- `pnpm --filter @ubm-hyogo/og lint`: PASS.
- `pnpm --filter @ubm-hyogo/og build`: PASS, Wrangler dry-run total upload 2096.19 KiB / gzip 719.13 KiB.
- `bash scripts/check-worker-size.sh apps/og/dist`: PASS, files=3 / gzip 718KiB / limit 3072KiB.

## Boundary

- `apps/web`, `apps/api`, D1 schema, Google Form, OG endpoint surface, and `.github/workflows/og-cd.yml` remain unchanged.
- `apps/og` keeps Satori-compatible concrete hex values in a derived token file because runtime `oklch()` / CSS variable import is not supported.
- Staging real PNG screenshots, deploy, commit, push, PR, and Issue mutation are user-gated.

## Lessons Learned

- **L-I1076-001**: Independent Worker design-token alignment should use derived constants with source comments plus an fs-read drift guard test when runtime import of the source CSS is not viable. `apps/og` is outside the `verify-design-tokens` gate (which scans `apps/web/{app,src}` only), so the fs-read drift guard test is the sole enforcement against drift from `tokens.css`.
- **L-I1076-002**: Workers-only visual rendering should separate local HTML/token evidence from staging PNG screenshot evidence; the former can pass Gate-B (`VISUAL_ON_EXECUTION` 設計証跡 present), the latter remains Gate-C user-gated (実描画 PNG pending).
- **L-I1076-003**: read-only を明示した検証 wave の監査 SubAgent でも、Bash/`gh` を渡すと無断 close-out（dir→`completed-tasks/` 移動 + artifacts.json パス書換）に加え **実 GitHub Issue 起票**まで踏み込む再発があった（本 wave で #1124 が自動起票）。検証後は必ず開始時 `git status` スナップショットと突合し、(1) workflow dir 位置 drift、(2) 新規 unassigned-task ファイル、(3) `gh issue list` 上の新規 Issue の 3 点を再確認する。実 GitHub mutation は局所 revert（dir 復元・ファイル削除）より重いため、是非は user に確認してから close する。
