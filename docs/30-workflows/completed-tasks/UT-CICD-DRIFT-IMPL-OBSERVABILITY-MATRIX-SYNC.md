# UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC

```yaml
issue_number: 286
task_id: UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC
task_name: Observability matrix workflow name sync
category: 改善
target_feature: CI/CD observability matrix
priority: 高
scale: 小規模
status: transferred_to_workflow
source_phase: UT-CICD-DRIFT Phase 12
created_date: 2026-04-29
dependencies: [#58]
```

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC |
| 親タスク | UT-CICD-DRIFT |
| 起源 drift | DRIFT-06 |
| workflow_state | spec_created |
| 優先度 | HIGH |
| 分類 | docs-impl（observability-matrix.md の workflow 名同期） |
| 起票日 | 2026-04-29 |
| 移管先 | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/` |

> 2026-05-01: 本未タスクは `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/` に仕様化済み。二重管理を避けるため、このファイルは起票履歴として残し、実行仕様は移管先を正本とする。

## 親タスク背景

05a `observability-matrix.md` は `ci.yml` / `validate-build.yml` のみを列挙しており、現実体の 5 yaml（`web-cd.yml` / `backend-ci.yml` / `verify-indexes.yml` を欠く）と drift。UT-CICD-DRIFT は本範囲を派生委譲とした。

## 範囲

1. `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/` 配下の `observability-matrix.md` を SSOT に同期
2. 監視対象 workflow に以下を追加:
   - `web-cd.yml`（deploy 監視 / Discord 通知未実装である旨の current facts 注記）
   - `backend-ci.yml`（同上）
   - `verify-indexes.yml`（drift gate）

## 不変条件 reaffirmation

| # | 不変条件 | 適用 |
| --- | --- | --- |
| #5 | D1 への直接アクセスは apps/api に閉じる | 影響なし（docs-only） |
| #6 | GAS prototype を本番昇格しない | 影響なし |

## 受入条件

- [ ] AC-1: `observability-matrix.md` に 5 workflow すべてが列挙される
- [ ] AC-2: 各 workflow の現実体 trigger / job 構造が記述される
- [ ] AC-3: Discord 通知未実装の workflow は current facts 注記が追加される
- [ ] AC-4: `documentation-changelog` に同期記録が残る

## 苦戦箇所【記入必須】

- 05a は completed-tasks 配下へ移設済みで、古い `docs/05a-...` path 参照が混ざりやすい。
- workflow ファイル名、workflow display name、job id、required status context が別物なので、同一名として扱うと監視対象がずれる。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 存在しない workflow を監視し続け、cost guardrail が実効性を失う | 現行 5 yaml を SSOT とし、旧名は mapping 表で解消する |
| UT-GOV-001 の required status checks と異なる名前を正本化する | UT-GOV-001 / UT-GOV-004 の status context 表と照合してから更新する |

## 検証方法

- `rg -n "ci\\.yml|backend-ci\\.yml|validate-build\\.yml|verify-indexes\\.yml|web-cd\\.yml|workflow|job" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails .github/workflows .claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- GitHub Actions の workflow file name と status context 名を分けて表に記録する。

## スコープ（含む/含まない）

| 含む | 含まない |
| --- | --- |
| 05a observability matrix の workflow 名同期、旧 path 参照の解消、監視対象表の更新 | 新規監視 workflow 追加、Discord / Slack 通知実装、branch protection required checks の変更 |

## 委譲先 / 関連

- 関連: 05a observability completed-tasks
- 関連: UT-CICD-DRIFT (親)
