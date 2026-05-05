# Phase 5 — 実装ランブック（main）

## Status

spec_created

> 本書は Phase 5 の概要であり、実装手順本体は `outputs/phase-5/runbook.md`、静的検査ログテンプレは `outputs/phase-5/static-check-log.md`、実 workflow ファイルは `.github/workflows/pr-target-safety-gate.yml` / `.github/workflows/pr-build-test.yml` を参照する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 5 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| GitHub Issue | #204 |

## 0. 入力の継承

| 入力 | 用途 |
| --- | --- |
| `outputs/phase-2/design.md` §2〜§6 | 実 workflow YAML 構造 / required status checks 同期方針 |
| `outputs/phase-3/review.md` §3〜§5 | "pwn request" 非該当 5 箇条 / S-1〜S-6 / ロールバックレビュー |
| `outputs/phase-4/test-matrix.md` | 静的検査 5 コマンド / 動的検査 D-1〜D-6 / F-1〜F-5 |
| 上流 dry-run `phase-5/runbook.md` | Step 1〜6 の母本（本タスクで Step 7 = required status checks 同期を追加） |

## 1. 本 Phase 成果物

| 成果物 | 役割 |
| --- | --- |
| `outputs/phase-5/runbook.md` | Step 1〜7 / ロールバック / red lines / 連携タスク |
| `outputs/phase-5/static-check-log.md` | actionlint / yq×2 / grep×2 の実走結果テンプレ |
| `.github/workflows/pr-target-safety-gate.yml` | triage workflow（`pull_request_target` ＋ `pull-requests: write` のみ） |
| `.github/workflows/pr-build-test.yml` | untrusted build workflow（`pull_request` ＋ `contents: read` のみ） |

## 2. 本 Phase の責務

- `outputs/phase-5/runbook.md` で Step 1〜7（事前確認 / 棚卸し / 実 workflow 編集 / 静的検査 / dry-run 実走 / VISUAL 取得 / required status checks 同期）を確定する。
- `.github/workflows/pr-target-safety-gate.yml` と `.github/workflows/pr-build-test.yml` を Phase 2 design.md §3 の YAML を実投入形に整え、`spec_created` 時点では **ファイル作成のみ・commit / push / PR 作成は行わない**。
- 静的検査・動的検査・VISUAL 取得は Phase 13 ユーザー承認後に実走する。本 Phase ではテンプレと期待結果のみ固定する。

## 3. 制約（red lines の入口）

- `force push to main / dev` 禁止
- branch protection の admin override 禁止（`enforce_admins=false` 化禁止）
- secrets 値を runbook / ログに転記しない
- `pull_request_target` workflow への `actions/checkout` で PR head 参照禁止
- `workflow_run` 経由で fork PR build に secrets を橋渡しする変更禁止

詳細は `outputs/phase-5/runbook.md` §「Red Lines」を参照。

## 4. 次 Phase への引き継ぎ

- Phase 6（テスト拡充）: F-1〜F-5 の各失敗条件の追加 fixture / negative case を `outputs/phase-6/failure-cases.md` に展開。
- Phase 9（QA）: `outputs/phase-5/static-check-log.md` を再走させ、`outputs/phase-9/quality-gate.md` の Static check 節へ転記。
- Phase 11（手動テスト）: D-1〜D-6 を `outputs/phase-11/manual-smoke-log.md` に転記、screenshots 確定。
- Phase 13（完了確認）: ユーザー承認 → 単一 commit / 単一 PR / 単一 revert 粒度を維持して merge。

## 5. 完了条件チェック

- [x] runbook.md / static-check-log.md / 実 workflow 2 ファイルの責務分離を §1 に明記
- [x] commit / push / PR 作成は本 Phase で行わないことを §2 に明記
- [x] red lines の入口を §3 に列挙
- [x] 次 Phase への引き継ぎを §4 に列挙
