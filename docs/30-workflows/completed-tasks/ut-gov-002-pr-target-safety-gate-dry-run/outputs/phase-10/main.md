# Phase 10 — 最終レビュー（main）

## Status

spec_created

## 0. 目的

Phase 1〜9 の総和をレビュアー視点で再点検し、**Go / No-Go 判定**を `outputs/phase-10/go-no-go.md` に記録する。Phase 13 ユーザー承認ゲートに進む前段の最終レビューとして機能する。

本タスクは docs-only / NON_VISUAL の dry-run specification 整備タスクであり、本 Phase の **GO** は「仕様書整備の完了」を意味する（dry-run 実走は別 PR / 後続実装タスクで行う、AC-8）。

## 1. 入力

| 種別 | 入力 | 用途 |
| --- | --- | --- |
| 仕様 | `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-10.md` | 完了条件・GO/NO-GO 判定基準の正本 |
| 受入条件 | `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/index.md` AC-1〜AC-9 | 判定基準 |
| レビュー | `outputs/phase-3/review.md` | NO-GO 条件 N-1〜N-3、AC 違反追加 NO-GO の根拠 |
| **実装ランブック** | `outputs/phase-5/runbook.md` | AC-9 ロールバック設計の最終確認入力（Phase 5 runbook を入力とする） |
| カバレッジ | `outputs/phase-7/coverage.md` | AC × Phase クロス整合の根拠 |
| 品質ゲート | `outputs/phase-9/quality-gate.md` | AC 充足エビデンス・G-1〜G-7・実走必須 M-1〜M-3 の根拠 |
| 運用ポリシー | `CLAUDE.md` | solo 運用 / レビュアー 0 名 / CI gate での品質担保 |

> 本 Phase は **Phase 5 runbook.md** を入力として、AC-9 ロールバック設計（単一 revert コミット粒度・required status checks 名のドリフト防止）が runbook に実走可能な粒度で記述されているかを最終確認する。

## 2. 最終レビューの構成

詳細は `go-no-go.md` を参照。本 main.md は構造のみ記述。

- **AC × 証跡 × 判定** の 3 列表（AC-1〜AC-9）
- **GO 判定基準** の明示
- **NO-GO 条件** の独立表（base case 由来 N-1〜N-3 ＋ AC 違反追加）
- **ロールバック設計の最終確認**（AC-9）
- **残課題 / unassigned-task 候補** の予約（dry-run 実走 / secrets 棚卸し自動化 / `workflow_run` 将来検討）
- **レビュアー指定方針**: solo 開発のため必須レビュアー数 0、CI gate / 線形履歴 / 会話解決必須 / force push 禁止 で品質担保（CLAUDE.md 準拠）
- **最終 GO/NO-GO 判定欄**

## 3. 統合テスト連携

最終レビューは docs に閉じる。dry-run 実走は後続実装タスクで実行する。

## 4. 完了条件チェック（Phase 10）

- [x] go-no-go.md に AC × 証跡 × 判定の 3 列表が記述されている
- [x] MAJOR 0 件・AC 9/9 PASS が記録されている
- [x] GO 判定基準（全 AC PASS / 全 NO-GO 条件未抵触 / 親タスク継承確認 / artifacts.json 整合）が明示されている
- [x] NO-GO 条件（親タスク Phase 2 §6 草案不継承 / AC-1 違反 / AC-9 ロールバック設計欠落 ほか）が独立表として記述されている
- [x] ロールバック設計（AC-9）が最終確認されている
- [x] 残課題候補が unassigned-task 候補として末尾に予約されている
- [x] レビュアー指定方針（solo 0 名 + CI gate）が再確認されている
- [x] Go / No-Go 判定が明示的に記録されている
- [x] commit / push / PR 作成は行わない

## 5. 次 Phase への引き継ぎ

Phase 11 は本 main.md / go-no-go.md を入力として、手動 smoke（リンクチェック中心）と `outputs/phase-11/manual-smoke-log.md` / `link-checklist.md` を確定する。
