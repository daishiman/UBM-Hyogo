# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-351-09c-post-release-dashboard-automation |
| phase | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| phase_status | implemented-local / runtime-gated |

仕様書サイクルと実装サイクルで PR が分かれる。本 Phase は両者の手順を仕様化する。


## 目的

仕様書 PR と後続実装 PR の境界を明確にし、user 承認なしの PR 作成を禁止する。


## 実行タスク

- 既存本文の該当 Phase 内容を確認する。
- artifacts.json の phase status と outputs 宣言に矛盾がないことを確認する。
- 後続実装が必要な項目は user gate と evidence path を明示する。


## 参照資料

- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/index.md`
- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`


## 成果物

- `phase-13.md`
- `outputs/phase-13/` 配下の宣言済み成果物


## 完了条件

- [x] Phase 本文が skill 必須セクションを満たす
- [x] artifacts.json の status と矛盾しない
- [x] commit / push / PR を user 明示承認まで実行しない

## 1. 仕様書サイクルの PR

### 1.1 ブランチ / 対象

- ブランチ: `docs/issue-351-09c-post-release-dashboard-automation-task-spec`
- merge 先: `main`（solo dev / dev は省略可、CLAUDE.md 運用に従う）
- 含めるファイル: `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/` 配下のみ
- **コード変更なし**（仕様書のみ）

### 1.2 PR description テンプレ

```
## Summary

- Issue #351（CLOSED）に対する **タスク仕様書** を作成。本 PR はコード変更を含まず、`docs/30-workflows/issue-351-09c-post-release-dashboard-automation/` 配下に Phase 1-13 と artifacts.json を追加する。
- 仕様書区分: **実装仕様書**（CONST_004）。Issue #351 の目的（24h post-release metrics 自動収集）はコード/設定変更なしには達成不可能であるため。
- 実装本体（`.github/workflows/post-release-dashboard.yml` / `scripts/post-release-dashboard/*`）は **本 PR では作成しない**。Refs #351 のみ使用、`Closes #351` は使わない（CLOSED 維持）。

## What this spec defines

- GitHub Actions workflow（`schedule: '0 0 * * *'` UTC + `workflow_dispatch`）
- Cloudflare GraphQL Analytics API 経由の Workers req/err / D1 reads/writes / cron status 取得
- read-only token `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` の分離設計
- artifact path `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}` 固定
- redaction grep gate / dataset discover step / DoD

## Test plan

- [ ] 仕様書のリンク到達性（index → 各 phase）を目視確認
- [ ] `mise exec -- pnpm typecheck` 実行（仕様書のみのため変化なしを確認）
- [ ] `mise exec -- pnpm lint` 実行（同上）
- [ ] `verify-indexes-up-to-date` CI（aiworkflow indexes drift がないこと）

## Refs

- Refs #351
- 親仕様: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/`
- 起票元: `docs/30-workflows/unassigned-task/task-09c-post-release-dashboard-automation-001.md`
```

### 1.3 PR 作成手順（CLAUDE.md PR フローに従う）

```bash
# 1. main fetch & merge
git fetch origin main
git checkout main && git pull --ff-only origin main
git checkout docs/issue-351-09c-post-release-dashboard-automation-task-spec
git merge main

# 2. 検証
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3. push & PR
git push -u origin docs/issue-351-09c-post-release-dashboard-automation-task-spec
gh pr create --title "docs(issue-351): 09c post-release dashboard automation task spec" \
  --body "$(cat <<'EOF'
[本 PR description テンプレ §1.2]
EOF
)"
```

> **本仕様書サイクル内でこの PR を Claude Code が自動作成することは禁止**（user 明示指示が出るまで実行しない）。

## 2. 実装サイクルの PR（後続）

### 2.1 ブランチ / 対象

- ブランチ: `feat/issue-351-09c-post-release-dashboard-automation`
- 含めるファイル:
  - `.github/workflows/post-release-dashboard.yml` (new)
  - `scripts/post-release-dashboard/**` (new)
  - `package.json`（test script 追加）
  - `.gitignore`（`outputs/post-release-dashboard/**`）
  - `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` (edit)
  - `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` (edit)
  - `.claude/skills/aiworkflow-requirements/changelog/20260505-issue351-post-release-dashboard.md` (new)
  - 仕様書 `outputs/phase-11/*` および `outputs/phase-12/*` の実体化

### 2.2 PR description テンプレ

```
## Summary

- Issue #351（CLOSED）の仕様書 (`docs/30-workflows/issue-351-09c-post-release-dashboard-automation/`) に基づき、`.github/workflows/post-release-dashboard.yml` と `scripts/post-release-dashboard/` を新設する。
- read-only Cloudflare API token (`CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY`) を分離。production deploy 用の `CLOUDFLARE_API_TOKEN` には触れない。
- artifact path: `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}`、retention 90 日。
- Refs #351（CLOSED 維持）

## What changed

- new workflow / scripts / tests / .gitignore / aiworkflow-requirements references / changelog fragment（詳細は phase-12 documentation-changelog.md）

## Evidence

- local dry-run: outputs/phase-11/dry-run-evidence.md
- workflow_dispatch dry-run: outputs/phase-11/workflow-log.txt + artifact/
- redaction-check: outputs/phase-11/redaction-check.md (EXIT_CODE=0)
- schema-check: outputs/phase-11/schema-check.md (jq -e exit 0)
- AC matrix: outputs/phase-07/ac-matrix.md（AC-1〜AC-8 が全て PASS / PASS_WITH_BLOCKER）

## Test plan

- [x] yamllint / actionlint
- [x] shellcheck
- [x] bash __tests__/run-all.sh
- [x] mise exec -- pnpm typecheck
- [x] mise exec -- pnpm lint
- [x] local dry-run
- [x] workflow_dispatch dry-run（merge 前に PR 上で実行）
- [ ] schedule 実起動（merge 後 24h 以内に最初の cron 起動を確認、PR コメントで報告）

## Follow-up（U-1）

- 30 日経過後の schedule 安定性集計と skill feedback 反映（unassigned-task として別 issue で管理）

## Refs

- Refs #351
- 仕様書: `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/`
```

### 2.3 PR 作成手順

CLAUDE.md「PR 作成の完全自律フロー」に従う。**本レビュー改善サイクル内では実行しない。**

## 3. PR 共通 DoD

| 項目 | 仕様書 PR | 実装 PR |
| --- | --- | --- |
| `mise exec -- pnpm typecheck` 0 で抜ける | ✅ | ✅ |
| `mise exec -- pnpm lint` 0 で抜ける | ✅ | ✅ |
| CI gate（`verify-indexes-up-to-date` 等）pass | ✅ | ✅ |
| `--no-verify` 不使用 | ✅ | ✅ |
| `Refs #351` のみ使用、`Closes #351` 禁止 | ✅ | ✅ |
| Phase 11 evidence の絶対 path が PR description に記載 | n/a（implemented-local; PR 未作成） | ✅ |
| Phase 12 6 ファイルが outputs/phase-12/ に揃う | n/a（計画のみ） | ✅ |

## 4. 完了条件

- [x] 仕様書サイクル PR description テンプレが完成
- [x] 実装サイクル PR description テンプレが完成
- [x] CLAUDE.md PR フロー / Refs #351 ルールに従っている

## 5. 重要事項

- 本仕様書サイクル（本 task spec PR）では **コード実装は行わない**（CONST_006 / 本プロンプト UserInput）
- 実 PR 作成・push・commit は **user 明示指示が出るまで Claude Code から実行しない**

## outputs

- `outputs/phase-13/pr-description.md`（仕様書サイクル PR description のテンプレを実体化）
