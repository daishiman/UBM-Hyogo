# task-verify-indexes-up-to-date-ci Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | task-verify-indexes-up-to-date-ci |
| タスク種別 | implementation / NON_VISUAL |
| ワークフロー | implementation_completed_pr_pending |
| 作成日 | 2026-04-28 |
| owner | devex |
| domain | ci / skill-indexes-drift-gate |
| depends_on | task-git-hooks-lefthook-and-post-merge |
| 派生元 | task-git-hooks-lefthook-and-post-merge Phase 12 unassigned-task-detection (C-1) |
| cross_task_order | git-hooks-lefthook-and-post-merge → **verify-indexes-up-to-date-ci** → （独立 gate / 後続なし） |

## Acceptance Criteria

- AC-1: PR 作成時 / `main` push 時に `verify-indexes-up-to-date` job が自動起動し、index drift を検出する
- AC-2: drift がある場合 job が **fail** し、差分ファイル名が job ログに出力される
- AC-3: drift なし状態で false positive にならず PASS する（決定論的出力前提）
- AC-4: post-merge hook に index 再生成を戻していない（`lefthook.yml` に追加されていない）
- AC-5: 既存 CI（`ci.yml` / `backend-ci.yml` / `web-cd.yml` / `validate-build.yml`）と job 名・trigger・concurrency で衝突しない
- AC-6: workflow は `mise exec -- pnpm indexes:rebuild` 相当の Node 24 / pnpm 10.33.2 環境で実行される
- AC-7: drift 検出は `.claude/skills/aiworkflow-requirements/indexes` に限定し、`git add -N` 後の `git diff --exit-code -- <indexes>` で未追跡 index も検出する。それ以外のファイルを誤検出しない

## Phase Outputs（current canonical set）

| Phase | ファイル | 種別 | 説明 |
|---|---|---|---|
| 1 | `outputs/phase-01/main.md` | 要件 | 要件定義 |
| 2 | `outputs/phase-02/main.md` | 設計サマリ | CI workflow 構造の設計 |
| 3 | `outputs/phase-03/main.md` | 設計レビュー | レビュー結果 |
| 4 | `outputs/phase-04/main.md` | テスト戦略 | drift / non-drift / false positive シナリオ |
| 5 | `outputs/phase-05/main.md` | 実装ランブック | `.github/workflows/verify-indexes.yml` 作成手順 |
| 6 | `outputs/phase-06/main.md` | 異常系検証 | drift detection 異常系 |
| 7 | `outputs/phase-07/main.md` | AC マトリクス | AC-1〜AC-7 × test 観点 |
| 8 | `outputs/phase-08/main.md` | DRY 化 | 既存 ci.yml setup 流用方針 |
| 9 | `outputs/phase-09/main.md` | 品質保証 | 品質ゲート確認 |
| 10 | `outputs/phase-10/main.md` | 最終レビュー | Go/No-Go 判断 |
| 11 | `outputs/phase-11/main.md` | NON_VISUAL walkthrough | 文書ウォークスルー判定 |
| 11 | `outputs/phase-11/manual-smoke-log.md` | NON_VISUAL evidence | local static smoke ログ |
| 11 | `outputs/phase-11/link-checklist.md` | リンクチェック | docs リンク健全性 |
| 12 | `outputs/phase-12/main.md` | ドキュメント更新サマリ | Phase 12 サマリ |
| 12 | `outputs/phase-12/implementation-guide.md` | 実装ガイド | 概念 + 運用ランブック |
| 12 | `outputs/phase-12/system-spec-update-summary.md` | spec 更新一覧 | technology-devops-core / LOGS への反映 |
| 12 | `outputs/phase-12/documentation-changelog.md` | 変更履歴 | doc-side changelog |
| 12 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出 | follow-up（他 skill 横展開は ADR） |
| 12 | `outputs/phase-12/skill-feedback-report.md` | skill feedback | aiworkflow-requirements 反映指示 |
| 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 準拠チェック | Phase 12 仕様準拠確認 |
| 13 | `outputs/phase-13/main.md` | PR 指示書 | pending_user_approval（実行禁止） |

## 主要実装物

| ファイル | 役割 |
|---|---|
| `.github/workflows/verify-indexes.yml` | authoritative CI gate 本体（checkout → pnpm/action-setup → setup-node@Node 24 → pnpm install → pnpm indexes:rebuild → git add -N → git diff --exit-code -- indexes） |
| `package.json` `indexes:rebuild` | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` 実行口（既存・流用） |
| `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` | indexes 生成本体（既存・改変なし） |

## Skill 反映先（current canonical set）

| ファイル | 反映内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md` | CI job 表に `verify-indexes-up-to-date` を authoritative gate として追加 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | close-out sync 記録 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | wave 同期エントリ |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | drift gate 章追記 |
| `.claude/skills/task-specification-creator/LOGS.md` | NON_VISUAL Phase 11 代替証跡パターンの参照ログ |
| `CLAUDE.md` | 「よく使うコマンド」セクションで CI gate 名を最小追記 |
| `doc/00-getting-started-manual/lefthook-operations.md` | post-merge 廃止後の drift authoritative gate を CI に集約することを明示 |

## Follow-up 未タスク

| 未タスク | 概要 | 起票元 |
|---|---|---|
| 他 skill indexes drift 横展開判定（ADR） | task-specification-creator など他 skill の indexes に drift gate を波及させるか ADR で別途決める | `outputs/phase-12/unassigned-task-detection.md` |
| GitHub Actions 実機 PASS 確認 | PR 後に `verify-indexes-up-to-date` job が実機で PASS することの確認は Phase 13 後 | `outputs/phase-11/main.md` |

## Validation Chain（implementation_completed_pr_pending）

| 検証項目 | 結果 |
|---|---|
| Phase 1〜13 outputs 揃っているか | PASS |
| Phase 11 NON_VISUAL evidence（main / manual-smoke-log / link-checklist の3点）固定 | PASS |
| Phase 12 canonical 7 成果物 | PASS |
| Phase 13 user approval required | PENDING（pending_user_approval） |
| skill 反映 5 点セット（technology-devops-core / LOGS / SKILL-changelog / topic-map / task-specification-creator LOGS） | PASS |
| `pnpm indexes:rebuild` 後の `git diff --exit-code -- indexes` | drift なし |
| `bash -n scripts/reinstall-lefthook-all-worktrees.sh` | PASS |
