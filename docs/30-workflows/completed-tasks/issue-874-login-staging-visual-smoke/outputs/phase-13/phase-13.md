**[実装区分: 実装仕様書 / 状態: pending_user_approval]**

# Phase 13: PR 作成 (user-gated)

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `pending_user_approval` |
| Gate | Gate-C (external_ops) |
| 入力 | Phase 1-12 完了 + Phase 11 evidence (staging 7 PNG + 各 log) |

## 1. 前提条件（PR 作成前に満たすべき）

- Phase 9 #1-9 のローカル品質保証コマンドが全 PASS
- Phase 11 §3-1〜§3-5 を user 承認後に実行済み、staging-screenshots/ に 7 PNG + 各 log が `present`
- Phase 12 strict 7 のうち本 task で配置した 2 件 (`phase-12.md` / `phase12-task-spec-compliance-check.md`) に加え、実装完了時に残り 5 件を同 wave で追加済み
- `git status --porcelain` が空、`git diff origin/dev...HEAD --name-only` が想定 diff のみ
- `bash scripts/verify-pr-ready.sh` exit 0

## 2. PR 作成手順

```bash
# (1) ローカル同期
git fetch origin dev
git checkout dev && git pull --ff-only origin dev
git checkout <feature-branch>
git merge dev   # コンフリクトは CLAUDE.md「sync-merge コンフリクト解消の3層予防」に従う

# (2) 品質保証
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh

# (3) commit (user 明示承認後)
git add apps/web/playwright/tests/login-smoke.spec.ts \
        scripts/run-login-staging-smoke.sh \
        docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/ \
        docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-003-staging-visual-smoke.md \
        docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md \
        docs/30-workflows/LOGS.md \
        .claude/skills/aiworkflow-requirements/indexes/

git commit -m "$(cat <<'EOF'
feat(login-staging-smoke): EVIDENCE_DIR env-override + run-login-staging-smoke.sh + staging visual evidence (#874)

- apps/web/playwright/tests/login-smoke.spec.ts: EVIDENCE_DIR を PLAYWRIGHT_EVIDENCE_DIR で env-override 可能化 (local 既定値は従来通り)
- scripts/run-login-staging-smoke.sh: staging visual smoke 実行ヘルパー新規追加 (shellcheck clean / mise exec -- 経由)
- docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots/: staging 7 PNG (login-{input,sent,unregistered,rules-declined,deleted,error,input-mobile}.png) 取得
- 親 workflow consumed trace: unassigned-task spec + completed-tasks/.../unassigned-task-detection.md の FU-LOGIN-003 を consumed by issue-874 に更新

Closes #874

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# (4) push & PR
git push -u origin <feature-branch>

gh pr create --base dev --title "feat(login-staging-smoke): EVIDENCE_DIR env-override + staging visual evidence (#874)" --body "$(cat <<'EOF'
## Summary

- `apps/web/playwright/tests/login-smoke.spec.ts` の `EVIDENCE_DIR` を `PLAYWRIGHT_EVIDENCE_DIR` で env-override 可能化（local 既定値は従来通り）
- `scripts/run-login-staging-smoke.sh` 新規追加（Cloudflare Workers `dev` の staging URL を引数 / env で受け取り、`--project=staging --grep 'renders LoginCard|captures mobile input' --reporter=line` で staging 対象 7 screenshot test を実行 / shellcheck clean）
- staging visual evidence 7 PNG を `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots/` に取得
- 親 workflow `login-page-prototype-alignment` の `unassigned-task-detection.md` と `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-003-staging-visual-smoke.md` の FU-LOGIN-003 を consumed 表記に同期

## Scope

- 含む: spec env-override / shell helper / staging evidence 7 PNG / consumed trace
- 含まない: production 環境への smoke (別 followup) / `playwright.config.ts` 改修 / 他 route の staging visual / 自動 pixel diff threshold

## Test plan

- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `shellcheck scripts/run-login-staging-smoke.sh` 0 finding
- [ ] staging-target grep `login-smoke.spec.ts` 7 passed (env なし) / 親 workflow path に対象 7 PNG 再生成
- [ ] staging smoke 7 passed / `outputs/phase-11/staging-screenshots/` に 7 PNG (各 ≤ 500KB)
- [ ] local baseline と staging evidence の目視 diff で構造的回帰なし
- [ ] `bash scripts/verify-pr-ready.sh` PASS

## Evidence

- staging smoke log: `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-smoke.log`
- staging deploy log: `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/evidence/staging-deploy.log`
- visual diff note: `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/evidence/visual-diff-note.md`
- 7 PNG: `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots/login-*.png`

Closes #874

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 3. PR 作成後の確認

- required status check が全 green
- `verify-design-tokens` / `verify-test-suffix` / `verify-indexes-up-to-date` / `verify-gate-metadata` / `verify-phase12-compliance` が green
- reviewer (solo dev = self-review) が AC-1〜AC-7 を verdict 表で確認

## 4. ロールバック手順

| 症状 | 手段 |
|---|---|
| staging deploy が壊れた | `bash scripts/cf.sh rollback <PRIOR_VERSION_ID> --config apps/web/wrangler.toml --env staging` |
| PR コミットの取り消し | `git revert <commit-sha>` で revert PR を起こす |
| 7 PNG の破棄 | `rm -f docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots/*.png` → 再取得 |

## 5. Phase 13 完了条件

- [ ] PR URL を取得
- [ ] 採用 base branch = `dev`
- [ ] required status check 全 green
- [ ] AC-1〜AC-7 を verdict 表で最終確認
- [ ] issue #874 の close 動作（PR merge 後 `Closes #874` で自動 close）

## 6. 次 Phase への引き継ぎ

PR merge 後、本 workflow ディレクトリを `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/` に移動し、全 live ref を同 wave で書き換える別 task (cleanup) を起こす。
