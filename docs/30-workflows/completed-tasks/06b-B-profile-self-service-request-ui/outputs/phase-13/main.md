# Phase 13 outputs main — 06b-B-profile-self-service-request-ui

## 集約サマリー（PR 作成手順書）

本 Phase は「実装・実測完了後、user 明示承認を経て PR を作成する」手順を定義する。仕様書作成タスク（本 worktree）では PR 作成を実行しない。実装 worktree で本仕様に従って `/ai:diff-to-pr` を起動する。

## 三役ゲート

1. **user 承認ゲート**: `change-summary.md` を提示し、user の明示文言で承認取得
2. **ローカル品質検証ゲート**: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `pnpm test` 全 PASS
3. **push / PR 作成ゲート**: commit → push → `gh pr create`

## ブランチ戦略

| 項目 | 値 |
| --- | --- |
| ブランチ命名 | `feat/06b-B-profile-self-service-request-ui` |
| 派生元 | `dev`（最新を取り込み済み） |
| merge target | `dev`（staging 検証後 `main` へ） |
| solo dev policy | `required_pull_request_reviews=null`（branch protection 未変更） |

## PR title

```
feat(profile): add visibility & delete self-service request UI
```

## PR body 構成

`.github/pull_request_template.md` 準拠 + Phase 12 implementation-guide.md 反映。

### Summary（3 点以内）

- `/profile` に公開停止/再公開申請と退会申請の UI を追加
- `apps/web/src/lib/api/me-requests.ts` を新設し `POST /me/visibility-request` / `POST /me/delete-request` を呼び出す
- 二重申請 409 をユーザー文言で可視化、本文編集 UI は追加しない（不変条件 #4 を構造で担保）

### Changes（ファイルカテゴリ別）

- apps/web (UI): `app/profile/_components/{RequestActionPanel,VisibilityRequestDialog,DeleteRequestDialog,RequestPendingBanner,RequestErrorMessage}.tsx`、`app/profile/page.tsx`
- apps/web (lib): `src/lib/api/me-requests.ts`、`src/lib/api/me-requests.types.ts`
- docs: `specs/05-pages.md`、`specs/07-edit-delete.md`、`specs/09-ui-ux.md`

### Test plan（チェックボックス）

- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm test`（unit / integration） PASS
- [ ] Playwright E2E S1（visibility hide）/ S2（visibility public）/ S3（delete）/ S4（duplicate 409） PASS
- [ ] 手動: dialog focus trap / esc close / role=dialog
- [ ] 手動: 401 時 `/login?redirect=/profile` に遷移

### Screenshots（Phase 11）

`outputs/phase-11/screenshots/` の以下 5 PNG を `raw.githubusercontent.com/<repo>/<commit>/<path>` 絶対 URL で挿入（`/ai:diff-to-pr` Phase 5.6 が自動投稿）。

- TC-01-request-panel-default-public-light.png
- TC-02-request-panel-default-hidden-light.png
- TC-03-visibility-dialog-open-light.png
- TC-04-delete-dialog-open-light.png
- TC-06-duplicate-409-light.png

### Invariants checked

- #4 profile body edit forbidden — dialog input が `desiredState` / `reason` のみ
- #5 apps/web D1 direct access forbidden — `cloudflare:d1` import 0 件
- #11 member self-service boundary — URL を `/me/visibility-request` / `/me/delete-request` に固定

### Related

- Depends on: 06b-A-me-api-authjs-session-resolver
- Blocks: 06b-C-profile-logged-in-visual-evidence

## gh pr create コマンド例（HEREDOC）

```bash
gh pr create \
  --title "feat(profile): add visibility & delete self-service request UI" \
  --base dev \
  --head feat/06b-B-profile-self-service-request-ui \
  --body "$(cat <<'EOF'
## Summary
- /profile に公開停止/再公開申請と退会申請の UI を追加
- POST /me/visibility-request / POST /me/delete-request の client helper を新設
- 二重申請 409 をユーザーに可視化（本文編集 UI は追加しない）

## Test plan
- [ ] pnpm typecheck PASS
- [ ] pnpm lint PASS
- [ ] pnpm test PASS
- [ ] Playwright S1/S2/S3/S4 PASS

## Invariants
- #4 / #5 / #11 維持

## Related
- Depends: 06b-A-me-api-authjs-session-resolver
- Blocks: 06b-C-profile-logged-in-visual-evidence

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## pre-PR チェック

- [ ] `git status --porcelain` が空
- [ ] `git diff main...HEAD --name-only` が PR 包含ファイル一覧として取得できる
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test` 全 PASS
- [ ] `outputs/phase-11/screenshots/` に必須 5 PNG が存在
- [ ] `outputs/phase-12/implementation-guide.md` に Part 1 / Part 2 が存在
- [ ] solo dev branch protection（`required_pull_request_reviews=null`）を変更していない
- [ ] CI gate（`required_status_checks`）通過

## approval gate（明示）

- **本仕様書作成タスクでは PR 作成を実行しない**。
- 実装 worktree で本仕様に従って `/ai:diff-to-pr` を起動し、user 明示承認を得たうえで実行する。
- user 明示承認の文言例: 「PR を作成して」「diff-to-pr で出して」など。曖昧な合意は不可。

## タスク完了処理

この workflow root はすでに `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/` に配置済み。Phase 13 で追加の root move は実行しない。PR 作成・CI PASS 後は、ユーザー明示承認がある場合に限り通常の commit / push / PR 手順だけを実行する。

## 成果物

| 成果物 | パス |
| --- | --- |
| ローカル検証ログ | `outputs/phase-13/local-check-result.md` |
| 変更サマリー | `outputs/phase-13/change-summary.md` |
| PR 作成ログ | `outputs/phase-13/pr-creation-result.md` |
| PR 情報 | `outputs/phase-13/pr-info.md` |

## status

IMPLEMENTED_LOCAL_WITH_DEFERRED_RUNTIME_VISUAL_EVIDENCE — 実装はローカル完了。PR 作成、push、deploy、runtime screenshot / unskipped E2E はユーザー明示承認後の後続 gate。
