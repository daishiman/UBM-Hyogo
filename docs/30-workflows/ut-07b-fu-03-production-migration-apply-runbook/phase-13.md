# Phase 13: PR 作成（blocked_until_user_approval）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 13 |
| 状態 | blocked_until_user_approval |
| taskType | implementation / operations / runbook + scripts |
| 実装区分 | 実装仕様書 |
| visualEvidence | NON_VISUAL |

## 実行タスク

1. ユーザーの明示承認を取得する（取得前は commit / push / PR 作成いずれも禁止）。
2. 仕様書系コミット（docs）と実装コミット（scripts/d1, scripts/cf.sh, .github/workflows, package.json）を分離して commit する。
3. branch を push し、PR を作成する。
4. `outputs/phase-13/main.md` に PR URL / 代表 commit SHA / mergeable 状態 / CI gate 結果を記録する。
5. 本 PR のマージは production 実 apply のトリガーにしないことを PR 本文で明示する（FU-04 で別途実走）。

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/30-workflows/unassigned-task/task-ut-07b-fu-04-production-migration-apply-execution.md`
- `.claude/commands/ai/diff-to-pr.md`

## 目的

ユーザーの明示承認を得てから、本タスク仕様書（spec_created 段階）+ F1〜F9 実装に対する commit / push / PR 作成を行う。本 PR は **runbook 文書 + 検証スクリプト + CI gate の起票** を扱い、production D1 への migration apply は本 PR 内では実行しない。

## ゲート遵守

| ゲート | 内容 | 本 Phase での扱い |
| --- | --- | --- |
| G1 commit | spec + 実装の分離コミット | Phase 13 実行時 |
| G2 PR | この Phase | 本 Phase で作成 |
| G3 CI gate | `d1-migration-verify` が staging DRY_RUN green | PR 上で自動実行、green 必須 |
| G4 merge | main マージ | ユーザー承認後 |
| G5 ユーザー承認 | production 実 apply 承認 | FU-04 開始条件 |
| G6 実走 | `--env production` 実行 | FU-04（本 PR では行わない）|

## コミット分割方針

最小 2 commit（spec + 実装）/ 最大 5 commit:

1. `docs(ut-07b-fu-03): rewrite as implementation spec for production migration apply` — spec 系（index.md, phase-*.md, outputs/phase-*/main.md, artifacts.json）
2. `feat(d1): add preflight/postcheck/evidence/apply-prod scripts (#363)` — F1〜F4
3. `feat(cf): add d1:apply-prod subcommand (#363)` — F5
4. `ci(d1): add d1-migration-verify staging dry-run gate (#363)` — F6 + F9
5. `test(d1): add bats coverage for migration scripts (#363)` — F7

## PR 本文構造

```markdown
## Summary

- 実装区分: 実装仕様書化（CONST_004 例外: ユーザー指定は runbook 文書だが目的達成にコード変更が必要と判断）
- 対象 migration: apps/api/migrations/0008_schema_alias_hardening.sql（変更なし）
- 追加: scripts/d1/{preflight,postcheck,evidence,apply-prod}.sh、scripts/cf.sh d1:apply-prod、.github/workflows/d1-migration-verify.yml、bats テスト 19 ケース、package.json test:scripts
- 文書: production migration apply runbook 6 段階承認ゲート + evidence 10 項目スキーマ + failure handling 4 ケース exit code

## Test plan

- [ ] `mise exec -- pnpm install`
- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm test:scripts`（bats 19 ケース全 PASS）
- [ ] CI gate `d1-migration-verify` が staging DRY_RUN を実行し green
- [ ] redaction-check で機密値（CLOUDFLARE_API_TOKEN / ACCOUNT_ID / Bearer / sk-*）混入 0 件
- [ ] PR 本文に Token 値・Account ID 値・production 実 apply 結果値が含まれない

## Out of scope（本 PR で実行しない）

- production D1 (`ubm-hyogo-db-prod`) への実 migration apply（UT-07B-FU-04 に委譲）
- queue / cron split for large back-fill（UT-07B-FU-01）
- admin UI retry label（UT-07B-FU-02）

## Refs

- Refs #363（CLOSED Issue。再オープンせず参照のみ）
- 上流: docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/
- 並列: docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 自律実行フロー（ユーザー承認後）

1. `git fetch origin main && git checkout main && git pull --ff-only`
2. 作業ブランチに戻り `git merge main`（コンフリクト時は CLAUDE.md「コンフリクト解消の既定方針」に従う）
3. `mise exec -- pnpm install --force && mise exec -- pnpm typecheck && mise exec -- pnpm lint`
4. `mise exec -- pnpm test:scripts`（bats）
5. `git add -A` → コミット分割（上記）→ `git push -u origin <branch>`
6. `gh pr create --title "feat(d1): production migration apply orchestrator scripts + runbook (#363)" --body "$(cat <<'EOF' ... EOF)"`
7. `gh pr checks <PR>` で CI gate green を待つ
8. `outputs/phase-13/main.md` に PR URL / commit SHA / CI 結果を記録

## 完了条件

- [ ] ユーザー明示承認を取得
- [ ] 全コミットが分離単位で作成され、機密情報を含まない
- [ ] PR が作成され mergeable
- [ ] `d1-migration-verify` CI gate green
- [ ] PR 本文に「production 実 apply は本 PR で実行しない」明記
- [ ] PR 本文に `Refs #363` 採用、`Closes #363` 不採用
- [ ] `outputs/phase-13/main.md` に PR URL / commit SHA / CI 結果記録

## 成果物

- `outputs/phase-13/main.md`

## 苦戦想定

- ユーザー承認なしで `git push` / `gh pr create` を反射的に実行したくなるが禁止。Phase 13 status は明示承認まで `blocked_until_user_approval` のまま。
- bats / typecheck / lint 失敗時に `--no-verify` で push したくなるが禁止。修復コミットを追加。
- CI gate の secret 取り違え（production secret を staging job で参照）が発生しないよう、F6 yml の `secrets.CLOUDFLARE_API_TOKEN_STAGING` 限定を再確認。
- PR 本文に bats stdout / staging dry-run 出力をそのまま貼ると Token / Account ID 混入リスク。redaction-check 経由のサマリのみ転載する。
