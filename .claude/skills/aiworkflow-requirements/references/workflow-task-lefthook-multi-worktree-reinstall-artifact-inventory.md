# task-lefthook-multi-worktree-reinstall-runbook Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | task-lefthook-multi-worktree-reinstall-runbook |
| タスク種別 | DevEx / Operations / runbook（Phase 1-13 形式不要） |
| ワークフロー | completed |
| 作成日 | 2026-04-28 |
| owner | devex |
| domain | git-hook / multi-worktree |
| depends_on | task-git-hooks-lefthook-and-post-merge / task-worktree-environment-isolation |
| 派生元 | task-git-hooks-lefthook-and-post-merge Phase 12 unassigned-task-detection (B-1 follow-up) |
| cross_task_order | git-hooks-lefthook-and-post-merge → worktree-environment-isolation → **lefthook-multi-worktree-reinstall-runbook**（運用化補完） |

## Acceptance Criteria

- AC-1: `scripts/reinstall-lefthook-all-worktrees.sh` が存在し実行可能
- AC-2: `--dry-run` が対象 path と PASS / SKIP 予定を表示し、`.git/hooks/*` を変更しない
- AC-3: FAIL 0 件で、対象 worktree 全件が PASS または理由付き SKIP として記録されている
- AC-4: `doc/00-getting-started-manual/lefthook-operations.md` に運用化セクション（実行責任者・実行タイミング・ログ保存方針）がある
- AC-5: post-merge hook を復活させていない（`lefthook.yml` 差分で確認）
- AC-6: 並列実行を禁止し、逐次 install で pnpm store 同時書き込み破壊を回避する

## Phase Outputs（Phase 形式不要 / runbook 完了形式）

本タスクは runbook 形式の operations タスクであり、Phase 1-13 outputs は持たない。
完了記録は以下に集約する。

| ファイル | 種別 | 説明 |
|---|---|---|
| `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook.md` | 元タスク指示書 + 拡充記録 | Why / What / How / 実行手順（4 phase 構成） / 完了条件 / 苦戦箇所 / 検証方法 / リスク / 参照情報 |

## 主要実装物

| ファイル | 役割 |
|---|---|
| `scripts/reinstall-lefthook-all-worktrees.sh` | `git worktree list --porcelain` から path 抽出 → 各 path で `mise exec -- pnpm exec lefthook install` を逐次実行 → PASS / SKIP / FAIL summary 出力 / dry-run / FAIL≥1 で exit 1 |
| `doc/00-getting-started-manual/lefthook-operations.md` | 「既存 worktree への一括 install」運用化セクション（実行責任者 / 実行タイミング / ログ保存方針） |

## Skill 反映先（current canonical set）

| ファイル | 反映内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-lefthook-unification-2026-04.md` | L-LH-MW-001（並列禁止）/ L-LH-MW-002（SKIP 許容と manual-smoke-log への転記運用契約）/ L-LH-006（hook=read-only / CI=drift authoritative gate の責務分離） |
| `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md` | lefthook 一括 install runbook の存在を Git hook 運用正本に追記 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-completed-recent-2026-04d.md` | 完了タスク entry |
| `CLAUDE.md` | 「よく使うコマンド」セクションへの導線確認 |

## 参照される実装ファイル

| ファイル | 役割 |
|---|---|
| `lefthook.yml` | hook 正本（post-merge 復活していないことの参照点） |
| `package.json` `prepare` script | `pnpm install` で `lefthook install` を自動配置（新規 worktree 用） |
| `scripts/hooks/` | lefthook から呼ばれる hook 実体 |

## Follow-up 未タスク

| 未タスク | 概要 | 起票元 |
|---|---|---|
| 一括 install 結果の定期検証タスク | lefthook.yml 改定時に各 worktree で `lefthook version` が PASS することの定期確認 | 元タスク指示書 §7 リスク表 |
| stale worktree の prune 判断ガイド | `git worktree prune` を runbook に組み込むかの別判断 | 元タスク指示書 §6 失敗時の切り分け |

## Validation Chain（runbook completed）

| 検証項目 | 結果 |
|---|---|
| `scripts/reinstall-lefthook-all-worktrees.sh` 存在 + 実行可能 | PASS |
| `bash -n scripts/reinstall-lefthook-all-worktrees.sh`（syntax） | PASS |
| `bash scripts/reinstall-lefthook-all-worktrees.sh --dry-run`（path 列挙 + 非破壊） | PASS |
| 本実行で FAIL 0 件 / 理由付き SKIP 許容 | PASS |
| `lefthook.yml` に post-merge 復活がないこと | PASS |
| `doc/00-getting-started-manual/lefthook-operations.md` 運用化記載 | PASS |
| skill 反映（lessons-learned-lefthook-unification-2026-04 / technology-devops-core / task-workflow-completed-recent-2026-04d） | PASS |
