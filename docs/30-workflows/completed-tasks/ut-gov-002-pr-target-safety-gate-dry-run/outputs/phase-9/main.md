# Phase 9 — 品質保証（main）

## Status

spec_created

## 0. 目的

Phase 1〜8 の成果物を **quality gate** で総点検し、AC-1〜AC-9 / 観点 coverage / セキュリティレビュー / 用語整合のすべてが PASS であることを確認する。docs-only タスクの quality gate は「文書整合 + 仕様の実行可能性」を保証する。

## 1. 入力

| 種別 | 入力 | 用途 |
| --- | --- | --- |
| 仕様 | `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-09.md` | 完了条件・G-1〜G-7 の正本 |
| 受入条件 | `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/index.md` AC-1〜AC-9 | 充足エビデンス表の根拠 |
| 設計 | `outputs/phase-2/design.md` | AC-1 / AC-2 / AC-5 / AC-9 の充足箇所 |
| レビュー | `outputs/phase-3/review.md` | AC-4（"pwn request" 非該当）/ S-1〜S-5 の根拠 |
| テスト設計 | `outputs/phase-4/test-matrix.md` | AC-1 / AC-3 の充足箇所 |
| **実装ランブック** | `outputs/phase-5/runbook.md` | AC-2 / AC-5 / AC-9 の充足箇所（Phase 5 runbook を入力とする） |
| 失敗ケース | `outputs/phase-6/failure-cases.md` | FC-1〜FC-8 / G-2 の根拠 |
| カバレッジ | `outputs/phase-7/coverage.md` | AC × Phase クロスチェックの根拠 |
| リファクタ | `outputs/phase-8/before-after.md` | G-5（用語整合）/ G-6（リンク）の根拠 |

> 本 Phase は **Phase 5 runbook.md を入力** とし、AC-2 / AC-5 / AC-9 が runbook で実走可能な粒度に達しているかを検証する。

## 2. quality gate の構成

詳細は `quality-gate.md` を参照。本 main.md は構造のみ記述。

- **AC 充足エビデンス表**: AC-1〜AC-9 の各行に「充足箇所（Phase 2/3/4/5/6/7 のいずれか）」「エビデンス path」「PASS/MINOR/MAJOR」を記録
- **G-1〜G-7 ゲート評価**: AC 充足 / 失敗ケース MAJOR 0 件 / security 観点 / NO-GO 解消 / 用語整合 / リンク切れ / artifacts.json 同期
- **security 節**: "pwn request" 非該当 5 箇条 / secrets 棚卸し / GITHUB_TOKEN scope の三項目
- **fork PR token 非露出証跡**（AC-3）: test-matrix と failure-cases から該当行を抽出
- **permissions / persist-credentials / 最小権限の三重明記確認**（AC-5）: design / runbook / quality-gate の 3 箇所で同一方針が記述されていることを確認
- **実走必須項目 M-1〜M-3 の再確認欄**: 後続実装タスクが埋める枠を確保

## 3. 通過条件

- MAJOR 0 件
- MINOR は許容（FC-7 / FC-8 の運用補強系のみ）
- AC-1〜AC-9 全て PASS
- 不通過時は該当 Phase（2/3/4/5/6 のいずれか）に差し戻し、修正後に Phase 9 を再評価

## 4. 統合テスト連携

dry-run 実走は後続実装タスクで実行する。本 Phase は **仕様の実行可能性**（実走時に必要な情報が漏れていないか）を保証することに専念する。

## 5. 完了条件チェック（Phase 9）

- [x] quality-gate.md に G-1〜G-7 が PASS / MINOR / MAJOR で評価されている
- [x] AC-1〜AC-9 の充足エビデンス表が記述されている
- [x] "pwn request" 非該当のレビュー記録（AC-4）が記述されている
- [x] permissions / persist-credentials / 最小権限の重複明記確認（AC-5）が記述されている
- [x] fork PR シナリオでの token 非露出証跡（AC-3）が記述されている
- [x] MAJOR 0 件、MINOR は許容範囲内であることが記録されている
- [x] gate 不通過時の戻り先ルールが記述されている
- [x] 実走必須 M-1〜M-3 の再確認欄が確保されている
- [x] commit / push / PR 作成は行わない

## 6. 次 Phase への引き継ぎ

Phase 10 は本 main.md / quality-gate.md を入力として、最終 Go / No-Go 判定を `outputs/phase-10/go-no-go.md` に記録する。
