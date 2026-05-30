# Phase 12: ドキュメント同期（トップ index）

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
|------|-----|
| task_id | `web-worker-size-limit-fix` |
| task_type | `implementation` |
| visual_category | `NON_VISUAL` |
| canonical_workflow | `docs/30-workflows/completed-tasks/web-worker-size-limit-fix/` |

## 目的

Phase 12 の strict 7 必須タスクへの誘導 index。Worker gzip サイズ 3316KiB > 3072KiB 超過の解消（Task A: next/og 撤去 + 静的 OG 画像化、Task B: production minify 維持 + CI サイズ gate）に伴うドキュメント同期を集約する。

## 実行タスク（strict 7 への誘導）

| # | ファイル | 役割 |
|---|---------|------|
| 1 | [main.md](./main.md) | Phase 12 トップ index（本ファイル） |
| 2 | [implementation-guide.md](./implementation-guide.md) | Part1 概念説明 + Part2 技術者向け Task A/B 詳細 |
| 3 | [system-spec-update-summary.md](./system-spec-update-summary.md) | 正本仕様への反映方針 |
| 4 | [documentation-changelog.md](./documentation-changelog.md) | 本 workflow 生成物の列挙 |
| 5 | [unassigned-task-detection.md](./unassigned-task-detection.md) | 未タスク検出（1 件） |
| 6 | [skill-feedback-report.md](./skill-feedback-report.md) | 3 観点フィードバック |
| 7 | [phase12-task-spec-compliance-check.md](./phase12-task-spec-compliance-check.md) | canonical 9 見出し準拠検証 |

## 参照資料

- `docs/00-getting-started-manual/specs/08-free-database.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`

## 実行手順

1. 上記 7 ファイルを順に確認する。
2. compliance-check で canonical 9 見出し充足を確認する。

## 多角的チェック観点（AIが判断）

- strict 7 が全て present であること。
- artifacts.json（root + outputs mirror）が一致すること。

## サブタスク管理

| サブタスク | 状態 |
|-----------|------|
| Task A: next/og 撤去 | implemented_local_evidence_captured |
| Task B: production minify 維持 + size gate | implemented_local_evidence_captured |

## 成果物

- strict 7 ファイル一式

## 完了条件

- [ ] strict 7 が揃っている
- [ ] compliance-check が canonical 9 見出しを満たす

## タスク100%実行確認【必須】

- [ ] strict 7 への誘導を漏れなく記載した
- [ ] unassigned-task-detection を出力した

## 次Phase

Phase 13（commit-pr-release、user-gated）。
