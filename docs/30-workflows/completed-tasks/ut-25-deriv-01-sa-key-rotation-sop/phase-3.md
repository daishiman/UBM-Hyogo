[実装区分: 実装仕様書]

# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-25-DERIV-01 |
| 前提 Phase | Phase 2（設計 完了） |
| 次 Phase | Phase 4（テスト作成 TDD RED） |
| 判定 | PASS / MINOR 1 件 / MAJOR 0 件 |

## 目的

Phase 2 で確定した設計を 4 条件（価値性 / 実現性 / 整合性 / 運用性）でレビューし、Phase 4 開始条件を確定する。simpler alternative の検討結果と PASS / MINOR / MAJOR の戻り先を明示する。

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | SA key 漏洩リスクを構造的に低減（90 日固定ローテーション）。Google IAM ベストプラクティス遵守。漏洩時の blast radius を 90 日窓に限定 |
| 実現性 | PASS | 既存 `scripts/cf.sh` / `op` / bats / shellcheck が揃っており新規依存ゼロ。helper は単独 bash と focused tests で検証可能 |
| 整合性 | PASS | CLAUDE.md「Cloudflare 系 CLI 実行ルール」「ローカル `.env` 運用ルール」「シークレット管理」と完全整合。stub の AC・完了条件 9 件と 1:1 対応 |
| 運用性 | PASS | SOP + 完了記録テンプレ + helper dry-run で再現可能。`check-cf-rotation-reminder.sh` との責務分離も明確 |

## simpler alternative 検討

| 案 | 評価 | 不採用理由 |
| --- | --- | --- |
| (1) helper を作らず SOP markdown だけで運用 | 不採用 | 苦戦箇所 4「stdin パイプ強制 + HISTFILE=/dev/null」を人手だけで守るのは事故率が高い。bats で機械的に保証する必要あり |
| (2) GitHub Actions で自動ローテ | 不採用 | UT-25-DERIV-04 のスコープ（将来）。MVP では半自動 helper + SOP で十分 |
| (3) `cf.sh` に subcommand 追加 | 不採用 | Phase 2 §2.2 の比較表通り。`cf.sh` の単一責務を保つ |
| (4) fingerprint を SHA-256 full（64 桁）で記録 | 不採用 | 識別には 16 桁で十分。長すぎると記録ノイズ。情報漏洩は SHA-256 一方向性で塞がる |

## MINOR 追跡

| MINOR ID | 指摘 | 解決予定 Phase | 解決確認 Phase |
| --- | --- | --- | --- |
| MINOR-01 | `wrangler tail` の 60 秒待機は固定値だが、本来 Workers の最大処理時間（CPU time / wall clock）から導出すべき。MVP では 60 秒固定で出すが、運用知見が溜まったら再評価する旨を SOP §6 と Phase 12 unassigned-task-detection に記録 | Phase 5（SOP §6 注記） | Phase 10 |

MAJOR は 0 件。

## Phase 4 開始条件

- [x] Phase 1〜3 が `spec_created` で確定
- [x] AC-1〜AC-12 が phase-1.md に固定
- [x] state machine と helper API が phase-2.md に固定
- [x] MINOR-01 の解決計画が記録されている

## Phase 13 blocked 条件

- AC-1〜AC-12 のいずれかが Phase 10 で未充足
- bats テスト / shellcheck が Phase 9 で fail
- 実 secret 値が成果物に混入

## 成果物

- 本 phase-3.md

## 完了条件

- [ ] 4 条件全 PASS
- [ ] simpler alternative 4 案の比較結果が記録されている
- [ ] MINOR-01 が追跡テーブルに登録されている
- [ ] Phase 4 開始条件 4 件が満たされている

## 次 Phase

Phase 4（テスト作成 TDD RED）
