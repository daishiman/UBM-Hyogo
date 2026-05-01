# Phase 9 成果物: 品質保証（main）

## 12 品質チェック項目

| # | 項目 | 検証コマンド | 期待 | FAIL 時 |
| --- | --- | --- | --- | --- |
| 1 | ADR 本文の 5 セクション完備 | `rg -n "^## (Status\|Context\|Decision\|Consequences\|Related)" "$ADR_PATH"` | 5 行ヒット | Phase 5 戻し |
| 2 | ADR から関連 doc へのリンク死活 | `rg -n "deployment-cloudflare.md\|CLAUDE.md\|task-impl-opennext-workers-migration-001\|UT-GOV-006" "$ADR_PATH"` + 各リンク先存在確認 | 全リンク先実体あり | Phase 5 戻し |
| 3 | 判定表の Markdown table 健全性 | `grep -E "^\|" deployment-cloudflare.md \| head` | パイプ区切り構造維持 | Phase 5 戻し |
| 4 | CLAUDE.md スタック表行 base case 整合 | `rg -n "Cloudflare Workers\|Cloudflare Pages\|@opennextjs/cloudflare" CLAUDE.md` | base case (cutover) と整合（Workers 表記維持）| Phase 5 戻し |
| 5 | Phase 4 検証コマンド #1 再実行 | test-strategy.md #1 | 4 ファイル deploy target 行抽出 + ADR と整合 | Phase 5 / 8 戻し |
| 6 | Phase 4 検証コマンド #2 再実行 | test-strategy.md #2 | ADR ⇔ 判定表 deploy target 一致 | Phase 5 戻し |
| 7 | **Phase 4 検証コマンド #3 再実行（不変条件 #5 抵触ガード）** | `rg -n "^\[\[d1_databases\]\]" apps/web/wrangler.toml` | **0 件** | **MAJOR / Phase 10 NO-GO** |
| 8 | Phase 4 検証コマンド #4 再実行 | test-strategy.md #4 | base case (cutover) と整合 | Phase 5 戻し |
| 9 | Phase 4 検証コマンド #5 再実行 | test-strategy.md #5 | C-1 採択結果と整合（重複起票なし） | Phase 3/5 戻し |
| 10 | artifacts.json と outputs/ parity | `ls outputs/phase-*/` と `jq '.phases[].outputs' artifacts.json` 比較 | 全 outputs 実体あり | Phase 12 で同期 |
| 11 | artifacts.json valid JSON | `jq . artifacts.json > /dev/null` | exit 0 | Phase 12 で修正 |
| 12 | outputs/artifacts.json と root artifacts.json parity | `diff <(jq -S . artifacts.json) <(jq -S . outputs/artifacts.json)` | 差分ゼロ（許容差分のみ）| Phase 12 で同期 |

## 不変条件 #5 最終ガード（独立扱い・スキップ禁止）

```bash
# 必須実行
rg -n "^\[\[d1_databases\]\]|^\[d1_databases\]" apps/web/wrangler.toml
echo "Exit: $?"
# 期待: マッチゼロ（exit 1）。マッチ 1 件以上で Phase 10 MAJOR NO-GO
```

**WEEKGRD-01 対応**: source-level PASS と環境ブロッカー（grep ツール不在等）を別カテゴリで記録する。製品コード問題と環境起因問題を混在させない。

## 品質ゲート判定

| 状態 | 条件 | アクション |
| --- | --- | --- |
| **PASS** | 12 項目すべて期待結果 + 不変条件 #5 ガード PASS | Phase 10 進行 |
| **MINOR** | 1-3 項目に整形系の軽微 FAIL（Phase 12 で吸収可能） | Phase 10 で MINOR 報告として通過 |
| **MAJOR** | 不変条件 #5 抵触 / ADR 5 セクション欠落 / リンク死活不良 | Phase 10 NO-GO、該当 Phase 戻し |

## 完了確認

- [x] 12 品質チェック項目すべてに 4 カラム（コマンド / 期待 / FAIL / 戻し先）
- [x] 不変条件 #5 ガード独立節
- [x] PASS / MINOR / MAJOR 判定基準明文化
- [x] Phase 4 検証コマンド 5 種すべての再実行手順
- [x] artifacts.json parity 確認手順
- [x] WEEKGRD-01 対応（source-level vs 環境ブロッカー分離）
