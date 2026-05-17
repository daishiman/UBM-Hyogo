# Phase 13: PR 作成

## メタ情報

- phase: 13 / pr
- prev: phase-12-documentation
- next: なし（本ワークフローの最終 phase）

## 目的

本ワークフローの全成果物を 1 つ（または論理的に分割した複数）の PR にまとめ、`dev` ブランチへマージできる状態にする。**ユーザー明示承認後にのみ実行する。**

## PR 構成方針

### PR-A: workflow rename + regression gate（Phase 5-6 の差分）

- title: `chore(ci): cutover legacy CLOUDFLARE_API_TOKEN to step-scoped deploy secrets (#718)`
- base: `dev`
- 変更:
  - `.github/workflows/backend-ci.yml`
  - `scripts/__tests__/workflow-env-scope.test.sh`
  - `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（skeleton）
- 前提: `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` が GitHub Environments に投入済み。`web-cd.yml` の `CLOUDFLARE_API_TOKEN` value provenance は operator-only 確認済み
- マージ後: staging / production deploy が新 secret 経路で green になることを Phase 9 post-merge gate で確認

### PR-B: revocation evidence + final inventory（Phase 11-12 の差分）

- title: `docs(ops): record legacy CF token revocation evidence and update inventory (#718)`
- base: `dev`
- 変更:
  - `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-11/*`
  - `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-12/*`
  - `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（完成版）
  - `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md`（status 更新）
- 前提: PR-A マージ後、Phase 11 revocation 実施完了

> PR-A と PR-B の間に「新 secret 経路で deploy が green になる時間」が挟まる。1 つの PR にまとめると revocation 前に rename を含むコード変更が production へ反映されないため、必ず 2 PR に分割する。

## 実行手順（ユーザー承認後）

### PR-A 作成

```bash
git fetch origin dev
git checkout -b feat/issue-718-cf-token-rename
# Phase 5 で実装した変更を commit
git add .github/workflows/backend-ci.yml \
        scripts/__tests__/workflow-env-scope.test.sh \
        .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
git commit -m "chore(ci): cutover legacy CLOUDFLARE_API_TOKEN to step-scoped deploy secrets (#718)"
git push -u origin feat/issue-718-cf-token-rename
gh pr create --base dev --title "..." --body-file docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-5/pr-a-description.md
```

### PR-B 作成（PR-A マージ + revocation 完了後）

```bash
git checkout -b docs/issue-718-revocation-evidence
git add docs/30-workflows/issue-718-legacy-cf-token-revocation/
git add .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
git add docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md
git commit -m "docs(ops): record legacy CF token revocation evidence and update inventory (#718)"
git push -u origin docs/issue-718-revocation-evidence
gh pr create --base dev --title "..."
```

### Gate A / B / C

| Gate | Scope | 承認 |
| --- | --- | --- |
| Gate A | spec / artifacts / Phase 12 strict 7 close-out | docs merge approval |
| Gate B | backend workflow rename + tests + PR-A publish | commit / push / PR explicit approval |
| Gate C | Cloudflare token revoke / GitHub Secrets mutation / 1Password mutation | separate explicit approval; marker saved to `outputs/phase-13/user-approval-issue-718-<timestamp>.md` |

### completed-tasks 移動（PR-B 内 or 後続 PR）

```bash
git mv docs/30-workflows/issue-718-legacy-cf-token-revocation \
       docs/30-workflows/completed-tasks/issue-718-legacy-cf-token-revocation
```

## PR 本文の必須要素

- 関連 issue 番号 (#718)
- 親 workflow へのリンク（completed-tasks/issue-640-oidc-cf-token-cutover/）
- 変更ファイル一覧と種別（rename / gate / docs）
- 検証コマンドと結果（Phase 6 / Phase 9 / Phase 11 evidence パスへの参照）
- redaction 確認結果
- Phase 11 evidence への明示的なリンク（PR-B のみ）

## 完了条件

- [ ] PR-A がマージされ post-merge deploy が green
- [ ] Phase 11 revocation 実施・evidence 取得完了
- [ ] PR-B がマージされ inventory が新方式単一参照
- [ ] Issue #718 が close（GitHub UI）

## タスク100%実行確認【必須】

- [ ] PR-A / PR-B 双方のマージ完了
- [ ] `completed-tasks/` への移動完了
- [ ] Issue #718 close

## 備考

- 本 Phase の commit / push / PR 作成はユーザー明示承認後にのみ実行する（CONST_002）
- PR-A description は `outputs/phase-5/pr-a-description.md`、PR-B description は `outputs/phase-12/implementation-guide.md` から生成する
