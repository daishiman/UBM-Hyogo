# Phase 6 — テスト拡充（main）

## Status

spec_created

## 0. 役割

Phase 4 の主要シナリオ（T-1〜T-5）に加え、**境界条件・失敗ケース・エッジケース**を `outputs/phase-6/failure-cases.md` で FC-1〜FC-11 として列挙し、後続実装タスクの dry-run 実走時に safety gate が想定通り防御できることを検証可能な状態にする。

## 1. 入力の継承

| 入力パス | 用途 |
| --- | --- |
| `outputs/phase-4/test-matrix.md` | 主要シナリオ T-1〜T-5 / 静的検査 / F-1〜F-4 |
| `outputs/phase-5/runbook.md` | Step 4 / Step 5 / Step 6 検査コマンド（FC 検出に流用） |
| `outputs/phase-3/review.md` §3 / §4 | "pwn request" 非該当 5 箇条 / S-1〜S-5 |
| `outputs/phase-2/design.md` §4 | 5 箇条設計上の保証 |
| GitHub Security Lab "Preventing pwn requests" | エッジケース母集合 |

> Phase 5 runbook を入力としていることを明示することで、verification-report の consistency warning を解消する。

## 2. 成果物

- `outputs/phase-6/main.md`（本書）
- `outputs/phase-6/failure-cases.md`（FC-1〜FC-11、検出手段 3 系統、回帰防止チェックリスト、レポート規約）

## 3. 設計方針

| 観点 | 方針 |
| --- | --- |
| **失敗ケース粒度** | pwn request 試行 / fork からの secrets exfiltration 試行 / labeled trigger 競合 / scheduled trigger 残存 token / persist-credentials 漏れ / `permissions:` 過剰昇格 を最小単位として 11 件列挙 |
| **検出手段** | 各 FC について (a)静的（actionlint / yq / grep）、(b)動的（dry-run logs）、(c)レビュー（PR diff チェックリスト）の 3 系統で記述 |
| **重大度分類** | FC-1〜FC-6 は MAJOR（F-1〜F-4 のいずれかに射影）、FC-7〜FC-11 は MINOR または条件付 MAJOR |
| **回帰防止** | 将来 PR で `pull_request_target` を編集する際の reviewer チェックリスト 5 項目 |
| **レポート規約** | 失敗ケース検出 → GitHub Issue 起票 → security ラベル付与 → 担当割当の通知フロー |

## 4. 完了条件チェック（Phase 6）

- [x] FC-1〜FC-11 が列挙されている（最低 8 件、実際 11 件）。
- [x] 各 FC に静的 / 動的 / レビューの 3 検出手段が記述されている。
- [x] MAJOR / MINOR の分類が固定されている。
- [x] 回帰防止チェックリスト 5 項目が記述されている。
- [x] レポート規約が記述されている。
- [x] Phase 5 runbook を input として明示している。

## 5. 次 Phase への引き継ぎ

Phase 7（カバレッジ確認）は本書および failure-cases.md を入力として、`outputs/phase-7/coverage.md` に AC × 観点（T / FC / S / N）の 2 次元マトリクスを構築する。
