# Phase 9: 品質保証

**[実装区分: 実装仕様書]**

Issue #987（dismiss を audit_log に記録する根本解決）の品質ゲート一括判定仕様。本タスクは `apps/api` のみの変更（repository + route）で、UI / Tailwind / D1 直アクセス（apps/web）/ legacy hook は該当しない。各項目について「対象 / コマンド / 期待結果」を定義し、本サイクルで focused D1 lane を実走する。

---

## 1. 一括判定項目

| # | 項目 | 対象 | コマンド | 期待結果 | 本タスク該当 |
| --- | --- | --- | --- | --- | --- |
| 1 | 型チェック | monorepo 全体 | `mise exec -- pnpm typecheck` | green（`identity.dismiss` の `AuditAction` union 整合・`actorAdminEmail` 引数追加の型一致を含む） | ✅ |
| 2 | Lint | monorepo 全体 | `mise exec -- pnpm lint` | green | ✅ |
| 3 | Tailwind 直書き 0 | `apps/web` | （UI 変更なしのため対象 diff なし） | N/A — API のみ変更で該当なし | ❌ N/A |
| 4 | D1 直接アクセス（apps/web）0 | `apps/web` | `git diff --name-only` で `apps/web` 配下に変更がないことを確認 | apps/web 配下の変更ファイル 0 件。D1 binding は `apps/api` に閉じる（CLAUDE.md #5） | ❌ N/A（API 限定） |
| 5 | legacy `@/lib/useAdminMutation` 未参照 | `apps/web` | （UI 変更なし） | N/A — フロント mutation 追加なし | ❌ N/A |
| 6 | test suffix | `apps/api` | `git ls-files 'apps/api/**/*.test.ts'` が空 / 追加テストは `*.contract.spec.ts` | `*.test.ts` 不在（CLAUDE.md #8）。新規テストは `identity-conflicts.contract.spec.ts` / `audit.contract.spec.ts`（`*.contract.spec.ts` 準拠） | ✅ |

> 項目 3 / 5 は `apps/web` 配下の変更が存在しないことを前提に N/A 判定する。判定の検証として「`git diff dev...HEAD --name-only` に `apps/web/` で始まるパスが含まれない」ことを Phase 10 の blocker チェックで再確認する。

---

## 2. テスト実走（contract spec）

| 対象 spec | コマンド | 検証内容 |
| --- | --- | --- |
| `apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts` | `pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts` | dismiss 実行後に `audit_log` に `action='identity.dismiss'` 行が 1 件作成される / `target_id=target` / `actor_email` が配線値 / audit payload に reason 生 PII が出ない |
| `apps/api/src/routes/admin/identity-conflicts.contract.spec.ts` | `pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/routes/admin/identity-conflicts.contract.spec.ts` | dismiss endpoint 実行後に `audit_log` に `action='identity.dismiss'` 行が 1 件作成される / `target_id=target` / `actor_email` が配線値 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | `pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/routes/admin/audit.contract.spec.ts` | `action=identity.dismiss` フィルタで dismiss 行が返る / `targetId` フィルタで絞り込める |
| merge 回帰 | `mise exec -- pnpm --filter @ubm-hyogo/api test src/repository/identity-merge` | 既存 merge contract が green（`identity.merge` 記録に影響なし） |

---

## 3. 既存 endpoint surface 不変の確認方針

| 確認軸 | 方法 | 期待 |
| --- | --- | --- |
| dismiss route の path | `apps/api/src/routes/admin/identity-conflicts.ts` の route 定義を diff 確認 | `POST /admin/identity-conflicts/:id/dismiss` のまま不変 |
| dismiss の戻り値 shape | contract spec の response assertion | `{ dismissedAt: string }` のまま不変（audit 記録は内部処理で response に出さない） |
| status code | contract spec | 成功時 / 既存エラー（404 / 409 等）が従来通り |
| 新規 endpoint 追加なし | route ファイルの export 一覧 diff | 追加 export 0 件 |
| D1 schema 変更なし | `apps/api/migrations/` の diff | 新規 migration ファイル 0 件（`audit_log` は既存 `0003_auth_support.sql`） |

UI 期待 shape と既存 API surface の乖離は発生しない（response 外形不変・UI 側 adapter 不要）。

---

## 4. DoD

- [x] `pnpm --filter @ubm-hyogo/api typecheck` green
- [x] `pnpm lint` green（stablekey-literal warning 2 件は既存 apps/web profile literal warning。本タスク差分外。exit code 0）
- [x] 項目 3 / 4 / 5 が API 限定変更により N/A であることを diff で確認（`apps/web` 配下変更 0 件）
- [x] 新規テストが `*.contract.spec.ts` / `*.repository.spec.ts` 準拠で `*.test.ts` 不在
- [x] dismiss / audit / merge の focused spec が green（D1 focused spec 3 files / 28 tests PASS）
- [x] dismiss endpoint surface（path / 成功戻り値）不変・存在しない member は 404 `MEMBER_NOT_FOUND`・新規 migration 0 件

---

## 5. 参照

- 前段: `outputs/phase-4/phase-4.md`（contract spec 設計）、`outputs/phase-8/phase-8.md`（リファクタリング）
- 後段: `outputs/phase-10/phase-10.md`（最終レビュー / acceptance criteria）、`outputs/phase-11/phase-11.md`（NON_VISUAL 手動確認）
