# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | google-workspace-bootstrap |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR作成 |
| 作成日 | 2026-04-23 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |

## 目的

Google Workspace / Sheets 連携基盤 における Phase 13 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | integration package の責務 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | local canonical env |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | secret placement |
| 参考 | Google Cloud Console | Project / OAuth / service account |
| 参考 | User request on 2026-04-23 | Google スプレッドシート入力 |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-13/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 13 | pending | upstream を読む |
| 2 | 成果物更新 | 13 | pending | outputs/phase-13/main.md |
| 3 | 4条件確認 | 13 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | Phase 13 の主成果物 |
| ドキュメント | outputs/phase-13/local-check-result.md | PR 前ローカル確認結果 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリー |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 主成果物が作成済み
- 正本仕様参照が残っている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: なし
- 引き継ぎ事項: Google Workspace / Sheets 連携基盤 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## ブロック状態

| 項目 | 状態 | 補足 |
| --- | --- | --- |
| user approval | blocked | ユーザーの明示承認があるまで PR 作成は開始しない |
| local-check-result | required | `outputs/phase-13/local-check-result.md` を作成する |
| change-summary | required | `outputs/phase-13/change-summary.md` を作成する |
| pr-info / pr-creation-result | blocked | 承認後に作成できる状態まで待機する |

## PR 準備事項

### PR タイトル（案）
`docs: Google Workspace 連携基盤タスク仕様書 (01c) を作成`

### PR 説明（案）
## 概要
- Google Workspace / Sheets 連携基盤の仕様書を作成
- Wave 1 parallel タスク (01c) として位置づけ

## 主な成果物
- index.md: タスク概要・依存関係
- phase-01〜13.md: 全 Phase 仕様書
- outputs/phase-*/: 各 Phase の成果物
- outputs/phase-02/google-contract-map.md: OAuth/SA/Sheet 権限マップ
- outputs/phase-05/google-bootstrap-runbook.md: Console 操作手順
- outputs/phase-05/sheets-access-contract.md: Sheets 接続契約書
- outputs/phase-12/implementation-guide.md: 統合ガイド（Part1/2）
- outputs/phase-13/main.md: Phase 13 主成果物
- outputs/phase-13/local-check-result.md: PR 前ローカル確認結果
- outputs/phase-13/change-summary.md: 変更サマリー

## 注意
- このタスクは仕様書作成のみ（コード実装なし）
- 実際のGoogle Cloud設定はPhase 5の手順書に従い手動で実施

### 実行条件
- ユーザーの明示的な承認が必要
- Phase 11 の Smoke Test が完了していること（実際のセットアップ後）

## ユーザー承認確認文 (冒頭必須)
- この Phase はユーザーの明示承認がある場合のみ実行する。

## 変更サマリー
- docs 変更
- downstream 影響
- residual risk

## PR タイトル/本文 雛形
| 項目 | 内容 |
| --- | --- |
| title | docs(infra): finalize google-workspace-bootstrap |
| summary | task purpose / outputs / risks |

## CI チェック
- docs lint / link check / required validation を通す。

## close-out チェックリスト
- 承認あり
- local-check-result.md がある
- change-summary.md がある
- Phase 12 close-out 済み
