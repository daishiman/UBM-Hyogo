# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 の設計（staging deploy フロー / env table / module 設計）について alternative 3 案を比較評価し、PASS-MINOR-MAJOR 判定でレビューを締める。MAJOR が出た場合は Phase 1〜2 へ差し戻す。

## 実行タスク

1. alternative 案 3 つを定義しトレードオフを表化
2. PASS-MINOR-MAJOR 判定基準で 4 領域（deploy 順序 / sync 検証範囲 / Playwright プロファイル / smoke 範囲）を評価
3. 不変条件 #5/#10/#11 違反の有無を再確認
4. open question を解消し Phase 4 に渡す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/02-application-implementation/_design/phase-3-review.md | review 観点 |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler 使い方の正本 |
| 必須 | doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-02.md | レビュー対象 |
| 参考 | docs/05b-parallel-smoke-readiness-and-handoff/phase-03.md | review 構成例 |

## 実行手順

### ステップ 1: alternative 案 3 つの作成
- A 案: GitHub Actions deploy 全自動（`dev` push トリガー）
- B 案: ローカルから wrangler 直接 deploy（手動）
- C 案: GitHub Actions deploy + 手動 sync 検証 + 手動 Playwright（ハイブリッド、本案）

### ステップ 2: PASS-MINOR-MAJOR 評価
- 4 領域 × 3 案 = 12 セルで判定する
- 1 件以上の MAJOR が出た場合は Phase 1 / 2 に差し戻す

### ステップ 3: 不変条件再確認
- #5: apps/web の bundle に D1 import がないことを Phase 4 でテスト化する設計か
- #10: staging 24h 無料枠見積もりを Phase 9 で検証する設計か
- #11: admin UI に編集 form がないことを Phase 11 で目視する設計か

### ステップ 4: open question の clearance
- Phase 1 の open question を全て「決定 / 持ち越し」に分類

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採択案を verify suite の対象とする |
| Phase 10 | 不変条件 review 結果を GO/NO-GO 判定の根拠にする |
| 並列 09b | 採択案の deploy 流儀を release runbook に揃える |
| 下流 09c | 採択案を production に転用するため引き渡す |

## 多角的チェック観点（不変条件）

- 不変条件 #4（本人本文は D1 override で編集しない）: staging で `/profile` の編集 form の不在を確認
- 不変条件 #5: apps/web bundle 解析を Phase 4 で test 化
- 不変条件 #10: 無料枠見積もり方法（Cloudflare Analytics URL）を採択

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 3 案作成 | 3 | pending | A / B / C |
| 2 | PASS-MINOR-MAJOR 評価 | 3 | pending | 12 セル |
| 3 | 不変条件 review | 3 | pending | #4/#5/#10/#11 |
| 4 | open question clearance | 3 | pending | Phase 1 持ち越し解消 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | alternative 3 案 / PASS-MINOR-MAJOR 表 / 採択理由 |
| メタ | artifacts.json | Phase 3 を completed に更新 |

## 完了条件

- [ ] alternative 3 案がそれぞれ pros / cons とともに記述
- [ ] PASS-MINOR-MAJOR 表が 12 セル埋まっている
- [ ] MAJOR 判定が 0 件、または出た場合は Phase 1/2 へ差し戻し記録あり
- [ ] 不変条件 #4/#5/#10/#11 の review 完了

## タスク100%実行確認【必須】

- 全実行タスクが completed
- alternative 3 案の表が完成
- 採択案が C（ハイブリッド）であることを明記
- artifacts.json の phase 3 を completed に更新

## 次 Phase

- 次: 4 (テスト戦略)
- 引き継ぎ事項: 採択案 C、PASS-MINOR-MAJOR 結果、open question 解消結果
- ブロック条件: MAJOR 判定が残っている、または alternative 3 案が揃わない場合は次 Phase に進まない

## Alternative 3 案

| 案 | 概要 | Pros | Cons |
| --- | --- | --- | --- |
| A | GitHub Actions の `deploy-staging` ワークフローのみで完結（push to dev → deploy → sync を CI 内で実行） | 完全自動、人為ミスゼロ | sync 失敗時の手動介入経路がない、staging で意図しない sync 副作用が起こる可能性 |
| B | ローカルから wrangler 直接 deploy + 手動 sync + 手動 Playwright | 完全マニュアル、デバッグ容易 | 再現性低、CI artifact と乖離、production 引き継ぎが脆弱 |
| C（採択） | GitHub Actions で deploy、その後 engineer が wrangler / curl / Playwright を staging に対して順次手動実行 | CI artifact をベースにしつつ、sync と smoke は人が確認 | 半自動なので runbook 必須 |

## PASS-MINOR-MAJOR 判定

| 領域 | A | B | C |
| --- | --- | --- | --- |
| deploy 順序 | PASS | MINOR（手動） | PASS |
| sync 検証範囲 | MAJOR（自動 sync が production 副作用を持ち込む懸念） | PASS | PASS |
| Playwright プロファイル | PASS | MINOR | PASS |
| smoke 範囲 | MINOR（CI 内 smoke は限定的） | MINOR | PASS |

採択: **C 案**。MAJOR が 0、MINOR が 0、PASS が 4 セル。

## 不変条件 review 結果

| 不変条件 | 結果 | 根拠 |
| --- | --- | --- |
| #4 | PASS | staging で `/profile` を Playwright で開いた際に編集 form が無いことを assertion 化 |
| #5 | PASS | bundle analyzer で apps/web に `D1Database` import が無いことを Phase 4 で lint check 化 |
| #10 | PASS | staging deploy 後 24h で Workers req が 30k 以下であることを Cloudflare Analytics で確認 |
| #11 | PASS | staging admin UI に「他人本文編集 form」がないことを Phase 11 目視で確認 |
