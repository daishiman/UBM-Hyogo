# UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP

```yaml
issue_number: 284
task_id: UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP
task_name: Composite setup action for Node pnpm workflows
category: 改善
target_feature: GitHub Actions workflow setup
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
| task_id | UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP |
| 親タスク | UT-CICD-DRIFT |
| 起源 drift | DRIFT-04(b) |
| workflow_state | spec_created |
| 優先度 | MEDIUM |
| 分類 | impl-required（composite action 化） |
| 起票日 | 2026-04-29 |

## 親タスク背景

5 yaml すべてで `actions/setup-node@v4` + `pnpm/action-setup@v4` + `actions/checkout@v4` が重複定義されている。UT-CICD-DRIFT は drift 検出のみとし、composite action 化は本派生で扱う。

## 範囲

1. `.github/actions/setup-node-pnpm/action.yml`（仮）に共通 setup を抽出
2. 5 yaml 全体で `uses: ./.github/actions/setup-node-pnpm` に置換
3. Node 24 / pnpm 10.33.2 を SSOT として composite action に固定

## 不変条件 reaffirmation

| # | 不変条件 | 適用 |
| --- | --- | --- |
| #5 / #6 | 影響なし | — |

## 受入条件

- [ ] AC-1: composite action 1 ファイルで checkout + node + pnpm が完結
- [ ] AC-2: 5 yaml すべてが composite を参照
- [ ] AC-3: CI gate (typecheck / lint / build / coverage / verify-indexes) が緑

## 苦戦箇所【記入必須】

- setup step は各 workflow に似た記述が多く、部分的に DRY 化すると逆に読みづらくなる。
- composite action 化で cache key や Node / pnpm version の責務境界が曖昧になりやすい。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 共通 action の変更が全 workflow に同時波及する | action の入出力を最小化し、変更時は 5 workflow を一括検証する |
| DRY 化により workflow ごとの例外条件が見えなくなる | composite action には setup 共通処理のみ入れ、deploy / test 固有処理は各 workflow に残す |

## 検証方法

- `rg -n "setup-node|pnpm/action-setup|frozen-lockfile|node-version" .github/workflows .github/actions`
- composite action 採用時は対象 5 workflow の YAML 構文検証を行う。

## スコープ（含む/含まない）

| 含む | 含まない |
| --- | --- |
| setup-node / pnpm setup の共通化検討、composite action の採否判断 | workflow topology 変更、deploy job 権限変更、coverage gate hard 化 |

## 委譲先 / 関連

- 関連: UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY（reusable workflow 化と並走）
