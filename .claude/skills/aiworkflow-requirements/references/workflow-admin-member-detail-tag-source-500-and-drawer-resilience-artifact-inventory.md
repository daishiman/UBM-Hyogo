# Artifact Inventory: admin-member-detail-tag-source-500-and-drawer-resilience

| Item | Value |
| --- | --- |
| canonical root | `docs/30-workflows/completed-tasks/admin-member-detail-tag-source-500-and-drawer-resilience/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / staging_visual_pending_user_gate` |
| purpose | Admin member detail 500 caused by `member_tags.source='seed'` and unrecoverable drawer error state are fixed in one local cycle. |

## Implementation Targets

| Area | Files |
| --- | --- |
| shared contract | `packages/shared/src/types/common.ts`, `packages/shared/src/zod/primitives.ts` |
| API view builder | `apps/api/src/repository/_shared/builder.ts` |
| admin UI | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` |
| tests | `packages/shared/src/zod/viewmodel.spec.ts`, `packages/shared/src/__tests__/type-contracts.spec.ts`, `apps/api/src/repository/__tests__/builder.repository.spec.ts`, `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` |

## Workflow Artifacts

| Path | Role |
| --- | --- |
| `docs/30-workflows/completed-tasks/admin-member-detail-tag-source-500-and-drawer-resilience/index.md` | workflow root summary / AC / dependency boundary |
| `docs/30-workflows/completed-tasks/admin-member-detail-tag-source-500-and-drawer-resilience/artifacts.json` | root machine-readable ledger |
| `docs/30-workflows/completed-tasks/admin-member-detail-tag-source-500-and-drawer-resilience/outputs/artifacts.json` | output mirror ledger |
| `docs/30-workflows/completed-tasks/admin-member-detail-tag-source-500-and-drawer-resilience/outputs/phase-11/manual-test-result.md` | local focused evidence |
| `docs/30-workflows/completed-tasks/admin-member-detail-tag-source-500-and-drawer-resilience/outputs/phase-12/implementation-guide.md` | Phase 12 implementation guide |
| `docs/30-workflows/completed-tasks/admin-member-detail-tag-source-500-and-drawer-resilience/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 strict compliance check |

## Evidence

- focused shared Vitest: 2 files / 29 tests PASS.
- focused API D1 Vitest: 1 file / 35 tests PASS.
- focused web Vitest: 1 file / 5 tests PASS.
- `pnpm --filter @ubm-hyogo/{shared,api,web} typecheck` PASS.
- `pnpm verify:no-inline-style` PASS.

## Invariants

- `TagSource` union remains `"rule" | "ai" | "manual"`.
- `member_tags.source` D1 schema, migrations, seed data, endpoint surface, response shape, and Google Form contract are unchanged.
- Unknown DB source values are normalized at view-building/zod boundary to `manual`.
- Staging authenticated screenshots, deploy, commit, push, and PR remain user-gated.

## Lessons Learned

| ID | 要約 |
| --- | --- |
| L-ADMTAGSRC-001 | 値ドメイン不一致由来の 500 は「一覧は fail-soft / 詳細は strict parse」という**非対称**が真の論点。詳細側の view parse 境界で一覧と同じ耐性へ揃えるのが正攻法で、DB 値の書き換えではない |
| L-ADMTAGSRC-002 | CHECK 制約なしの任意文字列カラム（`member_tags.source`）は view 層 enum と必ず乖離しうる。純関数 `normalizeTagSource` で既知値は恒等・未知/空/null/undefined→`manual` に**表示直前正規化**し、元データ（DB / seed）は不変に保つ |
| L-ADMTAGSRC-003 | `z.enum(...).catch("manual")` を最終防壁として併設すると union 型を不変のまま parse 失敗を握れる（純関数 + zod の二重防御）。`.catch` は出力型を変えないため `TagSource` union 拡張に当たらない |
| L-ADMTAGSRC-004 | fetch-on-open ドロワーは失敗時に `setError` 文言だけだと行き止まり。`reloadKey` state を `useEffect` 依存へ追加し同一 `memberId` で再 fetch する回復導線（再試行ボタン）を必ず持たせる |
| L-ADMTAGSRC-005 | 根本（値ドメイン正規化 / Lane A）と表示（防御的 UX retry / Lane B）を同一サイクルで閉じることで、500 の再発と失敗からの非回復を一括解消する |
| L-ADMTAGSRC-006 | AC-6/AC-7 を堅持し D1 schema / migration / seed / endpoint surface / response shape / Google Form / `TagSource` union を不変に保ったまま、値是正をコード層 fail-soft に閉じる |
| L-ADMTAGSRC-007 | VISUAL かつ `implemented_local_evidence_captured` 段階は jsdom render（`MemberDrawer.spec.tsx`）を一次証跡、staging 認証 screenshot を user-gated 二次証跡として PNG 0 件（`staging_visual_pending_user_gate`）を許容する |

正本: 本 inventory に埋込（専用 lessons-learned ファイルなし）。同期記録は `.claude/skills/aiworkflow-requirements/changelog/20260609-admin-member-detail-tag-source-500-and-drawer-resilience.md` を参照。

