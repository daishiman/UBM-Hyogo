# Phase 13: PR 作成

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

> 本 Phase は CLAUDE.md「PR 作成の完全自律フロー」に準拠するが、commit / push / PR 作成はユーザー明示承認後のみ実行する。base ブランチは **`dev`**（既定）。

## 1. 事前条件

| # | 条件 | 確認 |
|---|------|------|
| 1 | Phase 11 PASS（7 evidence + 7 観点 PASS） | `outputs/phase-11/main.md` |
| 2 | Phase 12 PASS（7 outputs + 8 点 compliance + dirty-code gate） | `outputs/phase-12/main.md` |
| 3 | `git status --porcelain` が想定差分のみ | spec 1 ファイル + workflow docs |
| 4 | 作業ブランチが `dev` 直上に整合 | `git fetch origin dev && git merge origin/dev`（コンフリクトなしを期待） |
| 5 | ユーザーが commit / push / PR 作成を明示承認済み | 承認文を `outputs/phase-13/user-approval.txt` に記録 |

## 2. 作業ブランチ命名

差分の主題が **新規 E2E spec 追加** のため:

```
feat/admin-member-delete-e2e-spec
```

> 既に作業中ブランチがある場合は再利用。ブランチが `dev` 直上の場合のみ新規作成。

## 3. 品質検証コマンド（PR 作成前）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

すべて exit 0 を確認。失敗時は最大 3 回まで自動修復し、修復差分を別コミットで作成。

## 4. PR 本文テンプレート

```markdown
## Summary
- `apps/web/playwright/tests/admin-member-delete.spec.ts` を新規追加し、admin member delete の二段確認・reason 必須・audit 連動・3 ロール認可を E2E でカバー
- skip は cascade preview の 1 件のみ（CONST_007 例外条件 1, 2 同時該当・Stage 3 持越し）
- API / fixture / D1 schema は変更なし（参照のみ）

## Phase 12 outputs
- `docs/30-workflows/admin-member-delete-e2e-spec/outputs/phase-12/`（7 ファイル）

## Test plan
- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-member-delete.spec.ts --project=desktop-chromium`（5 pass + 1 skip）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e`（全体回帰、既存 spec への regress なし）
- [ ] grep gate: `page.route(` ≥ 1 / `fetch(` = 0 / `test.skip` = 1 / `test.fixme` = 0
- [ ] dirty-code gate: spec + `server-fetch.ts` fixture gate + `playwright.config.ts` evidence dir + workflow docs のみ

```

## 5. 作成コマンド

```bash
gh pr create --base dev --title "feat: admin-member-delete E2E spec を追加" --body "$(cat <<'EOF'
（§4 の本文）
EOF
)"
```

実行禁止: 上記 `gh pr create` はユーザー承認があるまで実行しない。

## 6. PR 作成後

| # | アクション | 備考 |
|---|----------|------|
| 1 | PR URL を記録 | `outputs/phase-13/pr-url.txt` |
| 2 | CI 結果を観測 | typecheck / lint / e2e gate / verify-design-tokens / verify-indexes |
| 3 | CI fail 時は **同一 PR に追加 commit** で対応 | 別 PR 化禁止（CONST_007・先送り禁止原則） |
| 4 | merge 後の cascade preview 復活 task は Stage 3 で扱う | unassigned-task-detection.md に記録済 |

## 7. 禁止事項

- `--no-verify` の使用（lefthook hook を skip しない）
- `git push --force` を `dev` / `main` に対して実行
- main 直接 PR（base は必ず `dev`）
- 大規模差分の分割 PR 化（CONST_007 違反）
