# Phase 3 — 設計レビュー（main）

## Status

spec_created

> 本書は Phase 3 の概要であり、レビュー詳細は併存する `review.md` に記述する。Phase 2 で固定した実装設計（`outputs/phase-2/design.md`）に対し、代替案比較・NO-GO 条件・"pwn request" 非該当 5 箇条・security 観点 S-1〜S-6・ロールバック設計・用語整合の 6 軸でレビューする。

## 1. Phase 3 の目的

実 workflow 編集タスクとして以下 3 軸を expert review で署名できる状態にする：

1. **pwn request 非該当**：GitHub Security Lab が定義する 5 箇条をすべて担保
2. **required status checks 名 drift ゼロ**：job 名と branch protection contexts が同期
3. **単一 revert ロールバック可能**：safety gate 適用前へ 1 コミットで戻せる

## 2. レビュー結論（要約）

| 項目 | 結論 |
| --- | --- |
| 採択代替案 | **C 案**（`pull_request_target` を triage 専用 ＋ build/test を `pull_request` に分離）— PASS |
| NO-GO 条件 N-1〜N-4 | 本 Phase 時点では発生していない |
| "pwn request" 非該当 5 箇条 | 全 5 箇条を 4 列表で検証手順化済み（review.md §3） |
| security 観点 S-1〜S-6 | 全観点を担保箇所付きで列挙済み（review.md §4） |
| ロールバック設計 | 単一 `git revert` 粒度 ＋ drift 検知コマンドが design.md §5 に記述、レビュー OK |
| 用語整合 | canonical 4 語（`pull_request_target safety gate` / `triage workflow` / `untrusted build workflow` / `pwn request pattern`）に揺れ無し |
| 進行判定 | **Phase 4 テスト設計に進行可能** |

## 3. 上流 dry-run review.md との差分

| 項目 | 上流 dry-run review | 本 IMPL review |
| --- | --- | --- |
| NO-GO | N-1〜N-3（dry-run 仕様未完成 / UT-GOV-001 / UT-GOV-007） | N-1〜N-4（**N-4 を追加**：required status checks 名 drift） |
| security 観点 | S-1〜S-5 | S-1〜S-6（**S-6 を追加**：fork PR からの label injection 経路検証） |
| 検証列 | 「現状」「設計後」「Phase 9 検証手段」の 3 列 | 「現状」「Phase 5 適用後」「Phase 9 静的検査コマンド」「Phase 11 dry-run 目視確認」の **4 列** |
| ロールバックレビュー | 設計レビューのみ | 実 workflow 編集観点を加味（required status checks 名 drift 後の復旧手順を含む） |

## 4. 成果物への相互参照

- `outputs/phase-3/review.md`：レビュー記録の正本
- `outputs/phase-2/design.md`：レビュー対象
- `outputs/phase-1/main.md`：要件と命名 canonical の入力

## 5. 完了条件チェック

- [x] 代替案 A〜D を PASS/MINOR/MAJOR で評価し、C を採択
- [x] "pwn request" 非該当 5 箇条を 4 列表で記述
- [x] NO-GO 条件 N-1〜N-4 を記述
- [x] security 観点 S-1〜S-6 を列挙
- [x] ロールバック設計レビュー結果を記述
- [x] 用語整合チェック結果を記録
