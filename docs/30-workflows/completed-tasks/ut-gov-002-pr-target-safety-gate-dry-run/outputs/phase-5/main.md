# Phase 5 — 実装ランブック（main）

## Status

spec_created

## 0. 役割

本 Phase は **後続実装タスクが従う手順書（runbook）の仕様化**に閉じる。本タスク（docs-only）の中で workflow 編集 / dry-run 実走 / secrets review は行わない（AC-8）。

## 1. 入力の継承

| 入力パス | 用途 |
| --- | --- |
| `outputs/phase-1/main.md` | 真の論点 / リスク / 用語集 |
| `outputs/phase-2/design.md` §3 / §5 | safety gate 草案 YAML（移植母本）/ ロールバック設計 |
| `outputs/phase-3/review.md` §2 / §4 / §5 | NO-GO 条件 N-1〜N-3 / S-1〜S-5 / ロールバック検証 |
| `outputs/phase-4/test-matrix.md` | 静的検査コマンド・dry-run シナリオ・F-1〜F-4 |
| `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-5/runbook.md` | 親タスク runbook（snapshot 取得 / branch protection / actionlint コマンド母本） |
| `docs/30-workflows/completed-tasks/UT-GOV-007-github-actions-action-pin-policy.md` | `uses:` SHA pin 前提 |

> 親タスク runbook を input としていることを明示することで、verification-report の consistency warning を解消する。

## 2. 成果物

- `outputs/phase-5/main.md`（本書）
- `outputs/phase-5/runbook.md`（Step 1〜6、ロールバック、red lines、連携タスク）

## 3. AC トレーサビリティ

| AC | runbook 該当箇所 |
| --- | --- |
| AC-2: untrusted build を `pull_request` に分離・`contents: read` のみ | runbook Step 3（草案反映）/ Step 4（yq 検査） |
| AC-5: `permissions: {}` ＋ job 単位昇格 ＋ 全 checkout `persist-credentials: false` | runbook Step 4 の 3 コマンド |
| AC-9: ロールバック設計（単一 revert コミット粒度） | runbook §"ロールバック手順" |

## 4. 完了条件チェック（Phase 5）

- [x] runbook.md に Step 1〜6 が記述されている。
- [x] ロールバック手順（単一 revert コミット）が記述されている。
- [x] 役割分担（docs-only vs 実装タスク）が冒頭に明記されている。
- [x] red lines（force push / admin override / secrets 露出）が列挙されている。
- [x] 連携タスクへの参照が末尾に配置されている。
- [x] 親タスク runbook を input として明示している。

## 5. 次 Phase への引き継ぎ

Phase 6（テスト拡充）は本書および runbook.md を入力として、`outputs/phase-6/failure-cases.md` に FC-1〜FC-11 と検出手段（静的・動的・レビュー）、回帰防止チェックリスト、レポート規約を確定する。
