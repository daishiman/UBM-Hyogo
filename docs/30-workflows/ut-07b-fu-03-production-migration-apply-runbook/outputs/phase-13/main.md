# Phase 13: PR 作成 — Summary

## 状態

`blocked_until_user_approval`

ユーザー明示承認まで commit / push / PR 作成は行わない。

## 実装区分

**[実装仕様書]**（CONST_004 例外: ユーザー指定 runbook 文書 → 目的達成にコード変更が必要と判断し実装仕様書化）

## PR 仕様（承認後に実行）

### タイトル

```
feat(d1): production migration apply orchestrator scripts + runbook (#363)
```

### コミット分割（最小 2、最大 5）

1. `docs(ut-07b-fu-03): rewrite as implementation spec for production migration apply` — spec 系（`docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/**`）
2. `feat(d1): add preflight/postcheck/evidence/apply-prod scripts (#363)` — F1〜F4（`scripts/d1/{preflight,postcheck,evidence,apply-prod}.sh`）
3. `feat(cf): add d1:apply-prod subcommand (#363)` — F5（`scripts/cf.sh`）
4. `ci(d1): add d1-migration-verify staging dry-run gate (#363)` — F6 + F9（`.github/workflows/d1-migration-verify.yml`、`package.json`）
5. `test(d1): add bats coverage for migration scripts (#363)` — F7（`scripts/d1/__tests__/*.bats`）

### PR 本文テンプレート

```markdown
## Summary

- 実装区分: 実装仕様書化（CONST_004 例外）
- 対象 migration: apps/api/migrations/0008_schema_alias_hardening.sql（変更なし）
- 追加: scripts/d1/{preflight,postcheck,evidence,apply-prod}.sh、scripts/cf.sh d1:apply-prod、.github/workflows/d1-migration-verify.yml、bats 19 ケース、package.json test:scripts
- 文書: production migration apply runbook 6 段階承認ゲート + evidence 10 項目 + failure handling exit code 規約

## Test plan

- [ ] mise exec -- pnpm install
- [ ] mise exec -- pnpm typecheck
- [ ] mise exec -- pnpm lint
- [ ] mise exec -- pnpm test:scripts （bats 19 ケース全 PASS）
- [ ] CI gate d1-migration-verify が staging DRY_RUN を実行し green
- [ ] redaction-check で機密値混入 0 件
- [ ] PR 本文に Token / Account ID / production 実 apply 結果値が含まれない

## Out of scope

- production D1 への実 migration apply（UT-07B-FU-04 に委譲）
- queue / cron split for large back-fill（UT-07B-FU-01）
- admin UI retry label（UT-07B-FU-02）

## Refs

- Refs #363（CLOSED Issue。再オープンせず参照のみ）
- 上流: docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/
- 並列: docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 自律実行フロー（承認取得後）

```bash
# 1. main 同期
git fetch origin main
git checkout main && git pull --ff-only
git checkout docs/issue-363-ut-07b-fu-03-production-migration-apply-runbook
git merge main   # コンフリクト時は CLAUDE.md 既定方針に従う

# 2. 品質検証
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test:scripts

# 3. コミット分割（上記 5 単位）
# 4. push
git push -u origin docs/issue-363-ut-07b-fu-03-production-migration-apply-runbook

# 5. PR 作成
gh pr create --title "feat(d1): production migration apply orchestrator scripts + runbook (#363)" \
  --body "$(cat <<'EOF'
（上記テンプレート）
EOF
)"

# 6. CI gate green 待ち
gh pr checks <PR-NUMBER>
```

## 完了条件

- [ ] ユーザー明示承認取得
- [ ] commit 分離単位で機密情報を含まず
- [ ] PR mergeable
- [ ] `d1-migration-verify` CI gate green
- [ ] PR 本文に「production 実 apply は本 PR で実行しない」明記
- [ ] PR 本文に `Refs #363` 採用、`Closes #363` 不採用
- [ ] 本ファイルに PR URL / 代表 commit SHA / CI 結果記録

## 記録欄（PR 作成後に追記）

| 項目 | 値 |
| --- | --- |
| PR URL | TBD |
| 代表 commit SHA | TBD |
| mergeable | TBD |
| CI gate `d1-migration-verify` | TBD |
| bats `test:scripts` | TBD |
| redaction-check | TBD |

## ゲート遵守

| ゲート | 状態 |
| --- | --- |
| G1 commit | 本 Phase 実行時 |
| G2 PR | 本 Phase で作成 |
| G3 CI gate green | PR 上で自動検証 |
| G4 merge to main | ユーザー承認後 |
| G5 ユーザー承認（production 実 apply） | UT-07B-FU-04 開始条件 |
| G6 実走（`--env production`） | UT-07B-FU-04 |

本 PR のマージは G4 まで。G5〜G6 は別タスク。
