# Phase 3 — 設計レビュー（main）

## Status

spec_created

## 0. 概要

本 Phase は、Phase 2 成果物（`outputs/phase-2/main.md` / `outputs/phase-2/design.md`）を入力として、複数代替案の比較・PASS/MINOR/MAJOR 評価・NO-GO 条件・security 観点・"pwn request" 非該当根拠を `outputs/phase-3/review.md` にレビュー記録として残す。

## 1. 入力（前提依存）

| 種別 | 入力 | 用途 |
| --- | --- | --- |
| 前 Phase | `outputs/phase-2/main.md` | 責務分離概要 |
| 前 Phase | `outputs/phase-2/design.md` | レビュー対象の設計仕様 |
| 前 Phase | `outputs/phase-1/main.md` | 命名 canonical（用語整合チェックの基準） |
| 親タスク | `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-3/review.md` | 親タスクの security 節を継承 |
| 仕様 | `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/index.md` | AC-1〜AC-9 |
| 外部 | GitHub Security Lab "preventing pwn requests" | "pwn request" パターン定義 |

> AC-6 の継承は Phase 3 でも明記（NO-GO 条件 N-1 として `review.md` に記録）。

## 2. 成果物

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-3/main.md` | 本書（概要・成果物リンク・Phase 2 参照） |
| `outputs/phase-3/review.md` | 代替案 4 案評価 / NO-GO 条件 / "pwn request" 5 箇条レビュー / security 観点 S-1〜S-5 / 用語整合チェック |

## 3. レビュー結果サマリ（詳細は review.md）

| 項目 | 結論 |
| --- | --- |
| 代替案評価 | C 案（triage 専用化 + `pull_request` への build/test 分離）を **PASS** で採択 |
| NO-GO 条件 | N-1: 親タスク Phase 2 §6 草案不継承 / N-2: UT-GOV-001 未適用 / N-3: UT-GOV-007 未適用 |
| AC 違反による NO-GO | AC-1 / AC-3 / AC-4 / AC-5 のいずれか不成立は NO-GO |
| "pwn request" 非該当 | 5 箇条すべて設計レベルで担保（Phase 9 で再検証） |

## 4. 完了条件チェック（Phase 3）

- [x] 代替案 4 案が PASS/MINOR/MAJOR で評価され、base case（C 案）が PASS で採択されている（review.md §1）。
- [x] NO-GO 条件 N-1〜N-3 が記述されている（review.md §2）。
- [x] "pwn request" 非該当の 5 箇条がレビュー記録として残っている（review.md §3）。
- [x] security review 観点 S-1〜S-5 が列挙されている（review.md §4）。
- [x] 用語整合チェック結果が記録されている（review.md §6）。

## 5. 次 Phase への引き継ぎ

Phase 4（テスト設計）は、本書および `outputs/phase-3/review.md` を入力として、fork PR / same-repo PR / labeled / scheduled / re-run のテストマトリクスを `outputs/phase-4/test-matrix.md` に確定する。
