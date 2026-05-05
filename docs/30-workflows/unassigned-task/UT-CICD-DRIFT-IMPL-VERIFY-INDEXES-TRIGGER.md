# UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER

```yaml
issue_number: 289
task_id: UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER
task_name: Verify indexes trigger and recovery runbook
category: 改善
target_feature: aiworkflow requirements index gate
priority: 低
scale: 小規模
status: 未実施
source_phase: UT-CICD-DRIFT Phase 12
created_date: 2026-04-29
dependencies: [#58]
```

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER |
| 親タスク | UT-CICD-DRIFT |
| 起源 drift | DRIFT-01 補足 |
| workflow_state | spec_created |
| 優先度 | LOW |
| 分類 | docs-impl（runbook 整備） |
| 起票日 | 2026-04-29 |

## 親タスク背景

`verify-indexes.yml` は `.claude/skills/aiworkflow-requirements/indexes` の drift を gate するが、失敗時の復旧手順（`pnpm indexes:rebuild` のローカル実行 / コミット手順）が runbook 化されていない。UT-CICD-DRIFT は drift 検出のみとし、本派生で扱う。

## 範囲

1. `verify-indexes.yml` の trigger 条件（PR / push の対象パス）を `deployment-gha.md` に明記
2. 失敗時の runbook を `docs/00-getting-started-manual/lefthook-operations.md` または skill 配下に追記
3. CI fail → ローカル `pnpm indexes:rebuild` → 再 push の標準手順を SOP 化

## 不変条件 reaffirmation

| # | 不変条件 | 適用 |
| --- | --- | --- |
| #5 / #6 | 影響なし | — |

## 受入条件

- [ ] AC-1: trigger 条件が `deployment-gha.md` に記述される
- [ ] AC-2: 失敗時 SOP が 1 ファイル内で完結する形で書かれる
- [ ] AC-3: SOP に `pnpm indexes:rebuild` の正規経路が含まれる

## 苦戦箇所【記入必須】

- `verify-indexes.yml` は workflow ファイル名と status context 名が異なる可能性がある。
- index drift は自動生成物の差分なので、手作業で直すか generator を直すかの判断がぶれやすい。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| required status check に誤った context 名を登録し、PR が詰まる | GitHub Actions 上の実 context 名を確認し、UT-GOV-001 / UT-GOV-004 と照合する |
| index drift 復旧で生成物を手編集して再発する | `pnpm indexes:rebuild` を正規手順とし、手編集を禁止する |

## 検証方法

- `rg -n "name:|on:|verify-indexes|indexes:rebuild|required_status|verify-indexes-up-to-date" .github/workflows .claude/skills/aiworkflow-requirements docs/30-workflows`
- GitHub Actions の実行名と branch protection に登録する context 名を照合する。

## スコープ（含む/含まない）

| 含む | 含まない |
| --- | --- |
| `verify-indexes.yml` trigger 意図確認、index drift 復旧 runbook、status context 照合 | branch protection の直接適用、index generator 仕様変更、references 内容追加 |

## 委譲先 / 関連

- 関連: `U-VIDX-01-verify-indexes-actions-smoke-and-branch-protection.md`
