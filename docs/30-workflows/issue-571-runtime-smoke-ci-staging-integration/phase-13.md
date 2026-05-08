# Phase 13: PR 作成 — issue-571-runtime-smoke-ci-staging-integration

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 13 / 13 |
| 入力 | Phase 12 完了 / 全 evidence 取得済み |
| 出力 | `outputs/phase-13/main.md`（PR URL / commit list / multi-stage approval gate G1-G4 通過記録） |
| base branch | `dev`（既定。CLAUDE.md 通り） |

## 目的

仕様書 + 実装 + ADR + ドキュメント更新を **multi-stage approval gate G1-G4** で段階承認しながら PR 化する。

## G1-G4 multi-stage approval gate

CLAUDE.md `phase-template-phase13.md` の方針を踏襲し、以下 4 ゲートを **独立に承認**（合算承認禁止）:

| Gate | 対象 | 承認操作 |
| --- | --- | --- |
| G1 | runtime deploy / Environment 配置 | ユーザーが「G1 承認」と明示後 `gh secret set` 等を実行 |
| G2 | workflow YAML / script / ADR 実装レビュー | ユーザーが「G2 承認」と明示後、現 implementation cycle の差分を merge-ready にする |
| G3 | staging deploy → runtime smoke 初回実測 | ユーザーが「G3 承認」と明示後、staging deploy / reusable workflow smoke / artifact grep を取得 |
| G4 | failure injection + commit / push / PR | ユーザーが「G4 承認」と明示後、Slack failure injection と PR 作成を行う |

## PR 構成方針

### branch
`docs/issue-571-runtime-smoke-ci-integration`（本仕様書作成 branch を継続利用）または、実装サイクルで `feat/issue-571-runtime-smoke-ci-staging-integration` を新設。

### base branch
`dev`（CLAUDE.md「既定の PR base ブランチは `dev`」）

### PR タイトル（70 文字以内）
`docs+ci(issue-571): runtime smoke の GitHub Actions 自動実行統合`

### PR body 構成

```markdown
## Summary
- `.github/workflows/runtime-smoke-staging.yml` を新設し、staging deploy 完了 trigger で attendanceProvider runtime smoke を自動実行
- secret 注入経路 / required check 昇格判断の ADR 2 本を策定
- artifact summary-only / Slack failure post / `set -x` 禁止 grep gate を整備

## Refs
- Issue #571（CLOSED 維持）
- 親タスク: docs/30-workflows/completed-tasks/issue-531-runtime-smoke-attendance-provider-migration/

## 主要変更
- `.github/workflows/runtime-smoke-staging.yml` (new)
- `.github/workflows/backend-ci.yml` (+reusable workflow call)
- `scripts/smoke/runtime-attendance-provider.sh` (+--out-dir/--ci-summary)
- `scripts/smoke/ci-summary-post.sh` (new)
- `scripts/smoke/__tests__/{redact,runtime-attendance-provider,ci-summary-post}.test.sh` (new)
- `docs/40-architecture/adr/ADR-runtime-smoke-{secret-injection,required-status-check}.md` (new)
- `docs/30-workflows/issue-571-.../operations/setup-github-environment.md` (new)
- `docs/30-workflows/issue-571-.../{index.md, artifacts.json, phase-01..13.md}` (new)

## evidence
- outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log (local PASS 5 点)
- outputs/phase-11/evidence/workflow-run-summary.md (CI run id / artifact URL)
- outputs/phase-11/evidence/artifact-redaction-grep.log (0 hit)
- outputs/phase-11/evidence/slack-failure-injection.md (G4 redact 済み summary)

## Test plan
- [ ] pnpm typecheck / lint / build PASS
- [ ] regression unit (issue-371/531) PASS
- [ ] T-1〜T-6 PASS
- [ ] actionlint 0 issue
- [ ] `set -x` 禁止 grep 0 hit
- [ ] secret 文字列 grep 0 hit
- [ ] CI workflow 初回 run PASS（G3）
- [ ] failure injection で Slack 1 通 post（G4）
- [ ] artifact retention 30 日設定
- [ ] Issue #571 state == CLOSED 維持

## screenshot
N/A（NON_VISUAL）

## Approval gate 通過記録
- G1 (Environment / Secret 配置): pending_user_approval
- G2 (workflow / script / ADR implementation review): pending_user_approval
- G3 (staging deploy / runtime smoke evidence): pending_user_approval
- G4 (failure injection / commit / push / PR): pending_user_approval

## Issue 状態維持
Issue #571 は CLOSED のまま据え置く（reopen しない）
```

## 実行手順

1. **G1 完了後**: Environment / secret 配置完了
2. **local PASS 5 点取得済み確認**: `outputs/phase-11/evidence/` 配下に 5 ファイル + workflow-run-summary + artifact-redaction-grep + slack-failure-injection が揃っている
3. **G4 承認待ち**: ユーザーから「G4 承認」明示
4. **dev 同期**: `git fetch origin dev && git merge origin/dev`（コンフリクト解消）
5. **commit**: 仕様書 / 実装 / evidence をまとめて 1〜数 commit
6. **push**: `git push -u origin <branch>`
7. **PR create**: `gh pr create --base dev --title ... --body ...`
8. **post-create**: PR URL を `outputs/phase-13/main.md` に記録、Issue #571 の state が CLOSED のままであることを再確認

## 自走禁止（Phase 13 内）

- ❌ G4 承認なしの commit / push / PR
- ❌ Issue #571 reopen（CLOSED 維持）
- ❌ base branch を `main` にする（必ず `dev`）
- ❌ secret 値を PR body / commit message / evidence に含める
- ❌ G1/G4 を合算承認する（独立承認必須）

## 完了条件（DoD）

- [ ] PR が `dev` を base に作成済み
- [ ] PR body に Summary / Refs / Test plan / Approval gate 通過記録が含まれる
- [ ] outputs/phase-13/main.md に PR URL と commit list 記録
- [ ] Issue #571 が CLOSED のまま
- [ ] artifacts.json `metadata.workflow_state` が `completed`（G3+G4 PASS 後）
