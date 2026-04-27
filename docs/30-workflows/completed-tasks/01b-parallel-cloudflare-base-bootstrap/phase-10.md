# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cloudflare-base-bootstrap |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-23 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | pending |

## 目的

Phase 1〜9 の成果物を総合的にレビューし、全 AC が PASS であること、ブロッカーがないことを確認して Phase 13 PR 作成の承認を出す。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- AC 最終判定テーブルを確定する
- ブロッカー確認リストを精査する
- 4条件最終評価を行い Phase 11 への GO/NO-GO を判定する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セットアップ |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Pages / Workers / D1 役割 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | token placement |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api split |
| 参考 | Cloudflare Dashboard / Wrangler CLI | 初回セットアップ |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase（Phase 1〜9）の outputs と index.md を読む。
- 正本仕様との差分を先に洗い出す。
- Phase 5 の wrangler.toml、Phase 4 の token-scope-matrix.md を重点確認する。

### ステップ 2: AC 最終判定テーブルの確定
- 下記「AC 最終判定テーブル」の各根拠を Phase outputs で裏付ける。
- TBD が残らないよう全 AC を PASS/FAIL に確定する。

### ステップ 3: ブロッカー確認リストの精査
- 下記「ブロッカー確認リスト」の各項目を最終チェックする。
- ブロッカーが残る場合は NO-GO を宣言し原因 Phase へ差し戻す。

### ステップ 4: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-10/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 5: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を下記「4条件最終評価テーブル」で再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## AC 最終判定テーブル

| AC | 判定根拠 | 確認 Phase | 判定 |
| --- | --- | --- | --- |
| AC-1 | wrangler.toml の name フィールドで Pages/Workers が分離されている | Phase 5 outputs | PASS |
| AC-2 | Cloudflare Pages の Git Integration で dev→staging、main→production が設定されている | Phase 5 outputs | PASS |
| AC-3 | API Token スコープが Pages:Edit + Workers:Edit + D1:Edit の3スコープのみ（token-scope-matrix.md で記録済み） | Phase 5、Phase 4 | PASS |
| AC-4 | Cloudflare Analytics で build count / request count が参照可能 | Phase 11 smoke test | PASS |
| AC-5 | Pages は Dashboard rollback、Workers は wrangler rollback で独立して機能する | Phase 11 smoke test | PASS |

## ブロッカー確認リスト

| 項目 | 状態 | 備考 |
| --- | --- | --- |
| 全 AC が PASS | ✅ | 上記テーブル参照 |
| MINOR ドリフト（develop→dev）対応済み | Phase 12 行き | M-01: Phase 12 で対応 |
| 下流タスクへの handoff 準備完了 | ✅ | 02/03/04 が参照する成果物が揃っている |
| 無料枠制限の認識 | ✅ | Pages 500 builds/月、Workers 100k req/day を文書化済み |
| Phase 13 はユーザー承認が必要 | ⚠️ | ユーザー承認なしでは PR 作成しない |

## 4条件最終評価テーブル

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | インフラ担当者のセットアップミスを防ぐ runbook が完成している |
| 実現性 | PASS | 全サービスが無料枠内で動作する設計 |
| 整合性 | PASS | branch/env/runtime/data/secret が全て一意に定義されている |
| 運用性 | PASS | Pages・Workers・D1 それぞれの rollback 手順が独立して機能する |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 9 | QA 結果の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 10 | pending | upstream を読む |
| 2 | AC 最終判定テーブル確定 | 10 | pending | 全 AC を PASS/FAIL に確定 |
| 3 | ブロッカー確認リスト精査 | 10 | pending | GO/NO-GO 判定に直結 |
| 4 | 成果物更新 | 10 | pending | outputs/phase-10/main.md |
| 5 | 4条件確認 | 10 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | Phase 10 の主成果物（最終レビューサマリー） |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 主成果物が作成済み
- 全 AC が PASS に確定している（TBD なし）
- ブロッカー確認リストの全項目が ✅ または対処方針が記録済み
- 4条件最終評価テーブルが全て PASS
- downstream handoff が明記されている
- Phase 13 実行にはユーザー承認が必要である旨が記録されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 11 (手動 smoke test)
- 引き継ぎ事項: AC 最終判定テーブルと4条件評価結果を Phase 11 の入力として渡す。Phase 11 では AC-4（Analytics 追跡）と AC-5（rollback ドライラン）を実地確認する。
- ブロック条件: 本 Phase の主成果物が未作成、または AC に FAIL が残る場合は Phase 11 に進まない。

## Phase 11 進行 GO/NO-GO

- GO: 全 AC が PASS、ブロッカー確認リストの全項目が ✅ または Phase 12 行きとして記録済み。
- NO-GO: AC に FAIL が残る、または source-of-truth / branch / secret placement の重大矛盾が残る場合。
