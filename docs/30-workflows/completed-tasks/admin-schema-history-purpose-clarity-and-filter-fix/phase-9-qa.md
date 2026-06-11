# Phase 9: QA

[実装区分: 実装仕様書]

> SSOT: [`shared-context.md`](./shared-context.md)。検証コマンドの正本は §11、AC の正本は §8。

## 1. 実行コマンドと合否基準（SSOT §11 を正本として転記）

> 以下は [`shared-context.md` §11](./shared-context.md) のコマンドを転記したもの。local deterministic evidence は実行済みで、staging 操作と screenshot のみ user-gated とする。

| # | コマンド | 合否基準 |
|---|----------|----------|
| QA-1 | `mise exec -- pnpm typecheck` | エラー 0（`SchemaAliasHistoryResponse` に `appliedFilters.batchId` が型として現れ、`EMPTY_RESPONSE` が整合すること） |
| QA-2 | `mise exec -- pnpm lint` | 違反 0（`--fix` で解消できない手修正残ゼロ） |
| QA-3 | `pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.spec.ts apps/web/src/lib/admin/__tests__/schemaHistoryError.spec.ts apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx apps/web/src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx` | 対象 4 spec すべて GREEN |
| QA-4 | `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` | HEX 直書き 0 件で PASS（`verify-design-tokens` が fail しない） |
| QA-5 | `git diff origin/dev...HEAD -- apps/api apps/api/migrations` | 出力 0 行（apps/api 非接触の確認） |
| QA-6 | `mise exec -- pnpm verify:phase12-compliance` | 仕様書側 CI gate pre-flight: `ok:true` |
| QA-7 | `mise exec -- pnpm gate-metadata:validate` | gate-metadata: ERROR 0 |

> QA-3 の対象 spec 群は SSOT §11 と完全一致（`schemaHistoryError.spec.ts` / `api.spec.ts` / `SchemaHistoryPurposeExplainer.component.spec.tsx` / `SchemaDiffHistoryPanel.component.spec.tsx`）。

## 2. AC との対応表

> [`shared-context.md` §8](./shared-context.md) の AC-1〜AC-10 を、上記 QA コマンドおよび spec へ対応づける。

| AC | 内容（要約） | 検証手段 | 対応 QA / spec |
|----|--------------|----------|----------------|
| AC-1 | 「絞り込み」で `unrecognized_keys` / `batchId` ZodError が出ず parse 成功 | parse 回帰 spec + Phase 11 staging 操作（user-gated） | QA-3（`api.spec.ts`） |
| AC-2 | `SchemaAliasHistoryResponseZ.parse` が `appliedFilters.batchId`（string / null）を受理 | parse 回帰 spec | QA-3（`api.spec.ts`） |
| AC-3 | 取得失敗時に raw JSON でなく日本語メッセージが表示 | error formatter unit + panel error 描画 spec | QA-3（`schemaHistoryError.spec.ts` / `SchemaDiffHistoryPanel.component.spec.tsx`） |
| AC-4 | error 要素に `.schema-history-error` クラス + OKLch token スタイル | panel 描画 spec（class 確認）+ verify-design-tokens | QA-3 / QA-4 |
| AC-5 | 冒頭に `data-testid="schema-history-purpose-explainer"` が表示され流れ 3 + 用語集が描画 | explainer 描画 spec | QA-3（`SchemaHistoryPurposeExplainer.component.spec.tsx`） |
| AC-6 | page title「設問の紐付け履歴」/ description 平易化 | typecheck + Phase 11 visual（user-gated） | QA-1 / Phase 11 |
| AC-7 | 履歴が `.schema-history-card` カード形式で stableKey / 旧→新 / question / 日時・操作者を含む | panel card 描画 spec | QA-3（`SchemaDiffHistoryPanel.component.spec.tsx`） |
| AC-8 | 当該 page/panel/explainer/globals.css に HEX 直書き 0 件 | verify-design-tokens | QA-4 |
| AC-9 | `apps/api` の diff が空 | git diff gate | QA-5 |
| AC-10 | typecheck / lint / 対象 web spec が全 PASS | コマンド実行 | QA-1 / QA-2 / QA-3 |

## 3. apps/api 非接触の空確認（AC-9）

```bash
git diff origin/dev...HEAD -- apps/api apps/api/migrations
```

- 期待: **出力 0 行**。本サイクルの変更は apps/web 表現層 / adapter 層のみ（不変条件 #5）。
- この gate が非空になった場合は API 接触の混入を意味し、QA を fail とする。

## 4. ファイル削除確認 [FB-UI-02-1]

> [FB-UI-02-1] は「削除されたファイルの不在確認」を要求するが、**本タスクには新規のファイル削除が無いため該当なし**と明記する。

- 新規作成: `schemaHistoryError.ts` / `schemaHistoryGlossary.ts` / `SchemaHistoryPurposeExplainer.tsx` + 3 spec（追加のみ）。
- 編集: `api.ts` / `SchemaDiffHistoryPanel.tsx` / `history/page.tsx` / `globals.css` / `SchemaDiffHistoryPanel.component.spec.tsx`（更新のみ）。
- 既存 panel spec（`SchemaDiffHistoryPanel.component.spec.tsx`）は **更新であり削除ではない**（table→card 構造への spec 追記）。削除確認の対象外。
- したがって削除ファイルの不在を確認すべき項目は 0 件。

## 5. 手動 QA（Phase 11 / staging・user-gated）

- staging `/admin/schema/history` で「絞り込み」を実行し、画面下部の raw JSON（`unrecognized_keys` / `batchId`）が出ないこと（AC-1）。
- 取得失敗を誘発した際に日本語メッセージが `.schema-history-error` のスタイルで表示されること（AC-3/AC-4）。
- 冒頭に目的説明パネル（流れ 3 ステップ + 用語集）が表示されること（AC-5）。
- 履歴がカード形式で描画されること（AC-7）。
- これらの local screenshot 取得は Phase 11 で完了済み。authenticated staging screenshot 2 件は `pending_user_gate` とする。

## 6. QA 判定基準（DoD 整合）

QA-1〜QA-7 がすべて合格基準を満たし、AC-1〜AC-10 が上表の検証手段で確認できることを QA 合格とする。local deterministic evidence と local screenshot は取得済みで、staging 反映・authenticated screenshot は user-gated のため Phase 11 に残す。
