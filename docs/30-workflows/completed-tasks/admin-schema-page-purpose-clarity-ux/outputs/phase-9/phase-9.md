# Phase 9 — 品質保証

> SSOT: [`../../_shared-context.md`](../../_shared-context.md) §7（検証コマンド）/ §8（DoD）/ §9（CI 3 ゲート）。本 Phase は実装完了時の一括品質判定の手順を固定する。
> implementation_mode=`new`（implemented_local_evidence_captured）。local QA は Phase 11 evidence に記録済み。staging visual baseline / commit / PR のみ user-gated。

## 9.1 line budget / link / mirror parity 一括判定方針

| 観点 | 判定方法 | 合格基準 |
| --- | --- | --- |
| line budget（追加行の妥当性） | 変更は表現層（説明追加・コピー・CSS）に限定。`git diff --stat` で `apps/web` 配下のみに収まること | `apps/api`/`packages/shared` の追加削除が 0 行（§9.3 git diff 空で兼ねる） |
| link（リンク健全性） | `page.tsx` 内 `Link href`（`/admin/schema/history`）は既存のまま変更しない。新規リンクを足さない | 既存リンク不変・新規 dead link 0 |
| mirror parity | 本タスクは skill index / `.agents` mirror を生成しない純機能タスク。mirror parity は `indexes:rebuild` drift 0（§9.4 CI ゲート3）で担保 | `pnpm indexes:rebuild` 後 drift 0 |

## 9.2 削除ファイル（stub 化）— N/A

- 本タスクはファイル削除を伴わない（新規 2 + 編集 4 + テスト 3）。stub 化（削除ファイルの参照残し対策）は **該当なし**。

## 9.3 不変条件チェックリスト

| # | 不変条件 | 検証コマンド / 方法 | 合格 |
| --- | --- | --- | --- |
| INV-1 | OKLch トークンのみ（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止） | `pnpm --filter @ubm-hyogo/web verify-design-tokens`（= `tokens.runtime.spec.ts`）。新規 `.schema-*` クラスが `--ubm-color-*`/`--ubm-space-*`/`--ubm-radius-*` のみ使用 | 新規 HEX 0 |
| INV-2 | test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止） | `git diff --name-only` に `*.test.tsx`/`*.test.ts` が出ないこと。lefthook `block-test-suffix` / CI `verify-test-suffix` でも検査 | `.spec.*` のみ |
| INV-3 | API 非接触（`apps/api`/`packages/shared` git diff 空） | `git diff --stat -- apps/api packages/shared` が空 | 出力 0 行 |
| INV-4 | `process.env.*` 直接参照なし | 新規/編集ファイルに `process.env` を書かない（env は `getEnv()` 系経由）。`grep -rn "process.env" apps/web/src/components/admin/SchemaPurposeExplainer.tsx apps/web/src/components/admin/schemaGlossary.ts` が空 | 直接参照 0 |
| INV-5 | 新規プリミティブ 0 | `SchemaPurposeExplainer` は既存 `.ui-card`/`Banner`/`Card`/`Chip`/`EmptyState` の構成のみ。`apps/web/src/components/ui/` に新規追加なし（`git diff --name-only -- apps/web/src/components/ui` が空） | 新規 primitive 0 |
| INV-6 | `useAdminMutation` 本体不改変 | `git diff -- apps/web/src/features/admin/hooks/useAdminMutation.ts apps/web/src/lib/useAdminMutation*` が空 | 本体不変 |
| INV-7 | SchemaDiffPanel の handler/fetch/state 不変 | Phase 6 §6.3 回帰 guard（割り当て payload / rollback 引数 / bulk 集計の不変）が GREEN | guard 全 GREEN |
| INV-8 | explainer は常時表示（API エラー時も表示・差分本文のみ stale 非描画） | Phase 6 §6.4 fail path テスト GREEN（ok=false で `data-region="schema-purpose-explainer"` 存在 かつ `項目別の差分` null） | fail path GREEN |
| INV-9 | 新規 endpoint / D1 schema / Form 仕様の変更なし | INV-3 と同義（git diff 空）。`apps/api/migrations` 差分も 0 | 0 |

## 9.4 CI ゲート（正本 = `bash scripts/verify-pr-ready.sh` 3 点）

| # | ゲート | 合格基準 |
| --- | --- | --- |
| GATE-1 | `verify:phase12-compliance` | `ok`（canonical 9 見出し逐語 + Phase 11 evidence 表の status が `{present, pending, n/a}` のいずれか。注釈付与しない） |
| GATE-2 | `gate-metadata:validate` | ERROR 0（`artifacts.json` の `metadata.gates` が zod schema 準拠。Gate-A passed 等を evidence_path 物理存在込みで記述） |
| GATE-3 | `indexes:rebuild` drift | 再生成後 drift 0（本タスクは skill index 非変更ゆえ冪等） |

> `validate-phase-output.js` / `verify-all-specs.js` は非 CI 助言（land 済テンプレでも fail しうる）。CI 判定は上記 3 点のみ。

## 9.5 QA 実行コマンド（順序固定）

```bash
# 1. 型
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
# 2. lint（失敗時は lint --fix → 残違反手修正）
mise exec -- pnpm lint
# 3. デザイントークン（新規 HEX 0 / OKLch のみ）
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
# 4. focused vitest（Phase 6 の全 spec）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/schemaGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaPurposeExplainer.component.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx \
  "apps/web/app/(admin)/admin/schema/page.spec.tsx"
# 5. API 非接触（空を期待）
git diff --stat -- apps/api packages/shared | tee /dev/stderr | wc -l
# 6. CI 3 ゲート（PR pre-flight）
bash scripts/verify-pr-ready.sh
```

> §9.3 の補助 grep（INV-4/5/6）も実装時に併走させる。Playwright 視覚ベースライン（staging・bearer）は §7 / Phase 11 の user-gated 手順に従い、QA 必須ループには含めない（DoD #9 は user-gated）。

## 9.6 合否判定（DoD 連動）

- 全て合格 = SSOT §8 DoD #1-8 充足（#9 視覚は user-gated）。GATE-1/2/3 全緑で PR pre-flight 通過。
- いずれか不合格 = 該当 INV / GATE の修正に戻る。`verify-design-tokens` 失敗は HEX/任意値混入を OKLch トークンへ置換、`typecheck`/`lint` 失敗は最小差分修正、回帰 guard 失敗は表示追加がロジックへ漏れた箇所を切り戻す。

## 完了条件

- [x] line budget / link / mirror parity の一括判定方針を定義
- [x] 削除ファイル N/A を明記
- [x] 不変条件チェックリスト（OKLch only / `*.spec` only / API 非接触 git diff 空 / `process.env` 直接参照なし / 新規プリミティブ 0 / useAdminMutation 不変 / SchemaDiffPanel ロジック不変 / fail path）を定義
- [x] CI 3 ゲート（phase12-compliance / gate-metadata / indexes drift）を合格基準付きで明記
- [x] QA コマンドを順序固定で列挙
