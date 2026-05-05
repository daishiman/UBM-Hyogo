# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Pages vs Workers deploy target decision (UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-05-01 |
| 前 Phase | 8（DRY 化 / 仕様間整合） |
| 次 Phase | 10（最終レビューゲート） |
| 状態 | spec_created |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

ADR 本文と関連 doc の文書品質を一括判定する。具体的には (1) リンク死活確認、(2) ADR テンプレ準拠（Status / Context / Decision / Consequences / Related の 5 セクション）、(3) `deployment-cloudflare.md` 判定表の表構造健全性、(4) `CLAUDE.md` の参照整合、(5) Phase 4 検証コマンド 5 種の再実行による現状 PASS 確認、(6) 不変条件 #5 抵触ゼロの最終確認、(7) `artifacts.json` と `outputs/` ディレクトリ実体の parity を Phase 10 ゲート前に固める。

## 品質チェック項目

| # | 項目 | 検証コマンド | 期待 | FAIL 時 |
| --- | --- | --- | --- | --- |
| 1 | ADR 本文の 5 セクション完備 | `rg -n "^## (Status|Context|Decision|Consequences|Related)" {{ADR_PATH}}` | 5 行ヒット | Phase 5 戻し |
| 2 | ADR から関連 doc へのリンク死活 | `rg -n "deployment-cloudflare.md\|CLAUDE.md\|task-impl-opennext-workers-migration-001\|UT-GOV-006" {{ADR_PATH}}` + 各リンク先存在確認 | 全リンク先実体あり | Phase 5 戻し |
| 3 | 判定表の表構造（Markdown table 健全性） | `grep -E "^\|" deployment-cloudflare.md \| head` で table 行確認 | パイプ区切り構造維持 | Phase 5 戻し |
| 4 | CLAUDE.md スタック表行の base case 整合 | `rg -n "Cloudflare Workers\|Cloudflare Pages\|@opennextjs/cloudflare" CLAUDE.md` | base case と一致する記述 | Phase 5 戻し |
| 5 | Phase 4 検証コマンド #1 再実行（deploy target 抽出） | Phase 4 test-strategy.md の #1 コマンド | 4 ファイルすべての deploy target 行が抽出され ADR と整合 | Phase 5 / 8 戻し |
| 6 | Phase 4 検証コマンド #2 再実行（ADR ⇔ 判定表照合） | 同 #2 | deploy target 一致 | Phase 5 戻し |
| 7 | Phase 4 検証コマンド #3 再実行（不変条件 #5 抵触ガード） | `rg -n "^\[\[d1_databases\]\]" apps/web/wrangler.toml` | **0 件** | MAJOR ブロッカー / Phase 10 NO-GO |
| 8 | Phase 4 検証コマンド #4 再実行（CLAUDE.md 整合） | 同 #4 | base case と整合 | Phase 5 戻し |
| 9 | Phase 4 検証コマンド #5 再実行（関連タスク重複） | 同 #5 | C-1 採択結果と整合（重複起票なし） | Phase 3/5 戻し |
| 10 | artifacts.json と outputs/ parity | `ls outputs/phase-*/` と `jq '.phases[].outputs' artifacts.json` 比較 | 全 outputs 実体あり | Phase 12 で同期 |
| 11 | artifacts.json valid JSON | `jq . artifacts.json > /dev/null` | exit 0 | Phase 12 で修正 |
| 12 | outputs/artifacts.json（生成時）と root artifacts.json parity | `diff <(jq -S . artifacts.json) <(jq -S . outputs/artifacts.json)` | 差分ゼロ（または許容差分のみ） | Phase 12 で同期 |

## 不変条件 #5 最終ガード（独立扱い）

```bash
# 必須実行・スキップ禁止
rg -n "^\[\[d1_databases\]\]|^\[d1_databases\]" apps/web/wrangler.toml
echo "Exit: $?"
# 期待: マッチゼロ（exit 1）。マッチ 1 件でも Phase 10 で MAJOR NO-GO
```

> **WEEKGRD-01 対応**: source-level PASS と環境ブロッカー（grep ツール不在等）を別カテゴリで記録する。製品コードの問題と環境起因の問題を混在させない。

## 品質ゲート判定

| 状態 | 条件 | アクション |
| --- | --- | --- |
| **PASS** | 12 項目すべて期待結果 + 不変条件 #5 ガード PASS | Phase 10 へ進行 |
| **MINOR** | 1-3 項目に整形系の軽微な FAIL（Phase 12 で吸収可能） | Phase 10 で MINOR 報告として通過 |
| **MAJOR** | 不変条件 #5 抵触 / ADR 5 セクション欠落 / リンク死活不良 | Phase 10 NO-GO、該当 Phase に戻し |

## 完了条件チェックリスト

- [ ] 12 品質チェック項目すべてに検証コマンド + 期待 + FAIL アクションが付与
- [ ] 不変条件 #5 ガードが独立節として強調
- [ ] PASS / MINOR / MAJOR 判定基準が明文化
- [ ] Phase 4 検証コマンド 5 種すべての再実行手順が含まれる
- [ ] artifacts.json と outputs/ parity 確認手順が含まれる
- [ ] WEEKGRD-01（source-level vs 環境ブロッカー分離）の運用ルールが記述

## 実行タスク

1. `outputs/phase-09/main.md` に 12 品質チェック項目 + 不変条件 #5 独立ガード + 判定基準を記述。
2. `outputs/phase-09/quality-gate-checklist.md` にチェックリスト形式（PASS/FAIL チェックボックス）で記述し、Phase 10 でそのまま転記可能にする。
3. WEEKGRD-01 対応として「source-level PASS / 環境ブロッカー」の記録テンプレを末尾に追加。

## 多角的チェック観点

- **再現性**: 全コマンドはリポジトリルートからの相対パスで動作。worktree でも実行可能。
- **不変条件 #5 の二重監査**: AC マトリクス（Phase 7）独立行 + 本 Phase 9 独立節で 2 重チェックされていること。
- **`@opennextjs/cloudflare` 互換結果の凍結**: Phase 2 で記録した互換確認結果が Phase 9 時点で陳腐化していないか（バージョン更新が ADR 起票後に発生していないか）。
- **outputs パリティ**: Phase 1-8 すべての outputs 実体ファイルが存在するか（プレースホルダー記述のみで実体ゼロは FAIL）。
- **artifacts.json valid**: jq で parse できない場合は Phase 10 進行不可。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | 12 品質チェック項目記述 | 9 | pending |
| 2 | 不変条件 #5 独立ガード強調 | 9 | pending |
| 3 | PASS/MINOR/MAJOR 判定基準 | 9 | pending |
| 4 | Phase 4 検証コマンド 5 種再実行手順 | 9 | pending |
| 5 | artifacts.json parity 確認 | 9 | pending |
| 6 | WEEKGRD-01 記録テンプレ | 9 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 12 品質チェック + 不変条件 #5 ガード + 判定基準 |
| ドキュメント | outputs/phase-09/quality-gate-checklist.md | チェックリスト形式（Phase 10 転記用） |
| メタ | artifacts.json | Phase 9 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created` へ遷移
- 12 品質チェック項目完備
- 不変条件 #5 が二重監査
- PASS/MINOR/MAJOR 判定が明文化
- artifacts.json valid + outputs parity 手順
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10（最終レビューゲート）
- 引き継ぎ事項:
  - 12 品質チェックの実行結果（Phase 10 で AC マトリクスと突合）
  - 不変条件 #5 ガード PASS 証跡
  - artifacts.json parity 結果
- ブロック条件:
  - 不変条件 #5 抵触検出
  - ADR 5 セクション欠落
  - artifacts.json invalid
  - リンク死活不良

## 参照資料

- `outputs/phase-09/quality-gate-checklist.md`
- `outputs/phase-04/test-strategy.md`
- `artifacts.json`

## 統合テスト連携

品質ゲートは Markdown / JSON / grep の NON_VISUAL 検証で行う。deploy 統合テストは migration task へ委譲する。
