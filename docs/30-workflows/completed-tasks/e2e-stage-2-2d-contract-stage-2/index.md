# e2e-stage-2-2d-contract-stage-2 — タスク仕様書（Phase 1-13）

> **[実装区分: 実装仕様書]**
>
> 元タスク: [`docs/30-workflows/unassigned-task/e2e-stage-2-2d-contract-stage-2-001.md`](../unassigned-task/e2e-stage-2-2d-contract-stage-2-001.md)
> 親 sub-task 仕様: [`docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2d-contract-stage-2.md`](../e2e-quality-uplift-stage-2-sub-tasks/2d-contract-stage-2.md)
> 親 umbrella Issue: #607（e2e-quality-uplift-stage-2）
> 判断根拠（CONST_004）: 後続成果物は実コードファイル `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`（新規）と route 3 ファイルの named export 微修正。コード差分を伴う実装仕様書として作成する。

## メタ情報

| key | value |
|-----|-------|
| workflow ID | `e2e-stage-2-2d-contract-stage-2` |
| 親 workflow | `e2e-quality-uplift-stage-2`（sub-task 2d） |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL`（contract / type-level + zod parse） |
| coverageTier | `standard`（contract test 単体は coverage 加点対象外、green の有無のみ判定） |
| implementation_mode | `new` |
| workflow_state | `implemented_local_evidence_captured` |
| implementation_status | `implementation_complete_pending_pr` |
| evidence_state | `PASS_LOCAL_CANONICAL` |
| 主要対象ファイル | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`（新規・251 行） |
| 付随修正 | `apps/api/src/routes/admin/{member-delete,requests,audit}.ts`（route schema / response contract named export 化）、`apps/web/src/lib/admin/server-fetch.ts` + `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`（identity conflict fixture id を API 実形式へ補正） |
| 起点日 | 2026-05-10 |
| 実測行数 | 251 行（test 本体） |

## スコープ

2a/2b/2c の Playwright spec が `page.route()` で返す **UI fixture object** と、`apps/api` 側の **route 実装が parse する zod schema** が同型であることを CI で機械検証する pure unit test を 1 ファイル新規作成する。drift があれば mock が通る環境で本番 API が 422/400 を返す事故が発生し、E2E green が production 信頼性を担保しなくなるため、本 contract test を CI gate として配置する。

7 endpoint × （query / request body / response shape）について、UI fixture object（または同形の inline literal）を `schema.parse()` に通し、`expect(() => ...).not.toThrow()` / `expect(parsed).toMatchObject(...)` で同型性を断言する。

## Phase 1-13 構成

| Phase | ファイル | 役割 |
|-------|---------|------|
| 1 | [phase-1.md](phase-1.md) | 要件定義（前提・対象・受け入れ基準） |
| 2 | [phase-2.md](phase-2.md) | 設計（test 構造・schema 解決戦略・fixture 形） |
| 3 | [phase-3.md](phase-3.md) | 設計レビュー（4-condition gate） |
| 4 | [phase-4.md](phase-4.md) | テスト作成（TDD Red） |
| 5 | [phase-5.md](phase-5.md) | 実装（TDD Green・差分概要） |
| 6 | [phase-6.md](phase-6.md) | リファクタリング |
| 7 | [phase-7.md](phase-7.md) | 結合テスト・全体回帰 |
| 8 | [phase-8.md](phase-8.md) | コードレビュー |
| 9 | [phase-9.md](phase-9.md) | ドキュメント整備 |
| 10 | [phase-10.md](phase-10.md) | デプロイ準備 |
| 11 | [phase-11.md](phase-11.md) | 実行・evidence 取得 |
| 12 | [phase-12.md](phase-12.md) | 振り返り・正本仕様 sync |
| 13 | [phase-13.md](phase-13.md) | PR 作成 |

## 不変条件（全 Phase 共通）

1. 既存 API endpoint surface のみ参照。新 endpoint・D1 schema 変更・Google Form 仕様変更禁止
2. `apps/api` から D1 / network / FS / Cloudflare binding に一切触れない pure unit test
3. `apps/web` を import しない（CLAUDE.md 重要不変条件 5 を `apps/api` 側 test でも遵守）
4. 2d test 内に `z.object(` を新規定義しない（CONST_007 schema 重複禁止）。route または `@ubm-hyogo/shared` から import のみ
5. `MergeIdentityResponseZ` は `packages/shared/src/schemas/identity-conflict.ts` を **正本** とし、`{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` shape を fixture が満たす
6. `DeleteBodyZ` の `packages/shared` 昇格は今回目的に不要。route からの named export のみ
7. `test.skip` / `it.skip` / `describe.skip` は **0 件**（2c 側の cascade preview skip とは独立）
8. identity conflict の `conflictId` fixture は API 実装 `parseConflictId()` が受け付ける `source__target` 形式に固定する

## 参照

- 親 Stage 2: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/`
- 不変条件正本: `CLAUDE.md` 「重要な不変条件」「UI prototype alignment / MVP recovery」
- 共有 schema: `packages/shared/src/schemas/identity-conflict.ts`
- 既存 contract test 命名・構造参照: `apps/api/src/audit-correlation/__tests__/contract.test.ts`
