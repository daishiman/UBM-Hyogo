# Phase 10: 統合

## 既存ワークフローとの統合点

| 既存 | 統合内容 |
|------|---------|
| `e2e-tests.yml` (`e2e-tests-coverage-gate`) | 変更なし。matrix 3 project は集約 job `e2e-tests-coverage-gate` 経由で branch protection に登録する |
| `lighthouse.yml` (`lighthouse-ci`) | prod server 起動 step を `nohup` + `wait-on` 化、context 名を dev 向けにのみ登録 |
| `verify-indexes.yml` | 影響なし |
| `coverage-gate` (既存 context) | 保持。新規 contexts と共存 |
| CLAUDE.md UT-GOV-001 | 本 stage が UT-GOV-001 系の drift gate 拡張を実装する形になる |

## CI gate 構成図（適用後）

### dev branch（PR 受入時）

```
required:
  - ci
  - Validate Build
  - coverage-gate
  - e2e-tests-coverage-gate
  - lighthouse-ci
```

### main branch（dev → main リリース時）

```
required:
  - ci
  - Validate Build
  - coverage-gate
  - e2e-tests-coverage-gate
  - lighthouse-ci
```

## 他 stage との関係

- Stage 1（critical regression assertion）: 本 stage の E2E gate により regression が PR 単位で検知される
- Stage 2（admin sub-task spec）: 本 stage の coverage gate + critical route smoke により complete coverage が保証される
- 後続 stage: 不要。Stage 3 で `e2e-quality-uplift` umbrella を close-out

## index.md ステータス更新

実装完了後、`index.md` の以下を更新:

- PR CI / Lighthouse runtime evidence 取得前: `workflow_state=implemented_local_runtime_pending`
- runtime evidence 取得後: `workflow_state=completed`

## 関連 issue / workflow への通知

- Issue #608: CLOSED のままで OK（受け入れ条件達成のため re-open 不要）。最終 PR に `Closes #608 (post-close completion)` を本文に記載
- `e2e-quality-uplift` umbrella: PR 本文で「Stage 3 完了により umbrella close-out 可能」と明記

## 統合検証コマンド

```bash
# 全 gate が dev 向け実 PR で表示されるか
gh pr checks <PR_NUMBER>

# drift 検査が clean
bash scripts/verify-branch-protection.sh

# index.md ステータス一括 grep
grep -E '^\| [0-9]+ \|' docs/30-workflows/e2e-quality-uplift-stage-3/index.md
```
