# Phase 3: アーキテクチャ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 作成日 | 2026-05-05 |
| 状態 | spec_created |

## 目的

Phase 2 PUT body 設計が、CI/CD ワークフロー、PR merge フロー、CLAUDE.md 記載の solo 運用ポリシー、aiworkflow-requirements skill の SSOT、および現存する全 worktree の進行中 PR に与える影響を確認し PASS / MINOR / MAJOR / NO-GO を確定する。

## 影響範囲マトリクス

| レイヤ | 対象 | 期待影響 |
| --- | --- | --- |
| GitHub branch protection | `main` / `dev` | `coverage-gate` が required に追加される。他 contexts は維持 |
| GitHub Actions | `.github/workflows/ci.yml` の `coverage-gate` job | 変更なし（Task E で hard gate 化済） |
| 進行中 PR | dev / main 宛て open PR | 適用後の PR は `coverage-gate` の success が merge 条件に追加 |
| solo 運用ポリシー | CLAUDE.md `Governance` セクション + fresh GitHub GET | non-target protection fields preserve（reviews / lock / admins などを固定値へ補正しない） |
| aiworkflow-requirements SSOT | `references/deployment-branch-strategy.md` | current applied 表更新 |
| skill indexes | `.claude/skills/aiworkflow-requirements/indexes/` | SSOT 更新後 `pnpm indexes:rebuild` |

## 確認コマンド

```bash
grep -rn "coverage-gate" .github/workflows/ \
  | tee outputs/phase-3/workflow-references.log

grep -n "coverage-gate\|required_status_checks\|branch protection" CLAUDE.md \
  | tee outputs/phase-3/claude-md-refs.log

grep -n "coverage-gate\|current applied\|required_status_checks" \
  .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md \
  | tee outputs/phase-3/ssot-baseline.log

gh pr list --state open --base main --limit 50 | tee outputs/phase-3/open-prs-main.log
gh pr list --state open --base dev  --limit 50 | tee outputs/phase-3/open-prs-dev.log
```

## PASS / MINOR / MAJOR / NO-GO

| 判定 | 条件 | 戻り先 |
| --- | --- | --- |
| PASS | 影響対象すべて期待通り、open PR が `coverage-gate` failing でない | Phase 4 へ |
| MINOR | open PR の中に `coverage-gate` failing があるが small fix で解決可 | 適用は許容、PR 側で対応 |
| MAJOR | `coverage-gate` failing の open PR が複数あり全ブロックリスク | dev 側適用を1サイクル後ろ倒し（main のみ先行）|
| NO-GO | invariant がすでに drift / Task E が main に未取り込み | Phase 1 NO-GO へ |

## Phase 4 開始条件

- Phase 1 GO 判定済
- Phase 2 PUT body 設計 PASS
- Phase 3 影響範囲が PASS / MINOR

## 成果物

- `outputs/phase-3/workflow-references.log`
- `outputs/phase-3/claude-md-refs.log`
- `outputs/phase-3/ssot-baseline.log`
- `outputs/phase-3/open-prs-{main,dev}.log`
- `outputs/phase-3/architecture-review.md`（PASS 判定根拠）
