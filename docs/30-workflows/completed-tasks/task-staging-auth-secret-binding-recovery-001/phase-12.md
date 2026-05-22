# Phase 12: ドキュメント更新（6 成果物）

[実装区分: 実装仕様書]

## 必須 strict 7 成果物

| # | path | 内容 |
|---|------|------|
| 1 | `outputs/phase-12/main.md` | Phase 12 close-out summary |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル概念説明 + Part 2 技術詳細 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/1-B/1-C 結果記録 |
| 4 | `outputs/phase-12/documentation-changelog.md` | 全 Step 結果（該当なし含む） |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 残課題（0 件でも出力必須） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | テンプレート / ワークフロー改善点 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 root evidence |

## Part 1（中学生レベル）テンプレ概要

- 例え話: 「家の鍵（AUTH_SECRET）をなくしたら家族（admin endpoint）が誰も入れなくなる。鍵の予備（zod 検証 / CI smoke）を用意しておけば、無くした瞬間に警報（構造化ログ）が鳴る」
- なぜ必要か → 何をするか の順で説明

## Part 2（技術者レベル）必須項目

- `requireAdmin` middleware の falsy 検知 + logError スキーマ
- `apps/api/src/env.ts` の zod schema 抜粋（AUTH_SECRET min(32)）
- `runtime-attendance-provider.sh` の auth misconfigured 検知 grep
- `backend-ci.yml` auth-gate step YAML
- `scripts/cf.sh` empty guard 抜粋

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。`outputs/phase-08/curl-*.txt` と `outputs/phase-07/test.log` を代替証跡とする。

## Step 1-A / 1-B / 1-C 対象

- 1-A: `docs/30-workflows/completed-tasks/` への移管、両 LOGS.md 更新、topic-map 更新
- 1-B: 実装状況テーブルに `completed` を記録
- 1-C: 誤診断 workflow `task-runtime-smoke-admin-members-500-recovery-001` の関連タスクテーブルを `superseded_by_root_cause_fix` に更新

## Step 2（システム仕様更新）

- 新規 IPC surface: なし
- 新規定数: `UBM-AUTH-SECRET-MISSING` 構造化ログ code を `require-admin.ts` / aiworkflow lessons / artifact inventory に反映
- → Step 2 **完了**（正本同期済み）

## Phase 12 DoD

- strict 7 成果物すべて存在
- Part 1/Part 2 構成を満たす
- documentation-changelog に全 Step 結果記録
- unassigned-task-detection が 0 件でも出力
