# Phase 13: PR 作成

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 13 |
| task | task-05-error-boundary-and-staging-smoke |
| state | implemented-local / implementation / runtime evidence pending_user_approval |

## 目的

この Phase で task-05 の実装仕様、検証条件、または close-out 条件を固定する。

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-13/main.md`

## 前提

- Phase 11 evidence 一式が揃っている（runtime 未取得時は `IMPLEMENTED_LOCAL_RUNTIME_PENDING` 明記）
- Phase 12 の strict 7 必須出力ファイルが揃っている
- ユーザーから明示の PR 作成許可を得ている（task-specification-creator skill 重要ルール）

## G1-G4 multi-stage approval gate（NON_VISUAL 規約準拠）

| gate | 内容 | 承認必要 |
| --- | --- | --- |
| G1 | runtime deploy（staging）— `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` | yes |
| G2 | Forms / D1 系の同期（本 task では該当なし、no-op で記録） | no-op |
| G3 | smoke 実行 + Sentry 検証 | yes |
| G4 | commit + push + PR 作成 | yes |

合算承認禁止。各 gate 個別に user 承認を得る。

## PR 作成手順（既定 base = `dev`）

1. `git fetch origin dev`
2. ローカル `dev` を `origin/dev` に fast-forward
3. 作業ブランチに `dev` をマージ。コンフリクトは CLAUDE.md §コンフリクト解消の既定方針に従う
4. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / focused unit / build / staging smoke を、Phase 11 evidence 方針に従って実行する。未実行項目は PR body で `[x]` にしない
5. `git status --porcelain` を空にする（全ファイル add）
6. `git diff dev...HEAD --name-only` を取得し、Phase 10 §Diff scope 規律と一致するか確認
7. `gh pr create --base dev --title "<title>" --body "$(cat <<'EOF' ... EOF)"` で PR 作成

### PR title 案

```
feat(web): app router error boundaries + 19 routes staging smoke (task-05)
```

### PR body テンプレ

```markdown
## Summary
- App Router の `error.tsx` / `global-error.tsx` / `not-found.tsx` / `loading.tsx` を新設
- 19 routes を Cloudflare staging で smoke する Playwright spec を追加
- Sentry capture は `@/lib/logger`（task-04）経由に統一

## Test plan
- [ ] `pnpm typecheck` / `pnpm lint`
- [ ] `pnpm --filter @ubm-hyogo/web test app/__tests__/error.test.tsx`
- [ ] `pnpm --filter @ubm-hyogo/web build`
- [ ] `ENABLE_STAGING_SMOKE_FIXTURE=1 pnpm --filter @ubm-hyogo/web exec playwright test tests/e2e/staging-smoke.spec.ts --project=staging-smoke`（staging deploy 後）
- [ ] Sentry dashboard で browser boundary event と server test event を目視確認

## Evidence
- `docs/30-workflows/task-05-error-boundary-and-staging-smoke/outputs/phase-11/evidence/`

## Refs
- 一次原典: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md
- 仕様書: docs/30-workflows/task-05-error-boundary-and-staging-smoke/

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## completed-tasks 移動

PR merge 後（次サイクル）、本 spec dir を `docs/30-workflows/completed-tasks/task-05-error-boundary-and-staging-smoke/` に `git mv` で移動する。`git rm -r` 純削除は禁止（completed-tasks-policy）。

## 完了条件

- [ ] PR URL が報告されている
- [ ] 採用ブランチ / 自動修復内容 / 解消したコンフリクト / 残課題が最終レポートに 1 回だけ記載
- [ ] ユーザー承認なく commit / push / PR 作成を行っていない
