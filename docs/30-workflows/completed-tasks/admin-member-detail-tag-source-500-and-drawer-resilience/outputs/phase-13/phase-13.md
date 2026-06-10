# Phase 13: PR 作成

## 目的

ユーザー承認後に PR を `dev` 宛に作成する。本 wave は `implemented_local_evidence_captured` であり、実装・local focused Vitest・shared/api/web typecheck・full lint・UI token guard は完了済み。staging runtime screenshot・commit・push・PR は user-gated として残す。本 Phase は PR 作成の多段ゲートと PR 構成を仕様として確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| taskType | implementation |
| visualEvidence | VISUAL |
| state | pending_user_approval |
| workflow_state | implemented_local_evidence_captured |
| PR base | `dev`（既定。production リリース時のみ `main`） |

## 多段ゲート（implemented_local_evidence_captured × VISUAL の段階承認）

| Gate | 内容 | 承認方法 |
| --- | --- | --- |
| G1 | spec 完了（Phase 1〜12 + Lane A / Lane B タスク仕様 + strict 7） | ユーザー明示 OK |
| G2 | 実装 + local 検証（shared/api/web typecheck・focused Vitest・`pnpm lint`・`verify:no-inline-style`）PASS | 完了済み |
| G3 | staging deploy + `/admin/members` ドロワーの error→retry→回復 / 詳細 API 200 screenshot（SC-01/02/03・管理者認証必須・user-gated） | ユーザー明示 OK |
| G4 | commit / push / PR open 承認 | ユーザー明示 OK |

各 Gate を独立に承認させる。合算承認は禁止。G3 は staging 管理者認証セッションが必要なため user-gated（Claude Code は取得しない）。

## 品質検証（PR 作成フロー・CLAUDE.md §PR作成の完全自律フロー準拠）

PR 作成直前に下記の全体 pre-flight を再実行する（commit / push / PR 承認後の user-gated）。本実装サイクルでは focused Vitest・shared/api/web typecheck・`pnpm lint`・`verify:no-inline-style` まで完了済み。

```bash
pnpm install --force
pnpm typecheck
pnpm lint
bash scripts/verify-pr-ready.sh   # verify:phase12-compliance / gate-metadata:validate / indexes:rebuild drift の一括検証
```

> 本ワークフローの正式 gate は `verify:phase12-compliance`（ok:true）+ `gate-metadata:validate`（ERROR 0）+ indexes drift（clean）の 3 点。失敗時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` を参照。

## PR 構成

| 項目 | 値 |
| --- | --- |
| Title | `fix(admin,api,shared): resolve GET /api/admin/members/:id 500 from member_tags.source value-domain mismatch + MemberDrawer retry resilience` |
| Base | `dev` |
| Head | `fix/admin-member-detail-500-and-drawer-resilience` |

### PR 本文（テンプレ）

```md
## Summary

- Lane A (packages/shared + apps/api): add a fail-soft `normalizeTagSource()` pure function that folds DB `member_tags.source` (no CHECK constraint, e.g. `'seed'`) into the 3-value `TagSource` view domain (`'rule' | 'ai' | 'manual'`), add `.catch("manual")` to `TagSourceZ` as a last-resort guard, and replace the two `as "rule" | "ai" | "manual"` casts in `builder.ts` (`:357` buildMemberProfile / `:429` buildAdminMemberDetailView) with `normalizeTagSource()`. This stops `AdminMemberDetailViewZ.safeParse(view)` from failing on seed source and returning 500.
- Lane B (apps/web UI): add a retry affordance to `MemberDrawer`. On detail fetch failure the error branch now shows a `Button` (`variant="danger"`, `data-testid="member-detail-retry"`); pressing it bumps `reloadKey` and re-fetches so the drawer can recover instead of being stuck on "読み込み失敗".

## Why

`GET /api/admin/members/:id` returns 500 for members carrying a `member_tags.source='seed'` tag (e.g. TEST-MEM-09). The DB column allows arbitrary strings (no CHECK constraint), seed injects `'seed'`, but the view-layer `TagSourceZ` is a fixed 3-value enum. `buildAdminMemberDetailView` cast the raw value through `as`, so `AdminMemberDetailViewZ.safeParse(view)` failed and the route returned 500. The list endpoint stays 200 on the same data because it never reads `source` — this asymmetry was the real issue. `buildMemberProfile` had the same cast, so member my-page detail could 500 too. Meanwhile `MemberDrawer` had no retry path (deps `[memberId]` only), so the failure was unrecoverable. This PR closes the root cause (value-domain fail-soft normalization, union not extended) and the surface (defensive retry UX) in one cycle. Endpoint surface, response shape, D1 schema, migration, seed, and Google Form are unchanged.

## Test plan

- [x] `pnpm --filter @ubm-hyogo/shared typecheck` exit 0
- [x] `pnpm --filter @ubm-hyogo/api typecheck` exit 0
- [x] `pnpm --filter @ubm-hyogo/web typecheck` exit 0
- [x] `pnpm exec vitest run packages/shared/src/zod/viewmodel.spec.ts packages/shared/src/__tests__/type-contracts.spec.ts` PASS
- [x] `pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/repository/__tests__/builder.repository.spec.ts` PASS
- [x] `pnpm exec vitest run apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` PASS
- [x] `pnpm lint` exit 0
- [x] `pnpm verify:no-inline-style` exit 0
- [x] `pnpm verify:phase12-compliance` exit 0（script 検出対象 root は `profile-reload-session-404-fix`）
- [ ] PR pre-flight full lint / `verify-pr-ready.sh` PASS（pending G4）
- [ ] staging `/admin/members` drawer: error→retry→recovered + detail API 200 screenshots captured (pending G3, admin auth-required user-gated)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> 本ワークフローは `relatedIssue=null`（staging 観察起点）のため、PR 本文に issue リンクは付けない。

## blocked 条件

- G1〜G3 のいずれかが未承認 → Phase 13 blocked
- focused Vitest または typecheck fail → Phase 8（リファクタリング）/ Phase 1（要件）へ戻る
- 本 wave は implemented_local_evidence_captured のため Phase 13 は `pending_user_approval`。commit・push・PR は本ワークフローでは実行しない

## 完了条件

- [ ] G1〜G4 すべてユーザー承認済み（user-gated）
- [ ] PR が `dev` base で open され URL が記録されている
- [ ] CI（required status checks）すべて green

## 出力

- `outputs/phase-13/phase-13.md`（本仕様）
- 実装サイクルで PR URL を `outputs/phase-13/pr.md` 等に記録予定

## 参照資料

- `outputs/phase-5/task-01..02-*.md`（Lane A / Lane B 実装仕様書本体）
- `outputs/phase-12/implementation-guide.md`（PR 本文の根拠）
- `CLAUDE.md` §「PR作成の完全自律フロー」
