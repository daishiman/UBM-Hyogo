# UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY

```yaml
issue_number: 288
task_id: UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY
task_name: Reusable quality workflow extraction
category: 改善
target_feature: GitHub Actions quality gates
priority: 中
scale: 中規模
status: 未実施
source_phase: UT-CICD-DRIFT Phase 12
created_date: 2026-04-29
dependencies: [#58]
```

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY |
| 親タスク | UT-CICD-DRIFT |
| 起源 drift | DRIFT-04(b) |
| workflow_state | spec_created |
| 優先度 | MEDIUM |
| 分類 | impl-required（reusable workflow 化） |
| 起票日 | 2026-04-29 |

## 親タスク背景

`typecheck` / `lint` / `coverage-gate` job が `ci.yml` / `validate-build.yml` に重複しており、reusable workflow 化することで SSOT を 1 箇所に集約できる。UT-CICD-DRIFT は drift 検出のみとし、本派生で扱う。

## 範囲

1. `.github/workflows/_quality.yml`（仮）として `workflow_call` reusable workflow を作成
2. inputs: `node-version` / `pnpm-version` / `coverage-threshold` / `coverage-mode (soft/hard)`
3. `ci.yml` / `validate-build.yml` から `uses: ./.github/workflows/_quality.yml` で呼び出し

## 不変条件 reaffirmation

| # | 不変条件 | 適用 |
| --- | --- | --- |
| #5 / #6 | 影響なし | — |

## 受入条件

- [ ] AC-1: reusable workflow が typecheck / lint / coverage を一括実行
- [ ] AC-2: 呼び出し側 yaml の job 重複が解消
- [ ] AC-3: branch protection の `required_status_checks` 名が壊れない（UT-GOV-001 同期確認）

## 苦戦箇所【記入必須】

- reusable workflow は便利だが、caller / callee 間の permissions と secrets 境界を誤ると過剰権限になりやすい。
- quality gate の見た目が似ていても、PR 用と push 用で失敗時の意味が異なる。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| reusable workflow に secrets を広く渡してしまう | `secrets: inherit` を避け、必要な入力だけを明示する |
| PR gate と deploy 前 gate の責務が混ざる | gate 種別を PR quality / build validation / deploy preflight に分けて設計する |

## 検証方法

- `rg -n "typecheck|lint|coverage|workflow_call|secrets:|permissions:" .github/workflows`
- reusable workflow 採用時は caller ごとの permissions / inputs / outputs を表で確認する。

## スコープ（含む/含まない）

| 含む | 含まない |
| --- | --- |
| quality gate 棚卸し、reusable workflow 化の採否判断 | coverage 閾値変更、deploy workflow の本番権限変更、branch protection の直接適用 |

## 委譲先 / 関連

- 関連: UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP / UT-GOV-001
