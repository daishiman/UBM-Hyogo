# Phase 3 — タスク分解 / 変更ファイル俯瞰

**[実装区分: 実装仕様書]**

## 1. タスク分解（SRP）

| Task ID | 単一責務 | 出力 | 推定工数 |
| --- | --- | --- | --- |
| T-01 | reminder workflow YAML 作成 | `.github/workflows/post-release-observation-reminder.yml` | S |
| T-02 | reminder Issue 起票 shell 作成 | `scripts/observation/create-reminder-issue.sh` | M |
| T-03 | Issue body テンプレ作成 | `scripts/observation/reminder-issue-template.md` | S |
| T-04 | 手動 checklist 手順作成 | `scripts/observation/check-thresholds.md` | S |
| T-05 | observation runbook 作成 | `docs/runbooks/post-release-long-term-observation.md` | M |
| T-06 | SSOT reference 作成 | `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md` | S |
| T-07 | aiworkflow indexes 更新 | `resource-map.md` / `topic-map.md` / `keywords.json` | S |
| T-08 | 09c unassigned trace 書換 | `09c-.../outputs/phase-12/unassigned-task-detection.md` | S |
| T-09 | actionlint / shellcheck セルフチェック | local 検証 | S |

## 2. 変更ファイル一覧（CONST_005 必須）

| パス | 種別 | 変更概要 |
| --- | --- | --- |
| `.github/workflows/post-release-observation-reminder.yml` | 新規 | schedule / workflow_dispatch / step 構成 |
| `scripts/observation/create-reminder-issue.sh` | 新規 | POSIX shell — offset 計算 / 冪等判定 / `gh issue create` |
| `scripts/observation/reminder-issue-template.md` | 新規 | Issue body テンプレ（plain markdown） |
| `scripts/observation/check-thresholds.md` | 新規 | 担当者向け手動 checklist |
| `docs/runbooks/post-release-long-term-observation.md` | 新規 | runbook 正本（observation / WARN / CRITICAL / silent / rollback 連携） |
| `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md` | 新規 | SSOT mirror（runbook へリンク + frontmatter） |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 編集 | operations セクションへ 1 entry 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 編集 | "post-release-long-term-observation" topic 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | `D+7`, `D+30`, `1週間観測`, `1か月観測`, `長期観測` |
| `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` | 編集 | 該当行を `consumed by issue-350-long-term-production-observation` に書換 |

## 3. 依存順

```
T-03 ─┐
T-04 ─┼─→ T-02 ─→ T-01 ─→ T-09
T-05 ─┴─→ T-06 ─→ T-07
T-08 (独立)
```

並列実行可能: {T-01,T-02,T-03,T-04,T-05,T-08}, {T-06,T-07} は T-05 後

## 4. 完了条件

- [ ] 全 Task が CONST_005 の必須項目を満たす Phase で詳細化される
- [ ] 想定変更ファイル数 = 10
- [ ] 並列可能性が明記されている
