# Phase 9: Quality Assurance / 受入条件確認

## メタ情報

| Key | Value |
| --- | --- |
| workflow | `issue-837-schema-alias-bulk-rollback` |
| 入力 | `phase-06-test-expansion.md`（補強テスト）/ `phase-07-coverage-check.md`（coverage 閾値）/ `phase-08-refactoring.md`（リファクタ完了） |
| 目的 | AC-1〜9 全件 PASS / gate 一覧クリア / NFR-5 計測を確認し、Phase 10 最終レビューへの進行可否を判定する |

## 受入条件（AC）PASS 基準と検証コマンド対応表

| # | AC | PASS 基準 | 検証コマンド / 手段 |
| --- | --- | --- | --- |
| AC-1 | bulk rollback mode で複数 resolve 履歴行を checkbox 選択し、confirm modal を介して一括 rollback できる | Phase 11 の browser screenshot（desktop 1280 / mobile 375）で「checkbox 選択 → modal → rollback 完了後の HistoryPane 更新」が確認できる。spec FP-B-01〜04 が green | Phase 11 evidence + `vitest run SchemaDiffPanel.component.spec.tsx` |
| AC-2 | 1 件でも version mismatch（409）がある場合、成功分は確定し失敗分のみ理由付きで残る（per-alias 独立 commit） | FP-B-01：成功分は `selectedIds` / modal rows から除去、失敗 row は `errorMessage` 付きで残る。FP-E-01：他 row を巻き戻さない | `vitest run api.spec.ts useSchemaDiffBulkRollbackSelection.spec.tsx` |
| AC-3 | audit log から各 alias の rollback 結果を追跡できる（per-alias `schema_alias.rollback` 記録） | Phase 11 evidence で staging 環境の audit log に per-alias `schema_alias.rollback` レコードが存在することを確認。または spec で `rollbackSchemaAlias` が各 row に対して 1 回ずつ呼ばれることを mock spy で確認（FP-B-01 など） | Phase 11 evidence（audit log screenshot）+ `vitest run` |
| AC-4 | UI が「全成功 / 部分成功 / 全失敗」を区別して表示する | `data-role="bulk-rollback-summary"` の値が全成功時 `all-success`、部分成功時 `partial`、全失敗時 `all-failed` であること（FP-B-04 / FP-C-02）。jest-axe violations 0（FP-G-01〜03） | `vitest run SchemaDiffBulkRollbackModal.spec.tsx` |
| AC-5 | 50 件超過時に confirm が抑止され、分割実行を促す alert が表示される | FP-D-01：`rows.length === 51` で `RollbackApiError` throw。FP-D-04：HistoryPane の「一括取消」ボタンが `disabled`、alert が表示される | `vitest run api.spec.ts SchemaDiffPanel.component.spec.tsx` |
| AC-6 | 既存 single rollback / undo 経路、bulk resolve 経路が回帰なし | RG-H-01〜04 / RG-I-01〜04 が全件 green | `vitest run api.spec.ts SchemaDiffPanel.component.spec.tsx useSchemaDiffBulkSelection.spec.ts SchemaDiffBulkResolveModal.spec.tsx` |
| AC-7 | 楽観ロック検証ロジックが single 経路と単一定義で共有される | RF-1 完了後、`rollbackSchemaAliasBulk` が既存 `rollbackSchemaAlias`（楽観ロック付き `If-Match` ヘッダ送信）を per-row で呼び出している。FP-E-02：`rollbackSchemaAlias` 単体で 409 → `version_mismatch` が正しく伝播 | `grep -rn "If-Match" apps/web/src/lib/admin/api.ts` で 1 箇所定義のみ確認 + `vitest run api.spec.ts` |
| AC-8 | spec test が partial failure / all-fail / all-success / 50 件上限シナリオを含めて green | カテゴリ B（partial）/ C（all-fail）/ D（50 件上限）/ および全成功ケースがすべて green | `mise exec -- pnpm --filter @ubm-hyogo/web vitest run` で対象 spec 全件 green |
| AC-9 | design token 違反 0（OKLch のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止） | `verify-design-tokens` gate が green。手動 grep でも 0 件 | `bash scripts/verify-design-tokens.sh`（または相当 CI gate） + `grep -rn "bg-\[#\|text-\[#\|#[0-9a-fA-F]\{3,6\}" apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx apps/web/src/components/admin/SchemaDiffPanel.tsx` |

## 不変条件再確認

| 不変条件 | 確認内容 | 確認コマンド |
| --- | --- | --- |
| API/D1 変更なし（不変条件1・2） | `apps/api/` 配下に変更ファイルが存在しない | `git diff --name-only HEAD \| grep "apps/api/"` → 0 件 |
| OKLch token のみ（不変条件3） | 新規ファイル 2 件（modal / hook）および `SchemaDiffPanel.tsx` 差分で HEX 直書きがない | `bash scripts/verify-design-tokens.sh` |
| `*.spec.*` のみ（不変条件8） | `*.test.ts` / `*.test.tsx` ファイルが存在しない | `find apps/web/src -name "*.test.*" -name "*.test.tsx"` → 0 件 |
| D1 直接アクセス禁止（不変条件7） | `apps/web/src/` 配下に `D1Database` 型参照・`env.DB` 直接参照がない | `grep -rn "D1Database\|env\.DB" apps/web/src/` → 0 件（既存ゼロを維持） |
| env は `getEnv()` / `getPublicEnv()` 経由（不変条件4） | 新規ファイルで `process.env.*` 直接参照なし | `grep -rn "process\.env\." apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx apps/web/src/components/admin/hooks/useSchemaDiffBulkRollbackSelection.ts` → 0 件 |
| admin form input は `FormField` 経由（不変条件9） | checkbox は selection control のため `FormField` 例外。`aria-label` が必須付与されていることを DOM 確認（FP-G-04 / FP-D-04） | `vitest run SchemaDiffPanel.component.spec.tsx`（aria-label assertion） |

## Gate 一覧（CI / local 実行コマンド）

| Gate | 実行コマンド | 期待結果 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0（違反 0） |
| build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0（Cloudflare Workers 互換ビルド） |
| `verify-design-tokens` | `bash scripts/verify-design-tokens.sh`（または CI gate） | `PASS`（HEX 直書き 0） |
| spec test（unit） | `mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.spec.ts apps/web/src/components/admin/hooks/__tests__/useSchemaDiffBulkRollbackSelection.spec.tsx apps/web/src/components/admin/__tests__/SchemaDiffBulkRollbackModal.component.spec.tsx apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | 全件 green（fail 0） |
| a11y violation（jest-axe） | 上記 spec test 内（FP-G-01〜04） | violations 0 |
| `verify-pr-ready.sh`（pre-flight） | `bash scripts/verify-pr-ready.sh` | exit 0（`gate-metadata:validate` / `verify:phase12-compliance` / `indexes:rebuild` drift なし） |
| `runWithConcurrency` SSOT grep | `grep -rn "function runWithConcurrency\|const runWithConcurrency" apps/web/src/` | 1 件のみ（重複定義なし） |
| `*.test.*` 禁止 grep | `find apps/web/src -name "*.test.ts" -o -name "*.test.tsx"` | 0 件 |

## NFR-5 計測方針（30 件 / 30 秒以内）

**計測対象**: `rollbackSchemaAliasBulk` に 30 件の row を渡し、fan-out 完了までの elapsed time を計測する。

**計測環境**: local dev（`wrangler dev` 起動 + `localhost:8788`）または branch preview 環境。staging 計測は Phase 13 PR 後の runtime gate で再取得する。

**計測手順**:

1. Phase 11 の manual test シナリオ「MT-3: NFR-5 性能計測」として実行する。
2. HistoryPane に 30 件の resolve 済み alias が存在する状態で bulk rollback mode を ON にし全件選択。
3. confirm 押下から最後の row の `status` が `success` または `error` に確定するまでの wall clock を計測する（browser DevTools Network タイムライン）。
4. 計測結果（elapsed ms）を Phase 11 evidence の `outputs/phase-11/perf-30rows.md` に記録する。
5. 30 秒（30,000 ms）を超えた場合は Phase 8 の concurrency パラメータ調整（既定 8 を上限に変更するなど）を検討し、再計測する。

> **注記**: spec test 内での mock HTTP による時間計測は実環境と乖離するため、NFR-5 の証跡は Phase 11 の manual evidence のみを正とする。

## 実行コマンド（一括）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/api.spec.ts \
  apps/web/src/components/admin/hooks/__tests__/useSchemaDiffBulkRollbackSelection.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffBulkRollbackModal.component.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web build
bash scripts/verify-pr-ready.sh
```

## 完了条件

- [ ] AC-1〜9 全件 PASS（上表「PASS 基準」を満たす）
- [ ] 不変条件 violation 0（全行確認済み）
- [ ] Gate 一覧の全コマンドが exit 0 / PASS
- [ ] `runWithConcurrency` 重複定義 0（grep 確認済み）
- [ ] NFR-5 計測方針が Phase 11 evidence 計画に組み込まれている
- [ ] `*.test.*` ファイルが 0 件（不変条件8）
