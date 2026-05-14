# Phase 13: PR 作成

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-10-FOLLOWUP-001 |
| Phase | 13 |
| 状態 | pending_user_approval |
| 実行タイミング | Phase 11 evidence 取得後、ユーザー承認後 |

## 目的

修正をレビュー可能な PR として `dev` ブランチへ提出する。CLAUDE.md「PR作成の完全自律フロー」に従い、Claude Code は確認質問なしで遂行する（ただしユーザー approval は必要）。

## 前提条件

- Phase 5 実装完了
- Phase 9 品質ゲート PASS
- Phase 11 evidence 取得済み
- Phase 12 ドキュメント更新済み
- ユーザーが PR 作成を明示的に指示している

## ブランチ運用

- PR base: `dev`（CLAUDE.md「既定の PR base ブランチは dev」）
- 作業ブランチ: `feat/task-10-followup-001-opennext-esbuild-mismatch`（未作成なら自律作成）
- main 直接 push 禁止

## PR 本文構成

`outputs/phase-13/main.md` に最終 PR 本文を保管し、`gh pr create --base dev` で発行。

### タイトル

```
fix(build): pin esbuild via pnpm.overrides to recover build:cloudflare
```

### Summary

- workspace 全体の esbuild を `0.25.4`（`@opennextjs/aws` 同梱版）に pin
- `Host version "0.25.4" does not match binary version "0.21.5"` を解消し `apps/web` の `build:cloudflare` を回復
- task-10 / task-11..17 の visual evidence ブロックを解除

### 変更内容

- `package.json`: `pnpm.overrides.esbuild = "0.25.4"` 追加
- `pnpm-lock.yaml`: 自動再生成
- `scripts/cf.sh`: OpenNext esbuild mismatch recovery note 追加（fallback 実装は不要と判定）
- `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/outputs/phase-11/evidence/`: build / dependency / root typecheck / root lint / wrapper smoke evidence
- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-10-followup-001-opennext-esbuild-mismatch-2026-05.md`: lesson 追加
- `.claude/skills/aiworkflow-requirements/{changelog,LOGS,indexes,references/task-workflow-active.md}`: same-wave sync
- `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/`: 仕様書一式（本ディレクトリ）
- `docs/30-workflows/unassigned-task/task-10-followup-001-opennext-esbuild-mismatch.md`: supersede 追記

### Test plan

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` exit 0（Phase 11 evidence 取得後に `[x]` へ更新）
- [ ] `mise exec -- pnpm why esbuild` + platform binary scan で mismatch pair 0 件（Phase 11 evidence 取得後に `[x]` へ更新）
- [x] `mise exec -- pnpm typecheck` green
- [x] `mise exec -- pnpm lint` green
- [x] task-10 focused runtime Playwright evidence captured
- [ ] `mise exec -- pnpm skill:logs:render` 成功（任意の tsx 追加 smoke。未実行）
- [ ] `pnpm-lock.yaml` 差分が esbuild 関連のみ（Phase 11 evidence 取得後に `[x]` へ更新）
- [ ] CI 上で `verify-indexes-up-to-date` を含む既存 gate が全て green

### 関連

- Refs https://github.com/daishiman/UBM-Hyogo/issues/609 (CLOSED — issue 状態は維持。本 PR は task-10 downstream blocker の局所解消)
- 親 task: `docs/30-workflows/task-10-ui-primitives-spec/`
- 下流 task: `docs/30-workflows/unassigned-task/task-10-followup-002-runtime-visual-axe-evidence.md`

## PR 作成手順（CLAUDE.md「PR作成の完全自律フロー」準拠）

```bash
# 1. dev 同期
git fetch origin dev
git checkout dev && git pull --ff-only origin dev

# 2. 作業ブランチ準備
git checkout -b feat/task-10-followup-001-opennext-esbuild-mismatch

# 3. dev マージ（コンフリクトはCLAUDE.md ポリシーに従って自律解消）
git merge dev

# 4. 品質検証 3 コマンド
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 5. 残差分コミット
git status --porcelain
git add -A
git commit -m "$(cat <<'EOF'
fix(build): pin esbuild via pnpm.overrides to recover build:cloudflare

Add `pnpm.overrides.esbuild = "0.25.4"` to unify esbuild host and
@esbuild/<platform> binary across the workspace. This resolves the
"Host version 0.25.4 does not match binary version 0.21.5" failure in
`opennextjs-cloudflare build` triggered from @opennextjs/aws.

Refs #609

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 6. push & PR
git push -u origin feat/task-10-followup-001-opennext-esbuild-mismatch

gh pr create --base dev --title "fix(build): pin esbuild via pnpm.overrides to recover build:cloudflare" \
  --body "$(cat outputs/phase-13/main.md)"
```

## PR 作成前チェック（CLAUDE.md 準拠）

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` で PR 対象ファイルが正しい
- [ ] `outputs/phase-12/implementation-guide.md` の主要見出しが PR 本文に反映されている
- [ ] `outputs/phase-11/evidence/` の logs が揃っている（PR 本文では参照のみ・添付不要）
- [ ] スクリーンショットセクションは本 PR では作成しない（NON_VISUAL）

## 完了条件

- [ ] PR が `dev` を base に作成されている
- [ ] PR タイトルが規約に従っている
- [ ] Test plan の checkbox が反映されている
- [ ] 関連 issue / task へのリンクが含まれている
- [ ] CI 全 gate が green

## 成果物

- PR URL
- `outputs/phase-13/main.md`

## 実行タスク

- Phase 11 / Phase 12 evidence を反映した PR 本文を作成する
- `Refs #609` のみを使い、closed Issue を reopen / close しない
- ユーザー承認後に commit / push / PR 作成を実行する

## 参照資料

- CLAUDE.md「PR作成の完全自律フロー」
- Phase 12 `implementation-guide.md`
- Phase 11 evidence
