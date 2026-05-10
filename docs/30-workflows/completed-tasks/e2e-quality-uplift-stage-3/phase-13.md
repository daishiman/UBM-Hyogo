# Phase 13: PR 作成（Stage 3）

| 項目 | 値 |
|------|----|
| 入力 | `phase-12.md` 完了 |
| 出力 | PR (base=`dev`, head=`feat/e2e-quality-uplift`) |
| PR 数 | 親 umbrella は子 workflow へ分解済み。3a / 3b / 3c の PR・runtime evidence・branch protection mutation は user-gated child workflow で扱う |

---

## 1. PR 構造

| 項目 | 値 |
|------|----|
| base | `dev` |
| head | `feat/e2e-quality-uplift` |
| title | `docs(e2e-quality-uplift-stage-3): decompose hard CI gate implementation specs` |
| label（任意） | `workflow-spec` / `stage-3` |
| reviewer | なし（solo policy） |

---

## 2. PR 本文テンプレート

```markdown
## Summary

- Stage 3「hard CI gate + lighthouse + branch protection」を 3a / 3b / 3c child workflow に分解。
- `lighthouse-ci` / `e2e-tests-coverage-gate` の runtime CI evidence は child PR で取得予定。
- `dev` / `main` の `required_status_checks.contexts` 変更は 3c の user-gated `gh api` operation として分離。
- 親 umbrella は historical / decomposed archive として残し、AC pass は child runtime evidence 取得後に判定する。

## Spec

- `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-{1..13}.md`
- `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/index.md`

## 子 workflow

- 3a: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/`
- 3b: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/`
- 3c: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/`

## Branch protection 適用（Step F の実行ログ）

未実行。3a / 3b contexts が GitHub に登録された後、3c で dev → main の順に user approval 付きで `gh api PUT` を実行する。

## Evidence（`outputs/phase-11/`）

- `lhci-scores.json` — Lighthouse 4 routes 実測（または Q-03 縮退時 3 routes）
- `coverage-summary.json` — line coverage pct
- `branch-protection-{dev,main}-{pre,post}.json` — snapshot ×4
- `branch-protection-drift-check.log` — 適用後 drift 検証
- `registered-contexts.txt` — check-runs 名一覧
- `lhci-report-*.png` — Lighthouse スクリーンショット

## ドキュメント更新

- `CLAUDE.md`: branch protection contexts 正本表を追記
- `docs/30-workflows/LOGS.md`: Stage 3 完了 1 行追記
- `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/LOGS.md`: 新規
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.*`: 4 entry 追加 + `pnpm indexes:rebuild` 反映
- `docs/30-workflows/e2e-quality-uplift/backlog.md`: RB-01..RB-04 / OBS-01..OBS-02 記録

## 受入基準（index.md AC-01..AC-06）

| AC | 状態 |
|----|------|
| AC-01 lighthouse-ci 4 routes assertion | pending in 3a runtime evidence |
| AC-02 coverage<80% で fail / critical-route smoke fail で fail | pending in 3b runtime evidence |
| AC-03 monocart-reporter 追加 + 既存 reporter 維持 | pending in 3b implementation |
| AC-04 coverage / failure HTML report の artifact 取得可 | pending in 3b runtime evidence |
| AC-05 dev / main contexts 5 件揃い | pending in 3c user-gated mutation |
| AC-06 reviews=null / lock=false / enforce_admins 既存維持 | pending in 3c post-snapshot |

## 残課題（backlog 記録済）

- OBS-01: `enforce_admins=false` drift（governance drift workflow へ）
- OBS-02: `required_linear_history=false`（同上）
- RB-01..RB-04: composite action / merge queue / paths filter / build 共有

## 手動オペレーション手順（context 登録順序）

### 重要: Stage 3c は順序厳守

PR-A / PR-B が **dev に merge され、各々 1 回以上 success run を観測した後** に branch protection を更新する。順序を誤ると context 未登録のまま required にしてしまい PR 永久 pending を招く（BLK-03）。

#### 手順

1. PR-A を `dev` に merge
2. `gh run list --workflow=lighthouse.yml --branch=dev --limit=1` で `success` 観測
3. PR-B を `dev` に merge
4. `gh run list --workflow=e2e-tests.yml --branch=dev --limit=1` で `success` 観測
5. 直近 dev HEAD で check-runs 5 件登録確認:
   ```bash
   HEAD_SHA=$(gh api repos/daishiman/UBM-Hyogo/branches/dev | jq -r '.commit.sha')
   gh api "repos/daishiman/UBM-Hyogo/commits/$HEAD_SHA/check-runs" | jq -r '.check_runs[].name' | sort -u
   ```
   出力に `lighthouse-ci` / `e2e-tests-coverage-gate` を含むこと。
6. pre-snapshot 取得:
   ```bash
   gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  > outputs/phase-11/branch-protection-dev-pre.json
   gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-11/branch-protection-main-pre.json
   ```
7. `dev` PUT（phase-5.md §3.2 payload）
8. `main` PUT（pre-snapshot から `contexts` のみ 5 件に置換した payload）
9. post-snapshot 取得 + drift 検証（phase-11.md §5.4）
10. evidence を本 PR に commit

### rollback

問題発生時は pre-snapshot を `gh api -X PUT --input ...` で再投入して原状復帰。

## CONST_007 / solo policy

- single-cycle scope 遵守（Phase 1→2→...→13 一直線）
- `required_pull_request_reviews=null` 維持（solo policy）
- `lock_branch=false` / `enforce_admins` 既存値維持

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 3. PR 作成コマンド

```bash
gh pr create \
  --base dev \
  --head feat/e2e-quality-uplift \
  --title "docs(e2e-quality-uplift-stage-3): hard CI gate + lighthouse + branch protection 完了" \
  --body-file docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/outputs/phase-13/pr-body.md
```

`outputs/phase-13/pr-body.md` に §2 のテンプレートを投入してから実行する。

---

## 4. PR 作成前 final checklist

| # | 項目 | 確認方法 |
|---|------|---------|
| F-01 | `git status --porcelain` 空 | 実行 |
| F-02 | `git diff dev...HEAD --name-only` で含まれる変更がスコープ通り | 実行 + 目視 |
| F-03 | `pnpm typecheck` / `pnpm lint` pass | 実行 |
| F-04 | evidence ファイル全件存在（phase-11.md §6） | `ls outputs/phase-11/` |
| F-05 | CLAUDE.md / LOGS.md / topic-map / backlog 全て更新済 | git diff で目視 |
| F-06 | branch protection drift check log で全期待値 pass | `cat outputs/phase-11/branch-protection-drift-check.log` |
| F-07 | `verify-indexes-up-to-date` 想定 pass（local rebuild 済） | `pnpm indexes:rebuild` 実行後 git diff = 0 |

---

## 5. PR merge 後

| # | 操作 |
|---|------|
| M-01 | `feat/e2e-quality-uplift` を削除（local + remote） |
| M-02 | umbrella workflow `docs/30-workflows/e2e-quality-uplift/index.md` の Stage 3 行を done に更新（phase-12 で既に反映済の場合は skip） |
| M-03 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/index.md` の Phase 13 状態を `done` に更新（commit 込み） |

---

## 6. 終了基準

| # | 条件 |
|---|------|
| EX-01 | PR が `dev` に merge されている |
| EX-02 | dev / main の branch protection に 5 contexts が登録されており drift なし |
| EX-03 | Stage 3 LOGS / index.md / umbrella backlog が反映 |
| EX-04 | Stage 4 への引継 backlog（RB / OBS）が記録 |

---

## 7. Stage 3 終了

本 Phase 完了をもって `e2e-quality-uplift` umbrella workflow の Stage 3 を終了。Stage 4 以降は backlog の優先度に従い別 workflow で起票する。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3
- phase: 13
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 3 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=80%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
