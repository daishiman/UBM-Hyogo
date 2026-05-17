# Phase 4: テスト作成（TDD RED）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 名称 | テスト作成 |
| TDD ステージ | RED |
| テストファイル | `apps/api/src/services/aliasRecommendation.spec.ts` |

## 目的

実装より先に多言語 fixture を `aliasRecommendation.spec.ts` に追加し、`normalizeLabelForCompare` 未実装の状態で RED（fail）を確認する。

## 実行タスク

1. 事前チェック: `pnpm install` + `pnpm typecheck` で依存・esbuild 整合を確認する
2. `aliasRecommendation.spec.ts` の末尾に `describe("normalizeLabelForCompare", ...)` を追加（it × 5）
3. 同ファイルに `describe("recommendAliases (i18n normalization)", ...)` を追加（it × 4: i18n-1〜i18n-4）
4. 既存 `describe("recommendAliases", ...)` 5 ケースは編集しない
5. test 実行で RED（non-zero exit）を確認する
6. RED ログを `outputs/phase-04/red-test-result.md` に記録する

## 追加するテスト（概要）

`normalizeLabelForCompare` describe:
- NFKC: 全角英数字 → 半角
- trim: 前後空白除去（半角・U+3000 全角空白）
- whitespace: 連続空白を半角 1 個に圧縮
- 空文字 → 空文字
- 日本語はそのまま保持

`recommendAliases (i18n normalization)` describe:
- i18n-1: 日本語完全一致 → 当該 stableKey が `r[0]`
- i18n-2: NFKC（全角空白入り英字）→ 半角と同視
- i18n-3: trim + 連続空白圧縮で表記揺れ吸収
- i18n-4 (negative): 別 label が誤一致しない

詳細 fixture コードは `outputs/phase-02/main.md` 参照。

## 期待する RED 状態

- `import { normalizeLabelForCompare }` で `TS2305: Module has no exported member` 発生
- describe 内 it が compilation error で全件 FAIL
- 既存 5 ケースは未変更

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run src/services/aliasRecommendation.spec.ts
```

期待 exit code: **non-zero**（RED）

## 参照資料

- `outputs/phase-02/main.md`（fixture 設計）
- `apps/api/src/services/aliasRecommendation.spec.ts`（既存 5 ケース）
- CLAUDE.md 不変条件 #8（`*.spec.ts` のみ）

## 統合テスト連携

- 本 Phase の RED ログは Phase 5 GREEN 判定の前提
- Phase 9 品質保証で同コマンドを再実行し PASS を確認する

## 成果物

`outputs/phase-04/red-test-result.md` に以下を記録:
- 追加した describe / it 一覧（計 9 ケース）
- RED 実行ログ（compilation error 抜粋）
- 既存 5 ケース未変更の確認

## 完了条件

- [ ] 新規 describe 2 つ・it 計 9 ケースが spec ファイルに追加されている
- [ ] test 実行が non-zero exit（RED）で終了している
- [ ] 既存 5 ケースが編集されていない
- [ ] `outputs/phase-04/red-test-result.md` が存在する
