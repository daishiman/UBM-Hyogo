# Phase 9 — 品質保証（QA）

## 目的

実装完了時に満たすべき品質ゲートと PASS 基準を確定する。型・lint・色トークン・focused vitest・seed 生成 contract・**API 不変の機械確認**を一括で定義し、合否を機械判定可能にする。本タスクは追加（新規 seed・新規 component）であり、新規ファイル削除確認は不要。

## 成果物

- QA チェック項目表（コマンド・PASS 基準）。
- API 不変の機械確認手順。
- 色トークン grep 確認手順。

## QA チェック項目

| # | チェック | コマンド | PASS 基準 |
| --- | --- | --- | --- |
| Q1 | 型 | `mise exec -- pnpm typecheck` | exit 0 |
| Q2 | lint | `mise exec -- pnpm lint` | exit 0（`--fix` 後の残違反 0） |
| Q3 | 色トークン gate | `mise exec -- pnpm verify:tokens` | HEX / 任意色直書き 0 件・PASS |
| Q4 | focused vitest（5 spec） | [shared-context §8](./shared-context.md) の vitest コマンド | 5 spec すべて PASS |
| Q5 | seed 生成（gen 実行） | `node scripts/gen-identity-conflict-seed.mjs` | 生成成功・出力 SQL 2 本（staging-seed / cleanup）が更新 |
| Q6 | seed contract | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts` | drift 0 / idempotent / 行数 PASS |
| Q7 | **API 不変（機械確認）** | `git diff --name-only -- apps/api/src/routes apps/api/src/repository apps/api/src/services packages/shared` | **出力が空**（concern 4 の `apps/api/src/testing` と `apps/api/migrations/seed` は別 path のため対象外。これらが差分に出るのは正常） |
| Q8 | 色トークン（対象ファイル grep） | 下記 grep | 新規 HEX / `bg-[` / `text-[` 0 件 |

### Q7 補足（API 不変の機械確認）

- 監視対象 4 path（`routes` / `repository` / `services` / `packages/shared`）は AC-8 の不変境界。
- concern 4 の seed 実装は `apps/api/src/testing/identity-conflicts/` と `apps/api/migrations/seed/` に置くため、上記 4 path には**含まれない**。よって Q7 の差分は空であるべき。
- 万一 4 path に差分が出た場合は AC-8 違反として FAIL（adapter 層に戻す）。

### Q8 補足（色トークン grep）

```bash
grep -nE '#[0-9a-fA-F]{3,6}|bg-\[|text-\[' \
  apps/web/src/components/admin/IdentityConflictGuide.tsx \
  apps/web/src/components/admin/IdentityConflictRow.tsx
```

- 期待: **新規 HEX / 任意色クラス 0 件**（match なし＝exit 1 / 空出力が PASS）。
- 既存行に残る token クラス（`var(--ubm-color-*)` 経由）は対象外。新規追加分が HEX を含まないことを保証する。
- glossary（`identityConflictGlossary.ts`）は文字列データのみで色を持たないため grep 対象外。

## 不要な確認（追加タスクのため）

- **新規ファイル削除確認は不要**: 本タスクは component / seed の**追加**であり、ファイル削除を伴わない。削除漏れ検査（孤児参照など）は対象外。

## 自動修復方針（FAIL 時・最大 3 回）

- Q1 typecheck FAIL: unused import / 型注釈漏れ / export-import 不整合を最小差分修正。
- Q2 lint FAIL: `pnpm lint --fix` → 残違反のみ手修正。
- Q3/Q8 色 FAIL: HEX を `var(--ubm-color-*)` へ置換（[§3](./shared-context.md) のトークン正本）。
- Q6 contract FAIL（drift）: `node scripts/gen-identity-conflict-seed.mjs` で再生成し SQL を更新。builder 側の正規化混入（末尾空白 trim / NFKC）が疑われる場合は builder を原文保持へ修正（[phase-6 D](./phase-6-test-additions.md)）。
- Q7 FAIL: 4 path への差分を取り消し、表現層 adapter / seed path へ移す。

## 完了条件

- [ ] Q1〜Q8 のコマンドと PASS 基準を確定した。
- [ ] API 不変の機械確認（Q7・`git diff --name-only`）を QA 項目に含めた。
- [ ] 色トークン grep（Q8）の対象ファイルと PASS 基準を明記した。
- [ ] 追加タスクのため新規ファイル削除確認は不要である旨を記録した。
