# task-spec-2d-contract-stage-2

> 2a/2b/2c の Playwright spec が `page.route()` で返す UI fixture object と、`apps/api` 側 route の zod schema が同型であることを CI で機械検証する Vitest contract test を新規追加するワークフロー仕様書。

---

## メタ情報

| 項目 | 値 |
|------|-----|
| workflow id | task-spec-2d-contract-stage-2 |
| 起点日 | 2026-05-11 |
| classification | NON_VISUAL / contract / type-level + zod parse |
| coverageTier | standard（contract test 単体は coverage 加点対象外、green の有無のみ判定） |
| coverageException | zod parse / type-level contract test のため line coverage 加点対象外。Phase 7/11 では green/fail、skip 0、grep gate を正本 evidence とする |
| implementation_mode | new |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| evidence_state | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| implementation_status | local_passed_runtime_ci_pending |
| 実装区分 | 実装仕様書（CONST_004 適用） |
| 想定行数 | 新規 spec 200-260 行 + route 3 ファイル各 +1 行 |
| 依存 | なし（2a/2b/2c とは並列、import 依存なし） |
| 正本ソース | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2d-contract-stage-2.md` |

---

## 背景

- 2a/2b/2c の Playwright spec は `page.route()` で UI 用 fixture object を返す。これと `apps/api` 側 route が parse する zod schema が drift すると、mock では通るのに本番 API が 422/400 を返す事故が発生し、E2E green が production 信頼性を担保しなくなる。
- 既存の per-route `contract.spec.ts`（audit-correlation 等）は単一 route の round-trip 検証であり、Stage 2 の 4 sub-task 横断の fixture 整合は担保していない。本 task はその横断 drift を CI で機械検知する補完層を追加する。
- 2a/2b/2c の fixture と本 contract test の `parse()` が必ず同型になることで、4 並列開発の drift は 2d が最初に失敗する設計とする。

---

## 受け入れ基準

| # | 条件 |
|---|------|
| 1 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` が新規作成され、200-260 行に収まる |
| 2 | 7 describe ブロックすべて green、`test.skip` / `it.skip` / `describe.skip` が 0 件 |
| 3 | 2d test 内に `z.object(` が 0 件（route / shared から import のみ） |
| 4 | `DeleteBodyZ` / `ListRequestsQueryZ` / `ListAuditQueryZ` が named export として参照可能 |
| 5 | `MergeIdentityResponseZ` の `archivedSourceMemberId` を含む shape を fixture が満たす |
| 6 | `pnpm --filter @ubm-hyogo/api typecheck` / `pnpm lint` が exit 0 |

---

## 不変条件

| # | 不変条件 |
|---|---------|
| 1 | 既存 API endpoint surface のみ参照（新 endpoint 追加禁止） |
| 2 | D1 schema 変更禁止 |
| 3 | Google Form 仕様変更禁止 |
| 4 | `apps/web` から D1 直接アクセス禁止（本 spec は `apps/api` 内完結） |
| 5 | スキーマ重複定義禁止（CONST_007: 2d test 内で `z.object(` を使わない） |
| 6 | `DeleteBodyZ` の `packages/shared` 昇格は別 PR の責務（本 PR では route からの named export のみ） |
| 7 | `test.skip` / `it.skip` / `describe.skip` を使わない |
| 8 | 単一サイクル完了（CONST_007） |

---

## API endpoint inventory（7 endpoint）

| # | method | path | schema source |
|---|--------|------|--------------|
| 1 | GET | `/admin/requests` | `ListRequestsQueryZ`（route 経由 named export） |
| 2 | POST | `/admin/requests/:noteId/resolve` | `adminRequestResolveBodySchema`（shared） |
| 3 | GET | `/admin/identity-conflicts` | `IdentityConflictRowZ` / `ListIdentityConflictsResponseZ`（shared） |
| 4 | POST | `/admin/identity-conflicts/:id/merge` | `MergeIdentityRequestZ` / `MergeIdentityResponseZ`（shared） |
| 5 | POST | `/admin/identity-conflicts/:id/dismiss` | `DismissIdentityConflictRequestZ` / `DismissIdentityConflictResponseZ`（shared） |
| 6 | POST | `/admin/members/:memberId/delete` | `DeleteBodyZ`（route 経由 named export） |
| 7 | GET | `/admin/audit` | `ListAuditQueryZ`（route 経由 named export） |

---

## Phase 1-13 ステータス表

| Phase | 名称 | ファイル | ステータス |
|-------|------|---------|----------|
| 1 | 要件定義 | `phase-1.md` | completed |
| 2 | 設計 | `phase-2.md` | completed |
| 3 | 設計レビュー（4-condition gate） | `phase-3.md` | completed |
| 4 | テスト作成（TDD Red） | `phase-4.md` | completed |
| 5 | 実装（TDD Green） | `phase-5.md` | completed |
| 6 | テスト拡充 | `phase-6.md` | completed |
| 7 | カバレッジ確認 | `phase-7.md` | completed |
| 8 | リファクタリング | `phase-8.md` | completed |
| 9 | 品質保証 | `phase-9.md` | completed |
| 10 | 最終レビュー | `phase-10.md` | completed |
| 11 | 手動テスト（NON_VISUAL evidence） | `phase-11.md` | local_passed |
| 12 | ドキュメント更新 | `phase-12.md` | completed |
| 13 | PR 作成 | `phase-13.md` | pending_user_approval |

---

## artifacts / evidence 正本

| path | 役割 |
|------|------|
| `artifacts.json` | root workflow state 正本。`taskType=implementation` / `visualEvidence=NON_VISUAL` / `workflow_state=spec_created` を固定 |
| `outputs/artifacts.json` | Phase evidence mirror。`cmp -s artifacts.json outputs/artifacts.json` で同値維持 |
| `outputs/phase-11/` | NON_VISUAL runtime evidence。`.txt` / `.md` を canonical とし、ignored `.log` 単独を PASS 根拠にしない |
| `outputs/phase-12/` | strict 7 outputs。1 件でも欠落したら Phase 12 compliance は FAIL |
| `outputs/phase-13/` | user approval 前の PR 準備 evidence。PR 作成自体はユーザー明示承認後のみ |

## aiworkflow-requirements 同期対象

Phase 12 same-wave sync では `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`、`indexes/quick-reference.md`、`references/task-workflow-active.md`、`LOGS/_legacy.md`、必要な artifact inventory を確認し、`task-spec-2d-contract-stage-2` の current canonical set を登録する。

## 関連ドキュメント

- 正本: `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2d-contract-stage-2.md`
- 並列 sub-task: `2a-admin-requests.md` / `2b-admin-identity-conflicts.md` / `2c-admin-member-delete.md`（同ディレクトリ）
- 参考（completed）: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/`
- 既存 contract 参照: `apps/api/src/audit-correlation/__tests__/contract.test.ts`
- shared schema: `packages/shared/src/schemas/identity-conflict.ts`
