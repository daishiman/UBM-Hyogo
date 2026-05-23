# Phase 13: commit / PR 作成 / branch protection 反映（user approval 必須）

## 目的

Phase 1〜12 の成果物を 1 PR として `dev` に提出し、user approval 後に branch protection の 3 contexts を追加する。**本 Phase の各 mutation は user の明示承認後に AI が実行する**。

## 13.1 G1〜G4 multi-stage approval gate

| Gate | 対象 mutation | 事前 evidence | user approval marker |
| --- | --- | --- | --- |
| G1 | `git add` / `git commit` / `git push origin <branch>` | Phase 11 evidence 全件 PASS | "G1 approve: push" |
| G2 | `gh pr create --base dev` | PR ドラフト本文（Phase 10 §10.3） | "G2 approve: PR open" |
| G3 | `gh api -X PUT branches/main/protection` | `branch-protection-main-{before,after}.json` | "G3 approve: main protection update" |
| G4 | `gh api -X PUT branches/dev/protection` | `branch-protection-dev-{before,after}.json` | "G4 approve: dev protection update" |

合算承認禁止。各 Gate ごとに承認 evidence を `outputs/phase-13/approvals/g{1..4}.txt` に保存。

## 13.2 G1 — commit & push

```bash
git status
git diff --name-only           # §3.1 ファイル table と一致確認
git add scripts/verify-design-tokens.ts scripts/verify-design-tokens.test.ts \
        apps/web/playwright.config.ts apps/web/playwright/tests/full-smoke.spec.ts \
        apps/web/playwright/fixtures/auth.ts apps/web/playwright/tests/visual/*.spec.ts \
        apps/web/playwright/tests/visual/__screenshots__/ \
        .github/workflows/verify-design-tokens.yml .github/workflows/playwright-smoke.yml \
        package.json apps/web/package.json \
        docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/

git commit -m "$(cat <<'EOF'
feat(regression): verify-design-tokens + Playwright 17 URL routes smoke + visual baseline

Refs ui-prototype-alignment-mvp-recovery / task-18-w7

- scripts/verify-design-tokens.ts: 09b JSON ↔ tokens.css ↔ @theme inline diff
- apps/web/playwright/tests/full-smoke.spec.ts: 17 URL routes smoke (chromium)
- apps/web/playwright/tests/visual/*.spec.ts: 4-screen baseline
- 2 new workflows + 3 new required status check candidates
EOF
)"

git push -u origin feat/ui-mvp-task-18-regression-gate
```

`--no-verify` は禁止。lefthook hook が落ちる場合は原因解消後に再 commit。

## 13.3 G2 — PR 作成

```bash
awk '/^## PR description draft/{flag=1; next} /^## / && flag{flag=0} flag' \
  outputs/phase-12/implementation-guide.md > outputs/phase-13/pr-body.md
gh pr create --base dev --title "feat(regression): task-18-w7 verify-tokens + Playwright smoke + visual baseline" \
  --body-file outputs/phase-13/pr-body.md
```

PR open 後、CI で 3 contexts が green になることを確認。
- `verify-design-tokens / verify-design-tokens`
- `playwright-smoke / smoke (chromium)`
- `playwright-smoke / visual (chromium, 4 screens)`

green を `outputs/phase-13/ci-green.json` に保存:
```bash
gh pr checks <PR_NUMBER> --json name,state,conclusion > outputs/phase-13/ci-green.json
```

## 13.4 G3 / G4 — branch protection PUT（dev / main 個別）

### before JSON 再取得
```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-13/branch-protection-main-before.json
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  > outputs/phase-13/branch-protection-dev-before.json
```

### PUT payload 生成
- before JSON をそのまま copy しない
- `required_status_checks.strict` / `contexts` / `checks`、`enforce_admins`、`required_pull_request_reviews`、`restrictions`、`required_linear_history`、`allow_force_pushes`、`allow_deletions`、`required_conversation_resolution`、`lock_branch` の PUT 用 payload だけを生成する
- `required_status_checks.contexts` に 3 件 append（既存重複は除く）
- 他フィールドは drift 禁止（Phase 10 §10.2 不変フィールド）
- payload path は `outputs/phase-13/branch-protection-{main,dev}-payload.json`

### PUT 実行（user approval 後）
```bash
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection \
  --input outputs/phase-13/branch-protection-main-payload.json \
  > outputs/phase-13/branch-protection-main-put-result.json

gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --input outputs/phase-13/branch-protection-dev-payload.json \
  > outputs/phase-13/branch-protection-dev-put-result.json
```

### 反映確認
```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq '.required_status_checks.contexts'
```

3 contexts を含み、`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` が維持されていること。

## 13.5 失敗時の rollback

- PR CI fail: 該当 spec を修正して新規 commit、`--amend` 禁止
- branch protection PUT 失敗: drift 検出時は before JSON の値で再 PUT してから個別調整

## 13.6 完了処理

- artifacts.json の phase 13 status を `completed` に更新
- workflow_state を canonical root state `completed` に更新し、runtime boundary は `pass_runtime_synced` として `outputs/artifacts.json` に記録する
- 親 workflow `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` の trace に本タスク完了を追記（completed-tasks への移動は親側のルール）

## 完了条件

- [ ] G1 commit & push 完了
- [ ] G2 PR open + CI green 3 contexts
- [ ] G3 main protection PUT 完了 / 反映確認
- [ ] G4 dev protection PUT 完了 / 反映確認
- [ ] `outputs/phase-13/approvals/g{1..4}.txt` が存在
- [ ] artifacts.json / workflow_state 更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- G1〜G4 の個別承認後に commit / PR / branch protection mutation を実行する。

| Task | 内容 |
| --- | --- |
| 13-A | G1〜G4 の個別 user approval evidence を保存する |
| 13-B | commit / push / PR 作成を承認後に実行する |
| 13-C | branch protection PUT payload を正規化し、dev/main 個別に適用する |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 10 | `phase-10.md` | branch protection drift guard |
| Phase 12 guide | `outputs/phase-12/implementation-guide.md` | PR body draft |
| CLAUDE branch strategy | `CLAUDE.md` | solo CI gate policy |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| PR body | `outputs/phase-13/pr-body.md` | 実行可能 awk で抽出した PR 本文 |
| approvals | `outputs/phase-13/approvals/g{1..4}.txt` | user approval evidence |
| payloads | `outputs/phase-13/branch-protection-{main,dev}-payload.json` | PUT 用 payload |
